/* =========================================================================
   GAME — canvas, input, scene stack, main loop.

   The canvas is exactly 360x640 device pixels and CSS blows it up with
   image-rendering:pixelated, so a game pixel is always a clean square and
   nothing is ever half a pixel anywhere.
   ========================================================================= */
const Input = {
  x:-99, y:-99, down:false, justDown:false, justUp:false,
  startX:0, startY:0, dx:0, dy:0, moved:0, downT:0,
  swipeX:0, swipeY:0, swiped:false, wheel:0
};

const Game = (() => {
  const cv = document.getElementById('screen');
  const c = cv.getContext('2d');
  cv.width = VW; cv.height = VH;
  c.imageSmoothingEnabled = false;

  const scenes = {};
  let cur = null, curName = '', pending = null, trans = 0, transDir = 0, t = 0, last = 0, running = false;
  let fpsAcc = 0, fpsN = 0, fps = 60;

  /* ---- fit the canvas into whatever window it is given ------------------ */
  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min(vw/VW, vh/VH);
    /* prefer whole-number scaling when there is room; it is sharper */
    const si = Math.floor(s);
    const use = (si >= 1 && s - si < 0.34) ? si : s;
    cv.style.width  = Math.round(VW*use) + 'px';
    cv.style.height = Math.round(VH*use) + 'px';
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 120));

  /* ---- input ------------------------------------------------------------ */
  function toVirt(e) {
    const r = cv.getBoundingClientRect();
    return [ (e.clientX - r.left) / r.width * VW, (e.clientY - r.top) / r.height * VH ];
  }
  let queueDown = false, queueUp = false;
  function onDown(e) {
    const [x,y] = toVirt(e);
    Input.x = x; Input.y = y; Input.startX = x; Input.startY = y;
    Input.dx = 0; Input.dy = 0; Input.moved = 0; Input.downT = t;
    queueDown = true; Input.down = true;
    SFX.unlock();
    if (e.cancelable) e.preventDefault();
  }
  function onMove(e) {
    const [x,y] = toVirt(e);
    if (Input.down) { Input.dx = x - Input.startX; Input.dy = y - Input.startY;
                      Input.moved += dist(Input.x,Input.y,x,y); }
    Input.x = x; Input.y = y;
    if (e.cancelable && Input.down) e.preventDefault();
  }
  function onUp(e, cancelled) {
    if (!Input.down) return;
    /* a cancelled gesture (the browser deciding it was a scroll, a call
       coming in) releases the pointer but must not count as a tap */
    queueUp = !cancelled; Input.down = false;
    const dt = t - Input.downT;
    if (dt < .45 && Math.abs(Input.dx) > 26 && Math.abs(Input.dx) > Math.abs(Input.dy)) {
      Input.swipeX = Math.sign(Input.dx); Input.swiped = true;
    } else if (dt < .45 && Math.abs(Input.dy) > 26) { Input.swipeY = Math.sign(Input.dy); Input.swiped = true; }
    if (e && e.cancelable) e.preventDefault();
  }
  cv.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', e => onUp(e, true));
  window.addEventListener('blur', () => onUp(null, true));
  /* touch fallback for anything without Pointer Events */
  if (!window.PointerEvent) {
    const t0 = e => { const t = e.changedTouches[0]; onDown({ clientX:t.clientX, clientY:t.clientY, cancelable:e.cancelable, preventDefault:() => e.preventDefault() }); };
    const tm = e => { const t = e.changedTouches[0]; onMove({ clientX:t.clientX, clientY:t.clientY, cancelable:e.cancelable, preventDefault:() => e.preventDefault() }); };
    cv.addEventListener('touchstart', t0, { passive:false });
    window.addEventListener('touchmove', tm, { passive:false });
    window.addEventListener('touchend', e => onUp(e));
    window.addEventListener('touchcancel', e => onUp(e, true));
  }
  cv.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('wheel', e => { Input.wheel += Math.sign(e.deltaY); }, { passive:true });
  window.addEventListener('keydown', e => {
    if (cur && cur.key) cur.key(e.key);
    if (e.key === 'Escape' && cur && cur.back) cur.back();
  });

  /* ---- transition wipe: a grid of squares that snaps shut and opens ------ */
  function drawWipe(k, col) {
    const cell = 20, cols = Math.ceil(VW/cell), rows = Math.ceil(VH/cell);
    c.fillStyle = col || P.ink;
    for (let j=0;j<rows;j++) for (let i=0;i<cols;i++) {
      const d = (i + j*0.6) / (cols + rows*0.6);
      const local = clamp((k - d*0.42) / 0.58, 0, 1);
      const s = Math.ceil(cell * ease.out(local));
      if (s > 0) c.fillRect(i*cell + (cell-s)/2, j*cell + (cell-s)/2, s, s);
    }
  }

  const api = {
    get ctx() { return c; },
    get t() { return t; },
    get fps() { return fps; },
    get sceneName() { return curName; },
    register(name, obj) { scenes[name] = obj; },
    scene(name) { return scenes[name]; },

    go(name, data, instant) {
      if (instant) { swap(name, data); return; }
      pending = { name, data }; transDir = 1; trans = 0;
    },
    /* scenes call this for a full-screen modal-ish push (chest, results) */
    peek() { return curName; },

    start() {
      if (running) return; running = true;
      resize(); SFX.unlock(); SFX.toggle(S.d.sound); SFX.music(true);
      const bonus = S.checkDay();
      swap(S.d.made ? 'island' : 'creator', bonus ? { dailyBonus:bonus } : null);
      last = performance.now();
      requestAnimationFrame(loop);
    }
  };

  function swap(name, data) {
    if (cur && cur.exit) cur.exit();
    FX.clear();
    cur = scenes[name]; curName = name;
    Input.justDown = Input.justUp = false; Input.swiped = false;
    if (cur && cur.enter) cur.enter(data || {});
  }

  function loop(now) {
    let dt = (now - last)/1000; last = now;
    if (dt > .12) dt = .12;
    t += dt;
    fpsAcc += dt; fpsN++;
    if (fpsAcc > .5) { fps = Math.round(fpsN/fpsAcc); fpsAcc = 0; fpsN = 0; }

    Input.justDown = queueDown; Input.justUp = queueUp;
    queueDown = queueUp = false;

    const sdt = dt * FX.timeScale;
    UI.frame(dt);
    S.tickBuildings();

    if (cur && cur.update) cur.update(sdt);
    FX.update(sdt);

    c.save();
    const [sx,sy] = FX.shakeOffset();
    c.translate(sx,sy);
    if (cur && cur.draw) cur.draw(c, sdt); else { c.fillStyle = P.ink; c.fillRect(0,0,VW,VH); }
    c.restore();

    FX.drawFlash(c);
    UI.drawToasts(c);

    /* transitions */
    if (transDir) {
      trans += dt * 2.6;
      if (transDir === 1) {
        drawWipe(clamp(trans,0,1));
        if (trans >= 1) { swap(pending.name, pending.data); pending = null; transDir = -1; trans = 0; }
      } else {
        drawWipe(1 - clamp(trans,0,1));
        if (trans >= 1) { transDir = 0; trans = 0; }
      }
    }

    Input.swiped = false; Input.swipeX = 0; Input.swipeY = 0; Input.wheel = 0;
    requestAnimationFrame(loop);
  }

  return api;
})();

/* the one bit of DOM: the boot card, which also unlocks audio */
(() => {
  const boot = document.getElementById('boot'), btn = document.getElementById('bstart');
  const go = () => { boot.classList.add('gone'); setTimeout(() => boot.remove(), 500); Game.start(); };
  btn.addEventListener('click', go);
  btn.addEventListener('touchend', e => { e.preventDefault(); go(); });
})();
