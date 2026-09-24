/* ==========================================================================
   hero3d.js —— 首页 Hero 的 3D 星图背景（唯一使用 three.js 的文件）
   --------------------------------------------------------------------------
   · 只在 index.html 加载，其他页面不引用
   · 普通脚本（非 module、无 fetch），因此 file:// 双击打开也能运行
   · 依赖本地自带的 assets/vendor/three.min.js（three.js r160，MIT）
   · 颜色全部读自 CSS 变量（--accent / --bg），亮色与暗色主题都成立，
     切换主题时通过 MutationObserver 重新读取
   · 纯装饰：canvas 恒为 pointer-events:none，不参与布局，不影响可读性
   · 优雅降级：WebGL 不可用或任何异常 → 画布保持 hidden，Hero 与原来完全一致
   ========================================================================== */
(function () {
  'use strict';

  /* ---- 动画参数（单位：世界坐标） ---- */
  var FIELD = { x: 170, y: 96, z: 260 };  // 粒子场尺寸（z 是进深，越深漂移越从容）
  var CAM_Z = 62;                          // 相机到粒子场中心的距离
  var MAX_PARTICLES = 520;
  var NEAR_Z = 100;                        // 漂到这个深度（相机附近）就回收
  var FAR_Z = -145;                        // 回收后重新放到最远处，慢慢向相机漂来
  var LINK_GAP = 15;                       // 连线的最大间距

  /* ---- 主题配色：从 CSS 变量读，不写死颜色 ---- */
  var FALLBACK = { accent: '#1a5fd0', bg: '#ffffff' };

  function cssVar(name, fallback) {
    try {
      var value = window.getComputedStyle(document.documentElement).getPropertyValue(name);
      value = value ? value.trim() : '';
      return value || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function themeColors() {
    var accent = cssVar('--accent', FALLBACK.accent);
    var bg = cssVar('--bg', FALLBACK.bg);
    var main = new THREE.Color(accent);
    var soft = new THREE.Color(accent).lerp(new THREE.Color(bg), 0.45);
    var line = new THREE.Color(accent).lerp(new THREE.Color(bg), 0.42);
    return { main: main, soft: soft, line: line, bg: new THREE.Color(bg) };
  }

  function hasWebGL() {
    try {
      var probe = document.createElement('canvas');
      var context = probe.getContext('webgl2') || probe.getContext('webgl') ||
        probe.getContext('experimental-webgl');
      return !!context;
    } catch (error) {
      return false;
    }
  }

  function reducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (error) {
      return false;
    }
  }

  function init() {
    var canvas = document.querySelector('[data-hero3d]');
    if (!canvas) { return; }
    if (!window.THREE || typeof window.THREE.WebGLRenderer !== 'function') { return; }
    if (!hasWebGL()) { return; }

    var count = Math.min(MAX_PARTICLES, Math.max(200, Math.round(window.innerWidth / 3)));
    var colors = themeColors();
    try { window.__hero3dDebug = { count: count, canvas: canvas }; } catch (dx) {}

    /* ---- 渲染器 ---- */
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      preserveDrawingBuffer: true,
      antialias: true,
      powerPreference: 'low-power'
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(1); // 真实像素比在 resize() 里按 DPR 上限 2 计算

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, 1, 1, 700);
    camera.position.set(0, 0, CAM_Z);

    var group = new THREE.Group();
    scene.add(group);

    /* ---- 粒子场：沿 z 轴缓慢漂移，出界后回收 ---- */
    var position = new Float32Array(count * 3);
    var colorArray = new Float32Array(count * 3);
    var base = new Float32Array(count * 3);
    var size = new Float32Array(count);
    var speed = new Float32Array(count);
    var phase = new Float32Array(count);

    for (var i = 0; i < count; i++) {
      var i3 = i * 3;
      base[i3] = (Math.random() * 2 - 1) * (FIELD.x / 2);
      base[i3 + 1] = (Math.random() * 2 - 1) * (FIELD.y / 2);
      base[i3 + 2] = (Math.random() * 2 - 1) * (FIELD.z / 2);
      position[i3] = base[i3];
      position[i3 + 1] = base[i3 + 1];
      position[i3 + 2] = base[i3 + 2];
      size[i] = 1 + Math.random() * 2.2;   // 近处的粒子会自然变大，别太抢戏
      speed[i] = 4 + Math.random() * 9;   // 每秒前进的世界单位：慢了才有「漂」的感觉
      phase[i] = Math.random() * Math.PI * 2;
    }

    var geometry = new THREE.BufferGeometry();
    var positionAttr = new THREE.BufferAttribute(position, 3);
    var colorAttr = new THREE.BufferAttribute(colorArray, 3);
    positionAttr.setUsage(THREE.DynamicDrawUsage);
    colorAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', positionAttr);
    geometry.setAttribute('color', colorAttr);

    var material = new THREE.PointsMaterial({
      size: 1,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });

    var particles = new THREE.Points(geometry, material);
    group.add(particles);

    /* ---- 很淡的连线：每个粒子连向它前方的近邻，移动时保持稳定 ---- */
    var linkCapacity = Math.ceil(count * 1.2);
    var linkPositions = new Float32Array(linkCapacity * 6);
    var linkColors = new Float32Array(linkCapacity * 6);
    var linkGeometry = new THREE.BufferGeometry();
    var linkPositionAttr = new THREE.BufferAttribute(linkPositions, 3);
    var linkColorAttr = new THREE.BufferAttribute(linkColors, 3);
    linkPositionAttr.setUsage(THREE.DynamicDrawUsage);
    linkColorAttr.setUsage(THREE.DynamicDrawUsage);
    linkGeometry.setAttribute('position', linkPositionAttr);
    linkGeometry.setAttribute('color', linkColorAttr);

    var links = new THREE.LineSegments(linkGeometry, new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    }));
    links.frustumCulled = false;
    group.add(links);

    var linkCount = 0;

    /* ---- 主题换色 ---- */
    function applyColors() {
      colors = themeColors();
      var j3;
      for (var j = 0; j < count; j++) {
        j3 = j * 3;
        var tint = 0.5 + 0.5 * (size[j] / 3.2);
        colorArray[j3] = colors.soft.r * tint;
        colorArray[j3 + 1] = colors.soft.g * tint;
        colorArray[j3 + 2] = colors.soft.b * tint;
      }
      colorAttr.needsUpdate = true;
      rebuildLinks();
    }

    /* 每个粒子连向它「前方」（z 更大）的最近邻。
       先把下标按 z 升序排一遍，内层循环一旦超出 z 间距就能立刻停，
       所以每帧的代价接近线性，而不是 O(n²)。 */
    var order = new Int32Array(count);

    function sortByDepth() {
      for (var s = 0; s < count; s++) { order[s] = s; }
      Array.prototype.sort.call(order, function (a, b) {
        return position[a * 3 + 2] - position[b * 3 + 2];
      });
    }

    function rebuildLinks() {
      linkCount = 0;
      var baseColor = colors.line;
      sortByDepth();
      for (var ai = 0; ai < count && linkCount < linkCapacity; ai++) {
        var a = order[ai];
        var a3 = a * 3;
        var best = -1;
        var bestDistance = LINK_GAP * LINK_GAP;
        var az = position[a3 + 2];
        for (var bi = ai + 1; bi < count && linkCount < linkCapacity; bi++) {
          var b = order[bi];
          var b3 = b * 3;
          var dz = position[b3 + 2] - az;
          if (dz > LINK_GAP) { break; }        // 后面只会更远
          if (dz <= 0) { continue; }
          var dx = position[b3] - position[a3];
          if (dx < -LINK_GAP || dx > LINK_GAP) { continue; }
          var dy = position[b3 + 1] - position[a3 + 1];
          if (dy < -LINK_GAP || dy > LINK_GAP) { continue; }
          var distance = dx * dx + dy * dy + dz * dz;
          if (distance < bestDistance) {
            bestDistance = distance;
            best = b;
          }
        }
        if (best < 0) { continue; }
        var bPos = best * 3;
        var slot = linkCount * 6;
        linkPositions[slot] = position[a3];
        linkPositions[slot + 1] = position[a3 + 1];
        linkPositions[slot + 2] = position[a3 + 2];
        linkPositions[slot + 3] = position[bPos];
        linkPositions[slot + 4] = position[bPos + 1];
        linkPositions[slot + 5] = position[bPos + 2];
        var fadeA = 0.35 + 0.65 * Math.max(0, Math.min(1, (position[a3 + 2] + FIELD.z / 2) / FIELD.z));
        var fadeB = 0.35 + 0.65 * Math.max(0, Math.min(1, (position[bPos + 2] + FIELD.z / 2) / FIELD.z));
        linkColors[slot] = baseColor.r * fadeA;
        linkColors[slot + 1] = baseColor.g * fadeA;
        linkColors[slot + 2] = baseColor.b * fadeA;
        linkColors[slot + 3] = baseColor.r * fadeB;
        linkColors[slot + 4] = baseColor.g * fadeB;
        linkColors[slot + 5] = baseColor.b * fadeB;
        linkCount++;
      }
      linkPositionAttr.needsUpdate = true;
      linkColorAttr.needsUpdate = true;
      linkGeometry.setDrawRange(0, linkCount * 2);
    }

    /* ---- 尺寸：devicePixelRatio 上限 2，画布不参与布局 ---- */
    function resize() {
      var rect = canvas.getBoundingClientRect();
      var width = Math.max(1, Math.round(rect.width || window.innerWidth));
      var height = Math.max(1, Math.round(rect.height || 420));
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    /* ---- 鼠标 / 触摸视差（只监听，不拦截） ---- */
    var pointer = { x: 0, y: 0 };
    var drift = { x: 0, y: 0 };

    function onPointerMove(event) {
      var width = window.innerWidth || 1;
      var height = window.innerHeight || 1;
      pointer.x = Math.max(-1, Math.min(1, (event.clientX / width) * 2 - 1));
      pointer.y = Math.max(-1, Math.min(1, (event.clientY / height) * 2 - 1));
    }

    /* ---- 渲染循环 ---- */
    var running = false;
    var frameId = 0;
    var clock = null;
    var visibleOnScreen = true;
    var tabVisible = document.visibilityState !== 'hidden';

    function renderFrame(delta, elapsed) {
      var i3;
      var amplitude = Math.min(1, delta / 33);
      for (var i = 0; i < count; i++) {
        i3 = i * 3;
        position[i3 + 2] += speed[i] * delta;
        if (position[i3 + 2] > NEAR_Z) {
          position[i3 + 2] = FAR_Z;
          base[i3] = (Math.random() * 2 - 1) * (FIELD.x / 2);
          base[i3 + 1] = (Math.random() * 2 - 1) * (FIELD.y / 2);
        }
        position[i3] = base[i3] + Math.sin(elapsed * 0.12 + phase[i]) * 2.1;
        position[i3 + 1] = base[i3 + 1] + Math.cos(elapsed * 0.09 + phase[i]) * 1.7;
      }
      positionAttr.needsUpdate = true;
      rebuildLinks();

      drift.x += (pointer.x * 0.085 - drift.x) * 0.045 * amplitude;
      drift.y += (pointer.y * 0.055 - drift.y) * 0.045 * amplitude;

      group.rotation.y = drift.x + Math.sin(elapsed * 0.055) * 0.035;
      group.rotation.x = -drift.y + Math.sin(elapsed * 0.043) * 0.022;
      camera.position.x = drift.x * 7.5;
      camera.position.y = -drift.y * 5.5;
      camera.lookAt(0, drift.y * 2.5, 0);

      renderer.render(scene, camera);
    }

    function tick() {
      if (!running) { return; }
      frameId = window.requestAnimationFrame(tick);
      var delta = Math.min(clock.getDelta(), 0.05);
      renderFrame(delta, clock.elapsedTime);
    }

    function canAnimate() {
      return visibleOnScreen && tabVisible && !document.hidden;
    }

    function sync() {
      if (canAnimate() && !reducedMotion()) {
        if (!running) {
          running = true;
          clock = new THREE.Clock();
          frameId = window.requestAnimationFrame(tick);
        }
      } else if (running) {
        running = false;
        if (frameId) { window.cancelAnimationFrame(frameId); }
        frameId = 0;
      }
    }

    function drawStill() {
      /* reduced-motion、标签页隐藏、滚出视口：只画一帧静态星图，不跑动画 */
      if (!running) {
        renderFrame(0, 0);
      }
    }

    /* ---- 事件接线（全部包在 try/catch 里，失败也只是没有动画） ---- */
    function listen(target, type, handler, options) {
      try {
        target.addEventListener(type, handler, options);
      } catch (error) {
        /* 忽略：装饰性动画不值得为它冒任何风险 */
      }
    }

    listen(window, 'resize', function () {
      resize();
      if (!running) { drawStill(); }
    });

    listen(window, 'pointermove', onPointerMove, { passive: true });
    listen(document, 'visibilitychange', function () {
      tabVisible = !document.hidden;
      sync();
    });

    if (typeof window.IntersectionObserver === 'function') {
      var observer = new window.IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          visibleOnScreen = entries[i].isIntersecting;
        }
        sync();
      }, { threshold: 0 });
      observer.observe(canvas);
    }

    /* 主题切换：<html data-theme> 一变就重新读 CSS 变量 */
    if (typeof window.MutationObserver === 'function') {
      var themeWatcher = new window.MutationObserver(function () {
        applyColors();
        if (!running) { drawStill(); }
      });
      themeWatcher.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });
    }
    try {
      var schemeQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
      if (schemeQuery && schemeQuery.addEventListener) {
        listen(schemeQuery, 'change', function () {
          applyColors();
          if (!running) { drawStill(); }
        });
      }
    } catch (error) { /* 忽略 */ }

    /* ---- 启动：先画一帧确认真的能画，再显示 canvas ---- */
    resize();
    applyColors();
    renderFrame(0, 0);

    try {
      window.__hero3dDebug.renderer = renderer;
      window.__hero3dDebug.scene = scene;
      window.__hero3dDebug.camera = camera;
      window.__hero3dDebug.particles = particles;
      window.__hero3dDebug.links = links;
      window.__hero3dDebug.linkCount = linkCount;
    } catch (dx) {}
    canvas.hidden = false;
    canvas.setAttribute('data-hero3d-ready', '1');
    sync();
    if (!running) { drawStill(); }
  }

  function boot() {
    try {
      init();
    } catch (error) {
      /* 任何异常 → 保持 canvas hidden，Hero 与没有这段脚本时完全一致 */
      try {
        var canvas = document.querySelector('[data-hero3d]');
        if (canvas) {
          canvas.hidden = true;
          canvas.removeAttribute('data-hero3d-ready');
        }
      } catch (inner) { /* 忽略 */ }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
