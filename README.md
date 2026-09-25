# SupermanCantFly · 静态博客

一个**纯静态**的中文技术博客：只有 HTML、CSS 和一份原生 JavaScript，没有构建步骤、没有 npm 依赖、不需要任何运行时。既能直接双击 HTML 离线阅读，也能丢进任意静态服务器（IIS / Nginx / GitHub Pages / EdgeOne / 对象存储）运行。

站点主人在 GitHub 上是 [@lnuxe](https://github.com/lnuxe)，文章全部写自真实跑过的项目（浏览器自动化、Agent 技能包、RAG、Flutter 多端）。

- 编码：全站 UTF-8（无 BOM），`lang="zh-CN"`
- 外部请求：**零**（无 CDN、无外部字体、无外部图片、无分析脚本）。站点会用到的第三方库与字体（three.js / Atropos / mermaid / Inter / JetBrains Mono）全部**本地自带**，文件在仓库里，见 [`assets/vendor/LICENSES.md`](assets/vendor/LICENSES.md)
- 外链策略：正文与项目页允许 `<a href="https://…">` 形式的普通超链接（如 GitHub），但**不允许任何外部资源引用**
- 链接：站内链接全部为相对路径，可部署在域名根目录，也可部署在任意子目录下
- 排版：正文 `line-height` ≥ 1.75，正文最大宽度 `--content-width: 688px`（内容宽 640px，约 40 汉字/行）。完整规则见 [DESIGN.md](DESIGN.md)，可用 `tools/audit_design.py` 自动验收
- 字体：拉丁自持 **Inter**、代码自持 **JetBrains Mono**（各 48 KB / 40 KB 的 latin 子集，`font-display: swap`）；**标题仍是系统宋体栈**，中文一律回退系统 CJK。策略见 DESIGN.md 第 19 节
- 图表：文章页可用 **mermaid**（本地自带，3.3 MB，**只在含图表的页面、且滚到图表附近才加载**），支持亮暗主题配色、复制源码与点图放大的灯箱；无 JS 时降级为带语言标识的源码代码块
- 无障碍：按 WCAG 2.2 AA 验收（对比度 ≥4.5:1、可点击目标 ≥24×24、焦点指示器 2px）

---

## 一、文件结构

```
blog/
├── index.html            # 首页：Hero + 技术徽章 + 最新文章 + 精选项目 + 侧边栏
├── projects.html         # 项目页：13 个真实仓库，按四组分类的卡片
├── archive.html          # 归档：按年份分组列出全部文章
├── tags.html             # 标签索引：标签云 + 按标签分组，支持客户端筛选
├── about.html            # 关于我：身份、技术栈、项目、飞行日志、联系方式
├── 404.html              # 友好的 404 页面
├── feed.xml              # RSS 2.0 订阅源（6 篇文章）
├── sitemap.xml           # XML 站点地图（含 projects.html）
├── robots.txt            # 爬虫规则
├── favicon.svg           # 站点图标（石板蓝底 + 纸白兜帽 + 沙色格纹围巾）；页头 / 页脚的标志也引用它本身
├── README.md             # 本文件
├── tools/
│   └── check_blog.py     # 开发工具：检查死链、锚点、导航与 XML（不参与站点运行）
├── assets/
│   ├── style.css         # 全站唯一的样式表（含设计令牌、深色主题、打印样式）
│   ├── main.js           # 全站唯一的脚本（主题、导航、搜索、筛选、复制代码等）
│   ├── icons.svg         # 图标 sprite（Tabler，27 个 symbol，`<use>` 引用，无外部请求）
│   ├── cards3d.js        # 卡片景深（Atropos 初始化；仅 index / projects 加载）
│   ├── hero3d.js         # 首屏星图背景（three.js；装饰性，可缺席）
│   ├── avatar.jpg        # 头像原图（页面里用的是内联 SVG 版）
│   ├── fonts/            # Inter / JetBrains Mono（latin 子集，OFL，无外部请求）
│   └── vendor/           # 本地自带第三方库：three.min.js / atropos.* / mermaid.min.js（LICENSES.md 记账）
└── posts/
    ├── wechat-4x-db-export.html              # 微信 4.x 聊天记录导出（LLDB / PBKDF2 / wxecho）
    ├── index-first-filesystem-rag.html       # Index-first 文件系统 RAG 的四步路由
    ├── deterministic-browser-automation.html # 确定性优先的浏览器自动化
    ├── rag-cs-bot-manual-handoff.html        # 用知识库边界强制售后转人工
    ├── flutter-defect-triage-skill.html      # Flutter 缺陷分诊 Skill 的设计
    └── preaim-rush-peek.html                 # Vite + PixiJS + Three.js 的 FPS 瞄准训练器
```

### 链接层级约定

只有两条规则，记住就不会写错：

| 文件位置 | 引用样式表 | 引用其他页面 |
| --- | --- | --- |
| 根目录（`index.html` 等） | `assets/style.css` | `about.html`、`posts/xxx.html` |
| `posts/\*.html` | `../assets/style.css` | `../about.html`、`xxx.html`（同目录） |

**永远不要写 `/assets/style.css` 这种以斜杠开头的路径**，它会把站点绑死在域名根目录，部署到子目录时会全线 404。

---

## 二、本地预览

三种方式任选：

1. **直接双击** `index.html`（`file://` 协议）。全站功能都可用，包括搜索、筛选与主题切换。
2. **VS Code + Live Server 插件**：右键 `index.html` → Open with Live Server。
3. **任意静态服务器**，例如：

   ```powershell
   # Python 3
   python -m http.server 8080 --directory C:\path\to\blog
   ```

   然后访问 http://localhost:8080/ 。

> 注意：`file://` 下不要使用 `fetch()` 读取本地文件、不要用 ES Module，浏览器会因同源策略拒绝。本项目刻意避开了这两者。

---

## 三、如何新增一篇文章

### 1. 新建文件

复制任意一个已有文章（推荐 `posts/preaim-rush-peek.html`）到 `posts/` 下，重命名为英文短横线风格的文件名，例如：

```
posts/playwright-selector-notes.html
```

### 2. 修改页面头部

在 `<head>` 中改这三处：

```html
<title>文章标题 · SupermanCantFly</title>
<meta name="description" content="一句话摘要，会出现在搜索结果里。">
<meta name="author" content="SupermanCantFly">
```

### 3. 修改文章头部

```html
<p class="post-eyebrow">浏览器自动化</p>          <!-- 分类 -->
<h1 class="post-title">文章标题</h1>
<p class="post-meta">
  <time datetime="2026-10-01">2026 年 10 月 1 日</time>   <!-- ISO 日期 + 中文显示 -->
  <span class="dot" aria-hidden="true">·</span>
  <span>约 3000 字</span>
  <span class="dot" aria-hidden="true">·</span>
  <span>阅读约 8 分钟</span>
</p>
<ul class="tag-list">
  <li><a class="tag" href="../tags.html?tag=%E6%B5%8F%E8%A7%88%E5%99%A8%E8%87%AA%E5%8A%A8%E5%8C%96">浏览器自动化</a></li>
</ul>
```

### 4. 写正文

正文放在 `<article class="prose">` 内，可用的结构：

```html
<h2 id="section-1">二级标题</h2>          <!-- 会自动带一个 # 前缀 -->
<h3>三级标题</h3>
<p>段落。</p>
<ul><li>列表项</li></ul>

<blockquote><p>引用。</p></blockquote>

<!-- 代码块：顶栏的语言名写在这颗 .code-lang 里，data-lang 给复制按钮的无障碍标签用 -->
<div class="code-block" data-lang="bash">
  <div class="code-bar"><span class="code-lang">bash</span></div>
  <pre><code>代码（HTML 实体需转义：&amp;lt; &amp;gt; &amp;amp;）</code></pre>
</div>

<div class="table-scroll"><table>...</table></div>   <!-- 表格，窄屏可横向滚动 -->

<!-- 提示块：四种语义，类的选择见 DESIGN.md 第 20.7 节 -->
<div class="note note-warning">
  <span class="note-ic" aria-hidden="true"><svg class="i" aria-hidden="true" focusable="false"><use href="../assets/icons.svg#tabler-alert-triangle"></use></svg></span>
  <div class="note-body">
    <p class="note-title">注意</p>
    <p>正文。</p>
  </div>
</div>

<!-- 图表：源码就写在 .mermaid 里（无 JS 时按代码块显示，所以换行与缩进要保留） -->
<figure class="diagram">
  <div class="diagram-bar">
    <span class="diagram-lang">mermaid</span>
    <span class="diagram-title">图 1 · 标题</span>
    <span class="diagram-tools" data-diagram-tools hidden></span>
  </div>
  <div class="diagram-body"><div class="mermaid">flowchart TD
  A["节点"] --&gt; B["节点"]
  </div></div>
  <figcaption class="diagram-caption">图注。</figcaption>
</figure>

<nav class="toc" aria-label="本文目录">...</nav>      <!-- 可选的目录 -->
```

> 带图表的页面还要在 `<body>` 上加一条
> `data-mermaid-src="../assets/vendor/mermaid.min.js"`（根目录页面写 `assets/…`），
> 图表的懒加载脚本靠它解析相对路径。

### 5. 更新文章翻页链接

在 `<footer class="post-footer">` 里改 `.post-nav` 的上一篇 / 下一篇链接，并顺手把相邻那篇文章的翻页链接也改对（每篇文章都要指向前后两篇）。

### 6. 登记到六个地方

新增文章后，需要手动同步下面这些位置（它们都是静态内容，没有自动生成）：

| 文件 | 需要做什么 |
| --- | --- |
| `index.html` | 复制一个 `<li class="post-card" data-post …>`，改标题、日期、标签、摘要与链接；同步更新标签筛选按钮与侧边栏标签计数 |
| `archive.html` | 在对应年份的 `<ul class="archive-list">` 里加一个 `<li class="archive-item">` |
| `tags.html` | 给新标签添加 `<button data-tag-jump="新标签">` 和对应的 `<section data-tag-section="新标签">` |
| `feed.xml` | 在 `<channel>` 顶部加一个 `<item>`（`pubDate` 用 RFC-822 格式，链接用 `https://supermancantfly.cc/` 前缀） |
| `sitemap.xml` | 加一个 `<url>` 条目 |
| `projects.html` / `about.html` | 如果新文章对应一个新项目，同步补上项目卡片与「做过的东西」列表 |

> 首页搜索和标签筛选直接读取卡片上的 `data-title` / `data-tags` / `data-excerpt` 属性，所以**只要卡片写对了，搜索就自动生效**，不需要改 JavaScript。

### 7. 新增标签或修改导航

- 导航项：在**每个页面**的 `<nav class="site-nav">` 和页脚中同步增删（目前是 6 个根页面 + 6 篇文章，共 12 个 HTML 文件）。五个主入口缺任何一个，`check_blog.py` 都会报错。
- 站点信息：页脚的版权、`about.html` 的内容。

---

## 四、部署

站点目标域名是 `https://supermancantfly.cc/`。`feed.xml`、`sitemap.xml`、`robots.txt` 里的域名如需更换，三处一起改。

### 方式一：腾讯云 EdgeOne Makers / GitHub Pages / Cloudflare Pages

1. 把整个目录推到仓库。
2. 在平台的 Pages 设置里选择分支与目录（根目录或 `/docs`）。
3. 等待一两分钟即可访问。

### 方式二：Windows Server + IIS

```powershell
New-WebAppPool -Name 'blog-pool'
New-Website -Name 'blog' -PhysicalPath 'D:\sites\blog' `
  -ApplicationPool 'blog-pool' -Port 80 -HostHeader 'supermancantfly.cc'

icacls "D:\sites\blog" /grant "IIS AppPool\blog-pool:(OI)(CI)(RX)" /T
```

再把 `404.html` 配置成自定义错误页。

### 方式三：Nginx

```nginx
server {
    listen 80;
    server_name supermancantfly.cc;
    root /var/www/blog;
    index index.html;
    charset utf-8;

    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    location ~* \.(css|js|svg|png|jpg|webp|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    error_page 404 /404.html;
    location = /404.html { internal; }
}
```

### 部署后必做

1. 确认 `feed.xml`、`sitemap.xml`、`robots.txt` 里的域名与真实域名一致。
2. 确保 HTTP 能 301 跳转到 HTTPS。
3. 确认服务器对 `.svg` 返回 `image/svg+xml`，对 `.xml` 返回 `application/xml`（否则 RSS 阅读器会报错）。

---

## 五、改成你自己的站点

| 位置 | 内容 |
| --- | --- |
| 所有页面的 `<nav class="site-nav">` 与页脚 | 站点名 `SupermanCantFly`、副标题「自动化 · Agent · Flutter」 |
| `index.html` 的 Hero 区 | 主标题、副标题、`.badge-list` 技术徽章 |
| `index.html` 侧边栏 | 头像（内联 SVG 的 `AVATAR` 部分）、姓名、简介、统计数字 |
| `projects.html` | 全部项目卡片（名称、语言标签、简介、要点、GitHub 链接） |
| `about.html` | 全部内容 |
| `assets/style.css` 的 `:root` | 主色 `--accent`、字号、圆角、内容宽度 `--content-width` |
| `favicon.svg` | 站点图标；页头 / 页脚的 `<img class="brand-mark">` 引用的是同一个文件，改一处全站生效 |

改主题色只需要动 `:root` 和 `[data-theme="dark"]` 里的 `--accent`、`--accent-hover`、`--accent-soft` 三个变量。

### 第 15 节样式（新增组件）

`assets/style.css` 的第 15 节是组件样式，全部沿用既有设计令牌：`.badge-list` / `.badge`（技术徽章）、
`.project-grid` / `.project-card` / `.lang-tag` / `.project-link`（项目卡片）、`.timeline`（飞行日志）、`.info-list`（键值列表）。

项目卡片（2026-09-25 重做）：单列 → **≥720px 两列**、gap 24px、卡片内边距 24px；
语言标签是「圆点 + 名称」；要点用自绘沙色圆点；页脚是 28px 高的小按钮并**贴底对齐**（`.project-points { flex:1 }` 撑开）；
悬停时边框、底色变化并亮起顶沿 2px 渐变。改动原因与审计数据见 DESIGN.md 第 8 节。

---

## 六、功能说明（`assets/main.js`）

| 功能 | 说明 |
| --- | --- |
| 主题切换 | 写入 `localStorage`（键名 `scf:theme`）；首次访问跟随 `prefers-color-scheme`；`<head>` 内联脚本在绘制前应用，避免闪烁 |
| 移动端导航 | 按钮切换、点击链接后自动收起、`Esc` 关闭、点击外部关闭、拉宽窗口自动复位 |
| 首页搜索 | 按空格分词，多关键词取「与」，匹配标题 / 标签 / 摘要 / 日期；`/` 键快速聚焦 |
| 标签筛选 | 首页筛选按钮与标签页分组共用；支持 `?tag=xxx` 直接跳转 |
| 复制代码 | 给每个 `.code-block` 的顶栏补一颗复制按钮（语言名来自 HTML 里写死的 `.code-lang`），优先用 `navigator.clipboard`，失败时回退 |
| 图表（mermaid） | 只在页面含 `.diagram` 时启用；第一张图进入视口 400px 内才插入 `<script>`；主题切换后重画 |
| 图表灯箱 | 点图表或「放大查看」打开全屏对话框：±缩放 / 重置 / 拖动平移 / Esc 关闭，焦点锁在对话框内 |
| 阅读进度 / 返回顶部 | 文章页顶部进度条，滚动超过 600px 显示返回顶部按钮 |
| 导航高亮 | 根据当前文件名给导航项加 `aria-current="page"` |

所有功能都是**渐进增强**：禁用 JavaScript 后，页面内容、链接与导航依然完全可用。

---

## 七、无障碍与打印

- 语义化标签：`header` / `nav` / `main` / `article` / `aside` / `footer`，页面首行有「跳到主要内容」链接。
- 所有图标 SVG 都带 `aria-hidden="true"`，装饰性元素不进入无障碍树。
- 交互控件都有 `aria-label` 或 `aria-pressed`，筛选结果通过 `aria-live` 播报。
- 可见焦点样式（`:focus-visible`），尊重 `prefers-reduced-motion`。
- 文章页自带打印样式：隐藏导航、侧边栏与按钮，正文转为黑白，外链自动展开为 `文字 (URL)`。

---

## 八、发布前自检

```powershell
# 1. 检查相对链接、外部资源、锚点、主导航完整性与 XML 死链
python tools/check_blog.py

# 2. 校验脚本语法
node --check assets/main.js

# 3. 排版/无障碍审计（亮色 + 暗色 + 375px 都要跑），验收标准见 DESIGN.md
python tools/audit_design.py http://127.0.0.1:8331/ --light
python tools/audit_design.py http://127.0.0.1:8331/ --width 375 --light
```

`check_blog.py` 的检查范围：

1. UTF-8 可解码 + `<meta charset="UTF-8">` + `lang="zh-CN"`
2. HTML 标签闭合与重复 id
3. 相对 `href` / `src` 指向的文件是否存在
4. 页内锚点 `#fragment` 是否有对应 id
5. **外部依赖**：允许 `<a href="https://…">` 外链，禁止 `src` / `<link href>` 等外部资源
6. **主导航完整性**：每个页面都要能点到五个主入口（首页 / 项目 / 归档 / 标签 / 关于）
7. **XML**：`feed.xml` / `sitemap.xml` 的结构与 **绝对链接的磁盘存在性**（死链）

退出码 0 表示全部通过。

---

## 九、许可

- 文章内容：CC BY-NC-SA 4.0
- 代码（HTML / CSS / JavaScript）：可自由取用，无需署名
