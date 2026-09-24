/* ==========================================================================
   cards3d.js —— 卡片景深（Atropos 2.0.2 的初始化，MIT）
   --------------------------------------------------------------------------
   · 只在有卡片的页面加载（index.html / projects.html），依赖本地自带的
     assets/vendor/atropos.min.js
   · 必须挂在 DOMContentLoaded 之后（main.js 的脚本标签要放在本文件之后），
     这样首页搜索筛选已经把不匹配的卡片置为 hidden，跳过它们省开销
   · 启用条件（两条都满足才初始化）：
       1. window.matchMedia('(hover: hover) and (pointer: fine)') 命中
       2. 没有 prefers-reduced-motion: reduce
   · 不满足条件时不做任何 DOM 改动，卡片完全由 CSS 正常呈现
   · 没有 JS 时卡片照常可读可用：vendor/atropos.min.css 只做布局与 3D 变换，
     不隐藏任何内容
   ========================================================================== */
(function () {
  'use strict';

  function matches(query, fallback) {
    try {
      if (!window.matchMedia) { return fallback; }
      return window.matchMedia(query).matches;
    } catch (error) {
      return fallback;
    }
  }

  function init() {
    try {
      if (typeof window.Atropos !== 'function') { return; }
      if (!matches('(hover: hover) and (pointer: fine)', false)) { return; }
      if (matches('(prefers-reduced-motion: reduce)', false)) { return; }

      var cards = document.querySelectorAll('.atropos');
      Array.prototype.forEach.call(cards, function (el) {
        if (el.hidden || el.closest('[hidden]')) { return; }
        if (el.__atropos__) { return; }
        try {
          window.Atropos({
            el: el,
            rotateXMax: 6,
            rotateYMax: 9,
            rotateTouch: false,   // 触屏没有 hover，交给原生滚动
            duration: 420,
            activeOffset: 16,     // 悬停时卡片整体向前 16px
            shadow: false,        // 阴影用 CSS 变量自己画（见 style.css 第 17 节）
            highlight: false,     // 高光同样由 CSS 控制，保证两套主题都不刺眼
            onEnter: function () { el.classList.add('is-tilting'); },
            onLeave: function () { el.classList.remove('is-tilting'); }
          });
        } catch (error) {
          /* 单张卡片出错不影响其它卡片 */
        }
      });
    } catch (error) {
      /* 装饰性增强，整体失败也只是没有 3D 效果 */
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
