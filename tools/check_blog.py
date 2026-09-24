#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SupermanCantFly · 静态站点自检工具

用法：
    python tools/check_blog.py

检查项：
  1. 每个 HTML 文件能否以 UTF-8 解码，是否声明了 <meta charset="UTF-8"> 与 lang="zh-CN"
  2. HTML 标签是否正确闭合（忽略 void 元素与 SVG 自闭合标签）
  3. 同一页面内是否存在重复的 id
  4. 所有相对 href / src 指向的文件是否真实存在
  5. 所有页内锚点 (#fragment) 是否有对应的 id
  6. 是否存在指向外部的「资源」引用（本站要求零外部依赖）：
       - 允许 <a href="https://…"> 这种普通超链接（外链不是依赖）
       - 禁止 src / <link href> / <script src> / 字体 / 图片等外部资源
  7. 每个页面是否都带有完整的五个主导航入口（首页 / 项目 / 归档 / 标签 / 关于）
  8. XML 文件（feed.xml / sitemap.xml）是否为合法 XML，RSS/站点地图结构是否完整，
     且其中的绝对链接能否对应到磁盘上真实存在的文件（死链检查）

退出码：0 表示全部通过，1 表示发现问题。
"""

import os
import sys

# Windows 控制台默认使用 GBK，中文与符号会乱码，这里强制切到 UTF-8
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass

from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

VOID_ELEMENTS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}

SKIP_SCHEMES = ("mailto:", "tel:", "data:", "javascript:")

EXTERNAL_SCHEMES = ("http://", "https://", "//")

# <a href="https://…"> 属于正常外链，不算外部依赖；其余标签一律禁止外链资源
LINK_TAGS = {"a"}

# 五个主导航入口：每个页面都必须能点到
REQUIRED_NAV = {
    "index.html", "projects.html", "archive.html", "tags.html", "about.html",
}

html_files = []
xml_files = []

for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in (".git", "node_modules")]
    for name in sorted(filenames):
        full = os.path.join(dirpath, name)
        if name.lower().endswith((".html", ".htm")):
            html_files.append(full)
        elif name.lower().endswith(".xml"):
            xml_files.append(full)

html_files.sort()
xml_files.sort()

errors = []
warnings = []


class TagChecker(HTMLParser):
    def __init__(self):
        HTMLParser.__init__(self, convert_charrefs=True)
        self.stack = []
        self.errors = []
        self.ids = {}
        self.duplicate_ids = []
        self.refs = []
        self.inline_scripts = 0

    def _record_attrs(self, tag, attrs):
        data = dict(attrs)
        if "id" in data:
            value = data["id"]
            if value in self.ids:
                self.duplicate_ids.append(value)
            else:
                self.ids[value] = self.getpos()[0]
        for attr in ("href", "src"):
            if data.get(attr):
                self.refs.append((tag, attr, data[attr], self.getpos()[0]))

    def handle_starttag(self, tag, attrs):
        self._record_attrs(tag, attrs)
        if tag not in VOID_ELEMENTS:
            self.stack.append((tag, self.getpos()[0]))

    def handle_startendtag(self, tag, attrs):
        self._record_attrs(tag, attrs)

    def handle_endtag(self, tag):
        if tag in VOID_ELEMENTS:
            return
        if not self.stack:
            self.errors.append("第 %d 行：多余的结束标签 </%s>" % (self.getpos()[0], tag))
            return
        if self.stack[-1][0] == tag:
            self.stack.pop()
            return
        names = [t for t, _ in self.stack]
        if tag in names:
            index = len(names) - 1 - names[::-1].index(tag)
            for open_tag, line in self.stack[index + 1:]:
                self.errors.append(
                    "第 %d 行：标签 <%s> 未闭合（遇到 </%s>）" % (line, open_tag, tag))
            del self.stack[index:]
        else:
            self.errors.append("第 %d 行：意外的结束标签 </%s>" % (self.getpos()[0], tag))

    def close(self):
        HTMLParser.close(self)
        for tag, line in self.stack:
            self.errors.append("第 %d 行：标签 <%s> 从未闭合" % (line, tag))


parsed = {}

for path in html_files:
    rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
    try:
        with open(path, "r", encoding="utf-8") as handle:
            text = handle.read()
    except UnicodeDecodeError as exc:
        errors.append("%s：不是合法的 UTF-8 文件（%s）" % (rel, exc))
        continue

    if text.startswith("\ufeff"):
        warnings.append("%s：文件带有 UTF-8 BOM，建议去掉" % rel)

    parser = TagChecker()
    parser.feed(text)
    parser.close()

    for message in parser.errors:
        errors.append("%s：%s" % (rel, message))
    for value in parser.duplicate_ids:
        errors.append("%s：重复的 id=\"%s\"" % (rel, value))

    lowered = text.lower()
    if "<meta charset=\"utf-8\">" not in lowered:
        errors.append("%s：缺少 <meta charset=\"UTF-8\">" % rel)
    if 'lang="zh-cn"' not in lowered:
        errors.append("%s：<html> 缺少 lang=\"zh-CN\"" % rel)

    parsed[path] = parser

# 第二遍：解析跨文件锚点与外部资源
for path, parser in parsed.items():
    rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
    folder = os.path.dirname(path)

    for tag, attr, value, line in parser.refs:
        raw = value.strip()
        if not raw:
            continue
        if raw.lower().startswith(EXTERNAL_SCHEMES):
            if attr == "href" and tag in LINK_TAGS:
                continue
            errors.append("%s 第 %d 行：%s=\"%s\" 指向外部资源（本站要求零外部依赖）"
                          % (rel, line, attr, raw))
            continue
        if raw.lower().startswith(SKIP_SCHEMES):
            continue

        split = urlsplit(raw)
        target = unquote(split.path)
        fragment = split.fragment

        if target:
            resolved = os.path.normpath(os.path.join(folder, target))
            if not os.path.exists(resolved):
                errors.append("%s 第 %d 行：%s=\"%s\" 指向的文件不存在"
                              % (rel, line, attr, raw))
                continue
        else:
            resolved = path

        if fragment and resolved.lower().endswith((".html", ".htm")):
            owner = parsed.get(resolved)
            if owner is not None and fragment not in owner.ids:
                errors.append("%s 第 %d 行：锚点 #%s 在 %s 中不存在"
                              % (rel, line, fragment,
                                 os.path.relpath(resolved, ROOT).replace(os.sep, "/")))

# 第三遍：导航完整性（每个页面都要能点到五个主入口）
for path, parser in parsed.items():
    rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
    targets = set()
    for _tag, attr, value, _line in parser.refs:
        if attr != "href":
            continue
        clean = value.strip().split("#")[0].split("?")[0]
        if not clean:
            continue
        targets.add(os.path.basename(clean))
    missing = sorted(REQUIRED_NAV - targets)
    if missing:
        errors.append("%s：主导航缺少入口 %s" % (rel, "、".join(missing)))


def resolve_site_url(url):
    """把站点绝对地址映射到磁盘文件，返回相对路径；无法映射时返回 None。"""
    split = urlsplit(url.strip())
    if not split.scheme or not split.netloc:
        return None
    path = unquote(split.path).lstrip("/")
    if not path or path.endswith("/"):
        path = path + "index.html"
    return path


# XML 检查
for path in xml_files:
    rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
    try:
        tree = ET.parse(path)
    except ET.ParseError as exc:
        errors.append("%s：XML 解析失败（%s）" % (rel, exc))
        continue
    root = tree.getroot()

    if rel.endswith("feed.xml"):
        if root.tag != "rss":
            errors.append("%s：根元素应为 <rss>，实际为 <%s>" % (rel, root.tag))
        channel = root.find("channel")
        if channel is None:
            errors.append("%s：缺少 <channel>" % rel)
        else:
            for field in ("title", "link", "description", "language"):
                if channel.find(field) is None:
                    errors.append("%s：channel 缺少 <%s>" % (rel, field))
            items = channel.findall("item")
            if not items:
                errors.append("%s：没有任何 <item>" % rel)
            for index, item in enumerate(items, 1):
                for field in ("title", "link", "guid", "pubDate", "description"):
                    if item.find(field) is None:
                        errors.append("%s：第 %d 个 item 缺少 <%s>" % (rel, index, field))
                link = item.find("link")
                if link is not None and link.text:
                    target = resolve_site_url(link.text)
                    if target is None:
                        errors.append("%s：第 %d 个 item 的 <link> 不是站点绝对地址（%s）"
                                      % (rel, index, link.text))
                    elif not os.path.exists(os.path.join(ROOT, target)):
                        errors.append("%s：第 %d 个 item 的 <link> 指向不存在的文件（%s）"
                                      % (rel, index, link.text))
    elif rel.endswith("sitemap.xml"):
        namespace = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
        if root.tag != namespace + "urlset":
            errors.append("%s：根元素应为 urlset（命名空间 %s）" % (rel, namespace))
        urls = root.findall(namespace + "url")
        if not urls:
            errors.append("%s：没有任何 <url> 条目" % rel)
        for index, entry in enumerate(urls, 1):
            loc = entry.find(namespace + "loc")
            if loc is None:
                errors.append("%s：第 %d 个 url 缺少 <loc>" % (rel, index))
                continue
            if not loc.text:
                errors.append("%s：第 %d 个 url 的 <loc> 为空" % (rel, index))
                continue
            target = resolve_site_url(loc.text)
            if target is None:
                errors.append("%s：第 %d 个 <loc> 不是站点绝对地址（%s）" % (rel, index, loc.text))
            elif not os.path.exists(os.path.join(ROOT, target)):
                errors.append("%s：第 %d 个 <loc> 指向不存在的文件（%s）" % (rel, index, loc.text))

# 报告
print("=" * 68)
print("SupermanCantFly · 静态站点自检")
print("=" * 68)
print("站点根目录：%s" % ROOT)
print("扫描到 HTML 文件 %d 个，XML 文件 %d 个" % (len(html_files), len(xml_files)))

checked_refs = sum(len(p.refs) for p in parsed.values())
checked_ids = sum(len(p.ids) for p in parsed.values())
print("检查了 %d 处 href/src 引用、%d 个 id 锚点" % (checked_refs, checked_ids))
print("-" * 68)

for message in warnings:
    print("[警告] " + message)

if errors:
    for message in errors:
        print("[错误] " + message)
    print("-" * 68)
    print("结果：发现 %d 个问题，请修复后重新运行。" % len(errors))
    sys.exit(1)

print("结果：全部通过 ✓  所有链接、资源、锚点、导航与标签结构均正常。")
sys.exit(0)
