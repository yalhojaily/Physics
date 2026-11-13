/* Shared helpers for the interactive labs. No dependencies. */
(function () {
  'use strict';

  var COLORS = {
    ink: '#E8EEF7',
    mute: '#A9B8CC',
    line: '#4A5F80',
    faint: '#22344F',
    blue: '#7FB0FF',
    orange: '#FF8A3D',
    violet: '#C9A7FF',
    green: '#6FD6A8',
    body: '#E8EEF7',
    dark: '#14202F'
  };

  /* A canvas that tracks its CSS size and the device pixel ratio.
     view.w and view.h are always in CSS pixels. */
  function canvas(el) {
    var ctx = el.getContext('2d');
    var view = { el: el, ctx: ctx, w: 300, h: 150 };
    function fit() {
      var r = el.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      view.w = Math.max(50, r.width);
      view.h = Math.max(50, r.height);
      el.width = Math.round(view.w * dpr);
      el.height = Math.round(view.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(el);
    window.addEventListener('resize', fit);
    return view;
  }

  /* Animation loop. step(dt) gets seconds, capped so a background tab
     does not produce one huge jump. */
  function loop(step) {
    var last = performance.now();
    function frame(t) {
      var dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      step(dt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function arrow(ctx, x1, y1, x2, y2, color, width) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 3) return;
    var w = width || 4;
    var head = Math.min(12, len * 0.6);
    var ux = dx / len, uy = dy / len;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - ux * head, y2 - uy * head);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * head - uy * (w + 3), y2 - uy * head + ux * (w + 3));
    ctx.lineTo(x2 - ux * head + uy * (w + 3), y2 - uy * head - ux * (w + 3));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function text(ctx, str, x, y, opts) {
    opts = opts || {};
    ctx.save();
    ctx.font = (opts.weight || 500) + ' ' + (opts.size || 12) + 'px Inter, system-ui, sans-serif';
    ctx.fillStyle = opts.color || COLORS.mute;
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = opts.baseline || 'alphabetic';
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  /* Legend row drawn at the top right of a stage. items: [[label, color], ...] */
  function legend(ctx, items, right, y) {
    ctx.save();
    ctx.font = '500 12px Inter, system-ui, sans-serif';
    var x = right;
    for (var i = items.length - 1; i >= 0; i--) {
      var wText = ctx.measureText(items[i][0]).width;
      x -= wText;
      ctx.fillStyle = COLORS.mute;
      ctx.textBaseline = 'middle';
      ctx.fillText(items[i][0], x, y);
      x -= 26;
      ctx.fillStyle = items[i][1];
      ctx.fillRect(x, y - 1.5, 18, 3);
      x -= 16;
    }
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* Segmented control: buttons with data-value inside the group element. */
  function seg(group, onChange) {
    var buttons = group.querySelectorAll('button[data-value]');
    function select(value, silent) {
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].setAttribute('aria-pressed', buttons[i].dataset.value === String(value) ? 'true' : 'false');
      }
      if (!silent) onChange(value);
    }
    for (var i = 0; i < buttons.length; i++) {
      (function (b) {
        b.addEventListener('click', function () { select(b.dataset.value); });
      })(buttons[i]);
    }
    return { select: select };
  }

  /* Press-and-hold button (mouse, touch and keyboard). */
  function hold(btn, onDown, onUp) {
    var down = false;
    function start(e) {
      if (down) return;
      down = true;
      btn.classList.add('is-down');
      onDown();
      if (e && e.pointerId !== undefined && btn.setPointerCapture) {
        try { btn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    }
    function end() {
      if (!down) return;
      down = false;
      btn.classList.remove('is-down');
      onUp();
    }
    btn.addEventListener('pointerdown', function (e) { e.preventDefault(); start(e); });
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointercancel', end);
    btn.addEventListener('lostpointercapture', end);
    btn.addEventListener('keydown', function (e) {
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); }
    });
    btn.addEventListener('keyup', function (e) {
      if (e.key === ' ' || e.key === 'Enter') end();
    });
    btn.addEventListener('blur', end);
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function set(id, value) {
    var el = document.getElementById(id);
    if (el && el.textContent !== value) el.textContent = value;
  }

  /* Scene tabs: buttons carry data-value; elements with data-scene are
     shown only for the matching scene. */
  function scenes(group, onChange) {
    var blocks = document.querySelectorAll('[data-scene]');
    function show(name) {
      for (var i = 0; i < blocks.length; i++) {
        blocks[i].hidden = blocks[i].dataset.scene !== name;
      }
      onChange(name);
    }
    var control = seg(group, show);
    return { show: function (name) { control.select(name); } };
  }

  function fmt(n, digits) {
    var v = Number(n).toFixed(digits === undefined ? 1 : digits);
    if (Number(v) === 0) v = Number(0).toFixed(digits === undefined ? 1 : digits);
    return v.replace('-', '−');
  }

  window.Lab = {
    COLORS: COLORS,
    canvas: canvas,
    loop: loop,
    arrow: arrow,
    text: text,
    legend: legend,
    roundRect: roundRect,
    seg: seg,
    hold: hold,
    set: set,
    scenes: scenes,
    fmt: fmt
  };
})();
