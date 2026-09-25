# 第三方库（本地自带，无 CDN）

本目录（以及 `assets/fonts/`）下的文件都是**原样下载**的第三方开源库 / 字体，随站点一起分发，
运行时不会向任何外部地址发请求。站点的 `tools/check_blog.py` 依旧禁止一切外部
`src` / `link` / 字体 / 图片引用；下面这些文件都是**本地资源**，不是外部依赖。

清单：

| 文件 | 项目 | 版本 | 许可证 |
| --- | --- | --- | --- |
| `assets/vendor/three.min.js` | three.js | r160 | MIT |
| `assets/vendor/atropos.min.js` / `.min.css` | Atropos | 2.0.2 | MIT |
| `assets/vendor/mermaid.min.js` | mermaid | 10.9.1 | MIT |
| `assets/fonts/inter-latin-wght-normal.woff2` | Inter | 可变字重 100–900 | SIL OFL 1.1 |
| `assets/fonts/jetbrains-mono-latin-wght-normal.woff2` | JetBrains Mono | 可变字重 100–800 | SIL OFL 1.1 |

> `assets/icons.svg` 里的图标取自 Tabler Icons（MIT），许可与清单写在该文件头部注释里。

---

## three.js（r160）

| 项目 | 内容 |
| --- | --- |
| 项目名 | three.js |
| 仓库 | https://github.com/mrdoob/three.js |
| 版本 | r160（npm 包 `three@0.160.0`） |
| 许可证 | MIT |
| 下载来源 | https://unpkg.com/three@0.160.0/build/three.min.js |
| 本地文件 | `assets/vendor/three.min.js` |
| 字节数 | 669,884 B |
| sha256 | `170c6789f43217c96b3170f4b42fafe135de7f7cd48497a4218f9757ee1d49fa` |
| 用在哪里 | 只被 `assets/hero3d.js` 使用，只有 `index.html` 加载它，用于绘制首页 Hero 的 3D 星图背景 |

r160 是最后一个仍然提供 UMD 构建（`build/three.min.js`）的版本，因此可以用普通
`<script src>` 加载，不需要 `type="module"`，在 `file://` 下双击打开也能正常工作。

版权声明见文件头：`Copyright © 2010-2024 three.js authors`，MIT License。

---

## Atropos（2.0.2）

| 项目 | 内容 |
| --- | --- |
| 项目名 | Atropos |
| 仓库 | https://github.com/nolimits4web/atropos |
| 版本 | 2.0.2 |
| 许可证 | MIT |
| 下载来源 | https://unpkg.com/atropos@2.0.2/atropos.min.js |
| 本地文件 | `assets/vendor/atropos.min.js` |
| 字节数 | 6,925 B |
| sha256 | `8b59b258d7493ada7fce6583c7093e51c0724b72ff4d65f999ada342af7a641a` |
| 用在哪里 | `index.html` 的精选项目卡片与文章卡片、`projects.html` 的 13 个项目卡片，初始化代码在 `assets/cards3d.js` |

| 项目 | 内容 |
| --- | --- |
| 项目名 | Atropos 样式表（同一项目的 CSS 部分） |
| 仓库 | https://github.com/nolimits4web/atropos |
| 版本 | 2.0.2 |
| 许可证 | MIT |
| 下载来源 | https://unpkg.com/atropos@2.0.2/atropos.min.css |
| 本地文件 | `assets/vendor/atropos.min.css` |
| 字节数 | 1,666 B |
| sha256 | `f5f6448daa556aaa2ca7a07d47acc5e633495bd7625f97943887f1fc94b3b081` |

文件头版权声明：`Copyright 2021-2023`，`Released under the MIT License`。

> 注意：`atropos.min.js` 末尾带一行 `//# sourceMappingURL=atropos.min.js.map`。
> 本仓库没有附带该 source map，浏览器只会在开发者工具里跳过它，不会发起请求（`file://` 下也不会）。

---

## mermaid（10.9.1）

| 项目 | 内容 |
| --- | --- |
| 项目名 | mermaid |
| 仓库 | https://github.com/mermaid-js/mermaid |
| 版本 | 10.9.1（UMD 构建） |
| 许可证 | MIT，Copyright (c) 2014-2022 Knut Sveidqvist |
| 下载来源 | https://unpkg.com/mermaid@10.9.1/dist/mermaid.min.js |
| 本地文件 | `assets/vendor/mermaid.min.js` |
| 字节数 | 3,335,717 B |
| sha256 | `61b335a46df05a7ce1c98378f60e5f3e77a7fb608a1056997e8a649304a936d6` |
| 用在哪里 | **只有含图表的文章页**，且要滚到图表附近才插入 `<script>` |

懒加载与调用都在 `assets/main.js` 的 `initDiagrams()` 里：

```
页面上没有 .diagram                → 直接 return，脚本永远不请求
有 .diagram 但还没滚到             → IntersectionObserver(rootMargin 400px) 等着
第一张图进入 400px 预取区          → 动态插入 <script src="assets/vendor/mermaid.min.js">
onload                            → mermaid.initialize(...) + 逐张 mermaid.run()
```

脚本地址写在 `<body data-mermaid-src="../assets/vendor/mermaid.min.js">` 上（相对页面，
`file://` 双击也能解析）。脚本加载失败或某张图语法有误时，图表区保留
`<div class="mermaid">` 里的**源码文本**，CSS 把它渲染成带 `mermaid` 语言标识的代码块 ——
不会出现空白。

---

## 字体：Inter 与 JetBrains Mono（SIL OFL 1.1）

| 项目 | 内容 |
| --- | --- |
| 项目名 | Inter |
| 仓库 | https://github.com/rsms/inter |
| 许可证 | SIL Open Font License 1.1，Copyright (c) The Inter Project Authors |
| 下载来源 | https://cdn.jsdelivr.net/npm/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2 |
| 本地文件 | `assets/fonts/inter-latin-wght-normal.woff2` |
| 字节数 | 48,256 B |
| sha256 | `3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62` |

| 项目 | 内容 |
| --- | --- |
| 项目名 | JetBrains Mono |
| 仓库 | https://github.com/JetBrains/JetBrainsMono |
| 许可证 | SIL Open Font License 1.1，Copyright 2020 The JetBrains Mono Project Authors |
| 下载来源 | https://cdn.jsdelivr.net/npm/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2 |
| 本地文件 | `assets/fonts/jetbrains-mono-latin-wght-normal.woff2` |
| 字节数 | 40,404 B |
| sha256 | `18be452724bfdc236c074ca94a249a7f41a86752c7d04ab258ce9ed5651f6a7e` |

两个文件都是 **latin 子集**（可变字重），加起来 88,660 B。它们**没有中文字形**，
所以中日韩字符一律回退到系统字体 —— 这也是本站在不引入几 MB 中文 Web Font 的前提下
统一拉丁观感的关键，字体栈的完整取舍见 `blog/DESIGN.md` 第 19 节。

引入方式（`assets/style.css` 第 00 节）：

```css
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("fonts/inter-latin-wght-normal.woff2") format("woff2");
}
```

`font-display: swap`：首屏先用系统字体渲染，字体到位后替换，不阻塞阅读。

---

## 校验方式

重新下载并核对哈希：

```powershell
python -c "import hashlib;print(hashlib.sha256(open(r'assets/vendor/three.min.js','rb').read()).hexdigest())"
python -c "import hashlib;print(hashlib.sha256(open(r'assets/vendor/mermaid.min.js','rb').read()).hexdigest())"
python -c "import hashlib;print(hashlib.sha256(open(r'assets/fonts/inter-latin-wght-normal.woff2','rb').read()).hexdigest())"
python -c "import hashlib;print(hashlib.sha256(open(r'assets/fonts/jetbrains-mono-latin-wght-normal.woff2','rb').read()).hexdigest())"
```

升级版本时请同步更新本文件里的版本号、字节数与 sha256。
