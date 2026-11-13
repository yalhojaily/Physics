/* Lesson 02 — Kinematics. Two scenes share one canvas:
   "line" : constant acceleration along a line, with x-t and v-t graphs
   "proj" : projectile motion */
(function () {
  'use strict';
  var L = window.Lab, C = L.COLORS;
  var view = L.canvas(document.getElementById('stage'));
  var ctx = view.ctx;
  var scene = 'line';

  /* ---------------- straight line ---------------- */

  var X_MIN = -20, X_MAX = 120, T_MAX = 12, V_LIM = 45;
  var line = { v0: 5, a: 2, t: 0, tEnd: T_MAX, running: false, done: false };

  function xAt(t) { return line.v0 * t + 0.5 * line.a * t * t; }
  function vAt(t) { return line.v0 + line.a * t; }

  function resetLine() {
    line.t = 0; line.running = false; line.done = false;
    line.tEnd = T_MAX;
    for (var t = 0; t <= T_MAX; t += 0.01) {
      var x = xAt(t);
      if (x < X_MIN || x > X_MAX) { line.tEnd = t; break; }
    }
    L.set('l-start', 'Start');
  }

  function stepLine(dt) {
    if (line.running) {
      line.t += dt;
      if (line.t >= line.tEnd) {
        line.t = line.tEnd; line.running = false; line.done = true;
        L.set('l-start', 'Run again');
      }
    }
    var t = line.t, x = xAt(t), v = vAt(t);
    L.set('l-t', L.fmt(t) + ' s');
    L.set('l-x', L.fmt(x) + ' m');
    L.set('l-v', L.fmt(v) + ' m/s');
    var msg;
    if (line.done) {
      msg = line.tEnd >= T_MAX ? 'Time is up after 12 s. Change the sliders or run again.'
        : 'The car left the track after ' + L.fmt(t) + ' s. Change the sliders or run again.';
    } else {
      msg = 'v = v₀ + at = ' + L.fmt(line.v0, 0) + ' + (' + L.fmt(line.a) + ')(' + L.fmt(t) + ') = ' + L.fmt(v) + ' m/s' +
        '   ·   x = v₀t + ½at² = ' + L.fmt(x) + ' m';
    }
    L.set('l-msg', msg);
  }

  function graph(gx, gy, gw, gh, title, yMin, yMax, fn, shade) {
    ctx.fillStyle = '#12203A';
    L.roundRect(ctx, gx, gy, gw, gh, 10);
    ctx.fill();
    L.text(ctx, title, gx + 12, gy + 18, { size: 12, color: C.ink, weight: 600 });
    var px0 = gx + 40, px1 = gx + gw - 12, py0 = gy + 30, py1 = gy + gh - 22;
    if (py1 - py0 < 20) return;
    function X(t) { return px0 + (t / T_MAX) * (px1 - px0); }
    function Y(y) { return py1 - ((y - yMin) / (yMax - yMin)) * (py1 - py0); }
    // axes
    ctx.fillStyle = C.faint;
    ctx.fillRect(px0, py0, 1, py1 - py0);
    ctx.fillRect(px0, Y(0), px1 - px0, 1);
    for (var k = 0; k <= T_MAX; k += 4) {
      L.text(ctx, k + ' s', X(k), gy + gh - 7, { size: 10, align: 'center' });
    }
    L.text(ctx, String(yMax), px0 - 6, py0 + 4, { size: 10, align: 'right' });
    L.text(ctx, '0', px0 - 6, Y(0) + 4, { size: 10, align: 'right' });
    L.text(ctx, L.fmt(yMin, 0), px0 - 6, py1 + 2, { size: 10, align: 'right' });

    ctx.save();
    ctx.beginPath();
    ctx.rect(px0, py0 - 2, px1 - px0 + 2, py1 - py0 + 4);
    ctx.clip();
    var t;
    // area under the curve (velocity graph only)
    if (shade && line.t > 0) {
      ctx.beginPath();
      ctx.moveTo(X(0), Y(0));
      for (t = 0; t <= line.t; t += 0.05) ctx.lineTo(X(t), Y(fn(t)));
      ctx.lineTo(X(line.t), Y(fn(line.t)));
      ctx.lineTo(X(line.t), Y(0));
      ctx.closePath();
      ctx.fillStyle = 'rgba(127,176,255,0.25)';
      ctx.fill();
    }
    // whole predicted curve, faint
    ctx.beginPath();
    for (t = 0; t <= line.tEnd + 1e-6; t += 0.05) {
      if (t === 0) ctx.moveTo(X(t), Y(fn(t))); else ctx.lineTo(X(t), Y(fn(t)));
    }
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    // part travelled so far
    ctx.beginPath();
    ctx.moveTo(X(0), Y(fn(0)));
    for (t = 0.05; t < line.t; t += 0.05) ctx.lineTo(X(t), Y(fn(t)));
    ctx.lineTo(X(line.t), Y(fn(line.t)));
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(X(line.t), Y(fn(line.t)), 4.5, 0, Math.PI * 2);
    ctx.fillStyle = C.ink;
    ctx.fill();
  }

  function drawLine() {
    var w = view.w, h = view.h;
    var trackH = Math.max(96, h * 0.36);
    var roadY = trackH - 30;
    var pad = 30;
    function PX(x) { return pad + ((x - X_MIN) / (X_MAX - X_MIN)) * (w - 2 * pad); }

    ctx.fillStyle = C.line;
    ctx.fillRect(0, roadY, w, 2);
    for (var x = X_MIN; x <= X_MAX; x += 10) {
      ctx.fillStyle = C.line;
      ctx.fillRect(PX(x) - 1, roadY + 2, 2, x % 20 === 0 ? 10 : 6);
      if (x % 20 === 0) L.text(ctx, L.fmt(x, 0) + (x === 0 ? ' m' : ''), PX(x), roadY + 25, { size: 11, align: 'center', color: x === 0 ? C.ink : C.mute });
    }

    var cx = PX(Math.max(X_MIN, Math.min(X_MAX, xAt(line.t))));
    var v = vAt(line.t);
    // car
    ctx.fillStyle = C.body;
    L.roundRect(ctx, cx - 24, roadY - 20, 48, 14, 5);
    ctx.fill();
    L.roundRect(ctx, cx - 12, roadY - 30, 24, 13, 5);
    ctx.fill();
    ctx.fillStyle = C.mute;
    ctx.beginPath(); ctx.arc(cx - 13, roadY - 5, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 13, roadY - 5, 5, 0, Math.PI * 2); ctx.fill();
    // arrows
    if (Math.abs(v) > 0.2) L.arrow(ctx, cx, roadY - 42, cx + v * 2.4, roadY - 42, C.blue, 5);
    if (Math.abs(line.a) > 0.01) L.arrow(ctx, cx, roadY - 56, cx + line.a * 11, roadY - 56, C.orange, 5);
    L.legend(ctx, [['Velocity', C.blue], ['Acceleration', C.orange]], w - 14, 16);

    // graphs
    var gy = trackH + 8, gh = h - gy - 10, gap = 12;
    var gw = (w - 28 - gap) / 2;
    graph(14, gy, gw, gh, 'Position against time (m)', X_MIN, X_MAX, xAt, false);
    graph(14 + gw + gap, gy, gw, gh, 'Velocity against time (m/s) · shaded area = displacement', -V_LIM, V_LIM, vAt, true);
  }

  /* ---------------- projectile ---------------- */

  var proj = { angle: 45, speed: 20, g: 9.8, shots: [], cur: null };

  function launch() {
    if (proj.cur && proj.cur.flying) finish(proj.cur);
    var th = proj.angle * Math.PI / 180;
    proj.cur = {
      angle: proj.angle, speed: proj.speed,
      vx: proj.speed * Math.cos(th), vy0: proj.speed * Math.sin(th),
      t: 0, x: 0, y: 0, vy: proj.speed * Math.sin(th),
      pts: [[0, 0]], flying: true
    };
  }

  function finish(shot) {
    shot.flying = false;
    proj.shots.push(shot);
    if (proj.shots.length > 5) proj.shots.shift();
  }

  function stepProj(dt) {
    var c = proj.cur, g = proj.g;
    if (c && c.flying) {
      c.t += dt * (9.8 / g); // slower worlds are shown faster so every flight takes a similar time on screen
      var T = 2 * c.vy0 / g;
      if (c.t >= T) {
        c.t = T; c.x = c.vx * T; c.y = 0; c.vy = -c.vy0;
        c.pts.push([c.x, 0]);
        finish(c);
      } else {
        c.x = c.vx * c.t;
        c.y = c.vy0 * c.t - 0.5 * g * c.t * c.t;
        c.vy = c.vy0 - g * c.t;
        c.pts.push([c.x, c.y]);
      }
    }
    L.set('p-t', L.fmt(c ? c.t : 0) + ' s');
    L.set('p-x', L.fmt(c ? c.x : 0) + ' m');
    L.set('p-y', L.fmt(c ? c.y : 0) + ' m');
    var th = proj.angle * Math.PI / 180;
    var R = proj.speed * proj.speed * Math.sin(2 * th) / g;
    var H = Math.pow(proj.speed * Math.sin(th), 2) / (2 * g);
    var T2 = 2 * proj.speed * Math.sin(th) / g;
    L.set('p-msg', 'Predicted for ' + proj.angle + '° at ' + proj.speed + ' m/s: range ' + L.fmt(R) +
      ' m, maximum height ' + L.fmt(H) + ' m, flight time ' + L.fmt(T2) + ' s.');
  }

  function niceStep(raw) {
    var p = Math.pow(10, Math.floor(Math.log10(raw)));
    var n = raw / p;
    return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
  }

  function drawProj() {
    var w = view.w, h = view.h, g = proj.g;
    var ox = 44, oy = h - 40;
    // the view is sized for the chosen launch speed, so every angle fits
    var worldW = 1.1 * proj.speed * proj.speed / g;
    var worldH = 1.08 * Math.pow(proj.speed * Math.sin(85 * Math.PI / 180), 2) / (2 * g);
    var ppm = Math.min((w - ox - 20) / worldW, (oy - 34) / worldH);
    function PX(x) { return ox + x * ppm; }
    function PY(y) { return oy - y * ppm; }

    // ground and distance marks
    ctx.fillStyle = '#12203A';
    ctx.fillRect(0, oy, w, h - oy);
    ctx.fillStyle = C.line;
    ctx.fillRect(0, oy, w, 2);
    var step = niceStep((w - ox) / ppm / 8);
    for (var d = 0; PX(d) < w - 10; d += step) {
      ctx.fillStyle = C.line;
      ctx.fillRect(PX(d) - 1, oy + 2, 2, 8);
      L.text(ctx, d + ' m', PX(d), oy + 26, { size: 11, align: 'center' });
    }
    // height marks
    for (var hh = step; PY(hh) > 30; hh += step) {
      ctx.fillStyle = C.faint;
      ctx.fillRect(ox, PY(hh), w - ox, 1);
      L.text(ctx, hh + ' m', ox - 6, PY(hh) + 4, { size: 11, align: 'right' });
    }

    function path(shot, color, width) {
      if (shot.pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(PX(shot.pts[0][0]), PY(shot.pts[0][1]));
      for (var i = 1; i < shot.pts.length; i++) ctx.lineTo(PX(shot.pts[i][0]), PY(shot.pts[i][1]));
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // earlier shots
    for (var s = 0; s < proj.shots.length; s++) {
      var shot = proj.shots[s];
      if (shot === proj.cur) continue;
      path(shot, C.line, 2);
      var end = shot.pts[shot.pts.length - 1];
      ctx.beginPath(); ctx.arc(PX(end[0]), PY(end[1]), 4, 0, Math.PI * 2);
      ctx.fillStyle = C.mute; ctx.fill();
    }
    // labels at the top of each earlier path
    for (s = 0; s < proj.shots.length; s++) {
      shot = proj.shots[s];
      if (shot === proj.cur || shot.pts.length < 3) continue;
      var apexX = shot.vx * shot.vy0 / g, apexY = shot.vy0 * shot.vy0 / (2 * g);
      L.text(ctx, shot.angle + '°', PX(apexX), PY(apexY) - 8, { size: 11, align: 'center' });
    }

    // launcher
    var th = proj.angle * Math.PI / 180;
    ctx.strokeStyle = C.mute;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + Math.cos(th) * 34, oy - Math.sin(th) * 34);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(ox, oy, 9, 0, Math.PI * 2);
    ctx.fillStyle = C.mute; ctx.fill();

    // current shot
    var c = proj.cur;
    if (c) {
      path(c, C.ink, 2.5);
      var bx = PX(c.x), by = PY(c.y);
      if (c.flying) {
        var sv = Math.min(3.2, w / 300);
        L.arrow(ctx, bx, by, bx + c.vx * sv, by, C.blue, 4);
        L.arrow(ctx, bx, by, bx, by - c.vy * sv, C.orange, 4);
        L.text(ctx, 'vx ' + L.fmt(c.vx), bx + c.vx * sv + 6, by + 4, { size: 11, color: C.blue, weight: 600 });
        L.text(ctx, 'vy ' + L.fmt(c.vy), bx + 8, by - c.vy * sv + (c.vy >= 0 ? -4 : 12), { size: 11, color: C.orange, weight: 600 });
      } else {
        L.text(ctx, c.angle + '° · ' + L.fmt(c.x) + ' m', bx, by - 14, { size: 12, color: C.ink, weight: 600, align: 'center' });
      }
      ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.fillStyle = C.body; ctx.fill();
    }

    L.legend(ctx, [['Horizontal velocity', C.blue], ['Vertical velocity', C.orange]], w - 14, 18);
    if (g !== 9.8) {
      L.text(ctx, 'Shown ' + L.fmt(9.8 / g) + '× faster than real time', ox, 22, { size: 11 });
    }
  }

  /* ---------------- wiring ---------------- */

  var v0Input = document.getElementById('l-v0');
  var aInput = document.getElementById('l-a');
  v0Input.addEventListener('input', function () {
    line.v0 = Number(v0Input.value);
    L.set('l-v0-val', L.fmt(line.v0, 0) + ' m/s');
    resetLine();
  });
  aInput.addEventListener('input', function () {
    line.a = Number(aInput.value);
    L.set('l-a-val', L.fmt(line.a) + ' m/s²');
    resetLine();
  });
  document.getElementById('l-start').addEventListener('click', function () {
    if (line.done) { resetLine(); line.running = true; L.set('l-start', 'Pause'); return; }
    line.running = !line.running;
    L.set('l-start', line.running ? 'Pause' : 'Resume');
  });
  document.getElementById('l-reset').addEventListener('click', resetLine);

  var angleInput = document.getElementById('p-angle');
  var speedInput = document.getElementById('p-speed');
  angleInput.addEventListener('input', function () {
    proj.angle = Number(angleInput.value);
    L.set('p-angle-val', proj.angle + '°');
  });
  speedInput.addEventListener('input', function () {
    proj.speed = Number(speedInput.value);
    L.set('p-speed-val', proj.speed + ' m/s');
    proj.shots = [];   // the scale changes with speed, so earlier paths no longer line up
    proj.cur = null;
  });
  L.seg(document.getElementById('p-g'), function (v) {
    proj.g = Number(v);
    proj.shots = [];
    proj.cur = null;
  });
  document.getElementById('p-launch').addEventListener('click', launch);
  document.getElementById('p-clear').addEventListener('click', function () { proj.shots = []; proj.cur = null; });

  L.scenes(document.getElementById('scene-tabs'), function (name) { scene = name; });
  resetLine();

  L.loop(function (dt) {
    ctx.clearRect(0, 0, view.w, view.h);
    if (scene === 'line') { stepLine(dt); drawLine(); }
    else { stepProj(dt); drawProj(); }
  });
})();
