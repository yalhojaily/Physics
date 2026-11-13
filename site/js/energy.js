/* Lesson 03 — Conservation of energy. A ball on a curved track with
   live bars for kinetic, potential, thermal and total energy. */
(function () {
  'use strict';
  var L = window.Lab, C = L.COLORS;
  var canvasEl = document.getElementById('stage');
  var view = L.canvas(canvasEl);
  var ctx = view.ctx;
  var G = 9.8, X_LIM = 4.8, H_TOP = 4.3;

  var TRACKS = {
    bowl: {
      f: function (x) { return 0.16 * x * x; },
      df: function (x) { return 0.32 * x; }
    },
    double: {
      f: function (x) { var u = x * x - 9; return 0.016 * u * u; },
      df: function (x) { return 0.064 * x * (x * x - 9); }
    }
  };

  var s = {
    track: 'bowl', m: 1, mu: 0,
    x0: -4, x: -4, v: 0,
    e0: 0, thermal: 0,
    phase: 'held', // held | run | paused
    dragging: false
  };

  function f(x) { return TRACKS[s.track].f(x); }
  function df(x) { return TRACKS[s.track].df(x); }

  function hold(x) {
    s.x0 = Math.max(-X_LIM, Math.min(X_LIM, x));
    s.x = s.x0; s.v = 0; s.thermal = 0;
    s.e0 = s.m * G * f(s.x);
    s.phase = 'held';
    L.set('e-go', 'Release');
    startInput.value = String(s.x0);
  }

  function substep(h) {
    var fp = df(s.x);
    var len = Math.sqrt(1 + fp * fp);
    var sin = fp / len, cos = 1 / len;
    var mech = s.e0 - s.thermal;
    var rad = 2 * (mech / s.m - G * f(s.x));

    // at rest on a slope that friction can hold, or at the very bottom
    if (Math.abs(s.v) < 1e-3 && rad < 1e-3 && Math.abs(sin) <= s.mu * cos + 1e-9) {
      s.v = 0;
      return;
    }
    var at = -G * sin - (s.v !== 0 ? Math.sign(s.v) * s.mu * G * cos : 0);
    var v = s.v + at * h;
    var ds = v * h;
    s.x += ds * cos;
    if (s.x > X_LIM + 0.5) { s.x = X_LIM + 0.5; v = 0; }
    if (s.x < -X_LIM - 0.5) { s.x = -X_LIM - 0.5; v = 0; }
    s.thermal = Math.min(s.e0, s.thermal + s.mu * s.m * G * cos * Math.abs(ds));
    // take the speed from the energy balance so the totals stay exact
    rad = 2 * ((s.e0 - s.thermal) / s.m - G * f(s.x));
    s.v = rad > 0 ? (v >= 0 ? 1 : -1) * Math.sqrt(rad) : 0;
  }

  function step(dt) {
    if (s.phase === 'run' && !s.dragging) {
      var n = 24, h = dt / n;
      for (var i = 0; i < n; i++) substep(h);
    }
    var pe = s.m * G * f(s.x);
    var mech = s.e0 - s.thermal;
    if (s.phase === 'held' || s.dragging) { pe = s.e0; }
    pe = Math.min(pe, Math.max(mech, 0));
    var ke = Math.max(0, mech - pe);
    s.ke = ke; s.pe = pe;

    L.set('e-speed', L.fmt(Math.sqrt(2 * ke / s.m)) + ' m/s');
    L.set('e-height', L.fmt(f(s.x)) + ' m');
    L.set('e-total', L.fmt(s.e0) + ' J');

    var msg;
    var stopped = s.phase === 'run' && ke < 0.005 && s.thermal > 0.01 && Math.abs(s.v) < 1e-3;
    if (s.phase === 'held') {
      msg = 'The ball is held at ' + L.fmt(f(s.x)) + ' m. Its potential energy is mgh = ' + L.fmt(s.e0) +
        ' J. Press Release, or drag the ball along the track.';
    } else if (stopped) {
      msg = 'The ball has stopped. ' + L.fmt(s.thermal) + ' J of mechanical energy became thermal energy. The total is still ' + L.fmt(s.e0) + ' J.';
    } else if (s.mu === 0) {
      msg = 'No friction: kinetic and potential energy trade back and forth, and their sum stays at ' + L.fmt(s.e0) + ' J.';
    } else {
      msg = 'Friction turns mechanical energy into thermal energy. The total stays at ' + L.fmt(s.e0) + ' J.';
    }
    L.set('e-msg', msg);
  }

  /* geometry shared by drawing and dragging */
  function layout() {
    var w = view.w, h = view.h;
    var barsW = Math.min(230, Math.max(170, w * 0.28));
    var trackW = w - barsW - 12;
    var ppm = Math.min((trackW - 50) / (2 * X_LIM + 1.2), (h - 64) / (H_TOP + 0.6));
    var cx = 38 + (trackW - 38) / 2;
    var baseY = h - 34;
    return { w: w, h: h, barsW: barsW, trackW: trackW, ppm: ppm, cx: cx, baseY: baseY };
  }

  function draw() {
    var g = layout(), w = g.w, h = g.h;
    function PX(x) { return g.cx + x * g.ppm; }
    function PY(y) { return g.baseY - y * g.ppm; }
    var x, i;

    // height lines
    for (i = 0; i <= 4; i++) {
      ctx.fillStyle = C.faint;
      ctx.fillRect(38, PY(i), g.trackW - 38, 1);
      L.text(ctx, i + ' m', 32, PY(i) + 4, { size: 11, align: 'right' });
    }

    // ground under the track
    var xL = -X_LIM - 0.5, xR = X_LIM + 0.5;
    ctx.beginPath();
    ctx.moveTo(PX(xL), PY(f(xL)));
    for (x = xL; x <= xR + 1e-6; x += 0.05) ctx.lineTo(PX(x), PY(f(x)));
    ctx.lineTo(PX(xR), h);
    ctx.lineTo(PX(xL), h);
    ctx.closePath();
    ctx.fillStyle = '#12203A';
    ctx.fill();
    // the track itself
    ctx.beginPath();
    ctx.moveTo(PX(xL), PY(f(xL)));
    for (x = xL; x <= xR + 1e-6; x += 0.05) ctx.lineTo(PX(x), PY(f(x)));
    ctx.strokeStyle = s.mu === 0 ? C.mute : s.mu < 0.1 ? '#B9A58C' : '#C48E5A';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // release-height marker
    var hy = PY(s.e0 / (s.m * G));
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(38, hy); ctx.lineTo(g.trackW, hy); ctx.stroke();
    ctx.setLineDash([]);
    L.text(ctx, 'release height', g.trackW - 4, hy - 6, { size: 11, align: 'right' });

    // ball, sitting on the track along the normal
    var fp = df(s.x), len = Math.sqrt(1 + fp * fp);
    var r = 11;
    var bx = PX(s.x) - (fp / len) * (r + 2);
    var by = PY(f(s.x)) - (1 / len) * (r + 2);
    if (Math.abs(s.v) > 0.05 && s.phase === 'run') {
      var sv = Math.min(11, g.ppm * 0.22);
      L.arrow(ctx, bx, by, bx + (s.v / len) * sv, by - (s.v * fp / len) * sv, C.blue, 4);
    }
    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fillStyle = C.body; ctx.fill();
    if (s.phase === 'held') {
      ctx.beginPath(); ctx.arc(bx, by, r + 6, 0, Math.PI * 2);
      ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.stroke();
    }

    // energy bars
    var px = w - g.barsW, top = 44, bottom = h - 40;
    ctx.fillStyle = '#12203A';
    L.roundRect(ctx, px, 10, g.barsW - 10, h - 20, 10);
    ctx.fill();
    L.text(ctx, 'Energy (J)', px + 14, 30, { size: 12, color: C.ink, weight: 600 });
    var eMax = s.m * G * H_TOP;
    var bars = [
      ['Kinetic', s.ke, C.blue],
      ['Potential', s.pe, C.orange],
      ['Thermal', s.thermal, C.violet],
      ['Total', s.e0, C.ink]
    ];
    var slot = (g.barsW - 10 - 20) / bars.length;
    var bw = Math.min(30, slot * 0.6);
    for (i = 0; i < bars.length; i++) {
      var mx = px + 10 + slot * (i + 0.5);
      var full = bottom - top - 18;
      var bh = Math.max(0, Math.min(1, bars[i][1] / eMax)) * full;
      ctx.fillStyle = C.faint;
      ctx.fillRect(mx - bw / 2, bottom - full, bw, full);
      ctx.fillStyle = bars[i][2];
      ctx.fillRect(mx - bw / 2, bottom - bh, bw, bh);
      L.text(ctx, L.fmt(bars[i][1]), mx, bottom - bh - 6, { size: 11, color: C.ink, weight: 600, align: 'center' });
      L.text(ctx, bars[i][0], mx, bottom + 18, { size: 11, align: 'center' });
    }
  }

  /* ---------------- wiring ---------------- */

  var startInput = document.getElementById('e-start');
  startInput.addEventListener('input', function () { hold(Number(startInput.value)); });

  document.getElementById('e-go').addEventListener('click', function () {
    if (s.phase === 'held' || s.phase === 'paused') { s.phase = 'run'; L.set('e-go', 'Pause'); }
    else { s.phase = 'paused'; L.set('e-go', 'Resume'); }
  });
  document.getElementById('e-reset').addEventListener('click', function () { hold(s.x0); });
  L.seg(document.getElementById('e-track'), function (v) { s.track = v; hold(s.x0); });
  L.seg(document.getElementById('e-mass'), function (v) {
    // keep the motion, rescale the energies
    var k = Number(v) / s.m;
    s.m = Number(v); s.e0 *= k; s.thermal *= k;
  });
  L.seg(document.getElementById('e-fric'), function (v) { s.mu = Number(v); });

  function pointerX(e) {
    var rect = canvasEl.getBoundingClientRect();
    var g = layout();
    return (e.clientX - rect.left - g.cx) / g.ppm;
  }
  canvasEl.addEventListener('pointerdown', function (e) {
    var g = layout();
    var rect = canvasEl.getBoundingClientRect();
    if (e.clientX - rect.left > g.trackW) return;
    s.dragging = true;
    try { canvasEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    hold(pointerX(e));
  });
  canvasEl.addEventListener('pointermove', function (e) {
    if (s.dragging) hold(pointerX(e));
  });
  function drop() {
    if (!s.dragging) return;
    s.dragging = false;
    s.phase = 'run';
    L.set('e-go', 'Pause');
  }
  canvasEl.addEventListener('pointerup', drop);
  canvasEl.addEventListener('pointercancel', drop);
  canvasEl.style.cursor = 'grab';

  hold(-4);
  L.loop(function (dt) {
    ctx.clearRect(0, 0, view.w, view.h);
    step(dt);
    draw();
  });
})();
