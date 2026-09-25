# 设计与排版标准（本站遵守的规则）

> 这份文件是本站的**验收标准**，不是参考链接集合。每条规则都写明：依据、本站取的值、以及怎么验。
> 依据主要来自三处：W3C **clreq**（《中文排版需求》，中文排版的权威标准）、**WCAG 2.2 AA**（无障碍，等价于国内信息无障碍规范的技术口径）、以及中文 Web 排版的通行实践。

---

## 1. 正文排版

| 项目 | 标准 | 本站取值 | 依据 |
| --- | --- | --- | --- |
| 正文字号 | 中文不小于 16px | `1rem` = 16px | 中文笔画密度高，小于 16px 在 Windows 上发虚 |
| 正文行高 | ≥ 1.5；中文正文推荐 1.7–1.8 | **1.75** | WCAG 2.2 SC 1.4.12 要求行距 ≥1.5；clreq 6.4 基线/行高 |
| 每行字数 | 中文 30–40 字/行 | **≤ 40 字** | 行长超过 40 字，回扫时容易串行 |
| 对齐方式 | 左对齐（start），**不要两端对齐** | `text-align: start` | clreq 6.2：中文两端对齐需要标点挤压支持，Web 上做不好会出大空隙 |
| 段落间距 | ≥ 行距的 1.5 倍 | `1em`(=16px) | WCAG 2.2 SC 1.4.12 |
| 中西文混排 | 汉字与西文之间自动留 1/4 空隙 | 交给字体与浏览器处理 | clreq 6.2.3 |
| 标点 | 行首禁止出现 `，。、）」` 等；行尾禁止 `（「` | 浏览器默认禁则 + `text-spacing-trim` | clreq 6.1.1 / 6.3.2 |

## 2. 标题层级

- 每页**有且只有一个 `h1`**，层级不得跳级（h1 → h3 是错的）。
- 标题行高 1.2–1.35；正文与标题之间用间距拉开，不靠下划线或加粗堆叠。
- 长标题用 `text-wrap: balance`，避免最后一行只剩一个字。

## 3. 色彩与对比度（WCAG 2.2 AA，硬指标）

| 内容 | 最低对比度 | 本站要求 |
| --- | --- | --- |
| 正文、链接、按钮文字 | **4.5 : 1** | ≥ 5 : 1（留余量，避免贴线） |
| 大字号（≥24px 或 ≥18.66px 粗体） | 3 : 1 | ≥ 4.5 : 1 |
| 边框、分隔线、图标等非文字 | 3 : 1 | ≥ 3 : 1 |

> **当前状态（2026-09-24 实测，见第 8 节）：亮色主题把 `--text-muted` 提到 `#59616d`、`--accent` 提到 `#1a5fd0`，
> 页脚/次要文字 5.88:1、卡片元信息 6.26:1、正文链接与当前导航 5.85:1，全站文字对比度都 ≥5:1，不再贴线。
> 页脚这类次要信息用的是"最低 4.5"那一行，本站仍然按 ≥5:1 要求它。**

## 4. 间距与字号体系（设计令牌）

- **间距必须落在 4px 网格上**：允许值只有 `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`。
- **字号必须来自一条模数字阶**，档位固定为：

  `12 / 13 / 14 / 16 / 18 / 20 / 24 / 30 / 36 / 44`（px）

  除正文字号与响应式标题外，**不允许出现未列出的字号**。
- 禁止用 `em` 层层嵌套来"顺手缩小"字号——父子都写 `.9em` 会复利出 `12.8064px` 这种非整数值。子元素要变小，直接引用字号令牌。
- 响应式标题**不用 `vw` 插值**，改成固定档位 + 断点（第 18.2 节：24 → 30 → 36）。`clamp(1.9rem, 5.2vw, 2.7rem)` 在 1280px
  会算出 43.2px，在 375px 会算出 30.4px，都不在模数上。
- **登记在册的例外**：404 页的装饰性大号数字 `.center-code` 用 `clamp(44px, 16vw, 112px)`。
  它是纯展示用的响应式标题（不是正文，不参与阅读），所以保留自己的档位。
  `tools/audit_design.py` 没有例外机制，跑 404 页时会把它计为 1 个"字号越界"——这是已知、且被批准的。
  除它以外，全站字号都落在上面那 10 个档位里。

## 5. 交互与触达（WCAG 2.2）

- **SC 2.5.8 目标尺寸**：可点击元素不小于 **24×24 CSS px**。
  例外只有一种：**句子行文中的内联链接**。目录链接、侧栏链接、页脚链接、卡片链接都**不在豁免范围**。
  实现方式（第 18.1 节）：给这些"块状"链接统一加 `display: inline-flex; align-items: center; min-height: 24px`。
  **不加 padding**——padding 会撑开行高、改变断行；`min-height` 只把点击区补到 24px，文字仍然垂直居中。
  正文里的内联链接保持原样（`display: inline`，不动）。
- **SC 2.4.13 焦点外观**：焦点指示器至少 2px 粗，且与相邻颜色对比 ≥3:1。本站用 2px 主色描边。
- **SC 2.4.11 焦点不被遮挡**：吸顶导航不得盖住被聚焦的元素。

## 6. 性能与稳定性

- 图片/Canvas 必须有显式尺寸，避免 **CLS**（累积布局偏移）。
- 动画必须尊重 `prefers-reduced-motion: reduce`。
- 首屏之外的 3D 渲染必须能被 `IntersectionObserver` 暂停。
- 字体：**只自持拉丁子集**（Inter / JetBrains Mono，合计 88,660 B，`font-display: swap`），
  中文一律回退系统 CJK 字体。既不引入动辄数 MB 的中文 Web Font，也不再让拉丁观感随机器变化。
  字体栈的完整取舍见第 19 节。

## 7. 响应式

- 断点至少覆盖 **375px / 768px / 1280px**。
- 375px 下**不允许出现横向滚动**（`scrollWidth == clientWidth`）。
- 移动端正文字号不得小于 16px。

---

## 8. 实测基线（自动化审计，非人工目测）

审计脚本 `tools/audit_design.py` 直接驱动无头 Chrome，注入测量代码，输出 JSON。
它检查的正是上面这些条款：对比度、行高比、每行汉字数、字号档位、间距网格、24px 触达、焦点样式、标题层级、横向溢出。

**审计方法**：`python tools/audit_design.py <url> [--light] [--width 375]`

### 最近一次结果（2026-09-25 项目卡片重做 / 图标 sprite 修复之后）

| 页面 | 主题 | 结论 |
| --- | --- | --- |
| 文章页 | 亮色 | **FAIL 0 / WARN 0**；行长 正文 35、引用 40 字/行（≤40）；字号 7 种全在阶内；间距 10 个值全部对齐 4px 网格；触达 0 个非内联小目标；焦点 solid 2px；对比度最低 6.01:1 |
| 文章页 | 暗色 | 同上（对比度最低 6.01:1） |
| 文章页 | 375px | **FAIL 0 / WARN 0**；行长 正文 19 字/行；无横向滚动；触达 0 |
| 首页 | 亮色 | **FAIL 0 / WARN 0**；对比度最低 6.58:1（标签计数）；字号 7 种；间距 12 个值全部对齐网格；触达 0 |
| 首页 | 暗色 | **FAIL 0 / WARN 0**；对比度最低 6.58:1 |
| 首页 | 375px | **FAIL 0 / WARN 0**；无横向滚动；触达 0；焦点 solid 2px |
| 项目页 | 亮色 / 暗色 | **FAIL 0 / WARN 0**；字号 6 种；间距 10 个值；触达 0；对比度最低 6.01:1 |
| 归档 / 标签 | 亮色 / 暗色 | **FAIL 0 / WARN 0**（`.archive-date` 原来的 `padding-top:2px` 已改 4px，落回网格） |
| 关于页 | 亮色 / 暗色 | **FAIL 0 / WARN 0**；行长 正文 35、列表/引用 40 字/行 |
| 404 | — | 只剩 `.center-code` 的 112px 被计为"字号越界"，就是第 4 节登记在册的那个例外 |

### 2026-09-25：项目卡片重做（第 15 节）

原来的项目卡片是 **3 列 × 288px**，而且第 17 节里有一条
`.card-3d .atropos-inner > .project-card { padding: 0 }`，把卡片内边距清零 ——
实测卡片 `padding: 0px`、正文距边框 **1px**，一行 4~5 条中文要点在 300px 宽的列里要折 10 行，
又挤又碎。现在：

| 项目 | 旧 | 新 |
| --- | --- | --- |
| 栅格 | `auto-fill minmax(288px)`，gap 16px | 单列 → **≥720px 两列**，gap 24px |
| 卡片内边距 | 0（被第 17 节清零） | **24px**（并删掉那条清零规则） |
| 语言标签 | 带边框的小方块 | GitHub 风格「圆点 + 名称」 |
| 要点列表 | 默认圆点 marker | 自绘 5px 沙色圆点 + 14px / 行高 1.7 + 条间 8px |
| 页脚链接 | 无边框文字链 | 28px 高的小按钮（触达 ≥24px） |
| 同一行卡片页脚 | 不对齐（`margin-top:16px` 覆盖了 `auto`） | 改用 `.project-points { flex: 1 1 auto }` 撑开，**页脚贴底对齐** |
| 悬停 | 只换边框色 | 边框 + 底色 + 顶沿 2px「天光 → 沙色」渐变 |

> 两个坑值得记下来：
> 1. 用 `margin-top:auto` 让页脚贴底，会算出一个非 4 倍数的高度，审计判「间距越界」——
>    改成让上一条要点列表 `flex: 1` 吃掉剩余高度，页脚自然落底，审计也干净。
> 2. `gap: 6px`、`padding-top: 2px` 这类「看起来无所谓」的值会让整页审计 FAIL 1，务必用 4 的倍数。

### 2026-09-25：图标 sprite 的 XML 修复（重要）

`assets/icons.svg` 的注释里用 ASCII 连续短横线（`-----`）做分隔线，
而 **XML 注释内容里不允许出现 `--`** —— 整个 sprite 因此解析失败（`symbols: 0`），
**全站图标（主题按钮、导航箭头、GitHub、日历、标签、搜索…）全部不显示**，页面上只剩一排空方块。
已把三条分隔线换成 U+2500（`─`），现在 `DOMParser` 能解析出 22 个 symbol，图标全部正常。
校验方法（浏览器控制台）：

```js
const d = new DOMParser().parseFromString(await (await fetch('assets/icons.svg')).text(), 'image/svg+xml');
d.querySelector('parsererror');        // 必须是 null
d.querySelectorAll('symbol').length;   // 必须是 22
```

**修之前**（留档对比）：文章页暗色 行长 41 字/行、20 种字号（17 种越界）、20 个间距越界、12 个触达 <24px；
文章页亮色 `footer`/`tag_count` 4.45:1 低于 AA、`meta` 4.74 无余量；首页亮色 24 个触达 <24px。

> 每次改样式后重跑审计，把新结果覆盖上来（连同日期）。
> 两点复现提醒：① 审计脚本只测页面**当前**主题，暗色要用 `prefers-color-scheme: dark` 模拟后再跑一遍（本表的暗色行就是这么来的）；
> ② 无头 Chrome 里如果 `document.hasFocus()` 为 false，探针 `focus()` 不生效，"焦点外观"会误报 FAIL —— 重跑或让新标签页激活即可。

---

## 9. 改样式时的验收流程

1. 改 `assets/style.css`。
2. `python tools/check_blog.py` —— 链接/锚点/结构必须 exit 0。
3. `python tools/audit_design.py http://127.0.0.1:8211/ ...` —— 与本文件第 8 节的数字对比，**不允许任何一项变差**。
4. 亮色 + 暗色 + 375px 三种组合都要跑。
5. 截图目视确认（`_shot.py`），确认没有"数据过了但看着不对"的情况。

---

## 19. 字体策略（2026-09-28 起）

### 19.1 引入的两个文件

| 文件 | 字形 | 许可 | 体积 |
| --- | --- | --- | --- |
| `assets/fonts/inter-latin-wght-normal.woff2` | Inter 可变字重 100–900，**latin 子集** | SIL OFL 1.1 | 48,256 B |
| `assets/fonts/jetbrains-mono-latin-wght-normal.woff2` | JetBrains Mono 可变字重 100–800，**latin 子集** | SIL OFL 1.1 | 40,404 B |

两个文件都在 `@font-face` 里声明 `font-display: swap`，随仓库分发，**零外部请求**。
来源与 sha256 记在 `assets/vendor/LICENSES.md`。

### 19.2 四条栈，各管一段

```css
--font-sans:         "Inter", -apple-system, …, "Microsoft YaHei", …, system-ui, sans-serif;
--font-serif:        "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", "SimSun", serif;
--font-latin-serif:  "Inter", "Songti SC", …, "SimSun", serif;
--font-mono:         "JetBrains Mono", ui-monospace, …, monospace;
```

| 用在哪 | 用哪条栈 | 结果 |
| --- | --- | --- |
| 正文、导航、卡片、表格、按钮 | `--font-sans` | 拉丁 = Inter，汉字 = 系统 CJK |
| **h1–h4 标题** | `--font-serif`（**一个字符都没改**） | 拉丁与汉字都走宋体系，杂志感原样保留 |
| 项目名这类"拉丁标识符 + 中文括注" | `--font-latin-serif` | 拉丁 = Inter，汉字 = 宋体 |
| 代码块、行内 code、语言标签 | `--font-mono` | JetBrains Mono |

### 19.3 为什么 Inter 敢放 `--font-sans` 首位，却**不能**放进标题栈

这两个问题的答案不是同一个：

- **正文栈**（无衬线）：Inter 是 **latin 子集**，cmap 里没有汉字。浏览器逐字回退，
  汉字自动落到后面的 `Microsoft YaHei` / `PingFang SC` / `Noto Sans CJK SC`，
  中英混排的断行、标点、字距都不受影响。而且把 Inter 放首位是**唯一**能让拉丁稳定走
  Inter 的写法 —— 放在系统 CJK 字体之后是无效的，那些字体自己就带拉丁字形，轮不到 Inter。
- **标题栈**（衬线）：如果把 Inter 放进这张栈的首位，标题里的英文会变成**几何无衬线**，
  而中文仍是**宋体**，两种风格硬拼在一起。这正是文档站那套做法**不能**照搬的地方，
  所以 `--font-serif` 保持原样。

需要"拉丁 Inter + 中文宋体"时用 `--font-latin-serif`（例如 `projects.html` 的
`.project-name`：`starmerx_listing` 这类标识符用 Inter，`pickled-fish（泡菜鱼）`
里的中文仍然是宋体）。

代码、URL、日期、统计数字、`.tag`、`.lang-tag`、`.post-meta` 本来就在
`--font-sans` / `--font-mono` 的覆盖范围内，不需要逐个指定。

### 19.4 实测

- 正文与标题的字号、行高、行长、对比度全部与升级前一致（见第 21 节）。
- 全站资源列表里字体只有 2 次请求，且都是本站域名；没有 CDN。
- 中文不出现豆腐块：两条栈的末尾都保留 `serif` / `system-ui, sans-serif` 兜底。

---

## 20. 图表（mermaid）与正文排版细节

### 20.1 图表只在需要的页面懒加载

```
页面没有 .diagram          → initDiagrams() 直接 return，3.3 MB 的 mermaid.min.js 永不请求
有 .diagram 但没滚到       → IntersectionObserver(rootMargin 400px) 等
第一张图进入 400px 预取区  → 动态插入 <script>（地址来自 <body data-mermaid-src>）
```

实测：首页 / 项目 / 归档 / 标签 / 关于 五页的资源列表里 `mermaid` 命中 **0 次**；
文章页滚动前 0 次，滚到图表后 1 次。

### 20.2 无 JS / 加载失败时的降级

`.mermaid` 里的**源码文本**就是降级形态：CSS 把它按等宽 13px / `white-space: pre` 渲染，
顶栏保留 `mermaid` 语言标识与图题。工具条（复制源码 / 放大查看）由 JS 注入，
没有 JS 时整条工具条带 `hidden`，**不会留下两个按不动的按钮**。
实测（`Emulation.setScriptExecutionDisabled`）：图表区完整显示从 `flowchart TD` 起的源码，
语言标识为 `MERMAID`，页面上 0 个 `.code-copy`。

### 20.3 配色

`theme: 'base'` + `themeVariables`，亮暗各一套，色值全部来自本站调色板：
石板蓝 `#506478` / 沙 `#b4a08c` / 墨 `#141519` / 纸 `#f2f1ec`。
暗色主题把"石板蓝—沙"这一对提亮到 `#8ea3b8` / `#b4a08c`，保证连线与节点边框在墨色底上仍有对比。
`fontSize` 固定 `16px`（在模数阶内），`htmlLabels: false` 让标签走 SVG `<text>`。

### 20.4 查看体验

- **工具条**：左 `MERMAID` 语言标识 + 图题，右「复制源码」（复制 → 对勾，1.6s 复位）
  与「放大查看」。两个按钮 `min-height: 28px`，满足 24×24 触达。
- **点图放大（灯箱）**：点击图表本体或工具条按钮打开全屏遮罩。
  `role="dialog"` + `aria-modal` + `aria-label`；打开时焦点移到「关闭」并锁在对话框内
  （Tab 循环），关闭后焦点回到原来那个元素；Esc / 点遮罩 / 关闭按钮都能退出；
  缩放 25%–400%（± 按 25% 步进，打开时先按窗口精确适配一次）；舞台可按住拖动平移。
  灯箱节点在第一次打开时才创建、关闭即移除 —— 页面上不留隐藏的大块 DOM。
  > 灯箱是本站自己加的，原站与文档站都没有。做它的理由是：`useMaxWidth` 会把宽图压到
  > 正文栏宽度，节点文字在 640px 的栏里只剩 10px 上下，放大看是这类图唯一舒服的读法。

### 20.5 代码块：顶栏语言标识 + 复制

```html
<div class="code-block" data-lang="bash">
  <div class="code-bar"><span class="code-lang">bash</span></div>
  <pre><code>…</code></pre>
</div>
```

- 语言名的**唯一来源是 HTML 里那颗 `.code-lang`**（`data-lang` 只给脚本拼无障碍标签）：
  改语言就改那一个词，不需要推断、不需要构建步骤。
- 顶栏 `min-height: 36px`、`padding: 4px 8px 4px 16px`（4px 网格）。
- 代码区 `padding: 16px`、`font-size: 14px`、`line-height: 24px`；**横向滚动发生在 `<pre>` 内部**
  （`overflow-x: auto` + `overscroll-behavior-x: contain`），窄屏不撑破页面。
- 复制按钮 `min-height: 28px`；两个图标常驻，靠 `.is-copied` 切换 display，
  不再用 `textContent` 覆盖（那会把图标节点一起清掉，这是修复前的老写法）。

### 20.6 表格

对齐文档站：`border-collapse: collapse`、**无竖线**、只有 `1px` 横向分隔线、
表头 `14px / w600 / padding: 0 8px 8px 0`、单元格 `padding: 8px 8px 8px 0`、
最后一行去掉下边框、去掉斑马纹与表头底色。
唯一的本站差异是表头仍用宋体 —— 和 h2/h3 保持同一套语气。
宽表格一律包在 `.table-scroll`（`overflow-x: auto` + `min-width: 420px`）里，
375px 下由容器自己滚（实测整页 `overflowX = 0`）。

### 20.7 提示块：四种语义

| 类 | 语义 | 左边框 | 底色 | 图标 |
| --- | --- | --- | --- | --- |
| `.note` | 说明 | 石板蓝 `--accent` | `--accent-soft` | `tabler-notes` |
| `.note-tip` | 技巧 | 沙 `--sand` | `--sand-soft` | `tabler-bulb` |
| `.note-info` | 提示 | 天光 `--sky` | `--sky-soft` | `tabler-info-circle` |
| `.note-warning` | 注意 | 墨 `--text` | `--bg-inset` | `tabler-alert-triangle` |

结构是「图标列 + 内容列」的 flex 两栏（图标 `margin-top: 4px`），标题宋体 16px w600。
四种靠**色相**区分，亮暗主题共用同一批令牌，两套主题下相对轻重一致。
（旧的 `.note > .note-head` 结构已被这套取代，站内唯一一处旧标记也一并改写了。）

### 20.8 标题锚点

```html
<h2 id="decrypt">解密 db_storage/*.db<a class="heading-anchor" href="#decrypt"
    aria-label="本节链接" tabindex="-1">#</a></h2>
```

- `tabindex="-1"`：一页几十个标题，全部进 Tab 序列会逼键盘用户按几十次；锚点仍然是
  可点击、可被读屏定位的链接。
- `aria-label="本节链接"`：读屏念的是"本节链接"，不是"井号"。
- `min-width/min-height: 24px`：它不在 `<p>` 里，属于审计里的"块状目标"，
  必须满足 SC 2.5.8。
- 默认 `opacity: 0`，hover 标题或键盘聚焦时出现，不干扰阅读；打印时隐藏。

---

## 21. 2026-09-28 本轮实测（字体 / 图表 / 排版升级后）

命令同第 9 节，本次服务起在 `8361`。

| 页面 | 主题 / 宽度 | 结论 |
| --- | --- | --- |
| 首页 | 亮色 / 1280 | **FAIL 0 / WARN 0**；对比度最低 6.58:1；字号 7 种全在阶内；间距 12 个值全对齐；触达 0 |
| 首页 | 暗色 / 1280 | **FAIL 0 / WARN 0**（同上） |
| 首页 | 亮色 / 375 | **FAIL 0 / WARN 0**；无横向滚动；触达 0 |
| `wechat-4x-db-export.html` | 暗色 / 1280 | **FAIL 0 / WARN 0 / 共 27 项**；正文 35 字/行、引用 40 字/行；对比度最低 6.01:1 |
| `deterministic-browser-automation.html` | 亮色 / 1280 | **FAIL 0 / WARN 0 / 共 27 项** |
| 六篇文章（**图表渲染后**重测） | 亮色 / 1280 | **FAIL 0 / WARN 0**；字号恒为 `[12,13,14,16,18,24,36]`，间距恒为 `[4,8,12,16,20,24,32,40,48,64]`，横向溢出 0 |

> 为什么要"渲染后重测"：`audit_design.py` 不滚动页面，而文章页的图在首屏之外、
> mermaid 还没渲染，SVG 根本没进 DOM。所以补了一个 `_blogup/audit_scroll.py`：
> 先滚到图表、等 `data-processed="true"`，再跑同一份 `audit_expr.js`。
> 结论是 mermaid 生成的 SVG **没有**引入任何越界字号或非 4 倍数间距。

---

## 22. 2026-10 UI 精修 + favicon / 站点标志重做

这一轮只做"精修"：设计语言（石板蓝 + 沙色、宋体标题、3D Hero）一个字没动，
针对截图里实际看到的问题逐条改。所有新增的间距/字号都在第 4 节的令牌内。

### 22.1 节奏与层级

| 位置 | 原来 | 问题 | 现在 |
| --- | --- | --- | --- |
| `.section-title`（最新文章 / 精选项目 / 项目页分组） | 20px | 与卡片标题（20px）同档，1312px 版面里"区块标题"和"卡片标题"一样大，层级立不住 | **24px** —— 读作 页面标题 36 > 区块标题 24 > 卡片标题 20 > 正文 16 > 元信息 13 |
| `.project-name` | 16px | 与卡片正文 14px 只差一档 | **18px** |
| `.post-list` gap | 16px | 比卡片内边距（24px）还小，一排卡片像粘在一起 | **24px**，与 `.project-grid` 统一 |
| `.archive-item` padding | `12px 0` | 归档页要连扫 6~20 条，挤 | `16px 0` |
| `.section-desc` margin-bottom | 20px | 与 `.section-head` 的 24px 不成节奏 | 24px |

### 22.2 Hero：把"刊头"做出来

- `.hero-kicker::before` 原来是孤零零一段 16px 的沙色短线，既不像装饰也不像分隔
  —— 典型的"多余装饰"。现在补一条 `::after` 引满整栏的横线（颜色用 `--border-strong`，
  因为 hero 顶部还压着 `--sky-soft` 渐层，发丝线在那层上根本看不见），
  与 `.year-label::after`、`.section-head` 的下边线成为同一套版式语言。
- 纵向节奏：眉→标题 24、标题→副标题 16、副标题→徽章 32、徽章→按钮 32。
  原来徽章与按钮只隔 24px，首屏里次要信息与行动入口糊成一团。
- `.hero-inner` 的 padding-block 由 `4.5rem/3.5rem` 收到 `4rem/3rem`，重心上移。

### 22.3 卡片：一套语言，而不是两套

- `.post-card` 的"书脊线"原来是 `left:14px` 的 1px 细线，逼得左内边距只能写 32px，
  卡片左右不对称（32/24），线与文字之间还空着 18px。现在把线贴到卡片左沿、加粗到 2px，
  内边距回到对称的 24px —— 它同时与 `.badge` / `.lede` / `.sidebar-quote` /
  `.hero-figure figcaption` 的沙色竖线成为同一套语言。
- 卡片外框由 `--hairline` 换成 `--border`：外框负责"成形"，发丝线负责"分隔"。
  暗色下这一条尤其关键（见 22.4）。
- **项目卡不再拉成等高**：`.project-grid { align-items: start }`，卡片按内容高度排布。
  原来一行里内容差一倍时，短的那张下半截是一大块空白（实测 EPF-Unlocker 那行右卡
  底部空出约 170px），看上去像"洞"；现在空白回到卡片之间，边框勾出的始终是内容。

### 22.4 暗色主题：两处不对称

| 令牌 | 原来 | 问题 | 现在 |
| --- | --- | --- | --- |
| `--surface-warm`（卡片 hover 底色） | `#191a1c` | 比卡片底色 `#1f242c` **更暗**、色相还跳到暖棕 —— 暗色下 hover 像被按下去，与亮色（更暖更亮）语义相反 | `#232a33`（更亮、同色族） |
| `--border` | `#2b313a`（与 `--hairline` 同值） | 暗色下卡片外框 = 发丝线强度，卡片在墨底上糊成一片（这就是"发灰"的来源） | `#39414c`；`--border-strong` 同步抬到 `#4a535f`，hover 才有可见变化 |

亮暗两套主题共用同一批令牌，改一处两套一起走。

### 22.5 正文：引用块与目录不再撞脸

`.prose blockquote` 原来是"浅底 + 左边框 + 2px 圆角"的方块，与 `.toc` 几乎一模一样，
一篇文章里前后脚出现时分不出谁是谁。**引用块去掉底色**，只留一条 2px 沙色竖线；
`.toc` 仍是唯一"浮起的纸"（`--bg-subtle` + 外框）。

### 22.6 首页筛选条 / 标签页

- 首页搜索区里，输入框、状态行、两行标签原来堆在一个白块里，分不清主体。
  现在 `.filter-bar .tag-cloud` 上方补一条发丝线 + 16px 呼吸，把"搜索"与"按主题过滤"分开。
- 标签索引页原先把首组用 `:first-of-type` 抹掉了分隔线，标签云与第一个分组粘在一起；
  现在首组补回同一条线 + 同样的 32/32 呼吸，与组间节奏一致。

### 22.7 favicon 与站点标志（两者统一）

原来的 favicon 是"圆角方块 + 石板蓝→沙色渐变 + 白色上箭头 + 沙色圆点"，
页头 / 页脚挂的是同一支箭头的内联副本。问题不在画得好不好，而在**它是个通用图标**：
与站点的视觉身份（戴兜帽、围着格纹围巾、视线低垂的那幅插画头像）没有任何关系。

现在两者换成**同一份几何**：

- 石板蓝 `#506478` 作底（冬日天空）
- 纸白 `#f2f1ec` 的兜帽拱形（连帽衫）
- 墨 `#141519` 的脸部阴影，拱形开口朝下、被围巾截断 —— 读作"看不见的脸"
- 沙 `#b4a08c` / `#8c7a63` 的格纹围巾

**16×16 的可辨识度**是按像素判的，不是靠肉眼看大图：把 SVG 先光栅化成真正的
16×16 位图再最近邻放大来看，据此做了两个决定 ——

1. 只保留"兜帽 + 脸 + 围巾"三个形状；再多一笔就糊成一团。
2. 围巾做成**单行四格**。先试的是两行错开的正经格纹，16×16 下两行在 2px 内被平均掉，
   糊成一条脏灰带；单行四格每格正好 4px 宽，格纹才真的看得出来。

**落地方式**：`favicon.svg` 成为标志的**唯一来源**。页头 / 页脚原来各自内联一段
`<svg>`（含 `url(assets/icons.svg#brandGrad)` 的跨文件渐变引用），12 个页面共 24 处
现在统一改成：

```html
<img class="brand-mark" src="favicon.svg" width="32" height="32" alt="SupermanCantFly 站点标志">
<!-- posts/ 下写 ../favicon.svg -->
```

于是"浏览器标签页上的图标"与"页头挂的标志"永远是同一个文件，不可能再对不上；
`assets/icons.svg` 里那条只服务旧箭头的 `<linearGradient id="brandGrad">` 一并删掉。

> **为什么是 `<img>` 而不是 sprite 的 `<use>`**：先做的是
> `<use href="assets/icons.svg#brand-mark">`（更 DRY），但实测在 `file://` 下
> Chrome / Firefox 会拒绝**跨文档**的 SVG `<use>` 外部引用 —— 页头只剩文字，
> 而这正好踩中本站"双击 HTML 就能离线阅读"的硬约束。`<img src="favicon.svg">`
> 引用同目录的 svg 不受这条限制，`file://` 与 `http://` 下表现一致。
> （站内那 27 个 Tabler 图标走的就是 sprite + `<use>`，它们在 `file://` 下
> 本来就不显示，这一点没有变化，也不在本轮范围内。）
> `.brand-mark` 的 CSS 同时去掉了 `border-radius: 2px`：现在圆角由 SVG 自己的
> 圆角方块（`rx=9/64`）决定，再叠一层 2px 会把图标的圆角切掉。

### 22.8 `tools/audit_design.py` 的一处修正（重要）

原先 index / projects / about 三页的"焦点外观"会**误报 FAIL**（`none 3px`），
文章页却是 `solid 2px` —— 这正是第 8 节"复现提醒"里记的
"无头 Chrome 里 `document.hasFocus()` 为 false 时探针 `focus()` 不生效"。
现在工具在 attach 之后自己把被测标签页切到前台并打开焦点模拟：

```python
ws.call("Target.activateTarget", {"targetId": t})
ws.call("Emulation.setFocusEmulationEnabled", {"enabled": True}, sess)
```

这样"焦点外观"测的才是样式本身，而不是浏览器窗口有没有被激活。

### 22.9 本轮实测

| 页面 | 主题 / 宽度 | 结论 |
| --- | --- | --- |
| 首页 | 亮色 / 1280 | **FAIL 0 / WARN 0 / 共 16 项**；对比度最低 6.58:1；字号 8 种全在阶内；间距 10 个值全对齐；触达 0 |
| 首页 | 亮色 / 375 | **FAIL 0 / WARN 0**；无横向滚动；触达 0；焦点 solid 2px |
| `wechat-4x-db-export.html` | 亮色 / 1280 | **FAIL 0 / WARN 0 / 共 27 项**；正文 35 字/行、引用 40 字/行；对比度最低 6.01:1 |
| `projects.html` | 亮色 / 1280 | **FAIL 0 / WARN 0 / 共 15 项**；字号 7 种；间距 9 个值全对齐 |
| `about.html` | 亮色 / 1280 | **FAIL 0 / WARN 0 / 共 24 项** |
| `check_blog.py` | — | 全部通过（781 处 href/src、182 个锚点、12 个 HTML、2 个 XML） |

字号档位由 7 种变为 8 种，多出来的是 `.project-name` 的 18px，仍在模数字阶内。
