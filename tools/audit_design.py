#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
audit_design.py —— 本站排版/UI 标准的自动化审计器。

它把 DESIGN.md 里的条款变成可执行的断言：直接驱动本机无头 Chrome（CDP, 端口 9411），
在页面里注入测量代码，然后逐条判定 PASS / FAIL 并打印实测值。

用法:
    python tools/audit_design.py http://127.0.0.1:8211/
    python tools/audit_design.py http://127.0.0.1:8211/ --light
    python tools/audit_design.py http://127.0.0.1:8211/ --width 375
    python tools/audit_design.py URL --json out.json

退出码: 0 = 全部通过; 1 = 有 FAIL; 2 = 环境错误（Chrome 调试端口不可用）。
"""
import base64, json, os, socket, struct, sys, time, urllib.request

PORT = int(os.environ.get("CDP_PORT", "9411"))
HERE = os.path.dirname(os.path.abspath(__file__))
EXPR_FILE = os.path.join(HERE, "audit_expr.js")


def _ws_connect(url):
    rest = url.split("://", 1)[1]
    hostport, path = rest.split("/", 1)
    host, port = hostport.split(":")
    s = socket.create_connection((host, int(port)), timeout=30)
    key = base64.b64encode(os.urandom(16)).decode()
    s.sendall(("GET /%s HTTP/1.1\r\nHost: %s\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
               "Sec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n" % (path, hostport, key)).encode())
    buf = b""
    while b"\r\n\r\n" not in buf:
        c = s.recv(4096)
        if not c:
            raise IOError("websocket handshake closed")
        buf += c
    return s, buf.split(b"\r\n\r\n", 1)[1]


class WS:
    def __init__(self, url):
        self.s, self.rest = _ws_connect(url)
        self._id = 0

    def send(self, obj):
        d = json.dumps(obj).encode()
        h = bytearray([0x81]); n = len(d)
        if n < 126: h.append(0x80 | n)
        elif n < 65536: h.append(0x80 | 126); h += struct.pack(">H", n)
        else: h.append(0x80 | 127); h += struct.pack(">Q", n)
        m = os.urandom(4); h += m
        self.s.sendall(bytes(h) + bytes(b ^ m[i % 4] for i, b in enumerate(d)))

    def _read(self, n):
        while len(self.rest) < n:
            c = self.s.recv(1 << 20)
            if not c: raise EOFError
            self.rest += c
        out, self.rest = self.rest[:n], self.rest[n:]
        return out

    def recv(self):
        b0, b1 = self._read(2)
        ln = b1 & 0x7F
        if ln == 126: ln = struct.unpack(">H", self._read(2))[0]
        elif ln == 127: ln = struct.unpack(">Q", self._read(8))[0]
        return json.loads(self._read(ln).decode())

    def call(self, method, params=None, session=None, timeout=90):
        self._id += 1
        msg = {"id": self._id, "method": method, "params": params or {}}
        if session: msg["sessionId"] = session
        self.send(msg)
        end = time.time() + timeout
        while time.time() < end:
            r = self.recv()
            if r.get("id") == self._id: return r
        raise TimeoutError(method)


def measure(url, light=False, width=1280, height=900):
    try:
        ver = json.loads(urllib.request.urlopen("http://127.0.0.1:%d/json/version" % PORT, timeout=8).read().decode())
    except Exception as e:
        raise SystemExit("CDP 端口 %d 不可用（Chrome 需要以 --remote-debugging-port=%d 启动）: %s" % (PORT, PORT, e))
    ws = WS(ver["webSocketDebuggerUrl"])
    expr = open(EXPR_FILE, encoding="utf-8").read()
    t = ws.call("Target.createTarget", {"url": "about:blank"})["result"]["targetId"]
    sess = ws.call("Target.attachToTarget", {"targetId": t, "flatten": True})["result"]["sessionId"]
    # 把被测标签页切到前台：Chrome 的 :focus-visible 需要文档自身持有焦点，
    # 后台标签页里探针的 probe.focus() 不会点亮焦点环，会让"焦点外观"误报 FAIL
    # （DESIGN.md 第 8 节复现提醒里记的就是这一条）。这里由工具自己保证前台。
    ws.call("Target.activateTarget", {"targetId": t})
    ws.call("Emulation.setFocusEmulationEnabled", {"enabled": True}, sess)
    ws.call("Page.enable", {}, sess)
    ws.call("Emulation.setDeviceMetricsOverride",
            {"width": width, "height": height, "deviceScaleFactor": 1, "mobile": width < 500}, sess)
    if light:
        ws.call("Emulation.setEmulatedMedia",
                {"features": [{"name": "prefers-color-scheme", "value": "light"}]}, sess)
    ws.call("Page.navigate", {"url": url}, sess)
    time.sleep(6)
    if light:
        ws.call("Runtime.evaluate", {"expression":
            "try{document.documentElement.dataset.theme='light';localStorage.setItem('scf:theme','light')}catch(e){}"}, sess)
        time.sleep(1.2)
    r = ws.call("Runtime.evaluate", {"expression": expr, "returnByValue": True}, sess)
    ws.call("Target.closeTarget", {"targetId": t})
    v = r["result"]["result"].get("value")
    if not v:
        raise SystemExit("测量失败: %s" % json.dumps(r["result"].get("exceptionDetails"))[:400])
    return json.loads(v)


AA = 4.5
TYPE_SCALE = {12, 13, 14, 16, 18, 20, 24, 30, 36, 44}


def judge(d, max_cjk=40):
    """返回 (rows, fails, warns)。每条 = (级别, 条款, 实测, 说明)"""
    rows, fails, warns = [], [], []

    def add(level, rule, actual, note=""):
        rows.append((level, rule, actual, note))
        if level == "FAIL": fails.append(rule)
        elif level == "WARN": warns.append(rule)

    # 1 对比度
    for k, v in d["samples"].items():
        if not v: continue
        need = AA
        if v["contrast"] >= 5.0: add("PASS", "对比度 %s" % k, "%.2f:1" % v["contrast"])
        elif v["contrast"] >= need: add("WARN", "对比度 %s" % k, "%.2f:1" % v["contrast"], "过线但余量 <0.5")
        else: add("FAIL", "对比度 %s" % k, "%.2f:1" % v["contrast"], "低于 AA %.1f:1" % need)

    # 2 行高
    for k in ("body_p", "li", "quote"):
        v = d["samples"].get(k)
        if not v: continue
        if v["lhRatio"] >= 1.7: add("PASS", "行高 %s" % k, str(v["lhRatio"]))
        elif v["lhRatio"] >= 1.5: add("WARN", "行高 %s" % k, str(v["lhRatio"]), "中文正文建议 1.7+")
        else: add("FAIL", "行高 %s" % k, str(v["lhRatio"]), "<1.5 违反 WCAG 1.4.12")

    # 3 每行汉字数
    for k in ("body_p", "li", "quote"):
        v = d["samples"].get(k)
        if not v or not v["cjkPerLine"]: continue
        n = v["cjkPerLine"]
        if n <= max_cjk: add("PASS", "行长 %s" % k, "%d 字/行" % n)
        else: add("FAIL", "行长 %s" % k, "%d 字/行" % n, "超过 %d 字上限" % max_cjk)

    # 4 字号档位
    off = [s for s in d["fontSizes"] if s not in TYPE_SCALE]
    if not off: add("PASS", "字号档位", "%d 种，全在模数字阶内" % len(d["fontSizes"]))
    else: add("FAIL", "字号档位", "%d 种，%d 种越界" % (len(d["fontSizes"]), len(off)), "越界: %s" % off[:10])

    # 5 间距网格
    if not d["offGrid"]: add("PASS", "间距 4px 网格", "%d 个值全部对齐" % len(d["spacing"]))
    else: add("FAIL", "间距 4px 网格", "%d 个越界" % len(d["offGrid"]), "越界: %s" % d["offGrid"][:10])

    # 6 触达
    n = d["smallTargetsNotInline"]
    if n == 0: add("PASS", "触达 24x24", "0 个非内联小目标")
    else: add("FAIL", "触达 24x24", "%d 个非内联目标 <24px" % n,
              "; ".join("%s(%dx%d)" % (t["text"][:12], t["w"], t["h"]) for t in d["smallTargets"] if not t["inSentence"])[:160])

    # 7 横向溢出
    add("PASS" if d["overflowX"] <= 0 else "FAIL", "横向溢出", "%d px" % d["overflowX"])

    # 8 标题
    add("PASS" if d["headings"]["h1Count"] == 1 else "FAIL", "h1 唯一", str(d["headings"]["h1Count"]))
    add("PASS" if d["headings"]["skips"] == 0 else "FAIL", "标题不跳级", "%d 处跳级" % d["headings"]["skips"])

    # 9 焦点
    f = d.get("focus") or {}
    ok = f.get("outlineStyle") not in (None, "none") and float(f.get("outlineWidth", "0px").replace("px", "") or 0) >= 2
    add("PASS" if ok else "FAIL", "焦点外观", "%s %s" % (f.get("outlineStyle"), f.get("outlineWidth")))

    # 10 图片 alt / lang
    add("PASS" if d["imgNoAlt"] == 0 else "FAIL", "图片 alt", "%d 张缺失" % d["imgNoAlt"])
    add("PASS" if (d.get("lang") or "").lower().startswith("zh") else "FAIL", "页面 lang", str(d.get("lang")))

    # 11 中文标点与换行
    c = d["cjk"]
    add("PASS" if c["textAlign"] in ("start", "left") else "WARN", "中文对齐", c["textAlign"])
    add("PASS" if c.get("textSpacingTrim") not in ("(unsupported)", "normal") else "WARN",
        "标点挤压 text-spacing-trim", str(c.get("textSpacingTrim")))
    return rows, fails, warns


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    url = args[0] if args else "http://127.0.0.1:8211/"
    light = "--light" in sys.argv
    width = 1280
    if "--width" in sys.argv:
        width = int(sys.argv[sys.argv.index("--width") + 1])
    d = measure(url, light=light, width=width)
    rows, fails, warns = judge(d)
    print("=" * 68)
    print("设计标准审计  %s  [%s / %dpx]" % (url, d.get("theme"), width))
    print("=" * 68)
    for level, rule, actual, note in rows:
        mark = {"PASS": "  ok ", "WARN": " warn", "FAIL": " FAIL"}[level]
        print("%s  %-26s %-22s %s" % (mark, rule, actual, note))
    print("-" * 68)
    print("FAIL %d / WARN %d / 共 %d 项" % (len(fails), len(warns), len(rows)))
    if fails:
        print("未通过：" + "、".join(fails))
    if "--json" in sys.argv:
        p = sys.argv[sys.argv.index("--json") + 1]
        json.dump(d, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print("原始数据 -> " + p)
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
