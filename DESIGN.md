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
