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

  /* 代码块复制按钮 */
  function initCodeCopy() {
    var blocks = document.querySelectorAll('.prose pre');
    Array.prototype.forEach.call(blocks, function (pre) {
      var code = pre.querySelector('code');
      if (!code) { return; }

      var wrapper = document.createElement('div');
      wrapper.className = 'code-block';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code-copy';
      /* 图标来自本地 sprite（assets/icons.svg），无外部请求；
         路径同样相对页面，posts/ 下会自动解析成 ../assets/icons.svg */
      var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('class', 'i');
      icon.setAttribute('aria-hidden', 'true');
      icon.setAttribute('focusable', 'false');
      var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', 'assets/icons.svg#tabler-copy');
      icon.appendChild(use);
      btn.appendChild(icon);
      btn.appendChild(document.createTextNode('复制'));
      btn.setAttribute('aria-label', '复制这段代码');
      wrapper.appendChild(btn);

      btn.addEventListener('click', function () {
        var text = code.textContent;
        function done() {
          btn.textContent = '已复制';
          /* textContent 会把图标节点一并清掉，这里重新挂回去 */
          if (!btn.querySelector('svg')) { btn.insertBefore(icon.cloneNode(true), btn.firstChild); }
          btn.classList.add('is-copied');
          window.setTimeout(function () {
            btn.textContent = '复制';
            if (!btn.querySelector('svg')) { btn.insertBefore(icon.cloneNode(true), btn.firstChild); }
            btn.classList.remove('is-copied');
          }, 1600);
        }
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
      });
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
    initScrollUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
