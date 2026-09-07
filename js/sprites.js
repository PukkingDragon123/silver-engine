/* =========================================================================
   THE WISE OAK TREE — pixel renderer
   256x192 logical pixels, fillRect only, scaled up with image-rendering:
   pixelated. No image assets, no libraries.

   The look: layered forest depth, mist, god rays, and a big gnarled face
   with warm amber eyes that is friendly right up until it isn't.
   ========================================================================= */

const W = 256, H = 192;
const GROUND_Y = 150;

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
  const push = (x, y, r, tone) => blobs.push({ x, y, r, tone, s: rnd(), ph: rnd() * 6.28 });
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

/* foliage hanging into frame from the top edge — the thing that makes the
   reference picture feel like you are standing under a canopy */
const FRAME = (function () {
  const rnd = mulberry(2024);
  const out = [];
  for (let i = 0; i < 26; i++) {
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
})();

/* misty background trees */
const BG_TREES = (function () {
  const rnd = mulberry(555);
  const out = [];
  for (let i = 0; i < 22; i++) {
    const x = rnd() * W;
    if (x > 92 && x < 164) continue;               // keep the middle clear
    const depth = rnd();
    out.push({ x, depth, h: 26 + rnd() * 40 * (1 - depth * 0.5), r: 10 + rnd() * 14 });
  }
  return out.sort((a, b) => b.depth - a.depth);
})();

const BRANCHES = [
  [[128, 100], [108, 86], [90, 74], [78, 62]],
  [[128, 100], [148, 86], [166, 74], [178, 62]],
  [[128, 96],  [122, 78], [114, 60], [106, 46]],
  [[128, 96],  [134, 76], [142, 58], [150, 44]],
  [[128, 94],  [128, 72], [128, 52], [128, 36]]
];

const TWIGS = (function () {
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
    px(c, t.x - 1, base - t.h * 0.6, 3, t.h * 0.6, mix('#4a3a2a', bloom, fade));
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
  const clumps = [[-6, 190, 26], [24, 196, 20], [232, 190, 26], [206, 198, 20], [128, 206, 24], [76, 204, 18], [178, 202, 18]];
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
  dead:   { lid: 0.0,  brow:  1, tilt:  0, mouth: 'flat',  pupil: 1.0, squint: 0.0 }
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
    if (hw > 0) px(c, 128 - hw, GROUND_Y + 1 + y, hw * 2, 1, '#0d1a08');
  }
  c.globalAlpha = 1;

  // roots flaring out of the ground
  for (const dir of [-1, 1]) {
    for (let i = 0; i < 26; i++) {
      const h = Math.max(1, 12 - i * 0.44);
      const x = 128 + dir * (26 + i) - (dir < 0 ? 2 : 0);
      px(c, x, GROUND_Y + 6 - h, 2, h, i < 4 ? B.mid : B.lo);
      if (i % 5 === 0) px(c, x, GROUND_Y + 5 - h, 2, 1, B.hi);
    }
    px(c, 128 + dir * 52 - (dir < 0 ? 5 : 0), GROUND_Y + 4, 5, 3, B.deep);
  }

  // trunk, lit from the upper left
  for (let y = GROUND_Y + 6; y > 88; y--) {
    const hw = trunkHalfWidth(y);
    const x = 128 + off(y) - hw;
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
    const x = 128 + off(y) + Math.floor((rnd() * 2 - 1) * (hw - 4));
    px(c, x, y, 1, 2 + Math.floor(rnd() * 4), rnd() > 0.45 ? B.lo : B.hi);
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
    const hx = Math.round(128 + sway * 1.4), hy = 26;
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
  const cx = Math.round(128 + off(112)), cy = 112;
  const M = MOODS[g.mood] || MOODS.chill;
  const stare = g.stare || 0;
  const wide = 1 + stare * 0.18;

  let lid = M.lid * (1 - stare) + (-0.30) * stare;
  if (g.blink > 0 && !g.dead) lid = 1;
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
    px(c, 128 - hw, y, hw * 2, 1, B.mid);
    px(c, 128 - hw, y, 4, 1, B.hi);
    px(c, 128 + hw - 4, y, 4, 1, B.deep);
  }
  for (let i = 0; i < 24; i++) {
    const x = 128 - 26 + i * 2.2;
    px(c, x, GROUND_Y - 18 - Math.floor(rnd() * 9), 3, 12, B.lo);
  }
  for (const dir of [-1, 1]) for (let i = 0; i < 26; i++) {
    const h = Math.max(1, 12 - i * 0.44);
    px(c, 128 + dir * (26 + i) - (dir < 0 ? 2 : 0), GROUND_Y + 6 - h, 2, h, B.lo);
  }
  for (let i = 0; i < 18; i++) dot(c, 110 + rnd() * 36, GROUND_Y - 16 + rnd() * 6, rnd() > 0.5 ? '#ff8a3a' : '#d94a22');
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
  if (s.holding) drawItemIcon(c, x + 10 * s.dir, yy - 5, s.holding);
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
    const bob = Math.sin(g.t * 3 + it.ph) * 0.5;
    c.globalAlpha = 0.3; pellipse(c, it.x + 3, it.y + 6, 5, 2, '#0d1a08'); c.globalAlpha = 1;
    drawLeafSprite(c, it.x, it.y + bob, mix(it.col, '#0a1226', dk * 0.6), mix(it.col2, '#0a1226', dk * 0.6));
  }
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
  glow(c, 128, 108, 80 * Math.min(1, g.burn * 1.5), '#ff7a2a', 0.5);
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
    flame(c, 128 + (rnd() > 0.5 ? 1 : -1) * hw * edge, y, 4 + Math.floor(rnd() * 9), g.t + i * 0.7);
  }
  // a low fire licking round the roots
  for (let i = 0; i < 12; i++) {
    flame(c, 128 + (rnd() * 2 - 1) * 40, GROUND_Y + 4 + rnd() * 3, 4 + Math.floor(rnd() * 7), g.t + i);
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
    if (hw > 0) px(c, 128 - hw, GROUND_Y + 2 + y, hw * 2, 1, '#0e0a09');
  }
  c.globalAlpha = 1;

  const rnd = mulberry(77);
  for (let y = GROUND_Y + 6; y > GROUND_Y - 26; y--) {
    const k = (GROUND_Y - y) / 32;
    const hw = Math.round(30 - k * 8);
    px(c, 128 - hw, y, hw * 2, 1, '#2a2220');
    px(c, 128 - hw, y, 3, 1, '#171211');
    px(c, 128 + hw - 3, y, 3, 1, '#3a2f2c');
  }
  for (let i = 0; i < 22; i++) {
    const x = 100 + i * 2.6;
    px(c, x, GROUND_Y - 26 - (2 + Math.floor(rnd() * 11)), 3, 14, '#241d1b');
  }
  for (const dir of [-1, 1]) for (let i = 0; i < 22; i++) {
    const h = Math.max(1, 8 - i * 0.36);
    px(c, 128 + dir * (28 + i) - (dir < 0 ? 2 : 0), GROUND_Y + 6 - h, 2, h, '#1e1817');
  }
  const glowAmt = 0.55 + 0.45 * Math.sin(g.t * 1.7);
  glow(c, 128, GROUND_Y - 8, 26, '#ff6a20', 0.18 * glowAmt);
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
    const x = 128 + Math.sin(g.t * 0.8 + p * 4) * (4 + p * 18);
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
  const t = g.t;

  // ceiling and sky
  for (let y = 0; y < H; y++) {
    const f = y / H;
    px(c, 0, y, W, 1, quant(mix(mix('#6a86c8', '#cfe2f5', Math.min(1, f * 1.6)), '#ffffff', f * 0.5), 8));
  }
  // vaulted arches overhead
  for (let i = -1; i < 8; i++) {
    const x = i * 96 - (sc * 0.25) % 96;
    for (let a = 0; a <= 46; a++) {
      const A = (a / 46) * Math.PI;
      px(c, x + 48 - Math.cos(A) * 48, 34 - Math.sin(A) * 30, 3, 3, '#b9cbe4');
      px(c, x + 48 - Math.cos(A) * 48, 34 - Math.sin(A) * 30, 3, 1, '#dcebf8');
    }
  }
  px(c, 0, 0, W, 8, '#9fb6d6'); px(c, 0, 8, W, 3, '#cadaee');

  // far light at the end of the hall
  c.globalAlpha = 0.5; glow(c, W / 2, 70, 60, '#ffffff', 0.6); c.globalAlpha = 1;

  // columns behind the back row
  for (let i = -1; i < 10; i++) {
    const x = i * 108 - (sc * 0.55) % 108;
    px(c, x - 9, 24, 18, 4, '#e6eff8'); px(c, x - 7, 28, 14, 92, '#d2e0ee');
    px(c, x - 7, 28, 3, 92, '#eef5fb'); px(c, x + 4, 28, 3, 92, '#aec2d8');
    px(c, x - 10, 118, 20, 5, '#e6eff8');
  }

  // banners between the columns
  for (let i = -1; i < 10; i++) {
    const x = i * 108 - (sc * 0.55) % 108 + 54;
    const tier = i % 3;
    const col = tier === 0 ? '#a06bd8' : tier === 1 ? '#e0b23a' : '#6ba8d8';
    px(c, x - 7, 12, 14, 44, mix(col, '#ffffff', 0.35));
    px(c, x - 7, 12, 14, 3, mix(col, '#000000', 0.25));
    px(c, x - 7, 12, 3, 44, mix(col, '#ffffff', 0.6));
    for (let j = 0; j < 4; j++) px(c, x - 5 + j * 4, 56, 3, 3 + (j % 2) * 3, mix(col, '#ffffff', 0.35));
    star(c, x, 32, 5, '#fff6d0', '#ffffff');
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
  // reflections
  c.globalAlpha = 0.18; px(c, 0, 120, W, H - 120, '#ffffff'); c.globalAlpha = 1;

  // a long red carpet down the middle of the hall
  for (let y = 122; y < H; y++) {
    const spread = (y - 120) / (H - 120);
    const hw = 18 + spread * 66;
    px(c, W / 2 - hw, y, hw * 2, 1, '#8a2f3a');
    px(c, W / 2 - hw, y, 3 + spread * 4, 1, '#6b2029');
    px(c, W / 2 + hw - (3 + spread * 4), y, 3 + spread * 4, 1, '#6b2029');
    if ((y % 9) === 0) px(c, W / 2 - hw + 4, y, hw * 2 - 8, 1, '#a03a46');
  }

  // plinths
  const list = g.hall.order;
  for (let i = 0; i < list.length; i++) {
    if (g.hall.dragIndex === i) continue;
    drawPlinth(c, g, i, list[i], sc);
  }
  if (g.hall.dragIndex >= 0) {
    const id = list[g.hall.dragIndex];
    drawTrophy(c, g, id, g.hall.dragX, g.hall.dragY, 1.15, true);
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
  if (x < -40 || x > W + 40) return;
  const unlocked = !!g.hall.unlocked[id];
  const tier = g.hall.tier[id] || 'task';
  const s = p.scale;
  const w = Math.round(15 * s), h = Math.round(26 * s);
  const top = p.y - h;

  // shadow
  c.globalAlpha = 0.2; pellipse(c, x, p.y + 2, w + 4, 3, '#5a7090'); c.globalAlpha = 1;
  // stepped marble plinth
  px(c, x - w - 2, p.y - 3, (w + 2) * 2, 4, '#c2d2e2');
  px(c, x - w, top + 3, w * 2, h - 6, '#dde8f2');
  px(c, x - w, top + 3, 3, h - 6, '#f2f8fd');
  px(c, x + w - 3, top + 3, 3, h - 6, '#b6c8dc');
  px(c, x - w - 2, top, (w + 2) * 2, 4, '#e8f0f8');
  px(c, x - w - 2, top, (w + 2) * 2, 1, '#ffffff');
  // plaque
  const pc = unlocked ? (tier === 'chal' ? '#a06bd8' : tier === 'goal' ? '#ffd24a' : '#8fd95a') : '#8a97a8';
  px(c, x - Math.round(9 * s), top + Math.round(10 * s), Math.round(18 * s), Math.round(6 * s), '#9fb0c4');
  px(c, x - Math.round(8 * s), top + Math.round(11 * s), Math.round(16 * s), Math.round(4 * s), pc);
  if (!unlocked) { px(c, x - 1, top + Math.round(11 * s), 2, Math.round(4 * s), '#5a6a7a'); }

  if (unlocked) {
    drawTrophy(c, g, id, x, top, s, false);
  } else {
    // a shrouded shape, waiting
    c.globalAlpha = 0.55;
    pellipse(c, x, top - Math.round(8 * s), Math.round(9 * s), Math.round(11 * s), '#b9c8d8');
    px(c, x - Math.round(9 * s), top - 2, Math.round(18 * s), 3, '#a8b8c8');
    c.globalAlpha = 1;
  }
}

function drawTrophy(c, g, id, x, y, s, lifted) {
  const art = TROPHY_ART[id];
  const bob = lifted ? 0 : Math.sin(g.t * 1.6 + x * 0.1) * 0.5;
  s = s * 1.3;
  const cy = y - Math.round(8 * s) + bob;
  if (lifted) { c.globalAlpha = 0.25; pellipse(c, x, y + 16, 12, 4, '#5a7090'); c.globalAlpha = 1; }
  glow(c, x, cy, Math.round(15 * s), '#fff3c0', lifted ? 0.5 : 0.28);
  if (!art) { pcircle(c, x, cy, 7 * s, GOLD[2]); return; }
  if (s !== 1) {
    // draw small trophies by simply pulling the art in tighter
    c.save();
    c.translate(x, cy); c.scale(s, s); c.translate(-x, -cy);
    art(c, x, cy);
    c.restore();
  } else art(c, x, cy);
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
  drawGhostTree(c, g, 128, 104 + Math.sin(g.t * 1.1) * 3, 1);
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
  const blobs = CANOPY.filter(b => b.s < 0.58 && Math.abs(b.x - 128) < 44);
  const map = bl => [gx + (bl.x - 128) * 0.58, cy + (bl.y - 52) * 0.55];
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
  c.translate(128, GROUND_Y + 4);
  c.scale(k, k);
  c.translate(-128, -(GROUND_Y + 4));
  drawTree(c, g);
  c.restore();

  // earth breaking, and light coming off the new growth
  const rnd = mulberry(Math.floor(g.t * 4));
  if (p < 0.5) for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 30 * (1 - p * 2);
    px(c, 128 + Math.cos(a) * d, GROUND_Y + 4 + Math.sin(a) * d * 0.4, 2, 2, '#6b4a2a');
  }
  for (let i = 0; i < 12; i++) {
    const a = rnd() * Math.PI * 2, r = 20 + rnd() * 50 * k;
    c.globalAlpha = 0.5 + rnd() * 0.5;
    dot(c, 128 + Math.cos(a) * r, GROUND_Y - 20 * k + Math.sin(a) * r * 0.6, '#d8f8a0');
    c.globalAlpha = 1;
  }
  glow(c, 128, GROUND_Y - 30 * k, 40 * k, '#c8f090', 0.35 * (1 - p * 0.6));
}

window.SPR = {
  W, H, GROUND_Y, CANOPY, TWIGS, SEASON, SEASON_NAMES, TROPHY_ART, HALL,
  px, dot, pcircle, pellipse, glow, mix, mulberry, star, quant,
  isNight, darkness, trunkHalfWidth, hallSlotPos, hallWidth,
  drawBackdrop, drawBokeh, drawGround, drawForeground, drawFrameFoliage,
  drawTree, drawWatchers, drawSquirrel, drawGroundItems, drawParticles,
  drawFireOnTree, drawFireGlow, drawPond, drawOverlay, drawAshScene, drawStump, drawItemIcon, drawLeafSprite,
  drawHall, drawTrophy, drawPlinth, drawHeaven, drawHeavenBackdrop, drawGhostTree, drawSoul,
  drawCloudTunnel, drawLetterbox, drawRays, drawGrowingTree, flame
};
