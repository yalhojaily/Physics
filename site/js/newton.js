/* Lesson 01 — Newton's laws. Two scenes share one canvas:
   "block"   : force, mass, friction (first and second law)
   "skaters" : action and reaction (third law) */
(function () {
  'use strict';
  var L = window.Lab, C = L.COLORS;
  var view = L.canvas(document.getElementById('stage'));
  var ctx = view.ctx;
  var G = 9.8;
  var scene = 'block';

  /* ---------------- block scene ---------------- */

  var WORLD = 24; // metres visible across the stage
  var block = { x: 6, v: 0, dir: 0, F: 4, m: 1, mu: 0, net: 0, fr: 0, applied: 0, a: 0, stuck: false };
  var hist = [];
  var histClock = 0;
  var HIST_N = 240; // 8 s at 30 Hz

  function resetBlock() {
    block.x = 6; block.v = 0; block.dir = 0;
    block.net = 0; block.fr = 0; block.applied = 0; block.a = 0; block.stuck = false;
    hist = [];
  }

  function stepBlock(dt) {
    var b = block;
    var applied = b.dir * b.F;
    var fmax = b.mu * b.m * G;
    var fr;
    b.stuck = false;
    if (Math.abs(b.v) < 1e-3) {
      b.v = 0;
      if (Math.abs(applied) <= fmax) {
        fr = -applied;
        b.stuck = applied !== 0;
      } else {
        fr = -Math.sign(applied) * fmax;
      }
    } else {
      fr = -Math.sign(b.v) * fmax;
    }
    var net = applied + fr;
    var a = net / b.m;
    var v = b.v + a * dt;
    if (b.v !== 0 && v * b.v < 0 && Math.abs(applied) <= fmax) v = 0; // friction cannot reverse motion
    v = Math.max(-14, Math.min(14, v));
    b.x += v * dt;
    if (b.x > WORLD + 2) b.x = -2;
    if (b.x < -2) b.x = WORLD + 2;
    b.v = v; b.net = net; b.fr = fr; b.applied = applied; b.a = a;

    histClock += dt;
    while (histClock >= 1 / 30) {
      histClock -= 1 / 30;
      hist.push(v);
      if (hist.length > HIST_N) hist.shift();
    }

    var moving = Math.abs(v) > 1e-3;
    var msg;
    if (b.stuck) {
      msg = 'Friction matches your push exactly. The net force is zero, so the block stays at rest.';
    } else if (applied !== 0) {
      msg = 'The forces are unbalanced. Acceleration = net force ÷ mass = ' +
        L.fmt(Math.abs(net)) + ' ÷ ' + b.m + ' = ' + L.fmt(Math.abs(a)) + ' m/s².';
    } else if (moving && b.mu > 0) {
      msg = 'Friction is the only horizontal force. It points against the motion, so the block slows down.';
    } else if (moving) {
      msg = 'The net force is zero. The block keeps the same velocity and will never stop on its own.';
    } else {
      msg = 'The net force is zero, so the block stays at rest. Press and hold a push button.';
    }
    L.set('b-msg', msg);
    L.set('b-net', L.fmt(net) + ' N');
    L.set('b-acc', L.fmt(a) + ' m/s²');
    L.set('b-speed', L.fmt(Math.abs(v)) + ' m/s');
  }

  function drawBlock() {
    var w = view.w, h = view.h, b = block;
    var floorY = h - 48;
    var ppm = w / WORLD;

    // floor and metre ticks
    ctx.fillStyle = C.line;
    ctx.fillRect(0, floorY, w, 2);
    for (var i = 0; i <= WORLD; i++) {
      ctx.fillRect(i * ppm, floorY + 2, 2, i % 5 === 0 ? 12 : 7);
    }
    L.text(ctx, 'Surface: ' + (b.mu === 0 ? 'no friction' : b.mu < 0.1 ? 'low friction' : 'high friction') +
      '  ·  marks are 1 m apart', 14, h - 12);

    // block
    var side = Math.min(54 * Math.cbrt(b.m), (floorY - 40) * 0.5);
    var cx = b.x * ppm;
    var top = floorY - side;
    ctx.fillStyle = C.body;
    L.roundRect(ctx, cx - side / 2, top, side, side, 8);
    ctx.fill();
    L.text(ctx, b.m + ' kg', cx, top + side / 2, { color: C.dark, size: 14, weight: 600, align: 'center', baseline: 'middle' });

    // arrows
    var scaleF = 9, scaleV = 10;
    if (b.applied !== 0) {
      var sgn = Math.sign(b.applied);
      // push arrow arrives at the trailing face
      var tip = cx - sgn * (side / 2 + 4);
      L.arrow(ctx, tip - sgn * Math.abs(b.applied) * scaleF, top + side * 0.45, tip, top + side * 0.45, C.orange, 5);
    }
    if (Math.abs(b.fr) > 0.01) {
      var fs = Math.sign(b.fr);
      L.arrow(ctx, cx, floorY - 6, cx + fs * (side / 2 + Math.abs(b.fr) * scaleF), floorY - 6, C.violet, 5);
    }
    if (Math.abs(b.v) > 0.05) {
      L.arrow(ctx, cx, top - 16, cx + b.v * scaleV, top - 16, C.blue, 5);
    }

    L.legend(ctx, [['Velocity', C.blue], ['Push', C.orange], ['Friction', C.violet]], w - 14, 20);

    // velocity-time inset
    var gw = Math.min(250, w * 0.36), gh = Math.min(88, h * 0.3), gx = 14, gy = 12;
    ctx.fillStyle = '#12203A';
    L.roundRect(ctx, gx, gy, gw, gh, 8);
    ctx.fill();
    L.text(ctx, 'Velocity over the last 8 s', gx + 10, gy + 16, { size: 11 });
    var zeroY = gy + 20 + (gh - 28) / 2;
    ctx.fillStyle = C.faint;
    ctx.fillRect(gx + 10, zeroY, gw - 20, 1);
    if (hist.length > 1) {
      ctx.beginPath();
      for (var k = 0; k < hist.length; k++) {
        var px = gx + 10 + (gw - 20) * ((HIST_N - hist.length + k) / (HIST_N - 1));
        var py = zeroY - (hist[k] / 14) * ((gh - 28) / 2);
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }

  /* ---------------- skaters scene ---------------- */

  var SK_F = 240, SK_T = 0.4, SK_WORLD = 16;
  var sk = { ma: 60, mb: 40, xa: -0.35, xb: 0.35, va: 0, vb: 0, phase: 'ready', t: 0 };

  function resetSkaters() {
    sk.xa = -0.35; sk.xb = 0.35; sk.va = 0; sk.vb = 0; sk.phase = 'ready'; sk.t = 0;
  }

  function stepSkaters(dt) {
    var pushing = sk.phase === 'push';
    if (pushing) {
      sk.va -= (SK_F / sk.ma) * dt;
      sk.vb += (SK_F / sk.mb) * dt;
      sk.t += dt;
      if (sk.t >= SK_T) {
        // snap to the exact impulse so the numbers come out clean
        sk.va = -(SK_F * SK_T) / sk.ma;
        sk.vb = (SK_F * SK_T) / sk.mb;
        sk.phase = 'glide';
      }
    }
    if (sk.phase === 'push' || sk.phase === 'glide') {
      sk.xa += sk.va * dt;
      sk.xb += sk.vb * dt;
      if (sk.xa < -SK_WORLD / 2 + 0.8 || sk.xb > SK_WORLD / 2 - 0.8) sk.phase = 'done';
    }

    var msg;
    if (sk.phase === 'ready') {
      msg = 'Two skaters stand still on ice with their hands together. Press Push off.';
    } else if (sk.phase === 'push') {
      msg = 'A pushes B with ' + SK_F + ' N. B pushes A with ' + SK_F + ' N in the opposite direction. The two forces are always equal.';
    } else {
      msg = 'Equal forces, unequal masses: the lighter skater gained more speed. Mass × speed is ' +
        Math.round(sk.ma * Math.abs(sk.va)) + ' kg·m/s for both.';
    }
    L.set('s-msg', msg);
    L.set('s-fa', (pushing ? '−' + SK_F : '0') + ' N');
    L.set('s-fb', (pushing ? '+' + SK_F : '0') + ' N');
    L.set('s-va', L.fmt(Math.abs(sk.va)) + ' m/s');
    L.set('s-vb', L.fmt(Math.abs(sk.vb)) + ' m/s');
  }

  function drawSkater(cx, floorY, mass, label, facing, unit) {
    var bodyH = unit * (0.72 + (mass - 40) * 0.006);
    var bodyW = unit * (0.26 + (mass - 40) * 0.003);
    var headR = unit * 0.12;
    var legH = unit * 0.16;
    var bodyTop = floorY - legH - bodyH;
    ctx.fillStyle = C.body;
    L.roundRect(ctx, cx - bodyW / 2, bodyTop, bodyW, bodyH, bodyW * 0.35);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, bodyTop - headR - 3, headR, 0, Math.PI * 2);
    ctx.fill();
    // arm reaching toward the other skater
    ctx.strokeStyle = C.body;
    ctx.lineWidth = unit * 0.07;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + facing * bodyW * 0.3, bodyTop + bodyH * 0.28);
    ctx.lineTo(cx + facing * (bodyW / 2 + unit * 0.16), bodyTop + bodyH * 0.34);
    ctx.stroke();
    // legs and skate blades
    ctx.lineWidth = unit * 0.06;
    ctx.beginPath();
    ctx.moveTo(cx - bodyW * 0.2, bodyTop + bodyH - 2); ctx.lineTo(cx - bodyW * 0.2, floorY - 3);
    ctx.moveTo(cx + bodyW * 0.2, bodyTop + bodyH - 2); ctx.lineTo(cx + bodyW * 0.2, floorY - 3);
    ctx.stroke();
    ctx.strokeStyle = C.mute;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - bodyW * 0.45, floorY - 1.5); ctx.lineTo(cx + bodyW * 0.45, floorY - 1.5);
    ctx.stroke();
    L.text(ctx, label, cx, bodyTop + bodyH * 0.5, { color: C.dark, size: Math.max(12, unit * 0.14), weight: 700, align: 'center', baseline: 'middle' });
    return { top: bodyTop - headR * 2 - 3, chest: bodyTop + bodyH * 0.34, halfW: bodyW / 2 };
  }

  function drawSkaters() {
    var w = view.w, h = view.h;
    var floorY = h - 48;
    var ppm = w / SK_WORLD;
    var unit = Math.min(120, (floorY - 70) * 0.72);
    var mid = w / 2;

    ctx.fillStyle = '#12203A';
    ctx.fillRect(0, floorY, w, h - floorY);
    ctx.fillStyle = C.line;
    ctx.fillRect(0, floorY, w, 2);
    for (var i = -8; i <= 8; i++) ctx.fillRect(mid + i * ppm, floorY + 2, 2, i % 2 === 0 ? 12 : 7);
    L.text(ctx, 'Ice: no friction  ·  marks are 1 m apart', 14, h - 12);

    var ax = mid + sk.xa * ppm, bx = mid + sk.xb * ppm;
    var a = drawSkater(ax, floorY, sk.ma, 'A', 1, unit);
    var b = drawSkater(bx, floorY, sk.mb, 'B', -1, unit);
    L.text(ctx, sk.ma + ' kg', ax, floorY + 30, { color: C.ink, size: 13, weight: 600, align: 'center' });
    L.text(ctx, sk.mb + ' kg', bx, floorY + 30, { color: C.ink, size: 13, weight: 600, align: 'center' });

    if (sk.phase === 'push') {
      var len = Math.min(110, w * 0.14);
      L.arrow(ctx, ax - a.halfW - 6, a.chest, ax - a.halfW - 6 - len, a.chest, C.orange, 6);
      L.arrow(ctx, bx + b.halfW + 6, b.chest, bx + b.halfW + 6 + len, b.chest, C.orange, 6);
      L.text(ctx, SK_F + ' N', ax - a.halfW - 6 - len / 2, a.chest - 12, { color: C.orange, size: 13, weight: 600, align: 'center' });
      L.text(ctx, SK_F + ' N', bx + b.halfW + 6 + len / 2, b.chest - 12, { color: C.orange, size: 13, weight: 600, align: 'center' });
    }
    var sv = Math.min(34, w * 0.045);
    if (Math.abs(sk.va) > 0.02) L.arrow(ctx, ax, a.top - 14, ax + sk.va * sv, a.top - 14, C.blue, 5);
    if (Math.abs(sk.vb) > 0.02) L.arrow(ctx, bx, b.top - 14, bx + sk.vb * sv, b.top - 14, C.blue, 5);

    L.legend(ctx, [['Velocity', C.blue], ['Force', C.orange]], w - 14, 20);
  }

  /* ---------------- wiring ---------------- */

  L.hold(document.getElementById('b-left'), function () { block.dir = -1; }, function () { if (block.dir === -1) block.dir = 0; });
  L.hold(document.getElementById('b-right'), function () { block.dir = 1; }, function () { if (block.dir === 1) block.dir = 0; });
  var forceInput = document.getElementById('b-force');
  forceInput.addEventListener('input', function () {
    block.F = Number(forceInput.value);
    L.set('b-force-val', block.F + ' N');
  });
  L.seg(document.getElementById('b-mass'), function (v) { block.m = Number(v); });
  L.seg(document.getElementById('b-fric'), function (v) { block.mu = Number(v); });
  document.getElementById('b-reset').addEventListener('click', resetBlock);

  document.getElementById('s-push').addEventListener('click', function () {
    if (sk.phase !== 'ready') resetSkaters();
    sk.phase = 'push';
    sk.t = 0;
  });
  L.seg(document.getElementById('s-ma'), function (v) { sk.ma = Number(v); resetSkaters(); });
  L.seg(document.getElementById('s-mb'), function (v) { sk.mb = Number(v); resetSkaters(); });
  document.getElementById('s-reset').addEventListener('click', resetSkaters);

  L.scenes(document.getElementById('scene-tabs'), function (name) {
    scene = name;
    block.dir = 0;
  });

  L.loop(function (dt) {
    ctx.clearRect(0, 0, view.w, view.h);
    if (scene === 'block') { stepBlock(dt); drawBlock(); }
    else { stepSkaters(dt); drawSkaters(); }
  });
})();
