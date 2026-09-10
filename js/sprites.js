/* =========================================================================
   THE WISE OAK TREE — pixel renderer
   256x192 logical pixels, fillRect only, scaled up with image-rendering:
   pixelated. No image assets, no libraries.

   The look: layered forest depth, mist, god rays, and a big gnarled face
   with warm amber eyes that is friendly right up until it isn't.
   ========================================================================= */

let W = 256;                 // logical width follows the window's aspect
const H = 192;               // logical height is fixed
let CX = 128;                // the tree stands here
const GROUND_Y = 150;

/* Called on resize. Everything width-dependent is regenerated. */
function setLogicalWidth(w) {
  W = Math.max(224, Math.min(560, Math.round(w)));
  CX = Math.round(W / 2);
  _layer.cv.width = W; _layer.cv.height = H; _layer.ctx.imageSmoothingEnabled = false;
  _silo.cv.width = W; _silo.cv.height = H; _silo.ctx.imageSmoothingEnabled = false;
  FRAME = makeFrame();
  BG_TREES = makeBgTrees();
  repositionTree();
  skyCache.key = -1;
  return W;
}

/* ---------------- tiny helpers ---------------- */
function px(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x | 0, y | 0, w | 0, h | 0); }
function dot(c, x, y, col) { c.fillStyle = col; c.fillRect(x | 0, y | 0, 1, 1); }

function pcircle(c, cx, cy, r, col) {
  c.fillStyle = col;
  for (let y = -r; y <= r; y++) {
    const hw = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
    if (hw > 0) c.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2, 1);
  }
}

function pellipse(c, cx, cy, rx, ry, col) {
  c.fillStyle = col;
  for (let y = -ry; y <= ry; y++) {
    const hw = Math.round(Math.sqrt(Math.max(0, 1 - (y / ry) ** 2)) * rx);
    if (hw > 0) c.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2, 1);
  }
}

/* A soft radial glow. Deliberately few rings: stacking one per pixel of
   radius saturates to a solid disc and flattens whatever is underneath. */
function glow(c, cx, cy, r, col, alpha) {
  const steps = 6;
  for (let i = steps; i >= 1; i--) {
    c.globalAlpha = alpha * (1 - (i - 1) / steps) * 0.22;
    pcircle(c, cx, cy, r * (i / steps), col);
  }
  c.globalAlpha = 1;
}

/* -------------------------------------------------------------------------
   OUTLINES
   Classic pixel-art contours. A sprite is drawn into a scratch canvas, the
   scratch is tinted solid to make a silhouette, that silhouette is stamped
   at eight offsets, and the sprite goes on top. One dark edge, no gaps.
   ------------------------------------------------------------------------- */
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return { cv: c, ctx: x };
}

const _layer = makeCanvas(560, H);     // foreground actors, outlined as a group
const _silo = makeCanvas(560, H);      // their silhouette
const _tro = makeCanvas(64, 64);      // one trophy at a time
const _troSilo = makeCanvas(64, 64);

const OUTLINE_OFFSETS = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];

function layerBegin() {
  _layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
  _layer.ctx.clearRect(0, 0, W, H);
  return _layer.ctx;
}

/* stamp the collected layer onto `c` with a contour around it */
function layerEnd(c, col, thick) {
  const W2 = W;
  const s = _silo.ctx;
  s.setTransform(1, 0, 0, 1, 0, 0);
  s.clearRect(0, 0, W, H);
  s.globalCompositeOperation = 'source-over';
  s.drawImage(_layer.cv, 0, 0);
  s.globalCompositeOperation = 'source-in';
  s.fillStyle = col; s.fillRect(0, 0, W2, H);
  s.globalCompositeOperation = 'source-over';
  for (const [dx, dy] of OUTLINE_OFFSETS) c.drawImage(_silo.cv, dx * (thick || 1), dy * (thick || 1));
  c.drawImage(_layer.cv, 0, 0);
}

/* the same trick for a single small sprite, with a cache */
const _spriteCache = new Map();
function outlinedSprite(key, w, h, draw, col) {
  let hit = _spriteCache.get(key);
  if (hit) return hit;
  const a = makeCanvas(w, h), b = makeCanvas(w, h);
  draw(a.ctx, w / 2, h / 2);
  b.ctx.drawImage(a.cv, 0, 0);
  b.ctx.globalCompositeOperation = 'source-in';
  b.ctx.fillStyle = col; b.ctx.fillRect(0, 0, w, h);
  b.ctx.globalCompositeOperation = 'source-over';
  const out = makeCanvas(w, h);
  for (const [dx, dy] of OUTLINE_OFFSETS) out.ctx.drawImage(b.cv, dx, dy);
  out.ctx.drawImage(a.cv, 0, 0);
  _spriteCache.set(key, out.cv);
  return out.cv;
}

function hex2rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function rgb2hex(r) { return '#' + r.map(v => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2hex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}
function quant(hex, q) { return rgb2hex(hex2rgb(hex).map(v => Math.round(v / q) * q)); }

function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- palettes ---------------- */
const SKY = {
  day:   ['#8fd0ea', '#b6e2f2', '#dcf1f7', '#f4fbfd'],
  dusk:  ['#3b2a5e', '#8a4a72', '#e0755c', '#f8c98b'],
  night: ['#070b22', '#101740', '#1b2757', '#2b3a72'],
  dawn:  ['#4a3a72', '#b06a86', '#f0956f', '#ffe0b0']
};

/* five tones per season: deepest shade -> sunlit tip, plus a speck colour */
const SEASON = {
  spring: { t0: '#1d4a1c', t1: '#2f6b28', t2: '#4a9235', t3: '#6fbc45', t4: '#a3dd6a', accent: '#ffd9ea', dark: '#123212' },
  summer: { t0: '#143d14', t1: '#255c1e', t2: '#3d842b', t3: '#5aab38', t4: '#8ccf55', accent: '#e8f36b', dark: '#0d2a0d' },
  autumn: { t0: '#5a2a10', t1: '#8a4416', t2: '#c06a1e', t3: '#e8992c', t4: '#f7cc55', accent: '#ef5330', dark: '#3d1c0b' },
  winter: { t0: '#4a5a68', t1: '#69798a', t2: '#8fa1b2', t3: '#b8c8d6', t4: '#e4eef5', accent: '#ffffff', dark: '#33404c' }
};
const SEASON_NAMES = ['spring', 'summer', 'autumn', 'winter'];

function skyBands(t) {
  let a, b, k;
  if (t < 0.15)      { a = SKY.dawn;  b = SKY.day;   k = t / 0.15; }
  else if (t < 0.50) { a = SKY.day;   b = SKY.day;   k = 0; }
  else if (t < 0.65) { a = SKY.day;   b = SKY.dusk;  k = (t - 0.50) / 0.15; }
  else if (t < 0.75) { a = SKY.dusk;  b = SKY.night; k = (t - 0.65) / 0.10; }
  else if (t < 0.92) { a = SKY.night; b = SKY.night; k = 0; }
  else               { a = SKY.night; b = SKY.dawn;  k = (t - 0.92) / 0.08; }
  return a.map((c, i) => mix(c, b[i], k));
}
function isNight(t) { return t > 0.68 && t < 0.95; }
/* how dark the world is, 0 = noon, 1 = deep night — drives every tint */
function darkness(t) {
  if (t < 0.12) return 1 - t / 0.12;
  if (t < 0.52) return 0;
  if (t < 0.70) return (t - 0.52) / 0.18;
  if (t < 0.93) return 1;
  return 1 - (t - 0.93) / 0.07;
}

let skyCache = { key: -1, rows: null };
function skyRows(t) {
  const key = Math.round(t * 900);
  if (skyCache.key === key) return skyCache.rows;
  const bands = skyBands(t);
  const rows = new Array(GROUND_Y);
  for (let y = 0; y < GROUND_Y; y++) {
    const f = y / (GROUND_Y - 1) * 3;
    const i = Math.min(2, Math.floor(f));
    rows[y] = quant(mix(bands[i], bands[i + 1], f - i), 8);
  }
  skyCache = { key, rows };
  return rows;
}

/* ---------------- geometry, generated once ---------------- */

/* main crown: blobs carry a tone index so the canopy breaks into patches of
   light and shade instead of reading as one flat green lump */
function makeCanopy(seed) {
  const rnd = mulberry(seed);
  const blobs = [];
  const push = (x, y, r, tone) => blobs.push({ x, x0: x, y, r, tone, s: rnd(), ph: rnd() * 6.28 });
  push(128, 52, 34, 1); push(98, 60, 26, 1); push(158, 60, 26, 1);
  push(112, 40, 22, 2); push(146, 40, 22, 2);
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.pow(rnd(), 0.5);
    const x = 128 + Math.cos(a) * 62 * d;
    const y = 52 + Math.sin(a) * 32 * d;
    // higher and more central blobs catch more sun
    const lit = (58 - y) / 40 + (rnd() - 0.5) * 0.7;
    push(x, y, 9 + rnd() * 9, lit > 0.5 ? 3 : lit > 0.05 ? 2 : 1);
  }
  blobs.sort((a, b) => a.y - b.y);
  blobs.forEach((b, i) => { b.burn = i / blobs.length; });
  return blobs;
}
const CANOPY = makeCanopy(1337);
const BRANCHES0 = null;   // set below

/* foliage hanging into frame from the top edge — the thing that makes the
   reference picture feel like you are standing under a canopy */
function makeFrame() {
  const rnd = mulberry(2024);
  const out = [];
  const n = Math.round(26 * W / 256);
  for (let i = 0; i < n; i++) {
    const x = rnd() * (W + 40) - 20;
    const y = -10 + rnd() * 34 - Math.abs(x - W / 2) / W * 14;
    out.push({ x, y, r: 12 + rnd() * 20, ph: rnd() * 6.28, sp: 0.4 + rnd() * 0.6 });
  }
  for (let i = 0; i < 8; i++) {   // upper corners get heavier
    const left = i < 4;
    out.push({ x: left ? -8 + rnd() * 46 : W + 8 - rnd() * 46, y: 10 + rnd() * 44,
               r: 16 + rnd() * 18, ph: rnd() * 6.28, sp: 0.5 });
  }
  return out;
}
let FRAME = makeFrame();

/* misty background trees */
function makeBgTrees() {
  const rnd = mulberry(555);
  const out = [];
  const n = Math.round(22 * W / 256);
  for (let i = 0; i < n; i++) {
    const x = rnd() * W;
    if (Math.abs(x - CX) < 36) continue;           // keep the middle clear
    const depth = rnd();
    out.push({ x, depth, h: 26 + rnd() * 40 * (1 - depth * 0.5), r: 10 + rnd() * 14 });
  }
  return out.sort((a, b) => b.depth - a.depth);
}
let BG_TREES = makeBgTrees();

const BRANCHES_SRC = [
  [[128, 100], [108, 86], [90, 74], [78, 62]],
  [[128, 100], [148, 86], [166, 74], [178, 62]],
  [[128, 96],  [122, 78], [114, 60], [106, 46]],
  [[128, 96],  [134, 76], [142, 58], [150, 44]],
  [[128, 94],  [128, 72], [128, 52], [128, 36]]
];
let BRANCHES = BRANCHES_SRC;

let TWIGS = (function () {
  const rnd = mulberry(808);
  const out = [];
  for (const b of BRANCHES) {
    const [tx, ty] = b[b.length - 1];
    const [px0, py0] = b[b.length - 2];
    const base = Math.atan2(ty - py0, tx - px0);
    for (let i = 0; i < 4; i++) {
      const a = base + (rnd() - 0.5) * 1.5;
      const len = 9 + rnd() * 13;
      const x2 = tx + Math.cos(a) * len, y2 = ty + Math.sin(a) * len;
      out.push([tx, ty, x2, y2]);
      for (let j = 0; j < 2; j++) {
        const a2 = a + (rnd() - 0.5) * 1.6, l2 = 5 + rnd() * 8;
        out.push([x2, y2, x2 + Math.cos(a2) * l2, y2 + Math.sin(a2) * l2]);
      }
    }
  }
  return out;
})();
const TWIGS_SRC = TWIGS.map(t => t.slice());

/* Re-centre every authored piece of tree geometry on the current CX. */
function repositionTree() {
  const d = CX - 128;
  for (const b of CANOPY) b.x = b.x0 + d;
  BRANCHES = BRANCHES_SRC.map(br => br.map(([x, y]) => [x + d, y]));
  for (let i = 0; i < TWIGS.length; i++) {
    TWIGS[i][0] = TWIGS_SRC[i][0] + d; TWIGS[i][2] = TWIGS_SRC[i][2] + d;
  }
}

/* the trunk is wide and gnarled so there is room for a real face on it */
function trunkHalfWidth(y) {
  const k = Math.max(0, (GROUND_Y - y) / 62);          // 0 at the ground, 1 at the crown
  const flare = Math.pow(Math.max(0, 1 - k * 4), 2) * 15;
  return 27 + flare - k * 2 - Math.sin(k * 4.2) * 1.5;
}

/* =========================================================================
   BACKDROP — sky, mist, distant woods, god rays
   ========================================================================= */

function drawBackdrop(c, g) {
  const rows = skyRows(g.timeOfDay);
  const dk = darkness(g.timeOfDay);
  let prev = null;
  for (let y = 0; y < GROUND_Y; y++) {
    px(c, 0, y, W, 1, rows[y]);
    if (prev && prev !== rows[y]) for (let x = y % 2; x < W; x += 2) dot(c, x, y - 1, rows[y]);
    prev = rows[y];
  }

  if (dk > 0.55) {
    const rnd = mulberry(7);
    for (let i = 0; i < 90; i++) {
      const x = Math.floor(rnd() * W), y = Math.floor(rnd() * 120);
      const tw = 0.5 + 0.5 * Math.sin(g.t * 2 + i);
      if (tw > 0.68) { c.globalAlpha = (dk - 0.55) / 0.45; dot(c, x, y, tw > 0.93 ? '#ffffff' : '#b9c9ff'); c.globalAlpha = 1; }
    }
  }

  // sun / moon
  const ang = Math.PI * (g.timeOfDay * 2 % 2);
  const sx = 20 + (1 - Math.cos(ang)) * 108, sy = 118 - Math.sin(ang) * 92;
  if (dk < 0.75) {
    c.globalAlpha = 1 - dk;
    glow(c, sx, sy, 26, '#fff2c0', 0.55);
    pcircle(c, sx, sy, 9, '#fff8dc'); pcircle(c, sx, sy, 7, '#ffe680');
    c.globalAlpha = 1;
  } else {
    const mx = W - sx;
    glow(c, mx, sy, 20, '#cdd8ff', 0.4);
    pcircle(c, mx, sy, 8, '#eef2ff');
    pcircle(c, mx - 4, sy - 3, 6, rows[Math.max(0, Math.min(GROUND_Y - 1, Math.round(sy - 3)))]);
  }

  // a pale bloom of mist behind the tree, like light coming through the wood
  const bloom = mix('#ffffff', '#f6d8c8', 0.35);
  c.globalAlpha = 0.5 * (1 - dk * 0.8);
  pellipse(c, 150, 118, 90, 40, bloom);
  c.globalAlpha = 0.35 * (1 - dk * 0.8);
  pellipse(c, 150, 122, 60, 26, '#ffffff');
  c.globalAlpha = 1;

  // distant woods, fading into that mist
  for (const t of BG_TREES) {
    const fade = 0.30 + t.depth * 0.55;
    const base = GROUND_Y - 2 + t.depth * 6;
    let col = mix(SEASON[g.season].t1, bloom, fade);
    col = mix(col, '#0a1226', dk * 0.85);
    pellipse(c, t.x, base - t.h, t.r, t.h * 0.42, col);
    px(c, t.x - 1, base - t.h * 0.6, 3, t.h * 0.6, mix(mix('#4a3a2a', bloom, fade), '#0a1226', dk * 0.85));
  }

  // god rays slanting through
  const rayA = (1 - dk) * 0.13;
  if (rayA > 0.01) {
    c.globalAlpha = rayA;
    for (let i = 0; i < 6; i++) {
      const w = 6 + i * 3;
      const x0 = 40 + i * 34 + Math.sin(g.t * 0.25 + i) * 5;
      for (let y = 0; y < GROUND_Y; y++) px(c, x0 + y * 0.42, y, w, 1, '#fff6d8');
    }
    c.globalAlpha = 1;
  }
}

/* dust motes drifting in the light */
function drawBokeh(c, g) {
  const dk = darkness(g.timeOfDay);
  const rnd = mulberry(31);
  for (let i = 0; i < 30; i++) {
    const sp = 0.3 + rnd() * 0.8;
    const x = (rnd() * W + g.t * 4 * sp) % W;
    const y = (rnd() * GROUND_Y - g.t * 3 * sp + GROUND_Y * 4) % GROUND_Y;
    const r = rnd() > 0.85 ? 2 : 1;
    c.globalAlpha = (0.18 + 0.3 * Math.abs(Math.sin(g.t * 0.8 + i))) * (dk > 0.6 ? 0.5 : 1);
    pcircle(c, x, y, r, dk > 0.6 ? '#9fd6ff' : '#fff6cf');
    c.globalAlpha = 1;
  }
  // fireflies after dark
  if (dk > 0.6) {
    for (let i = 0; i < 12; i++) {
      const x = 20 + ((i * 37 + Math.sin(g.t * 0.5 + i) * 40 + g.t * 6) % (W - 40));
      const y = 90 + Math.sin(g.t * 0.9 + i * 2) * 28;
      const blink = Math.sin(g.t * 2.4 + i * 1.7);
      if (blink > 0.3) { glow(c, x, y, 4, '#c8ff8a', 0.5); dot(c, x, y, '#eaffb0'); }
    }
  }
}

/* ---------------- ground ---------------- */
function drawGround(c, g) {
  const dk = darkness(g.timeOfDay);
  const s = SEASON[g.season];
  const winter = g.season === 'winter';
  const shade = col => mix(col, '#0a1226', dk * 0.8);

  let g1 = winter ? '#e9f1f8' : mix(s.t3, '#7fbf50', 0.35);
  let g2 = winter ? '#d2dfeb' : mix(s.t2, '#4f9a3a', 0.4);
  let g3 = winter ? '#b9c9d8' : s.t1;
  if (g.season === 'autumn') { g1 = '#9aa844'; g2 = '#7c8a38'; g3 = '#5c6a2a'; }

  for (let x = 0; x < W; x++) {
    const y = GROUND_Y - 3 + Math.round(Math.sin(x / 21) * 2 + Math.sin(x / 7) * 1);
    px(c, x, y, 1, H - y, shade(g1));
  }
  px(c, 0, GROUND_Y + 12, W, H, shade(g2));
  px(c, 0, GROUND_Y + 28, W, H, shade(g3));

  // grass blades catching the light
  const rnd = mulberry(9);
  for (let i = 0; i < 150; i++) {
    const x = Math.floor(rnd() * W);
    const y = GROUND_Y + Math.floor(rnd() * (H - GROUND_Y));
    const near = (y - GROUND_Y) / (H - GROUND_Y);
    const h = 1 + Math.floor(near * 3);
    const lit = rnd() > 0.72;
    px(c, x, y - h, 1, h, shade(lit ? (winter ? '#ffffff' : mix(g1, '#d8f08a', 0.5)) : g2));
  }
  // little white flowers
  if (!winter) for (let i = 0; i < 26; i++) {
    const x = Math.floor(rnd() * W), y = GROUND_Y + 4 + Math.floor(rnd() * 34);
    dot(c, x, y, shade(g.season === 'autumn' ? '#e8c36b' : '#ffffff'));
    dot(c, x + 1, y, shade('#e8e8d0'));
  }
}

/* bushes framing the bottom corners, drawn in front of everything */
function drawForeground(c, g) {
  const dk = darkness(g.timeOfDay);
  const s = SEASON[g.season];
  const rnd = mulberry(64);
  const shade = col => mix(col, '#060c18', dk * 0.85);
  const clumps = [];
  for (let i = 0; i < Math.round(7 * W / 256); i++) {
    const t = i / Math.max(1, Math.round(7 * W / 256) - 1);
    clumps.push([-6 + t * (W + 12) + (i % 2 ? 18 : -12), 190 + (i % 3) * 8, 18 + (i % 3) * 4]);
  }
  for (const [x, y, r] of clumps) {
    pellipse(c, x, y, r, r * 0.7, shade(s.t0));
    pellipse(c, x - 2, y - 3, r * 0.8, r * 0.5, shade(s.t1));
    for (let i = 0; i < 14; i++) {
      const bx = x + (rnd() - 0.5) * r * 1.6, by = y - r * 0.6 + (rnd() - 0.5) * r * 0.6;
      pcircle(c, bx, by, 2 + rnd() * 3, shade(rnd() > 0.6 ? s.t2 : s.t1));
    }
  }
}

/* the canopy hanging into frame from above */
function drawFrameFoliage(c, g) {
  const dk = darkness(g.timeOfDay);
  const s = SEASON[g.season];
  const shade = col => mix(col, '#050b16', dk * 0.88);
  for (const f of FRAME) {
    const sw = Math.sin(g.t * 0.7 * f.sp + f.ph) * 2;
    pcircle(c, f.x + sw, f.y, f.r, shade(s.dark));
  }
  for (const f of FRAME) {
    const sw = Math.sin(g.t * 0.7 * f.sp + f.ph) * 2;
    pcircle(c, f.x + sw - 1, f.y - 2, f.r * 0.72, shade(s.t0));
    if (f.r > 18) pcircle(c, f.x + sw - 2, f.y - 5, f.r * 0.4, shade(s.t1));
  }
  // a few sunlit leaves on the underside so the frame is not a black bar
  const rnd = mulberry(12);
  for (let i = 0; i < 40; i++) {
    const f = FRAME[Math.floor(rnd() * FRAME.length)];
    const a = rnd() * 6.28;
    const x = f.x + Math.cos(a) * f.r * 0.9, y = f.y + Math.abs(Math.sin(a)) * f.r * 0.9;
    pcircle(c, x, y, 1 + rnd() * 2, shade(rnd() > 0.5 ? s.t2 : s.t1));
  }
}

/* =========================================================================
   THE TREE
   ========================================================================= */

/* every expression the old man can pull */
const MOODS = {
  chill:  { lid: 0.30, brow:  0, tilt:  0, mouth: 'smile', pupil: 1.0, squint: 0.0 },
  idle:   { lid: 0.30, brow:  0, tilt:  0, mouth: 'smile', pupil: 1.0, squint: 0.0 },
  happy:  { lid: 0.18, brow: -2, tilt:  0, mouth: 'grin',  pupil: 1.0, squint: 0.35 },
  laugh:  { lid: 0.30, brow: -3, tilt:  0, mouth: 'open',  pupil: 1.0, squint: 0.6 },
  sad:    { lid: 0.36, brow:  2, tilt: -1, mouth: 'frown', pupil: 1.1, squint: 0.0 },
  sob:    { lid: 0.46, brow:  3, tilt: -2, mouth: 'frown', pupil: 1.2, squint: 0.0 },
  smug:   { lid: 0.40, brow: -1, tilt:  1, mouth: 'smirk', pupil: 1.0, squint: 0.25 },
  sly:    { lid: 0.48, brow: -1, tilt:  2, mouth: 'smirk', pupil: 0.9, squint: 0.35 },
  shock:  { lid: -0.18, brow: -5, tilt: 0, mouth: 'ohh',   pupil: 0.55, squint: 0.0 },
  sleepy: { lid: 0.72, brow:  2, tilt:  0, mouth: 'flat',  pupil: 1.1, squint: 0.0 },
  think:  { lid: 0.34, brow: -1, tilt:  2, mouth: 'flat',  pupil: 1.0, squint: 0.0 },
  creepy: { lid: -0.30, brow: -1, tilt: 0, mouth: 'wide',  pupil: 0.35, squint: 0.0 },
  dead:   { lid: 0.0,  brow:  1, tilt:  0, mouth: 'flat',  pupil: 1.0, squint: 0.0 },
  asleep: { lid: 1.0,  brow:  1, tilt:  0, mouth: 'flat',  pupil: 1.1, squint: 0.0 }
};

/* a slightly wavy horizontal groove — bark is never straight */
function wrinkle(c, x, y, len, col, amp) {
  for (let i = 0; i < len; i++) {
    px(c, x + i, y + Math.round(Math.sin(i / len * Math.PI) * (amp === undefined ? 1 : amp)), 1, 1, col);
  }
}

function barkTones(g) {
  const dk = darkness(g.timeOfDay);
  const warm = 1 - dk;
  let base = { hi: '#c9a06a', mid: '#a07a4c', lo: '#6f4f2e', deep: '#432c17' };
  if (g.dead) base = { hi: '#6e6e6e', mid: '#525252', lo: '#343434', deep: '#1c1c1c' };
  const tint = (col, amt) => mix(mix(col, '#0a1226', dk * 0.7), '#ffcf8a', warm * amt);
  const t = { hi: tint(base.hi, 0.18), mid: tint(base.mid, 0.10), lo: tint(base.lo, 0.05), deep: tint(base.deep, 0.02) };
  if (g.burn > 0) {
    // char the bark, but keep enough contrast to read a face, and let the
    // firelight pick out the lit side
    const k = Math.min(0.60, g.burn * 0.75);
    for (const key in t) t[key] = mix(t[key], '#241716', k);
    const fire = Math.min(0.75, g.burn);
    t.hi = mix(t.hi, '#ff9a3a', fire * 0.75);
    t.mid = mix(t.mid, '#c25a1e', fire * 0.5);
    t.lo = mix(t.lo, '#6b2410', fire * 0.4);
  }
  return t;
}

function drawTree(c, g) {
  const s = SEASON[g.season];
  const dk = darkness(g.timeOfDay);
  const B = barkTones(g);
  const sway = Math.sin(g.t * 0.8) * 1.5 + Math.sin(g.t * 2.1) * 0.4;
  const shake = g.shake > 0 ? (Math.random() * 2 - 1) * g.shake : 0;
  const off = y => shake + sway * Math.max(0, (GROUND_Y - y) / 62) * 0.8;

  // contact shadow
  c.globalAlpha = 0.26 * (1 - dk * 0.5);
  for (let y = 0; y <= 12; y++) {
    const hw = Math.round(Math.sqrt(Math.max(0, 1 - (y / 12) ** 2)) * 58);
    if (hw > 0) px(c, CX - hw, GROUND_Y + 1 + y, hw * 2, 1, '#0d1a08');
  }
  c.globalAlpha = 1;

  // roots flaring out of the ground
  for (const dir of [-1, 1]) {
    for (let i = 0; i < 26; i++) {
      const h = Math.max(1, 12 - i * 0.44);
      const x = CX + dir * (26 + i) - (dir < 0 ? 2 : 0);
      px(c, x, GROUND_Y + 6 - h, 2, h, i < 4 ? B.mid : B.lo);
      if (i % 5 === 0) px(c, x, GROUND_Y + 5 - h, 2, 1, B.hi);
    }
    px(c, CX + dir * 52 - (dir < 0 ? 5 : 0), GROUND_Y + 4, 5, 3, B.deep);
  }

  // trunk, lit from the upper left
  for (let y = GROUND_Y + 6; y > 88; y--) {
    const hw = trunkHalfWidth(y);
    const x = CX + off(y) - hw;
    px(c, x, y, hw * 2, 1, B.mid);
    px(c, x, y, 2, 1, B.lo);
    px(c, x + 2, y, 5, 1, B.hi);                 // sunlit edge
    px(c, x + 7, y, 4, 1, mix(B.hi, B.mid, 0.5));
    px(c, x + hw * 2 - 7, y, 4, 1, B.lo);        // shadow side
    px(c, x + hw * 2 - 3, y, 3, 1, B.deep);
  }
  // bark grain
  const rnd = mulberry(5);
  for (let i = 0; i < 90; i++) {
    const y = 92 + Math.floor(rnd() * 62);
    const hw = trunkHalfWidth(y);
    const x = CX + off(y) + Math.floor((rnd() * 2 - 1) * (hw - 4));
    px(c, x, y, 1, 2 + Math.floor(rnd() * 4), rnd() > 0.45 ? B.lo : B.hi);
  }

  /* --- nine hundred years of weather ---
     Age is not one effect. It is moss on the sunless side, lichen where the
     rain sits, split bark that healed crooked, a hollow nobody filled in,
     and burls that grew where something once went wrong. */
  const age = mulberry(77);
  // deep vertical fissures, healed crooked
  for (let i = 0; i < 22; i++) {
    const y0 = 92 + age() * 56;
    const len = 6 + age() * 26;
    const hw = trunkHalfWidth(y0);
    const x0 = CX + off(y0) + (age() * 2 - 1) * (hw - 6);
    for (let y = 0; y < len; y++) {
      const wob = Math.round(Math.sin(y * 0.5 + i) * 1.2);
      px(c, x0 + wob, y0 + y, 1, 1, B.deep);
      px(c, x0 + wob + 1, y0 + y, 1, 1, mix(B.hi, B.mid, 0.4));
    }
  }
  // burls — old wounds that grew round
  for (const [by, bd] of [[104, -1], [131, 1], [146, -1]]) {
    const hw = trunkHalfWidth(by);
    const bx = CX + off(by) + bd * (hw - 7);
    pcircle(c, bx, by, 5, B.lo);
    pcircle(c, bx - 1, by - 1, 4, B.mid);
    pcircle(c, bx - 2, by - 2, 2, mix(B.hi, B.mid, 0.3));
    pcircle(c, bx, by, 1.5, B.deep);
  }
  // the hollow, low on the shadow side; something lives in there
  {
    const hy = 149, hw = trunkHalfWidth(hy);
    const hx = CX + off(hy) + hw - 13;
    pellipse(c, hx, hy, 6, 9, B.deep);
    pellipse(c, hx, hy, 5, 8, '#160d06');
    pellipse(c, hx - 1, hy - 6, 5, 2, B.lo);
    if (!g.dead && Math.sin(g.t * 0.31) > 0.94) {
      dot(c, hx - 1, hy, '#ffe066'); dot(c, hx + 2, hy, '#ffe066');
    }
  }
  // moss creeping up the sunless side, and pale lichen where rain lingers
  {
    const mossCol = mix(mix('#3f6f2c', '#0a1226', dk * 0.7), '#7fb04a', 0.25);
    const lich = mix(mix('#9fb0a0', '#0a1226', dk * 0.7), '#d8e4d0', 0.3);
    for (let i = 0; i < 150; i++) {
      const y = GROUND_Y + 4 - age() * age() * 62;
      const hw = trunkHalfWidth(y);
      const side = age() > 0.22 ? 1 : -1;
      const x = CX + off(y) + side * (hw - 1 - age() * 9);
      px(c, x, y, 1 + (age() > 0.7 ? 1 : 0), 1, age() > 0.72 ? mix(mossCol, '#8fd95a', 0.4) : mossCol);
    }
    for (let i = 0; i < 26; i++) {
      const y = 90 + age() * 58;
      const hw = trunkHalfWidth(y);
      const x = CX + off(y) + (age() * 2 - 1) * (hw - 5);
      c.globalAlpha = 0.55;
      pcircle(c, x, y, 1 + age() * 2, lich);
      c.globalAlpha = 1;
    }
  }
  // a bracket fungus, the way they always come to the very old
  {
    const fy = 121, hw = trunkHalfWidth(fy);
    const fx = CX + off(fy) - hw + 1;
    pellipse(c, fx, fy, 6, 2, mix('#c08a3a', '#0a1226', dk * 0.7));
    pellipse(c, fx, fy - 1, 5, 1.4, mix('#e0aa55', '#0a1226', dk * 0.7));
    pellipse(c, fx, fy + 1, 5, 1, mix('#7a5220', '#0a1226', dk * 0.7));
    pellipse(c, fx + 2, fy + 5, 4, 1.6, mix('#b07c34', '#0a1226', dk * 0.7));
  }

  // branches
  for (const b of BRANCHES) {
    for (let i = 0; i < b.length - 1; i++) {
      const w = 7 - i * 1.5;
      const [x1, y1] = b[i], [x2, y2] = b[i + 1];
      const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) | 0;
      for (let sI = 0; sI <= steps; sI++) {
        const p = sI / Math.max(1, steps);
        const x = x1 + (x2 - x1) * p, y = y1 + (y2 - y1) * p;
        px(c, x + off(y) - w / 2, y, w, w, B.mid);
        px(c, x + off(y) - w / 2, y, w, 1, B.lo);
      }
    }
  }

  if (!g.dead && g.season === 'winter') drawWinterCrown(c, g, off, B);
  else if (!g.dead) drawCrown(c, g, off, s, dk);

  drawFace(c, g, off, B, dk);

  if (g.flags.hatOn && !g.dead) {
    const hx = Math.round(CX + sway * 1.4), hy = 26;
    for (let y = 0; y <= 14; y++) {
      const hw = Math.round(Math.sqrt(Math.max(0, 1 - (y / 14) ** 2)) * 19);
      px(c, hx - hw, hy - y, hw * 2, 1, y > 10 ? '#e05c4e' : '#c9453b');
    }
    px(c, hx - 19, hy + 1, 38, 2, '#a83229');
    px(c, hx - 16, hy + 3, 32, 2, '#f0e2cc');
    pcircle(c, hx - 8, hy - 8, 3, '#ffe9dd'); pcircle(c, hx + 7, hy - 5, 2, '#ffe9dd');
    pcircle(c, hx + 1, hy - 12, 2, '#ffe9dd');
  }
}

/* the leafy crown, built from tone patches so it has depth */
function drawCrown(c, g, off, s, dk) {
  const shade = col => mix(col, '#050d1c', dk * 0.85);
  const tones = [s.t0, s.t1, s.t2, s.t3, s.t4].map(shade);
  const burn = g.burn;
  const live = [];
  for (const bl of CANOPY) {
    if (burn > 0 && bl.burn < burn) continue;
    bl._ox = off(bl.y) * 1.3 + Math.sin(g.t * 1.1 + bl.ph) * 0.9;
    live.push(bl);
  }
  const char = bl => burn > 0 ? Math.max(0, 1 - (bl.burn - burn) / 0.22) : 0;
  const ch = (col, bl) => char(bl) > 0 ? mix(col, '#48210f', char(bl)) : col;

  for (const bl of live) pcircle(c, bl.x + bl._ox, bl.y + 2, bl.r + 2, ch(shade(s.dark), bl));
  for (const bl of live) pcircle(c, bl.x + bl._ox, bl.y, bl.r, ch(tones[bl.tone], bl));
  for (const bl of live) pcircle(c, bl.x + bl._ox - 2, bl.y - 3, bl.r * 0.62, ch(tones[Math.min(4, bl.tone + 1)], bl));
  for (const bl of live) if (bl.y < 46) pcircle(c, bl.x + bl._ox - 3, bl.y - 5, bl.r * 0.3, ch(tones[4], bl));

  // leaf texture: little clusters of specks so it does not read as plastic
  const rnd = mulberry(77);
  for (let i = 0; i < 260; i++) {
    const bl = live[Math.floor(rnd() * live.length)];
    if (!bl) break;
    const a = rnd() * 6.28, d = Math.sqrt(rnd()) * bl.r;
    const x = bl.x + bl._ox + Math.cos(a) * d, y = bl.y + Math.sin(a) * d * 0.9;
    const up = rnd() > 0.42;
    px(c, x, y, 1, 1, ch(tones[Math.max(0, Math.min(4, bl.tone + (up ? 1 : -1)))], bl));
    if (rnd() > 0.9) px(c, x + 1, y, 1, 1, ch(tones[Math.min(4, bl.tone + 2)], bl));
  }
  // blossom / berry accents
  for (let i = 0; i < 16; i++) {
    const bl = live[Math.floor(rnd() * live.length)];
    if (!bl) break;
    dot(c, bl.x + bl._ox + (rnd() - 0.5) * bl.r, bl.y + (rnd() - 0.5) * bl.r, shade(s.accent));
  }
}

function drawWinterCrown(c, g, off, B) {
  const snow = '#f2f7fb', snowLo = '#cfdde8';
  for (const [x1, y1, x2, y2] of TWIGS) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) | 0;
    for (let i = 0; i <= steps; i++) {
      const p = i / Math.max(1, steps);
      const x = x1 + (x2 - x1) * p, y = y1 + (y2 - y1) * p;
      px(c, x + off(y), y, 2, 2, B.mid);
      px(c, x + off(y), y - 1, 2, 1, snow);
    }
  }
  for (const b of BRANCHES) {
    for (let i = 0; i < b.length - 1; i++) {
      const [x1, y1] = b[i], [x2, y2] = b[i + 1];
      if (Math.abs(y2 - y1) > Math.abs(x2 - x1)) continue;
      const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) | 0;
      for (let sI = 0; sI <= steps; sI++) {
        const p = sI / Math.max(1, steps);
        const x = x1 + (x2 - x1) * p, y = y1 + (y2 - y1) * p;
        px(c, x + off(y) - 2, y - 4, 5, 2, sI % 5 === 0 ? snowLo : snow);
      }
    }
  }
  const rnd = mulberry(404);
  for (let i = 0; i < 11; i++) {
    const t = TWIGS[Math.floor(rnd() * TWIGS.length)];
    const x = t[2] + Math.sin(g.t * 2 + i) * 1.2, y = t[3];
    drawLeafSprite(c, x + off(y) - 3, y, '#8a5a2a', '#5c3a18');
  }
  px(c, 112 + off(92), 90, 30, 3, snow);
}

/* -------------------------------------------------------------------------
   THE FACE
   Deep-set amber eyes, a heavy brow, a nose you could hang a coat on, and
   a mouth that can go from grandfatherly to far too wide.
   ------------------------------------------------------------------------- */
function drawFace(c, g, off, B, dk) {
  const cx = Math.round(CX + off(112)), cy = 112;
  const M = MOODS[g.mood] || MOODS.chill;
  const stare = g.stare || 0;
  const wide = 1 + stare * 0.18;

  let lid = M.lid * (1 - stare) + (-0.30) * stare;
  if (g.blink > 0 && !g.dead) lid = 1;
  if (g.asleep) lid = 1;
  const brow = M.brow - stare * 2;
  const glowAmt = Math.max(dk, Math.max(stare * 0.9, (g.burn || 0) * 0.85));
  const LIT = mix(B.hi, '#ffe0b0', 0.25);      // sun side
  const SH = B.lo, DEEP = B.deep;

  /* --- the face is carved a little proud of the trunk --- */
  c.globalAlpha = 0.4; pellipse(c, cx - 3, cy + 2, 24, 32, LIT); c.globalAlpha = 1;
  c.globalAlpha = 0.3; pellipse(c, cx + 9, cy + 4, 15, 28, SH); c.globalAlpha = 1;

  /* --- forehead --- */
  c.globalAlpha = 0.5; pellipse(c, cx - 2, cy - 28, 20, 8, LIT); c.globalAlpha = 1;
  wrinkle(c, cx - 16, cy - 34, 30, SH, 2);
  wrinkle(c, cx - 16, cy - 33, 30, LIT, 2);
  wrinkle(c, cx - 13, cy - 29, 25, SH, 1);
  wrinkle(c, cx - 10, cy - 25, 19, SH, 1);

  /* --- brow ridge: lit on top, deep shadow under, heavier at the inner end --- */
  for (const dir of [-1, 1]) {
    const tilt = M.tilt * dir;
    for (let i = 0; i < 19; i++) {
      const bx = cx + dir * (2 + i) - (dir < 0 ? 2 : 0);
      const arch = -Math.sin(Math.pow(i / 19, 0.8) * Math.PI) * 4;
      const by = Math.round(cy - 19 + brow + arch + (tilt * i) / 7);
      const th = 4 - Math.floor(i / 12);
      px(c, bx, by, 2, th, dir < 0 ? mix(LIT, B.mid, 0.35) : B.mid);
      px(c, bx, by - 1, 2, 1, LIT);
      px(c, bx, by + th, 2, 2, DEEP);
    }
  }
  px(c, cx - 2, cy - 22 + brow, 2, 7, SH);       // frown furrow
  px(c, cx + 1, cy - 21 + brow, 1, 5, SH);
  px(c, cx - 4, cy - 22 + brow, 1, 5, SH);

  /* --- eyes --- */
  const ey = cy - 8;
  for (const dir of [-1, 1]) {
    const ex = cx + dir * 13;
    pellipse(c, ex, ey + 1, 11, 8, DEEP);                     // socket
    pellipse(c, ex - dir, ey + 1, 10, 6.5, mix(DEEP, SH, 0.55));
    if (g.dead) {
      for (let i = -5; i <= 5; i++) { dot(c, ex + i, ey + i, '#171717'); dot(c, ex + i, ey - i, '#171717'); }
      continue;
    }
    const rx = 8 * wide, ry = 5.4 * wide;
    pellipse(c, ex, ey, rx, ry, '#d9c39a');
    pellipse(c, ex, ey - 0.5, rx - 0.5, ry - 0.8, '#f2e6cc');
    pellipse(c, ex - 2, ey - 1, rx - 3, ry - 2, '#fbf3e2');

    const lx = Math.max(-2.6, Math.min(2.6, g.look.x * 2.6));
    const ly = Math.max(-1.8, Math.min(1.8, g.look.y * 1.8));
    const ix = ex + lx, iy = ey + ly;
    if (glowAmt > 0.2) glow(c, ix, iy, 8, '#ffb03a', 0.6 * glowAmt);
    pcircle(c, ix, iy, 4.2, '#6b3a0c');
    pcircle(c, ix, iy, 3.5, '#b8791f');
    pcircle(c, ix - 0.5, iy - 0.5, 2.8, '#e0a63c');
    pcircle(c, ix, iy + 1, 2.0, '#f3c661');
    pcircle(c, ix, iy, 1.9 * M.pupil, '#180d03');
    dot(c, ix - 2, iy - 2, '#ffffff'); dot(c, ix - 1, iy - 2, '#fff6de'); dot(c, ix - 2, iy - 1, '#fff6de');
    dot(c, ix + 2, iy + 2, '#c98c2a');
    if (glowAmt > 0.45) dot(c, ix, iy, mix('#180d03', '#ff9b2a', (glowAmt - 0.45) * 1.5));

    // heavy upper lid
    if (lid > 0) {
      const h = Math.round(lid * (ry * 2 + 3));
      px(c, ex - rx - 1, ey - ry - 3, rx * 2 + 2, h + 1, B.mid);
      px(c, ex - rx - 1, ey - ry - 3, 4, h + 1, LIT);
      wrinkle(c, ex - rx - 1, ey - ry - 2 + h, rx * 2 + 2, DEEP, 1);   // lash line
      wrinkle(c, ex - rx - 1, ey - ry - 4 + h, rx * 2 + 2, SH, 1);     // lid crease
    } else {
      px(c, ex - rx + 1, ey - ry - 1, rx * 2 - 2, 1, '#fbf3e2');   // wide-eyed
    }
    // eye bags
    wrinkle(c, ex - rx, ey + ry, rx * 2, DEEP, 1);
    wrinkle(c, ex - rx + 1, ey + ry + 2, rx * 2 - 2, mix(LIT, B.mid, 0.4), 1);
    wrinkle(c, ex - rx + 2, ey + ry + 4, rx * 2 - 4, SH, 1);
    if (M.squint > 0) {
      const sh = Math.round(M.squint * 4);
      px(c, ex - rx, ey + ry - sh, rx * 2, sh, B.mid);
      px(c, ex - rx, ey + ry - sh, rx * 2, 1, LIT);
    }
    // crow's feet
    for (let i = 0; i < 4; i++) {
      const fx = ex + dir * (rx + 2);
      px(c, fx + dir * i, ey - 5 + i * 3, dir > 0 ? 4 : -4, 1, SH);
    }
  }

  /* --- nose: a real one, lit on the left, shadowed on the right --- */
  const ny = cy + 2;
  px(c, cx - 5, ny - 10, 4, 16, mix(LIT, B.mid, 0.3));    // bridge, lit side
  px(c, cx - 1, ny - 10, 4, 16, B.mid);
  px(c, cx + 3, ny - 8, 3, 14, SH);                       // shadow side
  px(c, cx + 6, ny - 4, 2, 10, DEEP);
  pellipse(c, cx - 1, ny + 8, 8, 5, B.mid);               // bulb
  pellipse(c, cx - 3, ny + 7, 5, 3, LIT);
  pellipse(c, cx + 4, ny + 9, 4, 3, SH);
  pellipse(c, cx - 8, ny + 8, 3, 3, B.mid);               // wings
  pellipse(c, cx + 7, ny + 8, 3, 3, SH);
  px(c, cx - 6, ny + 10, 2, 2, DEEP); px(c, cx + 5, ny + 10, 2, 2, DEEP);
  wrinkle(c, cx - 11, ny + 12, 22, DEEP, 1);

  /* --- cheeks --- */
  for (const dir of [-1, 1]) {
    const chx = cx + dir * 19;
    c.globalAlpha = 0.55;
    pellipse(c, chx, cy + 12, 9, 9, dir < 0 ? LIT : mix(B.mid, SH, 0.4));
    c.globalAlpha = 1;
    wrinkle(c, chx - 5, cy + 18, 11, SH, 1);
    wrinkle(c, chx - 4, cy + 22, 9, SH, 1);
  }
  // laugh lines
  for (const dir of [-1, 1]) for (let i = 0; i < 9; i++) {
    px(c, cx + dir * (9 + i * 0.65), ny + 10 + i, 1, 1, SH);
    px(c, cx + dir * (9 + i * 0.65) - dir, ny + 10 + i, 1, 1, mix(LIT, B.mid, 0.5));
  }

  drawMouth(c, g, cx, cy + 26, M, B, stare);

  /* --- chin and the moss he cannot shave --- */
  pellipse(c, cx - 2, cy + 34, 11, 5, LIT);
  wrinkle(c, cx - 8, cy + 37, 16, SH, 1);
  c.globalAlpha = 0.85;
  const rnd = mulberry(19);
  const moss = mix('#4a7a32', '#0a1226', dk * 0.7);
  for (let i = 0; i < 34; i++) {
    const a = rnd() * Math.PI, d = rnd();
    px(c, cx + Math.cos(a) * 24 * d - 1, cy + 36 + Math.sin(a) * 10 * d, 2, 1,
       rnd() > 0.5 ? moss : mix(moss, '#8fbf5a', 0.5));
  }
  c.globalAlpha = 1;
}

function drawMouth(c, g, cx, my, M, B, stare) {
  const dark = '#2a1508', gum = '#7d3838', teeth = '#e6d9bb', teethLo = '#c4b48f';
  const LIT = mix(B.hi, '#ffe0b0', 0.25);
  let shape = M.mouth;
  if (g.talking && !g.dead) shape = 'open';
  if (g.dead) shape = 'flat';

  /* a curved slit with lips, and optionally a row of joined teeth */
  const slit = (w, depth, thick, withTeeth) => {
    const yAt = i => my + Math.round(Math.cos((i / w) * Math.PI / 2) * depth) - depth;
    for (let i = -w; i <= w; i++) {
      px(c, cx + i, yAt(i) - 3, 1, 2, LIT);                 // upper lip catches light
      px(c, cx + i, yAt(i) - 1, 1, 1, mix(B.mid, B.lo, 0.4));
      px(c, cx + i, yAt(i), 1, thick, dark);                 // the cavity
      px(c, cx + i, yAt(i) + thick, 1, 2, B.lo);             // lower lip
      px(c, cx + i, yAt(i) + thick + 2, 1, 1, B.deep);
    }
    if (withTeeth) {
      for (let i = -w + 2; i <= w - 2; i++) {
        px(c, cx + i, yAt(i), 1, 2, teeth);
        if (((i + w) % 4) === 0) px(c, cx + i, yAt(i), 1, 2, teethLo);
      }
      for (let i = -w + 2; i <= w - 2; i++) px(c, cx + i, yAt(i) + 2, 1, 1, gum);
    }
    // corner creases
    px(c, cx - w - 2, my - depth - 2, 2, 5, B.lo);
    px(c, cx + w + 1, my - depth - 2, 2, 5, B.lo);
    px(c, cx - w - 3, my - depth - 1, 1, 4, B.deep);
    px(c, cx + w + 3, my - depth - 1, 1, 4, B.deep);
  };

  if (shape === 'smile')      slit(14, 4, 3, false);
  else if (shape === 'grin')  slit(17, 6, 4, true);
  else if (shape === 'wide')  slit(23, 9, 4 + Math.round(stare * 2), true);
  else if (shape === 'flat')  slit(12, 0, 3, false);
  else if (shape === 'frown') {
    const w = 13;
    const yAt = i => my - Math.round(Math.cos((i / w) * Math.PI / 2) * 4) + 4;
    for (let i = -w; i <= w; i++) {
      px(c, cx + i, yAt(i) - 3, 1, 2, LIT);
      px(c, cx + i, yAt(i), 1, 3, dark);
      px(c, cx + i, yAt(i) + 3, 1, 2, B.lo);
    }
    px(c, cx - w - 2, my + 2, 2, 5, B.lo); px(c, cx + w + 1, my + 2, 2, 5, B.lo);
  } else if (shape === 'smirk') {
    const w = 14;
    const yAt = i => my + Math.round((i / w) * -4);
    for (let i = -w; i <= w; i++) {
      px(c, cx + i, yAt(i) - 3, 1, 2, LIT);
      px(c, cx + i, yAt(i), 1, 3, dark);
      px(c, cx + i, yAt(i) + 3, 1, 2, B.lo);
    }
    px(c, cx + w, my - 8, 3, 6, B.lo); px(c, cx + w + 2, my - 8, 1, 6, B.deep);
    px(c, cx - w - 2, my + 3, 2, 3, B.lo);
  } else if (shape === 'ohh') {
    pellipse(c, cx, my, 8, 9, B.deep);
    pellipse(c, cx, my, 6.5, 7.5, dark);
    pellipse(c, cx, my + 4, 3.5, 2.5, gum);
    pellipse(c, cx, my - 10, 9, 2, LIT);
    pellipse(c, cx, my + 10, 8, 2, B.lo);
  } else if (shape === 'open') {
    const o = 3 + Math.abs(Math.sin(g.t * 13)) * 4.5;
    pellipse(c, cx, my, 10, o + 1.5, B.deep);
    pellipse(c, cx, my, 8.5, o, dark);
    for (let i = -7; i <= 7; i++) px(c, cx + i, my - o + 1, 1, 2, ((i + 7) % 4) === 0 ? teethLo : teeth);
    pellipse(c, cx, my + o * 0.45, 4.5, Math.max(1, o * 0.4), gum);
    pellipse(c, cx, my - o - 2, 10, 2, LIT);
    pellipse(c, cx, my + o + 2, 9, 2, B.lo);
  }
}

/* something else is awake in the branches */
function drawWatchers(c, g) {
  if (!g.watchers || g.watchers <= 0) return;
  const rnd = mulberry(g.watcherSeed || 3);
  const a = Math.min(1, g.watchers);
  for (let i = 0; i < 3; i++) {
    const bl = CANOPY[Math.floor(rnd() * CANOPY.length)];
    if (!bl || bl.tone > 1) continue;
    const x = bl.x + (rnd() - 0.5) * bl.r, y = bl.y + (rnd() - 0.5) * bl.r * 0.6;
    c.globalAlpha = a;
    glow(c, x, y, 4, '#ff9b2a', 0.5);
    px(c, x - 3, y, 2, 2, '#ffcf6a'); px(c, x + 2, y, 2, 2, '#ffcf6a');
    dot(c, x - 2, y, '#2a1000'); dot(c, x + 3, y, '#2a1000');
    c.globalAlpha = 1;
  }
}

/* what is left standing once the trunk goes over */
function drawStump(c, g) {
  const B = barkTones(g);
  const rnd = mulberry(31);
  for (let y = GROUND_Y + 6; y > GROUND_Y - 18; y--) {
    const hw = trunkHalfWidth(y);
    px(c, CX - hw, y, hw * 2, 1, B.mid);
    px(c, CX - hw, y, 4, 1, B.hi);
    px(c, CX + hw - 4, y, 4, 1, B.deep);
  }
  for (let i = 0; i < 24; i++) {
    const x = CX - 26 + i * 2.2;
    px(c, x, GROUND_Y - 18 - Math.floor(rnd() * 9), 3, 12, B.lo);
  }
  for (const dir of [-1, 1]) for (let i = 0; i < 26; i++) {
    const h = Math.max(1, 12 - i * 0.44);
    px(c, CX + dir * (26 + i) - (dir < 0 ? 2 : 0), GROUND_Y + 6 - h, 2, h, B.lo);
  }
  for (let i = 0; i < 18; i++) dot(c, 110 + rnd() * 36, GROUND_Y - 16 + rnd() * 6, rnd() > 0.5 ? '#ff8a3a' : '#d94a22');
}

/* -------------------------------------------------------------------------
   CRITTERS — the other residents
   ------------------------------------------------------------------------- */
/* Every bird in the park is the same drawing with a different set of colours,
   a crest or not, a size, and a beak. Twelve species read as twelve birds. */
function drawBird(c, g, k, shade) {
  const sp = k.sp || {};
  const s = sp.big ? 1.5 : 1;
  const hop = Math.sin(g.t * 3 + k.ph) * 0.8;
  const bx = k.x, by = k.y + hop;
  const body = shade(sp.body || k.col || '#8a7250');
  const wing = shade(sp.wing || mix(sp.body || '#8a7250', '#000000', 0.3));
  const head = shade(sp.head || sp.body || '#8a7250');
  const beak = shade(sp.beak || '#e8a33a');

  if (k.flying) {
    const flap = Math.sin(g.t * 18) * 4 * s;
    pellipse(c, bx, by, 3.4 * s, 2.6 * s, body);
    px(c, bx - 5 * s, by - 1 + flap, 5 * s, 2 * s, wing);
    px(c, bx + 2 * s, by - 1 - flap, 5 * s, 2 * s, wing);
    px(c, bx + 3 * s, by - 1, 2 * s, 1 * s, beak);
    if (sp.big) { px(c, bx - 8 * s, by, 4 * s, 2, wing); }
    return;
  }
  // tail, body, wing, head, beak, eye, legs
  px(c, bx - 6 * s, by, 4 * s, 2 * s, wing);
  pellipse(c, bx, by, 4 * s, 3 * s, body);
  if (sp.belly) pellipse(c, bx - 1, by + 1, 3 * s, 1.6 * s, shade(sp.belly));
  pellipse(c, bx - 1, by - 1, 3 * s, 2 * s, wing);
  if (sp.speck) for (let i = 0; i < 5; i++) dot(c, bx - 3 + i * 1.6, by - 1 + (i % 2), shade('#c9c2a8'));
  pcircle(c, bx + 3 * s, by - 3 * s, 2.5 * s, head);
  if (sp.crest) {
    px(c, bx + 2 * s, by - 6 * s, 2, 2 * s, head);
    px(c, bx + 3 * s, by - 7 * s, 2, 2 * s, head);
  }
  px(c, bx + 5 * s, by - 3 * s, 2 * s, 1 * s, beak);
  dot(c, bx + 4 * s, by - 4 * s, '#120a04');
  if (sp.night) { dot(c, bx + 4 * s, by - 4 * s, '#ffd24a'); dot(c, bx + 2 * s, by - 4 * s, '#ffd24a'); }
  px(c, bx - 1, by + 3 * s, 1, 2 * s, shade('#c8892a'));
  px(c, bx + 1, by + 3 * s, 1, 2 * s, shade('#c8892a'));
}

/* a bird portrait, for the diary */
function drawBirdPortrait(c, g, sp, x, y, scale) {
  const k = { x, y, ph: 0, flying: false, sp, col: sp.body };
  c.save();
  c.translate(x, y);
  c.scale(scale || 1, scale || 1);
  c.translate(-x, -y);
  drawBird(c, g, k, col => col);
  c.restore();
}

function drawCritters(c, g) {
  const dk = darkness(g.timeOfDay);
  const shade = col => mix(col, '#0a1226', dk * 0.7);
  for (const k of g.critters) {
    if (k.kind === 'bird') {
      drawBird(c, g, k, shade);
    } else if (k.kind === 'butterfly') {
      const w = (1 + Math.abs(Math.sin(g.t * 10 + k.ph)) * 2.4) * (k.credit ? 1.25 : 1);
      // the bright one carries its own light, so it can be found at night
      if (k.credit) {
        glow(c, k.x, k.y - 1, 8 + Math.sin(g.t * 3) * 2, '#ffe9a0', 0.45);
        const tw = (g.t * 1.6 + k.ph) % 2.4;
        if (tw < 0.5) {
          c.globalAlpha = 1 - tw / 0.5;
          star(c, k.x + 5, k.y - 6, 3, '#fff6d8', '#ffffff');
          c.globalAlpha = 1;
        }
      }
      const wing = k.credit ? k.col : shade(k.col);
      px(c, k.x, k.y - 1, 1, 3, shade('#3a2a1a'));
      dot(c, k.x, k.y - 2, shade('#3a2a1a'));
      for (const d of [-1, 1]) {
        px(c, k.x + d * 1, k.y - 2, d * w, 2, wing);                          // upper wing
        px(c, k.x + d * 1, k.y, d * Math.max(1, w - 1), 2, k.credit ? '#ff9a3a' : shade(mix(k.col, '#000000', 0.25)));
        dot(c, k.x + d * (w - 0.5), k.y - 2, k.credit ? '#ffffff' : shade('#ffffff'));
        if (k.credit) dot(c, k.x + d * (w - 1.5), k.y, '#fff6d8');
      }
    } else if (k.kind === 'dragonfly') {
      // long thin body, four narrow wings held out sideways, one bright eye
      const beat = Math.abs(Math.sin(g.t * 26 + k.ph));
      const wy = k.y - Math.round(beat);
      const body = shade(k.col);
      px(c, k.x - 5, k.y, 8, 1, body);
      px(c, k.x - 5, k.y, 3, 1, shade(mix(k.col, '#ffffff', 0.35)));
      pcircle(c, k.x + 4, k.y, 1.4, shade(mix(k.col, '#ffffff', 0.5)));
      dot(c, k.x + 5, k.y - 1, '#120a04');
      c.globalAlpha = 0.5;
      for (const d of [-1, 1]) {
        px(c, k.x + d, wy - 1, d * 5, 1, shade('#dff0ff'));
        px(c, k.x - 1 + (d < 0 ? d : 0), wy + 1, d * 4, 1, shade('#cfe8f8'));
      }
      c.globalAlpha = 1;
    } else if (k.kind === 'beetle') {
      pellipse(c, k.x, k.y, 3, 2, shade('#2a2a3a'));
      pellipse(c, k.x - 1, k.y - 1, 2, 1, shade('#5a5a7a'));
      px(c, k.x + 2, k.y - 1, 2, 1, shade('#1a1a24'));
      for (let i = -1; i <= 1; i++) { dot(c, k.x + i, k.y - 2, shade('#1a1a24')); dot(c, k.x + i, k.y + 2, shade('#1a1a24')); }
    } else if (k.kind === 'rabbit') {
      const hop = k.moving ? Math.abs(Math.sin(g.t * 9)) * 3 : 0;
      const y = k.y - hop;
      pellipse(c, k.x, y, 6, 4, shade('#b8a48a'));
      pcircle(c, k.x + 5 * k.dir, y - 3, 3, shade('#b8a48a'));
      px(c, k.x + 4 * k.dir, y - 9, 2, 6, shade('#b8a48a'));
      px(c, k.x + 7 * k.dir, y - 8, 2, 5, shade('#b8a48a'));
      dot(c, k.x + 6 * k.dir, y - 3, '#120a04');
      pcircle(c, k.x - 6 * k.dir, y, 2.5, shade('#f2ece0'));
      px(c, k.x - 2, y + 3, 2, 2, shade('#8a7a62'));
    }
  }
}

/* flowers, ferns and long grass along the bottom of the world */
function drawUndergrowth(c, g) {
  const dk = darkness(g.timeOfDay);
  const s = SEASON[g.season];
  const shade = col => mix(col, '#050c18', dk * 0.82);
  const rnd = mulberry(1234);
  const n = Math.round(46 * W / 256);
  for (let i = 0; i < n; i++) {
    const x = rnd() * W;
    const y = GROUND_Y + 6 + rnd() * (H - GROUND_Y - 8);
    const near = (y - GROUND_Y) / (H - GROUND_Y);
    const h = 4 + near * 9;
    const sw = Math.sin(g.t * 1.2 + i) * (0.6 + near);
    // a fern frond
    for (let b = 0; b < h; b++) {
      const bx = x + sw * (b / h);
      px(c, bx, y - b, 1, 1, shade(s.t1));
      if (b % 2 === 0 && b > 1) {
        const l = Math.max(1, (h - b) * 0.5);
        px(c, bx - l, y - b, l, 1, shade(s.t2));
        px(c, bx + 1, y - b, l, 1, shade(s.t2));
      }
    }
    if (rnd() > 0.72 && g.season !== 'winter') {
      const fc = ['#ffffff', '#ffd9ea', '#ffe066', '#d8b0ff'][Math.floor(rnd() * 4)];
      pcircle(c, x + sw, y - h - 1, 1.6, shade(fc));
      dot(c, x + sw, y - h - 1, shade('#ffd24a'));
    }
  }
}

/* =========================================================================
   THE PARK — everything you can build in it
   ========================================================================= */
function shade(col, dk) { return mix(col, '#0a1226', dk * 0.75); }

function drawCottage(c, g, x, y) {
  const dk = darkness(g.timeOfDay);
  const sh = col => shade(col, dk);
  const lit = dk > 0.45;
  // walls
  px(c, x - 20, y - 22, 40, 22, sh('#e0d2b8'));
  px(c, x - 20, y - 22, 40, 2, sh('#c9b89a'));
  for (let i = 0; i < 5; i++) px(c, x - 18 + i * 9, y - 20, 1, 20, sh('#6b4a30'));
  px(c, x - 20, y - 3, 40, 3, sh('#8a6a4a'));
  // roof
  for (let i = 0; i <= 15; i++) {
    const w = 46 - i * 3;
    px(c, x - w / 2, y - 22 - i, w, 1, sh(i % 3 === 0 ? '#8a3f2e' : '#a8503a'));
  }
  px(c, x - 24, y - 23, 48, 2, sh('#6b2f22'));
  // chimney with smoke
  px(c, x + 10, y - 40, 6, 10, sh('#8a6a5a'));
  px(c, x + 9, y - 41, 8, 2, sh('#6b4a3a'));
  for (let i = 0; i < 5; i++) {
    c.globalAlpha = 0.4 * (1 - i / 5);
    pcircle(c, x + 13 + Math.sin(g.t * 0.9 + i) * (2 + i), y - 44 - i * 5, 2 + i * 0.8, '#cfd6da');
    c.globalAlpha = 1;
  }
  // door
  px(c, x - 5, y - 14, 10, 14, sh('#7a4a28'));
  px(c, x - 4, y - 13, 8, 13, sh('#9a6338'));
  pcircle(c, x + 2, y - 7, 1, sh('#ffd24a'));
  // windows
  for (const wx of [-14, 12]) {
    px(c, x + wx - 3, y - 18, 8, 8, sh('#5a4a3a'));
    px(c, x + wx - 2, y - 17, 6, 6, lit ? '#ffd98a' : sh('#9fd0e8'));
    px(c, x + wx, y - 17, 1, 6, sh('#5a4a3a'));
    px(c, x + wx - 2, y - 14, 6, 1, sh('#5a4a3a'));
    if (lit) glow(c, x + wx + 1, y - 14, 9, '#ffcf6a', 0.5);
  }
  // window boxes
  for (const wx of [-14, 12]) {
    px(c, x + wx - 4, y - 10, 10, 3, sh('#7a4a28'));
    for (let i = 0; i < 4; i++) dot(c, x + wx - 3 + i * 2, y - 11, sh(['#ef5330', '#ffd24a', '#e88ac0'][i % 3]));
  }
}

function drawNoticeBoard(c, g, x, y) {
  const dk = darkness(g.timeOfDay);
  const sh = col => shade(col, dk);
  px(c, x - 2, y - 14, 3, 14, sh('#6b4a2a'));
  px(c, x + 6, y - 14, 3, 14, sh('#6b4a2a'));
  px(c, x - 9, y - 30, 22, 17, sh('#5a3a1e'));
  px(c, x - 7, y - 28, 18, 13, sh('#c9a86a'));
  for (let i = 0; i < 6; i++) {
    const px_ = x - 6 + (i % 3) * 6, py = y - 27 + Math.floor(i / 3) * 6;
    px(c, px_, py, 5, 5, sh(['#f6ecd6', '#e8dcc0', '#f2e2b8'][i % 3]));
    px(c, px_ + 1, py + 1, 3, 1, sh('#8a7a5a'));
  }
  for (let i = 0; i <= 12; i++) px(c, x - 10 + i * 2, y - 33 + Math.abs(i - 6) * 0.5, 2, 3, sh('#7a4a28'));
}

function drawBench(c, g, x, y) {
  const dk = darkness(g.timeOfDay);
  const sh = col => shade(col, dk);
  px(c, x - 11, y - 5, 22, 3, sh('#a0703c'));
  px(c, x - 11, y - 5, 22, 1, sh('#c08c50'));
  px(c, x - 11, y - 12, 22, 2, sh('#a0703c'));
  px(c, x - 11, y - 9, 22, 2, sh('#8a5f30'));
  px(c, x - 10, y - 2, 2, 5, sh('#5a4028'));
  px(c, x + 8, y - 2, 2, 5, sh('#5a4028'));
  px(c, x - 11, y - 13, 2, 9, sh('#5a4028'));
  px(c, x + 9, y - 13, 2, 9, sh('#5a4028'));
}

function drawFlowerbed(c, g, x, y) {
  const dk = darkness(g.timeOfDay);
  const sh = col => shade(col, dk);
  const rnd = mulberry(Math.round(x));
  pellipse(c, x, y - 1, 12, 4, sh('#6b4a2a'));
  pellipse(c, x, y - 2, 11, 3, sh('#8a6038'));
  for (let i = 0; i < 12; i++) {
    const fx = x - 10 + rnd() * 20, fh = 3 + rnd() * 4;
    px(c, fx, y - 3 - fh, 1, fh, sh('#4a8a30'));
    const col = ['#ef5330', '#ffd24a', '#e88ac0', '#ffffff', '#b183e8'][Math.floor(rnd() * 5)];
    pcircle(c, fx + Math.sin(g.t * 1.5 + i) * 0.6, y - 4 - fh, 1.6, sh(col));
    dot(c, fx, y - 4 - fh, sh('#ffe066'));
  }
}

function drawBirdbath(c, g, x, y) {
  const dk = darkness(g.timeOfDay);
  const sh = col => shade(col, dk);
  px(c, x - 5, y - 2, 11, 2, sh('#b6b6b6'));
  px(c, x - 2, y - 12, 5, 10, sh('#c6c6c6'));
  px(c, x - 2, y - 12, 2, 10, sh('#e0e0e0'));
  pellipse(c, x, y - 14, 9, 3, sh('#c6c6c6'));
  pellipse(c, x, y - 15, 8, 2, sh('#7ec8f2'));
  px(c, x - 4 + ((g.t * 6) % 8), y - 15, 2, 1, sh('#ffffff'));
}

function drawHive(c, g, x, y) {
  const dk = darkness(g.timeOfDay);
  const sh = col => shade(col, dk);
  for (let i = 0; i < 5; i++) {
    const w = 13 - Math.abs(i - 2) * 2;
    px(c, x - w / 2, y - 4 - i * 3, w, 3, sh(i % 2 ? '#e8b23a' : '#d19a28'));
    px(c, x - w / 2, y - 4 - i * 3, w, 1, sh('#f4cf6a'));
  }
  px(c, x - 2, y - 6, 4, 3, sh('#5a3f10'));
  for (let i = 0; i < 3; i++) {
    const a = g.t * 3 + i * 2.1;
    const bx = x + Math.cos(a) * 11, by = y - 12 + Math.sin(a * 1.3) * 7;
    px(c, bx, by, 2, 2, sh('#ffd24a'));
    dot(c, bx, by, sh('#3a2a08'));
  }
}

function drawLamp(c, g, x, y) {
  const dk = darkness(g.timeOfDay);
  const sh = col => shade(col, dk);
  px(c, x - 3, y - 2, 7, 2, sh('#3a3a44'));
  px(c, x - 1, y - 30, 3, 28, sh('#4a4a56'));
  px(c, x - 1, y - 30, 1, 28, sh('#6a6a78'));
  px(c, x - 4, y - 36, 9, 6, sh('#3a3a44'));
  px(c, x - 3, y - 35, 7, 4, dk > 0.4 ? '#ffe9a0' : sh('#9fb0c0'));
  px(c, x - 5, y - 38, 11, 2, sh('#2a2a34'));
  if (dk > 0.4) glow(c, x, y - 33, 26, '#ffcf6a', 0.55 * dk);
}

/* a visitor: comes in, sits a while, leaves a tip */
function drawVisitor(c, g, v) {
  const dk = darkness(g.timeOfDay);
  const sh = col => shade(col, dk);
  const x = Math.round(v.x), y = Math.round(v.y);
  const step = v.state === 'walk' ? Math.abs(Math.sin(g.t * 7 + v.ph)) * 2 : 0;
  const sit = v.state === 'sit' ? 4 : 0;
  px(c, x - 3, y - 11 + sit, 6, 8, sh(v.col));            // body
  px(c, x - 3, y - 11 + sit, 2, 8, sh(mix(v.col, '#ffffff', 0.25)));
  pcircle(c, x, y - 14 + sit, 3, sh('#e8b98a'));           // head
  px(c, x - 3, y - 17 + sit, 7, 3, sh(v.hair));            // hair
  dot(c, x - 1, y - 14 + sit, '#2a1a10'); dot(c, x + 1, y - 14 + sit, '#2a1a10');
  if (v.state === 'sit') {
    px(c, x - 1, y - 3, 5, 2, sh('#3a3a4a'));
  } else {
    px(c, x - 3, y - 3 - step, 2, 3, sh('#3a3a4a'));
    px(c, x + 1, y - 3 - (2 - step), 2, 3, sh('#3a3a4a'));
  }
  if (v.happy > 0) {
    c.globalAlpha = Math.min(1, v.happy);
    px(c, x - 1, y - 22 + sit, 4, 3, '#ff6b8a'); px(c, x, y - 23 + sit, 1, 1, '#ff6b8a');
    px(c, x + 2, y - 23 + sit, 1, 1, '#ff6b8a'); px(c, x + 1, y - 19 + sit, 1, 1, '#ff6b8a');
    c.globalAlpha = 1;
  }
}

/* the boundary of the park, pushed outward every time you expand */
function drawBoundary(c, g, margin) {
  const dk = darkness(g.timeOfDay);
  const s = SEASON[g.season];
  const sh = col => shade(col, dk);
  for (const side of [-1, 1]) {
    const bx = side < 0 ? margin : W - margin;
    for (let i = 0; i < 16; i++) {
      const y = GROUND_Y - 4 + i * 3;
      const near = i / 16;
      const r = 6 + near * 7;
      pcircle(c, bx + side * (i % 2) * 2, y, r + 1, sh(s.dark));
      pcircle(c, bx + side * (i % 2) * 2, y - 1, r, sh(s.t1));
      pcircle(c, bx + side * (i % 2) * 2 - 2, y - 3, r * 0.55, sh(s.t2));
    }
    // a little gate post
    px(c, bx - side * 3, GROUND_Y - 16, 4, 18, sh('#7a5230'));
    px(c, bx - side * 4, GROUND_Y - 19, 6, 3, sh('#5a3a1e'));
  }
}

/* =========================================================================
   CARTOON UI — balloons, panels and the postal snail, all in pixels
   ========================================================================= */
const F = window.FONT_API;

function roundRect(c, x, y, w, h, r, col) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  px(c, x + r, y, w - r * 2, h, col);
  px(c, x, y + r, w, h - r * 2, col);
  pcircle(c, x + r, y + r, r, col);
  pcircle(c, x + w - r - 1, y + r, r, col);
  pcircle(c, x + r, y + h - r - 1, r, col);
  pcircle(c, x + w - r - 1, y + h - r - 1, r, col);
}

const INK = '#1a1008';

/* A proper cartoon speech balloon: fat black outline, white belly, a tail of
   shrinking bubbles pointing at whoever is talking. */
function drawBalloon(c, x, y, w, h, tail, opts) {
  const o = opts || {};
  const fill = o.fill || '#fdf6e3';
  const r = o.radius === undefined ? 6 : o.radius;
  // outline
  roundRect(c, x - 2, y - 2, w + 4, h + 4, r + 2, INK);
  if (tail) {
    const pts = [[0.30, 5.5], [0.62, 3.8], [0.92, 2.2]];
    for (const [t, rr] of pts) {
      pcircle(c, x + w / 2 + (tail.x - (x + w / 2)) * t, y + h + (tail.y - (y + h)) * t, rr + 2, INK);
    }
  }
  roundRect(c, x, y, w, h, r, fill);
  if (tail) {
    const pts = [[0.30, 5.5], [0.62, 3.8], [0.92, 2.2]];
    for (const [t, rr] of pts) {
      pcircle(c, x + w / 2 + (tail.x - (x + w / 2)) * t, y + h + (tail.y - (y + h)) * t, rr, fill);
    }
  }
  // a highlight along the top, the way a cartoon balloon catches the light
  px(c, x + r, y + 1, w - r * 2, 1, o.hi || '#ffffff');
  px(c, x + 1, y + r, 1, h - r * 2, o.hi || '#ffffff');
}

/* the little chevron that says "there is more" */
function drawMoreArrow(c, x, y, t) {
  const b = Math.round(Math.sin(t * 6) * 1);
  for (let i = 0; i < 4; i++) px(c, x - 3 + i, y + b + i, 1, 1, INK);
  for (let i = 0; i < 4; i++) px(c, x + 3 - i, y + b + i, 1, 1, INK);
}

/* a wooden panel, for menus that live in the park */
function drawPanel(c, x, y, w, h, title) {
  roundRect(c, x - 3, y - 3, w + 6, h + 6, 4, INK);
  roundRect(c, x, y, w, h, 3, '#8a5f38');
  roundRect(c, x + 2, y + 2, w - 4, h - 4, 2, '#c39a63');
  for (let i = 0; i < h - 6; i += 7) px(c, x + 3, y + 4 + i, w - 6, 1, '#b58c56');
  px(c, x, y, w, 11, '#6b4a2a');
  px(c, x, y + 11, w, 1, INK);
  if (title) F.drawTextCentered(c, x + w / 2, y + 3, title, '#ffe9b0', 1, INK);
  // corner nails
  for (const [dx, dy] of [[3, 3], [w - 5, 3], [3, h - 5], [w - 5, h - 5]]) {
    px(c, x + dx, y + dy, 2, 2, '#5a4028');
  }
}

/* =========================================================================
   THE POSTAL SNAIL
   Achievements are not notifications. They are delivered.
   ========================================================================= */
/* =========================================================================
   THE POSTAL SNAILS
   Every achievement has its own snail, and it is always the same snail: the
   shell palette, the pattern on it, the body colour, the length of its eye
   stalks and its name are all derived from the achievement's id, so the one
   that brings you a trophy is the one that will be in your garden forever.
   Size comes from the tier — a plain task sends a small snail, an ending
   sends something the size of a dinner plate wearing a crown.
   ========================================================================= */
const SNAIL_SHELLS = [
  { name: 'amber',    deep: '#8a4a18', mid: '#c9762e', lit: '#e8a04a', rim: '#ffd89a' },
  { name: 'jade',     deep: '#12463a', mid: '#1d6b52', lit: '#2f9670', rim: '#a8ecd0' },
  { name: 'plum',     deep: '#3a1a4a', mid: '#6b3a8a', lit: '#a06ac0', rim: '#e8c0ff' },
  { name: 'slate',    deep: '#2a2f3a', mid: '#4a5262', lit: '#7a8496', rim: '#cdd8e8' },
  { name: 'rose',     deep: '#6b1a2a', mid: '#a83a4a', lit: '#d9707c', rim: '#ffc9d0' },
  { name: 'brass',    deep: '#5a4210', mid: '#9a7a20', lit: '#d9b23a', rim: '#fff0b0' },
  { name: 'ink',      deep: '#14161c', mid: '#2a2e38', lit: '#4a5060', rim: '#98a2b8' },
  { name: 'moss',     deep: '#2a3a12', mid: '#4a6b20', lit: '#7a9a3a', rim: '#d0e8a0' },
  { name: 'copper',   deep: '#5a2a12', mid: '#96502a', lit: '#c97a4a', rim: '#f0c9a0' },
  { name: 'tide',     deep: '#123a5a', mid: '#1d5f8a', lit: '#3a90c0', rim: '#b0e0ff' },
  { name: 'bone',     deep: '#6b6250', mid: '#9a9280', lit: '#c9c2b0', rim: '#f6f0e0' },
  { name: 'wine',     deep: '#3a0e1a', mid: '#6b1a2e', lit: '#9a3a4a', rim: '#e0a0b0' }
];
const SNAIL_BODIES = [
  { skin: '#e8c9a8', lit: '#f6e2c8', dark: '#c9a684' },
  { skin: '#d8b8d0', lit: '#efdcea', dark: '#b494ac' },
  { skin: '#c8d8c0', lit: '#e4efdc', dark: '#a4b89c' },
  { skin: '#e0cfa8', lit: '#f2e8c8', dark: '#bfae86' },
  { skin: '#c8c4d8', lit: '#e4e0ef', dark: '#a4a0b8' },
  { skin: '#e8b8a0', lit: '#f6d6c4', dark: '#c99480' }
];
const SNAIL_PATTERNS = ['bands', 'spots', 'spiral', 'chevron', 'marbled', 'pearl'];
const SNAIL_TIER_SCALE = { task: 0.8, goal: 1.05, chal: 1.3, ending: 1.7 };

/* a stable 32-bit hash, so an id always makes the same snail */
function snailHash(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

const _skinCache = new Map();
function snailSkin(id, tier) {
  const key = id + '|' + tier;
  let hit = _skinCache.get(key);
  if (hit) return hit;
  const h = snailHash(id || 'anon');
  const rnd = mulberry(h % 100000);
  const shell = SNAIL_SHELLS[h % SNAIL_SHELLS.length];
  const body = SNAIL_BODIES[(h >>> 5) % SNAIL_BODIES.length];
  const skin = {
    shell, body,
    pattern: SNAIL_PATTERNS[(h >>> 9) % SNAIL_PATTERNS.length],
    whorls: 8 + ((h >>> 13) % 7),
    stalk: 3 + ((h >>> 17) % 4),
    lean: ((h >>> 21) % 3) - 1,
    scale: SNAIL_TIER_SCALE[tier] || 1,
    tier: tier || 'task',
    seed: h
  };
  _skinCache.set(key, skin);
  return skin;
}

/* the shell, which is where all the personality lives */
function drawShell(c, cx, cy, r, skin, t) {
  const S = skin.shell;
  const rnd = mulberry(skin.seed % 65536);
  pcircle(c, cx, cy, r + 1, INK);
  pcircle(c, cx, cy, r, S.mid);

  if (skin.pattern === 'bands') {
    for (let i = 0; i < 4; i++) {
      const rr = r * (1 - i * 0.22);
      pcircle(c, cx, cy, rr, i % 2 ? S.deep : S.lit);
    }
  } else if (skin.pattern === 'spots') {
    pcircle(c, cx, cy, r * 0.74, S.lit);
    const n = 5 + (skin.seed % 4);
    for (let i = 0; i < n; i++) {
      const a = rnd() * 6.28, d = rnd() * r * 0.7;
      pcircle(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d, Math.max(1, r * 0.16), S.deep);
    }
  } else if (skin.pattern === 'spiral') {
    pcircle(c, cx, cy, r * 0.8, S.lit);
    for (let i = 0; i < 48; i++) {
      const p = i / 48;
      const a = p * 6.28 * 2.2 + (t || 0) * 0.0;
      const d = r * (0.14 + p * 0.78);
      px(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d, Math.max(1, r * 0.22), Math.max(1, r * 0.22), S.deep);
    }
  } else if (skin.pattern === 'chevron') {
    pcircle(c, cx, cy, r * 0.82, S.lit);
    for (let i = 0; i < skin.whorls; i++) {
      const a = i / skin.whorls * 6.28;
      for (let d = r * 0.2; d < r * 0.92; d += 1) {
        dot(c, cx + Math.cos(a + d * 0.06) * d, cy + Math.sin(a + d * 0.06) * d, S.deep);
      }
    }
  } else if (skin.pattern === 'marbled') {
    for (let i = 0; i < r * r * 2.4; i++) {
      const a = rnd() * 6.28, d = rnd() * r * 0.94;
      dot(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d, rnd() > 0.5 ? S.lit : S.deep);
    }
  } else {   // pearl
    pcircle(c, cx, cy, r * 0.86, S.lit);
    pcircle(c, cx - r * 0.2, cy - r * 0.2, r * 0.5, S.rim);
    pcircle(c, cx + r * 0.3, cy + r * 0.3, r * 0.34, S.mid);
  }

  // the whorl at the centre and a lit rim on the upper left, always
  pcircle(c, cx - r * 0.12, cy - r * 0.12, Math.max(1, r * 0.24), S.deep);
  for (let a = 0; a < 20; a++) {
    const A = a / 20 * 6.28;
    if (Math.cos(A - 2.4) > 0.2) dot(c, cx + Math.cos(A) * (r - 0.6), cy + Math.sin(A) * (r - 0.6), S.rim);
  }

  // rank, worn on the shell
  if (skin.tier === 'chal') {
    px(c, cx - r, cy - 1, r * 2, Math.max(1, r * 0.22), '#b183e8');
    px(c, cx - r, cy - 1, r * 2, 1, '#e8d0ff');
  } else if (skin.tier === 'ending') {
    // a small crown, because an ending is an occasion
    const cw = Math.max(5, r * 0.9);
    px(c, cx - cw / 2, cy - r - 3, cw, 2, '#1a1008');
    px(c, cx - cw / 2, cy - r - 2, cw, 2, '#ffd24a');
    for (let i = 0; i < 3; i++) {
      const px2 = cx - cw / 2 + i * (cw / 2.4);
      px(c, px2, cy - r - 5, 2, 3, '#ffd24a');
      dot(c, px2, cy - r - 6, '#fff6d0');
    }
  }
}

/* the whole animal, at any size */
function drawSnail(c, g, s) {
  const skin = s.skin || snailSkin(s.note && s.note.id, s.kind);
  const k = (s.scale || skin.scale || 1);
  const x = Math.round(s.x), y = Math.round(s.y);
  const bob = Math.sin(g.t * 5 / Math.max(0.6, k)) * 0.7 * k;
  const dir = s.dir === undefined ? 1 : s.dir;
  const B = skin.body;
  const r = 7 * k;

  // slime trail
  if (!s.noTrail) {
    c.globalAlpha = 0.35;
    for (let i = 0; i < 26; i++) {
      px(c, x - dir * (6 * k + i * 3), y + 5 * k + Math.sin(i * 0.6) * 0.6, 3, Math.max(1, k), '#bfe8d8');
    }
    c.globalAlpha = 1;
  }

  // foot
  pellipse(c, x, y + 4 * k, 9 * k, 3 * k, B.skin);
  pellipse(c, x - dir, y + 3 * k, 7 * k, 2 * k, B.lit);
  px(c, x - 8 * k, y + 6 * k, 16 * k, Math.max(1, k * 0.8), B.dark);

  // head and eye stalks, before the shell so the shell sits over the neck
  pellipse(c, x + dir * 5 * k, y + 1 * k + bob * 0.4, 4 * k, 3 * k, B.skin);
  pellipse(c, x + dir * 5 * k, y + 0.4 * k + bob * 0.4, 3 * k, 2 * k, B.lit);
  for (const st of [-1, 1]) {
    const sx = x + dir * (5 * k + st * 1.6 * k), sy = y - 3 * k + bob * 0.4;
    const len = skin.stalk * k;
    px(c, sx, sy - len + 4 * k, Math.max(1, k), len, B.skin);
    pcircle(c, sx, sy - len + 3 * k, Math.max(1, 1.5 * k), B.lit);
    dot(c, sx, sy - len + 3 * k, INK);
  }
  // a mouth, on the big ones only — there is no room on a small one
  if (k >= 1.2) px(c, x + dir * 7 * k, y + 2 * k + bob * 0.4, 2 * k, Math.max(1, k * 0.6), B.dark);

  drawShell(c, x - dir * 3 * k, y - 2 * k + bob, r, skin, g.t);

  // the parcel, if he is still carrying one
  if (s.note) drawSnailParcel(c, g, s, x, y, bob, dir, k);
}

/* What the snail is actually carrying. It stays sealed until you stop him, so
   this has to say "there is news in here" without saying what the news is. */
function drawSnailParcel(c, g, s, x, y, bob, dir, k) {
  k = k || 1;
  const cx = Math.round(x - dir * 3 * k), cy = Math.round(y - 10 * k + bob);
  const tier = s.kind === 'ending' ? 'end' : s.kind === 'chal' ? 'chal' : s.kind === 'goal' ? 'goal' : 'task';
  const ribbon = tier === 'end' ? '#ffd24a' : tier === 'chal' ? '#b183e8' : tier === 'goal' ? '#ffd24a' : '#7cc44a';
  const w = Math.round(17 * k), h = Math.max(4, Math.round(6 * k));
  const unit = Math.max(1, Math.round(k));

  // the rolled scroll, strapped across the shell
  px(c, cx - w / 2 - 1, cy - h / 2 - 1, w + 2, h + 2, INK);
  px(c, cx - w / 2, cy - h / 2, w, h, '#f6e7c4');
  px(c, cx - w / 2, cy - h / 2, w, unit, '#fdf6e3');
  px(c, cx - w / 2, cy + h / 2 - unit, w, unit, '#e0cb9c');
  px(c, cx - w / 2 - 2, cy - h / 2 - 1, 2, h + 2, '#c9a86a');
  px(c, cx + w / 2, cy - h / 2 - 1, 2, h + 2, '#c9a86a');

  if (s.opened) {
    // a broken seal, so you can see at a glance you have read it
    px(c, cx - 2 * k, cy - unit, 5 * k, unit, '#8a7a5a');
    return;
  }
  // ribbon and wax seal, intact
  px(c, cx - unit / 2, cy - h / 2 - 1, unit, h + 2, ribbon);
  pcircle(c, cx, cy, Math.max(2, 2.4 * k), '#a83229');
  pcircle(c, cx, cy - 0.5, Math.max(1, 1.6 * k), '#c9453b');
  // and it glints, because unopened post should ask to be opened
  const tw = (g.t * 2 + s.x * 0.05) % 2;
  if (tw < 0.55) {
    c.globalAlpha = 1 - tw / 0.55;
    star(c, cx + w / 2, cy - 5 * k, 3 * Math.min(1.6, k), '#fff6d8', '#ffffff');
    c.globalAlpha = 1;
  }
}

/* the held tool, drawn at the pointer instead of a cursor */
function drawCursorTool(c, g, x, y, id) {
  c.globalAlpha = 0.3;
  pellipse(c, x + 1, y + 9, 5, 2, '#000000');
  c.globalAlpha = 1;
  drawItemIcon(c, x, y, id);
  // a little grabbing hand behind it
  px(c, x - 2, y + 4, 5, 3, '#e8b98a');
  px(c, x - 2, y + 4, 5, 1, '#f6d3ae');
  px(c, x - 1, y + 7, 3, 2, '#d9a878');
}

/* -------------------------------------------------------------------------
   IN-WORLD HUD — drawn in pixels, because the game has no other interface
   ------------------------------------------------------------------------- */
function drawHud(c, g) {
  /* Almost nothing. The leaf tally used to live up here and it made the park
     feel like a spreadsheet. Now the only permanent things on screen are the
     sound switch and, once you have found it, your bag. */

  // sound toggle, bottom right
  const mx = W - 18, my = H - 16;
  px(c, mx - 2, my - 2, 16, 14, '#1a0f08');
  px(c, mx - 1, my - 1, 14, 12, '#3a2e26');
  px(c, mx + 1, my + 3, 3, 4, '#f4ead6');
  for (let i = 0; i < 4; i++) px(c, mx + 4, my + 5 - i, 2, 2 + i * 2, '#f4ead6');
  if (g.muted) for (let i = 0; i < 5; i++) { dot(c, mx + 7 + i, my + 2 + i, '#ef5330'); dot(c, mx + 7 + i, my + 6 - i, '#ef5330'); }
  else { px(c, mx + 8, my + 3, 1, 4, '#f4ead6'); px(c, mx + 10, my + 1, 1, 8, '#f4ead6'); }

  if (g.bagOpen !== undefined && g.hasBag) drawBagButton(c, g);
}

/* the bag, once you own one: bottom left, and it bulges when it is full */
function drawBagButton(c, g) {
  const x = 8, y = H - 22, hot = g.bagHover;
  c.globalAlpha = 0.35; pellipse(c, x + 9, y + 19, 9, 2, '#000000'); c.globalAlpha = 1;
  const bump = hot ? 1 : 0;
  drawBackpackSprite(c, x, y - bump, 1);
  if (g.bagBadge > 0) {
    pcircle(c, x + 17, y - 1 - bump, 4, '#1a0f08');
    pcircle(c, x + 17, y - 1 - bump, 3, '#ef8a30');
    dot(c, x + 17, y - 3 - bump, '#ffe9b0'); px(c, x + 17, y - 2 - bump, 1, 3, '#ffe9b0');
  }
}

/* an old canvas backpack, drawn once and used everywhere */
function drawBackpackSprite(c, x, y, s) {
  const cvs = '#8a6a3f', dkc = '#5f4726', lit = '#b08c58', strap = '#4a3620';
  px(c, x + 2, y + 4, 14, 14, cvs);
  px(c, x + 2, y + 4, 14, 2, lit);
  px(c, x + 2, y + 16, 14, 2, dkc);
  px(c, x + 1, y + 6, 1, 11, dkc); px(c, x + 16, y + 6, 1, 11, dkc);
  px(c, x + 4, y + 1, 10, 5, cvs);            // the flap
  px(c, x + 4, y + 1, 10, 1, lit);
  px(c, x + 3, y + 6, 12, 2, dkc);
  px(c, x + 8, y + 6, 3, 4, strap);           // buckle strap
  px(c, x + 8, y + 8, 3, 2, '#c9a659');
  px(c, x + 3, y + 10, 12, 5, mix(cvs, dkc, 0.35));   // front pocket
  px(c, x + 3, y + 10, 12, 1, lit);
  px(c, x + 5, y + 12, 8, 1, strap);
}

/* a 3x5 pixel numeral set, for the leaf tally */
/* =========================================================================
   THE SCROLL, IN PIXELS
   Every panel in the game is this: a sheet of laid paper with a turned rod at
   each end. Drawn at logical resolution in the same 5x7 font as everything
   else, so it belongs to the world instead of sitting on top of it.
   ========================================================================= */
const PAPER = {
  lit:  '#f8ecd0', mid: '#efdcb2', dim: '#e2cb9a', deep: '#c9ad78',
  ink:  '#3a2410', ink2: '#6b5334', ink3: '#8f7853',
  rod:  '#c9a86a', rodLit: '#e6d3a6', rodDark: '#8a6a3a',
  gold: '#8a5a10', plum: '#5a2a7a', leaf: '#3f6b1f', rust: '#9a3410',
  wax:  '#c9453b', waxDark: '#8a2a24'
};

/* the paper itself, with a laid tooth and the curl darkening at each end */
function drawSheet(c, x, y, w, h) {
  if (h <= 0) return;
  px(c, x, y, w, h, PAPER.mid);
  // laid paper: a dithered tooth rather than ruled lines, so it reads as
  // handmade rather than as a notepad
  for (let i = 0; i < h; i++) {
    if (i & 1) continue;                                   // every other row only
    for (let j = (i & 2) ? 0 : 3; j < w; j += 6) px(c, x + j, y + i, 1, 1, PAPER.lit);
  }
  // two faint fold creases, because it has been rolled up a long time
  for (const fy of [Math.round(h * 0.34), Math.round(h * 0.71)]) {
    if (fy > 2 && fy < h - 2) {
      c.globalAlpha = 0.18;
      px(c, x, y + fy, w, 1, PAPER.deep);
      px(c, x, y + fy + 1, w, 1, PAPER.lit);
      c.globalAlpha = 1;
    }
  }
  // the curl: darker where the paper is still bending round the rods
  for (let i = 0; i < Math.min(6, h); i++) {
    c.globalAlpha = 0.30 - i * 0.05;
    px(c, x, y + i, w, 1, PAPER.deep);
    px(c, x, y + h - 1 - i, w, 1, PAPER.deep);
    c.globalAlpha = 1;
  }
  // and a lit edge down the left, because the light is always upper-left
  px(c, x, y, 1, h, PAPER.lit);
  px(c, x + w - 1, y, 1, h, PAPER.dim);
}

/* a turned rod, with a knob past each end of the paper */
function drawRod(c, x, y, w) {
  px(c, x - 1, y, w + 2, 6, INK);
  px(c, x, y + 1, w, 4, PAPER.rod);
  px(c, x, y + 1, w, 1, PAPER.rodLit);
  px(c, x, y + 4, w, 1, PAPER.rodDark);
  for (const kx of [x - 4, x + w]) {
    px(c, kx - 1, y - 2, 6, 10, INK);
    px(c, kx, y - 1, 4, 8, '#a3794a');
    px(c, kx, y - 1, 4, 2, PAPER.rod);
    px(c, kx, y + 5, 4, 2, PAPER.rodDark);
  }
}

/* the wax seal, whole and then in pieces */
function drawSeal(c, cx, cy, crack) {
  if (crack >= 1) return;
  const drop = Math.round(crack * 22);
  const spin = crack * 2.4;
  c.globalAlpha = Math.max(0, 1 - crack * 1.15);
  if (crack <= 0) {
    pcircle(c, cx, cy, 4, INK);
    pcircle(c, cx, cy, 3, PAPER.wax);
    pcircle(c, cx + 1, cy + 1, 2, PAPER.waxDark);
    dot(c, cx - 1, cy - 1, '#e8837a');
  } else {
    // two halves, turning over as they fall
    for (const side of [-1, 1]) {
      const ox = Math.round(side * crack * 5 + Math.sin(spin * side) * 2);
      pcircle(c, cx + ox, cy + drop, 3, INK);
      pcircle(c, cx + ox, cy + drop, 2, PAPER.wax);
    }
  }
  c.globalAlpha = 1;
}

/* the whole object. h is the paper height; the rods sit outside it. */
function drawScrollFrame(c, x, y, w, h, o) {
  o = o || {};
  // a soft shadow on whatever is behind it
  c.globalAlpha = 0.28;
  px(c, x + 2, y + h + 8, w, 2, '#0a0806');
  c.globalAlpha = 1;

  drawRod(c, x, y - 6, w);
  if (h > 0) {
    px(c, x - 1, y, 1, h, INK);
    px(c, x + w, y, 1, h, INK);
    drawSheet(c, x, y, w, h);
  }
  drawRod(c, x, y + h, w);
  if (o.crack !== undefined) drawSeal(c, x + w / 2, y - 3, o.crack);
}

/* =========================================================================
   CARTOON
   Squash, impact rings, dust, speed lines and hand-lettered noises. None of
   it is information; all of it is timing.
   ========================================================================= */

/* a jagged burst with a word in it, the way a comic writes a noise */
function drawWordPop(c, x, y, text, k, col) {
  if (!text) return;
  const ease = k < 0.25 ? k / 0.25 : 1;                 // snap out, then hold
  const fade = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
  const sc = 1 + (k < 0.25 ? (1 - ease) * 0.8 : 0);
  const w = F.textWidth(text, 1) * sc, h = 7 * sc;
  const cx = Math.round(x), cy = Math.round(y - k * 14);
  c.globalAlpha = fade;
  // the burst: spikes all the way round
  const spikes = 11;
  for (let i = 0; i < spikes; i++) {
    const a = i / spikes * 6.28;
    const r = (i % 2 ? 1.45 : 1.05) * ease;
    px(c, cx + Math.cos(a) * (w / 2 + 3) * r - 1, cy + Math.sin(a) * (h / 2 + 3) * r - 1, 3, 3, '#fff6d8');
  }
  pellipse(c, cx, cy, w / 2 + 4, h / 2 + 3, '#fff6d8');
  pellipse(c, cx, cy, w / 2 + 2, h / 2 + 1.5, col || '#ffd24a');
  F.drawTextCentered(c, cx, cy - 3, text, '#3a2208', 1);
  c.globalAlpha = 1;
}

/* the classic four-line impact cross, for a poke */
function drawImpactLines(c, x, y, k, col) {
  const fade = Math.max(0, 1 - k);
  c.globalAlpha = fade;
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * 6.28 + 0.4;
    const r0 = 6 + k * 10, r1 = r0 + 5 + (1 - k) * 5;
    for (let r = r0; r < r1; r++) {
      px(c, x + Math.cos(a) * r, y + Math.sin(a) * r, 1, 1, col || '#fff6d8');
    }
  }
  c.globalAlpha = 1;
}

/* squash and stretch: 1 is at rest, positive squashes, negative stretches */
function squashTransform(c, cx, baseY, amount) {
  const sx = 1 + amount * 0.22, sy = 1 - amount * 0.26;
  c.save();
  c.translate(cx, baseY);
  c.scale(sx, sy);
  c.translate(-cx, -baseY);
}

const DIGIT_BITS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111',
                    '101101111001001', '111100111001111', '111100111101111', '111001010010010',
                    '111101111101111', '111101111001111'];
function digits(c, x, y, str, col) {
  for (let i = 0; i < str.length; i++) {
    const bits = DIGIT_BITS[+str[i]] || DIGIT_BITS[0];
    for (let b = 0; b < 15; b++) if (bits[b] === '1') px(c, x + i * 4 + (b % 3), y + Math.floor(b / 3), 1, 1, col);
  }
}

/* very small capitals, enough for a season name */
const LETTER_BITS = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
  E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
  I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '101111111111101', O: '010101101101010', P: '110101110100100',
  Q: '010101101111011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101011', V: '101101101010010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', ' ': '000000000000000'
};
function tinyText(c, x, y, str, col) {
  for (let i = 0; i < str.length; i++) {
    const bits = LETTER_BITS[str[i]] || LETTER_BITS[' '];
    for (let b = 0; b < 15; b++) if (bits[b] === '1') px(c, x + i * 4 + (b % 3), y + Math.floor(b / 3), 1, 1, col);
  }
}

/* the things you own, lying about on the grass */
function drawTools(c, g) {
  for (const t of g.tools) {
    const held = g.holding && g.holding.id === t.id;
    const bob = held ? 0 : Math.sin(g.t * 2 + t.hx) * 0.6;
    c.globalAlpha = 0.28;
    pellipse(c, t.x + 1, (held ? t.y + 12 : t.y + 7), 6, 2, '#0d1a08');
    c.globalAlpha = 1;
    if (held) glow(c, t.x, t.y, 11, '#ffe9a0', 0.5);
    drawItemIcon(c, t.x, t.y + bob, t.id);
  }
}

/* =========================================================================
   CREATURES, ITEMS, PARTICLES
   ========================================================================= */
function drawSquirrel(c, g) {
  const s = g.squirrel;
  if (!s.active) return;
  const x = Math.round(s.x), y = Math.round(s.y);
  const dk = darkness(g.timeOfDay);
  const shade = col => mix(col, '#0a1226', dk * 0.75);
  const body = shade('#a9713f'), belly = shade('#e8cfa8'), dark = shade('#6d4423');
  const hop = s.moving ? Math.abs(Math.sin(g.t * 12)) * 3 : 0;
  const yy = y - hop;
  const tw = Math.sin(g.t * 6) * 1;

  pcircle(c, x - 8 * s.dir, yy - 6 + tw, 6, dark);
  pcircle(c, x - 9 * s.dir, yy - 11 + tw, 5, body);
  pcircle(c, x - 7 * s.dir, yy - 15 + tw, 4, body);
  pcircle(c, x - 8 * s.dir, yy - 11 + tw, 3, shade('#c98f55'));
  pcircle(c, x, yy - 4, 6, body);
  pcircle(c, x + 1 * s.dir, yy - 3, 4, belly);
  pcircle(c, x + 5 * s.dir, yy - 10, 5, body);
  px(c, x + 2 * s.dir, yy - 15, 2, 4, body);
  px(c, x + 7 * s.dir, yy - 15, 2, 4, body);
  px(c, x + 2 * s.dir, yy - 15, 2, 2, shade('#d9a3c0'));
  px(c, x + 7 * s.dir, yy - 15, 2, 2, shade('#d9a3c0'));
  px(c, x + 7 * s.dir, yy - 11, 2, 2, '#120a04');
  dot(c, x + 8 * s.dir, yy - 11, '#ffffff');
  px(c, x + 9 * s.dir, yy - 8, 2, 1, '#120a04');
  if (s.face === 1) px(c, x + 6 * s.dir, yy - 7, 3, 1, '#3a1c0c');
  px(c, x - 1, yy + 1, 2, 3, dark); px(c, x + 3, yy + 1, 2, 3, dark);
  if (s.holding === 'gear') drawGear(c, g, x + 10 * s.dir, yy - 5, 5.5, shade('#8a8a96'), shade('#5a5a66'));
  else if (s.holding) drawItemIcon(c, x + 10 * s.dir, yy - 5, s.holding);
}

/* a turning cog — the squirrel's entire new career */
function drawGear(c, g, x, y, r, col, dark) {
  const a0 = g.t * 0.9;
  pcircle(c, x, y, r, dark);
  pcircle(c, x, y, r - 1, col);
  for (let i = 0; i < 8; i++) {
    const A = a0 + i / 8 * 6.28;
    const tx = x + Math.cos(A) * (r + 0.6), ty = y + Math.sin(A) * (r + 0.6);
    px(c, tx - 1, ty - 1, 2, 2, dark);
  }
  pcircle(c, x, y, r - 2.6, dark);
  pcircle(c, x - 0.5, y - 0.5, r - 3.4, col);
}

function drawLeafSprite(c, x, y, col, col2) {
  px(c, x + 1, y, 4, 1, col);
  px(c, x, y + 1, 6, 1, col);
  px(c, x, y + 2, 7, 1, col);
  px(c, x + 1, y + 3, 5, 1, col2);
  px(c, x + 2, y + 4, 3, 1, col2);
  px(c, x + 3, y + 4, 1, 2, '#6b4a30');
}

function drawItemIcon(c, x, y, id) {
  switch (id) {
    case 'acorn': pcircle(c, x, y + 1, 3, '#d9a05b'); px(c, x - 3, y - 3, 7, 3, '#6b4a2a'); px(c, x, y - 5, 1, 2, '#4a3220'); break;
    case 'hat': pcircle(c, x, y, 4, '#c9453b'); px(c, x - 4, y, 9, 2, '#c9453b'); dot(c, x - 1, y - 2, '#fff'); break;
    case 'can': px(c, x - 3, y - 2, 6, 5, '#8a9aa8'); px(c, x + 3, y - 3, 4, 2, '#8a9aa8'); px(c, x - 5, y - 1, 2, 3, '#6d7c88'); break;
    case 'paper': case 'pamph': px(c, x - 4, y - 3, 8, 7, '#e8e2d0'); px(c, x - 3, y - 2, 6, 1, '#5a5a5a'); px(c, x - 3, y, 6, 1, '#8a8a8a'); break;
    case 'lighter': px(c, x - 2, y - 2, 5, 7, '#d64545'); px(c, x - 2, y - 4, 5, 2, '#c9c9c9'); dot(c, x, y - 5, '#ffcf4a'); break;
    case 'diary': px(c, x - 4, y - 3, 8, 7, '#6b4a8a'); px(c, x - 4, y - 3, 2, 7, '#4a3060'); dot(c, x + 1, y, '#e8d24a'); break;
    case 'leaf': drawLeafSprite(c, x - 3, y - 3, '#5fae3c', '#3a7a28'); break;
  }
}

function drawGroundItems(c, g) {
  const dk = darkness(g.timeOfDay);
  for (const it of g.groundLeaves) {
    if (it.area && g.areaNow && it.area !== g.areaNow) continue;
    const bob = Math.sin(g.t * 3 + it.ph) * 0.5;
    c.globalAlpha = 0.3; pellipse(c, it.x + 3, it.y + 6, 5, 2, '#0d1a08'); c.globalAlpha = 1;
    drawLeafSprite(c, it.x, it.y + bob, mix(it.col, '#0a1226', dk * 0.6), mix(it.col2, '#0a1226', dk * 0.6));
  }
  if (g.areaNow && g.areaNow !== 'oak') return;
  for (const sp of g.saplings) {
    const h = Math.min(26, sp.age * 0.7);
    const sway = Math.sin(g.t * 1.6 + sp.ph) * 1.2;
    px(c, sp.x, GROUND_Y + 6 - h, 2, h, mix('#5a7a32', '#0a1226', dk * 0.7));
    pcircle(c, sp.x + sway, GROUND_Y + 5 - h, 2 + h * 0.24, mix('#4a9235', '#0a1226', dk * 0.7));
    pcircle(c, sp.x + sway - 1, GROUND_Y + 3 - h, 1 + h * 0.16, mix('#6fbc45', '#0a1226', dk * 0.7));
  }
}

function drawParticles(c, g) {
  for (const p of g.particles) {
    if (p.kind === 'leaf') drawLeafSprite(c, p.x, p.y, p.col, p.col2);
    else if (p.kind === 'fire') {
      const cols = ['#fff3b0', '#ffd24a', '#ffa726', '#ef5330', '#8c2b18'];
      px(c, p.x, p.y, p.s, p.s, cols[Math.min(4, Math.floor((1 - p.life / p.max) * 5))]);
    } else if (p.kind === 'smoke') {
      c.globalAlpha = Math.max(0, p.life / p.max) * 0.45;
      pcircle(c, p.x, p.y, p.s, '#8a8a8a'); c.globalAlpha = 1;
    } else if (p.kind === 'heart') {
      px(c, p.x, p.y + 1, 5, 3, '#ff6b8a'); px(c, p.x + 1, p.y, 1, 1, '#ff6b8a');
      px(c, p.x + 3, p.y, 1, 1, '#ff6b8a'); px(c, p.x + 2, p.y + 4, 1, 1, '#ff6b8a');
    } else if (p.kind === 'drop') px(c, p.x, p.y, 1, 3, '#7ec8f2');
    else if (p.kind === 'spark') { glow(c, p.x, p.y, 3, '#ffd24a', 0.4); px(c, p.x, p.y, 1, 1, '#ffe9a0'); }
    else if (p.kind === 'star') {
      c.globalAlpha = Math.max(0, p.life / p.max);
      px(c, p.x, p.y, 1, 1, '#ffffff'); px(c, p.x - 1, p.y, 3, 1, '#ffe9a0'); px(c, p.x, p.y - 1, 1, 3, '#ffe9a0');
      c.globalAlpha = 1;
    } else if (p.kind === 'ash') {
      c.globalAlpha = Math.max(0, p.life / p.max) * 0.8;
      px(c, p.x, p.y, 1, 1, '#b9a99e'); c.globalAlpha = 1;
    } else if (p.kind === 'soul') {
      c.globalAlpha = Math.max(0, p.life / p.max);
      glow(c, p.x, p.y, 5, '#bfe8ff', 0.5); px(c, p.x, p.y, 1, 1, '#ffffff'); c.globalAlpha = 1;
    } else if (p.kind === 'puff') {
      // a dust puff: grows, thins, and drifts up
      const k = 1 - p.life / p.max;
      c.globalAlpha = Math.max(0, 1 - k) * 0.8;
      const r = 1.5 + k * (p.s + 3);
      pcircle(c, p.x, p.y, r, '#f2ead8');
      pcircle(c, p.x - r * 0.3, p.y - r * 0.3, r * 0.55, '#ffffff');
      c.globalAlpha = 1;
    } else if (p.kind === 'ring') {
      // an impact ring, drawn as a broken hoop so it reads as ink
      const k = 1 - p.life / p.max;
      const r = 3 + k * 22 * (p.s || 1);
      c.globalAlpha = Math.max(0, 1 - k) * 0.9;
      for (let a = 0; a < 24; a++) {
        if ((a % 4) === 3) continue;
        const A = a / 24 * 6.28;
        px(c, p.x + Math.cos(A) * r, p.y + Math.sin(A) * r * 0.75, 2, 2, p.col || '#fff6d8');
      }
      c.globalAlpha = 1;
    } else if (p.kind === 'zip') {
      // a speed line
      c.globalAlpha = Math.max(0, p.life / p.max);
      px(c, p.x, p.y, 5 + p.s * 3, 1, p.col || '#ffffff');
      c.globalAlpha = 1;
    } else if (p.kind === 'sweat') {
      c.globalAlpha = Math.max(0, p.life / p.max);
      pcircle(c, p.x, p.y, 2, '#9fd8f0');
      px(c, p.x, p.y - 3, 1, 2, '#9fd8f0');
      dot(c, p.x - 1, p.y - 1, '#ffffff');
      c.globalAlpha = 1;
    } else if (p.kind === 'lines') {
      drawImpactLines(c, p.x, p.y, 1 - p.life / p.max, p.col);
    } else if (p.kind === 'word') {
      drawWordPop(c, p.x, p.y, p.text, 1 - p.life / p.max, p.col);
    }
  }
}

function flame(c, x, y, h, seed) {
  const wob = Math.sin(seed * 3.1 + y * 0.4) * 1.5;
  for (let i = 0; i < h; i++) {
    const p = i / h;
    const w = Math.max(1, Math.round((1 - p) * 5));
    const col = p < 0.25 ? '#8c2b18' : p < 0.55 ? '#ef5330' : p < 0.8 ? '#ffa726' : '#ffe066';
    px(c, Math.round(x - w / 2 + wob * p), Math.round(y - i), w, 1, col);
  }
}

/* the warm bloom the fire throws onto the scene — drawn behind the tree */
function drawFireGlow(c, g) {
  if (g.burn <= 0) return;
  if (g.dead && !g.stillBurning) return;
  glow(c, CX, 108, 80 * Math.min(1, g.burn * 1.5), '#ff7a2a', 0.5);
}

function drawFireOnTree(c, g) {
  if (g.burn <= 0) return;
  if (g.dead && !g.stillBurning) return;
  const rnd = mulberry(Math.floor(g.t * 10));
  const front = g.burn;
  for (const bl of CANOPY) {
    if (bl.burn < front || bl.burn > front + 0.2) continue;
    const n = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      flame(c, bl.x + (rnd() * 2 - 1) * bl.r * 0.8, bl.y + (rnd() * 2 - 1) * bl.r * 0.4,
            5 + Math.floor(rnd() * 8), g.t + i);
    }
  }
  // flames hug the sides of the trunk so his face stays readable through them
  const climb = Math.min(1, g.burn * 1.7);
  for (let i = 0; i < 10 + climb * 14; i++) {
    const y = GROUND_Y + 4 - rnd() * 62 * climb;
    const hw = trunkHalfWidth(y);
    const edge = 0.62 + rnd() * 0.45;
    flame(c, CX + (rnd() > 0.5 ? 1 : -1) * hw * edge, y, 4 + Math.floor(rnd() * 9), g.t + i * 0.7);
  }
  // a low fire licking round the roots
  for (let i = 0; i < 12; i++) {
    flame(c, CX + (rnd() * 2 - 1) * 40, GROUND_Y + 4 + rnd() * 3, 4 + Math.floor(rnd() * 7), g.t + i);
  }
  for (let i = 0; i < 20; i++) px(c, 106 + rnd() * 44, GROUND_Y + rnd() * 6, 1, 1, rnd() > 0.5 ? '#ffd24a' : '#ef5330');
}

function drawPond(c, g) {
  const dk = darkness(g.timeOfDay);
  const base = mix('#3f8fd0', '#0a1226', dk * 0.75), hi = mix('#8fd0f2', '#0a1226', dk * 0.6);
  pellipse(c, 30, GROUND_Y + 20, 22, 7, mix(base, '#000000', 0.35));
  pellipse(c, 30, GROUND_Y + 19, 21, 6, base);
  for (let i = 0; i < 5; i++) {
    const w = 4 + ((Math.sin(g.t * 1.4 + i) * 0.5 + 0.5) * 9 | 0);
    px(c, 22 + i * 4 - w / 2, GROUND_Y + 15 + i * 2, w, 1, hi);
  }
  if (g.flags.lighterGone) px(c, 29, GROUND_Y + 21, 3, 2, '#7a2a2a');
}

function drawOverlay(c, g) {
  if (g.season === 'winter') {
    const rnd = mulberry(3);
    for (let i = 0; i < 70; i++) {
      const sx = (rnd() * W + g.t * (6 + rnd() * 10)) % W;
      const sy = (rnd() * H + g.t * (12 + rnd() * 12)) % H;
      dot(c, sx, sy, rnd() > 0.7 ? '#ffffff' : '#dfeaf5');
    }
  }
  if (g.raining > 0) {
    const rnd = mulberry(11);
    for (let i = 0; i < 60; i++) {
      const sx = (rnd() * W + g.t * 30) % W;
      const sy = (rnd() * H + g.t * 170) % H;
      px(c, sx, sy, 1, 3, '#9ad4f2');
    }
  }
  // vignette: always a little, more when he is staring at you
  const vig = 0.22 + (g.stare || 0) * 0.4;
  c.globalAlpha = vig;
  for (let i = 0; i < 22; i++) {
    const a = i / 22;
    c.globalAlpha = vig * a * 0.5;
    px(c, i, 0, 1, H, '#000000'); px(c, W - 1 - i, 0, 1, H, '#000000');
    px(c, 0, i, W, 1, '#000000'); px(c, 0, H - 1 - i, W, 1, '#000000');
  }
  c.globalAlpha = 1;
}

/* -------------------- the morning after -------------------- */
function drawAshScene(c, g) {
  const bands = ['#1a1218', '#241a1e', '#332224', '#4a2e2a', '#6b3f31'];
  for (let y = 0; y < GROUND_Y; y++) {
    const f = y / (GROUND_Y - 1) * (bands.length - 1);
    const i = Math.min(bands.length - 2, Math.floor(f));
    px(c, 0, y, W, 1, mix(bands[i], bands[i + 1], f - i));
  }
  for (const t of BG_TREES) {
    const base = GROUND_Y - 2 + t.depth * 6;
    pellipse(c, t.x, base - t.h, t.r, t.h * 0.42, mix('#2a1c1a', '#6b3f31', t.depth * 0.5));
  }
  px(c, 0, GROUND_Y, W, H - GROUND_Y, '#241d1a');
  px(c, 0, GROUND_Y + 16, W, H, '#1a1513');
  c.globalAlpha = 0.6;
  for (let y = 0; y <= 12; y++) {
    const hw = Math.round(Math.sqrt(Math.max(0, 1 - (y / 12) ** 2)) * 60);
    if (hw > 0) px(c, CX - hw, GROUND_Y + 2 + y, hw * 2, 1, '#0e0a09');
  }
  c.globalAlpha = 1;

  const rnd = mulberry(77);
  for (let y = GROUND_Y + 6; y > GROUND_Y - 26; y--) {
    const k = (GROUND_Y - y) / 32;
    const hw = Math.round(30 - k * 8);
    px(c, CX - hw, y, hw * 2, 1, '#2a2220');
    px(c, CX - hw, y, 3, 1, '#171211');
    px(c, CX + hw - 3, y, 3, 1, '#3a2f2c');
  }
  for (let i = 0; i < 22; i++) {
    const x = 100 + i * 2.6;
    px(c, x, GROUND_Y - 26 - (2 + Math.floor(rnd() * 11)), 3, 14, '#241d1b');
  }
  for (const dir of [-1, 1]) for (let i = 0; i < 22; i++) {
    const h = Math.max(1, 8 - i * 0.36);
    px(c, CX + dir * (28 + i) - (dir < 0 ? 2 : 0), GROUND_Y + 6 - h, 2, h, '#1e1817');
  }
  const glowAmt = 0.55 + 0.45 * Math.sin(g.t * 1.7);
  glow(c, CX, GROUND_Y - 8, 26, '#ff6a20', 0.18 * glowAmt);
  for (let i = 0; i < 26; i++) {
    const x = 108 + Math.floor(rnd() * 40), y = GROUND_Y - 24 + Math.floor(rnd() * 28);
    c.globalAlpha = glowAmt * (0.4 + rnd() * 0.6);
    dot(c, x, y, rnd() > 0.5 ? '#ff8a3a' : '#d94a22');
    c.globalAlpha = 1;
  }
  for (let i = 0; i < 80; i++) {
    const x = (rnd() * W + g.t * (3 + rnd() * 5)) % W;
    const y = (rnd() * H - g.t * (8 + rnd() * 14) + H * 3) % H;
    c.globalAlpha = 0.25 + rnd() * 0.4;
    dot(c, x, y, rnd() > 0.7 ? '#c9b8ae' : '#7a6a62');
    c.globalAlpha = 1;
  }
  for (let i = 0; i < 24; i++) {
    const p = i / 24;
    const x = CX + Math.sin(g.t * 0.8 + p * 4) * (4 + p * 18);
    c.globalAlpha = 0.20 * (1 - p);
    pcircle(c, x, GROUND_Y - 32 - p * 100, 3 + p * 10, '#8a7d76');
    c.globalAlpha = 1;
  }
}

/* =========================================================================
   TROPHY SCULPTURES
   One distinct emblem per achievement, drawn around (x, y) in a 22x22 box
   with its base sitting on y + 10.
   ========================================================================= */
const GOLD = ['#7a4a10', '#b5811f', '#e8b23a', '#ffdd85', '#fff6d0'];
const STONE = ['#3a3a44', '#5a5a66', '#8a8a96', '#b6b6c2', '#e0e0e8'];
const JADE = ['#12463a', '#1d6b52', '#2f9670', '#5cc79a', '#a8ecd0'];

const TROPHY_ART = {
  /* --- first steps --- */
  hello: (c, x, y) => { px(c, x - 4, y - 6, 8, 16, GOLD[1]); px(c, x - 4, y - 6, 3, 16, GOLD[0]);
    for (let i = 0; i < 5; i++) px(c, x - 2 + (i % 2), y - 4 + i * 3, 4, 1, GOLD[2]);
    px(c, x + 2, y - 2, 2, 5, GOLD[3]); px(c, x + 1, y + 3, 4, 2, GOLD[3]); },
  chat10: (c, x, y) => { pellipse(c, x, y - 1, 9, 6, GOLD[3]); pellipse(c, x, y - 2, 8, 5, GOLD[4]);
    px(c, x - 5, y + 4, 4, 4, GOLD[3]); for (let i = -3; i <= 3; i += 3) px(c, x + i, y - 2, 2, 2, GOLD[0]); },
  chat30: (c, x, y) => { for (let i = 0; i < 3; i++) { pellipse(c, x - 3 + i * 3, y + 4 - i * 5, 7 - i, 4, GOLD[2 + (i % 2)]); } },
  chat60: (c, x, y) => { px(c, x - 9, y - 3, 18, 11, GOLD[1]); px(c, x - 8, y - 2, 7, 9, GOLD[4]); px(c, x + 1, y - 2, 7, 9, GOLD[4]);
    px(c, x - 1, y - 4, 2, 13, GOLD[0]); pellipse(c, x, y - 8, 6, 4, GOLD[3]); },
  chatall: (c, x, y) => { px(c, x - 9, y - 6, 18, 15, GOLD[4]); px(c, x - 9, y - 6, 18, 2, GOLD[2]);
    for (let i = 0; i < 5; i++) px(c, x - 7, y - 2 + i * 2, 14 - (i % 2) * 4, 1, GOLD[0]);
    pcircle(c, x - 9, y - 6, 3, GOLD[1]); pcircle(c, x + 9, y - 6, 3, GOLD[1]); },
  spam: (c, x, y) => { px(c, x - 2, y - 8, 4, 10, GOLD[3]); px(c, x - 5, y + 1, 10, 8, GOLD[2]); px(c, x - 5, y + 1, 10, 2, GOLD[3]);
    px(c, x - 2, y - 9, 4, 2, GOLD[4]); },
  spam2: (c, x, y) => { px(c, x - 2, y - 6, 4, 9, GOLD[3]); px(c, x - 5, y + 2, 10, 7, GOLD[2]);
    for (let i = 0; i < 3; i++) { px(c, x - 9 - i * 2, y - 5 + i, 3, 1, GOLD[4]); px(c, x + 7 + i * 2, y - 5 + i, 3, 1, GOLD[4]); } },

  /* --- leaves --- */
  sneeze1: (c, x, y) => { drawLeafSprite(c, x - 3, y - 2, GOLD[3], GOLD[1]); px(c, x + 5, y - 6, 2, 2, '#bfe8ff'); px(c, x + 8, y - 2, 2, 2, '#bfe8ff'); px(c, x + 5, y + 3, 2, 2, '#bfe8ff'); },
  sneeze10: (c, x, y) => { pellipse(c, x, y - 3, 10, 6, '#cfe8ff'); for (let i = 0; i < 3; i++) drawLeafSprite(c, x - 8 + i * 7, y + 2, GOLD[3], GOLD[1]); },
  leaf1: (c, x, y) => { drawLeafSprite(c, x - 4, y - 4, JADE[3], JADE[1]); px(c, x - 1, y + 3, 2, 6, JADE[0]); },
  leaf25: (c, x, y) => { for (let i = 0; i < 5; i++) drawLeafSprite(c, x - 8 + (i % 3) * 6, y + 3 - Math.floor(i / 3) * 5, JADE[3 - (i % 2)], JADE[1]); },
  leaf100: (c, x, y) => { px(c, x - 8, y - 1, 16, 10, GOLD[1]); px(c, x - 8, y - 1, 16, 2, GOLD[0]);
    for (let i = 0; i < 4; i++) drawLeafSprite(c, x - 7 + i * 5, y - 6, JADE[3], JADE[1]); },
  leaf250: (c, x, y) => { px(c, x - 9, y - 2, 18, 11, GOLD[1]); px(c, x - 9, y - 5, 18, 4, GOLD[2]); px(c, x - 2, y - 1, 4, 5, GOLD[0]);
    for (let i = 0; i < 5; i++) drawLeafSprite(c, x - 9 + i * 5, y - 10, JADE[3], JADE[1]); },

  /* --- squirrel --- */
  squirrel: (c, x, y) => { pcircle(c, x - 5, y - 1, 5, '#a9713f'); pcircle(c, x - 6, y - 6, 4, '#a9713f'); pcircle(c, x + 4, y + 1, 5, '#c98f55');
    pcircle(c, x + 5, y - 5, 4, '#a9713f'); px(c, x + 3, y - 9, 2, 3, '#a9713f'); px(c, x + 7, y - 9, 2, 3, '#a9713f'); dot(c, x + 7, y - 5, '#120a04'); },
  trade1: (c, x, y) => { drawLeafSprite(c, x - 9, y - 2, JADE[3], JADE[1]); pcircle(c, x + 6, y + 1, 4, GOLD[2]); pcircle(c, x + 6, y + 1, 2, GOLD[4]);
    px(c, x - 2, y, 5, 2, GOLD[3]); px(c, x + 1, y - 2, 2, 6, GOLD[3]); },
  tradeall: (c, x, y) => { px(c, x - 9, y - 1, 18, 10, GOLD[1]); px(c, x - 9, y - 1, 18, 2, GOLD[2]);
    px(c, x - 6, y - 9, 12, 8, GOLD[4]); px(c, x - 4, y - 6, 8, 1, GOLD[0]); px(c, x - 4, y - 4, 6, 1, GOLD[0]); },
  sqchat: (c, x, y) => { pcircle(c, x - 4, y + 2, 5, '#a9713f'); pcircle(c, x - 5, y - 3, 4, '#a9713f'); px(c, x - 7, y - 7, 2, 3, '#a9713f');
    pellipse(c, x + 5, y - 5, 6, 4, GOLD[4]); px(c, x + 1, y - 1, 3, 3, GOLD[4]); },
  diary: (c, x, y) => { px(c, x - 8, y - 6, 16, 14, '#6b4a8a'); px(c, x - 8, y - 6, 3, 14, '#4a3060'); px(c, x - 3, y - 2, 10, 1, '#e8d24a');
    pcircle(c, x + 4, y + 3, 2, GOLD[2]); px(c, x + 4, y + 4, 1, 4, GOLD[2]); },

  /* --- kindness --- */
  hug1: (c, x, y) => { px(c, x - 3, y - 6, 6, 15, '#7d5734'); pellipse(c, x, y - 8, 8, 4, JADE[2]);
    for (const d of [-1, 1]) { px(c, x + d * 8 - 1, y - 2, 2, 7, '#e8b98a'); px(c, x + d * 5, y + 4, 4, 2, '#e8b98a'); } },
  hug10: (c, x, y) => { px(c, x - 7, y - 5, 5, 5, '#ff5b78'); px(c, x + 2, y - 5, 5, 5, '#ff5b78'); px(c, x - 7, y - 1, 14, 4, '#ff5b78');
    px(c, x - 5, y + 3, 10, 3, '#ff5b78'); px(c, x - 2, y + 6, 4, 3, '#ff5b78');
    for (let i = 0; i < 4; i++) px(c, x - 5 + i * 3, y - 3 + (i % 2), 1, 6, '#c93a55'); },
  water1: (c, x, y) => { px(c, x - 6, y - 2, 11, 10, STONE[2]); px(c, x + 5, y - 4, 5, 3, STONE[2]); px(c, x - 9, y, 3, 5, STONE[1]);
    px(c, x - 4, y, 5, 3, STONE[4]); px(c, x + 9, y, 1, 3, '#7ec8f2'); },
  water10: (c, x, y) => { px(c, x - 8, y, 16, 9, STONE[1]); px(c, x - 8, y, 16, 2, STONE[3]); px(c, x - 6, y - 8, 2, 8, STONE[2]); px(c, x + 5, y - 8, 2, 8, STONE[2]);
    px(c, x - 7, y - 10, 15, 2, STONE[3]); px(c, x - 1, y + 2, 3, 5, '#7ec8f2'); },
  plant: (c, x, y) => { px(c, x - 9, y + 4, 18, 5, '#6b4a2a'); pcircle(c, x, y + 4, 4, '#d9a05b'); px(c, x - 4, y, 8, 3, '#6b4a2a');
    px(c, x - 1, y - 6, 2, 6, JADE[1]); pcircle(c, x - 4, y - 6, 3, JADE[3]); pcircle(c, x + 4, y - 8, 3, JADE[2]); },
  plant5: (c, x, y) => { px(c, x - 10, y + 6, 20, 3, '#6b4a2a');
    for (let i = 0; i < 5; i++) { const h = 5 + (i % 3) * 3; px(c, x - 9 + i * 4, y + 6 - h, 1, h, JADE[1]); pcircle(c, x - 9 + i * 4, y + 5 - h, 2, JADE[3]); } },
  hat: (c, x, y) => { for (let i = 0; i <= 7; i++) { const hw = Math.round(Math.sqrt(Math.max(0, 1 - (i / 7) ** 2)) * 10); px(c, x - hw, y - i, hw * 2, 1, i > 5 ? '#e05c4e' : '#c9453b'); }
    px(c, x - 10, y + 1, 20, 2, '#a83229'); px(c, x - 4, y + 3, 8, 6, '#f0e2cc'); pcircle(c, x - 4, y - 4, 2, '#ffe9dd'); pcircle(c, x + 3, y - 2, 2, '#ffe9dd'); },

  /* --- world --- */
  world1: (c, x, y) => { pcircle(c, x, y, 9, '#2a6ea8'); pcircle(c, x, y, 8, '#3f8fd0');
    px(c, x - 7, y - 3, 5, 3, '#4caf50'); px(c, x + 1, y - 5, 5, 4, '#4caf50'); px(c, x - 3, y + 3, 7, 3, '#4caf50'); },
  world10: (c, x, y) => { pcircle(c, x - 2, y, 8, '#3f8fd0'); px(c, x - 8, y - 2, 5, 3, '#4caf50'); px(c, x, y - 4, 5, 3, '#4caf50');
    pcircle(c, x + 5, y + 2, 5, STONE[4]); pcircle(c, x + 5, y + 2, 3, '#cfe8ff'); px(c, x + 8, y + 5, 4, 4, STONE[2]); },
  worldall: (c, x, y) => { pcircle(c, x, y + 1, 9, '#2a4a6a'); px(c, x - 1, y - 8, 2, 18, '#1a2a3a');
    px(c, x - 7, y - 1, 5, 3, '#3a6a4a'); px(c, x + 2, y + 2, 5, 3, '#3a6a4a');
    px(c, x - 1, y - 12, 2, 4, GOLD[4]); pcircle(c, x, y - 13, 2, '#ffb02e'); },
  paper: (c, x, y) => { px(c, x - 9, y - 6, 18, 15, '#e8e2d0'); px(c, x - 9, y - 6, 18, 3, '#c9c2b0');
    for (let i = 0; i < 4; i++) px(c, x - 7, y - 1 + i * 3, 14 - (i % 2) * 5, 1, '#5a5a5a'); px(c, x + 2, y - 1, 6, 6, '#8a8a8a'); },
  silence: (c, x, y) => { px(c, x - 7, y - 9, 14, 2, GOLD[1]); px(c, x - 7, y + 8, 14, 2, GOLD[1]);
    for (let i = 0; i < 8; i++) { const w = 6 - Math.abs(4 - i); px(c, x - w, y - 7 + i, w * 2, 1, i < 4 ? GOLD[3] : STONE[4]); }
    px(c, x - 1, y - 1, 2, 3, GOLD[4]); },

  /* --- fire --- */
  lighter: (c, x, y) => { px(c, x - 4, y - 2, 9, 11, '#d64545'); px(c, x - 4, y - 5, 9, 3, STONE[3]); px(c, x - 2, y, 5, 5, '#a03030'); px(c, x + 1, y - 7, 2, 2, GOLD[3]); },
  flick: (c, x, y) => { px(c, x - 4, y, 9, 9, '#d64545'); px(c, x - 4, y - 3, 9, 3, STONE[3]); flame(c, x + 1, y - 4, 7, 1); },
  flick10: (c, x, y) => { px(c, x - 8, y, 8, 9, '#d64545'); px(c, x - 8, y - 3, 8, 3, STONE[3]);
    for (let i = 0; i < 10; i++) px(c, x + 2 + (i % 5) * 2, y - 6 + Math.floor(i / 5) * 8, 1, 5, GOLD[3]); },
  burn: (c, x, y) => { px(c, x - 8, y + 2, 16, 7, '#2a2220'); px(c, x - 6, y - 4, 4, 7, '#241d1b'); px(c, x + 2, y - 2, 3, 5, '#241d1b');
    for (let i = 0; i < 6; i++) dot(c, x - 6 + i * 2, y + 3 + (i % 2), i % 2 ? '#ff8a3a' : '#d94a22'); },
  refuse: (c, x, y) => { pellipse(c, x, y + 5, 11, 4, '#3f8fd0'); px(c, x - 3, y - 6, 7, 9, '#d64545'); px(c, x - 3, y - 8, 7, 2, STONE[3]);
    px(c, x - 8, y + 2, 4, 1, '#8fd0f2'); px(c, x + 5, y + 3, 4, 1, '#8fd0f2'); },

  /* --- heaven --- */
  heaven: (c, x, y) => { for (let a = 0; a < 26; a++) { const A = a / 26 * 6.28; px(c, x + Math.cos(A) * 9 - 1, y + Math.sin(A) * 4, 2, 2, GOLD[3]); }
    for (let a = 0; a < 26; a++) { const A = a / 26 * 6.28; dot(c, x + Math.cos(A) * 8, y + Math.sin(A) * 3.4, GOLD[4]); } },
  reborn: (c, x, y) => { pcircle(c, x, y + 3, 5, '#d9a05b'); px(c, x - 3, y - 2, 7, 3, '#6b4a2a');
    for (const d of [-1, 1]) { pellipse(c, x + d * 8, y, 5, 3, '#ffffff'); pellipse(c, x + d * 8, y - 1, 4, 2, '#eaf4ff'); } },
  reborn5: (c, x, y) => { for (let i = 0; i < 5; i++) { const A = i / 5 * 6.28 - 1.57; pcircle(c, x + Math.cos(A) * 8, y + Math.sin(A) * 8, 3, '#d9a05b');
    px(c, x + Math.cos(A) * 8 - 2, y + Math.sin(A) * 8 - 4, 5, 2, '#6b4a2a'); } pcircle(c, x, y, 2, GOLD[3]); },
  god: (c, x, y) => { pellipse(c, x, y - 2, 11, 6, '#ffffff'); pellipse(c, x - 5, y, 6, 4, '#eaf4ff');
    px(c, x + 1, y + 1, 9, 10, GOLD[1]); px(c, x + 2, y + 2, 7, 8, '#f0e6cc'); px(c, x + 3, y + 4, 5, 1, '#5a5a5a'); px(c, x + 3, y + 6, 4, 1, '#5a5a5a'); },

  /* --- endings --- */
  end1: (c, x, y) => { star(c, x, y, 9, GOLD[3], GOLD[4]); },
  end3: (c, x, y) => { star(c, x - 7, y + 3, 6, GOLD[2], GOLD[4]); star(c, x + 7, y + 3, 6, GOLD[2], GOLD[4]); star(c, x, y - 3, 8, GOLD[3], GOLD[4]); },
  endall: (c, x, y) => { px(c, x - 10, y + 2, 20, 7, GOLD[2]); px(c, x - 10, y - 4, 3, 7, GOLD[2]); px(c, x - 1, y - 7, 3, 10, GOLD[2]); px(c, x + 7, y - 4, 3, 7, GOLD[2]);
    star(c, x - 9, y - 6, 4, GOLD[4], '#ffffff'); star(c, x, y - 9, 4, GOLD[4], '#ffffff'); star(c, x + 8, y - 6, 4, GOLD[4], '#ffffff'); },
  allach: (c, x, y) => { px(c, x - 11, y + 1, 22, 8, GOLD[2]); px(c, x - 11, y + 1, 22, 2, GOLD[3]);
    px(c, x - 11, y - 6, 4, 8, GOLD[2]); px(c, x - 2, y - 10, 4, 12, GOLD[2]); px(c, x + 7, y - 6, 4, 8, GOLD[2]);
    pcircle(c, x - 9, y - 7, 2, '#ef5330'); pcircle(c, x, y - 11, 2, '#4fc3f7'); pcircle(c, x + 9, y - 7, 2, '#66bb6a');
    for (let i = 0; i < 5; i++) dot(c, x - 8 + i * 4, y + 4, GOLD[4]); },

  /* --- odds and ends --- */
  night: (c, x, y) => { pcircle(c, x, y, 9, '#e9eeff'); pcircle(c, x + 4, y - 3, 8, '#1a2050'); star(c, x + 8, y + 5, 3, '#ffffff', '#ffffff'); star(c, x - 8, y - 7, 2, '#ffffff', '#ffffff'); },
  seasons: (c, x, y) => { for (let q = 0; q < 4; q++) { const cols = ['#6fbc45', '#3d842b', '#e8992c', '#dfeaf5'];
      for (let a = 0; a < 14; a++) { const A = (q * 90 + a * 6.4) * Math.PI / 180; for (let r = 0; r < 9; r++) dot(c, x + Math.cos(A) * r, y + Math.sin(A) * r, cols[q]); } }
    pcircle(c, x, y, 2, GOLD[3]); },
  poke: (c, x, y) => { pcircle(c, x - 2, y + 2, 5, '#a9713f'); pcircle(c, x - 3, y - 3, 4, '#a9713f'); px(c, x - 5, y - 7, 2, 3, '#a9713f');
    px(c, x + 5, y - 6, 2, 6, '#ef5330'); px(c, x + 5, y + 2, 2, 2, '#ef5330'); px(c, x + 8, y - 8, 2, 4, '#ef5330'); },
  mute: (c, x, y) => { px(c, x - 8, y - 3, 4, 7, STONE[3]); for (let i = 0; i < 6; i++) px(c, x - 4, y - 6 + i, i < 3 ? 3 + i : 9 - i, 2, STONE[3]);
    for (let i = 0; i < 7; i++) { dot(c, x + 3 + i, y - 4 + i, '#ef5330'); dot(c, x + 3 + i, y + 2 - i, '#ef5330'); } },
  idle: (c, x, y) => { px(c, x - 10, y - 1, 20, 3, '#8a6141'); px(c, x - 10, y + 3, 20, 2, '#6b4a30');
    px(c, x - 8, y + 5, 2, 4, '#5a3a20'); px(c, x + 6, y + 5, 2, 4, '#5a3a20');
    for (let i = 0; i < 5; i++) px(c, x - 9 + i * 5, y - 4, 2, 3, JADE[2]); },
  /* --- the park --- */
  build1: (c, x, y) => { px(c, x - 1, y - 9, 3, 13, '#8a5f38'); px(c, x - 4, y - 11, 9, 3, '#8a5f38');
    px(c, x - 5, y + 4, 11, 6, STONE[3]); px(c, x - 5, y + 4, 11, 2, STONE[4]); },
  build5: (c, x, y) => { px(c, x - 10, y + 7, 20, 3, '#6b4a2a');
    for (let i = 0; i < 5; i++) { const h = 6 + (i % 3) * 3; px(c, x - 9 + i * 4, y + 7 - h, 1, h, JADE[1]); pcircle(c, x - 9 + i * 4, y + 6 - h, 2.5, JADE[3]); } },
  build10: (c, x, y) => { px(c, x - 11, y + 6, 22, 4, JADE[1]);
    for (let i = 0; i < 4; i++) { pcircle(c, x - 8 + i * 5, y - 1, 3.5, JADE[3]); px(c, x - 8 + i * 5, y + 1, 1, 5, '#6b4a2a'); }
    pcircle(c, x + 8, y - 6, 2, GOLD[3]); },
  buildall: (c, x, y) => { px(c, x - 11, y + 7, 22, 3, '#6b4a2a');
    pcircle(c, x - 7, y + 1, 4, JADE[3]); px(c, x - 1, y + 2, 5, 5, '#a0703c'); pcircle(c, x + 8, y, 3, '#7ec8f2');
    px(c, x - 8, y - 6, 3, 4, GOLD[3]); px(c, x + 3, y - 7, 3, 4, '#ef5330'); },
  expand1: (c, x, y) => { px(c, x - 10, y - 8, 3, 18, '#7a5230'); px(c, x + 7, y - 8, 3, 18, '#7a5230');
    for (let i = 0; i < 4; i++) px(c, x - 7, y - 6 + i * 4, 14, 2, '#a0703c');
    px(c, x - 12, y - 11, 25, 3, '#5a3a1e'); },
  expand3: (c, x, y) => { px(c, x - 12, y + 8, 25, 3, JADE[1]);
    px(c, x - 12, y - 6, 3, 14, '#7a5230'); px(c, x + 9, y - 6, 3, 14, '#7a5230');
    for (let i = 0; i < 3; i++) pcircle(c, x - 6 + i * 6, y, 4, JADE[2]);
    star(c, x, y - 10, 4, GOLD[3], '#ffffff'); },
  income1: (c, x, y) => { pcircle(c, x, y, 8, GOLD[1]); pcircle(c, x, y, 7, GOLD[3]);
    drawLeafSprite(c, x - 4, y - 4, JADE[3], JADE[1]); pcircle(c, x + 6, y + 5, 3, GOLD[2]); },
  earned500: (c, x, y) => { for (let i = 0; i < 3; i++) { pcircle(c, x - 5 + i * 5, y + 5 - i, 5, GOLD[1]); pcircle(c, x - 5 + i * 5, y + 4 - i, 4, GOLD[3]); }
    drawLeafSprite(c, x - 2, y - 8, JADE[3], JADE[1]); },
  upgrades: (c, x, y) => { px(c, x - 8, y - 8, 17, 17, '#8a5f38'); px(c, x - 6, y - 6, 13, 13, '#f6ecd6');
    for (let i = 0; i < 3; i++) px(c, x - 4, y - 3 + i * 4, 9, 1, '#5a4028');
    px(c, x + 4, y - 10, 3, 6, GOLD[3]); pcircle(c, x + 5, y - 11, 2, GOLD[4]); },
  visitor: (c, x, y) => { px(c, x - 3, y - 3, 7, 9, '#4a6a9a'); pcircle(c, x, y - 6, 3.5, '#e8b98a');
    px(c, x - 4, y - 10, 8, 3, '#3a2a1a'); px(c, x - 9, y + 6, 19, 3, '#a0703c');
    dot(c, x - 1, y - 6, '#2a1a10'); dot(c, x + 2, y - 6, '#2a1a10'); },
  house: (c, x, y) => { px(c, x - 8, y - 3, 17, 12, '#e0d2b8');
    for (let i = 0; i <= 7; i++) px(c, x - 9 + i, y - 4 - i, 19 - i * 2, 1, '#a8503a');
    px(c, x - 2, y + 2, 5, 7, '#7a4a28'); px(c, x - 7, y - 1, 4, 4, '#ffd98a'); px(c, x + 4, y - 1, 4, 4, '#ffd98a');
    px(c, x + 5, y - 14, 3, 5, '#8a6a5a'); },

  /* --- conversation --- */
  reply1: (c, x, y) => { pellipse(c, x - 2, y - 3, 10, 7, GOLD[4]); px(c, x - 8, y + 3, 5, 5, GOLD[4]);
    for (let i = -4; i <= 4; i += 4) px(c, x - 2 + i, y - 4, 2, 2, GOLD[0]); },
  reply25: (c, x, y) => { pellipse(c, x + 3, y - 5, 9, 6, STONE[4]); px(c, x + 8, y + 1, 4, 4, STONE[4]);
    pellipse(c, x - 4, y + 4, 9, 6, GOLD[3]); px(c, x - 9, y + 9, 4, 4, GOLD[3]);
    for (let i = -3; i <= 3; i += 3) { dot(c, x + 3 + i, y - 5, STONE[0]); dot(c, x - 4 + i, y + 4, GOLD[0]); } },
  kind10: (c, x, y) => { px(c, x - 7, y - 4, 5, 5, '#ff5b78'); px(c, x + 2, y - 4, 5, 5, '#ff5b78');
    px(c, x - 7, y, 14, 4, '#ff5b78'); px(c, x - 5, y + 4, 10, 3, '#ff5b78'); px(c, x - 2, y + 7, 4, 3, '#ff5b78');
    pellipse(c, x - 3, y - 2, 3, 2, '#ffa8b8'); },
  rude10: (c, x, y) => { pellipse(c, x, y - 2, 10, 7, '#d64545'); px(c, x - 6, y + 4, 5, 5, '#d64545');
    px(c, x - 2, y - 6, 3, 6, GOLD[4]); px(c, x - 2, y + 1, 3, 3, GOLD[4]); },
  joke10: (c, x, y) => { pcircle(c, x, y, 9, GOLD[3]); pcircle(c, x, y, 8, GOLD[4]);
    px(c, x - 5, y - 3, 3, 3, '#3a2a10'); px(c, x + 3, y - 3, 3, 3, '#3a2a10');
    for (let i = -5; i <= 5; i++) px(c, x + i, y + 3 + Math.round(Math.cos(i / 5 * 1.57) * 3) - 3, 1, 2, '#3a2a10'); },
  curious10: (c, x, y) => { for (let i = 0; i < 9; i++) { const A = -1.9 + i * 0.42; px(c, x + Math.cos(A) * 6, y - 5 + Math.sin(A) * 5, 3, 3, GOLD[3]); }
    px(c, x, y + 1, 3, 4, GOLD[3]); px(c, x, y + 7, 3, 3, GOLD[4]); },

  critter: (c, x, y) => { pellipse(c, x - 1, y + 2, 6, 4, '#8a4a3a'); pcircle(c, x + 4, y - 2, 3.5, '#8a4a3a');
    px(c, x + 7, y - 2, 3, 1, '#e8a33a'); dot(c, x + 5, y - 3, '#120a04');
    px(c, x - 8, y + 2, 5, 2, '#5a2f24'); px(c, x - 3, y + 6, 1, 3, '#c8892a'); px(c, x, y + 6, 1, 3, '#c8892a');
    px(c, x - 10, y + 9, 20, 2, JADE[1]); },

  /* --- pop culture --- */
  pop1: (c, x, y) => { px(c, x - 10, y - 8, 20, 14, STONE[1]); px(c, x - 8, y - 6, 16, 10, '#6ba8d8');
    px(c, x - 8, y - 6, 16, 3, '#9fd0ee'); px(c, x - 2, y + 6, 4, 4, STONE[2]); px(c, x - 7, y + 9, 14, 2, STONE[3]);
    px(c, x - 9, y - 13, 2, 6, STONE[3]); px(c, x + 7, y - 13, 2, 6, STONE[3]); },
  pop20: (c, x, y) => { px(c, x - 10, y - 8, 20, 14, '#3a2f4a'); px(c, x - 8, y - 6, 16, 10, '#8a6bd8');
    for (let i = 0; i < 3; i++) star(c, x - 5 + i * 5, y - 1, 3, GOLD[3], '#ffffff');
    px(c, x - 7, y + 9, 14, 2, STONE[3]); px(c, x - 2, y + 6, 4, 4, STONE[2]); },
  popall: (c, x, y) => { pcircle(c, x, y, 10, '#2a2a34'); pcircle(c, x, y, 9, '#4a4a58');
    pcircle(c, x, y, 3, STONE[4]);
    for (let i = 0; i < 4; i++) { const A = i / 4 * 6.28 + 0.4; pcircle(c, x + Math.cos(A) * 5.5, y + Math.sin(A) * 5.5, 2.6, '#1e1e26'); }
    px(c, x + 8, y - 2, 8, 4, '#4a4a58'); px(c, x + 8, y - 2, 8, 1, STONE[3]); },

  /* --- hands on --- */
  eyepoke: (c, x, y) => { pellipse(c, x, y, 11, 7, '#f2e6cc'); pellipse(c, x, y, 10, 6, '#fbf3e2');
    pcircle(c, x, y, 4.5, '#7a4512'); pcircle(c, x, y, 3.6, '#c9862a'); pcircle(c, x, y, 2, '#160c04');
    dot(c, x - 2, y - 2, '#ffffff'); px(c, x - 12, y - 6, 24, 2, GOLD[1]);
    px(c, x + 4, y - 10, 2, 7, '#e8b98a'); px(c, x + 2, y - 12, 6, 3, '#d9a878'); },
  nosepoke: (c, x, y) => { pellipse(c, x - 2, y + 2, 8, 6, '#a07a4c'); pellipse(c, x - 4, y + 1, 5, 3, '#c9a06a');
    px(c, x - 5, y + 4, 2, 2, '#432c17'); px(c, x + 2, y + 4, 2, 2, '#432c17');
    px(c, x + 7, y - 6, 3, 8, '#e8b98a'); px(c, x + 5, y - 9, 7, 4, '#d9a878');
    for (let i = 0; i < 3; i++) px(c, x - 10 + i, y - 6 - i, 2, 1, GOLD[4]); },
  mouthbite: (c, x, y) => { pellipse(c, x, y + 1, 12, 8, '#2a1508');
    for (let i = -9; i <= 9; i += 3) { px(c, x + i, y - 6, 3, 5, '#e6d9bb'); px(c, x + i, y + 3, 3, 5, '#e6d9bb'); }
    px(c, x - 12, y - 9, 24, 3, '#a07a4c'); px(c, x - 12, y + 7, 24, 3, '#6f4f2e');
    px(c, x + 3, y - 3, 3, 7, '#e8b98a'); },
  tickle: (c, x, y) => { for (let i = 0; i < 16; i++) { const p = i / 16; px(c, x - 6 + i * 0.8, y + 8 - i, 2, 2, mix('#e8e2d0', GOLD[3], p)); }
    for (let i = 0; i < 5; i++) { px(c, x + 2 + i, y - 8 + i, 5 - i, 1, '#ffffff'); px(c, x - 2 - i, y - 8 + i, 5 - i, 1, '#ffffff'); }
    px(c, x - 8, y + 8, 16, 3, GOLD[1]); },
  shake: (c, x, y) => { px(c, x - 4, y - 6, 8, 15, '#a07a4c'); px(c, x - 4, y - 6, 3, 15, '#c9a06a');
    for (let i = 0; i < 3; i++) { px(c, x - 10 - i * 2, y - 4 + i * 3, 4, 1, GOLD[3]); px(c, x + 7 + i * 2, y - 4 + i * 3, 4, 1, GOLD[3]); }
    drawLeafSprite(c, x - 9, y + 4, JADE[3], JADE[1]); drawLeafSprite(c, x + 4, y + 6, JADE[2], JADE[0]); },
  knock: (c, x, y) => { px(c, x - 9, y - 8, 18, 17, '#8a6141'); px(c, x - 9, y - 8, 18, 2, '#a67a4e');
    px(c, x - 6, y - 5, 12, 11, '#6f4f2e'); pcircle(c, x + 4, y + 1, 2, GOLD[3]);
    px(c, x - 12, y - 6, 4, 7, '#e8b98a'); px(c, x - 14, y - 3, 4, 4, '#d9a878');
    for (let i = 0; i < 3; i++) px(c, x - 13 - i, y - 10 + i, 2, 1, GOLD[4]); },
  moon: (c, x, y) => { pcircle(c, x + 1, y, 9, '#e9eeff'); pcircle(c, x + 5, y - 3, 8, '#2a3a6a');
    pcircle(c, x - 2, y + 2, 2, '#c9d4e8'); pcircle(c, x - 1, y - 4, 1.5, '#c9d4e8');
    px(c, x - 10, y + 6, 4, 6, '#e8b98a'); px(c, x - 12, y + 9, 6, 3, '#d9a878');
    star(c, x + 10, y - 8, 3, '#ffffff', '#ffffff'); },

  refresh: (c, x, y) => { px(c, x - 6, y - 8, 12, 16, '#e8e2d0'); px(c, x - 6, y - 8, 12, 2, GOLD[2]);
    px(c, x + 2, y - 8, 3, 11, '#c9453b'); px(c, x + 2, y + 3, 1, 3, '#c9453b'); px(c, x + 4, y + 3, 1, 3, '#c9453b');
    for (let i = 0; i < 3; i++) px(c, x - 4, y - 3 + i * 3, 5, 1, '#8a8a8a'); }
};

function star(c, x, y, r, col, hi) {
  for (let i = -r; i <= r; i++) {
    const w = Math.max(1, Math.round((1 - Math.abs(i) / r) * r * 0.55));
    px(c, x - w, y + i, w * 2, 1, col);
    px(c, x + i, y - w, 1, w * 2, col);
  }
  pcircle(c, x, y, Math.max(1, r * 0.35), hi);
}

/* =========================================================================
   THE HALL OF TROPHIES
   A long marble gallery in the clouds. Scrolls left and right; every
   achievement gets a plinth, and you can pick trophies up and swap them.
   ========================================================================= */
const HALL = { gap: 58, rowFront: 156, rowBack: 110, pad: 46 };

function hallSlotPos(i) {
  const back = i % 2 === 0;
  return {
    x: HALL.pad + i * (HALL.gap / 2),
    y: back ? HALL.rowBack : HALL.rowFront,
    scale: back ? 0.72 : 1,
    back
  };
}
function hallWidth(n) { return HALL.pad * 2 + n * (HALL.gap / 2); }

function drawHall(c, g) {
  const sc = g.hall.scroll;

  // ceiling and sky
  for (let y = 0; y < H; y++) {
    const f = y / H;
    px(c, 0, y, W, 1, quant(mix(mix('#5c78bd', '#cfe2f5', Math.min(1, f * 1.6)), '#ffffff', f * 0.5), 8));
  }

  // a domed skylight throwing the whole hall into shafts
  const dcx = W / 2 - (sc * 0.12) % W;
  glow(c, dcx, -10, 90, '#ffffff', 0.8);
  for (let i = 0; i < 9; i++) {
    const a = -0.9 + i * 0.22;
    c.globalAlpha = 0.10 + 0.04 * Math.sin(g.t * 0.6 + i);
    for (let r = 10; r < 220; r += 2) {
      const w = 2 + r * 0.05;
      px(c, dcx + Math.sin(a) * r, -6 + Math.cos(a) * r, w, 3, '#ffffff');
    }
    c.globalAlpha = 1;
  }

  // vaulted arches
  for (let i = -1; i < 8; i++) {
    const x = i * 96 - (sc * 0.25) % 96;
    for (let a = 0; a <= 46; a++) {
      const A = (a / 46) * Math.PI;
      const ax = x + 48 - Math.cos(A) * 48, ay = 34 - Math.sin(A) * 30;
      px(c, ax, ay, 3, 4, '#93a9c6');
      px(c, ax, ay, 3, 1, '#e2eefa');
    }
  }
  px(c, 0, 0, W, 7, '#8298b8'); px(c, 0, 7, W, 3, '#cadaee'); px(c, 0, 10, W, 1, '#7286a6');

  // chandeliers hanging between the arches
  for (let i = -1; i < 6; i++) {
    const x = i * 96 - (sc * 0.25) % 96 + 48;
    px(c, x, 10, 1, 14, '#8298b8');
    pellipse(c, x, 26, 9, 3, '#c8a44a');
    px(c, x - 9, 26, 19, 2, '#e8c96a');
    for (let j = -2; j <= 2; j++) {
      const fx = x + j * 4;
      px(c, fx - 1, 28, 2, 4, '#e8c96a');
      flame(c, fx, 27, 5, g.t * 2 + j + i);
      glow(c, fx, 25, 7, '#ffce6a', 0.5);
    }
  }

  // far light at the end of the hall
  c.globalAlpha = 0.5; glow(c, W / 2, 74, 66, '#ffffff', 0.7); c.globalAlpha = 1;

  // columns
  for (let i = -1; i < 10; i++) {
    const x = i * 108 - (sc * 0.55) % 108;
    px(c, x - 10, 22, 20, 5, '#eef5fb'); px(c, x - 10, 27, 20, 1, '#93a9c6');
    px(c, x - 7, 28, 14, 92, '#d2e0ee');
    for (let f = 0; f < 4; f++) px(c, x - 6 + f * 4, 28, 1, 92, '#b8cadd');
    px(c, x - 7, 28, 3, 92, '#f4fafd'); px(c, x + 4, 28, 3, 92, '#a2b8ce');
    px(c, x - 11, 118, 22, 6, '#eef5fb'); px(c, x - 11, 123, 22, 1, '#93a9c6');
  }

  // banners
  for (let i = -1; i < 10; i++) {
    const x = i * 108 - (sc * 0.55) % 108 + 54;
    const tier = ((i % 3) + 3) % 3;
    const col = tier === 0 ? '#a06bd8' : tier === 1 ? '#e0b23a' : '#6ba8d8';
    px(c, x - 8, 12, 16, 46, mix(col, '#000000', 0.2));
    px(c, x - 8, 12, 14, 46, mix(col, '#ffffff', 0.3));
    px(c, x - 8, 12, 3, 46, mix(col, '#ffffff', 0.62));
    px(c, x - 9, 11, 18, 3, GOLD[2]);
    for (let j = 0; j < 4; j++) px(c, x - 6 + j * 4, 58, 3, 3 + (j % 2) * 4, mix(col, '#ffffff', 0.3));
    star(c, x - 1, 32, 5, '#fff6d0', '#ffffff');
  }

  // floor
  px(c, 0, 120, W, H - 120, '#c6d6e6');
  px(c, 0, 132, W, H - 132, '#d8e5f0');
  px(c, 0, 150, W, H - 150, '#e8f0f8');
  for (let i = -2; i < 14; i++) {
    const x = i * 34 - (sc % 34);
    for (let y = 120; y < H; y++) {
      const spread = (y - 120) / (H - 120);
      px(c, x + (x - W / 2) * spread * 0.55, y, 1, 1, '#b3c6da');
    }
  }
  for (let y = 124; y < H; y += 8 + (y - 120) / 6) px(c, 0, y, W, 1, '#bccfe1');
  c.globalAlpha = 0.18; px(c, 0, 120, W, H - 120, '#ffffff'); c.globalAlpha = 1;

  // carpet
  for (let y = 122; y < H; y++) {
    const spread = (y - 120) / (H - 120);
    const hw = 18 + spread * 66;
    px(c, W / 2 - hw, y, hw * 2, 1, '#8a2f3a');
    px(c, W / 2 - hw, y, 3 + spread * 4, 1, '#6b2029');
    px(c, W / 2 + hw - (3 + spread * 4), y, 3 + spread * 4, 1, '#6b2029');
    if ((y % 9) === 0) px(c, W / 2 - hw + 4, y, hw * 2 - 8, 1, '#a03a46');
    if ((y % 18) === 0) px(c, W / 2 - hw + 8, y, hw * 2 - 16, 1, '#c8a44a');
  }

  const list = g.hall.order;
  // reflections first, then the plinths that cast them
  for (let i = 0; i < list.length; i++) {
    if (g.hall.dragIndex === i) continue;
    const p = hallSlotPos(i);
    const x = Math.round(p.x - sc);
    if (x < -50 || x > W + 50 || p.back) continue;
    if (g.hall.unlocked[list[i]]) drawTrophyReflection(c, g, list[i], x, p.y - Math.round(26 * p.scale), p.scale);
  }
  for (let i = 0; i < list.length; i++) {
    if (g.hall.dragIndex === i) continue;
    drawPlinth(c, g, i, list[i], sc);
  }

  // velvet rope across the front of the gallery
  for (let i = -1; i < 8; i++) {
    const x = i * 58 - (sc % 58) + 20;
    px(c, x - 2, 168, 5, 20, '#c8a44a'); px(c, x - 2, 168, 2, 20, '#e8c96a');
    pcircle(c, x, 166, 3, '#e8c96a'); pcircle(c, x - 1, 165, 2, '#fff0b8');
    for (let j = 0; j < 58; j++) {
      const t = j / 58;
      px(c, x + j, 172 + Math.sin(t * Math.PI) * 7, 1, 3, '#8a2f3a');
      px(c, x + j, 172 + Math.sin(t * Math.PI) * 7, 1, 1, '#b0455a');
    }
  }

  if (g.hall.dragIndex >= 0) {
    drawTrophy(c, g, list[g.hall.dragIndex], g.hall.dragX, g.hall.dragY, 1.2, true);
  }

  // haze at the edges so the hall feels endless
  for (let i = 0; i < 26; i++) {
    c.globalAlpha = (1 - i / 26) * 0.5;
    px(c, i, 0, 1, H, '#e9f2fb'); px(c, W - 1 - i, 0, 1, H, '#e9f2fb');
    c.globalAlpha = 1;
  }
}

function drawPlinth(c, g, i, id, scroll) {
  const p = hallSlotPos(i);
  const x = Math.round(p.x - scroll);
  if (x < -50 || x > W + 50) return;
  const unlocked = !!g.hall.unlocked[id];
  const tier = g.hall.tier[id] || 'task';
  const s = p.scale;
  const w = Math.round(15 * s), h = Math.round(26 * s);
  const top = p.y - h;
  const tierCol = tier === 'chal' ? '#a06bd8' : tier === 'goal' ? '#ffd24a' : '#8fd95a';

  // a spotlight from the ceiling, tinted to the trophy's tier
  if (unlocked) {
    for (let yy = 0; yy < top - 6; yy++) {
      const k = yy / Math.max(1, top - 6);
      const hw = 3 + k * 16 * s;
      c.globalAlpha = 0.05 + 0.05 * k;
      px(c, x - hw, yy + 6, hw * 2, 1, tierCol);
      c.globalAlpha = 1;
    }
  }

  c.globalAlpha = 0.22; pellipse(c, x, p.y + 3, w + 6, 4, '#5a7090'); c.globalAlpha = 1;

  // stepped marble plinth with a moulded cap
  px(c, x - w - 3, p.y - 4, (w + 3) * 2, 5, '#b6c8dc');
  px(c, x - w - 3, p.y - 4, (w + 3) * 2, 1, '#e8f0f8');
  px(c, x - w, top + 4, w * 2, h - 8, '#dde8f2');
  px(c, x - w, top + 4, 3, h - 8, '#f6fbff');
  px(c, x + w - 3, top + 4, 3, h - 8, '#adc0d6');
  for (let f = 1; f < 3; f++) px(c, x - w + f * Math.round(w * 0.66), top + 6, 1, h - 12, '#c2d2e4');
  px(c, x - w - 3, top, (w + 3) * 2, 5, '#e8f0f8');
  px(c, x - w - 3, top, (w + 3) * 2, 1, '#ffffff');
  px(c, x - w - 3, top + 4, (w + 3) * 2, 1, '#9fb4cc');

  // engraved plaque
  const pw = Math.round(19 * s), ph = Math.round(7 * s);
  px(c, x - pw, top + Math.round(11 * s), pw * 2, ph, '#8a9bb0');
  px(c, x - pw + 1, top + Math.round(11 * s) + 1, pw * 2 - 2, ph - 2, unlocked ? tierCol : '#67788c');
  px(c, x - pw + 1, top + Math.round(11 * s) + 1, pw * 2 - 2, 1, '#ffffff');
  if (unlocked) {
    for (let l = 0; l < 2; l++) {
      const lw = pw * (l === 0 ? 1.3 : 0.9);
      px(c, x - lw / 2, top + Math.round(13 * s) + l * 2, lw, 1, mix(tierCol, '#000000', 0.45));
    }
  } else px(c, x - 1, top + Math.round(12 * s), 2, ph - 3, '#3f4d5e');

  if (unlocked) {
    drawTrophy(c, g, id, x, top, s, false);
  } else {
    // a shrouded shape, waiting
    c.globalAlpha = 0.6;
    pellipse(c, x, top - Math.round(9 * s), Math.round(10 * s), Math.round(12 * s), '#aebfd0');
    pellipse(c, x - 2, top - Math.round(11 * s), Math.round(6 * s), Math.round(7 * s), '#c6d5e4');
    px(c, x - Math.round(10 * s), top - 3, Math.round(20 * s), 4, '#9db0c4');
    for (let f = 0; f < 4; f++) px(c, x - Math.round(8 * s) + f * Math.round(5 * s), top - Math.round(14 * s), 1, Math.round(11 * s), '#9db0c4');
    c.globalAlpha = 1;
  }
}

/* the little plinth-top base every sculpture is mounted on */
function trophyBase(c, x, y) {
  pellipse(c, x, y + 2, 12, 3, GOLD[0]);
  pellipse(c, x, y, 11, 3, GOLD[1]);
  px(c, x - 8, y - 3, 17, 3, GOLD[1]);
  px(c, x - 8, y - 3, 17, 1, GOLD[3]);
  pellipse(c, x, y - 4, 7, 2, GOLD[2]);
  for (let i = -6; i <= 6; i += 4) dot(c, x + i, y - 3, GOLD[4]);
}

/* rendered once per trophy, contour and all, then cached */
function trophySprite(id) {
  return outlinedSprite('tro:' + id, 64, 64, (tc, cx, cy) => {
    trophyBase(tc, cx, cy + 13);
    const art = TROPHY_ART[id];
    if (art) art(tc, cx, cy - 1);
    else { pcircle(tc, cx, cy - 2, 8, GOLD[2]); pcircle(tc, cx - 2, cy - 4, 4, GOLD[4]); }
  }, '#150f1a');
}

function drawTrophy(c, g, id, x, y, s, lifted) {
  const sprite = trophySprite(id);
  const sc = s * 1.28;
  const bob = lifted ? 0 : Math.sin(g.t * 1.6 + x * 0.1) * 0.5;
  const w = 64 * sc, h = 64 * sc;
  const dx = Math.round(x - w / 2), dy = Math.round(y - 46 * sc + bob);

  if (lifted) { c.globalAlpha = 0.25; pellipse(c, x, y + 18, 13, 4, '#5a7090'); c.globalAlpha = 1; }
  glow(c, x, y - 16 * sc, 20 * sc, '#fff3c0', lifted ? 0.75 : 0.4);
  c.imageSmoothingEnabled = false;
  c.drawImage(sprite, dx, dy, w, h);

  // a slow highlight travelling over the metal
  const ph = (g.t * 0.5 + x * 0.03) % 3;
  if (ph < 0.5) {
    const k = ph / 0.5;
    c.globalAlpha = 0.5 * Math.sin(k * Math.PI);
    for (let i = 0; i < 10; i++) px(c, dx + w * 0.15 + k * w * 0.7 + i, dy + h * 0.2 + i * 2.2, 2, 3, '#ffffff');
    c.globalAlpha = 1;
  }
  if (Math.sin(g.t * 1.3 + x) > 0.94) star(c, x + 9 * sc, y - 26 * sc, 3, '#ffffff', '#ffffff');
}

/* the same sprite, upside down and faded, on the polished floor */
function drawTrophyReflection(c, g, id, x, y, s) {
  const sprite = trophySprite(id);
  const sc = s * 1.28, w = 64 * sc, h = 64 * sc;
  c.save();
  c.globalAlpha = 0.16;
  c.translate(0, y * 2 + 4);
  c.scale(1, -1);
  c.imageSmoothingEnabled = false;
  c.drawImage(sprite, Math.round(x - w / 2), Math.round(y - 46 * sc), w, h);
  c.restore();
  c.globalAlpha = 1;
}

/* =========================================================================
   HEAVEN (the garden) + CINEMATIC PIECES
   ========================================================================= */
function drawHeavenBackdrop(c, g) {
  px(c, 0, 0, W, H, '#cfe8ff');
  px(c, 0, 60, W, H, '#e6f2ff');
  px(c, 0, 120, W, H, '#f7fbff');
  const rnd = mulberry(41);
  for (let i = 0; i < 26; i++) {
    const x = (rnd() * (W + 60) + g.t * (2 + rnd() * 6)) % (W + 60) - 30;
    const y = rnd() * H, r = 6 + rnd() * 12;
    pcircle(c, x, y, r, '#ffffff'); pcircle(c, x + 6, y + 2, r * 0.7, '#eaf4ff');
  }
  for (let i = 0; i < 7; i++) {
    const x = 20 + i * 34 + Math.sin(g.t * 0.4 + i) * 6;
    c.globalAlpha = 0.16; px(c, x, 0, 8, H, '#ffffff'); c.globalAlpha = 1;
  }
}

function drawHeaven(c, g) {
  drawHeavenBackdrop(c, g);
  const rnd = mulberry(41);
  drawGhostTree(c, g, CX, 104 + Math.sin(g.t * 1.1) * 3, 1);
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H);
    if (Math.sin(g.t * 3 + i) > 0.8) { dot(c, x, y, '#ffffff'); dot(c, x, y - 1, '#fffbe0'); }
  }
}

function drawGhostTree(c, g, gx, fy, alpha) {
  c.globalAlpha = alpha;
  const OUT = '#8fb8cf', LEAF_OUT = '#7fc0a4';
  pcircle(c, gx, fy + 16, 26, '#ffffff');
  pcircle(c, gx - 22, fy + 18, 16, '#ffffff');
  pcircle(c, gx + 22, fy + 18, 16, '#ffffff');
  pcircle(c, gx, fy + 20, 30, '#eef6ff');

  const wf = Math.sin(g.t * 3) * 3;
  const feather = (dir, f, col, inset) => {
    const a = -0.42 - f * 0.30, len = 30 - f * 4;
    for (let i = 0; i < len; i++) {
      const r = Math.max(1, (5 - i * 0.11) - inset);
      if (r <= 0) continue;
      pcircle(c, gx + dir * (13 + Math.cos(a) * i), fy - 14 + Math.sin(a) * i + f * 5 + wf, r, col);
    }
  };
  for (const dir of [-1, 1]) {
    for (let f = 0; f < 4; f++) feather(dir, f, '#a8c4dd', -1);
    for (let f = 0; f < 4; f++) feather(dir, f, '#ffffff', 0);
    for (let f = 0; f < 4; f++) feather(dir, f, '#eaf3ff', 2);
  }
  for (let y = fy + 16; y > fy - 30; y--) {
    const k = (fy + 16 - y) / 46, hw = Math.round(12 - k * 5);
    px(c, gx - hw - 1, y, hw * 2 + 2, 1, OUT);
    px(c, gx - hw, y, hw * 2, 1, '#d6e8f2');
    px(c, gx - hw, y, 2, 1, '#b6cfdd');
    px(c, gx + hw - 2, y, 2, 1, '#eef8ff');
  }
  for (const dir of [-1, 1]) for (let i = 0; i < 8; i++) {
    const h = Math.max(1, 5 - i * 0.6);
    px(c, gx + dir * (11 + i) - (dir < 0 ? 2 : 0), fy + 17 - h, 2, h, '#c2dae8');
  }
  const cy = fy - 50;
  const blobs = CANOPY.filter(b => b.s < 0.58 && Math.abs(b.x - CX) < 44);
  const map = bl => [gx + (bl.x - CX) * 0.58, cy + (bl.y - 52) * 0.55];
  for (const bl of blobs) { const [bx, by] = map(bl); pcircle(c, bx, by, bl.r * 0.6 + 1, LEAF_OUT); }
  for (const bl of blobs) { const [bx, by] = map(bl); pcircle(c, bx, by, bl.r * 0.6, '#a8ddc0'); }
  for (const bl of blobs) { const [bx, by] = map(bl); pcircle(c, bx - 1, by - 2, Math.max(2, bl.r * 0.6 - 4), '#d2f2e0'); }

  const ey = fy - 10;
  for (const ex of [-6, 6]) {
    px(c, gx + ex - 4, ey, 9, 2, '#3a5a6a');
    px(c, gx + ex - 4, ey - 2, 3, 2, '#3a5a6a'); px(c, gx + ex + 2, ey - 2, 3, 2, '#3a5a6a');
  }
  px(c, gx - 5, ey + 8, 11, 2, '#3a5a6a');
  px(c, gx - 7, ey + 6, 2, 2, '#3a5a6a'); px(c, gx + 6, ey + 6, 2, 2, '#3a5a6a');
  dot(c, gx - 12, ey + 5, '#ffb3c0'); dot(c, gx + 12, ey + 5, '#ffb3c0');

  const hy = cy - 26 + Math.sin(g.t * 1.6) * 2;
  for (let a = 0; a < 40; a++) {
    const A = a / 40 * Math.PI * 2;
    px(c, gx + Math.cos(A) * 18 - 1, hy + Math.sin(A) * 6, 2, 2, '#ffd24a');
    dot(c, gx + Math.cos(A) * 17, hy + Math.sin(A) * 5.2, '#fff3b0');
  }
  c.globalAlpha = 1;
}

/* a rising soul: bright core, comet trail, little orbiting motes */
/* =========================================================================
   THE SNAIL GARDEN
   Heaven keeps them. Every snail that ever brought you anything is here, on
   its own lily pad, at the size the post deserved, still going nowhere.
   ========================================================================= */
const GARDEN = { pad: 54, gap: 60, rowFront: 152, rowBack: 116 };

function gardenSlotPos(i) {
  const back = i % 2 === 0;
  return {
    x: GARDEN.pad + i * (GARDEN.gap / 2),
    y: back ? GARDEN.rowBack : GARDEN.rowFront,
    depth: back ? 0.78 : 1,
    back
  };
}
function gardenWidth(n) { return GARDEN.pad * 2 + n * (GARDEN.gap / 2); }

/* a lily pad on still water */
function drawLilyPad(c, g, x, y, r, i) {
  const wob = Math.sin(g.t * 0.8 + i) * 0.8;
  c.globalAlpha = 0.30;
  pellipse(c, x, y + 4, r * 1.25, r * 0.42, '#5a8aa8');
  c.globalAlpha = 1;
  pellipse(c, x + wob, y, r, r * 0.36, '#1d6b52');
  pellipse(c, x + wob, y - 1, r * 0.92, r * 0.30, '#2f9670');
  pellipse(c, x + wob - r * 0.2, y - 2, r * 0.5, r * 0.16, '#5cc79a');
  // the notch every lily pad has
  px(c, x + wob + r * 0.55, y - 1, r * 0.5, 3, '#1a3a52');
  for (let k = 0; k < 5; k++) {
    const a = -0.5 + k * 0.55;
    px(c, x + wob + Math.cos(a) * r * 0.6, y - 1 + Math.sin(a) * r * 0.2, 1, 1, '#12463a');
  }
}

function drawGarden(c, g) {
  const scroll = g.garden.scroll;
  const list = g.garden.list;

  // a still, bright pool under a white sky
  px(c, 0, 0, W, H, '#dceeff');
  px(c, 0, 48, W, H, '#eef6ff');
  const rnd = mulberry(41);
  for (let i = 0; i < 18; i++) {
    const x = (rnd() * (W + 60) + g.t * (1 + rnd() * 3)) % (W + 60) - 30;
    const y = rnd() * 70, r = 7 + rnd() * 13;
    pcircle(c, x, y, r, '#ffffff'); pcircle(c, x + 6, y + 2, r * 0.7, '#f2f8ff');
  }
  // the water, in bands, with the sky sitting on it
  px(c, 0, 96, W, H, '#bfe0f2');
  px(c, 0, 128, W, H, '#a8d2ea');
  px(c, 0, 164, W, H, '#94c2de');
  for (let y = 96; y < H; y += 4) {
    const ph = Math.sin(g.t * 0.7 + y * 0.2);
    c.globalAlpha = 0.35;
    px(c, (ph * 12 + y * 3) % W - 20, y, 22, 1, '#ffffff');
    px(c, (ph * -9 + y * 7 + 120) % W - 20, y + 2, 14, 1, '#eaf6ff');
    c.globalAlpha = 1;
  }
  // reeds along the back, with blades
  for (let i = 0; i < 22; i++) {
    const x = (i * 43 + 11) % W;
    const h = 12 + (i % 5) * 6;
    const sway = Math.sin(g.t * 0.9 + i) * 1.6;
    for (let k = 0; k < h; k++) px(c, x + sway * (k / h), 97 - k, 1, 1, k > h - 5 ? '#5cc79a' : '#2f9670');
    // two blades per reed, growing out of the stem and arching over
    for (const side of [-1, 1]) {
      const base = 4 + (i % 3) * 4;
      const bx = x + sway * (base / h);
      for (let b = 0; b <= 7; b++) {
        const lift = b * 1.1 - b * b * 0.20;      // up, then over
        px(c, Math.round(bx + side * b), Math.round(97 - base - lift), 1, 1, b > 5 ? '#5cc79a' : '#2f9670');
      }
    }
    if (i % 4 === 0) {
      // a seed head
      px(c, x + sway - 1, 97 - h - 4, 3, 5, '#8a6a3a');
      px(c, x + sway, 97 - h - 5, 1, 1, '#c9a86a');
    }
  }
  F.drawTextCentered(c, W / 2, 12, 'THE SNAIL GARDEN', '#3a6a88', 1, '#ffffff');
  F.drawTextCentered(c, W / 2, 22, list.length + (list.length === 1 ? ' delivery' : ' deliveries') + ' \u00b7 every one of them kept',
                     '#6a9ab4', 1, '#ffffff');

  if (!list.length) {
    F.drawTextCentered(c, W / 2, 88, 'NO POST HAS EVER REACHED YOU', '#5a7a94', 1);
    F.drawTextCentered(c, W / 2, 100, 'go back and earn something', '#7a9ab4', 1);
    return;
  }

  // pads and their tenants, back row first
  const draw = [];
  for (let i = 0; i < list.length; i++) {
    const p = gardenSlotPos(i);
    draw.push({ i, p, sx: p.x - scroll });
  }
  draw.sort((a, b) => (a.p.back === b.p.back ? 0 : a.p.back ? -1 : 1));

  for (const d of draw) {
    if (d.sx < -60 || d.sx > W + 60) continue;
    const rec = list[d.i];
    const skin = snailSkin(rec.id, rec.kind);
    const k = skin.scale * d.p.depth;
    const hot = g.garden.hover === d.i;
    drawLilyPad(c, g, d.sx, d.p.y + 6, 15 * Math.max(0.9, k), d.i);
    if (hot) glow(c, d.sx, d.p.y - 4, 22 * k, '#ffffff', 0.55);
    // it still crawls, it just never gets anywhere
    const crawl = Math.sin(g.t * 0.5 + d.i * 1.7) * 4;
    drawSnail(c, g, {
      x: d.sx + crawl, y: d.p.y, dir: crawl > 0 ? 1 : -1,
      skin, scale: k, noTrail: true, opened: true, kind: rec.kind,
      note: null
    });
    if (hot) {
      const nm = rec.snailName || '';
      F.drawTextCentered(c, d.sx, d.p.y - 30 * k - 10, nm, '#2a4a62', 1, '#ffffff');
    }
  }
}

function drawSoul(c, g, x, y, scale) {
  for (let i = 14; i > 0; i--) {
    const p = i / 14;
    const wx = x + Math.sin(g.t * 3 + i * 0.7) * 6 * p * scale;
    c.globalAlpha = (1 - p) * 0.55;
    pcircle(c, wx, y + i * 5 * scale, Math.max(0.5, (4 - p * 3.4) * scale), '#bfe4ff');
    c.globalAlpha = 1;
  }
  glow(c, x, y, 26 * scale, '#9fd8ff', 0.5);
  glow(c, x, y, 14 * scale, '#e8f6ff', 0.75);
  pcircle(c, x, y, 6 * scale, '#ffffff');
  pcircle(c, x, y, 4 * scale, '#ffffff');
  for (let i = 0; i < 6; i++) {
    const a = g.t * 2.2 + i * 1.05;
    const r = (11 + Math.sin(g.t * 1.7 + i) * 4) * scale;
    pcircle(c, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6, 1.4 * scale, '#eaf7ff');
  }
  // a faint suggestion of a face in the light
  c.globalAlpha = 0.35;
  px(c, x - 4 * scale, y - 2 * scale, 2 * scale, 2 * scale, '#7fb4d8');
  px(c, x + 2 * scale, y - 2 * scale, 2 * scale, 2 * scale, '#7fb4d8');
  px(c, x - 3 * scale, y + 3 * scale, 6 * scale, 1 * scale, '#7fb4d8');
  c.globalAlpha = 1;
}

/* clouds rushing past, for going up or coming back down */
function drawCloudTunnel(c, g, p, dir) {
  const rnd = mulberry(88);
  for (let i = 0; i < 40; i++) {
    const speed = 40 + rnd() * 200;
    const y = ((rnd() * H + dir * (g.t * speed)) % (H + 60)) - 30;
    const x = rnd() * W;
    const r = 5 + rnd() * 18;
    c.globalAlpha = 0.45 + rnd() * 0.5;
    pcircle(c, x, y, r, '#f4faff');
    pcircle(c, x - 2, y - 2, r * 0.8, '#ffffff');
    pcircle(c, x + r * 0.4, y + r * 0.35, r * 0.45, '#dceaf8');
    c.globalAlpha = 1;
  }
  // speed streaks
  for (let i = 0; i < 26; i++) {
    const x = rnd() * W, len = 12 + rnd() * 40;
    const y = ((rnd() * H + dir * g.t * 300) % (H + 60)) - 30;
    c.globalAlpha = 0.45;
    px(c, x, y, 1, len, '#ffffff');
    px(c, x + 1, y + len * 0.2, 1, len * 0.6, '#dceaf8');
    c.globalAlpha = 1;
  }
}

function drawLetterbox(c, amount) {
  const h = Math.round(26 * amount);
  if (h <= 0) return;
  px(c, 0, 0, W, h, '#000000');
  px(c, 0, H - h, W, h, '#000000');
}

function drawRays(c, g, amount, cx, cy) {
  if (amount <= 0) return;
  const N = 11, reach = 150;
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2 + g.t * 0.22;
    const len = reach * (0.55 + 0.45 * Math.abs(Math.sin(g.t * 1.2 + i)));
    for (let r = 6; r < len; r++) {
      const w = Math.max(1, Math.round(r * 0.13));
      c.globalAlpha = amount * 0.30 * Math.pow(1 - r / len, 1.6);
      px(c, cx + Math.cos(a) * r - w / 2, cy + Math.sin(a) * r - w / 2, w, w, '#ffffff');
    }
  }
  c.globalAlpha = 1;
  glow(c, cx, cy, 26, '#ffffff', amount * 0.7);
}

/* The reincarnation growth shot. Scaling the real tree about its own base
   means the sapling and the finished oak are the same drawing, so the
   sequence hands off to normal play without a visible pop. */
function drawGrowingTree(c, g, p) {
  const k = 0.10 + 0.90 * Math.pow(Math.min(1, p), 0.75);
  c.save();
  c.translate(CX, GROUND_Y + 4);
  c.scale(k, k);
  c.translate(-CX, -(GROUND_Y + 4));
  drawTree(c, g);
  c.restore();

  // earth breaking, and light coming off the new growth
  const rnd = mulberry(Math.floor(g.t * 4));
  if (p < 0.5) for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 30 * (1 - p * 2);
    px(c, CX + Math.cos(a) * d, GROUND_Y + 4 + Math.sin(a) * d * 0.4, 2, 2, '#6b4a2a');
  }
  for (let i = 0; i < 12; i++) {
    const a = rnd() * Math.PI * 2, r = 20 + rnd() * 50 * k;
    c.globalAlpha = 0.5 + rnd() * 0.5;
    dot(c, CX + Math.cos(a) * r, GROUND_Y - 20 * k + Math.sin(a) * r * 0.6, '#d8f8a0');
    c.globalAlpha = 1;
  }
  glow(c, CX, GROUND_Y - 30 * k, 40 * k, '#c8f090', 0.35 * (1 - p * 0.6));
}


/* =========================================================================
   SLEEP, NEIGHBOURS, AND THE ROAD OUT OF HERE
   ========================================================================= */

/* he snores in three sizes */
function drawZzz(c, g, x, y, sc) {
  sc = sc || 1;
  for (let i = 0; i < 3; i++) {
    const t = (g.t * 0.5 + i * 0.34) % 1;
    const sz = Math.round((3 + i * 1.4) * sc);
    const zx = Math.round(x + i * 9 * sc + Math.sin(g.t * 1.1 + i) * 2);
    const zy = Math.round(y - t * 30 * sc);
    const a = Math.max(0, Math.sin(t * Math.PI));
    const w = Math.max(1, Math.round(sc));
    const col = '#e8f0ff';
    c.globalAlpha = a * 0.35;
    px(c, zx - 1, zy - 1, sz + 2, sz + 2, '#0d1420');
    c.globalAlpha = a * 0.95;
    px(c, zx, zy, sz, w, col);
    for (let k = 0; k < sz; k++) px(c, zx + sz - w - k * (sz - w) / Math.max(1, sz - 1), zy + k, w, 1, col);
    px(c, zx, zy + sz - w, sz, w, col);
    c.globalAlpha = 1;
  }
}

/* -------------------------------------------------------------------------
   NOC — lamp-keeper. Long coat, wide hat, one lantern, no shop.
   ------------------------------------------------------------------------- */
function drawNoc(c, g, n) {
  const dk = darkness(g.timeOfDay);
  const sh = col => mix(col, '#0a1226', dk * 0.7);
  const x = Math.round(n.x), y = Math.round(n.y);
  const breathe = Math.sin(g.t * 1.4) * 0.6;
  const yy = Math.round(y + breathe);
  const coat = sh('#3c4a63'), coatLo = sh('#28334a'), coatHi = sh('#55668a');
  const skin = sh('#d8b089'), hat = sh('#2c3242');

  // shadow
  c.globalAlpha = 0.3; pellipse(c, x, y + 1, 10, 3, '#0d1a08'); c.globalAlpha = 1;

  // coat, wide at the hem
  for (let i = 0; i < 22; i++) {
    const w = 6 + i * 0.5;
    px(c, x - w / 2, yy - 22 + i, w, 1, i > 16 ? coatLo : coat);
  }
  px(c, x - 5, yy - 20, 3, 18, coatHi);            // lamp-lit edge
  px(c, x - 1, yy - 18, 2, 14, coatLo);            // buttoned seam
  for (let i = 0; i < 4; i++) dot(c, x, yy - 17 + i * 4, sh('#c9a659'));

  // scarf
  px(c, x - 4, yy - 24, 9, 3, sh('#8a4a4a'));
  px(c, x + 3, yy - 22, 2, 6 + Math.sin(g.t * 2) * 1, sh('#7a3f3f'));

  // head under a wide flat hat
  pcircle(c, x, yy - 28, 4.6, skin);
  px(c, x - 4, yy - 30, 8, 2, sh('#c39a72'));
  px(c, x - 8, yy - 32, 17, 2, hat);               // brim
  px(c, x - 5, yy - 36, 11, 4, hat);               // crown
  px(c, x - 5, yy - 36, 11, 1, sh('#3f4759'));
  px(c, x - 5, yy - 33, 11, 1, sh('#1c2130'));

  // eyes: two calm lights under the brim
  const blink = Math.sin(g.t * 0.9 + 1.7) > 0.985 ? 0 : 1;
  if (blink) {
    dot(c, x - 3 + n.look, yy - 28, '#f6f2df'); dot(c, x + 2 + n.look, yy - 28, '#f6f2df');
    dot(c, x - 3 + n.look, yy - 28, n.talking ? '#ffe9a0' : '#f6f2df');
  } else {
    px(c, x - 3, yy - 28, 2, 1, sh('#8a6a4a')); px(c, x + 2, yy - 28, 2, 1, sh('#8a6a4a'));
  }
  px(c, x - 2, yy - 26, 4, 1, sh('#a8785a'));      // a mouth that mostly listens

  // the lantern he keeps, always lit
  const lx = x + 10, ly = yy - 16 + Math.sin(g.t * 1.1) * 0.8;
  px(c, x + 4, yy - 20, 6, 1, coatLo);             // the arm
  px(c, lx - 1, ly - 8, 2, 5, sh('#3a3a44'));      // hanger
  px(c, lx - 4, ly - 3, 9, 2, sh('#4a4a56'));
  px(c, lx - 3, ly - 1, 7, 8, sh('#5a5a66'));
  px(c, lx - 2, ly, 5, 6, '#2a2418');
  glow(c, lx, ly + 3, (7 + dk * 7) + Math.sin(g.t * 3) * 1.2, '#ffcf6a', 0.22 + dk * 0.5);
  pcircle(c, lx, ly + 3, 2.2, '#ffe9a0');
  pcircle(c, lx, ly + 3, 1.2, '#fffceb');
  px(c, lx - 4, ly + 6, 9, 2, sh('#4a4a56'));

  // the lantern throws light back on him
  c.globalAlpha = 0.12 + dk * 0.3;
  pellipse(c, x + 4, yy - 20, 5, 10, '#ffcf6a');
  c.globalAlpha = 1;

  // moths, because of course
  for (let i = 0; i < 3; i++) {
    const a = g.t * (1.1 + i * 0.4) + i * 2.1;
    const mx2 = lx + Math.cos(a) * (7 + i * 3), my2 = ly + 3 + Math.sin(a * 1.3) * (5 + i * 2);
    const flap = Math.sin(g.t * 18 + i) > 0 ? 1 : 2;
    px(c, mx2, my2, 2, 1, sh('#e0d8c0'));
    px(c, mx2 - 1, my2 - flap + 1, 1, flap, sh('#cfc6ac'));
    px(c, mx2 + 2, my2 - flap + 1, 1, flap, sh('#cfc6ac'));
  }
}

/* Noc's camp: a stool, a kettle on a ring, a crate of nothing for sale */
function drawNocCamp(c, g, x, y) {
  const dk = darkness(g.timeOfDay);
  const sh = col => mix(col, '#0a1226', dk * 0.72);
  // stool
  px(c, x - 7, y - 8, 14, 3, sh('#7a5630'));
  px(c, x - 7, y - 8, 14, 1, sh('#a3794a'));
  px(c, x - 6, y - 5, 2, 5, sh('#5a3f22')); px(c, x + 4, y - 5, 2, 5, sh('#5a3f22'));
  // fire ring and kettle
  const fx = x + 22;
  for (let i = 0; i < 7; i++) pcircle(c, fx - 8 + i * 2.6, y - 1, 1.6, sh('#6a6a72'));
  const flick = Math.sin(g.t * 9) * 0.6;
  glow(c, fx, y - 5, 9, '#ff9a3a', 0.4);
  flame(c, fx, y - 3, 5 + flick, 3);
  px(c, fx - 4, y - 11, 8, 6, sh('#4a4a52'));
  px(c, fx - 4, y - 11, 8, 1, sh('#6a6a74'));
  px(c, fx + 4, y - 10, 3, 2, sh('#4a4a52'));
  px(c, fx - 1, y - 13, 2, 2, sh('#3a3a42'));
  // steam
  for (let i = 0; i < 3; i++) {
    const t = (g.t * 0.6 + i * 0.33) % 1;
    c.globalAlpha = (1 - t) * 0.5;
    pcircle(c, fx - 1 + Math.sin(t * 6 + i) * 2, y - 15 - t * 12, 1 + t * 2, '#e8eef4');
    c.globalAlpha = 1;
  }
  // the crate he no longer sells out of, lid nailed shut
  px(c, x - 30, y - 9, 16, 9, sh('#6b4a2a'));
  px(c, x - 30, y - 9, 16, 2, sh('#8a6338'));
  px(c, x - 30, y - 3, 16, 1, sh('#4a3220'));
  for (let i = 0; i < 3; i++) dot(c, x - 28 + i * 6, y - 8, sh('#c9c9c9'));
  tinyText(c, x - 29, y - 7, 'SHUT', sh('#e8dcc0'));
}

/* -------------------------------------------------------------------------
   WAYS OUT — a signpost arrow at each edge you can actually leave through
   ------------------------------------------------------------------------- */
function drawTravelArrow(c, g, side, label, hover, locked) {
  const dk = darkness(g.timeOfDay);
  const y = Math.round(GROUND_Y - 26);
  const w = Math.max(46, F.textWidth(label, 1) + 22);
  const x = side < 0 ? 6 : W - 6 - w;
  const bob = Math.sin(g.t * 2.2 + (side < 0 ? 0 : 1.6)) * (hover ? 1.6 : 0.8);
  const yy = Math.round(y + bob);

  // post
  px(c, side < 0 ? x + 8 : x + w - 10, yy + 13, 2, 22, mix('#5a3a1e', '#0a1226', dk * 0.7));

  // the board, cut to a point at the travelling end
  const body = locked ? (hover ? '#6f6257' : '#59503f') : (hover ? '#c39a63' : '#a0703c');
  roundRect(c, x - 1, yy - 1, w + 2, 15, 3, INK);
  roundRect(c, x, yy, w, 13, 2, mix(body, '#0a1226', dk * 0.55));
  px(c, x + 2, yy + 2, w - 4, 1, mix('#c9a06a', '#0a1226', dk * 0.5));
  for (let i = 0; i < 7; i++) {
    const px2 = side < 0 ? x - 1 - i : x + w + i;
    px(c, px2, yy + i, 1, 13 - i * 2, INK);
    px(c, px2 + (side < 0 ? 1 : -1), yy + 1 + i, 1, 11 - i * 2, mix(body, '#0a1226', dk * 0.55));
  }
  F.drawTextCentered(c, x + w / 2 + (side < 0 ? 3 : -3), yy + 4, label,
                     locked ? '#b8ac98' : (hover ? '#2b1c10' : '#ffe9b0'), 1);
  if (locked) {
    // a padlock hanging off the board
    const lx = side < 0 ? x + w + 2 : x - 6, ly = yy + 2;
    px(c, lx, ly + 3, 6, 6, INK);
    px(c, lx + 1, ly + 4, 4, 4, '#c9a86a');
    px(c, lx + 1, ly, 4, 4, INK);
    px(c, lx + 2, ly + 1, 2, 3, '#8a8a94');
    dot(c, lx + 2, ly + 5, '#5a4a2a');
    return;
  }

  // a little walking arrow that nudges toward the edge
  const ax = side < 0 ? x + 5 : x + w - 5;
  const nudge = hover ? side * 2 : 0;
  for (let i = 0; i < 4; i++) dot(c, ax + side * i + nudge, yy + 10 - i, hover ? '#2b1c10' : '#ffe9b0');
  for (let i = 0; i < 4; i++) dot(c, ax + side * i + nudge, yy + 10 + i, hover ? '#2b1c10' : '#ffe9b0');
}

function travelArrowBox(side, label) {
  const w = Math.max(46, F.textWidth(label, 1) + 22);
  const x = side < 0 ? 0 : W - 12 - w;
  return { x, y: GROUND_Y - 32, w: w + 12, h: 26 };
}

/* the name of wherever you have just walked into */
function drawAreaTitle(c, g, name, sub, amount) {
  if (amount <= 0) return;
  c.globalAlpha = Math.min(1, amount);
  const y = 22;
  F.drawTextCentered(c, W / 2, y, name, '#f6ecd6', 1, '#000000');
  F.drawTextCentered(c, W / 2, y + 10, sub, '#b9a88c', 1, '#000000');
  px(c, W / 2 - 22, y + 25, 44, 1, '#6b5a3a');
  c.globalAlpha = 1;
}

/* -------------------------------------------------------------------------
   THINGS LYING ABOUT
   ------------------------------------------------------------------------- */
function drawPickup(c, g, p, hover) {
  const bob = Math.sin(g.t * 2 + p.x) * 0.8;
  const y = p.y + bob;
  c.globalAlpha = 0.28; pellipse(c, p.x + 1, p.y + 7, 7, 2, '#0d1a08'); c.globalAlpha = 1;
  if (hover) glow(c, p.x + 8, y + 8, 16, '#ffe9a0', 0.45);
  if (p.id === 'backpack') drawBackpackSprite(c, p.x, y, 1);
  else drawItemIcon(c, p.x + 8, y + 9, p.id);
  // a soft sparkle so you can tell it is takeable
  const sp = (g.t * 1.4 + p.x) % 3;
  if (sp < 1) { c.globalAlpha = 1 - sp; dot(c, p.x + 15, y + 1 - sp * 4, '#fff6d8'); c.globalAlpha = 1; }
}

/* -------------------------------------------------------------------------
   COSY — the park is meant to feel emptier and softer, not busier.
   Big quiet shapes: hedges, a fallen log, mushroom rings, tall grass, vines.
   ------------------------------------------------------------------------- */
function drawCosyFoliage(c, g, seed, density) {
  const dk = darkness(g.timeOfDay);
  const s = SEASON[g.season];
  const sh = col => mix(col, '#050c18', dk * 0.82);
  const rnd = mulberry(seed || 404);
  const n = Math.round((density === undefined ? 1 : density) * 14 * W / 256);

  for (let i = 0; i < n; i++) {
    const x = rnd() * W;
    const y = GROUND_Y + 2 + rnd() * 30;
    const r = 5 + rnd() * 9;
    // a low soft bush
    pellipse(c, x, y, r, r * 0.62, sh(s.dark));
    pellipse(c, x - 1, y - 2, r * 0.85, r * 0.5, sh(s.t0));
    pellipse(c, x - 2, y - 3, r * 0.5, r * 0.3, sh(s.t1));
    if (rnd() > 0.6 && g.season !== 'winter') {
      for (let k = 0; k < 3; k++) {
        const bx = x + (rnd() - 0.5) * r * 1.5, by = y - r * 0.5 - rnd() * 3;
        dot(c, bx, by, sh(['#ffffff', '#ffd9ea', '#ffe066'][k % 3]));
      }
    }
  }

  // tall grass tufts, taller than the ones on the lawn
  for (let i = 0; i < n * 2; i++) {
    const x = rnd() * W, y = GROUND_Y + 6 + rnd() * 34;
    const h = 5 + rnd() * 7;
    const sway = Math.sin(g.t * 1.1 + i) * 1.4;
    for (let b = 0; b < 5; b++) {
      const a = (b - 2) * 0.5;
      for (let k = 0; k < h; k++) {
        px(c, x + a * k * 0.35 + sway * (k / h), y - k, 1, 1, sh(k > h - 3 ? s.t2 : s.t1));
      }
    }
  }

  // mushrooms, in rings, because the fungus decides not you
  if (g.season !== 'winter') for (let i = 0; i < 3; i++) {
    const cx2 = 24 + rnd() * (W - 48), cy2 = GROUND_Y + 12 + rnd() * 22;
    const rr = 6 + rnd() * 7;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * 6.28 + rnd() * 0.4;
      const mx2 = Math.round(cx2 + Math.cos(a) * rr), my2 = Math.round(cy2 + Math.sin(a) * rr * 0.5);
      px(c, mx2, my2 - 1, 1, 2, sh('#e8ded0'));
      pellipse(c, mx2, my2 - 2, 2, 1.4, sh(rnd() > 0.5 ? '#c9553f' : '#d9a05b'));
      dot(c, mx2, my2 - 3, sh('#f6ece0'));
    }
  }
}

/* one long fallen log — the single best piece of furniture in any wood */
function drawFallenLog(c, g, x, y, len) {
  const dk = darkness(g.timeOfDay);
  const sh = col => mix(col, '#0a1226', dk * 0.72);
  px(c, x, y - 7, len, 8, sh('#6b4a2a'));
  px(c, x, y - 7, len, 2, sh('#8a6338'));
  px(c, x, y - 1, len, 2, sh('#4a3220'));
  const rnd = mulberry(88);
  for (let i = 0; i < len / 3; i++) px(c, x + rnd() * len, y - 6 + rnd() * 5, 1 + rnd() * 3, 1, sh('#5a3f22'));
  // sawn end, with rings
  pellipse(c, x + len, y - 3, 2.4, 4.4, sh('#a3794a'));
  pellipse(c, x + len, y - 3, 1.6, 3, sh('#8a6338'));
  dot(c, x + len, y - 3, sh('#5a3f22'));
  // moss along the top, and something growing out of it
  for (let i = 0; i < len; i += 2) {
    if (mulberry(i + 3)() > 0.35) px(c, x + i, y - 8, 2, 1, sh('#4a7a32'));
  }
  for (let i = 0; i < 4; i++) {
    const mx2 = x + 6 + i * (len / 5);
    px(c, mx2, y - 11, 1, 3, sh('#e8ded0'));
    pellipse(c, mx2, y - 12, 2, 1.3, sh('#c9553f'));
  }
}

/* a standing stone the hollow grew around */
function drawStandingStone(c, g, x, y) {
  const dk = darkness(g.timeOfDay);
  const sh = col => mix(col, '#0a1226', dk * 0.75);
  c.globalAlpha = 0.3; pellipse(c, x, y + 1, 11, 3, '#0d1a08'); c.globalAlpha = 1;
  for (let i = 0; i < 28; i++) {
    const w = 13 - i * 0.24 - (i > 20 ? (i - 20) * 0.7 : 0);
    px(c, x - w / 2, y - i, w, 1, sh(i % 7 === 3 ? '#7a7a84' : '#6a6a74'));
    px(c, x - w / 2, y - i, 2, 1, sh('#93939e'));
    px(c, x + w / 2 - 2, y - i, 2, 1, sh('#4a4a54'));
  }
  for (let i = 0; i < 18; i++) {
    const yy = y - Math.floor(mulberry(i + 5)() * 24);
    px(c, x - 5 + mulberry(i + 9)() * 10, yy, 1, 1, sh('#4a7a32'));
  }
  // marks somebody cut into it a very long time ago
  px(c, x - 3, y - 18, 1, 6, sh('#3a3a44'));
  px(c, x - 1, y - 16, 1, 4, sh('#3a3a44'));
  px(c, x + 2, y - 19, 1, 7, sh('#3a3a44'));
}

/* hanging vines from the top of frame — cheap depth, huge cosiness */
function drawVines(c, g, seed) {
  const dk = darkness(g.timeOfDay);
  const s = SEASON[g.season];
  const sh = col => mix(col, '#050b16', dk * 0.85);
  const rnd = mulberry(seed || 51);
  const n = Math.round(6 * W / 256);
  for (let i = 0; i < n; i++) {
    const x0 = rnd() * W, len = 22 + rnd() * 54;
    const ph = rnd() * 6.28;
    for (let y = 0; y < len; y++) {
      const sway = Math.sin(g.t * 0.5 + ph + y * 0.06) * (y / len) * 3;
      px(c, x0 + sway, y, 1, 1, sh(s.t0));
      if (y % 5 === 0) {
        pcircle(c, x0 + sway - 1, y, 1.6, sh(s.t1));
        pcircle(c, x0 + sway + 2, y + 2, 1.4, sh(s.t2));
      }
    }
    if (g.season !== 'winter' && rnd() > 0.5) {
      const sway = Math.sin(g.t * 0.5 + ph + len * 0.06) * 3;
      pcircle(c, x0 + sway, len, 2, sh('#d8a0e8'));
      dot(c, x0 + sway, len, sh('#ffe066'));
    }
  }
}

/* a hedgerow along the back of the lane, with a gate-shaped gap */
function drawHedgerow(c, g, gapX) {
  const dk = darkness(g.timeOfDay);
  const s = SEASON[g.season];
  const sh = col => mix(col, '#050c18', dk * 0.8);
  const rnd = mulberry(303);
  for (let x = -8; x < W + 8; x += 5) {
    if (gapX !== undefined && Math.abs(x - gapX) < 16) continue;
    const h = 14 + Math.sin(x * 0.11) * 4 + rnd() * 3;
    pellipse(c, x, GROUND_Y - 2, 7, h * 0.5, sh(s.dark));
    pellipse(c, x - 1, GROUND_Y - 3 - h * 0.2, 6, h * 0.4, sh(s.t0));
    if (rnd() > 0.8) pcircle(c, x + rnd() * 4 - 2, GROUND_Y - 6 - rnd() * 6, 1.4, sh(g.season === 'autumn' ? '#c9553f' : s.t2));
  }
}

/* =========================================================================
   THE REST OF THE PARK
   Six more places, all built from the same primitives as everything else.
   ========================================================================= */

/* --- water, used by the bridge and the rink --- */
function drawStillWater(c, g, top, cols) {
  const dk = darkness(g.timeOfDay);
  const sh = col => mix(col, '#0a1226', dk * 0.72);
  const band = cols || ['#5a8ab0', '#4a7a9e', '#3d6a8a'];
  px(c, 0, top, W, H - top, sh(band[0]));
  px(c, 0, top + 14, W, H - top, sh(band[1]));
  px(c, 0, top + 34, W, H - top, sh(band[2]));
  for (let y = top + 2; y < H; y += 4) {
    const ph = Math.sin(g.t * 0.6 + y * 0.22);
    c.globalAlpha = 0.30;
    px(c, (ph * 14 + y * 5) % W - 20, y, 20, 1, sh('#c8e4f4'));
    px(c, (ph * -11 + y * 9 + 140) % W - 20, y + 2, 13, 1, sh('#e8f4ff'));
    c.globalAlpha = 1;
  }
}

/* --- SENECA VILLAGE: foundation stones, a marker, and nothing else --- */
function drawSenecaScene(c, g) {
  const dk = darkness(g.timeOfDay);
  const sh = col => mix(col, '#0a1226', dk * 0.75);
  const rnd = mulberry(1857);
  // the outline of a house that is not there
  const hx = Math.round(W * 0.34), hy = GROUND_Y + 8;
  for (let i = 0; i < 22; i++) {
    const x = hx - 44 + i * 4;
    px(c, x, hy, 4, 3, sh(i % 2 ? '#8a8a92' : '#9a9aa2'));
    px(c, x, hy, 4, 1, sh('#b6b6c0'));
  }
  for (let i = 0; i < 9; i++) {
    px(c, hx - 44, hy - i * 4, 4, 3, sh(i % 2 ? '#8a8a92' : '#9a9aa2'));
    px(c, hx + 40, hy - i * 4, 4, 3, sh(i % 2 ? '#8a8a92' : '#9a9aa2'));
  }
  // grass growing back through it
  for (let i = 0; i < 60; i++) {
    const x = hx - 44 + rnd() * 88, y = hy - rnd() * 34;
    px(c, x, y, 1, 2 + rnd() * 3, sh('#4a8a3a'));
  }
  // the marker
  const mx = Math.round(W * 0.66), my = GROUND_Y + 6;
  c.globalAlpha = 0.3; pellipse(c, mx, my + 2, 13, 3, '#0d1a08'); c.globalAlpha = 1;
  px(c, mx - 2, my - 6, 4, 8, sh('#6a6a74'));
  px(c, mx - 14, my - 26, 28, 21, sh('#3a3a44'));
  px(c, mx - 13, my - 25, 26, 19, sh('#5a5a66'));
  px(c, mx - 13, my - 25, 26, 2, sh('#7a7a86'));
  tinyText(c, mx - 11, my - 22, 'SENECA', sh('#e0e0e8'));
  tinyText(c, mx - 11, my - 16, 'VILLAGE', sh('#e0e0e8'));
  // flowers somebody left
  for (let i = 0; i < 7; i++) {
    const fx = mx - 10 + rnd() * 20;
    px(c, fx, my - 2, 1, 3, sh('#3a7a2a'));
    pcircle(c, fx, my - 4, 1.6, sh(['#ffffff', '#ffd8e8', '#ffe066'][i % 3]));
  }
}

/* --- BOW BRIDGE: cast iron over still water --- */
function drawBridgeScene(c, g) {
  const dk = darkness(g.timeOfDay);
  const sh = col => mix(col, '#0a1226', dk * 0.7);
  drawStillWater(c, g, GROUND_Y + 6);
  const cx = Math.round(W / 2), top = GROUND_Y - 12, span = Math.min(W - 40, 210);
  // the deck: a shallow arch
  for (let i = 0; i <= span; i++) {
    const p = i / span;
    const y = Math.round(top + Math.sin(Math.PI * p) * -12 + 12);
    px(c, cx - span / 2 + i, y, 1, 5, sh('#d8cfae'));
    px(c, cx - span / 2 + i, y, 1, 1, sh('#f2ead0'));
    px(c, cx - span / 2 + i, y + 5, 1, 2, sh('#8a8272'));
  }
  // the cast-iron balustrade, the eight arches it is famous for
  for (let a = 0; a < 8; a++) {
    const x0 = cx - span / 2 + (a + 0.5) * (span / 8);
    const p = (a + 0.5) / 8;
    const y = Math.round(top + Math.sin(Math.PI * p) * -12 + 12);
    for (let k = -12; k <= 12; k++) {
      const ay = y - 10 + Math.round((k * k) / 16);
      px(c, x0 + k, ay, 1, 1, sh('#c9c2a8'));
    }
    px(c, x0, y - 11, 1, 11, sh('#b8b09a'));
  }
  for (let i = 0; i <= span; i += 1) {
    const p = i / span;
    const y = Math.round(top + Math.sin(Math.PI * p) * -12);
    px(c, cx - span / 2 + i, y - 1, 1, 2, sh('#e8e0c4'));
  }
  // reflection
  c.globalAlpha = 0.22;
  for (let i = 0; i <= span; i += 2) {
    const p = i / span;
    const y = Math.round(top + Math.sin(Math.PI * p) * -12 + 12);
    px(c, cx - span / 2 + i, GROUND_Y + 40 + (GROUND_Y + 18 - y), 1, 3, '#f2ead0');
  }
  c.globalAlpha = 1;
}

/* --- THE MALL: an avenue of elms, receding --- */
function drawMallScene(c, g) {
  const dk = darkness(g.timeOfDay);
  const s = SEASON[g.season];
  const sh = col => mix(col, '#050c18', dk * 0.8);
  // the paving, in perspective
  for (let i = 0; i < H - GROUND_Y + 8; i++) {
    const w = 24 + i * 3.4;
    px(c, W / 2 - w / 2, GROUND_Y - 6 + i, w, 1, sh(mix('#b0a288', '#8a7e68', i / 40)));
  }
  for (let i = 0; i < 9; i++) {
    const t = i / 9, y = GROUND_Y - 6 + t * (H - GROUND_Y + 8);
    const w = 24 + t * (H - GROUND_Y + 8) * 3.4;
    px(c, W / 2 - w / 2, y, w, 1, sh('#6a5f4c'));
  }
  // two rows of elms, big ones near, small ones far
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const t = i / 5;
      const x = W / 2 + side * (18 + t * (W * 0.42));
      const base = GROUND_Y + 2 + t * 26;
      const h = 40 + t * 52;
      px(c, x - 1 - t * 2, base - h, 3 + t * 4, h, sh('#6b5744'));
      px(c, x - 1 - t * 2, base - h, 1 + t, h, sh('#8a7258'));
      // the canopies meet overhead, which is the whole point of the Mall
      pellipse(c, x, base - h - 4 - t * 8, 16 + t * 20, 10 + t * 14, sh(s.dark));
      pellipse(c, x - 2, base - h - 8 - t * 10, 12 + t * 15, 7 + t * 10, sh(s.t0));
      if (t > 0.5) pellipse(c, x - 3, base - h - 12 - t * 10, 8 + t * 9, 5 + t * 6, sh(s.t1));
    }
  }
  // benches down both sides
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const x = W / 2 + side * (34 + i * 30);
      drawBench(c, g, x, GROUND_Y + 22 + i * 6);
    }
  }
}

/* --- BETHESDA TERRACE: the arcade and the angel --- */
function drawTerraceScene(c, g) {
  const dk = darkness(g.timeOfDay);
  const sh = col => mix(col, '#0a1226', dk * 0.72);
  const cx = Math.round(W / 2);
  // the sandstone arcade behind
  px(c, 0, GROUND_Y - 34, W, 30, sh('#c9a878'));
  px(c, 0, GROUND_Y - 34, W, 3, sh('#e0c49a'));
  px(c, 0, GROUND_Y - 7, W, 3, sh('#a3865c'));
  for (let a = -3; a <= 3; a++) {
    const x = cx + a * 44;
    for (let k = -13; k <= 13; k++) {
      const h = Math.round(Math.sqrt(Math.max(0, 169 - k * k)));
      px(c, x + k, GROUND_Y - 7 - h, 1, h, sh('#5a4630'));
      px(c, x + k, GROUND_Y - 7 - h, 1, 2, sh('#8a6f4a'));
    }
    px(c, x - 15, GROUND_Y - 34, 3, 27, sh('#e0c49a'));
    px(c, x + 13, GROUND_Y - 34, 3, 27, sh('#a3865c'));
  }
  // the plaza
  px(c, 0, GROUND_Y - 4, W, H, sh('#b8a888'));
  for (let y = GROUND_Y - 4; y < H; y += 6) px(c, 0, y, W, 1, sh('#a39377'));
  for (let x = 0; x < W; x += 9) px(c, x, GROUND_Y - 4, 1, H, sh('#a39377'));
  // the fountain basin
  pellipse(c, cx, GROUND_Y + 30, 62, 18, sh('#8a7a5e'));
  pellipse(c, cx, GROUND_Y + 30, 58, 15, sh('#4a7a94'));
  pellipse(c, cx, GROUND_Y + 29, 52, 12, sh('#5f96b4'));
  for (let i = 0; i < 5; i++) {
    const ph = Math.sin(g.t * 0.9 + i);
    c.globalAlpha = 0.4;
    pellipse(c, cx + ph * 12, GROUND_Y + 28 + i * 2, 30 - i * 4, 3, '#cbe8f8');
    c.globalAlpha = 1;
  }
  // the pedestal and the Angel of the Waters
  px(c, cx - 9, GROUND_Y + 4, 18, 22, sh('#9a8a6e'));
  px(c, cx - 12, GROUND_Y + 2, 24, 4, sh('#b8a888'));
  px(c, cx - 6, GROUND_Y - 4, 12, 8, sh('#8a7a5e'));
  const ay = GROUND_Y - 6;
  const bronze = sh('#6e7a5e'), bronzeLit = sh('#93a37c'), bronzeDk = sh('#4a5440');
  // the wings first, sweeping up and back behind her
  for (let k = 0; k < 14; k++) {
    const rise = Math.round(k * 1.15), len = 3 + Math.round(k * 0.55);
    px(c, cx - 5 - k, ay - 24 - rise, 2, len, bronzeDk);
    px(c, cx - 5 - k, ay - 24 - rise, 1, len, bronze);
    px(c, cx + 4 + k, ay - 24 - rise, 2, len, bronze);
    px(c, cx + 4 + k, ay - 24 - rise, 1, len, bronzeLit);
  }
  // the robe, falling to the plinth
  for (let i = 0; i < 24; i++) {
    const w2 = 5 + Math.round(i * 0.28);
    px(c, cx - w2 / 2, ay - 22 + i, w2, 1, bronze);
    px(c, cx - w2 / 2, ay - 22 + i, 2, 1, bronzeLit);
    px(c, cx + w2 / 2 - 1, ay - 22 + i, 1, 1, bronzeDk);
  }
  pcircle(c, cx, ay - 26, 3.2, bronze);             // head
  pcircle(c, cx - 1, ay - 27, 2, bronzeLit);
  px(c, cx - 3, ay - 29, 7, 2, bronzeDk);           // her hair, bound up
  px(c, cx - 8, ay - 18, 6, 2, bronze);             // the blessing hand, out and down
  px(c, cx - 8, ay - 18, 6, 1, bronzeLit);
  px(c, cx + 3, ay - 21, 5, 2, bronze);             // the lily in the other
  px(c, cx + 7, ay - 24, 2, 4, bronzeDk);
  // water falling from the blessing hand
  for (let i = 0; i < 10; i++) {
    const tt = (g.t * 1.5 + i * 0.16) % 1;
    dot(c, cx - 7 + Math.sin(tt * 3) * 1.5, ay - 15 + tt * 42, sh('#dff0ff'));
  }
}

/* --- THE WOLLMAN RINK: ice, a rail, and people going round --- */
function drawRinkScene(c, g) {
  const dk = darkness(g.timeOfDay);
  const sh = col => mix(col, '#0a1226', dk * 0.7);
  // the city behind it, because you can see it from the rink
  for (let i = 0; i < 9; i++) {
    const bw = 16 + (i % 3) * 10, bx = (i * 41) % (W + 20) - 10;
    const bh = 40 + ((i * 37) % 46);
    px(c, bx, GROUND_Y - 26 - bh, bw, bh, sh(mix('#6a7280', '#98a2b0', (i % 3) / 3)));
    for (let wy = 0; wy < bh - 6; wy += 6) {
      for (let wx = 2; wx < bw - 3; wx += 5) {
        const lit = ((i * 7 + wx + wy) % 5) < 2;
        px(c, bx + wx, GROUND_Y - 26 - bh + 4 + wy, 2, 3, lit ? mix('#ffe9a0', '#8a8f9a', dk < 0.4 ? 0.7 : 0) : sh('#4a5260'));
      }
    }
  }
  // the ice
  px(c, 0, GROUND_Y - 26, W, 26, sh('#8fb8c9'));
  px(c, 0, GROUND_Y - 22, W, H, sh('#cfe4ee'));
  px(c, 0, GROUND_Y + 6, W, H, sh('#e2f0f6'));
  const rnd = mulberry(1986);
  for (let i = 0; i < 90; i++) {
    const x = rnd() * W, y = GROUND_Y - 20 + rnd() * (H - GROUND_Y + 20);
    px(c, x, y, 3 + rnd() * 9, 1, sh('#ffffff'));
  }
  // the rail round the edge
  px(c, 0, GROUND_Y - 27, W, 2, sh('#3a4048'));
  for (let x = 4; x < W; x += 16) px(c, x, GROUND_Y - 27, 2, 8, sh('#4a5058'));
  // skaters, going round
  for (let i = 0; i < 6; i++) {
    const a = g.t * (0.35 + i * 0.05) + i * 1.05;
    const x = W / 2 + Math.cos(a) * (W * 0.34);
    const y = GROUND_Y + 8 + Math.sin(a) * 16;
    const col = ['#c9453b', '#3f8fd0', '#e8b23a', '#6b3a8a', '#2f9670', '#d9707c'][i];
    const lean = Math.cos(a) > 0 ? 1 : -1;
    px(c, x - 2, y - 10, 4, 7, sh(col));
    pcircle(c, x, y - 12, 2, sh('#e8c9a8'));
    px(c, x + lean * 3, y - 8, 3, 2, sh(col));
    px(c, x - 1, y - 3, 2, 3, sh('#3a3a44'));
    px(c, x - 2, y, 5, 1, sh('#9aa4b0'));
    c.globalAlpha = 0.25; px(c, x - 6, y + 1, 12, 1, '#ffffff'); c.globalAlpha = 1;
  }
}

/* --- the man in the red tie, and the two beside him --- */
function drawSuit(c, g, s) {
  const dk = darkness(g.timeOfDay);
  const sh = col => mix(col, '#0a1226', dk * 0.7);
  const x = Math.round(s.x), y = Math.round(s.y);
  const step = s.moving ? Math.abs(Math.sin(g.t * 6)) * 1.5 : 0;
  const yy = y - step;
  const suit = sh('#232838'), suitLit = sh('#39405a'), skin = sh('#e0a878');

  // the two beside him, in grey
  for (const side of [-1, 1]) {
    const gx = x + side * 15;
    px(c, gx - 3, yy - 20, 7, 20, sh('#3a3f4a'));
    pcircle(c, gx, yy - 23, 3, sh('#c9a078'));
    px(c, gx - 3, yy - 25, 7, 2, sh('#2a2f38'));
    px(c, gx - 1, yy - 22, 2, 1, sh('#1a1a24'));      // dark glasses
  }

  c.globalAlpha = 0.3; pellipse(c, x, y + 1, 9, 3, '#0d1a08'); c.globalAlpha = 1;
  // the long dark coat
  px(c, x - 6, yy - 26, 12, 27, suit);
  px(c, x - 6, yy - 26, 4, 27, suitLit);
  px(c, x - 1, yy - 24, 2, 20, sh('#f0f0f0'));        // the shirt
  // the tie, which is longer than a tie
  px(c, x - 1, yy - 23, 2, 18, sh('#c9202a'));
  px(c, x - 1, yy - 23, 1, 18, sh('#e83a44'));
  px(c, x - 2, yy - 24, 4, 2, sh('#a01820'));
  // head
  pcircle(c, x, yy - 30, 4.4, skin);
  px(c, x - 4, yy - 33, 9, 3, sh('#e8c86a'));         // the hair
  px(c, x - 5, yy - 32, 3, 2, sh('#f0d888'));
  px(c, x + 2, yy - 34, 4, 2, sh('#f0d888'));
  px(c, x - 3, yy - 30, 2, 1, sh('#3a2a1a'));
  px(c, x + 2, yy - 30, 2, 1, sh('#3a2a1a'));
  px(c, x - 2, yy - 27, 4, 1, sh('#b07858'));
  // one hand out
  px(c, x + 5, yy - 20, 4, 2, skin);
}

/* the lane itself: pale earth widening out of the west, with two old ruts */
function drawLaneRoad(c, g) {
  const dk = darkness(g.timeOfDay);
  const sh = col => mix(col, '#0a1226', dk * 0.78);
  const vanish = W * 0.30;
  const depth = H - GROUND_Y + 6;
  for (let i = 0; i < depth; i++) {
    const t = i / depth;
    const w = 10 + t * W * 0.62;
    const cx2 = vanish - t * W * 0.16;
    px(c, cx2 - w / 2, GROUND_Y - 4 + i, w, 1, sh(mix('#b09a72', '#8a7855', t)));
  }
  // two ruts worn by nine hundred years of carts, then tyres
  for (const side of [-1, 1]) {
    for (let i = 4; i < depth; i++) {
      const t = i / depth;
      const w = 10 + t * W * 0.62;
      const cx2 = vanish - t * W * 0.16;
      px(c, cx2 + side * w * 0.22, GROUND_Y - 4 + i, 1 + t * 3, 1, sh(mix('#8a7855', '#6a5c40', t)));
    }
  }
  const rnd = mulberry(21);
  for (let i = 0; i < 120; i++) {
    const t = rnd();
    const w = 10 + t * W * 0.62;
    const cx2 = vanish - t * W * 0.16;
    px(c, cx2 - w / 2 + rnd() * w, GROUND_Y - 4 + t * depth, 1, 1, sh(rnd() > 0.5 ? '#cbb890' : '#6a5c40'));
  }
  // a milestone nobody has read in a century
  const mx2 = Math.round(W * 0.16), my2 = GROUND_Y + 6;
  c.globalAlpha = 0.3; pellipse(c, mx2 + 3, my2 + 1, 6, 2, '#0d1a08'); c.globalAlpha = 1;
  px(c, mx2, my2 - 11, 8, 12, sh('#8a8a94'));
  px(c, mx2, my2 - 13, 8, 3, sh('#a8a8b2'));
  px(c, mx2 + 1, my2 - 1, 6, 1, sh('#4a4a54'));
  tinyText(c, mx2 + 1, my2 - 9, 'IX', sh('#3a3a44'));
  for (let i = 0; i < 6; i++) dot(c, mx2 + rnd() * 8, my2 - 12 + rnd() * 12, sh('#4a7a32'));
}

/* =========================================================================
   THE GLASS CHURCH
   Forty floors of mirror glass at the end of the block, with a volcano on
   the sign. It is a parody of nobody in particular and it reflects the park
   back at the park, which is the whole joke.
   ========================================================================= */
function drawChurchScene(c, g) {
  const dk = darkness(g.timeOfDay);
  const sh = col => mix(col, '#0a1226', dk * 0.7);
  const night = dk > 0.4;

  // the rest of the block, set back
  for (let i = 0; i < 7; i++) {
    const bx = (i * 47) % (W + 30) - 20, bw = 22 + (i % 3) * 9;
    const bh = 34 + ((i * 29) % 40);
    px(c, bx, GROUND_Y - 30 - bh, bw, bh, sh(mix('#5a6270', '#7e8896', (i % 3) / 3)));
    for (let wy = 4; wy < bh - 4; wy += 7) {
      for (let wx = 3; wx < bw - 4; wx += 6) {
        const lit = ((i * 5 + wx + wy) % 6) < 2;
        px(c, bx + wx, GROUND_Y - 30 - bh + wy, 2, 3,
           lit && night ? '#ffe9a0' : sh('#3e4652'));
      }
    }
  }

  // the tower itself, dead centre, taller than the frame
  const tw = Math.min(96, Math.round(W * 0.34));
  const tx = Math.round(W / 2 - tw / 2);
  const top = 0;          // it goes up past the top of the frame
  px(c, tx - 2, top, tw + 4, GROUND_Y - 28 - top, sh('#2e4650'));
  px(c, tx, top + 2, tw, GROUND_Y - 30 - top, sh('#4f7d90'));
  // mirror glass: the park, reflected back at you in strips
  for (let y = top + 4; y < GROUND_Y - 30; y += 5) {
    const t = (y - top) / (GROUND_Y - 30 - top);
    const band = t < 0.55
      ? mix('#8fc6d8', '#bfe0ea', Math.sin(y * 0.7) * 0.5 + 0.5)   // sky
      : mix('#4a7a4c', '#79ab63', Math.sin(y * 1.1) * 0.5 + 0.5);  // the park
    px(c, tx + 2, y, tw - 4, 4, sh(band));
    // the mullions
    for (let x = tx + 2; x < tx + tw - 3; x += 7) px(c, x, y, 1, 4, sh('#2e4650'));
  }
  for (let y = top + 4; y < GROUND_Y - 30; y += 5) px(c, tx + 2, y, tw - 4, 1, sh('#dff0f6'));
  // one window, high up, that somebody has covered over
  px(c, tx + tw - 18, 78, 12, 9, sh('#211a14'));

  // the sign at the top: a volcano
  const sy = 44, scx = tx + Math.round(tw / 2);
  px(c, scx - 22, sy, 44, 16, sh('#1a1410'));
  px(c, scx - 21, sy + 1, 42, 14, sh('#2a2018'));
  for (let i = -8; i <= 8; i++) {
    const hh = 9 - Math.abs(i);
    px(c, scx + i, sy + 13 - hh, 1, hh, night ? '#c9453b' : sh('#8a3a30'));
  }
  px(c, scx - 3, sy + 3, 7, 2, night ? '#ffd24a' : sh('#b08030'));
  // the smoke coming off it, animated
  for (let i = 0; i < 4; i++) {
    const ph = g.t * 0.6 + i * 0.9;
    const ox = Math.sin(ph) * 5;
    px(c, scx + ox - 1, sy - 3 - i * 4 - (ph % 1) * 2, 3, 2,
       sh(night ? '#6a5a52' : '#8a7a70'));
  }
  if (night) { glow(c, scx, sy + 8, 30, 'rgba(220,90,60,0.16)'); }

  // the pavement and the doors
  px(c, 0, GROUND_Y - 30, W, 30, sh('#4a4a52'));
  px(c, 0, GROUND_Y - 30, W, 2, sh('#5e5e68'));
  px(c, 0, GROUND_Y, W, H, sh('#3e3e46'));
  for (let x = 0; x < W; x += 22) px(c, x, GROUND_Y, 1, H, sh('#33333a'));
  // revolving doors, lit from inside
  const dx = scx - 13;
  px(c, dx, GROUND_Y - 30, 26, 30, sh('#23343c'));
  px(c, dx + 2, GROUND_Y - 27, 22, 27, night ? mix('#ffe9a0', '#c9b070', 0.3) : sh('#cfe0e6'));
  px(c, dx + 12, GROUND_Y - 27, 2, 27, sh('#23343c'));
  px(c, dx + 2, GROUND_Y - 27, 22, 2, sh('#3e5a64'));
  // A-board on the pavement: the free test
  const bx2 = scx + 34;
  px(c, bx2 - 8, GROUND_Y - 13, 16, 13, sh('#e8e2d0'));
  px(c, bx2 - 8, GROUND_Y - 13, 16, 3, sh('#c9453b'));
  for (let i = 0; i < 3; i++) px(c, bx2 - 6, GROUND_Y - 8 + i * 3, 12, 1, sh('#5a5a5a'));
}

/* the man from the building. He is not anybody: too many teeth, a clipboard,
   and he runs everywhere. */
function drawStar(c, g, s) {
  const dk = darkness(g.timeOfDay);
  const sh = col => mix(col, '#0a1226', dk * 0.7);
  const x = Math.round(s.x), y = Math.round(s.y);
  const run = s.moving ? Math.sin(g.t * 14) : 0;
  const yy = y - Math.abs(run) * 2.5;
  const jacket = sh('#2a2a30'), lit = sh('#41414c'), skin = sh('#e8b184');

  c.globalAlpha = 0.3; pellipse(c, x, y + 1, 8, 3, '#0d1a08'); c.globalAlpha = 1;

  // legs, mid-sprint even when he is standing still
  px(c, x - 4 + run * 3, yy - 10, 3, 11, sh('#1e2028'));
  px(c, x + 1 - run * 3, yy - 10, 3, 11, sh('#262932'));
  // the jacket
  px(c, x - 5, yy - 24, 11, 15, jacket);
  px(c, x - 5, yy - 24, 4, 15, lit);
  px(c, x - 1, yy - 23, 3, 13, sh('#f4f4f4'));
  // arms: one pumping, one holding the clipboard out at you
  px(c, x - 8 - run * 2, yy - 22, 3, 9, lit);
  px(c, x + 6, yy - 20, 4, 3, jacket);
  if (!s.gave) {
    px(c, x + 9, yy - 22, 7, 9, sh('#c9a06a'));
    px(c, x + 10, yy - 21, 5, 7, sh('#f6ecd6'));
    px(c, x + 11, yy - 23, 3, 2, sh('#b0b6c0'));
  }
  // head
  pcircle(c, x, yy - 28, 4.2, skin);
  px(c, x - 4, yy - 32, 9, 3, sh('#2a1c12'));
  px(c, x - 4, yy - 31, 3, 2, sh('#3e2a1c'));
  // the eyes never close and never move
  px(c, x - 3, yy - 29, 2, 2, sh('#ffffff')); px(c, x - 3, yy - 29, 1, 1, '#120a04');
  px(c, x + 2, yy - 29, 2, 2, sh('#ffffff')); px(c, x + 2, yy - 29, 1, 1, '#120a04');
  // the smile. All of the teeth, all of the time.
  px(c, x - 3, yy - 25, 7, 2, sh('#1a0f08'));
  px(c, x - 3, yy - 25, 7, 1, '#ffffff');
  if (dk > 0.4) glow(c, x, yy - 26, 9, 'rgba(255,255,255,0.10)');
}

/* =========================================================================
   THE MEMORIAL STONE
   A low granite stone on a mown square, with flowers laid along the bottom
   and a candle in a jar that somebody keeps relighting.
   ========================================================================= */
function drawStoneScene(c, g, tributes) {
  const dk = darkness(g.timeOfDay);
  const sh = col => mix(col, '#0a1226', dk * 0.7);
  // a mown square, kept shorter than the rest of the park
  px(c, 0, GROUND_Y - 18, W, 18, sh('#5d9440'));
  px(c, 0, GROUND_Y - 18, W, 1, sh('#79b356'));
  px(c, 0, GROUND_Y, W, H, sh('#4a7a32'));
  const rnd = mulberry(2025);
  for (let i = 0; i < 70; i++) {
    const x = rnd() * W, y = GROUND_Y - 14 + rnd() * (H - GROUND_Y + 14);
    px(c, x, y, 1, 2, sh('#528a36'));
  }
  // a few small flags somebody pushed into the turf, set back from the stone
  for (let i = 0; i < 5; i++) {
    const fx = Math.round(W * 0.72 + i * 11);
    if (fx > W - 6) continue;
    px(c, fx, GROUND_Y - 13, 1, 6, sh('#8a7a5a'));
    px(c, fx + 1, GROUND_Y - 13, 4, 2, sh('#c9453b'));
    px(c, fx + 1, GROUND_Y - 12, 4, 1, sh('#f4f4f4'));
  }
  // two young trees somebody planted either side
  for (const side of [-1, 1]) {
    const tx = Math.round(W / 2 + side * Math.min(90, W * 0.3));
    px(c, tx, GROUND_Y - 34, 2, 34, sh('#6b4a2a'));
    pcircle(c, tx + 1, GROUND_Y - 40, 11, sh('#4a8a30'));
    pcircle(c, tx - 2, GROUND_Y - 43, 7, sh('#6cc73f'));
  }
}

/* the stone itself, drawn into the outlined actor layer so it does not get
   buried by the planting */
function drawStone(c, g, cx, tributes) {
  const dk = darkness(g.timeOfDay);
  const sh = col => mix(col, '#0a1226', dk * 0.7);
  const F = window.FONT_API;
  const x = Math.round(cx), base = GROUND_Y - 2;

  // the plinth
  px(c, x - 46, base - 5, 92, 6, sh('#8a8f96'));
  px(c, x - 46, base - 5, 92, 2, sh('#a6acb4'));
  // the stone
  px(c, x - 42, base - 58, 84, 53, sh('#8a9098'));
  px(c, x - 40, base - 56, 80, 49, sh('#b4bac2'));
  px(c, x - 40, base - 56, 80, 2, sh('#d2d8e0'));
  px(c, x - 40, base - 9, 80, 2, sh('#8a9098'));
  px(c, x - 40, base - 56, 3, 49, sh('#c6ccd4'));
  // the carving
  if (F) {
    const S = DATA.stone || {};
    F.drawTextCentered(c, x, base - 51, S.name || '', sh('#32383e'), 1);
    F.drawTextCentered(c, x, base - 42, S.dates || '', sh('#464c54'), 1);
    px(c, x - 22, base - 34, 44, 1, sh('#7a8088'));
    const lines = F.wrapText(S.plaque || '', 74, 1);
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      F.drawTextCentered(c, x, base - 29 + i * 7, lines[i], sh('#4a5058'), 1);
    }
  }

  // flowers along the foot of it — one more for every tribute left
  const n = 5 + Math.min(14, tributes | 0);
  const rnd = mulberry(910);
  for (let i = 0; i < n; i++) {
    const fx = x - 44 + rnd() * 88, fy = base + 1 + rnd() * 4;
    const col = ['#ff5b78', '#ffd24a', '#f4f4f4', '#b183e8'][i % 4];
    px(c, fx, fy - 3, 1, 3, sh('#3f7a2a'));
    pcircle(c, fx, fy - 4, 1.6, sh(col));
  }
  // the candle in a jar, still going
  const jx = x + 50;
  px(c, jx - 3, base - 8, 6, 8, sh('#cfe0e6'));
  px(c, jx - 3, base - 8, 2, 8, sh('#e8f2f6'));
  const fl = Math.sin(g.t * 9) * 0.6;
  px(c, jx - 1, base - 7 + fl, 2, 3, '#ffd24a');
  px(c, jx, base - 8 + fl, 1, 2, '#fff6d0');
  glow(c, jx, base - 7, 11, 'rgba(255,190,90,' + (0.10 + dk * 0.22) + ')');
}

/* =========================================================================
   THE GOLDEN ARCHES
   Across two lanes of traffic. Open all night. Older than everyone in it.
   ========================================================================= */
function drawArchesScene(c, g) {
  const dk = darkness(g.timeOfDay);
  const sh = col => mix(col, '#0a1226', dk * 0.7);
  const night = dk > 0.4;

  // the block behind
  for (let i = 0; i < 6; i++) {
    const bx = (i * 53) % (W + 30) - 20, bw = 26 + (i % 3) * 12;
    const bh = 30 + ((i * 31) % 34);
    px(c, bx, GROUND_Y - 44 - bh, bw, bh, sh(mix('#6a5a52', '#8e7a6c', (i % 3) / 3)));
    for (let wy = 4; wy < bh - 4; wy += 7)
      for (let wx = 3; wx < bw - 4; wx += 7)
        px(c, bx + wx, GROUND_Y - 44 - bh + wy, 3, 3,
           ((i * 3 + wx + wy) % 5) < 2 && night ? '#ffe9a0' : sh('#463a34'));
  }

  // the restaurant: low, wide, brick and glass
  const rw = Math.min(150, Math.round(W * 0.56));
  const rx = Math.round(W / 2 - rw / 2), ry = GROUND_Y - 44;
  px(c, rx, ry, rw, 26, sh('#8a4a3a'));
  px(c, rx, ry, rw, 3, sh('#c9453b'));
  px(c, rx, ry + 3, rw, 2, sh('#ffc72c'));
  // the window, and the people inside it
  px(c, rx + 5, ry + 7, rw - 10, 15, night ? mix('#ffe9a0', '#e8d090', 0.2) : sh('#cfe4ee'));
  for (let x = rx + 5; x < rx + rw - 6; x += 13) px(c, x, ry + 7, 1, 15, sh('#6a3a2e'));
  const rnd = mulberry(1955);
  for (let i = 0; i < 6; i++) {
    const px2 = rx + 10 + rnd() * (rw - 22);
    px(c, px2, ry + 13, 4, 9, sh(['#3a4a6a', '#6a3a4a', '#3a5a3a', '#5a4a2a'][i % 4]));
    pcircle(c, px2 + 2, ry + 11, 2.2, sh('#e0a878'));
  }
  // the doors
  px(c, rx + Math.round(rw / 2) - 9, ry + 9, 18, 17, sh('#5e3a2e'));
  px(c, rx + Math.round(rw / 2) - 7, ry + 11, 14, 15, night ? '#ffe9a0' : sh('#dfeef4'));

  // THE ARCHES, on a pole, above everything
  const ax = rx + rw - 22, ay = ry - 40;
  px(c, ax - 1, ay, 3, 40, sh('#7a7a82'));
  const A = night ? '#ffc72c' : sh('#e8b21f');
  for (const off of [-11, 1]) {
    px(c, ax + off, ay + 6, 4, 16, A);
    px(c, ax + off + 6, ay + 6, 4, 16, A);
    px(c, ax + off + 2, ay + 2, 6, 5, A);
    px(c, ax + off, ay + 4, 4, 4, A);
    px(c, ax + off + 6, ay + 4, 4, 4, A);
  }
  if (night) glow(c, ax, ay + 12, 26, 'rgba(255,200,60,0.20)');

  // the flag on the other pole, because of course there is one
  const fx = rx + 12;
  px(c, fx, ry - 34, 1, 34, sh('#9aa0a8'));
  const wave = Math.sin(g.t * 2) * 1.5;
  for (let i = 0; i < 7; i++) {
    px(c, fx + 1, ry - 33 + i + wave * (i > 3 ? 1 : 0), 14, 1,
       sh(i % 2 ? '#f4f4f4' : '#c9453b'));
  }
  px(c, fx + 1, ry - 33 + wave * 0, 6, 4, sh('#3c4a8a'));

  // the avenue: two lanes, a crossing, and the cars that never stop
  px(c, 0, GROUND_Y - 18, W, 18, sh('#3e3e46'));
  px(c, 0, GROUND_Y - 18, W, 2, sh('#4e4e58'));
  for (let x = ((g.t * 0) | 0); x < W; x += 18) px(c, x, GROUND_Y - 10, 9, 1, sh('#d8d24a'));
  px(c, 0, GROUND_Y, W, H, sh('#55555e'));
  for (let x = 6; x < W; x += 12) px(c, x, GROUND_Y + 1, 7, 3, sh('#c8c8d0'));   // the crossing
  // three cars, looping
  for (let i = 0; i < 3; i++) {
    const sp = 26 + i * 9, dir = i === 1 ? -1 : 1;
    let cx2 = dir === 1
      ? ((g.t * sp + i * 90) % (W + 70)) - 35
      : W + 35 - ((g.t * sp + i * 90) % (W + 70));
    const cy = GROUND_Y - 14 + (dir === 1 ? 0 : 4);
    const body = sh(['#c9453b', '#e8b23a', '#3a5a8a'][i]);
    px(c, cx2 - 12, cy - 5, 24, 6, body);
    px(c, cx2 - 7, cy - 9, 13, 5, body);
    px(c, cx2 - 6, cy - 8, 11, 3, sh('#8fb8c9'));
    px(c, cx2 - 12, cy - 3, 24, 2, sh('#2a2a30'));
    pcircle(c, cx2 - 7, cy + 1, 2.2, sh('#1a1a20'));
    pcircle(c, cx2 + 7, cy + 1, 2.2, sh('#1a1a20'));
    if (night) {
      px(c, cx2 + dir * 12, cy - 4, 2, 2, '#fff6d0');
      glow(c, cx2 + dir * 16, cy - 3, 10, 'rgba(255,240,190,0.18)');
    }
  }
  // a bin and a bus stop, because it is a street
  px(c, 10, GROUND_Y - 12, 8, 12, sh('#4a5a4a'));
  px(c, 9, GROUND_Y - 13, 10, 2, sh('#5e6e5e'));
}

window.SPR = {
  get W() { return W; }, H, GROUND_Y, get CX() { return CX; }, setLogicalWidth, layerBegin, layerEnd, outlinedSprite, makeCanvas, CANOPY, TWIGS, SEASON, SEASON_NAMES, TROPHY_ART, HALL,
  px, dot, pcircle, pellipse, glow, mix, mulberry, star, quant,
  isNight, darkness, trunkHalfWidth, hallSlotPos, hallWidth,
  drawBackdrop, drawBokeh, drawGround, drawForeground, drawFrameFoliage,
  drawTree, drawWatchers, drawSquirrel, drawGroundItems, drawParticles,
  drawFireOnTree, drawFireGlow, drawPond, drawOverlay, drawHud, drawTools, tinyText, digits, drawCritters, drawUndergrowth,
  drawCottage, drawNoticeBoard, drawBench, drawFlowerbed, drawBirdbath, drawHive, drawLamp,
  drawVisitor, drawBoundary,
  drawBalloon, drawPanel, drawSnail, drawCursorTool, drawMoreArrow, roundRect, INK, drawAshScene, drawStump, drawItemIcon, drawLeafSprite,
  drawHall, drawTrophy, drawTrophyReflection, trophySprite, drawPlinth, drawHeaven, drawHeavenBackdrop, drawGhostTree, drawSoul,
  drawGarden, gardenSlotPos, gardenWidth, GARDEN, drawCloudTunnel, drawLetterbox, drawRays, drawGrowingTree, flame,
  drawZzz, drawGear, drawSnailParcel, drawBird, drawBirdPortrait, drawWordPop, drawImpactLines, squashTransform, drawScrollFrame, drawSheet, drawRod, drawSeal, PAPER, snailSkin, drawShell, SNAIL_SHELLS, SNAIL_PATTERNS, drawNoc, drawNocCamp, drawTravelArrow, travelArrowBox, drawAreaTitle, drawPickup,
  drawSenecaScene, drawBridgeScene, drawMallScene, drawTerraceScene, drawRinkScene, drawSuit, drawStillWater,
  drawChurchScene, drawStar, drawStoneScene, drawStone, drawArchesScene,
  drawCosyFoliage, drawFallenLog, drawStandingStone, drawVines, drawHedgerow, drawLaneRoad,
  drawBackpackSprite, drawBagButton
};
