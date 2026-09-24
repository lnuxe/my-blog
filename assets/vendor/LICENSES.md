# 第三方库（本地自带，无 CDN）

本目录下的文件都是**原样下载**的第三方开源库，随站点一起分发，运行时不会向任何外部地址发请求。
站点的 `tools/check_blog.py` 依旧禁止一切外部 `src` / `link` / 字体 / 图片引用；这三个文件是
**本地资源**，不是外部依赖。

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

## 校验方式

重新下载并核对哈希：

```powershell
python -c "import hashlib;print(hashlib.sha256(open(r'assets/vendor/three.min.js','rb').read()).hexdigest())"
```

升级版本时请同步更新本文件里的版本号、字节数与 sha256。
