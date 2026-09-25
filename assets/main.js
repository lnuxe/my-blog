/*!
 * SupermanCantFly · 站点脚本
 * 纯原生 JavaScript，无任何外部依赖，可离线运行。
 * 功能：主题切换（localStorage + 系统偏好）、移动端导航、首页搜索与标签筛选、
 *      标签页筛选、代码复制、阅读进度、返回顶部、当前导航高亮。
 */
(function () {
  'use strict';

  var THEME_KEY = 'scf:theme';
  var root = document.documentElement;
  var prefersDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  /* 主题切换后要重画 mermaid 图（主题变量在 initialize 时固定）。
     由 initDiagrams() 赋值；页面上没有图表时它一直是 null。 */
  var diagramReload = null;

  function storedTheme() {
    try { return window.localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function saveTheme(value) {
    try { window.localStorage.setItem(THEME_KEY, value); } catch (e) { /* 隐私模式下忽略 */ }
  }
  function systemTheme() {
    return prefersDark && prefersDark.matches ? 'dark' : 'light';
  }
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    /* 与 css 第 01 节的 --bg 保持一致：亮色是纸白 #e9e7df，暗色是墨色 #141519 */
    if (meta) { meta.setAttribute('content', theme === 'dark' ? '#141519' : '#e9e7df'); }
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      var label = theme === 'dark' ? '切换到浅色主题' : '切换到深色主题';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
    if (diagramReload) { diagramReload(); }
  }

  /* 主题：初始化 */
  applyTheme(storedTheme() || systemTheme());

  /* 系统主题变化时，仅在用户未手动选择的情况下跟随 */
  if (prefersDark && prefersDark.addEventListener) {
    prefersDark.addEventListener('change', function (event) {
      if (!storedTheme()) { applyTheme(event.matches ? 'dark' : 'light'); }
    });
  }

  function initThemeToggle() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) { return; }
    btn.setAttribute('aria-pressed', root.getAttribute('data-theme') === 'dark' ? 'true' : 'false');
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveTheme(next);
    });
  }

  /* 移动端导航 */
  function initNav() {
    var toggle = document.getElementById('nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) { return; }

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
    }

    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) { setOpen(false); }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (!nav.classList.contains('is-open')) { return; }
      if (nav.contains(event.target) || toggle.contains(event.target)) { return; }
      setOpen(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 720 && nav.classList.contains('is-open')) { setOpen(false); }
    });
  }

  /* 当前页面导航高亮（静态站点常见需求） */
  function initActiveNav() {
    var here = window.location.pathname.split('/').pop() || 'index.html';
    var links = document.querySelectorAll('.site-nav a[href]');
    Array.prototype.forEach.call(links, function (link) {
      var target = link.getAttribute('href').split('/').pop();
      if (target === here) { link.setAttribute('aria-current', 'page'); }
    });
  }

  /* 搜索 / 标签筛选（首页与标签页共用） */
  function normalize(text) {
    return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function initFilter() {
    var input = document.getElementById('post-search');
    var list = document.getElementById('post-list');
    if (!input || !list) { return; }

    var cards = Array.prototype.slice.call(list.querySelectorAll('[data-post]'));
    var status = document.getElementById('filter-status');
    var empty = document.getElementById('no-results');
    var clearBtn = document.getElementById('search-clear');
    var tagButtons = Array.prototype.slice.call(document.querySelectorAll('[data-tag-filter]'));
    var activeTag = '';

    function cardText(card) {
      return normalize([
        card.getAttribute('data-title'),
        card.getAttribute('data-tags'),
        card.getAttribute('data-excerpt'),
        card.getAttribute('data-date'),
        card.textContent
      ].join(' '));
    }

    var index = cards.map(function (card) {
      return { el: card, text: cardText(card), tags: normalize(card.getAttribute('data-tags')) };
    });

    function matchesTags(entry) {
      if (!activeTag) { return true; }
      return (' ' + entry.tags.replace(/[,，]/g, ' ') + ' ').indexOf(' ' + activeTag + ' ') !== -1;
    }

    function matchesKeywords(entry, keywords) {
      if (!keywords.length) { return true; }
      return keywords.every(function (word) { return entry.text.indexOf(word) !== -1; });
    }

    function render() {
      var keywords = normalize(input.value).split(' ').filter(Boolean);
      var visible = 0;

      index.forEach(function (entry) {
        var ok = matchesTags(entry) && matchesKeywords(entry, keywords);
        entry.el.classList.toggle('is-hidden', !ok);
        if (ok) { visible += 1; }
      });

      if (empty) { empty.classList.toggle('is-visible', visible === 0); }

      if (status) {
        var parts = [];
        if (keywords.length) { parts.push('关键词「' + keywords.join(' ') + '」'); }
        if (activeTag) { parts.push('标签「' + activeTag + '」'); }
        status.textContent = parts.length
          ? '匹配 ' + visible + ' / ' + index.length + ' 篇文章（' + parts.join(' + ') + '）'
          : '共 ' + index.length + ' 篇文章';
      }

      if (clearBtn) { clearBtn.classList.toggle('is-visible', input.value.length > 0); }
    }

    input.addEventListener('input', render);

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        input.value = '';
        input.focus();
        render();
      });
    }

    tagButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tag = btn.getAttribute('data-tag-filter');
        activeTag = activeTag === tag ? '' : tag;
        tagButtons.forEach(function (other) {
          other.setAttribute('aria-pressed', other === btn && activeTag ? 'true' : 'false');
        });
        render();
      });
    });

    /* 支持从其他页面带 ?tag=xxx 跳转过来 */
    var query = window.location.search.match(/[?&]tag=([^&]+)/);
    if (query) {
      var wanted = normalize(decodeURIComponent(query[1]));
      var hit = tagButtons.filter(function (btn) {
        return normalize(btn.getAttribute('data-tag-filter')) === wanted;
      })[0];
      if (hit) { hit.click(); }
    }

    /* 键盘快捷键：按 / 聚焦搜索框 */
    document.addEventListener('keydown', function (event) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) { return; }
      var tag = (event.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || event.target.isContentEditable) { return; }
      event.preventDefault();
      input.focus();
      input.select();
    });

    render();
  }

  /* 标签页：按标签筛选分组 */
  function initTagPage() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-tag-jump]'));
    var sections = Array.prototype.slice.call(document.querySelectorAll('[data-tag-section]'));
    if (!buttons.length || !sections.length) { return; }

    var status = document.getElementById('tag-filter-status');

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tag = btn.getAttribute('data-tag-jump');
        var isActive = btn.getAttribute('aria-pressed') === 'true';
        var next = isActive ? '' : tag;

        buttons.forEach(function (other) {
          other.setAttribute('aria-pressed', other === btn && next ? 'true' : 'false');
        });

        var shown = 0;
        sections.forEach(function (section) {
          var match = !next || section.getAttribute('data-tag-section') === next;
          section.hidden = !match;
          if (match) { shown += 1; }
        });

        if (status) {
          status.textContent = next
            ? '正在查看标签「' + next + '」下的 ' + shown + ' 个分组'
            : '共 ' + sections.length + ' 个标签';
        }

        if (next) {
          var first = sections.filter(function (s) { return !s.hidden; })[0];
          if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        }
      });
    });

    /* 支持从首页带 ?tag=xxx 跳转过来 */
    var query = window.location.search.match(/[?&]tag=([^&]+)/);
    if (query) {
      var wanted = normalize(decodeURIComponent(query[1]));
      var hit = buttons.filter(function (btn) {
        return normalize(btn.getAttribute('data-tag-jump')) === wanted;
      })[0];
      if (hit) { hit.click(); }
    }
  }

  /* ---- 图标 sprite 的小工具 -------------------------------------------
     sprite 的路径必须是**相对当前页面**的：posts/ 下是 ../assets/icons.svg，
     根目录下是 assets/icons.svg。这里直接从页面里已有的 <use href> 推出前缀，
     不再把 "assets/icons.svg" 写死 —— 之前写死的那一版在文章页里是 404，
     复制按钮的图标一直是空的。 */
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function spriteBase() {
    var use = document.querySelector('use[href]');
    if (use) {
      var href = use.getAttribute('href') || '';
      var cut = href.indexOf('#');
      if (cut > 0) { return href.slice(0, cut); }
    }
    return 'assets/icons.svg';
  }

  function svgIcon(id, cls) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', cls || 'i');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', spriteBase() + '#' + id);
    svg.appendChild(use);
    return svg;
  }

  function copyText(text, done) {
    function fallback() {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.top = '-1000px';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* 忽略 */ }
      document.body.removeChild(area);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  }

  /* 复制按钮：复制 → 对勾，1.6s 后复位。
     两个图标都常驻在按钮里，靠 .is-copied 切 display，
     不再用 textContent 覆盖（那会把图标节点一起清掉）。 */
  function copyButton(label, idleLabel, doneLabel, cls) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = cls;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.appendChild(svgIcon('tabler-copy', 'i ic-copy'));
    btn.appendChild(svgIcon('tabler-check', 'i ic-done'));
    var text = document.createElement('span');
    text.textContent = idleLabel;
    btn.appendChild(text);
    btn.markDone = function () {
      btn.classList.add('is-copied');
      text.textContent = doneLabel;
      window.setTimeout(function () {
        btn.classList.remove('is-copied');
        text.textContent = idleLabel;
      }, 1600);
    };
    return btn;
  }

  /* 代码块：顶部 header（左语言名 · 右复制按钮）。
     语言名来自 HTML 上写死的 .code-lang；只有没写的时候才退回 data-lang，
     再退回代码围栏式的 "code"。 */
  function initCodeCopy() {
    var pres = document.querySelectorAll('.prose pre');
    Array.prototype.forEach.call(pres, function (pre) {
      var code = pre.querySelector('code');
      if (!code) { return; }

      var block = pre.closest('.code-block');
      if (!block) {
        block = document.createElement('div');
        block.className = 'code-block';
        pre.parentNode.insertBefore(block, pre);
        block.appendChild(pre);
      }

      var bar = block.querySelector('.code-bar');
      if (!bar) {
        bar = document.createElement('div');
        bar.className = 'code-bar';
        var name = block.getAttribute('data-lang');
        if (name) {
          var chip = document.createElement('span');
          chip.className = 'code-lang';
          chip.textContent = name;
          bar.appendChild(chip);
        }
        block.insertBefore(bar, block.firstChild);
      } else if (!bar.querySelector('.code-lang')) {
        var fallback = document.createElement('span');
        fallback.className = 'code-lang';
        fallback.textContent = block.getAttribute('data-lang') || 'code';
        bar.insertBefore(fallback, bar.firstChild);
      }

      if (bar.querySelector('.code-copy')) { return; }
      var btn = copyButton('复制这段代码', '复制', '已复制', 'code-copy');
      btn.addEventListener('click', function () {
        copyText(code.textContent, btn.markDone);
      });
      bar.appendChild(btn);
    });
  }

  /* ---- 图表（mermaid）：只在含图表的页面懒加载 --------------------------
     页面上没有 .diagram 时这个函数直接返回，3.3 MB 的 mermaid.min.js
     根本不会被请求 —— 首页 / 项目 / 归档 / 标签 / 关于 / 404 都不加载它。
     有图表时也要等第一张图接近视口（rootMargin 400px）才插入 <script>。
     渲染不出来（脚本缺失、语法错误）时保持"源码 + mermaid 语言标识"的
     代码块形态，不是空白。 */

  var MERMAID_FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", ' +
    '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", ' +
    '"Source Han Sans SC", Roboto, Helvetica, Arial, system-ui, sans-serif';

  /* 配色调色板：石板蓝 #506478 / 沙 #b4a08c / 墨 #141519 / 纸 #f2f1ec。
     亮暗两套变量用的是同一批色，只是明暗关系对调，所以两种主题下
     节点的相对轻重一致。 */
  function mermaidThemeVariables(dark) {
    if (dark) {
      return {
        darkMode: true,
        background: '#1b1f26',
        primaryColor: '#1f242c',
        primaryTextColor: '#eceae3',
        primaryBorderColor: '#8ea3b8',
        secondaryColor: '#262b34',
        secondaryTextColor: '#eceae3',
        secondaryBorderColor: '#b4a08c',
        tertiaryColor: '#171b21',
        tertiaryTextColor: '#eceae3',
        tertiaryBorderColor: '#3c434c',
        lineColor: '#b4a08c',
        textColor: '#c3c7cd',
        nodeTextColor: '#eceae3',
        titleColor: '#eceae3',
        edgeLabelBackground: '#1b1f26',
        clusterBkg: '#171b21',
        clusterBorder: '#3c434c',
        noteBkgColor: '#262b34',
        noteTextColor: '#eceae3',
        noteBorderColor: '#b4a08c',
        actorBkg: '#1f242c',
        actorBorder: '#8ea3b8',
        actorTextColor: '#eceae3',
        actorLineColor: '#3c434c',
        signalColor: '#c3c7cd',
        signalTextColor: '#c3c7cd',
        labelBoxBkgColor: '#262b34',
        labelBoxBorderColor: '#b4a08c',
        labelTextColor: '#eceae3',
        loopTextColor: '#eceae3',
        activationBorderColor: '#8ea3b8',
        activationBkgColor: '#262b34',
        sequenceNumberColor: '#141519',
        fontSize: '16px'
      };
    }
    return {
      darkMode: false,
      background: '#f2f1ec',
      primaryColor: '#dfe4e8',
      primaryTextColor: '#141519',
      primaryBorderColor: '#506478',
      secondaryColor: '#e8dfd3',
      secondaryTextColor: '#141519',
      secondaryBorderColor: '#b4a08c',
      tertiaryColor: '#f7f6f2',
      tertiaryTextColor: '#141519',
      tertiaryBorderColor: '#c6c2b6',
      lineColor: '#506478',
      textColor: '#3a4148',
      nodeTextColor: '#141519',
      titleColor: '#141519',
      edgeLabelBackground: '#f2f1ec',
      clusterBkg: '#f7f6f2',
      clusterBorder: '#c6c2b6',
      noteBkgColor: '#e8dfd3',
      noteTextColor: '#141519',
      noteBorderColor: '#b4a08c',
      actorBkg: '#dfe4e8',
      actorBorder: '#506478',
      actorTextColor: '#141519',
      actorLineColor: '#8c7a63',
      signalColor: '#3a4148',
      signalTextColor: '#3a4148',
      labelBoxBkgColor: '#e8dfd3',
      labelBoxBorderColor: '#b4a08c',
      labelTextColor: '#141519',
      loopTextColor: '#141519',
      activationBorderColor: '#506478',
      activationBkgColor: '#dfe4e8',
      sequenceNumberColor: '#f2f1ec',
      fontSize: '16px'
    };
  }

  function initDiagrams() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('.diagram .mermaid'));
    if (!nodes.length) { return; }

    var sources = nodes.map(function (node) {
      return (node.textContent || '').replace(/^\s+|\s+$/g, '');
    });
    var figures = nodes.map(function (node) { return node.closest('.diagram'); });
    var zoomButtons = [];
    var bodies = [];

    function titleOf(index) {
      var fig = figures[index];
      var el = fig ? fig.querySelector('.diagram-title') : null;
      var text = el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
      return text || '图表';
    }

    /* 工具条是 JS 注入的：没有 JS 时页面上不会出现两个按不动的按钮，
       只剩"mermaid 语言标识 + 源码"，那才是最干净的降级形态。 */
    nodes.forEach(function (node, index) {
      var fig = figures[index];
      if (!fig) { return; }
      var tools = fig.querySelector('[data-diagram-tools]');
      if (!tools) {
        tools = document.createElement('span');
        tools.className = 'diagram-tools';
        tools.setAttribute('data-diagram-tools', '');
        var bar = fig.querySelector('.diagram-bar');
        if (bar) { bar.appendChild(tools); } else { fig.insertBefore(tools, fig.firstChild); }
      }
      tools.hidden = false;

      var copyBtn = copyButton('复制这张图表的 mermaid 源码', '复制源码', '已复制', 'diagram-btn');
      copyBtn.addEventListener('click', function () {
        copyText(sources[index], copyBtn.markDone);
      });

      var zoomBtn = document.createElement('button');
      zoomBtn.type = 'button';
      zoomBtn.className = 'diagram-btn';
      zoomBtn.disabled = true; /* 渲染成功后才可点 */
      zoomBtn.setAttribute('aria-label', titleOf(index) + '：放大查看');
      zoomBtn.setAttribute('title', '放大查看');
      zoomBtn.appendChild(svgIcon('tabler-zoom-in', 'i'));
      var zoomText = document.createElement('span');
      zoomText.textContent = '放大查看';
      zoomBtn.appendChild(zoomText);
      zoomBtn.addEventListener('click', function () { openLightbox(sources[index], titleOf(index)); });

      tools.appendChild(copyBtn);
      tools.appendChild(zoomBtn);
      zoomButtons[index] = zoomBtn;
      bodies[index] = node.parentNode;
    });

    function markRendered(index) {
      var node = nodes[index];
      node.setAttribute('data-processed', 'true');
      if (zoomButtons[index]) { zoomButtons[index].disabled = false; }
      var body = bodies[index];
      if (!body || body.hasAttribute('data-zoomable')) { return; }
      body.setAttribute('data-zoomable', '');
      body.setAttribute('role', 'button');
      body.setAttribute('tabindex', '0');
      body.setAttribute('aria-label', titleOf(index) + '：放大查看');
      body.addEventListener('click', function () { openLightbox(sources[index], titleOf(index)); });
      body.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
          event.preventDefault();
          openLightbox(sources[index], titleOf(index));
        }
      });
    }

    function applyConfig() {
      var dark = root.getAttribute('data-theme') === 'dark';
      window.mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: mermaidThemeVariables(dark),
        fontFamily: MERMAID_FONT,
        /* htmlLabels:false —— 标签走 SVG <text>，不生成 foreignObject 里的 HTML，
           这样中文换行、基线、以及审计读到的字号都更可控 */
        flowchart: {
          htmlLabels: false,
          useMaxWidth: true,
          curve: 'basis',
          padding: 12,
          nodeSpacing: 40,
          rankSpacing: 48
        },
        sequence: {
          useMaxWidth: true,
          actorFontSize: 14,
          noteFontSize: 14,
          messageFontSize: 16,
          actorMargin: 48,
          boxMargin: 8,
          mirrorActors: false
        },
        state: { useMaxWidth: true }
      });
    }

    function resetNode(index) {
      nodes[index].textContent = sources[index];
      nodes[index].removeAttribute('data-processed');
    }

    /* 一张一张渲染：某一张语法有问题时，只有那一张退回源码形态，
       不会把整页的图一起拖垮。 */
    function renderAll() {
      if (!window.mermaid) { return; }
      applyConfig();
      var chain = Promise.resolve();
      nodes.forEach(function (node, index) {
        chain = chain.then(function () {
          resetNode(index);
          return window.mermaid.run({ nodes: [node] }).then(function () {
            markRendered(index);
          }).catch(function () {
            nodes[index].removeAttribute('data-processed');
            nodes[index].textContent = sources[index];
          });
        });
      });
      return chain;
    }

    var loading = false;
    function ensureMermaid() {
      if (window.mermaid) { renderAll(); return; }
      if (loading) { return; }
      loading = true;
      var src = document.body.getAttribute('data-mermaid-src') || 'assets/vendor/mermaid.min.js';
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = function () { loading = false; renderAll(); };
      script.onerror = function () { loading = false; /* 保持源码形态 */ };
      document.head.appendChild(script);
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            io.disconnect();
            ensureMermaid();
            return;
          }
        }
      }, { rootMargin: '400px 0px' });
      io.observe(nodes[0]);
    } else {
      ensureMermaid();
    }

    /* 主题切换后重画：mermaid 的主题变量是 initialize 时固定的 */
    diagramReload = function () {
      if (window.mermaid) { renderAll(); }
    };
  }

  /* ---- 灯箱：点图放大 ---------------------------------------------------
     · 打开时把焦点移到"关闭"，并把焦点锁在对话框内（Tab 循环）；
     · Esc / 点遮罩 / 关闭按钮都能退出，退出后焦点回到原来那个元素；
     · 缩放 25%–400%，步长 25%，打开时先按窗口"适配"一次；
     · 舞台可以按住拖动平移；
     · 节点在关闭时整体移除，页面上不留隐藏的大块 DOM。 */
  var lightboxSeq = 0;

  function openLightbox(source, title) {
    if (!window.mermaid || !source) { return; }

    var opener = document.activeElement;
    var wrap = document.createElement('div');
    wrap.className = 'lightbox';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', title + '：放大查看');

    var backdrop = document.createElement('div');
    backdrop.className = 'lightbox-backdrop';

    var panel = document.createElement('div');
    panel.className = 'lightbox-panel';

    var bar = document.createElement('div');
    bar.className = 'lightbox-bar';
    var heading = document.createElement('span');
    heading.className = 'lightbox-title';
    heading.textContent = title;

    var tools = document.createElement('div');
    tools.className = 'lightbox-tools';

    function mkBtn(iconId, label, text) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lightbox-btn';
      b.setAttribute('aria-label', label);
      b.setAttribute('title', label);
      if (iconId) { b.appendChild(svgIcon(iconId, 'i')); }
      if (text) {
        var span = document.createElement('span');
        span.textContent = text;
        b.appendChild(span);
      }
      return b;
    }

    var btnOut = mkBtn('tabler-zoom-out', '缩小');
    var zoomReadout = document.createElement('span');
    zoomReadout.className = 'lightbox-zoom';
    zoomReadout.setAttribute('aria-live', 'polite');
    var btnIn = mkBtn('tabler-zoom-in', '放大');
    var btnReset = mkBtn(null, '恢复适配大小', '重置');
    var btnClose = mkBtn('tabler-x', '关闭（Esc）');

    tools.appendChild(btnOut);
    tools.appendChild(zoomReadout);
    tools.appendChild(btnIn);
    tools.appendChild(btnReset);
    tools.appendChild(btnClose);
    bar.appendChild(heading);
    bar.appendChild(tools);

    var stage = document.createElement('div');
    stage.className = 'lightbox-stage';
    stage.setAttribute('tabindex', '0');
    stage.setAttribute('aria-label', '图表画布，可拖动平移');

    panel.appendChild(bar);
    panel.appendChild(stage);
    wrap.appendChild(backdrop);
    wrap.appendChild(panel);

    var bodyWasOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.appendChild(wrap);
    btnClose.focus();

    var svgEl = null;
    var natural = { w: 800, h: 600 };
    var fitScale = 1;
    var scale = 1;

    function applyScale() {
      if (!svgEl) { return; }
      svgEl.setAttribute('width', Math.round(natural.w * scale));
      svgEl.setAttribute('height', Math.round(natural.h * scale));
      zoomReadout.textContent = Math.round(scale * 100) + '%';
      btnOut.disabled = scale <= 0.25 + 1e-6;
      btnIn.disabled = scale >= 4 - 1e-6;
    }

    /* 初始适配用**精确值**（读数可能是 91% 这种），不往 25% 档位上取整 ——
       取整会把它抬到 100%，图就被截掉一截。±按钮才按 25% 步进。 */
    function setScale(next) {
      scale = Math.min(4, Math.max(0.25, next));
      applyScale();
    }

    function stepScale(delta) {
      setScale(Math.round((scale + delta) * 4) / 4);
    }

    function resetFit() { setScale(fitScale); }

    btnOut.addEventListener('click', function () { stepScale(-0.25); });
    btnIn.addEventListener('click', function () { stepScale(0.25); });
    btnReset.addEventListener('click', resetFit);

    function close() {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = bodyWasOverflow;
      if (wrap.parentNode) { wrap.parentNode.removeChild(wrap); }
      if (opener && opener.focus && document.contains(opener)) { opener.focus(); }
    }

    function focusables() {
      return Array.prototype.filter.call(
        panel.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
        function (el) { return el.offsetWidth > 0 || el.offsetHeight > 0; }
      );
    }

    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === 'Tab') {
        var list = focusables();
        if (!list.length) { return; }
        var first = list[0];
        var last = list[list.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
      if (event.key === '+' || event.key === '=') { event.preventDefault(); stepScale(0.25); }
      else if (event.key === '-' || event.key === '_') { event.preventDefault(); stepScale(-0.25); }
      else if (event.key === '0') { event.preventDefault(); resetFit(); }
    }

    document.addEventListener('keydown', onKey, true);
    backdrop.addEventListener('click', close);
    btnClose.addEventListener('click', close);

    /* 按住拖动平移 */
    var panning = false, panX = 0, panY = 0, panLeft = 0, panTop = 0;
    stage.addEventListener('pointerdown', function (event) {
      if (event.button !== 0) { return; }
      panning = true;
      panX = event.clientX;
      panY = event.clientY;
      panLeft = stage.scrollLeft;
      panTop = stage.scrollTop;
      stage.style.cursor = 'grabbing';
    });
    stage.addEventListener('pointermove', function (event) {
      if (!panning) { return; }
      stage.scrollLeft = panLeft - (event.clientX - panX);
      stage.scrollTop = panTop - (event.clientY - panY);
    });
    function endPan() {
      if (!panning) { return; }
      panning = false;
      stage.style.cursor = 'grab';
    }
    stage.addEventListener('pointerup', endPan);
    stage.addEventListener('pointercancel', endPan);
    stage.addEventListener('pointerleave', endPan);

    /* 用同一份源码重新渲染一份，而不是克隆页面上那个 SVG：
       克隆会带上重复的 id，而 mermaid 的样式是靠 #id 选择器生效的。
       重新 render 出来的 SVG 有独立 id 和自己的 <style>，缩放时不会互相干扰。 */
    window.mermaid.render('scf-diagram-' + (++lightboxSeq), source).then(function (result) {
      stage.innerHTML = result.svg || '';
      svgEl = stage.querySelector('svg');
      if (!svgEl) { return; }
      svgEl.removeAttribute('style');
      var vb = svgEl.viewBox && svgEl.viewBox.baseVal;
      natural.w = (vb && vb.width) || 800;
      natural.h = (vb && vb.height) || 600;
      var availW = Math.min(1120, window.innerWidth - 48) - 32;
      var availH = window.innerHeight - 48 - 72 - 32;
      fitScale = Math.max(0.25, Math.min(availW / natural.w, availH / natural.h, 1));
      resetFit();
      if (typeof result.bindFunctions === 'function') { result.bindFunctions(stage); }
    }).catch(function () {
      stage.textContent = '图表渲染失败，请用「复制源码」把 mermaid 源码取走。';
    });
  }

  /* 阅读进度 + 返回顶部 */
  function initScrollUI() {
    var bar = document.getElementById('progress-bar');
    var top = document.getElementById('back-to-top');
    if (!bar && !top) { return; }

    var ticking = false;

    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (bar) { bar.style.width = (ratio * 100).toFixed(2) + '%'; }
      if (top) { top.classList.toggle('is-visible', window.scrollY > 600); }
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });

    window.addEventListener('resize', update);
    update();

    if (top) {
      top.addEventListener('click', function () {
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      });
    }
  }

  function init() {
    initThemeToggle();
    initNav();
    initActiveNav();
    initFilter();
    initTagPage();
    initCodeCopy();
    initDiagrams();
    initScrollUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
