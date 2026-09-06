/* =========================================================================
   THE WISE OAK TREE — pixel renderer
   Everything is drawn at 256x192 logical pixels with fillRect only, then
   scaled up with image-rendering:pixelated. No image assets, no libraries.
   ========================================================================= */

const W = 256, H = 192;      // logical resolution
const GROUND_Y = 150;        // horizon / grass line

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

function hex2rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function rgb2hex(r) { return '#' + r.map(v => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2hex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}

/* deterministic pseudo random, so the tree looks the same every frame */
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
  day:   ['#79c7f2', '#9adaf7', '#c4ecfb', '#e6f7fd'],
  dusk:  ['#3b2a5e', '#8a4a72', '#e0755c', '#f6b26b'],
  night: ['#0b1030', '#141a45', '#1e2a5c', '#2b3a72'],
  dawn:  ['#4a3a72', '#b06a86', '#f0956f', '#ffd9a0']
};

const SEASON = {
  spring: { hi: '#8fd95a', mid: '#5fae3c', low: '#3a7a28', dark: '#245018', accent: '#ffb7d5' },
  summer: { hi: '#6cc73f', mid: '#45962c', low: '#2d6b1f', dark: '#194513', accent: '#e8f36b' },
  autumn: { hi: '#f0b429', mid: '#d97a24', low: '#a8481a', dark: '#6d2c10', accent: '#e8532e' },
  winter: { hi: '#c9d6e3', mid: '#9fb2c6', low: '#7d8fa3', dark: '#5b6b7d', accent: '#ffffff' }
};
const SEASON_NAMES = ['spring', 'summer', 'autumn', 'winter'];

/* Sky colours for a time value 0..1 (0 = dawn, .25 = noon, .5 = dusk, .75 = night) */
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

/* ---------------- canopy generation ---------------- */
/* Blob list is generated once; each blob has a burn order so fire eats the
   canopy from the inside outward in a stable, believable way. */
function makeCanopy(seed) {
  const rnd = mulberry(seed);
  const blobs = [];
  const cx = 128, cy = 62, rx = 58, ry = 32;
  for (let i = 0; i < 42; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.pow(rnd(), 0.55);
    const x = cx + Math.cos(a) * rx * d;
    const y = cy + Math.sin(a) * ry * d;
    blobs.push({ x, y, r: 10 + rnd() * 8, s: rnd(), ph: rnd() * 6.28 });
  }
  // big anchor blobs so the silhouette reads as one mass
  blobs.push({ x: 128, y: 58, r: 30, s: 0.4, ph: 0 });
  blobs.push({ x: 100, y: 66, r: 22, s: 0.6, ph: 1 });
  blobs.push({ x: 156, y: 66, r: 22, s: 0.6, ph: 2 });
  blobs.sort((a, b) => a.y - b.y);
  blobs.forEach((b, i) => { b.burn = i / blobs.length; });
  return blobs;
}

const CANOPY = makeCanopy(1337);

/* ---------------- branches ---------------- */
const BRANCHES = [
  [[128, 104], [112, 92], [96, 80], [86, 70]],
  [[128, 104], [144, 92], [160, 80], [170, 68]],
  [[128, 100], [126, 84], [120, 68], [112, 56]],
  [[128, 100], [132, 82], [140, 66], [148, 54]],
  [[128, 98],  [128, 78], [128, 60], [128, 46]]
];

/* Winter twigs: forks growing out of every branch tip, so the bare tree still
   reads as an oak instead of a set of stumps. */
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

/* ---------------- scene pieces ---------------- */

function quant(hex, q) {
  const r = hex2rgb(hex);
  return rgb2hex(r.map(v => Math.round(v / q) * q));
}

/* Sky rows are expensive to compute (lots of colour mixing) so they are
   cached and only rebuilt when the clock has moved a meaningful amount. */
let skyCache = { key: -1, rows: null };
function skyRows(t) {
  const key = Math.round(t * 800);
  if (skyCache.key === key) return skyCache.rows;
  const bands = skyBands(t);
  const rows = new Array(GROUND_Y);
  for (let y = 0; y < GROUND_Y; y++) {
    const f = y / (GROUND_Y - 1) * 3;
    const i = Math.min(2, Math.floor(f));
    rows[y] = quant(mix(bands[i], bands[i + 1], f - i), 10);
  }
  skyCache = { key, rows };
  return rows;
}

function drawSky(c, g) {
  const rows = skyRows(g.timeOfDay);
  let prev = null;
  for (let y = 0; y < GROUND_Y; y++) {
    px(c, 0, y, W, 1, rows[y]);
    // single-row checkerboard on each colour step keeps the retro feel
    // without turning the whole sky into a band of noise
    if (prev && prev !== rows[y]) for (let x = y % 2; x < W; x += 2) dot(c, x, y - 1, rows[y]);
    prev = rows[y];
  }

  if (isNight(g.timeOfDay)) {
    const rnd = mulberry(7);
    for (let i = 0; i < 60; i++) {
      const x = Math.floor(rnd() * W), y = Math.floor(rnd() * 110);
      const tw = 0.55 + 0.45 * Math.sin(g.t * 2 + i);
      if (tw > 0.7) dot(c, x, y, tw > 0.93 ? '#ffffff' : '#b9c9ff');
    }
  }

  // sun / moon on a slow arc
  const ang = Math.PI * (g.timeOfDay * 2 % 2);
  const sx = 20 + (1 - Math.cos(ang)) * 108;
  const sy = 118 - Math.sin(ang) * 88;
  if (!isNight(g.timeOfDay)) {
    pcircle(c, sx, sy, 9, '#fff4c2'); pcircle(c, sx, sy, 7, '#ffe066');
  } else {
    pcircle(c, W - sx, sy, 8, '#e9eeff');
    pcircle(c, W - sx - 4, sy - 3, 6, rows[Math.max(0, Math.min(GROUND_Y - 1, Math.round(sy - 3)))]);
  }
}

function drawClouds(c, g) {
  const night = isNight(g.timeOfDay);
  const col = night ? '#2c3a6e' : '#ffffff';
  const col2 = night ? '#222e58' : '#dcefff';
  const list = [[0, 26, 1.0], [90, 44, 0.6], [180, 20, 0.8], [140, 60, 0.4]];
  for (const [ox, oy, sp] of list) {
    const x = ((ox + g.t * 5 * sp) % (W + 70)) - 40;
    pcircle(c, x, oy, 7, col); pcircle(c, x + 9, oy - 3, 9, col);
    pcircle(c, x + 20, oy, 7, col); px(c, x - 6, oy, 30, 6, col);
    pcircle(c, x + 9, oy + 2, 7, col2);
  }
}

function drawHills(c, g) {
  const night = isNight(g.timeOfDay);
  const winter = g.season === 'winter';
  let far = night ? '#1d3a2e' : mix('#6ea86a', '#3b6b52', 0.4);
  let near = night ? '#16302a' : '#4e8a4a';
  if (winter) { far = night ? '#4a5a6a' : '#dbe6ef'; near = night ? '#3a4a5a' : '#c3d3e0'; }
  for (let x = 0; x < W; x++) {
    const y1 = GROUND_Y - 14 - Math.round(Math.sin(x / 26) * 5 + Math.sin(x / 11) * 2);
    px(c, x, y1, 1, GROUND_Y - y1, far);
    const y2 = GROUND_Y - 6 - Math.round(Math.sin(x / 17 + 2) * 4);
    px(c, x, y2, 1, GROUND_Y - y2, near);
  }
  // distant tiny trees
  const rnd = mulberry(22);
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(rnd() * W), h = 5 + Math.floor(rnd() * 5);
    if (x > 84 && x < 176) continue;
    const y = GROUND_Y - 13;
    px(c, x, y, 1, h, night ? '#102420' : '#2f5a3c');
    pcircle(c, x, y - 2, 3, winter ? (night ? '#5a6a7a' : '#eaf2f8') : (night ? '#14302a' : '#3d7a4a'));
  }
}

function drawGround(c, g) {
  const night = isNight(g.timeOfDay);
  const s = SEASON[g.season];
  let grass = night ? '#20452f' : '#57a04b';
  let grass2 = night ? '#193a27' : '#478c3e';
  let dirt = night ? '#2a2018' : '#6b4a2e';
  if (g.season === 'winter') { grass = night ? '#5a6a7a' : '#e6eef5'; grass2 = night ? '#4a5a6a' : '#cfdce8'; }
  if (g.season === 'autumn' && !night) { grass = '#8a9b46'; grass2 = '#78883c'; }
  px(c, 0, GROUND_Y, W, H - GROUND_Y, grass);
  px(c, 0, GROUND_Y + 12, W, H - GROUND_Y - 12, grass2);
  px(c, 0, GROUND_Y + 26, W, H, dirt);
  // grass tufts
  const rnd = mulberry(9);
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rnd() * W), y = GROUND_Y + 1 + Math.floor(rnd() * 22);
    dot(c, x, y, mix(grass2, s.dark, 0.25));
  }
}

/* ------------- the tree ------------- */

function trunkHalfWidth(y) {
  // y from 150 (base) up to 96 (crown)
  const k = (GROUND_Y - y) / 56;               // 0 at base .. 1 at top
  return Math.max(5, 16 - k * 10);
}

function drawTree(c, g) {
  const s = SEASON[g.season];
  const night = isNight(g.timeOfDay);
  const sway = Math.sin(g.t * 0.9) * 1.6 + Math.sin(g.t * 2.3) * 0.5;
  const shake = g.shake > 0 ? (Math.random() * 2 - 1) * g.shake : 0;
  const burn = g.burn;                          // 0..1
  const dead = g.dead;

  let bark = night ? '#3a2c22' : '#6b4a30';
  let barkHi = night ? '#4a3a2c' : '#8a6141';
  let barkLo = night ? '#241a14' : '#4a3220';
  if (dead) { bark = '#4a4a4a'; barkHi = '#5c5c5c'; barkLo = '#333333'; }
  if (burn > 0) {
    const k = Math.min(1, burn * 1.4);
    bark = mix(bark, '#2a2020', k); barkHi = mix(barkHi, '#3a2a26', k); barkLo = mix(barkLo, '#140f0f', k);
  }

  // shadow: a flat ellipse that hugs the ground, never the sky
  c.globalAlpha = 0.20;
  for (let y = 0; y <= 11; y++) {
    const hw = Math.round(Math.sqrt(Math.max(0, 1 - (y / 11) ** 2)) * 46);
    if (hw > 0) px(c, 128 - hw, GROUND_Y + 2 + y, hw * 2, 1, '#000000');
  }
  c.globalAlpha = 1;

  // roots: buttresses that flare smoothly out of the trunk base
  for (const dir of [-1, 1]) {
    for (let i = 0; i < 18; i++) {
      const h = Math.max(1, 8 - i * 0.42);
      const x = 128 + dir * (12 + i) - (dir < 0 ? 2 : 0);
      px(c, x, GROUND_Y + 4 - h, 2, h, i < 3 ? bark : barkLo);
    }
    // one root that dives under the grass
    px(c, 128 + dir * 30 - (dir < 0 ? 4 : 0), GROUND_Y + 3, 4, 2, barkLo);
  }

  // trunk
  for (let y = GROUND_Y + 2; y > 92; y--) {
    const k = (GROUND_Y - y) / 56;
    const hw = trunkHalfWidth(y);
    const off = (shake + sway * k * 0.7);
    const x = 128 + off - hw;
    px(c, x, y, hw * 2, 1, bark);
    px(c, x, y, 2, 1, barkLo);
    px(c, x + hw * 2 - 3, y, 3, 1, barkHi);
  }
  // bark texture
  const rnd = mulberry(5);
  for (let i = 0; i < 46; i++) {
    const y = 96 + Math.floor(rnd() * 54);
    const hw = trunkHalfWidth(y);
    const k = (GROUND_Y - y) / 56;
    const x = 128 + (shake + sway * k * 0.7) + Math.floor((rnd() * 2 - 1) * (hw - 3));
    px(c, x, y, 1, 2 + Math.floor(rnd() * 3), rnd() > 0.5 ? barkLo : barkHi);
  }

  // branches
  for (const b of BRANCHES) {
    for (let i = 0; i < b.length - 1; i++) {
      const w = 5 - i;
      const [x1, y1] = b[i], [x2, y2] = b[i + 1];
      const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
      for (let sI = 0; sI <= steps; sI++) {
        const p = sI / steps;
        const k = (GROUND_Y - (y1 + (y2 - y1) * p)) / 56;
        const ox = shake + sway * k * 0.9;
        px(c, x1 + (x2 - x1) * p + ox - w / 2, y1 + (y2 - y1) * p, w, w, bark);
      }
    }
  }

  // canopy
  if (!dead && g.season === 'winter') {
    drawWinterCrown(c, g, sway, shake, bark, barkHi);
  } else if (!dead) {
    const leafCount = 1;
    let hi = s.hi, mid = s.mid, low = s.low, dk = s.dark;
    if (night) {
      hi = mix(hi, '#0d2b3a', 0.62); mid = mix(mid, '#0a2230', 0.66);
      low = mix(low, '#07161f', 0.70); dk = mix(dk, '#050f16', 0.72);
    }
    const live = [];
    for (const bl of CANOPY) {
      if (burn > 0 && bl.burn < burn) continue;               // burned away
      if (bl.s > leafCount) continue;
      const k = (GROUND_Y - bl.y) / 56;
      bl._ox = shake + sway * k * 1.1 + Math.sin(g.t * 1.3 + bl.ph) * 0.8;
      live.push(bl);
    }
    const charOf = bl => burn > 0 ? Math.max(0, 1 - (bl.burn - burn) / 0.22) : 0;
    for (const bl of live) pcircle(c, bl.x + bl._ox, bl.y + 1, bl.r + 1, mix(dk, '#1a0f0a', charOf(bl)));
    for (const bl of live) pcircle(c, bl.x + bl._ox, bl.y, bl.r, mix(low, '#3d1c10', charOf(bl)));
    for (const bl of live) pcircle(c, bl.x + bl._ox - 1, bl.y - 2, bl.r - 3, mix(mid, '#5c2a14', charOf(bl)));
    for (const bl of live) if (bl.y < 72) pcircle(c, bl.x + bl._ox - 2, bl.y - 5, Math.max(2, bl.r - 7), mix(hi, '#7a3a18', charOf(bl)));
    for (const bl of live) if (bl.s > 0.72 && charOf(bl) < 0.3) dot(c, bl.x + bl._ox + 3, bl.y + 2, s.accent);
  } else {
    // charred stubs
    for (const bl of CANOPY) {
      if (bl.s > 0.14) continue;
      pcircle(c, bl.x, bl.y, 2, '#2a2422');
    }
  }

  drawFace(c, g, sway, shake, burn, dead);

  // mushroom hat, worn on top of the crown
  if (g.flags.hatOn && !dead) {
    const hx = Math.round(128 + sway * 1.4), hy = 34;
    for (let y = 0; y <= 13; y++) {
      const hw = Math.round(Math.sqrt(Math.max(0, 1 - (y / 13) ** 2)) * 17);
      px(c, hx - hw, hy - y, hw * 2, 1, y > 9 ? '#e05c4e' : '#c9453b');
    }
    px(c, hx - 17, hy + 1, 34, 2, '#a83229');          // rim
    px(c, hx - 15, hy + 3, 30, 2, '#f0e2cc');          // gills
    pcircle(c, hx - 7, hy - 7, 3, '#ffe9dd');
    pcircle(c, hx + 6, hy - 4, 2, '#ffe9dd');
    pcircle(c, hx + 1, hy - 11, 2, '#ffe9dd');
  }
}

function drawWinterCrown(c, g, sway, shake, bark, barkHi) {
  const snow = '#f2f7fb', snowLo = '#cfdde8';
  const off = y => shake + sway * ((GROUND_Y - y) / 56) * 1.05;
  for (const [x1, y1, x2, y2] of TWIGS) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) | 0;
    for (let i = 0; i <= steps; i++) {
      const p = i / Math.max(1, steps);
      const x = x1 + (x2 - x1) * p, y = y1 + (y2 - y1) * p;
      px(c, x + off(y), y, 2, 2, bark);
      px(c, x + off(y), y - 1, 2, 1, snow);          // snow sits on top
    }
  }
  // snow along the main branches
  for (const b of BRANCHES) {
    for (let i = 0; i < b.length - 1; i++) {
      const [x1, y1] = b[i], [x2, y2] = b[i + 1];
      // snow only settles on branches flat enough to hold it
      if (Math.abs(y2 - y1) > Math.abs(x2 - x1)) continue;
      const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) | 0;
      for (let sI = 0; sI <= steps; sI++) {
        const p = sI / Math.max(1, steps);
        const x = x1 + (x2 - x1) * p, y = y1 + (y2 - y1) * p;
        px(c, x + off(y) - 2, y - 3, 4, 2, sI % 5 === 0 ? snowLo : snow);
      }
    }
  }
  // the handful of dead leaves that never let go
  const rnd = mulberry(404);
  for (let i = 0; i < 9; i++) {
    const t = TWIGS[Math.floor(rnd() * TWIGS.length)];
    const x = t[2] + Math.sin(g.t * 2 + i) * 1.2, y = t[3];
    drawLeafSprite(c, x + off(y) - 3, y, '#8a5a2a', '#5c3a18');
  }
  // snow cap on the trunk shoulders
  px(c, 122 + off(96), 94, 12, 2, snow);
}

function drawFace(c, g, sway, shake, burn, dead) {
  const fy = 116;
  const k = (GROUND_Y - fy) / 56;
  const ox = 128 + shake + sway * k * 0.7;
  const dark = dead ? '#1e1e1e' : '#2b1c10';
  const white = dead ? '#7a7a7a' : '#f4ead6';
  const mood = g.mood;
  const blink = g.blink > 0;

  // eye sockets
  for (const ex of [-9, 9]) {
    pcircle(c, ox + ex, fy, 5, '#3f2a19');
    if (blink || mood === 'sleepy') {
      px(c, ox + ex - 4, fy, 9, 2, dark);
    } else {
      pcircle(c, ox + ex, fy, 4, white);
      let px_ = g.look.x * 2, py_ = g.look.y * 2;
      if (mood === 'shock') { pcircle(c, ox + ex, fy, 4, white); }
      pcircle(c, ox + ex + px_, fy + py_, mood === 'shock' ? 1 : 2, dark);
    }
  }
  // brows
  if (mood === 'sad')      { px(c, ox - 15, fy - 8, 7, 2, dark); px(c, ox + 8, fy - 8, 7, 2, dark); px(c, ox - 15, fy - 7, 3, 2, dark); px(c, ox + 12, fy - 7, 3, 2, dark); }
  else if (mood === 'smug'){ px(c, ox - 15, fy - 9, 8, 2, dark); px(c, ox + 8, fy - 7, 8, 2, dark); }
  else if (mood === 'shock'){ px(c, ox - 15, fy - 11, 8, 2, dark); px(c, ox + 8, fy - 11, 8, 2, dark); }
  else                     { px(c, ox - 15, fy - 8, 8, 2, dark); px(c, ox + 8, fy - 8, 8, 2, dark); }

  // nose knot
  pcircle(c, ox, fy + 6, 3, '#54381f');
  pcircle(c, ox - 1, fy + 5, 2, '#6b4a2a');

  // mouth
  const my = fy + 14;
  if (g.talking) {
    const open = 2 + Math.floor(Math.abs(Math.sin(g.t * 14)) * 4);
    px(c, ox - 6, my - 1, 13, open, dark);
    px(c, ox - 4, my + open - 2, 9, 2, '#8c3f3f');
  } else if (mood === 'happy') {
    px(c, ox - 7, my, 15, 2, dark); px(c, ox - 9, my - 2, 2, 2, dark); px(c, ox + 8, my - 2, 2, 2, dark);
  } else if (mood === 'sad') {
    px(c, ox - 7, my + 2, 15, 2, dark); px(c, ox - 9, my, 2, 2, dark); px(c, ox + 8, my, 2, 2, dark);
  } else if (mood === 'shock') {
    pcircle(c, ox, my + 1, 4, dark); pcircle(c, ox, my + 2, 2, '#8c3f3f');
  } else if (mood === 'smug') {
    px(c, ox - 2, my, 10, 2, dark); px(c, ox + 8, my - 2, 2, 2, dark);
  } else {
    px(c, ox - 6, my, 13, 2, dark);
  }
  if (dead) { // x eyes
    for (const ex of [-9, 9]) {
      for (let i = -3; i <= 3; i++) { dot(c, ox + ex + i, fy + i, '#111'); dot(c, ox + ex + i, fy - i, '#111'); }
    }
  }
}

/* ------------- squirrel ------------- */
function drawSquirrel(c, g) {
  const s = g.squirrel;
  if (!s.active) return;
  const x = Math.round(s.x), y = Math.round(s.y);
  const night = isNight(g.timeOfDay);
  const body = night ? '#6b4a34' : '#a9713f';
  const belly = night ? '#a08a70' : '#e8cfa8';
  const dark = night ? '#3a2718' : '#6d4423';
  const hop = s.moving ? Math.abs(Math.sin(g.t * 12)) * 2 : 0;
  const yy = y - hop;
  const f = s.face || 0;

  // tail (big, curls up behind)
  const tw = Math.sin(g.t * 6) * 1;
  pcircle(c, x - 7 * s.dir, yy - 5 + tw, 5, dark);
  pcircle(c, x - 8 * s.dir, yy - 9 + tw, 4, body);
  pcircle(c, x - 6 * s.dir, yy - 12 + tw, 3, body);
  // body
  pcircle(c, x, yy - 3, 5, body);
  pcircle(c, x + 1 * s.dir, yy - 2, 3, belly);
  // head
  pcircle(c, x + 4 * s.dir, yy - 8, 4, body);
  px(c, x + 2 * s.dir, yy - 12, 2, 3, body);      // ears
  px(c, x + 6 * s.dir, yy - 12, 2, 3, body);
  // face
  dot(c, x + 6 * s.dir, yy - 9, '#111');
  dot(c, x + 7 * s.dir, yy - 7, '#111');
  if (f === 1) { px(c, x + 5 * s.dir, yy - 6, 3, 1, '#111'); }   // grin
  // legs
  px(c, x - 1, yy + 1, 2, 2, dark); px(c, x + 3, yy + 1, 2, 2, dark);
  // held item
  if (s.holding) drawItemIcon(c, x + 8 * s.dir, yy - 4, s.holding);
}

/* ------------- items ------------- */
function drawLeafSprite(c, x, y, col, col2, rot) {
  // little oak leaf, 7x6
  px(c, x + 1, y, 4, 1, col);
  px(c, x, y + 1, 6, 1, col);
  px(c, x, y + 2, 7, 1, col);
  px(c, x + 1, y + 3, 5, 1, col2);
  px(c, x + 2, y + 4, 3, 1, col2);
  px(c, x + 3, y + 4, 1, 2, '#6b4a30');
}

function drawItemIcon(c, x, y, id) {
  switch (id) {
    case 'acorn':
      pcircle(c, x, y + 1, 3, '#d9a05b'); px(c, x - 3, y - 3, 7, 3, '#6b4a2a'); px(c, x, y - 5, 1, 2, '#4a3220'); break;
    case 'hat':
      pcircle(c, x, y, 4, '#c9453b'); px(c, x - 4, y, 9, 2, '#c9453b'); dot(c, x - 1, y - 2, '#fff'); break;
    case 'can':
      px(c, x - 3, y - 2, 6, 5, '#8a9aa8'); px(c, x + 3, y - 3, 4, 2, '#8a9aa8'); px(c, x - 5, y - 1, 2, 3, '#6d7c88'); break;
    case 'paper':
      px(c, x - 4, y - 3, 8, 7, '#e8e2d0'); px(c, x - 3, y - 2, 6, 1, '#5a5a5a'); px(c, x - 3, y, 6, 1, '#8a8a8a'); px(c, x - 3, y + 2, 4, 1, '#8a8a8a'); break;
    case 'lighter':
      px(c, x - 2, y - 2, 5, 7, '#d64545'); px(c, x - 2, y - 4, 5, 2, '#c9c9c9'); dot(c, x, y - 5, '#ffcf4a'); break;
    case 'diary':
      px(c, x - 4, y - 3, 8, 7, '#6b4a8a'); px(c, x - 4, y - 3, 2, 7, '#4a3060'); dot(c, x + 1, y, '#e8d24a'); break;
    case 'leaf':
      drawLeafSprite(c, x - 3, y - 3, '#5fae3c', '#3a7a28'); break;
  }
}

function drawGroundItems(c, g) {
  for (const it of g.groundLeaves) {
    const bob = it.landed ? Math.sin(g.t * 3 + it.ph) * 0.5 : 0;
    drawLeafSprite(c, it.x, it.y + bob, it.col, it.col2);
  }
  for (const sp of g.saplings) {
    const h = Math.min(18, sp.age * 0.6);
    const sway = Math.sin(g.t * 1.6 + sp.ph) * 1;
    px(c, sp.x, GROUND_Y + 4 - h, 2, h, '#5a7a32');
    pcircle(c, sp.x + sway, GROUND_Y + 3 - h, 2 + h * 0.22, '#6cc73f');
    pcircle(c, sp.x + sway - 1, GROUND_Y + 2 - h, 1 + h * 0.16, '#8fd95a');
  }
}

/* ------------- particles / fx ------------- */
function drawParticles(c, g) {
  for (const p of g.particles) {
    if (p.kind === 'leaf') { drawLeafSprite(c, p.x, p.y, p.col, p.col2); }
    else if (p.kind === 'fire') {
      const cols = ['#ffe066', '#ffa726', '#ef5330', '#8c2b18'];
      const col = cols[Math.min(3, Math.floor((1 - p.life / p.max) * 4))];
      px(c, p.x, p.y, p.s, p.s, col);
    } else if (p.kind === 'smoke') {
      c.globalAlpha = Math.max(0, p.life / p.max) * 0.5;
      px(c, p.x, p.y, p.s, p.s, '#8a8a8a'); c.globalAlpha = 1;
    } else if (p.kind === 'heart') {
      const col = '#ff6b8a';
      px(c, p.x, p.y + 1, 5, 3, col); px(c, p.x + 1, p.y, 1, 1, col); px(c, p.x + 3, p.y, 1, 1, col); px(c, p.x + 2, p.y + 4, 1, 1, col);
    } else if (p.kind === 'drop') {
      px(c, p.x, p.y, 1, 3, '#7ec8f2');
    } else if (p.kind === 'spark') {
      px(c, p.x, p.y, 1, 1, '#ffe9a0');
    } else if (p.kind === 'star') {
      c.globalAlpha = Math.max(0, p.life / p.max);
      px(c, p.x, p.y, 1, 1, '#ffffff'); c.globalAlpha = 1;
    }
  }
}

function flame(c, x, y, h, seed) {
  // a little tapering tongue of fire: dark base, orange body, yellow tip
  const wob = Math.sin(seed * 3.1 + y * 0.4) * 1.5;
  for (let i = 0; i < h; i++) {
    const p = i / h;
    const w = Math.max(1, Math.round((1 - p) * 5));
    const col = p < 0.25 ? '#8c2b18' : p < 0.55 ? '#ef5330' : p < 0.8 ? '#ffa726' : '#ffe066';
    px(c, Math.round(x - w / 2 + wob * p), Math.round(y - i), w, 1, col);
  }
}

function drawFireOnTree(c, g) {
  if (g.burn <= 0 || g.dead) return;
  const rnd = mulberry(Math.floor(g.t * 10));
  const front = g.burn;

  // flames along the burn front in the canopy
  for (const bl of CANOPY) {
    if (bl.burn < front || bl.burn > front + 0.2) continue;
    const n = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const fx = bl.x + (rnd() * 2 - 1) * bl.r * 0.8;
      const fy = bl.y + (rnd() * 2 - 1) * bl.r * 0.4;
      flame(c, fx, fy, 5 + Math.floor(rnd() * 7), g.t + i);
    }
  }

  // fire climbing the trunk, taller as the burn advances
  const climb = Math.min(1, g.burn * 1.7);
  for (let i = 0; i < 10 + climb * 16; i++) {
    const y = GROUND_Y + 2 - rnd() * 56 * climb;
    const hw = trunkHalfWidth(y);
    const x = 128 + (rnd() * 2 - 1) * hw;
    flame(c, x, y, 4 + Math.floor(rnd() * 8), g.t + i * 0.7);
  }
  // glowing embers at the base
  for (let i = 0; i < 16; i++) {
    px(c, 112 + rnd() * 32, GROUND_Y + rnd() * 4, 1, 1, rnd() > 0.5 ? '#ffd24a' : '#ef5330');
  }
}

/* ------------- vignette / weather overlays ------------- */
function drawOverlay(c, g) {
  if (g.season === 'winter') {
    const rnd = mulberry(3);
    for (let i = 0; i < 50; i++) {
      const sx = (rnd() * W + g.t * (6 + rnd() * 8)) % W;
      const sy = (rnd() * H + g.t * (10 + rnd() * 10)) % H;
      dot(c, sx, sy, '#ffffff');
    }
  }
  if (g.raining > 0) {
    const rnd = mulberry(11);
    for (let i = 0; i < 60; i++) {
      const sx = (rnd() * W + g.t * 30) % W;
      const sy = (rnd() * H + g.t * 160) % H;
      px(c, sx, sy, 1, 3, '#9ad4f2');
    }
  }
  if (g.flash > 0) { c.globalAlpha = Math.min(1, g.flash); px(c, 0, 0, W, H, '#ffffff'); c.globalAlpha = 1; }
}

/* ------------- heaven scene ------------- */
function drawHeaven(c, g) {
  // bright layered clouds
  px(c, 0, 0, W, H, '#cfe8ff');
  px(c, 0, 60, W, H, '#e6f2ff');
  px(c, 0, 120, W, H, '#f7fbff');
  const rnd = mulberry(41);
  for (let i = 0; i < 26; i++) {
    const x = (rnd() * (W + 60) + g.t * (2 + rnd() * 6)) % (W + 60) - 30;
    const y = rnd() * H;
    const r = 6 + rnd() * 12;
    pcircle(c, x, y, r, '#ffffff');
    pcircle(c, x + 6, y + 2, r * 0.7, '#eaf4ff');
  }
  // light rays
  for (let i = 0; i < 7; i++) {
    const x = 20 + i * 34 + Math.sin(g.t * 0.4 + i) * 6;
    c.globalAlpha = 0.16; px(c, x, 0, 8, H, '#ffffff'); c.globalAlpha = 1;
  }

  const fy = 104 + Math.sin(g.t * 1.1) * 3;      // trunk base
  const OUT = '#8fb8cf';                          // outline: everything needs
  const LEAF_OUT = '#7fc0a4';                     // one, or it vanishes on white

  // the cloud he is standing on
  pcircle(c, 128, fy + 16, 26, '#ffffff');
  pcircle(c, 106, fy + 18, 16, '#ffffff');
  pcircle(c, 150, fy + 18, 16, '#ffffff');
  pcircle(c, 128, fy + 20, 30, '#eef6ff');

  // wings: four feathers per side, fanned up and back
  const wf = Math.sin(g.t * 3) * 3;
  const feather = (dir, f, col, inset) => {
    const a = -0.42 - f * 0.30;
    const len = 30 - f * 4;
    for (let i = 0; i < len; i++) {
      const r = Math.max(1, (5 - i * 0.11) - inset);
      if (r <= 0) continue;
      pcircle(c, 128 + dir * (13 + Math.cos(a) * i), fy - 14 + Math.sin(a) * i + f * 5 + wf, r, col);
    }
  };
  for (const dir of [-1, 1]) {
    for (let f = 0; f < 4; f++) feather(dir, f, '#a8c4dd', -1);
    for (let f = 0; f < 4; f++) feather(dir, f, '#ffffff', 0);
    for (let f = 0; f < 4; f++) feather(dir, f, '#eaf3ff', 2);
  }

  // trunk
  for (let y = fy + 16; y > fy - 30; y--) {
    const k = (fy + 16 - y) / 46;
    const hw = Math.round(12 - k * 5);
    px(c, 128 - hw - 1, y, hw * 2 + 2, 1, OUT);
    px(c, 128 - hw, y, hw * 2, 1, '#d6e8f2');
    px(c, 128 - hw, y, 2, 1, '#b6cfdd');
    px(c, 128 + hw - 2, y, 2, 1, '#eef8ff');
  }
  // little root flare resting on the cloud
  for (const dir of [-1, 1]) for (let i = 0; i < 8; i++) {
    const h = Math.max(1, 5 - i * 0.6);
    px(c, 128 + dir * (11 + i) - (dir < 0 ? 2 : 0), fy + 17 - h, 2, h, '#c2dae8');
  }

  // canopy, sitting directly on top of the trunk
  const cy = fy - 50;
  const blobs = CANOPY.filter(b => b.s < 0.58 && Math.abs(b.x - 128) < 44);
  for (const bl of blobs) {
    const bx = 128 + (bl.x - 128) * 0.58, by = cy + (bl.y - 62) * 0.55;
    pcircle(c, bx, by, bl.r * 0.6 + 1, LEAF_OUT);
  }
  for (const bl of blobs) {
    const bx = 128 + (bl.x - 128) * 0.58, by = cy + (bl.y - 62) * 0.55;
    pcircle(c, bx, by, bl.r * 0.6, '#a8ddc0');
  }
  for (const bl of blobs) {
    const bx = 128 + (bl.x - 128) * 0.58, by = cy + (bl.y - 62) * 0.55;
    pcircle(c, bx - 1, by - 2, Math.max(2, bl.r * 0.6 - 4), '#d2f2e0');
  }

  // blissful face
  const ox = 128, ey = fy - 10;
  for (const ex of [-6, 6]) {
    px(c, ox + ex - 4, ey, 9, 2, '#3a5a6a');
    px(c, ox + ex - 4, ey - 2, 3, 2, '#3a5a6a');
    px(c, ox + ex + 2, ey - 2, 3, 2, '#3a5a6a');
  }
  px(c, ox - 5, ey + 8, 11, 2, '#3a5a6a');
  px(c, ox - 7, ey + 6, 2, 2, '#3a5a6a');
  px(c, ox + 6, ey + 6, 2, 2, '#3a5a6a');
  dot(c, ox - 12, ey + 5, '#ffb3c0'); dot(c, ox - 11, ey + 5, '#ffb3c0');
  dot(c, ox + 12, ey + 5, '#ffb3c0'); dot(c, ox + 11, ey + 5, '#ffb3c0');

  // halo
  const hy = cy - 26 + Math.sin(g.t * 1.6) * 2;
  for (let a = 0; a < 40; a++) {
    const ang = a / 40 * Math.PI * 2;
    px(c, 128 + Math.cos(ang) * 18 - 1, hy + Math.sin(ang) * 6, 2, 2, '#ffd24a');
    dot(c, 128 + Math.cos(ang) * 17, hy + Math.sin(ang) * 5.2, '#fff3b0');
  }

  // sparkles last, over everything
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H);
    if (Math.sin(g.t * 3 + i) > 0.8) { dot(c, x, y, '#ffffff'); dot(c, x, y - 1, '#fffbe0'); }
  }
}

/* ------------- the morning after ------------- */
function drawAshScene(c, g) {
  // full sky, painted top to bottom so nothing shows through
  const bands = ['#1a1218', '#241a1e', '#332224', '#4a2e2a', '#6b3f31'];
  for (let y = 0; y < GROUND_Y; y++) {
    const f = y / (GROUND_Y - 1) * (bands.length - 1);
    const i = Math.min(bands.length - 2, Math.floor(f));
    px(c, 0, y, W, 1, mix(bands[i], bands[i + 1], f - i));
  }
  // hills in silhouette
  for (let x = 0; x < W; x++) {
    const y1 = GROUND_Y - 14 - Math.round(Math.sin(x / 26) * 5 + Math.sin(x / 11) * 2);
    px(c, x, y1, 1, GROUND_Y - y1, '#241a18');
    const y2 = GROUND_Y - 6 - Math.round(Math.sin(x / 17 + 2) * 4);
    px(c, x, y2, 1, GROUND_Y - y2, '#1c1412');
  }
  px(c, 0, GROUND_Y, W, H - GROUND_Y, '#241d1a');
  px(c, 0, GROUND_Y + 16, W, H, '#1a1513');

  // scorched ground around the stump
  c.globalAlpha = 0.6;
  for (let y = 0; y <= 10; y++) {
    const hw = Math.round(Math.sqrt(Math.max(0, 1 - (y / 10) ** 2)) * 52);
    if (hw > 0) px(c, 128 - hw, GROUND_Y + 2 + y, hw * 2, 1, '#0e0a09');
  }
  c.globalAlpha = 1;

  const rnd = mulberry(77);

  // the stump: broken off, still glowing at the heart
  for (let y = GROUND_Y + 4; y > GROUND_Y - 24; y--) {
    const k = (GROUND_Y - y) / 28;
    const hw = Math.round(16 - k * 4);
    px(c, 128 - hw, y, hw * 2, 1, '#2a2220');
    px(c, 128 - hw, y, 2, 1, '#171211');
    px(c, 128 + hw - 2, y, 2, 1, '#3a2f2c');
  }
  // jagged splintered top
  for (let i = 0; i < 12; i++) {
    const x = 116 + i * 2;
    const h = 2 + Math.floor(rnd() * 9);
    px(c, x, GROUND_Y - 24 - h, 2, h + 2, '#241d1b');
  }
  // root flare
  for (const dir of [-1, 1]) for (let i = 0; i < 14; i++) {
    const h = Math.max(1, 6 - i * 0.4);
    px(c, 128 + dir * (15 + i) - (dir < 0 ? 2 : 0), GROUND_Y + 4 - h, 2, h, '#1e1817');
  }
  // embers breathing in the heartwood
  const glow = 0.55 + 0.45 * Math.sin(g.t * 1.7);
  for (let i = 0; i < 16; i++) {
    const x = 116 + Math.floor(rnd() * 24), y = GROUND_Y - 22 + Math.floor(rnd() * 22);
    c.globalAlpha = glow * (0.4 + rnd() * 0.6);
    dot(c, x, y, rnd() > 0.5 ? '#ff8a3a' : '#d94a22');
    c.globalAlpha = 1;
  }

  // ash drifting up and away
  for (let i = 0; i < 70; i++) {
    const x = (rnd() * W + g.t * (3 + rnd() * 5)) % W;
    const y = (rnd() * H - g.t * (8 + rnd() * 14) + H * 3) % H;
    c.globalAlpha = 0.25 + rnd() * 0.4;
    dot(c, x, y, rnd() > 0.7 ? '#c9b8ae' : '#7a6a62');
    c.globalAlpha = 1;
  }
  // smoke column
  for (let i = 0; i < 22; i++) {
    const p = i / 22;
    const x = 128 + Math.sin(g.t * 0.8 + p * 4) * (4 + p * 16);
    c.globalAlpha = 0.22 * (1 - p);
    pcircle(c, x, GROUND_Y - 30 - p * 90, 3 + p * 9, '#8a7d76');
    c.globalAlpha = 1;
  }
}

window.SPR = {
  W, H, GROUND_Y, TWIGS, px, dot, pcircle, mix, mulberry, SEASON, SEASON_NAMES, CANOPY,
  drawSky, drawClouds, drawHills, drawGround, drawTree, drawSquirrel, drawGroundItems,
  drawParticles, drawFireOnTree, drawOverlay, drawHeaven, drawAshScene, drawItemIcon,
  drawLeafSprite, isNight, trunkHalfWidth
};
