/* =========================================================================
   THE WISE OAK TREE
   A very goofy game about a tree who has seen everything.
   ========================================================================= */
(function () {
'use strict';

const { H, GROUND_Y, px, dot, pcircle, mix, mulberry, SEASON_NAMES } = SPR;
/* W and CX change with the window, so they are read from SPR every time */
const W = () => SPR.W, CX = () => SPR.CX;
const SAVE_KEY = 'wiseoak.save.v3';

/* ---------------------------------------------------------------------
   SAVE
   --------------------------------------------------------------------- */
const defaultSave = () => ({
  ach: {}, endings: {}, heard: {}, muted: false, sessions: 0,
  park: { props: [], upgrades: {}, expansions: 0, earned: 0 },
  bag: false, items: {}, taken: {}, plans: {}, planDone: {},
  quests: {}, questDone: {}, unread: [], snails: {}, setSeen: {}, areasSeen: { oak: 1 },
  birds: {}, birdBook: false, metNoc: false,
  stats: { leavesTotal: 0, sneezes: 0, hugs: 0, waters: 0, plants: 0, trades: 0,
           sqChats: 0, rebirths: 0, flicks: 0, seasons: {}, boughtAll: false }
});

let save = defaultSave();
try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    const p = JSON.parse(raw);
    save = Object.assign(defaultSave(), p);
    save.stats = Object.assign(defaultSave().stats, p.stats || {});
    save.park = Object.assign(defaultSave().park, p.park || {});
    save.items = p.items || {}; save.taken = p.taken || {};
    save.plans = p.plans || {}; save.planDone = p.planDone || {};
    save.quests = p.quests || {}; save.questDone = p.questDone || {};
    save.unread = Array.isArray(p.unread) ? p.unread : [];
    save.snails = p.snails || {};
    save.setSeen = p.setSeen || {};
    save.areasSeen = Object.assign({ oak: 1 }, p.areasSeen || {});
    save.birds = p.birds || {}; save.birdBook = !!p.birdBook;
  }
} catch (e) { /* corrupt save: start fresh, no drama */ }

const hadSave = save.sessions > 0;
save.sessions++;

let saveTimer = 0;
let erased = false;     // once wiped, never write the old save back on unload
function persist() {
  if (erased) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
}

/* ---------------------------------------------------------------------
   STATE
   --------------------------------------------------------------------- */
const G = {
  t: 0, dt: 0, scene: 'game',            // game | burning | ash | heaven | title
  timeOfDay: 0.18, dayLen: 150,
  seasonIdx: 0, season: 'spring', seasonTimer: 0, seasonLen: 62,
  mood: 'idle', talking: false, blink: 0, blinkTimer: 2,
  look: { x: 0, y: 0 },
  shake: 0, flash: 0, raining: 0, burn: 0, dead: false,
  particles: [], groundLeaves: [], saplings: [],
  squirrel: { active: false, x: -20, y: GROUND_Y + 6, dir: 1, moving: false,
              targetX: 190, face: 0, holding: null, spawned: false, clicks: 0, clickT: 0 },
  flags: { hatOn: false, lighterGone: false, confirming: false, newsRead: false },
  inv: { leaves: 0, items: {} }, tools: [], holding: null, holdT: 0, critters: [],
  parkPending: 0, parkMotes: [], visitors: [], visitorTimer: 6, menu: null,
  // where you are standing, and the walk between places
  area: 3, areaFade: 0, areaFadeDir: 0, areaTitle: 0, arrows: [], pickups: [],
  suit: null, suitTimer: 40,
  noc: { x: 0, y: GROUND_Y + 8, look: 0, talking: 0, thinking: 0 },
  asleep: false, wakeT: 0, squash: 0, squashV: 0,
  boardPop: 0, cottagePop: 0,
  hasBag: false, bagOpen: false, bagHover: false, bagBadge: 0, talkHover: false, typing: false,
  activePlan: null, chatWho: null, veil: 0, toTell: [],
  hintText: '', hintShown: false, hintCine: false,
  sessionTime: 0, sinceTreeClick: 0, spamCount: 0, spamTimer: 0,
  sneezeTimer: 14 + Math.random() * 18,
  burnTimer: 0, burnStage: 0, deathTimer: 0, ascended: false,
  heavenTalk: 0, godIdx: 0, ghostIdx: 0,
  pendingEnding: null,
  // face performance
  stare: 0, stareTimer: 20 + Math.random() * 40, moodTimer: 0, stillBurning: false, fleeing: false,
  watchers: 0, watcherSeed: 1, watcherTimer: 40 + Math.random() * 60,
  // camera and cinematics
  cam: { x: 0, y: 5, z: 1.09, tx: 0, ty: 5, tz: 1.09 },
  cine: null, letterbox: 0,
  // the hall of trophies
  hall: { scroll: 0, target: 0, order: [], unlocked: {}, tier: {},
          dragIndex: -1, dragX: 0, dragY: 0, grabbed: false, hover: -1, from: 'heaven' },
  // heaven keeps every snail that ever brought you anything
  garden: { scroll: 0, target: 0, list: [], hover: -1 }
};

/* ---------------------------------------------------------------------
   HALL SETUP — the display order is the player's, and it is remembered
   --------------------------------------------------------------------- */
function buildHall() {
  const known = DATA.achievements.map(a => a.id);
  const seen = new Set();
  const order = [];
  for (const id of (save.hallOrder || [])) {
    if (known.includes(id) && !seen.has(id)) { order.push(id); seen.add(id); }
  }
  for (const id of known) if (!seen.has(id)) order.push(id);
  G.hall.order = order;
  G.hall.unlocked = {}; G.hall.tier = {};
  for (const a of DATA.achievements) {
    G.hall.unlocked[a.id] = !!save.ach[a.id];
    G.hall.tier[a.id] = a.kind;
  }
}

/* =========================================================================
   THE SETS
   Talking is the game. He does not hand over nine hundred years at once: each
   set of subjects opens when you have listened to enough of the last one, and
   he tells you when it happens.
   ========================================================================= */
function heardTotal() { return Object.keys(save.heard).length; }

function openSets() { return DATA.sets.filter(st => heardTotal() >= st.at); }

function unlockedTags() {
  const tags = {};
  for (const st of openSets()) for (const tg of st.tags) tags[tg] = 1;
  return tags;
}

function nextSet() { return DATA.sets.find(st => heardTotal() < st.at) || null; }

function setById(id) { return DATA.sets.find(st => st.id === id); }

/* how much of a set he has actually got through with you */
function setHeard(st) {
  return DATA.lines.filter(l => st.tags.includes(l.tag) && save.heard[l.id]).length;
}
function setTotal(st) {
  return DATA.lines.filter(l => st.tags.includes(l.tag)).length;
}

/* dialogue bag: never the same line twice, and never a line from a subject
   he has not opened yet */
let bag = [];
function refillBag() {
  const tags = unlockedTags();
  const pool = [];
  for (let i = 0; i < DATA.lines.length; i++) {
    const l = DATA.lines[i];
    if (!tags[l.tag]) continue;
    if (!save.heard[l.id]) pool.push(i);            // unheard first, always
  }
  if (!pool.length) {
    for (let i = 0; i < DATA.lines.length; i++) if (tags[DATA.lines[i].tag]) pool.push(i);
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  bag = pool;
}

/* crossing a threshold: he stops and introduces the new subject himself */
function checkSets() {
  const open = openSets();
  const next = open.find(st => !save.setSeen[st.id]);
  if (!next) return false;
  save.setSeen[next.id] = 1; persist();
  checkAreas();
  const idx = DATA.sets.indexOf(next);
  if (idx > 0) ACH('set' + Math.min(6, idx));
  if (DATA.sets.every(st => save.setSeen[st.id])) ACH('setall');
  if (!next.intro) return false;
  refillBag();
  SFX.ach(); G.flash = 0.35;
  squash(-0.3);
  ring(CX(), 108, '#fff6d8', 1.4);
  pop('NEW SET', CX(), 82, '#b8e86a');
  spawnParticles('star', CX(), 96, 10);
  say('THE WISE OAK TREE', next.intro, 'think', next.id === 'world' || next.id === 'power' ? 'serious' : '');
  pushNote('goal', next.name, 'A new set of things he will talk about. Keep him going.', 'mouth', 'set:' + next.id);
  return true;
}
refillBag();

/* ---------------------------------------------------------------------
   DOM
   --------------------------------------------------------------------- */
const $ = id => document.getElementById(id);
const cv = $('game'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

/* The scene is drawn 1:1 into this buffer and then blitted through the
   camera. Scaling the context directly leaves seams between the 1px rows
   every sprite is built from; blitting a finished frame does not. */
const buf = document.createElement('canvas');
const dc = buf.getContext('2d');
dc.imageSmoothingEnabled = false;

/* The only DOM left in the game is the canvas, the two captions, and one
   transparent input that exists purely to raise a keyboard on a phone. */

/* the one line of guidance the game ever shows, drawn in pixels */
const elHint = {
  set textContent(v) { G.hintText = v; },
  get textContent() { return G.hintText; },
  set className(v) { G.hintShown = v !== 'hidden'; G.hintCine = v === 'cine'; },
  classList: {
    add: (c) => { if (c === 'hidden') G.hintShown = false; },
    remove: (c) => { if (c === 'hidden') G.hintShown = true; },
    toggle: (c, on) => { if (c === 'hidden') G.hintShown = !on; }
  }
};
let started = false;

/* -------------------------------------------------------------------------
   THE MAIN MENU
   There is no menu. There is the wood, at night, with him asleep in the
   middle of it, and one line of pixels asking you to come in. It is drawn
   into the same canvas as the game, with the same renderer, so entering is
   a camera move rather than a screen change.
   ------------------------------------------------------------------------- */
const titleG = {
  t: 0, season: 'summer', timeOfDay: 0.74, mood: 'asleep', asleep: true, talking: false,
  blink: 1, blinkTimer: 999, look: { x: 0, y: 0.2 }, stare: 0, shake: 0,
  burn: 0, dead: false, flags: { hatOn: false }, watchers: 0,
  areaNow: 'oak', groundLeaves: [], saplings: [], critters: [], particles: [],
  parkMotes: [], visitors: [], raining: 0, muted: false,
  squirrel: { active: false }, inv: { leaves: 0, items: {} }, tools: []
};

/* the menu's own camera: a slow breath in, and a lunge on the way through */
const titleCam = { z: 1.16, y: -2, tz: 1.03, ty: 0 };
let dawn = 1;        // fades up from black on load
let leaving = 0;     // >0 once you have asked to go in

function seedTitleCritters() {
  titleG.critters = [];
  const cols = ['#ffd24a', '#e88ac0', '#8ac8f0', '#b8e86a', '#c8a0f0'];
  for (let i = 0; i < 7; i++) {
    titleG.critters.push({ kind: 'butterfly', x: 20 + Math.random() * (SPR.W - 40),
                           y: 80 + Math.random() * 60, col: cols[i % cols.length],
                           ph: Math.random() * 6.28, sp: 0.5 + Math.random() * 0.7 });
  }
  titleG.critters.push({ kind: 'butterfly', credit: true, x: SPR.CX + 46, y: 92,
                         col: '#ffd24a', ph: 0.7, sp: 0.6 });
  titleG.critters.push({ kind: 'rabbit', x: 40, y: GROUND_Y + 22, dir: 1, moving: false, t: 2, ph: 0 });
}

function fitTitleScene() { seedTitleCritters(); }

function updateTitleCritters(dt) {
  for (const k of titleG.critters) {
    if (k.kind === 'butterfly') {
      const sp = k.sp || 1;
      k.x += (Math.sin(titleG.t * 0.7 * sp + k.ph) * 16 + 6) * sp * dt;
      k.y += Math.sin(titleG.t * 1.9 * sp + k.ph) * 12 * dt;
      if (k.x > SPR.W - 10) k.x = 10;
      k.y = Math.max(66, Math.min(GROUND_Y + 18, k.y));
    } else if (k.kind === 'rabbit') {
      k.t -= dt;
      if (k.moving) {
        k.x += k.dir * 22 * dt;
        if (k.t <= 0) { k.moving = false; k.t = 3 + Math.random() * 6; }
        if (k.x < 14 || k.x > SPR.W - 14) k.dir *= -1;
      } else if (k.t <= 0) {
        k.moving = true; k.t = 0.8 + Math.random() * 1.2;
        k.dir = Math.random() > 0.5 ? 1 : -1;
        puff(k.x, k.y + 2, 2);
      }
    }
  }
}

/* the wordmark, in the game's own font, sitting in the dark of his canopy */
function drawTitleWord(c) {
  const cx = W() / 2;
  const t = titleG.t;
  const drift = Math.sin(t * 0.5) * 1.2;
  const y = Math.round(28 + drift);

  // the faintest breath of shade behind it, so gold reads on leaves and on sky
  for (let i = 0; i < 46; i++) {
    const k = Math.pow(1 - Math.abs(i - 23) / 23, 0.7);
    c.globalAlpha = 0.30 * k;
    SPR.px(c, cx - 104 * k, y - 10 + i, 208 * k, 1, '#05080c');
    c.globalAlpha = 1;
  }

  F.drawTextCentered(c, cx, y - 3, 'T H E', '#9fb8d0', 1, '#000000');
  F.drawTextCentered(c, cx, y + 6, 'WISE OAK', '#ffd24a', 3, '#3a2208');
  F.drawTextCentered(c, cx, y + 32, 'T R E E', '#e8c98a', 2, '#3a2208');
}

/* one line, at the bottom, breathing */
function drawTitlePrompt(c) {
  const pulse = 0.55 + 0.45 * Math.sin(titleG.t * 2.2);
  const msg = hadSave ? 'tap anywhere to go back in' : 'tap anywhere to enter the wood';
  const fade = leaving > 0 ? Math.max(0, 1 - leaving * 2) : 1;
  c.globalAlpha = fade * pulse;
  F.drawTextCentered(c, W() / 2, H - 22, msg, '#f4ead6', 1, '#000000');
  c.globalAlpha = 1;
}

function drawTitleFrame(dt) {
  titleG.t += dt;
  updateTitleCritters(dt);

  // the camera settles, then pushes in when you ask to go through
  if (leaving > 0) { titleCam.tz = 1.55; titleCam.ty = 16; }
  const k = Math.min(1, dt * (leaving > 0 ? 3.2 : 0.9));
  titleCam.z += (titleCam.tz - titleCam.z) * k;
  titleCam.y += (titleCam.ty - titleCam.y) * k;

  dc.setTransform(1, 0, 0, 1, 0, 0);
  dc.clearRect(0, 0, W(), H);
  SPR.drawBackdrop(dc, titleG);
  SPR.drawGround(dc, titleG);
  SPR.drawCosyFoliage(dc, titleG, 404, 0.7);

  const L = SPR.layerBegin();
  SPR.drawTree(L, titleG);
  SPR.drawCritters(L, titleG);
  SPR.layerEnd(dc, '#1a0f08');

  SPR.drawZzz(dc, titleG, SPR.CX + 34, 84, 1.4);
  SPR.drawUndergrowth(dc, titleG);
  SPR.drawForeground(dc, titleG);
  SPR.drawVines(dc, titleG, 51);
  SPR.drawFrameFoliage(dc, titleG);
  SPR.drawBokeh(dc, titleG);
  SPR.drawOverlay(dc, titleG);

  // blit through the menu camera
  const sw = W() / titleCam.z, sh = H / titleCam.z;
  const sx = Math.max(0, Math.min(W() - sw, (W() - sw) / 2));
  const sy = Math.max(0, Math.min(H - sh, (H - sh) / 2 + titleCam.y));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W(), H);
  ctx.drawImage(buf, sx, sy, sw, sh, 0, 0, W(), H);

  drawTitleWord(ctx);
  drawTitlePrompt(ctx);

  const veil = Math.max(dawn, leaving);
  if (veil > 0) {
    ctx.globalAlpha = Math.min(1, veil);
    SPR.px(ctx, 0, 0, W(), H, '#05080c');
    ctx.globalAlpha = 1;
  }
}

/* ---------------------------------------------------------------------
   FIT — the world fills the window. Height is always 192 logical pixels;
   width follows the window's aspect so there are never any bars.
   --------------------------------------------------------------------- */
let SCALE = 4;
const MIN_LOGICAL_W = 224;              // the narrowest the world may be

function fit() {
  // On a phone in portrait, height/192 gives a scale so large that the
  // narrowest permitted world is wider than the screen, and the canvas gets
  // cut off. So the scale has to satisfy BOTH dimensions, and the picture
  // sits as a band in the middle of a tall screen rather than overflowing it.
  const vv = window.visualViewport;
  const winW = Math.round((vv && vv.width) || window.innerWidth);
  const winH = Math.round((vv && vv.height) || window.innerHeight);
  SCALE = Math.min(winH / H, winW / MIN_LOGICAL_W);
  if (!(SCALE > 0)) SCALE = 1;
  const logicalW = SPR.setLogicalWidth(winW / SCALE);
  cv.width = logicalW; cv.height = H;
  buf.width = logicalW; buf.height = H;
  ctx.imageSmoothingEnabled = false;
  dc.imageSmoothingEnabled = false;
  cv.style.width = Math.floor(logicalW * SCALE) + 'px';
  cv.style.height = Math.floor(H * SCALE) + 'px';
  if (!started) fitTitleScene();
  refreshArrows();
  if (panelOpen()) layoutPanel();
}

/* The slice of the world the camera is currently showing. Input, the speech
   bubble and the blit all have to agree on this or clicks land in the wrong
   place. */
function camRect() {
  const cam = G.cam;
  const sw = W() / cam.z, sh = H / cam.z;
  return {
    sw, sh,
    sx: Math.max(0, Math.min(W() - sw, (W() - sw) / 2 + cam.x)),
    sy: Math.max(0, Math.min(H - sh, (H - sh) / 2 + cam.y))
  };
}

/* world -> the final frame, where the balloon and the post are drawn */
function worldToFrame(wx, wy) {
  const c = camRect();
  return { x: (wx - c.sx) / c.sw * W(), y: (wy - c.sy) / c.sh * H };
}

/* where a world point lands on the page */
function worldToScreen(wx, wy) {
  const r = cv.getBoundingClientRect();
  const c = camRect();
  return {
    x: r.left + ((wx - c.sx) / c.sw) * r.width,
    y: r.top + ((wy - c.sy) / c.sh) * r.height
  };
}

/* ---------------------------------------------------------------------
   DIALOGUE — a cartoon balloon drawn in the frame, in the game's own font
   --------------------------------------------------------------------- */
const F = window.FONT_API;

const DLG = {
  on: false, speaker: '', text: '', cls: '', lines: [], shown: 0,
  choices: null, hover: -1, rects: [], hold: 0, who: 'tree'
};

function balloonWidth() { return Math.min(196, W() - 40); }

function say(speaker, text, mood, cls, choices) {
  G.stare = 0; G.watchers = Math.min(G.watchers, 0.2);
  DLG.on = true;
  DLG.speaker = speaker;
  DLG.text = text;
  DLG.cls = cls || '';
  DLG.who = cls === 'squirrel' ? 'squirrel' : cls === 'heaven' ? 'ghost' : 'tree';
  DLG.lines = F.wrapText(text, balloonWidth() - 14, 1);
  DLG.shown = 0;
  DLG.choices = choices || null;
  DLG.rects = []; DLG.hover = -1; DLG.hold = 0;
  G.talking = true;
  if (mood) G.mood = mood;
}

function hideBubble() { DLG.on = false; DLG.choices = null; DLG.rects = []; G.talking = false; }

function dialogueDone() {
  return DLG.shown >= DLG.text.length;
}

function updateDialogue(dt) {
  if (!DLG.on) return;
  if (!dialogueDone()) {
    const before = DLG.shown;
    DLG.shown = Math.min(DLG.text.length, DLG.shown + dt / 0.017);
    if (Math.floor(DLG.shown / 3) !== Math.floor(before / 3)) SFX.talk(DLG.shown | 0);
  } else {
    DLG.hold += dt;
    if (!DLG.choices && DLG.hold > 5.5) { DLG.on = false; G.talking = false; }
  }
}

function skipType() {
  if (DLG.on && !dialogueDone()) { DLG.shown = DLG.text.length; return true; }
  return false;
}

/* where the balloon's tail should point, in frame pixels */
function speakerAnchor() {
  if (DLG.who === 'squirrel' && G.squirrel.active) return worldToFrame(G.squirrel.x, G.squirrel.y - 18);
  if (DLG.who === 'ghost') return worldToFrame(CX(), 56);
  return worldToFrame(CX(), 88);
}

function balloonBox() {
  const w = balloonWidth();
  const nLines = DLG.lines.length;
  const h = 12 + nLines * 9;
  if (panelOpen()) {
    return { x: Math.round(W() / 2 - w / 2), y: H - h - 8, w, h, tail: null };
  }
  const a = speakerAnchor();
  let x = Math.round(a.x - w / 2);
  x = Math.max(6, Math.min(W() - w - 6, x));
  let y = Math.round(a.y - h - 16);
  y = Math.max(6, y);
  return { x, y, w, h, tail: a };
}

function drawDialogue(c) {
  if (!DLG.on) return;
  const b = balloonBox();
  const fill = DLG.cls === 'serious' ? '#e4ecf4' : DLG.cls === 'squirrel' ? '#f7e6c8'
             : DLG.cls === 'heaven' ? '#eaf4ff' : '#fdf6e3';
  SPR.drawBalloon(c, b.x, b.y, b.w, b.h, b.tail, { fill });

  const nameCol = DLG.cls === 'serious' ? '#4a6a88' : DLG.cls === 'squirrel' ? '#9a5a1a' : '#a06a2a';
  F.drawText(c, b.x + 6, b.y + 3, DLG.speaker, nameCol, 1);

  let n = Math.floor(DLG.shown);
  for (let i = 0; i < DLG.lines.length; i++) {
    const line = DLG.lines[i];
    const take = Math.max(0, Math.min(line.length, n));
    if (take > 0) F.drawText(c, b.x + 7, b.y + 12 + i * 9, line.slice(0, take), '#2b1c10', 1);
    n -= line.length + 1;
    if (n <= 0) break;
  }
  if (dialogueDone() && !DLG.choices) drawMoreHint(c, b);
  if (dialogueDone() && DLG.choices) drawChoices(c);
}

function drawMoreHint(c, b) {
  SPR.drawMoreArrow(c, b.x + b.w - 8, b.y + b.h - 6, G.t);
}

/* your replies, as little balloons along the bottom of the frame */
function drawChoices(c) {
  DLG.rects = [];
  const list = DLG.choices;
  const w = Math.min(212, W() - 20);
  const lh = 14;
  let y = H - 48 - list.length * (lh + 4);
  for (let i = 0; i < list.length; i++) {
    const x = Math.round(W() / 2 - w / 2);
    const hovered = DLG.hover === i;
    SPR.drawBalloon(c, x, y, w, lh, null, { fill: hovered ? '#ffe06a' : '#ffffff', radius: 4 });
    F.drawText(c, x + 5, y + 4, '\u203a', '#a06a2a', 1);
    F.drawText(c, x + 12, y + 4, fitText(list[i].text, w - 18), '#2b1c10', 1);
    DLG.rects.push({ x, y, w, h: lh, i });
    y += lh + 4;
  }
}

function choiceAt(x, y) {
  for (const r of DLG.rects) {
    // generous slop: a fingertip is a great deal wider than a pixel
    if (x >= r.x - 4 && x <= r.x + r.w + 4 && y >= r.y - 4 && y <= r.y + r.h + 4) return r.i;
  }
  return -1;
}

function pickReply(ch) {
  DLG.choices = null; DLG.rects = [];
  if (ch.type) { hideBubble(); startTyping(); return; }
  if (ch.act) { SFX.click(); ch.act(); return; }
  save.stats.replies = (save.stats.replies || 0) + 1;
  save.stats.tones = save.stats.tones || {};
  save.stats.tones[ch.tone] = (save.stats.tones[ch.tone] || 0) + 1;
  persist();
  ACH('reply1');
  if (save.stats.replies >= 25) ACH('reply25');
  const tn = save.stats.tones;
  if ((tn.kind || 0) >= 10) ACH('kind10');
  if ((tn.rude || 0) >= 10) ACH('rude10');
  if ((tn.joke || 0) >= 10) ACH('joke10');
  if ((tn.curious || 0) >= 10) ACH('curious10');

  if (!ch.follow) { talkToTree(); return; }
  const mood = ch.tone === 'rude' ? 'smug' : ch.tone === 'kind' ? 'happy' : ch.tone === 'joke' ? 'laugh' : 'think';
  say('THE WISE OAK TREE', ch.follow, mood, DLG.cls === 'serious' ? 'serious' : '');
}

function repliesFor(tag) {
  const pool = (DATA.replies[tag] || DATA.replies.goofy).slice();
  const out = [];
  for (let i = 0; i < 2 && pool.length; i++) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  out.push(DATA.replyMore);
  out.push({ tone: 'type', text: 'let me say something myself', type: true });
  return out;
}

/* ---------------------------------------------------------------------
   ACHIEVEMENTS
   --------------------------------------------------------------------- */
const ACH_BY_ID = {}; DATA.achievements.forEach(a => ACH_BY_ID[a.id] = a);
const toastQueue = [];

function ACH(id) {
  if (save.ach[id]) return false;
  if (!ACH_BY_ID[id]) return false;
  save.ach[id] = Date.now();
  G.hall.unlocked[id] = true;
  const a = ACH_BY_ID[id];
  pushNote(a.kind, a.name, a.desc, a.icon, a.id);
  persist();
  checkMetaAchievements();
  return true;
}

function checkMetaAchievements() {
  const others = DATA.achievements.filter(a => a.id !== 'allach');
  if (others.every(a => save.ach[a.id])) ACH('allach');
  if (DATA.endings.every(e => save.endings[e.id])) ACH('endall');
  const n = Object.keys(save.endings).length;
  if (n >= 1) ACH('end1');
  if (n >= 3) ACH('end3');
}

/* ---------------------------------------------------------------------
   THE POST — a snail carries every announcement across the screen
   --------------------------------------------------------------------- */
let snails = [];

/* A parcel gets its snail the moment it is posted, not when the snail happens
   to reach the screen — so the garden ends up holding everything you ever
   earned, including deliveries that arrived while you were three fields away. */
function pushNote(kind, title, desc, icon, id) {
  toastQueue.push({ kind, name: title, desc, icon, id });
  if (id && !save.snails[id]) {
    save.snails[id] = { kind, name: title, desc, icon, at: Date.now() };
    if (Object.keys(save.snails).length >= 12) ACH('snails12');
    persist();
  }
}

/* a snail's name is as fixed as its shell */
function snailName(id) {
  const h = SPR.snailSkin(id, 'task').seed;
  return DATA.snailTitles[h % DATA.snailTitles.length] + ' ' +
         DATA.snailNames[(h >>> 7) % DATA.snailNames.length];
}
function snailNote(id) {
  const h = SPR.snailSkin(id, 'task').seed;
  return DATA.snailNotes[(h >>> 11) % DATA.snailNotes.length];
}

/* Post arrives sealed. The snail carries it across the park with the trophy
   tied on top and does not read it out; you stop him and open it yourself. */
function updateToasts(dt) {
  // the round waits for you: nothing crawls across heaven or a cutscene
  if (G.scene !== 'game' || G.cine) return;
  if (toastQueue.length && snails.length < 2 && (!snails.length || snails[snails.length - 1].x > 96)) {
    const n = toastQueue.shift();
    const skin = SPR.snailSkin(n.id || n.name, n.kind);
    snails.push({
      x: -26, y: H - 14 - (skin.scale - 1) * 5, dir: 1,
      speed: 26 / Math.max(0.7, skin.scale),        // a bigger parcel is a slower snail
      note: n, kind: n.kind, skin, scale: skin.scale,
      opened: false, life: 0, hint: 0
    });
    save.stats.postSent = (save.stats.postSent || 0) + 1;
    SFX.note();
  }
  for (let i = snails.length - 1; i >= 0; i--) {
    const sn = snails[i];
    sn.life += dt;
    sn.x += sn.speed * dt;
    // a nudge upward when he first appears, so you know to stop him
    if (!sn.opened && sn.life > 0.6 && sn.life < 4.2) sn.hint = Math.min(1, sn.hint + dt * 2);
    else sn.hint = Math.max(0, sn.hint - dt * 2);
    if (sn.x > W() + 50) {
      if (!sn.opened) {
        // he got away with it. It goes in the bag as unopened post.
        save.unread = save.unread || [];
        if (!save.unread.some(u => u.id === sn.note.id)) save.unread.push(sn.note);
        G.bagBadge = 1;
        persist();
        if (G.bagOpen) renderBag();
      }
      snails.splice(i, 1);
    }
  }
}

/* Opening the parcel. The seal cracks, then the sheet unrolls to exactly the
   height of what is written on it — measured, not guessed, so a long name and
   a short one both end up on a sheet that fits. */
const REDUCED = (function () {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
})();

/* =========================================================================
   PANELS, DRAWN IN THE WORLD
   One scroll at a time, laid out from a list of items, measured in logical
   pixels and drawn in the same 5x7 font as the rest of the game. Nothing in
   here is a DOM element, so nothing in here can look like a web page.
   ========================================================================= */
const PAP = SPR.PAPER;

const PANEL = {
  spec: null,        // { id, title, foot, build, anchor, w, maxH, wide }
  items: [],
  contentH: 0, viewH: 0, w: 0, x: 0, y: 0,
  unroll: 0, crack: 0, closing: 0,
  scroll: 0, target: 0,
  hover: -1, rects: [],
  ink: 0             // the words fade in once the paper is open enough
};

const PANEL_STEPS = 15;

function panelOpen() { return !!PANEL.spec; }

/* ---- layout ---------------------------------------------------------- */
const ROW_H = 17, LINE_H = 8, TITLE_H = 13;

function measureItem(it, w) {
  const inner = w - 12;
  switch (it.t) {
    case 'title': return TITLE_H;
    case 'rule':  return 4;
    case 'gap':   return it.h || 5;
    case 'text': {
      const sc = it.scale || 1;
      it._lines = F.wrapText(it.s, inner, sc);
      return it._lines.length * (LINE_H * sc) + 2;
    }
    case 'row': {
      it._sub = it.sub ? F.wrapText(it.sub, inner - (it.icon ? 20 : 0) - (it.right ? F.textWidth(it.right, 1) + 6 : 0), 1) : [];
      return Math.max(ROW_H, 12 + it._sub.length * LINE_H);
    }
    case 'btns':  return 16;
    case 'trophy': return 46;

    case 'snail': return 30;
    case 'bird': return 22;
    default: return 10;
  }
}

function layoutPanel() {
  const sp = PANEL.spec;
  if (!sp) return;
  const maxW = Math.min(sp.wide ? 236 : 178, W() - 28);
  PANEL.w = maxW;
  PANEL.items = sp.build();
  let h = 4;
  for (const it of PANEL.items) { it._h = measureItem(it, maxW); it._y = h; h += it._h; }
  h += 4;
  PANEL.contentH = h;
  const cap = sp.maxH || (sp.anchor === 'mid' ? H - 22 : H - 34);
  PANEL.viewH = Math.min(h, cap);
  PANEL.target = Math.max(0, Math.min(PANEL.target, h - PANEL.viewH));

  // where it hangs
  const a = sp.anchor || 'mid';
  PANEL.x = Math.round(a === 'left' ? 10 : a === 'right' ? W() - maxW - 10 : W() / 2 - maxW / 2);
  PANEL.y = Math.round(a === 'mid' ? (H - PANEL.viewH) / 2 : H - PANEL.viewH - 30);
  if (PANEL.y < 12) PANEL.y = 12;
}

function openPanel(spec) {
  if (G.cine) return;
  PANEL.spec = spec;
  PANEL.unroll = 0.001; PANEL.crack = 0; PANEL.closing = 0;
  PANEL.scroll = 0; PANEL.target = 0; PANEL.hover = -1; PANEL.ink = 0;
  layoutPanel();
  SFX.page();
  hideBubble();
}

function refreshPanel() { if (PANEL.spec) layoutPanel(); }

function closePanel() {
  if (!PANEL.spec || PANEL.closing) return;
  PANEL.closing = 1;
  SFX.page();
  if (PANEL.spec.onClose) PANEL.spec.onClose();
}

function panelIs(id) { return PANEL.spec && PANEL.spec.id === id; }

/* ---- animation ------------------------------------------------------- */
function panelMaxScroll() { return Math.max(0, PANEL.contentH - PANEL.viewH); }

function updatePanel(dt) {
  if (!PANEL.spec) return;
  PANEL.target = Math.max(0, Math.min(panelMaxScroll(), PANEL.target));
  if (PANEL.closing) {
    PANEL.unroll -= dt * 3.4;
    PANEL.ink = 0;
    if (PANEL.unroll <= 0) { PANEL.spec = null; PANEL.items = []; PANEL.rects = []; }
    return;
  }
  PANEL.crack = Math.min(1, PANEL.crack + dt * 2.6);
  if (PANEL.crack > 0.45) PANEL.unroll = Math.min(1, PANEL.unroll + dt * 1.7);
  if (PANEL.unroll > 0.55) PANEL.ink = Math.min(1, PANEL.ink + dt * 3.4);
  PANEL.scroll += (PANEL.target - PANEL.scroll) * Math.min(1, dt * 9);
}

/* the paper opens in discrete steps; pixel art does not ease */
function panelStepped() {
  return Math.round(PANEL.unroll * PANEL_STEPS) / PANEL_STEPS;
}

/* ---- drawing --------------------------------------------------------- */
function drawPanelScroll(c) {
  const sp = PANEL.spec;
  if (!sp) return;
  const k = panelStepped();
  const h = Math.max(0, Math.round(PANEL.viewH * k));
  const x = PANEL.x, y = Math.round(PANEL.y + (PANEL.viewH - h) / 2);

  if (sp.anchor === 'mid') {
    c.globalAlpha = 0.62 * Math.min(1, PANEL.unroll * 1.6);
    SPR.px(c, 0, 0, W(), H, '#0a0806');
    c.globalAlpha = 1;
  }

  SPR.drawScrollFrame(c, x, y, PANEL.w, h, { crack: PANEL.crack });
  if (h < 10 || PANEL.ink <= 0) return;

  // the words, clipped to the open paper
  c.save();
  c.beginPath();
  c.rect(x, y + 1, PANEL.w, h - 2);
  c.clip();
  c.globalAlpha = PANEL.ink;
  PANEL.rects = [];
  const top = y - Math.round(PANEL.scroll);
  for (let i = 0; i < PANEL.items.length; i++) {
    const it = PANEL.items[i];
    const iy = top + it._y;
    if (iy > y + h || iy + it._h < y) continue;
    drawPanelItem(c, it, x, iy, PANEL.w, i);
  }
  c.globalAlpha = 1;
  c.restore();

  // a scroll thumb, if there is more paper than window
  if (PANEL.contentH > PANEL.viewH && PANEL.ink > 0.5) {
    const trackH = h - 10;
    const th = Math.max(6, trackH * PANEL.viewH / PANEL.contentH);
    const tp = (PANEL.scroll / (PANEL.contentH - PANEL.viewH)) * (trackH - th);
    SPR.px(c, x + PANEL.w - 4, y + 4, 3, trackH + 2, PAP.dim);
    SPR.px(c, x + PANEL.w - 4, y + 5 + tp, 3, th, PAP.ink3);
  }
}

function drawPanelItem(c, it, x, y, w, i) {
  const pad = 6;
  const inner = w - pad * 2;
  switch (it.t) {
    case 'title':
      F.drawTextCentered(c, x + w / 2, y + 3, it.s, PAP.ink, 1);
      SPR.px(c, x + pad, y + 11, inner, 1, PAP.deep);
      break;

    case 'rule':
      for (let dx = 0; dx < inner; dx += 2) SPR.px(c, x + pad + dx, y + 1, 1, 1, PAP.deep);
      break;

    case 'text': {
      const sc = it.scale || 1;
      const col = it.col || PAP.ink2;
      for (let l = 0; l < it._lines.length; l++) {
        const ly = y + 1 + l * LINE_H * sc;
        if (it.align === 'center') F.drawTextCentered(c, x + w / 2, ly, it._lines[l], col, sc);
        else F.drawText(c, x + pad, ly, it._lines[l], col, sc);
      }
      break;
    }

    case 'row': {
      const hot = PANEL.hover === i && it.act;
      if (hot) SPR.px(c, x + 2, y, w - 4, it._h - 1, PAP.lit);
      let tx = x + pad;
      if (it.icon) {
        drawSmallIcon(c, it.icon, tx, y + 2);
        tx += 20;
      }
      const rw = it.right ? F.textWidth(it.right, 1) : 0;
      F.drawText(c, tx, y + 2, fitText(it.label, w - pad - (tx - x) - rw - 8), it.dim ? PAP.leaf : PAP.ink, 1);
      for (let l = 0; l < it._sub.length; l++) {
        F.drawText(c, tx, y + 11 + l * LINE_H, it._sub[l], PAP.ink3, 1);
      }
      if (it.right) {
        const col = it.rightCol ||
          (it.right === 'DONE' || it.right === 'HAVE IT' ? PAP.leaf : it.right === 'TAKEN' ? PAP.gold : PAP.leaf);
        F.drawText(c, x + w - pad - rw, y + 5, it.right, col, 1);
      }
      if (it.act) PANEL.rects.push({ i, x: x + 2, y, w: w - 4, h: it._h - 1 });
      for (let dx = 0; dx < inner; dx += 3) SPR.px(c, x + pad + dx, y + it._h - 1, 1, 1, PAP.dim);
      break;
    }

    case 'btns': {
      const n = it.items.length;
      const bw = Math.floor((inner - (n - 1) * 4) / n);
      for (let b = 0; b < n; b++) {
        const bx = x + pad + b * (bw + 4);
        const hot = PANEL.hover === i && PANEL.hoverSub === b;
        SPR.px(c, bx, y, bw, 13, SPR.INK);
        SPR.px(c, bx + 1, y + 1, bw - 2, 11, hot ? PAP.lit : PAP.dim);
        SPR.px(c, bx + 1, y + 1, bw - 2, 1, PAP.lit);
        const lbl = it.items[b].label;
        F.drawTextCentered(c, bx + bw / 2, y + 4, fitText(lbl, bw - 6), it.items[b].bad ? '#8a1f14' : PAP.ink, 1);
        PANEL.rects.push({ i, sub: b, x: bx, y, w: bw, h: 13 });
      }
      break;
    }

    case 'trophy': {
      try {
        const spr = SPR.trophySprite(it.id);
        c.imageSmoothingEnabled = false;
        c.drawImage(spr, Math.round(x + w / 2 - 22), y - 6, 44, 44);
      } catch (e) { /* the generic mount will do */ }
      break;
    }

    case 'bird': {
      const sp = it.sp;
      if (it.got) {
        SPR.drawBirdPortrait(c, G, sp, x + pad + 8, y + 12, 1);
        F.drawText(c, x + pad + 24, y + 3, sp.name, PAP.ink, 1);
        F.drawText(c, x + pad + 24, y + 12, fitText(sp.short || sp.note, w - pad * 2 - 30), PAP.ink3, 1);
        if (it.count > 1) {
          const cs = 'x' + it.count;
          F.drawText(c, x + w - pad - F.textWidth(cs, 1), y + 3, cs, PAP.leaf, 1);
        }
      } else {
        SPR.px(c, x + pad + 4, y + 6, 9, 8, PAP.dim);
        F.drawText(c, x + pad + 24, y + 6, '???', PAP.ink3, 1);
      }
      for (let dx = 0; dx < w - pad * 2; dx += 3) SPR.px(c, x + pad + dx, y + it._h - 1, 1, 1, PAP.dim);
      break;
    }

    case 'snail': {
      const skin = SPR.snailSkin(it.id, it.kind);
      SPR.drawSnail(c, G, { x: x + w / 2, y: y + 22, dir: 1, skin,
                            scale: Math.min(1.2, skin.scale), noTrail: true, opened: true, kind: it.kind });
      break;
    }

  }
}

/* a 16x16 achievement icon, drawn straight in at logical scale */
const _iconCache = new Map();
function drawSmallIcon(c, id, x, y) {
  let cv2 = _iconCache.get(id);
  if (!cv2) {
    const m = SPR.makeCanvas(16, 16);
    drawIcon(m.ctx, id, 16);
    cv2 = m.cv;
    _iconCache.set(id, cv2);
  }
  c.imageSmoothingEnabled = false;
  c.drawImage(cv2, x, y, 16, 16);
}

/* ---- input ----------------------------------------------------------- */
function panelBox() {
  const k = panelStepped();
  const h = Math.max(0, Math.round(PANEL.viewH * k));
  return { x: PANEL.x, y: Math.round(PANEL.y + (PANEL.viewH - h) / 2), w: PANEL.w, h };
}

function panelHitAt(fx, fy) {
  for (const r of PANEL.rects) {
    if (fx >= r.x && fx <= r.x + r.w && fy >= r.y && fy <= r.y + r.h) return r;
  }
  return null;
}

function panelMove(fx, fy) {
  const hit = panelHitAt(fx, fy);
  PANEL.hover = hit ? hit.i : -1;
  PANEL.hoverSub = hit ? hit.sub : -1;
  return !!hit;
}

function panelPress(fx, fy) {
  const b = panelBox();
  const inside = fx >= b.x - 6 && fx <= b.x + b.w + 6 && fy >= b.y - 10 && fy <= b.y + b.h + 10;
  if (!inside) { closePanel(); return true; }
  const hit = panelHitAt(fx, fy);
  if (!hit) return true;
  const it = PANEL.items[hit.i];
  if (it.t === 'input') { if (elTyping) elTyping.focus(); return true; }
  if (it.t === 'btns') { const b2 = it.items[hit.sub]; if (b2 && b2.act) { SFX.click(); b2.act(); } return true; }
  if (it.act) { SFX.click(); it.act(); }
  return true;
}


/* =========================================================================
   THE PANELS THEMSELVES
   ========================================================================= */

/* a headline is double height only while it still fits on one line */
function bigEnough(str, wide) {
  const inner = Math.min(wide ? 236 : 178, W() - 28) - 12;
  return F.textWidth(String(str).toUpperCase(), 2) <= inner ? 2 : 1;
}

/* ---- the post ---- */
let lastNote = null;
function openPost(note, fromBag) {
  if (!note) return;
  ACH('openpost');
  lastNote = note;
  if (save.unread) {
    save.unread = save.unread.filter(u => u.id !== note.id);
    persist();
  }
  if ((save.stats.postSent || 0) >= 6 && !(save.unread || []).length) ACH('allpost');
  const head = note.kind === 'ending' ? 'AN ENDING' :
               note.kind === 'chal' ? 'A CHALLENGE' :
               note.kind === 'goal' ? 'A GOAL' : 'AN ACHIEVEMENT';
  const art = SPR.TROPHY_ART || {};
  const key = art[note.id] ? note.id : (art[note.icon] ? note.icon : note.id);
  const nameCol = note.kind === 'chal' ? SPR.PAPER.plum : note.kind === 'ending' ? SPR.PAPER.rust : '#6b3410';
  openPanel({
    id: 'post', anchor: 'mid',
    build: () => [
      { t: 'gap', h: 6 },
      { t: 'trophy', id: key },
      { t: 'gap', h: 8 },
      { t: 'text', s: head, col: SPR.PAPER.gold, align: 'center' },
      { t: 'text', s: note.name.toUpperCase(), col: nameCol, align: 'center', scale: bigEnough(note.name) },
      { t: 'gap', h: 4 },
      { t: 'text', s: note.desc || '', col: SPR.PAPER.ink2, align: 'center' },
      { t: 'rule' },
      { t: 'snail', id: note.id || note.name, kind: note.kind },
      { t: 'text', s: snailName(note.id || note.name), col: SPR.PAPER.ink3, align: 'center' },
      { t: 'gap', h: 6 }
    ],
    onClose: () => { if (panelWas === 'bag') openBag(); }
  });
  panelWas = fromBag ? 'bag' : null;
}
let panelWas = null;
function closePost() { if (panelIs('post')) closePanel(); }

/* ---- the backpack ---- */
function openBag() {
  if (!save.bag || G.cine) return;
  G.bagOpen = true; G.bagBadge = 0;
  SFX.pickup();
  openPanel({
    id: 'bag', anchor: 'left', build: bagItems,
    onClose: () => { G.bagOpen = false; }
  });
}
function closeBag() { if (panelIs('bag')) closePanel(); else G.bagOpen = false; }
function toggleBag() { panelIs('bag') ? closeBag() : openBag(); }
function renderBag() { if (panelIs('bag')) refreshPanel(); }

function bagItems() {
  const out = [{ t: 'title', s: 'BACKPACK' }];
  const jobsDone = DATA.quests.filter(q => save.questDone[q.id]).length;
  out.push({ t: 'row', icon: 'leaf', label: G.inv.leaves + ' leaves',
             right: heardTotal() + ' heard' });

  const owned = DATA.shop.filter(it => has(it.id));
  if (!owned.length) out.push({ t: 'text', s: 'Nothing in it yet.', align: 'center', col: SPR.PAPER.ink3 });
  for (const it of owned) {
    out.push({ t: 'row', label: it.name, icon: it.icon, right: 'TAKE', act: () => holdFromBag(it.id) });
  }

  const unread = save.unread || [];
  for (const n of unread) {
    out.push({ t: 'row', label: 'Sealed parcel', icon: 'paper', right: 'OPEN', act: () => openPost(n, true) });
  }

  out.push({ t: 'rule' });
  out.push({ t: 'row', icon: 'globe', label: 'Map',
             right: AREAS.filter((a2, i) => areaOpen(i)).length + '/' + AREAS.length, act: openMap });
  out.push({ t: 'row', icon: 'mouth', label: 'Topics',
             right: openSets().length + '/' + DATA.sets.length, act: openTopics });
  if (save.birdBook) {
    out.push({ t: 'row', icon: 'bird', label: 'Bird diary',
               right: Object.keys(save.birds).length + '/' + DATA.birds.length, act: openBirdDiary });
  }
  out.push({ t: 'row', icon: 'ledger', label: 'Jobs', right: jobsDone + '/' + DATA.quests.length, act: openJobs });
  out.push({ t: 'row', icon: 'chat', label: 'Plans', right: plansDone() + '/' + DATA.plans.length, act: openPlans });
  return out;
}

/* the two lists that used to sprawl down the backpack */
function openJobs() {
  openPanel({
    id: 'jobs', anchor: 'mid', wide: true, maxH: H - 30,
    build: () => {
      const out = [{ t: 'title', s: 'JOBS' }];
      const inHand = DATA.quests.filter(q => save.quests[q.id]);
      const done = DATA.quests.filter(q => save.questDone[q.id]);
      if (!inHand.length && !done.length) out.push({ t: 'text', s: 'None yet. Try the board.', align: 'center', col: SPR.PAPER.ink3 });
      for (const q of inHand) out.push({ t: 'row', label: q.name, sub: questProgress(q) });
      for (const q of done) out.push({ t: 'row', label: q.name, right: 'DONE', dim: true });
      out.push({ t: 'gap', h: 4 });
      return out;
    }
  });
}

function openPlans() {
  openPanel({
    id: 'plans', anchor: 'mid', wide: true, maxH: H - 30,
    build: () => {
      const out = [{ t: 'title', s: 'PLANS WITH NOC' }];
      const open = DATA.plans.filter(p => save.plans[p.id]);
      const done = DATA.plans.filter(p => save.planDone[p.id]);
      if (!open.length && !done.length) out.push({ t: 'text', s: 'None yet. Go and talk to him.', align: 'center', col: SPR.PAPER.ink3 });
      for (const p of open) out.push({ t: 'row', label: p.name, sub: planBlocker(p) || 'ready' });
      for (const p of done) out.push({ t: 'row', label: p.name, right: 'KEPT', dim: true });
      out.push({ t: 'gap', h: 4 });
      return out;
    }
  });
}

/* ---- the bird diary ---- */
function openBirdDiary() {
  ACH('diaryopen');
  openPanel({
    id: 'birds', anchor: 'mid', wide: true, maxH: H - 30,
    build: () => {
      const seen = Object.keys(save.birds).length;
      const out = [{ t: 'title', s: 'BIRD DIARY' }];
      out.push({ t: 'text', s: seen + ' of ' + DATA.birds.length, col: SPR.PAPER.ink3, align: 'center' });
      out.push({ t: 'rule' });
      if (!seen) out.push({ t: 'text', s: DATA.birdDiaryEmpty, align: 'center', col: SPR.PAPER.ink2 });
      for (const b of DATA.birds) {
        const got = save.birds[b.id];
        out.push({ t: 'bird', sp: b, got: !!got, count: got || 0 });
      }
      out.push({ t: 'gap', h: 4 });
      return out;
    }
  });
}

/* ---- the map of the park ---- */
function openMap() {
  ACH('map');
  openPanel({
    id: 'map', anchor: 'mid', wide: true, maxH: H - 30,
    build: () => {
      const out = [{ t: 'title', s: 'CENTRAL PARK' }];
      const open = AREAS.filter((a, i) => areaOpen(i)).length;
      out.push({ t: 'text', s: open + ' of ' + AREAS.length + ' places open  \u00b7  west to east',
                 col: SPR.PAPER.ink3, align: 'center' });
      out.push({ t: 'rule' });
      for (let i = 0; i < AREAS.length; i++) {
        const a = AREAS[i];
        const isOpen = areaOpen(i);
        const here = i === G.area;
        out.push({
          t: 'row', dim: here,
          label: (here ? '> ' : '') + (isOpen ? a.name : '???'),
          sub: isOpen ? a.sub : '',
          right: here ? 'HERE' : isOpen ? 'OPEN' : areaWants(i),
          rightCol: here ? SPR.PAPER.leaf : isOpen ? SPR.PAPER.leaf : SPR.PAPER.ink3
        });
      }
      out.push({ t: 'gap', h: 4 });
      return out;
    }
  });
}

/* ---- what he will talk about ---- */
function openTopics() {
  ACH('topics');
  openPanel({
    id: 'topics', anchor: 'mid', wide: true, maxH: H - 30,
    build: () => {
      const out = [{ t: 'title', s: 'WHAT HE WILL TALK ABOUT' }];
      const total = DATA.lines.length;
      out.push({ t: 'text', s: heardTotal() + ' of ' + total, col: SPR.PAPER.ink3, align: 'center' });
      out.push({ t: 'rule' });
      for (const st of DATA.sets) {
        const open = heardTotal() >= st.at;
        const got = setHeard(st), all = setTotal(st);
        out.push({
          t: 'row', dim: open && got >= all,
          label: open ? st.name : '???',
          sub: open ? '' : 'at ' + st.at + ' heard',
          right: open ? (got >= all ? 'DONE' : got + '/' + all) : 'SHUT'
        });
      }
      const nx = nextSet();
      if (nx) {
        out.push({ t: 'rule' });
        out.push({ t: 'text', align: 'center', col: SPR.PAPER.ink2,
                   s: (nx.at - heardTotal()) + ' more and he opens another.' });
      }
      out.push({ t: 'gap', h: 4 });
      return out;
    }
  });
}

/* ---- the squirrel's settings ---- */
function openSettings() {
  ACH('gear');
  openPanel({ id: 'set', anchor: 'right', build: settingsItems });
}
function closeSettings() { if (panelIs('set')) closePanel(); }

function settingsItems() {
  const live = NOC_AI.live;
  return [
    { t: 'title', s: 'SETTINGS' },
    { t: 'row', label: 'Sound', icon: 'feather', right: save.muted ? 'OFF' : 'ON',
      act: () => { toggleMute(); refreshPanel(); } },
    { t: 'row', label: 'Real mind', icon: 'book', right: live ? 'ON' : 'OFF', act: askForKey },
    { t: 'row', label: 'Map', icon: 'globe', right: 'OPEN', act: openMap },
    { t: 'row', label: 'Topics', icon: 'mouth', right: 'OPEN', act: openTopics },
    { t: 'row', label: 'Trophies', icon: 'crown', right: 'OPEN', act: openTrophies },
    { t: 'row', label: 'Credits', icon: 'star', right: 'OPEN', act: openCredits },
    { t: 'row', label: 'Erase everything', icon: 'fire', right: 'ERASE', rightCol: '#8a1f14', act: eraseEverything }
  ];
}

function askForKey() {
  if (NOC_AI.live) { NOC_AI.setKey(''); refreshPanel(); return; }
  const k = prompt("Paste an Anthropic API key.\n\nIt is kept in this browser only and is sent nowhere except Anthropic. Leave it blank to cancel.");
  if (k && k.trim()) { NOC_AI.setKey(k.trim()); ACH('realai'); }
  refreshPanel();
}

/* ---- the trophy room, the endings, the credits ---- */
function openTrophies() {
  const done = DATA.achievements.filter(a => save.ach[a.id]).length;
  openPanel({
    id: 'tro', anchor: 'mid', wide: true, maxH: H - 40,
    build: () => {
      const out = [{ t: 'title', s: 'THE TROPHY ROOM' },
                   { t: 'text', s: done + ' of ' + DATA.achievements.length + ' earned', col: SPR.PAPER.ink3, align: 'center' },
                   { t: 'rule' }];
      for (const a of DATA.achievements) {
        const got = !!save.ach[a.id];
        out.push({ t: 'row', label: got ? a.name : '???', sub: a.desc, icon: got ? a.icon : null,
                   right: got ? 'EARNED' : '', dim: got });
      }
      return out;
    }
  });
}

function openEndings() {
  const found = DATA.endings.filter(e => save.endings[e.id]).length;
  openPanel({
    id: 'ends', anchor: 'mid', wide: true, maxH: H - 40,
    build: () => {
      const out = [{ t: 'title', s: 'THE ENDINGS' },
                   { t: 'text', s: found + ' of ' + DATA.endings.length + ' found', col: SPR.PAPER.ink3, align: 'center' },
                   { t: 'rule' }];
      for (const e of DATA.endings) {
        const got = !!save.endings[e.id];
        out.push({ t: 'row', label: got ? e.name : '???', sub: got ? e.title : e.hint,
                   icon: got ? e.icon : null, right: got ? 'FOUND' : '', dim: got });
      }
      return out;
    }
  });
}

function openCredits() {
  ACH('credits');
  openPanel({
    id: 'cred', anchor: 'mid', build: () => [
      { t: 'title', s: 'CREDITS' },
      { t: 'text', s: 'THE WISE OAK TREE', col: SPR.PAPER.ink, align: 'center' },
      { t: 'gap', h: 3 },
      { t: 'text', s: 'A nine-hundred-year-old oak, a lamp-keeper called Noc, a squirrel who gave up retail for technical support, and one butterfly that would not stay in the background.' },
      { t: 'rule' },
      { t: 'text', s: 'Every pixel is drawn at runtime on one canvas: the tree, the wood, the weather, the trophies, these words. The font is a 5x7 bitmap written for it. There are no images and no dependencies.', col: SPR.PAPER.ink3 },
      { t: 'gap', h: 3 },
      { t: 'text', s: DATA.lines.length + ' things he says  ·  ' + DATA.achievements.length + ' trophies  ·  ' +
                      DATA.endings.length + ' endings  ·  ' + DATA.quests.length + ' jobs  ·  ' + DATA.plans.length + ' plans',
        col: SPR.PAPER.ink3, align: 'center' },
      { t: 'rule' },
      { t: 'text', s: 'Thank you for standing still long enough to read this. He noticed. He notices everything.', col: SPR.PAPER.ink2 },
      { t: 'gap', h: 4 }
    ]
  });
}

function eraseEverything() {
  openPanel({
    id: 'wipe', anchor: 'mid', build: () => [
      { t: 'title', s: 'ERASE EVERYTHING?' },
      { t: 'text', s: 'Every trophy. Every ending. Every snail. Every line you ever heard him say.' },
      { t: 'text', s: 'He will not remember you.', col: SPR.PAPER.ink3 },
      { t: 'gap', h: 4 },
      { t: 'btns', items: [
        { label: 'KEEP IT', act: () => closePanel() },
        { label: 'ERASE IT ALL', bad: true, act: () => {
            erased = true;
            try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
            location.reload();
          } }
      ] },
      { t: 'gap', h: 4 }
    ]
  });
}

/* ---- the board and the journal ---- */
function openQuestBoard() {
  openPanel({
    id: 'board', anchor: 'mid', wide: true, maxH: H - 40,
    build: () => {
      const rows = [{ t: 'title', s: 'THE BOARD' }];
      const openN = DATA.quests.filter(q => save.quests[q.id]).length;
      const doneN = DATA.quests.filter(q => save.questDone[q.id]).length;
      rows.push({ t: 'text', s: doneN + ' done  ·  ' + openN + ' in hand', col: SPR.PAPER.ink3, align: 'center' });
      rows.push({ t: 'rule' });
      let any = false;
      for (const q of DATA.quests) {
        if (!questOffered(q)) continue;
        any = true;
        const st = questStatus(q);
        rows.push({
          t: 'row', dim: st === 'done',
          label: q.name,
          sub: st === 'open' ? questProgress(q) : q.desc,
          right: st === 'done' ? 'DONE' : st === 'open' ? 'TAKEN' : 'TAKE IT',
          act: st === 'new' ? () => { acceptQuest(q.id); refreshPanel(); }
             : () => { const v = q.from === 'oak' ? sayTree : nocSay;
                       v(st === 'done' ? q.done : q.ask, st === 'done' ? 'happy' : 'think'); closePanel(); }
        });
      }
      if (!any) rows.push({ t: 'text', s: DATA.boardEmpty, align: 'center', col: SPR.PAPER.ink3 });
      return rows;
    }
  });
}

function openJournal() {
  openPanel({
    id: 'journal', anchor: 'mid', wide: true, maxH: H - 40,
    build: () => {
      const rows = [{ t: 'title', s: "THE KEEPER'S JOURNAL" }];
      rows.push({ t: 'text', s: parkIncome().toFixed(2) + ' leaves a second  ·  ' + save.park.earned + ' earned  ·  ' +
                                save.park.props.length + '/' + plotCount() + ' plots used',
                  col: SPR.PAPER.ink3, align: 'center' });
      rows.push({ t: 'rule' });
      const counts = {};
      for (const p of save.park.props) counts[p.type] = (counts[p.type] || 0) + 1;
      let any = false;
      for (const b of DATA.build) {
        if (!counts[b.id]) continue;
        any = true;
        rows.push({ t: 'row', label: b.name + (counts[b.id] > 1 ? ' x' + counts[b.id] : ''), sub: b.desc,
                    right: 'IN THE PARK' });
      }
      for (const u of DATA.upgrades) {
        if (!save.park.upgrades[u.id]) continue;
        any = true;
        rows.push({ t: 'row', label: u.name, sub: u.desc, right: 'EARNED', dim: true });
      }
      if (!any) rows.push({ t: 'text', s: 'Nothing yet. The park is one tree and a great deal of room.', align: 'center', col: SPR.PAPER.ink3 });
      return rows;
    }
  });
}

/* ---- the ending card ---- */
function showEndingCard(e) {
  SFX.ending();
  pushNote('ending', e.name, e.title, e.icon, e.id);
  openPanel({
    id: 'ending', anchor: 'mid', wide: true, maxH: H - 30,
    build: () => [
      { t: 'gap', h: 4 },
      { t: 'trophy', id: e.icon },
      { t: 'gap', h: 6 },
      { t: 'text', s: 'AN ENDING', col: SPR.PAPER.gold, align: 'center' },
      { t: 'text', s: e.name, col: SPR.PAPER.rust, align: 'center', scale: bigEnough(e.name, true) },
      { t: 'gap', h: 3 },
      { t: 'text', s: e.title, col: SPR.PAPER.ink, align: 'center' },
      { t: 'rule' },
      { t: 'text', s: e.body, col: SPR.PAPER.ink2 },
      { t: 'gap', h: 4 },
      { t: 'btns', items: [{ label: 'GO ON', act: () => closePanel() }] },
      { t: 'gap', h: 4 }
    ],
    onClose: () => { if (G.pendingEnding) { const f = G.pendingEnding; G.pendingEnding = null; f(); } }
  });
}


function snailAt(x, y) {
  for (const sn of snails) {
    if (Math.abs(x - sn.x) < 14 && Math.abs(y - sn.y) < 12) return sn;
  }
  return null;
}

function drawPost(c) {
  for (const sn of snails) {
    SPR.drawSnail(c, G, sn);
    if (sn.hint > 0 && !sn.opened) {
      // one word, once, so the first parcel is not missed
      c.globalAlpha = sn.hint;
      const hw = F.textWidth('POST \u2014 TAP IT', 1) / 2 + 4;
      const hy = talkSignShown() ? sn.y - 46 : sn.y - 22;
      F.drawTextCentered(c, Math.max(hw, Math.min(W() - hw, sn.x)), hy, 'POST \u2014 TAP IT', '#ffe9b0', 1, '#000000');
      c.globalAlpha = 1;
    }
  }
}

/* ---------------------------------------------------------------------
   ICONS (16x16 pixel icons for trophies / toasts)
   --------------------------------------------------------------------- */
function drawIcon(c, id, size) {
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, size, size);
  const P = (x, y, w, h, col) => px(c, x, y, w, h, col);
  switch (id) {
    case 'leaf':
      SPR.drawLeafSprite(c, 4, 5, '#6cc73f', '#2d6b1f'); break;
    case 'mouth':
      P(3, 6, 10, 5, '#2b1c10'); P(4, 7, 8, 2, '#c96a6a'); P(5, 5, 2, 2, '#fff'); break;
    case 'book':
      P(2, 3, 12, 10, '#8a5a2a'); P(3, 4, 5, 8, '#f0e6cc'); P(9, 4, 4, 8, '#f0e6cc'); P(8, 3, 1, 10, '#5a3a1a'); break;
    case 'hand':
      P(5, 4, 2, 6, '#e8b98a'); P(7, 3, 2, 7, '#e8b98a'); P(9, 4, 2, 6, '#e8b98a'); P(4, 9, 8, 5, '#d9a878'); break;
    case 'sneeze':
      P(4, 6, 6, 5, '#8a6141'); P(11, 4, 2, 2, '#9ad4f2'); P(13, 7, 2, 2, '#9ad4f2'); P(11, 10, 2, 2, '#9ad4f2'); break;
    case 'nut':
      pcircle(c, 8, 10, 4, '#d9a05b'); P(4, 4, 9, 3, '#6b4a2a'); P(8, 2, 1, 2, '#4a3220'); break;
    case 'heart':
      P(3, 5, 4, 4, '#ff5b78'); P(9, 5, 4, 4, '#ff5b78'); P(3, 7, 10, 3, '#ff5b78'); P(5, 10, 6, 2, '#ff5b78'); P(7, 12, 2, 2, '#ff5b78'); P(4, 6, 2, 2, '#ff9bb0'); break;
    case 'drop':
      P(7, 2, 2, 3, '#7ec8f2'); P(6, 5, 4, 3, '#7ec8f2'); P(5, 8, 6, 4, '#5aa8e0'); P(6, 12, 4, 2, '#5aa8e0'); P(7, 6, 1, 3, '#c6e9ff'); break;
    case 'sprout':
      P(7, 8, 2, 6, '#5a7a32'); pcircle(c, 5, 7, 3, '#6cc73f'); pcircle(c, 11, 6, 3, '#8fd95a'); break;
    case 'globe':
      pcircle(c, 8, 8, 6, '#3f8fd0'); P(3, 6, 4, 2, '#4caf50'); P(8, 5, 4, 3, '#4caf50'); P(6, 10, 5, 2, '#4caf50'); break;
    case 'moon':
      pcircle(c, 8, 8, 6, '#e9eeff'); pcircle(c, 11, 6, 5, '#1a1030'); dot(c, 3, 3, '#fff'); dot(c, 13, 12, '#fff'); break;
    case 'lighter':
      P(5, 6, 6, 8, '#d64545'); P(5, 4, 6, 2, '#c9c9c9'); P(7, 1, 2, 3, '#ffb02e'); dot(c, 8, 0, '#ffe066'); break;
    case 'fire':
      P(6, 10, 4, 4, '#ef5330'); P(5, 6, 6, 5, '#ffa726'); P(7, 3, 2, 4, '#ffe066'); P(7, 11, 2, 2, '#ffe9a0'); break;
    case 'halo':
      for (let a = 0; a < 20; a++) { const A2 = a / 20 * 6.283; dot(c, 8 + Math.cos(A2) * 6, 8 + Math.sin(A2) * 3, '#ffe066'); }
      pcircle(c, 8, 9, 2, '#fff8d0'); break;
    case 'star':
      P(7, 1, 2, 14, '#ffe066'); P(1, 7, 14, 2, '#ffe066'); P(4, 4, 8, 8, '#ffe066'); P(6, 6, 4, 4, '#fff8d0'); break;
    case 'crown':
      P(2, 8, 12, 5, '#ffd24a'); P(2, 4, 2, 5, '#ffd24a'); P(7, 2, 2, 7, '#ffd24a'); P(12, 4, 2, 5, '#ffd24a'); dot(c, 8, 10, '#ef5330'); break;
    case 'diary':
      P(2, 2, 12, 12, '#6b4a8a'); P(2, 2, 3, 12, '#4a3060'); P(7, 7, 4, 2, '#e8d24a'); break;
    case 'paper':
      P(2, 2, 12, 12, '#e8e2d0'); P(4, 4, 8, 1, '#3a3a3a'); P(4, 6, 8, 1, '#8a8a8a'); P(4, 8, 8, 1, '#8a8a8a'); P(4, 10, 5, 1, '#8a8a8a'); break;
    case 'hat':
      pcircle(c, 8, 7, 6, '#c9453b'); P(2, 7, 13, 2, '#c9453b'); dot(c, 5, 4, '#fff'); dot(c, 10, 6, '#fff'); P(5, 9, 6, 5, '#f0e2cc'); break;
    case 'can':
      P(3, 5, 8, 8, '#8a9aa8'); P(11, 4, 4, 3, '#8a9aa8'); P(1, 6, 2, 5, '#6d7c88'); P(4, 6, 3, 2, '#b0bcc8'); break;
    case 'spade':
      P(7, 1, 2, 9, '#8a5f38'); P(5, 0, 6, 2, '#8a5f38'); P(4, 9, 8, 6, '#b6b6c2'); P(4, 9, 8, 2, '#e0e0e8'); break;
    case 'park':
      P(1, 12, 14, 3, '#4a8a30'); pcircle(c, 5, 6, 4, '#6cc73f'); pcircle(c, 11, 8, 3, '#4a9235');
      P(5, 8, 1, 5, '#6b4a2a'); P(11, 10, 1, 3, '#6b4a2a'); break;
    case 'gate':
      P(1, 2, 2, 13, '#7a5230'); P(13, 2, 2, 13, '#7a5230');
      for (let i = 0; i < 3; i++) P(3, 4 + i * 4, 10, 2, '#a0703c'); P(0, 0, 16, 2, '#5a3a1e'); break;
    case 'coin':
      pcircle(c, 8, 8, 7, '#b5811f'); pcircle(c, 8, 8, 6, '#e8b23a'); SPR.drawLeafSprite(c, 5, 5, '#6cc73f', '#2d6b1f'); break;
    case 'ledger':
      P(2, 1, 12, 14, '#8a5f38'); P(3, 2, 10, 12, '#f6ecd6');
      for (let i = 0; i < 4; i++) P(5, 4 + i * 3, 7, 1, '#5a4028'); break;
    case 'visitor':
      P(6, 6, 5, 7, '#4a6a9a'); pcircle(c, 8, 4, 3, '#e8b98a'); P(5, 1, 7, 3, '#3a2a1a');
      P(2, 13, 12, 2, '#a0703c'); break;
    case 'house':
      P(3, 7, 11, 8, '#e0d2b8'); for (let i = 0; i <= 5; i++) P(2 + i, 6 - i, 13 - i * 2, 1, '#a8503a');
      P(7, 10, 3, 5, '#7a4a28'); P(4, 8, 2, 2, '#ffd98a'); P(11, 8, 2, 2, '#ffd98a'); break;
    case 'bird':
      pellipse(c, 7, 9, 5, 4, '#8a4a3a'); pcircle(c, 11, 5, 3, '#8a4a3a');
      P(14, 5, 2, 1, '#e8a33a'); dot(c, 12, 4, '#120a04'); P(1, 8, 4, 2, '#5a2f24');
      P(6, 13, 1, 3, '#c8892a'); P(9, 13, 1, 3, '#c8892a'); break;
    case 'chat':
      pellipse(c, 8, 6, 7, 5, '#e8e2d0'); P(3, 10, 4, 4, '#e8e2d0');
      for (let i = 4; i < 12; i += 3) P(i, 6, 2, 2, '#5a5a5a'); break;
    case 'kind':
      P(2, 4, 5, 5, '#ff5b78'); P(9, 4, 5, 5, '#ff5b78'); P(2, 7, 12, 4, '#ff5b78');
      P(4, 11, 8, 2, '#ff5b78'); P(6, 13, 4, 2, '#ff5b78'); dot(c, 4, 6, '#ffa8b8'); break;
    case 'rude':
      pellipse(c, 8, 6, 7, 5, '#d64545'); P(3, 10, 4, 4, '#d64545');
      P(7, 3, 2, 5, '#fff'); P(7, 9, 2, 2, '#fff'); break;
    case 'joke':
      pcircle(c, 8, 8, 7, '#ffd24a'); P(5, 5, 2, 3, '#3a2a10'); P(9, 5, 2, 3, '#3a2a10');
      for (let i = -4; i <= 4; i++) P(8 + i, 10 + Math.round(Math.cos(i / 4 * 1.57) * 2) - 2, 1, 2, '#3a2a10'); break;
    case 'ask':
      for (let i = 0; i < 8; i++) { const A = -2 + i * 0.45; P(8 + Math.cos(A) * 4, 6 + Math.sin(A) * 4, 2, 2, '#ffd24a'); }
      P(7, 9, 2, 2, '#ffd24a'); P(7, 12, 2, 2, '#ffd24a'); break;
    case 'tv':
      P(1, 3, 14, 10, '#3a3a44'); P(2, 4, 12, 8, '#6ba8d8'); P(2, 4, 12, 2, '#9fd0ee');
      P(6, 13, 4, 2, '#555'); P(3, 1, 1, 3, '#888'); P(12, 1, 1, 3, '#888'); break;
    case 'reel':
      pcircle(c, 8, 8, 7, '#2a2a34'); pcircle(c, 8, 8, 6, '#4a4a58'); pcircle(c, 8, 8, 2, '#ddd');
      for (let i = 0; i < 4; i++) { const A = i / 4 * 6.28 + .4; pcircle(c, 8 + Math.cos(A) * 3.6, 8 + Math.sin(A) * 3.6, 1.6, '#1e1e26'); } break;
    case 'eye':
      P(1, 6, 14, 5, '#f2e6cc'); P(2, 5, 12, 7, '#fbf3e2'); pcircle(c, 8, 8, 3, '#c9862a');
      pcircle(c, 8, 8, 1.6, '#160c04'); dot(c, 7, 7, '#fff'); P(1, 4, 14, 1, '#8a6141'); break;
    case 'boop':
      pcircle(c, 6, 9, 4, '#a07a4c'); pcircle(c, 5, 8, 2, '#c9a06a'); dot(c, 4, 11, '#432c17'); dot(c, 8, 11, '#432c17');
      P(11, 3, 3, 6, '#e8b98a'); P(10, 1, 5, 3, '#d9a878'); dot(c, 2, 3, '#ffd24a'); dot(c, 14, 12, '#ffd24a'); break;
    case 'teeth':
      P(2, 6, 12, 5, '#2a1508'); for (let i = 2; i < 14; i += 3) { P(i, 4, 2, 3, '#e6d9bb'); P(i, 10, 2, 3, '#e6d9bb'); }
      P(1, 2, 14, 2, '#a07a4c'); P(1, 12, 14, 2, '#6f4f2e'); break;
    case 'feather':
      for (let i = 0; i < 12; i++) P(3 + i * 0.7, 13 - i, 2, 2, i > 7 ? '#ffffff' : '#e8e2d0');
      for (let i = 0; i < 4; i++) { P(9 + i, 2 + i, 3 - i, 1, '#fff'); P(6 - i, 3 + i, 3, 1, '#fff'); } break;
    case 'shake':
      P(6, 3, 4, 11, '#a07a4c'); P(6, 3, 2, 11, '#c9a06a');
      for (let i = 0; i < 3; i++) { P(3 - i, 5 + i * 3, 2, 1, '#ffd24a'); P(11 + i, 5 + i * 3, 2, 1, '#ffd24a'); }
      SPR.drawLeafSprite(c, 1, 10, '#6cc73f', '#2d6b1f'); break;
    case 'knock':
      P(1, 2, 12, 12, '#8a6141'); P(2, 3, 10, 10, '#6f4f2e'); pcircle(c, 10, 8, 1.6, '#ffd24a');
      P(12, 4, 3, 4, '#e8b98a'); dot(c, 14, 2, '#ffd24a'); dot(c, 15, 5, '#ffd24a'); break;
    case 'reach':
      pcircle(c, 10, 5, 5, '#e9eeff'); pcircle(c, 12, 3, 4, '#1a2050');
      P(3, 9, 3, 5, '#e8b98a'); P(2, 7, 5, 3, '#d9a878'); dot(c, 1, 3, '#fff'); break;
    default:
      P(4, 4, 8, 8, '#888'); break;
  }
}

/* ---------------------------------------------------------------------
   INVENTORY — no buttons. What you own lies on the grass, and you pick it
   up and drag it onto him.
   --------------------------------------------------------------------- */
function has(id) { return !!G.inv.items[id]; }

function toolHome(i) {
  return { x: 66 + i * 21, y: GROUND_Y + 26 };
}

function refreshHUD() {
  /* Nothing lies on the grass any more. Everything you own is in the bag,
     and the bag only exists once you have found it. */
  G.tools = [];
  G.hasBag = !!save.bag;
  refreshActions();
  if (G.bagOpen) renderBag();
}

/* Little wooden signs, hammered into the bottom of the frame. The only
   thing in the game that behaves like a button, and it is still pixels. */
let signs = [];

function refreshActions() {
  signs = [];
  if (G.cine || G.scene === 'burning' || G.scene === 'game') return;
  const labels = G.scene === 'hall'
    ? [['BACK', closeHall], ['SORT', sortHall]]
    : G.scene === 'garden'
      ? [['BACK', closeGarden]]
      : G.scene === 'heaven'
        ? [['THE HALL', () => openHall('heaven')], ['THE GARDEN', openGarden],
           ['ENDINGS', openEndings], ['BE BORN AGAIN', reincarnate]]
        : [];
  if (!labels.length) return;
  const pad = 8;
  const widths = labels.map(([t]) => F.textWidth(t, 1) + 16);
  // wrap onto a second row rather than running off a narrow screen
  const rows = [[]];
  let used = 0;
  for (let i = 0; i < labels.length; i++) {
    if (used && used + pad + widths[i] > W() - 12) { rows.push([]); used = 0; }
    rows[rows.length - 1].push(i);
    used += (used ? pad : 0) + widths[i];
  }
  rows.forEach((row, r) => {
    const total = row.reduce((a, i) => a + widths[i], 0) + pad * (row.length - 1);
    let x = Math.round(W() / 2 - total / 2);
    const y = H - 22 - (rows.length - 1 - r) * 20;
    for (const i of row) {
      signs.push({ label: labels[i][0], act: labels[i][1], x, y, w: widths[i], h: 15, hover: false });
      x += widths[i] + pad;
    }
  });
}

/* one line of guidance, and it takes itself away again */
let nudgeT = 0;
function nudge(text, secs) {
  elHint.textContent = text; elHint.className = '';
  clearTimeout(nudgeT);
  nudgeT = setTimeout(() => { if (G.hintText === text) elHint.className = 'hidden'; }, (secs || 8) * 1000);
}

function drawHint(c) {
  if (!G.hintShown || !G.hintText) return;
  const w = F.textWidth(G.hintText, 1);
  if (G.hintCine) {
    F.drawText(c, W() - w - 8, 8, G.hintText, '#c8b89a', 1, '#000000');
  } else {
    const y = signs.length ? H - 34 : (typeBarShown() ? H - 54 : talkSignShown() ? H - 32 : H - 14);
    const pulse = 0.72 + 0.28 * Math.sin(G.t * 2.4);
    c.globalAlpha = pulse;
    F.drawTextCentered(c, W() / 2, y, G.hintText, '#f4ead6', 1, '#000000');
    c.globalAlpha = 1;
  }
}

function drawSigns(c) {
  for (const s of signs) {
    SPR.px(c, s.x + s.w / 2 - 1, s.y + s.h, 2, 6, '#5a3a1e');
    SPR.roundRect(c, s.x - 2, s.y - 2, s.w + 4, s.h + 4, 3, SPR.INK);
    SPR.roundRect(c, s.x, s.y, s.w, s.h, 2, s.hover ? '#c39a63' : '#a0703c');
    SPR.px(c, s.x + 2, s.y + 2, s.w - 4, 1, '#c9a06a');
    F.drawTextCentered(c, s.x + s.w / 2, s.y + 4, s.label, s.hover ? '#2b1c10' : '#ffe9b0', 1);
  }
}

function signAt(x, y) {
  for (const s of signs) if (x >= s.x - 5 && x <= s.x + s.w + 5 && y >= s.y - 5 && y <= s.y + s.h + 5) return s;
  return null;
}

/* what happens when a tool is let go over something */
function useTool(id, x, y) {
  const onTree = Math.abs(x - CX()) < 46 && y > 40 && y < GROUND_Y + 6;
  const onHead = Math.abs(x - CX()) < 60 && y < 80;
  const onGround = y > GROUND_Y - 4;

  if (id === 'can' && onTree) { doWater(); return true; }
  if (id === 'acorn' && onGround && !onTree) { doPlant(x); return true; }
  if (id === 'hat' && (onHead || onTree)) { doHat(); return true; }
  if (id === 'pamph' && onTree) { doNews(); return true; }
  if (id === 'diary') { doDiary(); return true; }
  if (id === 'lighter' && onTree) { askBurn(); return true; }
  if (id === 'lighter' && x < 70 && y > GROUND_Y + 8) { doThrowAway(); return true; }
  if (id === 'lighter') { doFlick(); return true; }
  return false;
}

const TOOL_HINTS = {
  can: 'drag the can onto him',
  acorn: 'drag the acorn onto the grass',
  hat: 'drag the hat onto his head',
  pamph: 'drag the paper onto him',
  diary: 'drag it anywhere to read it',
  lighter: 'onto him to burn \u00b7 into the pond to be done with it'
};

/* ---------------------------------------------------------------------
   TREE INTERACTION
   --------------------------------------------------------------------- */
function heardCount(tag) {
  return DATA.lines.filter(l => (!tag || l.tag === tag) && save.heard[l.id]).length;
}
function totalCount(tag) {
  return DATA.lines.filter(l => !tag || l.tag === tag).length;
}

/* World-line progress is checked after every conversation, not only when the
   line that came up happened to be a serious one. */
function checkWorldProgress() {
  checkQuests();
  checkAreas();
  if (heardCount('world') >= 10) ACH('world10');
  if (heardCount('world') >= totalCount('world')) { ACH('worldall'); reachEnding('witness'); }
}

let knocks = [];
/* Three taps at an even tempo is a knock; the same three taps at random
   speed is just someone jabbing at a tree. The gaps have to match. */
function isKnockRhythm() {
  if (knocks.length < 3) return false;
  const [a, b, c] = knocks.slice(-3);
  const g1 = b - a, g2 = c - b;
  if (g1 < 0.14 || g1 > 0.75 || g2 < 0.14 || g2 > 0.75) return false;
  return Math.abs(g1 - g2) < Math.max(g1, g2) * 0.42;
}

function talkToTree() {
  if (G.dead || G.scene !== 'game') return;
  if (G.asleep) { wakeHim(); return; }

  // tracked before anything else, so taps that only skip the typing count too
  knocks = knocks.filter(k => G.t - k < 2.2);
  knocks.push(G.t);
  if (isKnockRhythm()) {
    knocks = [];
    skipType();
    ACH('knock');
    SFX.click(); setTimeout(() => SFX.click(), 130); setTimeout(() => SFX.click(), 260);
    G.shake = 2; G.sinceTreeClick = 0;
    say('THE WISE OAK TREE', DATA.knockLines[Math.floor(Math.random() * DATA.knockLines.length)], 'smug');
    return;
  }

  if (skipType()) return;
  G.sinceTreeClick = 0;
  squash(0.16);

  // spam detection
  G.spamCount++; G.spamTimer = 0;
  if (G.spamCount === 8) ACH('spam');
  if (G.spamCount === 30) ACH('spam2');
  if (G.spamCount > 6 && Math.random() < 0.45) {
    const l = DATA.spamLines[Math.min(DATA.spamLines.length - 1, G.spamCount - 7)];
    say('THE WISE OAK TREE', l, G.spamCount > 12 ? 'sad' : 'smug');
    if (G.spamCount > 10 && Math.random() < 0.35) triggerSneeze();
    return;
  }

  ACH('hello');
  // anything you saw elsewhere, he wants to hear about first
  if (G.toTell.length) {
    const t = G.toTell.shift();
    say('THE WISE OAK TREE', t.text, t.mood, 'serious');
    return;
  }
  // a set opening takes priority over the next line
  if (checkSets()) return;

  if (!bag.length) refillBag();
  const line = DATA.lines[bag.pop()];
  const fresh = !save.heard[line.id];
  save.heard[line.id] = 1; persist();
  say('THE WISE OAK TREE', line.text, line.mood,
      line.tag === 'world' || line.tag === 'power' ? 'serious' : '', repliesFor(line.tag));

  // listening is how you earn: every new thing he says shakes a leaf loose
  if (fresh) {
    G.inv.leaves++;
    save.stats.leavesTotal = (save.stats.leavesTotal || 0) + 1;
    G.parkMotes.push({ x: CX() + (Math.random() * 2 - 1) * 30, y: 108, t: 1 });
    spawnParticles('spark', CX() + (Math.random() * 2 - 1) * 24, 104, 2);
    checkQuests();
  }

  const hc = heardTotal();
  if (hc >= 10) ACH('chat10');
  if (hc >= 30) ACH('chat30');
  if (hc >= 60) ACH('chat60');
  if (heardCount() >= totalCount()) { ACH('chatall'); reachEnding('listener'); }
  if (line.tag === 'world') ACH('world1');
  if (line.tag === 'pop') ACH('pop1');
  if (line.tag === 'power') {
    ACH('power1');
    if (heardCount('power') >= 15) ACH('power15');
    if (heardCount('power') >= totalCount('power')) { ACH('powerall'); reachEnding('commons'); }
  }
  checkWorldProgress();
  if (heardCount('pop') >= 20) ACH('pop20');
  if (heardCount('pop') >= totalCount('pop')) { ACH('popall'); reachEnding('canon'); }
  if (line.tag === 'meta' && Math.random() < 0.2) spawnParticles('star', CX(), 60, 10);
}

function triggerSneeze() {
  if (!G.dead && G.scene === 'game') { squash(-0.7); pop('AH-CHOO!', CX(), 78, '#bfe8ff'); }
  if (G.dead || G.scene !== 'game') return;
  G.shake = 4; G.mood = 'shock';
  SFX.sneeze();
  save.stats.sneezes++; persist();
  ACH('sneeze1');
  if (save.stats.sneezes >= 10) ACH('sneeze10');
  const n = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) dropLeaf(110 + Math.random() * 40, 60 + Math.random() * 30, true);
  for (let i = 0; i < 14; i++) dropLeaf(90 + Math.random() * 76, 40 + Math.random() * 50, false);
  spawnParticles('spark', CX(), CX(), 8);
  say('THE WISE OAK TREE', DATA.sneezeLines[Math.floor(Math.random() * DATA.sneezeLines.length)], 'shock');
  G.sneezeTimer = 20 + Math.random() * 25;
  maybeSpawnSquirrel();
}

const seasonLeafCols = {
  spring: ['#8fd95a', '#5fae3c'], summer: ['#6cc73f', '#2d6b1f'],
  autumn: ['#f0b429', '#a8481a'], winter: ['#c9d6e3', '#7d8fa3']
};
function dropLeaf(x, y, collectible) {
  const c = seasonLeafCols[G.season];
  G.particles.push({
    kind: 'leaf', x, y, vx: (Math.random() * 2 - 1) * 8, vy: 16 + Math.random() * 14,
    col: c[0], col2: c[1], life: 14, max: 14, sw: Math.random() * 6.28, collectible
  });
}

function doHug() {
  if (G.dead) return;
  squash(0.55); ring(CX(), 120, '#ff9ab0', 1.4); pop('SQUEEZE', CX(), 96, '#ff9ab0');
  save.stats.hugs++; persist();
  SFX.hug();
  spawnParticles('heart', CX(), 110, 8);
  ACH('hug1');
  if (save.stats.hugs >= 10) ACH('hug10');
  const lines = [
    "Oh. OH. Okay. This is happening. I am being hugged. I am a professional. I am ALSO CRYING SAP.",
    "You are very warm and very small and I am going to think about this for eleven years.",
    "Careful, there is a beetle on that side. ...He does not mind. He says hello.",
    "Nobody has done that since 1974. Her name was Margaret. You would have liked her.",
    "I cannot hug back. I want that on the record. I am TRYING. My physiology is a prison."
  ];
  say('THE WISE OAK TREE', lines[save.stats.hugs % lines.length], 'happy');
  checkFriendEnding();
}

function doWater() {
  if (G.dead) return;
  save.stats.waters++; persist();
  SFX.water();
  G.raining = 2.2;
  for (let i = 0; i < 40; i++) G.particles.push({ kind: 'drop', x: 96 + Math.random() * 64, y: 60 + Math.random() * 60, vx: 0, vy: 60 + Math.random() * 40, life: 1.4, max: 1.4 });
  ACH('water1');
  if (save.stats.waters >= 10) ACH('water10');
  const lines = [
    "Ohhh that is the GOOD stuff. That is going straight to my xylem.",
    "Do you know how long it has been since anyone gave me water on purpose? Everyone assumes the sky handles it. THE SKY IS UNRELIABLE.",
    "*slurp* Sorry. That was undignified. Worth it.",
    "Two billion people cannot get water this clean at home. I am aware of the irony. I am drinking it anyway. Thank you.",
    "I can feel it reaching the top branches. That takes about an hour normally. You have made me FAST."
  ];
  say('THE WISE OAK TREE', lines[save.stats.waters % lines.length], 'happy');
  checkFriendEnding();
}

function checkFriendEnding() {
  if (save.stats.hugs >= 10 && save.stats.waters >= 10) reachEnding('friend');
}

function doPlant(atX) {
  if (!has('acorn')) return;
  G.inv.items.acorn = false;
  save.stats.plants++; persist();
  SFX.plant();
  const x = atX !== undefined ? atX : 30 + Math.random() * (W() - 60);
  G.saplings.push({ x: Math.floor(Math.max(8, Math.min(W() - 8, x))), age: 0, ph: Math.random() * 6.28 });
  ACH('plant');
  if (save.stats.plants >= 5 && !save.endings.grove) {
    ACH('plant5');
    refreshHUD();
    startGroveCine();
    return;
  }
  if (save.stats.plants >= 5) ACH('plant5');
  const lines = [
    "You planted one. You PLANTED one. Do you understand what you just did? You will never see it finished. That is the whole point.",
    "Another one! I am going to be a FATHER. Again. Statistically for the four thousandth time.",
    "That is three. Three is a copse. Four is a stand. Five is a WOOD. Keep going.",
    "Four. There is going to be shade here after you are gone. Somebody will sit in it and never know your name.",
    "Five. That is a wood. That is an actual wood. I have been trying to do that for nine hundred years and you did it in an afternoon."
  ];
  say('THE WISE OAK TREE', lines[Math.min(4, save.stats.plants - 1)], 'happy');
  refreshHUD();
}

function doHat() {
  G.flags.hatOn = true;
  ACH('hat'); SFX.trade();
  say('THE WISE OAK TREE', "How do I look. Do NOT answer that. I know how I look. I look INCREDIBLE.", 'smug');
  refreshActions();
}

function doNews() {
  G.flags.newsRead = true;
  ACH('paper'); SFX.page();
  // force a world line
  const unheard = DATA.lines.filter(l => l.tag === 'world' && !save.heard[l.id]);
  const pool = unheard.length ? unheard : DATA.lines.filter(l => l.tag === 'world');
  const line = pool[Math.floor(Math.random() * pool.length)];
  save.heard[line.id] = 1; persist();
  bag = bag.filter(i => DATA.lines[i].id !== line.id);
  say('THE WISE OAK TREE', line.text, line.mood, 'serious');
  ACH('world1');
  checkWorldProgress();
}

function doDiary() {
  ACH('diary'); SFX.page();
  const pages = [
    "day 812. buried acorn behind the bench. IMPORTANT. do not forget. (i will forget)",
    "day 1104. the big tree told me about the war today. i pretended i had somewhere to be. i did not have somewhere to be. i just did not know what to say.",
    "day 1290. a human gave me a chip. unprompted. i think about her every day.",
    "day 1455. i am afraid of the winter. i am not going to write that anywhere else.",
    "day 1502. sold a lighter today. bad feeling in my stomach. probably the chip."
  ];
  say("SQUIRREL'S DIARY", pages[Math.floor(Math.random() * pages.length)], 'sad');
}

/* ---------------------------------------------------------------------
   THE LIGHTER PATH
   --------------------------------------------------------------------- */
function doFlick() {
  save.stats.flicks++; persist();
  SFX.flick();
  spawnParticles('spark', 150, 120, 6);
  ACH('flick');
  if (save.stats.flicks >= 10) ACH('flick10');
  const lines = [
    "...What is that. What is that in your hand. Put that away.",
    "That is FIRE. Do you know what I am made of? I am made of the OPPOSITE of that.",
    "Okay. Ha ha. Very funny. Put it away now. Please.",
    "I have watched fire take a whole ridge in one night. I am not being dramatic. Put it away.",
    "Why do you keep doing that.",
    "Stop.",
    "Please stop.",
    "...",
    "I am not going to beg. I have been here nine hundred years and I will not beg to a person with a lighter.",
    "...Okay. I will beg. Please. There are mice in my roots."
  ];
  say('THE WISE OAK TREE', lines[Math.min(lines.length - 1, save.stats.flicks - 1)], save.stats.flicks > 4 ? 'sad' : 'shock');
}

function askBurn() {
  G.flags.confirming = true;
  openModal('ARE YOU SURE?',
    "<p>He is nine hundred years old.</p>" +
    "<p>He has a woodpecker in his elbow and mice in his roots and he has been talking to you all afternoon.</p>" +
    "<p class='small'>There is an achievement for it. There is an achievement for everything. That is not the same as a reason.</p>",
    [['Put it away', () => { closeModal(); say('THE WISE OAK TREE', "Thank you. Thank you. Okay. Okay. Let us never speak of it. ...We will absolutely speak of it.", 'happy'); }],
     ['Do it', () => { closeModal(); startBurning(); }, 'bad']]);
}

function doThrowAway() {
  G.flags.lighterGone = true;
  G.inv.items.lighter = false;
  ACH('refuse');
  refreshHUD();
  startMercyCine();
}

const BURN_LINES = [
  { at: 0.05, text: "Oh.", mood: 'shock' },
  { at: 0.16, text: "Oh, you actually- okay. Okay. The mice. Get the mice out. GET THE MICE OUT.", mood: 'shock' },
  { at: 0.34, text: "The birds are up. Good. Good. The birds are up.", mood: 'sad' },
  { at: 0.52, text: "It does not hurt the way you think. It is more like being very, very awake.", mood: 'sad' },
  { at: 0.68, text: "Four hundred and eleven years. I was going to make it to five hundred. I had PLANS. I was going to get taller than the church.", mood: 'sad' },
  { at: 0.82, text: "Listen. LISTEN. I am not angry. I want you to hear that part. I am not angry.", mood: 'sad' },
  { at: 0.92, text: "Plant one. That is all. Plant one and we are square.", mood: 'sad' }
];

function startBurning() {
  G.fleeing = true;
  G.scene = 'burning'; G.burn = 0.001; G.burnStage = 0;
  SFX.fire();
  say('THE WISE OAK TREE', "...", 'shock');
  ACH('burn');
  refreshActions();
}

/* ---------------------------------------------------------------------
   SQUIRREL
   --------------------------------------------------------------------- */
function maybeSpawnSquirrel() {
  const s = G.squirrel;
  if (s.active || s.spawned) return;
  s.spawned = true; s.active = true;
  s.holding = 'gear';
  s.dir = Math.random() < 0.5 ? 1 : -1;
  s.x = s.dir === 1 ? -14 : W() + 14;
  s.targetX = s.dir === 1 ? 186 : 70;
  s.moving = true;
  ACH('squirrel');
  setTimeout(() => {
    if (G.scene === 'game' && !G.dead)
      say('SQUIRREL', "yo. yo. down here. i used to run a whole operation out of these branches. noc put me out of business by being NICE. unbelievable.", null, 'squirrel');
  }, 1600);
}

/* He carries a gear. The gear is the settings. This is his whole life now. */
function clickSquirrel() {
  const s = G.squirrel;
  s.clicks++; s.clickT = 0;
  if (s.clicks >= 4) { ACH('poke'); SFX.squeak(); s.face = 0; say('SQUIRREL', "OW. HEY. i am a WILD ANIMAL. i have RIGHTS. (i do not have rights)", null); s.clicks = 0; return; }
  SFX.squeak();
  save.stats.sqChats++; persist();
  if (save.stats.sqChats >= 15) ACH('sqchat');
  let pool = DATA.squirrelSettingLines;
  if (has('lighter') && !G.flags.lighterGone) pool = pool.concat(DATA.squirrelWarnLines);
  say('SQUIRREL', pool[Math.floor(Math.random() * pool.length)], null, 'squirrel');
  openSettings();
}

/* ---------------------------------------------------------------------
   SETTINGS — kept by a squirrel, in a panel, because knobs need labels
   --------------------------------------------------------------------- */
/* =========================================================================
   THE SNAIL GARDEN
   Reached from heaven. Every snail that ever delivered to you is out here on
   its own lily pad, at the size its news deserved, still going nowhere.
   ========================================================================= */
function buildGarden() {
  const list = [];
  for (const id in (save.snails || {})) {
    const rec = save.snails[id];
    list.push({
      id, kind: rec.kind || 'task', name: rec.name || id, desc: rec.desc || '',
      icon: rec.icon, at: rec.at || 0, snailName: snailName(id)
    });
  }
  // the grandest post at the head of the round, then oldest first
  const rank = { ending: 0, chal: 1, goal: 2, task: 3 };
  list.sort((a, b) => (rank[a.kind] - rank[b.kind]) || (a.at - b.at));
  G.garden.list = list;
  return list;
}

function openGarden() {
  buildGarden();
  G.garden.scroll = 0; G.garden.target = 0; G.garden.hover = -1;
  G.scene = 'garden';
  hideBubble();
  elHint.className = 'hidden';
  ACH('garden');
  refreshActions();
  SFX.page();
  if (G.garden.list.length) {
    setTimeout(() => say('THE SHIFT MANAGER',
      DATA.gardenLines[Math.floor(Math.random() * DATA.gardenLines.length)], null, 'heaven'), 600);
  }
}

function closeGarden() {
  G.scene = 'heaven';
  G.garden.hover = -1;
  hideBubble();
  refreshActions();
  SFX.click();
}

function gardenMax() { return Math.max(0, SPR.gardenWidth(G.garden.list.length) - W()); }

function updateGarden(dt) {
  const gd = G.garden;
  gd.target = Math.max(0, Math.min(gardenMax(), gd.target));
  gd.scroll += (gd.target - gd.scroll) * Math.min(1, dt * 6);
}

function gardenSlotAt(x, y) {
  const gd = G.garden;
  for (let i = 0; i < gd.list.length; i++) {
    const p = SPR.gardenSlotPos(i);
    const skin = SPR.snailSkin(gd.list[i].id, gd.list[i].kind);
    const k = skin.scale * p.depth;
    const sx = p.x - gd.scroll;
    if (Math.abs(x - sx) < 14 * Math.max(1, k) && y > p.y - 26 * k && y < p.y + 10) return i;
  }
  return -1;
}

/* =========================================================================
   THE WORLD IS WIDER THAN ONE TREE
   Three places, walked between with the signposts at the edges of the frame.
   ========================================================================= */
const AREAS = DATA.areas;
function areaId() { return AREAS[G.area].id; }
function atOak() { return areaId() === 'oak'; }

/* =========================================================================
   THE MAP
   Eight hundred acres, eight places, and most of them shut until he decides
   you are ready. Nothing here is bought: every gate opens on something you
   did.
   ========================================================================= */
function areaOpen(i) {
  const a = AREAS[i];
  if (!a) return false;
  const n = a.need || {};
  if (n.heard !== undefined && heardTotal() < n.heard) return false;
  if (n.bag && !save.bag) return false;
  if (n.jobs !== undefined && Object.keys(save.questDone).length < n.jobs) return false;
  return true;
}

/* what it still wants from you, in one line */
/* the gates you have got open, checked whenever anything could have moved */
function checkAreas() {
  const open = AREAS.filter((a, i) => areaOpen(i)).length;
  if (open >= 4) ACH('area4');
  if (open >= 6) ACH('area6');
  if (open >= AREAS.length) ACH('area8');
}

function areaWants(i) {
  const a = AREAS[i];
  const n = (a && a.need) || {};
  if (n.heard !== undefined && heardTotal() < n.heard) return (n.heard - heardTotal()) + ' more things heard';
  if (n.bag && !save.bag) return 'something to carry things in';
  if (n.jobs !== undefined && Object.keys(save.questDone).length < n.jobs) return 'a job finished';
  return '';
}

function canTravel(dir) {
  const i = G.area + dir;
  return i >= 0 && i < AREAS.length && !G.cine && G.scene === 'game' && !G.dead && !panelOpen();
}

function travel(dir) {
  if (!canTravel(dir) || G.areaFadeDir) return;
  const i = G.area + dir;
  if (!areaOpen(i)) {
    SFX.deny();
    G.shake = 1.5;
    pop('SHUT', dir < 0 ? 34 : W() - 34, GROUND_Y - 34, '#d9707c');
    sayYou((AREAS[i].locked || 'Shut.') + ' \u2014 ' + areaWants(i));
    return;
  }
  if (!save.areasSeen[AREAS[i].id]) {
    save.areasSeen[AREAS[i].id] = 1; persist();
    const seen = Object.keys(save.areasSeen).length;
    if (seen >= 2) ACH('area2');
    if (AREAS.every(a => save.areasSeen[a.id])) { ACH('areaall'); reachEnding('walker'); }
  }
  puff(dir < 0 ? 14 : W() - 14, GROUND_Y + 20, 5);
  zips(dir < 0 ? 40 : W() - 40, GROUND_Y - 4, dir, 4);
  G.areaFadeDir = dir;
  G.areaFade = 0.001;
  hideBubble();
  closeChat();
  SFX.click();
}

function arriveArea() {
  G.area += G.areaFadeDir;
  G.areaFadeDir = 0;
  G.areaNow = areaId();
  G.areaTitle = 3.2;
  seedPickups();
  if (areaId() === 'lane') {
    G.noc.x = Math.round(W() * 0.62);
    ACH('lane');
    if (!save.metNoc) {
      save.metNoc = true; persist();
      laterSay(700, () => nocSay(DATA.nocIntro.join(' ')));
    } else if (!save.birdBook) {
      // the second time you come down, he gives you his book
      save.birdBook = true; persist();
      laterSay(800, () => {
        nocSay(DATA.nocBirdGift);
        ACH('birdbook');
        pushNote('goal', 'BIRD DIARY', "Noc's book of what comes through the park.", 'bird', 'birdbook');
        ring(G.noc.x, GROUND_Y - 10, '#ffcf6a', 1.2);
        pop('A BOOK', G.noc.x, GROUND_Y - 48, '#ffcf6a');
      });
    } else if (Math.random() < 0.5) {
      laterSay(900, () => nocSay(DATA.nocIdle[Math.floor(Math.random() * DATA.nocIdle.length)]));
    }
  }
  if (areaId() === 'hollow') ACH('hollow');
  if (areaId() === 'seneca') ACH('seneca');
  seedCritters();
  if (areaId() === 'rink') { ACH('rink'); G.suitTimer = 3; }
  else G.suit = null;
  // a note to yourself about wherever you have just walked into, but only if
  // nothing has happened in the meantime
  const lines = DATA.areaLines[areaId() === 'lane' ? 'ramble' : areaId()];
  if (lines && Math.random() < 0.9) {
    laterSay(900, () => sayYou(lines[Math.floor(Math.random() * lines.length)]));
  }
  refreshHUD();
  persist();
}

/* ---- things lying about, once you have somewhere to put them ---- */
function pickupReady(p) {
  if (save.taken[p.id] || has(p.id)) return false;
  if (p.need === 'backpack') return !!save.bag;
  if (p.need === 'plans3') return plansDone() >= 3;
  return true;
}

function seedPickups() {
  G.pickups = DATA.pickups
    .filter(p => p.area === areaId() && pickupReady(p))
    .map(p => ({ id: p.id, name: p.name, line: p.line,
                 x: Math.round(W() * p.x), y: GROUND_Y + 2 }));
}

function takePickup(p) {
  SFX.pickup();
  spawnParticles('star', p.x + 8, p.y + 6, 8);
  ring(p.x + 8, p.y + 6, '#fff6d8', 1.1);
  puff(p.x + 8, p.y + 10, 4);
  pop('GOT IT!', p.x + 8, p.y - 8, '#ffd24a');
  save.taken[p.id] = 1;
  if (p.id === 'backpack') {
    save.bag = true; G.hasBag = true; G.bagBadge = 1;
    ACH('backpack');
    checkAreas();
    pushNote('goal', 'YOU HAVE A BAG', 'Everything you find goes in it. Tap the bag, bottom left.', 'reach', 'backpack');
    nudge('your bag is in the bottom left corner', 10);
    say('YOU', "A backpack. Somebody's. Yours now.", null, 'serious');
  } else {
    G.inv.items[p.id] = true;
    save.items[p.id] = 1;
    G.bagBadge = 1;
    ACH('trade1');
    if (DATA.shop.every(it => has(it.id))) ACH('tradeall');
    pushNote('goal', p.name, 'It went into your bag.', p.id === 'lighter' ? 'flame' : 'reach', 'item:' + p.id);
    if (p.id === 'lighter') {
      ACH('lighter');
      persist(); seedPickups(); refreshHUD();
      startLighterCine();
      return;
    }
    say('YOU', p.line, null, 'serious');
  }
  persist();
  seedPickups();
  refreshHUD();
}

function pickupAt(x, y) {
  for (const p of G.pickups) if (x > p.x - 4 && x < p.x + 20 && y > p.y - 10 && y < p.y + 12) return p;
  return null;
}

/* =========================================================================
   NOC
   He used to sell things. He stopped. Now you talk to him, in your own
   words, and the two of you make plans.
   ========================================================================= */
function nocSay(text) {
  say('NOC', text, null, 'noc');
  G.noc.talking = Math.min(6, 1.2 + text.length * 0.03);
}

function plansDone() { return Object.keys(save.planDone).length; }

function planById(id) { return DATA.plans.find(p => p.id === id); }

function planStatus(p) {
  if (save.planDone[p.id]) return 'done';
  if (save.plans[p.id]) return 'open';
  return 'new';
}

/* what a plan still needs before it can be finished */
function planBlocker(p) {
  if (p.need.leaves && G.inv.leaves < p.need.leaves) return (p.need.leaves - G.inv.leaves) + ' more leaves';
  if (p.need.night && !SPR.isNight(G.timeOfDay)) return 'the dark. Come back at night.';
  return null;
}

function agreePlan(id) {
  const p = planById(id);
  if (!p || save.planDone[id]) return;
  if (!save.plans[id]) {
    save.plans[id] = 1; persist();
    ACH('plan1');
    nocSay("Agreed, then. " + p.ask);
    pushNote('goal', 'PLAN: ' + p.name, 'Agreed with Noc. Come back when it can be done.', 'reach', 'plan:' + p.id);
    return;
  }
  const blocker = planBlocker(p);
  if (blocker) { SFX.deny(); nocSay("Not yet. We need " + blocker); return; }
  completePlan(p);
}

function completePlan(p) {
  ring(G.noc.x, GROUND_Y, '#ffcf6a', 1.5);
  pop('AGREED', G.noc.x, GROUND_Y - 44, '#ffcf6a');
  puff(G.noc.x, GROUND_Y + 6, 5);
  if (p.need.leaves) G.inv.leaves -= p.need.leaves;
  save.planDone[p.id] = 1;
  delete save.plans[p.id];
  SFX.ach(); G.flash = 0.4;
  spawnParticles('star', G.noc.x, GROUND_Y, 14);
  nocSay(p.done);
  let gift = '';
  if (p.give.item) {
    G.inv.items[p.give.item] = true; save.items[p.give.item] = 1; G.bagBadge = 1;
    ACH('trade1');
    if (DATA.shop.every(it => has(it.id))) ACH('tradeall');
    gift = 'It is in your bag now.';
  }
  if (p.give.leaves) { G.inv.leaves += p.give.leaves; save.stats.leavesTotal += p.give.leaves; gift = p.give.leaves + ' leaves, for your trouble.'; }
  if (p.give.upgrade) { save.park.upgrades[p.give.upgrade] = 1; gift = 'The lane keeps the lights.'; }
  if (gift) setTimeout(() => nocSay(gift), 1400);
  pushNote('chal', 'PLAN DONE: ' + p.name, p.done, 'reach', 'plandone:' + p.id);
  ACH('plandone');
  checkQuests();
  if (plansDone() >= 3) ACH('plan3');
  if (plansDone() >= DATA.plans.length) { ACH('planall'); reachEnding('together'); }
  persist(); refreshHUD(); seedPickups();
}

/* ---------------------------------------------------------------------
   THE TALK BOX — your words go in, Noc's come out
   --------------------------------------------------------------------- */

/* =========================================================================
   THE TALK BOX
   The scroll is drawn on the canvas in the game's own font; a transparent
   input element sits underneath purely to raise a keyboard and collect
   keystrokes, and every character it catches is redrawn in 5x7 pixels.
   ========================================================================= */
/* =========================================================================
   TYPING TO HIM
   No panel, no log, no separate screen. There is a line at the bottom of the
   world; you type on it and he answers in the same balloon he uses for
   everything else. Typing is simply the other way of talking to him, exactly
   as available as poking him is.
   ========================================================================= */
let chatBusy = false;
const elTyping = $('typing');

function typedText() { return elTyping ? elTyping.value : ''; }

function chatPartner() { return areaId() === 'lane' ? 'noc' : atOak() ? 'oak' : null; }

function speakerName(who) { return who === 'oak' ? 'THE WISE OAK TREE' : 'NOC'; }

/* the line is there whenever there is somebody in front of you */
function typeBarShown() {
  return G.scene === 'game' && !G.cine && !G.dead && !panelOpen() && !G.holding &&
         !G.asleep && !!chatPartner();
}

function typeBarBox() {
  const w = Math.min(200, W() - 24);
  return { x: Math.round(W() / 2 - w / 2), y: H - 44, w, h: 15 };
}

function startTyping() {
  if (!typeBarShown()) return;
  G.typing = true;
  G.chatWho = chatPartner();
  if (elTyping) { try { elTyping.focus(); } catch (e) {} }
  ACH(G.chatWho === 'oak' ? 'oakchat' : 'talknoc');
}

function stopTyping() {
  G.typing = false;
  if (elTyping) { elTyping.value = ''; try { elTyping.blur(); } catch (e) {} }
}

/* kept as a name the rest of the game already calls */
function openChat(who) {
  if (!typeBarShown()) return;
  G.chatWho = who === 'oak' ? 'oak' : who === 'noc' ? 'noc' : chatPartner();
  startTyping();
}
function closeChat() { stopTyping(); }

function drawTypeBar(c) {
  if (!typeBarShown()) return;
  const b = typeBarBox();
  const on = G.typing;
  const who = chatPartner();
  // a strip of paper pinned to the bottom of the world
  SPR.roundRect(c, b.x - 2, b.y - 2, b.w + 4, b.h + 4, 3, SPR.INK);
  SPR.roundRect(c, b.x, b.y, b.w, b.h, 2, on ? '#f4e4bf' : '#cbbb9a');
  SPR.px(c, b.x + 2, b.y + 2, b.w - 4, 1, '#fbf1d8');
  SPR.px(c, b.x + 4, b.y + b.h - 3, b.w - 8, 1, on ? '#c9ad78' : '#b0a084');

  if (chatBusy) {
    F.drawText(c, b.x + 5, b.y + 4, 'thinking about it' + '.'.repeat(1 + (Math.floor(G.t * 3) % 3)), '#8f7853', 1);
    return;
  }
  const maxW = b.w - 12;
  let vis = typedText();
  while (F.textWidth(vis, 1) > maxW) vis = vis.slice(1);
  if (vis) {
    F.drawText(c, b.x + 5, b.y + 4, vis, '#35210e', 1);
    if (on && Math.sin(G.t * 6) > 0) SPR.px(c, b.x + 6 + F.textWidth(vis, 1), b.y + 4, 3, 7, '#35210e');
  } else if (on) {
    if (Math.sin(G.t * 6) > 0) SPR.px(c, b.x + 5, b.y + 4, 3, 7, '#35210e');
    F.drawText(c, b.x + 11, b.y + 4, 'type, then enter', '#8f7853', 1);
  } else {
    F.drawText(c, b.x + 5, b.y + 4, who === 'noc' ? 'say something to Noc' : 'say something to him', '#7a6a4e', 1);
  }
}

function overTypeBar(x, y) {
  if (!typeBarShown()) return false;
  const b = typeBarBox();
  return x >= b.x - 6 && x <= b.x + b.w + 6 && y >= b.y - 6 && y <= b.y + b.h + 6;
}

/* the odd commands, answered in the balloon like anything else */
function sysSay(text) { say('A NOTE TO YOURSELF', text, null, 'serious'); }

function chatCommand(text) {
  const [cmd, ...rest] = text.slice(1).split(/\s+/);
  const arg = rest.join(' ').trim();
  switch (cmd.toLowerCase()) {
    case 'help':
      sysSay('/key <anthropic key> to give them a real mind · /model · /nokey · /forget');
      return true;
    case 'key':
      if (!arg) { sysSay('Paste the key after /key. It stays in this browser.'); return true; }
      NOC_AI.setKey(arg); ACH('realai');
      sysSay('Done. They think with a real mind now (' + NOC_AI.model + ').');
      return true;
    case 'nokey':
      NOC_AI.setKey('');
      sysSay('Key cleared. Back to the brains they were born with.');
      return true;
    case 'model':
      sysSay('Model: ' + NOC_AI.setModel(arg));
      return true;
    case 'forget':
      NOC_AI.forget(G.chatWho);
      sysSay('He has forgotten the conversation. He has not forgotten you.');
      return true;
  }
  return false;
}

async function sendChat() {
  const text = typedText().trim();
  if (!text || chatBusy) return;
  if (elTyping) elTyping.value = '';
  if (text[0] === '/') { if (chatCommand(text)) return; }

  const who = G.chatWho || chatPartner() || 'oak';
  if (who === 'oak') {
    save.stats.oakChats = (save.stats.oakChats || 0) + 1;
    if (save.stats.oakChats >= 20) ACH('oakchat20');
  } else {
    save.stats.nocChats = (save.stats.nocChats || 0) + 1;
    if (save.stats.nocChats >= 12) ACH('nocchat');
  }
  persist();

  // your own words, in your own balloon, first
  say('YOU', text, null, 'serious');
  chatBusy = true;
  G.noc.thinking = 1;
  if (who === 'oak') { G.talking = true; G.mood = 'think'; squash(0.12); }

  const ctx = {
    season: G.season, night: SPR.isNight(G.timeOfDay), leaves: G.inv.leaves,
    plansDone: plansDone(), backpack: !!save.bag, heard: heardTotal()
  };
  let res;
  try { res = await NOC_AI.ask(text, ctx, who); }
  catch (e) { res = { text: "Sorry. Lost my thread. Say it again?", plan: null }; }
  chatBusy = false;
  G.noc.thinking = 0;
  if (who === 'oak') { G.mood = 'chill'; G.moodTimer = 4; G.sinceTreeClick = 0; }

  // a plan offer becomes two ordinary replies under the balloon
  const p = res.plan && who === 'noc' ? planById(res.plan) : null;
  let choices = null;
  if (p && !save.planDone[p.id]) {
    choices = [
      { tone: 'kind', text: save.plans[p.id] ? "let's do it now" : 'agreed', act: () => agreePlan(p.id) },
      { tone: 'joke', text: 'not yet', follow: "Fine. It'll keep. Everything out here keeps." }
    ];
  }
  if (who === 'oak') sayTree(res.text, 'chill');
  else nocSay(res.text);
  if (choices) { DLG.choices = choices; DLG.rects = []; DLG.hover = -1; }
  if (elTyping && G.typing) { try { elTyping.focus(); } catch (e) {} }
}

/* trim a string until it fits, with an ellipsis */
function fitText(str, maxW) {
  str = String(str);
  if (F.textWidth(str, 1) <= maxW) return str;
  let t = str;
  while (t.length > 1 && F.textWidth(t + '..', 1) > maxW) t = t.slice(0, -1);
  return t + '..';
}

/* =========================================================================
   THE BAG
   ========================================================================= */
function holdFromBag(id) {
  closeBag();
  if (!atOak() && id !== 'diary') {
    say('YOU', "Not much to use it on out here. He is back at the top of the lane.", null, 'serious');
    return;
  }
  G.holding = { id, x: CX(), y: GROUND_Y - 20, fromBag: true };
  cv.style.cursor = 'none';
  SFX.pickup();
  elHint.textContent = TOOL_HINTS[id] || 'drag it somewhere';
  elHint.className = '';
}

/* ---------------------------------------------------------------------
   MODALS / PANELS
   --------------------------------------------------------------------- */
function reachEnding(id) {
  const e = DATA.endings.find(x => x.id === id);
  if (!e) return;
  const isNew = !save.endings[id];
  save.endings[id] = Date.now(); persist();
  checkMetaAchievements();
  checkCompletionist();
  if (!isNew) return;
  showEndingCard(e);
}

function checkCompletionist() {
  const need = DATA.achievements.filter(a => a.id !== 'allach' && a.id !== 'endall');
  if (need.every(a => save.ach[a.id]) && !save.endings.completionist) reachEnding('completionist');
}

/* ---------------------------------------------------------------------
   HEAVEN / REBIRTH
   --------------------------------------------------------------------- */
function goHeaven() {
  G.scene = 'heaven';
  ACH('heaven');
  hideBubble();
  refreshActions();
  setTimeout(() => {
    if (G.scene === 'heaven') say('THE WISE OAK TREE (DECEASED)', DATA.heavenTreeLines[0], null, 'heaven');
  }, 1400);
  elHint.textContent = 'click the ghost tree · click the clouds · visit the hall · then reincarnate';
  elHint.classList.remove('hidden');
}

function openHall(from) {
  buildHall();
  G.hall.from = from || 'heaven';
  G.hall.scroll = 0; G.hall.target = 0; G.hall.dragIndex = -1;
  G.scene = 'hall';
  hideBubble();
  const got = DATA.achievements.filter(a => save.ach[a.id]).length;
  elHint.textContent = got + ' / ' + DATA.achievements.length + ' \u00b7 drag to scroll \u00b7 lift a trophy onto another plinth to rearrange';
  elHint.className = 'raised';
  refreshActions();
  SFX.ach();
}

function closeHall() {
  elHallLabel.classList.add('hidden');
  G.scene = G.hall.from === 'game' ? 'game' : 'heaven';
  if (G.scene === 'heaven') {
    elHint.textContent = 'click the ghost tree \u00b7 click the clouds \u00b7 visit the hall \u00b7 then reincarnate';
    elHint.className = 'raised';
  } else elHint.className = 'hidden';
  refreshActions();
}

function resetWorld() {
  G.burn = 0; G.dead = false; G.burnStage = 0; G.deathTimer = 0; G.ascended = false;
  G.particles = []; G.groundLeaves = []; G.saplings = [];
  G.inv = { leaves: 0, items: {} }; G.tools = []; G.holding = null; G.critters = []; seedCritters();
  G.flags = { hatOn: false, lighterGone: false, confirming: false, newsRead: false };
  G.squirrel = { active: false, x: -20, y: GROUND_Y + 6, dir: 1, moving: false, targetX: 190, face: 0, holding: null, spawned: false, clicks: 0, clickT: 0 };
  G.sneezeTimer = 12 + Math.random() * 15;
  G.mood = 'chill'; G.stare = 0; G.sinceTreeClick = 0;
  elHint.classList.add('hidden');
  refreshHUD();
}

function reincarnate() { startRebirthCine(); }

/* ---------------------------------------------------------------------
   PARTICLES
   --------------------------------------------------------------------- */
/* =========================================================================
   CARTOON
   Short, loud, and over before you can look at it properly.
   ========================================================================= */
function puff(x, y, n) {
  for (let i = 0; i < (n || 4); i++) {
    G.particles.push({ kind: 'puff', x: x + (Math.random() * 2 - 1) * 6, y: y + (Math.random() * 2 - 1) * 3,
                       vx: (Math.random() * 2 - 1) * 22, vy: -8 - Math.random() * 14,
                       life: 0.45 + Math.random() * 0.25, max: 0.7, s: 1 + Math.random() * 2 });
  }
}

function lines(x, y, col) {
  G.particles.push({ kind: 'lines', x, y, vx: 0, vy: 0, life: 0.3, max: 0.3, s: 1, col });
}

function ring(x, y, col, s) {
  G.particles.push({ kind: 'ring', x, y, vx: 0, vy: 0, life: 0.36, max: 0.36, s: s || 1, col });
}

function zips(x, y, dir, n) {
  for (let i = 0; i < (n || 3); i++) {
    G.particles.push({ kind: 'zip', x: x - dir * (4 + i * 5), y: y - 6 + i * 5,
                       vx: -dir * 90, vy: 0, life: 0.22, max: 0.22, s: Math.random() * 2, col: '#ffffff' });
  }
}

function sweat(x, y) {
  G.particles.push({ kind: 'sweat', x, y, vx: 12 + Math.random() * 10, vy: -26,
                     life: 0.7, max: 0.7, s: 1 });
}

/* a hand-lettered noise, comic style */
function pop(text, x, y, col) {
  G.particles.push({ kind: 'word', text, x, y, vx: 0, vy: 0, life: 0.95, max: 0.95, s: 1, col });
}

/* squash him, and let it spring back */
function squash(amount) { G.squash = amount; G.squashV = 0; }

function updateSquash(dt) {
  // a spring, so it overshoots the way rubber does
  const k = 220, damp = 13;
  G.squashV += (-G.squash * k) * dt;
  G.squashV -= G.squashV * damp * dt;
  G.squash += G.squashV * dt;
  if (Math.abs(G.squash) < 0.002 && Math.abs(G.squashV) < 0.02) { G.squash = 0; G.squashV = 0; }
}

function spawnParticles(kind, x, y, n) {
  for (let i = 0; i < n; i++) {
    G.particles.push({
      kind, x: x + (Math.random() * 2 - 1) * 12, y: y + (Math.random() * 2 - 1) * 8,
      vx: (Math.random() * 2 - 1) * 14, vy: kind === 'drop' ? 40 : -(12 + Math.random() * 20),
      life: 1.2 + Math.random(), max: 2.2, s: 1 + Math.floor(Math.random() * 2)
    });
  }
}

function updateParticles(dt) {
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const p = G.particles[i];
    p.life -= dt;
    if (p.kind === 'leaf') {
      p.sw += dt * 3;
      p.x += Math.sin(p.sw) * 14 * dt + p.vx * dt;
      p.y += p.vy * dt;
      if (p.y >= GROUND_Y + 2 + (p.collectible ? 0 : Math.random() * 16)) {
        if (p.collectible && G.groundLeaves.length < 14) {
          G.groundLeaves.push({ x: insetX(p.x | 0), y: GROUND_Y + 4 + Math.random() * 18, col: p.col, col2: p.col2, ph: Math.random() * 6.28, landed: true, area: areaId() });
        }
        G.particles.splice(i, 1); continue;
      }
    } else {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'fire' || p.kind === 'smoke') p.vy -= 22 * dt;
      if (p.kind === 'drop') p.vy += 120 * dt;
      if (p.kind === 'heart') p.vy -= 8 * dt;
    }
    if (p.life <= 0) G.particles.splice(i, 1);
  }
}

function collectLeaf(i) {
  { const l = G.groundLeaves[i]; if (l) { puff(l.x + 3, l.y + 3, 2); ring(l.x + 3, l.y + 3, '#d8f0a0', 0.5); } }
  G.groundLeaves.splice(i, 1);
  G.inv.leaves++;
  save.stats.leavesTotal++; persist();
  SFX.pickup();
  ACH('leaf1');
  if (save.stats.leavesTotal >= 25) ACH('leaf25');
  if (save.stats.leavesTotal >= 100) ACH('leaf100');
  if (save.stats.leavesTotal >= 250) ACH('leaf250');
  refreshHUD();
  maybeSpawnSquirrel();
}


/* ---------------------------------------------------------------------
   CINEMATICS
   A stage list with durations. Each stage may set the camera target and a
   caption; render() reads G.cine to decide what to draw.
   --------------------------------------------------------------------- */
const elCaption = $('caption');
const elHallLabel = $('halllabel');

function playCine(name, stages, onDone) {
  G.cine = { name, stages, i: 0, t: 0, done: onDone || null };
  G.scene = 'cine';
  hideBubble();
  PANEL.spec = null; PANEL.items = []; PANEL.rects = []; PANEL.unroll = 0;
  G.bagOpen = false;
  refreshActions();
  enterStage();
}

function enterStage() {
  const st = G.cine.stages[G.cine.i];
  if (!st) return;
  elHint.textContent = 'click to skip ahead';
  elHint.className = 'cine';
  if (st.cam) { G.cam.tx = st.cam[0]; G.cam.ty = st.cam[1]; G.cam.tz = st.cam[2]; }
  if (st.snap) { G.cam.x = G.cam.tx; G.cam.y = G.cam.ty; G.cam.z = G.cam.tz; }
  setCaption(st.caption || '');
  if (st.enter) st.enter();
}

function setCaption(text) {
  if (!text) { elCaption.classList.add('hidden'); elCaption.textContent = ''; return; }
  elCaption.textContent = text;
  elCaption.classList.remove('hidden');
}

function updateCine(dt) {
  const cn = G.cine;
  if (!cn) return;
  cn.t += dt;
  const st = cn.stages[cn.i];
  if (st && st.tick) st.tick(Math.min(1, cn.t / st.dur), dt);
  if (st && cn.t >= st.dur) {
    cn.i++; cn.t = 0;
    if (cn.i >= cn.stages.length) {
      const done = cn.done;
      G.cine = null; setCaption('');
      elHint.className = 'hidden';
      G.cam.tx = 0; G.cam.ty = 5; G.cam.tz = 1.09;
      if (done) done();
      return;
    }
    enterStage();
  }
}

/* click during a cinematic to jump to the next beat */
function skipStage() {
  const cn = G.cine;
  if (!cn) return;
  const st = cn.stages[cn.i];
  if (st) cn.t = st.dur;
}

function cineProgress() {
  const cn = G.cine;
  if (!cn) return 0;
  const st = cn.stages[cn.i];
  return st ? Math.min(1, cn.t / st.dur) : 0;
}
function cineStage() { return G.cine ? (G.cine.stages[G.cine.i] || {}).id : null; }

/* ---- death: the tree burns down, and something leaves it ---- */
function startDeathCine() {
  // he is still alive, and still looking at you, right up until the trunk goes
  G.dead = false;
  G.mood = 'sob';
  SFX.boom();
  playCine('death', [
    { id: 'collapse', dur: 3.4, cam: [0, 18, 1.85], caption: '',
      enter: () => { G.shake = 6; G.stillBurning = true; G.mood = 'sob'; SFX.fire(); },
      tick: (p) => {
        G.shake = Math.max(G.shake, 3 * (1 - p));
        G.mood = p > 0.82 ? 'sleepy' : 'sob';
        if (p > 0.85) G.flash = Math.max(G.flash, (p - 0.85) * 8);
      } },
    { id: 'fall', dur: 2.6, cam: [0, 4, 1.2], caption: 'Four hundred and eleven years.',
      enter: () => { G.dead = true; G.flash = 1.4; SFX.boom(); G.shake = 5; } },
    { id: 'ash', dur: 4.4, cam: [0, 5, 1.05], caption: 'The wise oak tree died.',
      enter: () => { G.stillBurning = false; spawnParticles('ash', CX(), 100, 60); } },
    { id: 'soul', dur: 4.2, cam: [0, -10, 1.3], caption: 'Something is leaving.',
      enter: () => { SFX.ascend(); } },
    { id: 'tunnel', dur: 2.8, cam: [0, 0, 1.0], snap: true, caption: '' },
    { id: 'arrive', dur: 3.4, cam: [0, 0, 1.0], caption: 'Somewhere very bright.' }
  ], () => { goHeaven(); reachEnding('arson'); });
}

/* ---- the opening: the wood, then the tree, then he notices you ---- */
/* ---- the squirrel hands over the lighter ---- */
function startLighterCine() {
  playCine('lighter', [
    { id: 'found', dur: 3.2, cam: [0, 34, 1.8], caption: 'It was lying in the grass, cold, doing nothing.',
      enter: () => { SFX.trade(); } },
    { id: 'noc', dur: 3.4, cam: [0, 16, 1.5], caption: 'Noc watched you put it in your bag and said nothing at all.' }
  ], () => {
    G.scene = 'game'; refreshHUD(); refreshActions();
    nocSay("You can leave that where you found it. I'm not going to stop you either way. That's rather the trouble with me.");
  });
}

/* ---- the lighter goes in the pond ---- */
function startMercyCine() {
  playCine('mercy', [
    { id: 'throw', dur: 2.8, cam: [-40, 30, 1.5], caption: '',
      enter: () => { SFX.water(); },
      tick: (p) => { if (p > 0.55 && !G._splashed) { G._splashed = true; spawnParticles('drop', 30, GROUND_Y + 16, 22); SFX.pickup(); } } },
    { id: 'relief', dur: 3.6, cam: [0, 10, 1.4], caption: 'sss.',
      enter: () => { G._splashed = false; G.mood = 'happy'; spawnParticles('heart', CX(), 110, 6); } }
  ], () => {
    G.scene = 'game'; refreshHUD(); refreshActions();
    reachEnding('mercy');
  });
}

/* ---- five acorns, and a very long time ---- */
function startGroveCine() {
  const day0 = G.timeOfDay;
  playCine('grove', [
    { id: 'plant', dur: 2.4, cam: [0, 30, 1.7], caption: 'Five.' },
    { id: 'years', dur: 7.0, cam: [0, 0, 1.0], caption: 'One hundred and forty years.',
      tick: (p, dt) => {
        G.timeOfDay = (day0 + p * 14) % 1;
        for (const sp of G.saplings) sp.age += dt * 26;
      } },
    { id: 'wood', dur: 3.6, cam: [0, 5, 1.09], caption: 'Nobody here will know your name.' }
  ], () => {
    G.scene = 'game'; refreshHUD(); refreshActions();
    reachEnding('grove');
  });
}

/* ---- reincarnation: dive out of heaven and grow back ---- */
function startRebirthCine() {
  save.stats.rebirths++; persist();
  ACH('reborn');
  if (save.stats.rebirths >= 5) ACH('reborn5');
  playCine('rebirth', [
    { id: 'leave', dur: 2.6, cam: [0, -10, 1.3], caption: 'Go on, then.', enter: () => SFX.ascend() },
    { id: 'dive', dur: 3.2, cam: [0, 0, 1.0], snap: true, caption: '' },
    { id: 'land', dur: 1.8, cam: [0, 0, 1.6], caption: '',
      enter: () => { G.flash = 1.5; SFX.plant(); G.shake = 4; } },
    { id: 'grow', dur: 5.0, cam: [0, 5, 1.09], caption: 'The second best time is now.',
      enter: () => { resetWorld(); SFX.hug(); } }
  ], () => {
    G.scene = 'game';
    refreshHUD(); refreshActions();
    say('THE WISE OAK TREE', "...Oh. It is you. I do not remember anything and yet I am inexplicably fond of you. Weird. Anyway: I am a tree.", 'happy');
  });
}

/* ---------------------------------------------------------------------
   UPDATE
   --------------------------------------------------------------------- */

/* the walk between places: fade out, step across, fade back in */
function updateTravel(dt) {
  if (G.areaFadeDir) {
    G.areaFade += dt * 3.2;
    if (G.areaFade >= 1) { G.areaFade = 1; arriveArea(); }
  } else if (G.areaFade > 0) {
    G.areaFade = Math.max(0, G.areaFade - dt * 2.4);
  }
}

function update(dt) {
  G.t += dt; G.dt = dt;
  G.sessionTime += dt;
  updateDialogue(dt);
  updatePanel(dt);
  updateSquash(dt);
  if (G.typing && !typeBarShown()) stopTyping();
  updateToasts(dt);
  updateParticles(dt);

  saveTimer += dt; if (saveTimer > 5) { saveTimer = 0; persist(); }
  if (G.sessionTime > 600) ACH('idle');
  updateCam(dt);
  updateTravel(dt);
  refreshArrows();
  if (G.areaTitle > 0) G.areaTitle -= dt;
  if (G.wakeT > 0) { G.wakeT -= dt; if (G.wakeT <= 0) G.asleep = false; }

  if (G.cine) {
    if (G.fleeing) updateCritters(dt);
    G.letterbox = Math.min(1, G.letterbox + dt * 2.5);
    G.flash = Math.max(0, G.flash - dt * 1.2);
    G.shake = Math.max(0, G.shake - dt * 6);
    updateCine(dt);
    return;
  }
  G.letterbox = Math.max(0, G.letterbox - dt * 3);

  if (G.scene === 'garden') { updateGarden(dt); return; }
  if (G.scene === 'hall') { updateHall(dt); return; }
  if (G.scene === 'heaven') { G.flash = Math.max(0, G.flash - dt * 0.7); return; }

  // clock + seasons
  G.timeOfDay = (G.timeOfDay + dt / G.dayLen) % 1;
  if (SPR.isNight(G.timeOfDay)) ACH('night');
  G.seasonTimer += dt;
  if (G.seasonTimer > G.seasonLen) {
    G.seasonTimer = 0;
    G.seasonIdx = (G.seasonIdx + 1) % 4;
    G.season = SEASON_NAMES[G.seasonIdx];
    save.stats.seasons[G.season] = 1; persist();
      if (SEASON_NAMES.every(s => save.stats.seasons[s])) ACH('seasons');
    if (G.scene === 'game' && !G.dead && Math.random() < 0.8) {
      const msg = {
        spring: "Spring. I am going to grow forty thousand new leaves and complain about every one of them.",
        summer: "Summer. Peak tree. This is my best season and I refuse to be humble about it.",
        autumn: "Autumn. I am about to lose my entire personality in public. Please look away.",
        winter: "Winter. I am not dead. I am simply extremely off duty."
      }[G.season];
      say('THE WISE OAK TREE', msg, G.season === 'winter' ? 'sleepy' : 'happy');
    }
  }
  save.stats.seasons[G.season] = 1;

  // idle animation
  G.blinkTimer -= dt;
  if (G.blinkTimer <= 0) { G.blink = 0.12; G.blinkTimer = 1.6 + Math.random() * 4; }
  G.blink = Math.max(0, G.blink - dt);
  G.shake = Math.max(0, G.shake - dt * 8);
  G.flash = Math.max(0, G.flash - dt * 1.4);
  G.raining = Math.max(0, G.raining - dt);
  if (!G.talking && G.mood !== 'idle' && Math.random() < dt * 0.4) G.mood = 'idle';

  G.spamTimer += dt; if (G.spamTimer > 2) G.spamCount = 0;

  for (const sp of G.saplings) sp.age += dt;

  if (areaId() === 'lane') {
    const n = G.noc;
    n.y = GROUND_Y + 8;
    n.look = Math.max(-1, Math.min(1, ((G.look.x || 0) * 0.6))) | 0;
    n.talking = Math.max(0, n.talking - dt);
    // he is not a statue: he shifts, lifts the lantern, sees to the kettle
    n.moodT = (n.moodT || 0) - dt;
    if (n.moodT <= 0) {
      n.moodT = 4 + Math.random() * 7;
      n.mood = DATA.nocMoods[Math.floor(Math.random() * DATA.nocMoods.length)];
    }
    n.lift = n.mood === 'lamp' ? Math.min(1, (n.lift || 0) + dt * 2) : Math.max(0, (n.lift || 0) - dt * 2);
    if (n.mood === 'kettle' && Math.random() < dt * 1.2) puff(G.noc.x - 30, GROUND_Y + 2, 1);
  }

  if (G.scene === 'game' && !G.dead) {
    // he does not hold one expression for long
    G.moodTimer -= dt;
    if (G.moodTimer <= 0 && !G.talking && G.stare <= 0) {
      G.moodTimer = 5 + Math.random() * 9;
      const night = SPR.isNight(G.timeOfDay);
      const pool = night ? ['chill', 'chill', 'sleepy', 'think', 'sly'] : ['chill', 'chill', 'chill', 'think', 'sly', 'smug'];
      G.mood = pool[Math.floor(Math.random() * pool.length)];
    }

    // ...and every so often he stops performing and just looks at you
    G.stareTimer -= dt;
    if (G.stareTimer <= 0 && !G.talking) {
      G.stare = 1; G.stareHold = 2.4; G.mood = 'creepy';
      G.stareTimer = 50 + Math.random() * 70;
      SFX.deny();
    }
    if (G.stare > 0) {
      G.stareHold -= dt;
      if (G.stareHold <= 0) {
        G.stare = Math.max(0, G.stare - dt * 0.9);
        if (G.stare <= 0) { G.mood = 'chill'; G.moodTimer = 4; }
      }
    }

    // something else blinks awake in the branches
    G.watcherTimer -= dt;
    if (G.watcherTimer <= 0) {
      G.watchers = 1; G.watcherHold = 1.8; G.watcherSeed = Math.floor(Math.random() * 9999);
      G.watcherTimer = 55 + Math.random() * 90;
    }
    if (G.watchers > 0) {
      G.watcherHold -= dt;
      if (G.watcherHold <= 0) G.watchers = Math.max(0, G.watchers - dt * 1.2);
    }

    updateCritters(dt);
    updateSuit(dt);
    if (atOak()) {
      updatePark(dt); updateVisitors(dt);
      // things that have just turned up are still bouncing
      if (boardHere() && G.boardPop < 1) {
        if (G.boardPop === 0) { puff(W() - parkMargin() - 26, GROUND_Y + 16, 5); SFX.plant(); }
        G.boardPop = Math.min(1, G.boardPop + dt * 1.6);
      }
      if (cottageHere() && G.cottagePop < 1) {
        if (G.cottagePop === 0) { puff(parkMargin() + 26, GROUND_Y + 14, 6); SFX.plant(); }
        G.cottagePop = Math.min(1, G.cottagePop + dt * 1.4);
      }
    }
    if (tickle.cool > 0) tickle.cool -= dt;

    // a long press on his trunk is a hug
    if (G.holdT > 0) {
      G.holdT += dt;
      if (G.holdT > 1.15) { G.holdT = 0; grab = null; elHint.className = 'hidden'; doHug(); }
    }

    // stillness ending
    G.sinceTreeClick += dt;
    if (save.ach.hello && G.sinceTreeClick > 180) { ACH('silence'); reachEnding('stillness'); G.sinceTreeClick = -1e9; }

    // sneezes
    G.sneezeTimer -= dt;
    if (G.sneezeTimer <= 0) { if (atOak()) triggerSneeze(); else G.sneezeTimer = 12; }

    // ambient falling leaves
    const rate = (G.season === 'autumn' ? 2.2 : G.season === 'winter' ? 0.3 : 0.5) * (atOak() ? 1 : 0.5);
    if (Math.random() < dt * rate) dropLeaf(atOak() ? 80 + Math.random() * 96 : Math.random() * W(),
                                            40 + Math.random() * 40, Math.random() < 0.35);

    // squirrel appears on its own eventually
    if (atOak() && !G.squirrel.spawned && G.sessionTime > 45) maybeSpawnSquirrel();
  }

  // squirrel movement
  const s = G.squirrel;
  if (s.active) {
    s.clickT += dt;
    if (s.clickT > 1.2) s.clicks = 0;
    if (s.moving) {
      const d = s.targetX - s.x;
      if (Math.abs(d) < 2) { s.moving = false; s.face = 1; }
      else {
        s.x += Math.sign(d) * 46 * dt; s.dir = Math.sign(d);
        if (Math.random() < dt * 9) puff(s.x - s.dir * 6, s.y + 3, 1);
      }
    } else if (Math.random() < dt * 0.25) {
      s.targetX = inset() + 20 + Math.random() * Math.max(40, W() - inset() * 2 - 40);
      if (Math.abs(s.targetX - s.x) > 20) s.moving = true;
    }
    if (G.dead || G.scene === 'burning') { s.targetX = s.x < CX() ? -24 : W() + 24; s.moving = true; s.face = 0; }
  }

  // burning
  if (G.scene === 'burning') {
    updateCritters(dt);
    G.burn = Math.min(1, G.burn + dt / 16);
    G.shake = Math.max(G.shake, 1.2);
    if (Math.random() < dt * 30) {
      G.particles.push({ kind: 'fire', x: 90 + Math.random() * 76, y: 40 + Math.random() * 90, vx: (Math.random() * 2 - 1) * 8, vy: -20 - Math.random() * 30, life: 0.9, max: 0.9, s: 1 + Math.floor(Math.random() * 2) });
    }
    if (Math.random() < dt * 14) {
      G.particles.push({ kind: 'smoke', x: 100 + Math.random() * 56, y: 30 + Math.random() * 60, vx: (Math.random() * 2 - 1) * 6, vy: -14, life: 2.4, max: 2.4, s: 2 + Math.floor(Math.random() * 3) });
    }
    while (G.burnStage < BURN_LINES.length && G.burn >= BURN_LINES[G.burnStage].at) {
      const b = BURN_LINES[G.burnStage++];
      say('THE WISE OAK TREE', b.text, b.mood, 'serious');
    }
    if (G.burn >= 1) startDeathCine();
  }
}

/* ---------------------------------------------------------------------
   THE PARK
   Leaves are a currency. Things you build make more of them. The park
   itself grows outward as you can afford it.
   --------------------------------------------------------------------- */
const BUILD_BY_ID = {}; DATA.build.forEach(b => BUILD_BY_ID[b.id] = b);

/* =========================================================================
   HOW FULL THE PARK IS
   It starts as one tree standing in grass. Nothing else is here yet: no
   noticeboard, no cottage, barely any undergrowth. Everything arrives later,
   and everything arrives with a bounce.
   ========================================================================= */
function parkFill() {
  const things = save.park.props.length;
  const jobs = Object.keys(save.questDone).length;
  const plans = plansDone();
  return Math.min(1, (things * 0.14) + (jobs * 0.07) + (plans * 0.05) + save.park.expansions * 0.06);
}

/* the board turns up once he has spoken to you at all; the cottage once
   there is anything in the park worth writing down */
function boardHere() { return heardCount() >= 1; }
function cottageHere() { return save.park.props.length > 0 || Object.keys(save.questDone).length > 0; }

/* 0 while it is arriving, 1 once it has settled — a squashy pop-in */
function popScale(t) {
  if (t >= 1) return 1;
  const k = Math.max(0, t);
  return 1 + Math.sin(k * Math.PI * 1.5) * 0.35 * (1 - k);
}

function parkMargin() {
  const step = [0.16, 0.105, 0.055, 0.015][Math.min(3, save.park.expansions)];
  return Math.round(W() * step);
}

/* Fewer plots than there used to be, and further apart. An empty park with
   three good things in it beats a full one with ten. */
function plotCount() { return 2 + save.park.expansions * 2; }

/* evenly spaced building plots along the grass, skipping the tree */
function plotPos(i) {
  const n = plotCount();
  const m = parkMargin() + 26;
  const span = W() - m * 2;
  let x = m + (span / (n + 1)) * (i + 1);
  if (Math.abs(x - CX()) < 62) x += (x < CX() ? -1 : 1) * 62;
  return { x: Math.round(x), y: GROUND_Y + 16 + (i % 2) * 10 };
}

function propAtPlot(i) { return save.park.props.find(p => p.plot === i); }

function incomeMultiplier() {
  let m = 1;
  if (save.park.upgrades.sign) m *= 1.5;
  if (save.park.upgrades.compost) m *= 2;
  return m;
}

function parkIncome() {
  let r = 0;
  for (const p of save.park.props) {
    const b = BUILD_BY_ID[p.type];
    if (!b) continue;
    let rate = b.rate;
    if (p.type === 'sapling') rate *= 1 + Math.min(2, p.age / 240);   // saplings grow
    r += rate;
  }
  const night = SPR.isNight(G.timeOfDay);
  const hasLamp = save.park.props.some(p => p.type === 'lamp');
  return r * incomeMultiplier() * (night && !hasLamp ? 0.4 : 1);
}

function updatePark(dt) {
  if (!save.park.props.length) return;
  for (const p of save.park.props) p.age += dt;
  G.parkPending += parkIncome() * dt;
  while (G.parkPending >= 1) {
    G.parkPending -= 1;
    save.park.earned++;
    if (save.park.upgrades.rake) {
      G.inv.leaves++; save.stats.leavesTotal++;
      G.parkMotes.push({ x: plotPos(Math.floor(Math.random() * plotCount())).x, y: GROUND_Y + 4, t: 1 });
    } else if (G.groundLeaves.length < 10) {
      const src = save.park.props[Math.floor(Math.random() * save.park.props.length)];
      const pos = plotPos(src.plot);
      const c = ['#8fd95a', '#5fae3c'];
      G.groundLeaves.push({ x: insetX(pos.x + (Math.random() - 0.5) * 24), y: GROUND_Y + 6 + Math.random() * 20,
                            col: c[0], col2: c[1], ph: Math.random() * 6.28, landed: true, area: 'oak' });
    }
  }
  for (let i = G.parkMotes.length - 1; i >= 0; i--) {
    const m = G.parkMotes[i];
    m.t -= dt; m.y -= 22 * dt;
    if (m.t <= 0) G.parkMotes.splice(i, 1);
  }
  checkParkAchievements();
}

function checkParkAchievements() {
  const n = save.park.props.length;
  if (n >= 1) ACH('build1');
  if (n >= 5) ACH('build5');
  if (n >= 10) ACH('build10');
  if (save.park.expansions >= 1) ACH('expand1');
  if (save.park.expansions >= 3) ACH('expand3');
  if (parkIncome() >= 1) ACH('income1');
  if (save.park.earned >= 500) ACH('earned500');
  if (DATA.upgrades.every(u => save.park.upgrades[u.id])) ACH('upgrades');
  if (DATA.build.every(b => save.park.props.some(p => p.type === b.id))) ACH('buildall');
}

/* ---- visitors ---- */
function updateVisitors(dt) {
  const benches = save.park.props.filter(p => p.type === 'bench');
  G.visitorTimer -= dt;
  const wanted = benches.length ? (save.park.upgrades.gate ? 2 : 1) : 0;
  if (G.visitorTimer <= 0 && G.visitors.length < wanted) {
    G.visitorTimer = 14 + Math.random() * 20;
    const b = benches[Math.floor(Math.random() * benches.length)];
    const target = plotPos(b.plot);
    G.visitors.push({
      x: Math.random() < 0.5 ? -10 : W() + 10, y: GROUND_Y + 26, tx: target.x, ty: GROUND_Y + 26,
      state: 'walk', t: 0, happy: 0, ph: Math.random() * 6.28,
      col: ['#4a6a9a', '#8a4a5a', '#4a7a5a', '#8a6a3a'][Math.floor(Math.random() * 4)],
      hair: ['#3a2a1a', '#6b4a2a', '#2a2a2a', '#a86a3a'][Math.floor(Math.random() * 4)]
    });
  }
  for (let i = G.visitors.length - 1; i >= 0; i--) {
    const v = G.visitors[i];
    v.happy = Math.max(0, v.happy - dt * 0.5);
    if (v.state === 'walk') {
      const d = v.tx - v.x;
      v.x += Math.sign(d) * 24 * dt;
      if (Math.abs(d) < 2) { v.state = 'sit'; v.t = 8 + Math.random() * 12; }
    } else if (v.state === 'sit') {
      v.t -= dt;
      if (v.t <= 0) {
        v.state = 'leave';
        v.tx = v.x < CX() ? -20 : W() + 20;
        v.happy = 2;
        const tip = 2 + Math.floor(Math.random() * 4 * incomeMultiplier());
        G.inv.leaves += tip; save.stats.leavesTotal += tip; save.park.earned += tip;
        save.stats.visitorsSat = (save.stats.visitorsSat || 0) + 1;
        ACH('visitor'); checkQuests();
        G.parkMotes.push({ x: v.x, y: GROUND_Y + 10, t: 1.2 });
        SFX.pickup();
      }
    } else {
      v.x += Math.sign(v.tx - v.x) * 26 * dt;
      if (v.x < -18 || v.x > W() + 18) G.visitors.splice(i, 1);
    }
  }
}

/* Leaves are still a currency, but the only thing they buy is a promise:
   Noc's plans cost leaves. Nothing in the park has a price any more. */
function canAfford(n) { return G.inv.leaves >= n; }

/* He is a tree. He is rooted in one place and he cannot see the rest of the
   park, so he only ever speaks where he is standing. Anywhere else, what you
   get is your own eyes, and he hears about it when you come back. */
function sayTree(text, mood) {
  if (!atOak()) return false;
  say('THE WISE OAK TREE', text, mood || 'idle', '');
  return true;
}

/* A line scheduled on a timer must not interrupt. If the balloon is busy, if
   somebody is waiting on a reply, or if you have walked off, it is dropped. */
function laterSay(ms, fn) {
  const here = areaId();
  setTimeout(() => {
    if (G.scene !== 'game' || G.cine || G.dead) return;
    if (DLG.on || chatBusy || panelOpen()) return;
    if (areaId() !== here) return;
    fn();
  }, ms);
}

/* your own voice, for everywhere he is not */
function sayYou(text) { say('YOU', text, null, 'serious'); }

/* something to tell him about next time you are back under him */
function tellHimLater(text, mood) {
  if (atOak()) { sayTree(text, mood); return; }
  G.toTell.push({ text, mood: mood || 'think' });
  if (G.toTell.length > 6) G.toTell.shift();
}

/* ---------------------------------------------------------------------
   MENUS — wooden panels nailed up in the park, not interface
   --------------------------------------------------------------------- */
/* =========================================================================
   THE BOARD
   Nothing here has a price. Everything on the board is a job somebody asked
   you to do, and the park gets built out of the jobs you finish.
   ========================================================================= */
function questById(id) { return DATA.quests.find(q => q.id === id); }

function questStatus(q) {
  if (save.questDone[q.id]) return 'done';
  if (save.quests[q.id]) return 'open';
  return 'new';
}

/* a job is only on the board once the person who wants it has met you */
function questOffered(q) { return q.from === 'oak' ? true : !!save.metNoc; }

function questCount(key) {
  switch (key) {
    case 'heard':       return heardCount();
    case 'waters':      return save.stats.waters || 0;
    case 'hugs':        return save.stats.hugs || 0;
    case 'plants':      return save.stats.plants || 0;
    case 'leavesTotal': return save.stats.leavesTotal || 0;
    case 'visitors':    return save.stats.visitorsSat || 0;
    case 'plans':       return plansDone();
    case 'critters':    return Object.keys(save.stats.crittersMet || {}).length;
    case 'seasons':     return Object.keys(save.stats.seasons || {}).length;
    case 'propsMax':    return save.park.props.length;
    default:            return 0;
  }
}

function questMet(q) {
  for (const key in q.need) {
    const want = q.need[key], got = questCount(key);
    if (key === 'propsMax') { if (got > want) return false; }
    else if (got < want) return false;
  }
  return true;
}

function questProgress(q) {
  const bits = [];
  for (const key in q.need) {
    const want = q.need[key], got = questCount(key);
    if (key === 'propsMax') bits.push(got + '/' + want + ' things in the park' + (got > want ? ' — too many' : ''));
    else bits.push(Math.min(got, want) + '/' + want + ' ' + QUEST_UNITS[key]);
  }
  return bits.join(' · ');
}

const QUEST_UNITS = {
  heard: 'heard', waters: 'waterings', hugs: 'hugs', plants: 'planted',
  leavesTotal: 'leaves', visitors: 'visitors', plans: 'plans kept',
  critters: 'creatures', seasons: 'seasons'
};

function acceptQuest(id) {
  const q = questById(id);
  if (!q || save.quests[id] || save.questDone[id]) return;
  save.quests[id] = 1; persist();
  ACH('quest1');
  SFX.page();
  const voice = q.from === 'oak' ? sayTree : nocSay;
  voice(q.ask, 'think');
  pushNote('goal', 'JOB: ' + q.name, q.desc, 'reach', 'quest:' + id);
}

/* checked after anything that could move a counter */
function checkQuests() {
  for (const q of DATA.quests) {
    if (!save.quests[q.id] || save.questDone[q.id]) continue;
    if (questMet(q)) finishQuest(q);
  }
}

function finishQuest(q) {
  save.questDone[q.id] = 1;
  delete save.quests[q.id];
  SFX.ach(); G.flash = 0.4;
  spawnParticles('star', CX(), 110, 12);
  squash(-0.45); ring(CX(), 112, '#fff6d8', 1.8);
  pop('JOB DONE!', CX(), 80, '#b8e86a');
  ACH('questdone');
  if (DATA.quests.every(x => save.questDone[x.id])) { ACH('questall'); reachEnding('gardener'); }

  const r = q.reward || {};
  if (r.prop) grantProp(r.prop);
  if (r.upgrade) { save.park.upgrades[r.upgrade] = 1; }
  if (r.expand) { save.park.expansions = Math.min(3, save.park.expansions + r.expand); }
  if (r.leaves) { G.inv.leaves += r.leaves; save.stats.leavesTotal += r.leaves; }

  persist();
  checkParkAchievements();
  checkAreas();
  refreshHUD();
  const voice = q.from === 'oak' ? sayTree : nocSay;
  voice(q.done, 'happy');
  pushNote('chal', 'JOB DONE: ' + q.name, (r.line || '') + ' ' + q.done, 'reach', 'questdone:' + q.id);
}

/* a thing appears in the park, free, because you earned it */
function grantProp(type) {
  const free = [];
  for (let i = 0; i < plotCount(); i++) if (!propAtPlot(i)) free.push(i);
  if (!free.length) return false;
  const plot = free[Math.floor(Math.random() * free.length)];
  save.park.props.push({ type, plot, age: 0 });
  SFX.plant();
  const at = plotPos(plot);
  spawnParticles('star', at.x, GROUND_Y + 4, 8);
  puff(at.x, at.y, 7);
  ring(at.x, at.y - 6, '#d8f0a0', 1.2);
  pop('TA-DA!', at.x, at.y - 22, '#b8e86a');
  return true;
}

/* ---- the board itself: a list of jobs, not a list of prices ---- */
const REST_ZOOM = 1.09;
function inset() { return Math.ceil((W() - W() / REST_ZOOM) / 2) + 6; }
function insetX(x) { return Math.max(inset(), Math.min(W() - inset(), x)); }
const BIRD_COLS = ['#8a4a3a', '#4a6a8a', '#6a5a3a', '#3a5a4a'];

/* which species are about, and where */
const BIRD_BY_ID = {};
DATA.birds.forEach(b => BIRD_BY_ID[b.id] = b);

const AREA_BIRDS = {
  oak:     ['cardinal', 'jay', 'robin', 'wood', 'sparrow', 'starling'],
  lane:    ['warbler', 'jay', 'wood', 'owl', 'cardinal'],
  hollow:  ['owl', 'warbler', 'hawk', 'wood', 'robin'],
  seneca:  ['sparrow', 'robin', 'starling', 'cardinal'],
  bridge:  ['duck', 'egret', 'pigeon', 'starling'],
  mall:    ['pigeon', 'sparrow', 'starling', 'jay'],
  terrace: ['pigeon', 'sparrow', 'duck', 'egret'],
  rink:    ['pigeon', 'starling', 'hawk']
};

function birdsHere() {
  const list = AREA_BIRDS[areaId()] || AREA_BIRDS.oak;
  const night = SPR.isNight(G.timeOfDay);
  const out = list.filter(id => BIRD_BY_ID[id] && (!BIRD_BY_ID[id].night || night));
  return out.length ? out : ['sparrow'];
}

function seedCritters() {
  G.critters = [];
  const branchPerch = () => {
    const b = SPR.CANOPY[Math.floor(Math.random() * SPR.CANOPY.length)];
    return { x: b.x + (Math.random() - 0.5) * 20, y: b.y + 14 };
  };
  const here = birdsHere();
  for (let i = 0; i < 5; i++) {
    const sp = BIRD_BY_ID[here[i % here.length]];
    const p = atOak() ? branchPerch()
                      : { x: inset() + Math.random() * (W() - inset() * 2), y: 70 + Math.random() * 60 };
    G.critters.push({ kind: 'bird', sp, x: p.x, y: p.y, hx: p.x, hy: p.y, col: sp.body,
                      ph: Math.random() * 6.28, flying: false, t: 2 + Math.random() * 9, vx: 0, vy: 0 });
  }
  for (let i = 0; i < 3; i++) {
    G.critters.push({ kind: 'dragonfly', x: inset() + Math.random() * (W() - inset() * 2),
                      y: 100 + Math.random() * 50, col: ['#5fc7d0', '#c05fd0', '#d0a75f'][i % 3],
                      ph: Math.random() * 6.28, t: 0, sp2: 0.7 + Math.random() * 0.8 });
  }
  const wingCols = ['#ffd24a', '#e88ac0', '#8ac8f0', '#b8e86a', '#e8a05a', '#c8a0f0', '#f0e0a0'];
  for (let i = 0; i < 10; i++) {
    G.critters.push({ kind: 'butterfly', x: inset() + Math.random() * (W() - inset() * 2), y: 84 + Math.random() * 62,
                      col: wingCols[i % wingCols.length], ph: Math.random() * 6.28, t: 0,
                      sp: 0.6 + Math.random() * 0.9 });
  }
  // the bright one. It is the credits, and it knows it.
  G.critters.push({ kind: 'butterfly', credit: true, x: CX() + 40, y: 96,
                    col: '#ffd24a', ph: 1.4, t: 0, sp: 0.7 });
  for (let i = 0; i < 3; i++) {
    G.critters.push({ kind: 'beetle', x: CX() - 40 + i * 40, y: 122 + i * 9, ph: i, dir: i % 2 ? 1 : -1, t: 0, home: CX() - 40 + i * 40 });
  }
  for (let i = 0; i < 2; i++) {
    G.critters.push({ kind: 'rabbit', x: insetX(40 + i * 90), y: GROUND_Y + 20 + i * 8,
                      dir: 1, moving: false, t: 2 + i * 3, ph: i });
  }
}

function updateCritters(dt) {
  // when the tree goes up, everything living in it leaves
  if (G.fleeing) {
    for (let i = G.critters.length - 1; i >= 0; i--) {
      const k = G.critters[i];
      k.flying = true; k.moving = true;
      k.x += (k.fx || (k.fx = k.x < CX() ? -1 : 1)) * (k.kind === 'rabbit' ? 70 : 46) * dt;
      if (k.kind !== 'rabbit') k.y -= 26 * dt;
      if (k.x < -20 || k.x > W() + 20 || k.y < -20) G.critters.splice(i, 1);
    }
    return;
  }
  for (const k of G.critters) {
    k.t -= dt;
    if (k.kind === 'bird') {
      if (k.flying) {
        k.x += k.vx * dt; k.y += k.vy * dt;
        if (k.t <= 0) {
          k.flying = false;
          const b = SPR.CANOPY[Math.floor(Math.random() * SPR.CANOPY.length)];
          k.x = b.x + (Math.random() - 0.5) * 20; k.y = b.y + 14;
          k.t = 6 + Math.random() * 12;
        }
      } else if (k.t <= 0) {
        k.flying = true; k.t = 2.5 + Math.random() * 2;
        k.vx = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 30);
        k.vy = -14 - Math.random() * 12;
      }
    } else if (k.kind === 'butterfly') {
      const sp = k.sp || 1;
      k.x += (Math.sin(G.t * 0.7 * sp + k.ph) * 16 + 6) * sp * dt;
      k.y += Math.sin(G.t * 1.9 * sp + k.ph) * 12 * dt;
      if (k.x > W() - inset()) k.x = inset();
      k.y = Math.max(66, Math.min(GROUND_Y + 22, k.y));
    } else if (k.kind === 'dragonfly') {
      const dsp = k.sp2 || 1;
      k.x += Math.cos(G.t * 0.9 * dsp + k.ph) * 34 * dt;
      k.y += Math.sin(G.t * 1.7 * dsp + k.ph) * 20 * dt;
      k.x = Math.max(inset(), Math.min(W() - inset(), k.x));
      k.y = Math.max(88, Math.min(GROUND_Y + 16, k.y));
    } else if (k.kind === 'beetle') {
      k.x += k.dir * 5 * dt;
      k.y += Math.sin(G.t * 0.6) * 3 * dt;
      if (Math.abs(k.x - (k.home === undefined ? CX() : k.home)) > 22) k.dir *= -1;
      k.y = Math.max(96, Math.min(146, k.y));
    } else if (k.kind === 'rabbit') {
      if (k.moving) {
        k.x += k.dir * 26 * dt;
        if (k.t <= 0) { k.moving = false; k.t = 3 + Math.random() * 7; }
        if (k.x < inset() + 6 || k.x > W() - inset() - 6) k.dir *= -1;
        k.x = insetX(k.x);
      } else if (k.t <= 0) {
        k.moving = true; k.t = 0.8 + Math.random() * 1.2;
        k.dir = Math.random() > 0.5 ? 1 : -1;
      }
    }
  }
}

function critterAt(x, y) {
  for (const k of G.critters) {
    const r = k.credit ? 10 : k.kind === 'rabbit' ? 10 : k.kind === 'beetle' ? 5 : 7;
    if (Math.abs(x - k.x) < r && Math.abs(y - k.y) < r + 2) return k;
  }
  return null;
}

function touchCritter(k) {
  if (k.kind === 'bird' && k.sp) {
    const first = !save.birds[k.sp.id];
    save.birds[k.sp.id] = (save.birds[k.sp.id] || 0) + 1;
    persist();
    const n = Object.keys(save.birds).length;
    ACH('bird1');
    if (n >= 5) ACH('bird5');
    if (n >= 10) ACH('bird10');
    if (n >= DATA.birds.length) { ACH('birdall'); reachEnding('birder'); }
    if (first) {
      SFX.ach();
      pop(k.sp.name, k.x, k.y - 14, '#d8f0a0');
      spawnParticles('star', k.x, k.y, 6);
      if (save.birdBook) pushNote('goal', k.sp.name, k.sp.note, 'bird', 'bird:' + k.sp.id);
    }
  }
  if (k.credit) {
    SFX.ach();
    spawnParticles('star', k.x, k.y, 10);
    say('THE WISE OAK TREE', DATA.creditLines[Math.floor(Math.random() * DATA.creditLines.length)], 'happy');
    setTimeout(openCredits, 900);
    return;
  }
  const lines = DATA.critterLines[k.kind];
  if (k.kind === 'bird' && !k.flying) { k.flying = true; k.t = 2.4; k.vx = (Math.random() > .5 ? 1 : -1) * 44; k.vy = -18; }
  if (k.kind === 'rabbit') { k.moving = true; k.t = 1.4; k.dir = k.x < CX() ? -1 : 1; }
  ACH('critter');
  pop(k.kind === 'rabbit' ? 'BOING' : k.kind === 'bird' ? 'TWEET' : k.kind === 'beetle' ? 'SKITTER' : 'FLUTTER',
      k.x, k.y - 10, '#ffe9a0');
  puff(k.x, k.y + 4, 3);
  save.stats.crittersMet = save.stats.crittersMet || {};
  save.stats.crittersMet[k.kind] = 1;
  persist();
  SFX.squeak();
  say('THE WISE OAK TREE', lines[Math.floor(Math.random() * lines.length)], 'happy');
}

/* camera easing — cinematics move it, everything else leaves it alone */
function updateCam(dt) {
  if (!G.cine) {
    const rest = (G.scene === 'hall' || G.scene === 'heaven' || G.scene === 'garden') ? [0, 0, 1] : [0, 5, 1.09];
    G.cam.tx = rest[0]; G.cam.ty = rest[1]; G.cam.tz = rest[2];
  }
  const k = Math.min(1, dt * 2.4);
  G.cam.x += (G.cam.tx - G.cam.x) * k;
  G.cam.y += (G.cam.ty - G.cam.y) * k;
  G.cam.z += (G.cam.tz - G.cam.z) * k;
}

function updateHall(dt) {
  const h = G.hall;
  const maxScroll = Math.max(0, SPR.hallWidth(h.order.length) - W());
  h.target = Math.max(0, Math.min(maxScroll, h.target));
  h.scroll += (h.target - h.scroll) * Math.min(1, dt * 8);
}

function sortHall() {
  SFX.click();
  const rank = { chal: 0, goal: 1, task: 2 };
  G.hall.order.sort((a, b) => {
    const ua = G.hall.unlocked[a] ? 0 : 1, ub = G.hall.unlocked[b] ? 0 : 1;
    if (ua !== ub) return ua - ub;
    const ra = rank[G.hall.tier[a]], rb = rank[G.hall.tier[b]];
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
  save.hallOrder = G.hall.order.slice(); persist();
}

/* ---------------------------------------------------------------------
   RENDER
   --------------------------------------------------------------------- */
function drawWorld(opts) {
  const o = opts || {};
  if (!atOak() && !o.fall && o.growing === undefined) { drawSideArea(); return; }
  SPR.drawBackdrop(dc, G);
  if (G.burn > 0 && !o.growing) {
    // firelight swallows the daylight
    dc.globalAlpha = Math.min(0.40, G.burn * 0.45);
    SPR.px(dc, 0, 0, W(), H, '#5a1f0c');
    dc.globalAlpha = 1;
  }
  SPR.drawGround(dc, G);
  SPR.drawPond(dc, G);
  const fill = parkFill();
  if (fill > 0.05) SPR.drawBoundary(dc, G, parkMargin());
  if (fill > 0.02) SPR.drawCosyFoliage(dc, G, 404, 0.15 + fill * 0.85);
  SPR.drawFireGlow(dc, G);

  // everything solid in the foreground shares one dark contour
  const L = SPR.layerBegin();
  SPR.drawGroundItems(L, G);
  if (o.fall) {
    SPR.drawStump(L, G);
    // the trunk goes over, hinged where it snapped
    L.save();
    L.translate(CX(), GROUND_Y + 4);
    L.rotate(o.fall * 1.15);
    L.translate(-CX(), -(GROUND_Y + 4));
    SPR.drawTree(L, G);
    L.restore();
  } else if (o.growing !== undefined) {
    SPR.drawGrowingTree(L, G, o.growing);
  } else {
    // squash and stretch, hinged at his roots
    SPR.squashTransform(L, CX(), GROUND_Y + 6, G.squash);
    SPR.drawTree(L, G);
    SPR.drawWatchers(L, G);
    L.restore();
  }
  // the park you have built
  if (!o.fall && o.growing === undefined) {
    if (cottageHere()) {
      const k = popScale(G.cottagePop);
      L.save();
      L.translate(parkMargin() + 26, GROUND_Y + 12); L.scale(k, k);
      L.translate(-(parkMargin() + 26), -(GROUND_Y + 12));
      SPR.drawCottage(L, G, parkMargin() + 26, GROUND_Y + 12);
      L.restore();
    }
    if (boardHere()) {
      const k = popScale(G.boardPop);
      const bx = W() - parkMargin() - 26;
      L.save();
      L.translate(bx, GROUND_Y + 14); L.scale(k, k); L.translate(-bx, -(GROUND_Y + 14));
      SPR.drawNoticeBoard(L, G, bx, GROUND_Y + 14);
      L.restore();
    }
    for (const pr of save.park.props) {
      const pos = plotPos(pr.plot);
      const grown = popScale(pr.age / 0.8);
      L.save();
      L.translate(pos.x, pos.y); L.scale(grown, grown); L.translate(-pos.x, -pos.y);
      if (pr.type === 'sapling') {
        const h = Math.min(30, 6 + pr.age * 0.25);
        const sway = Math.sin(G.t * 1.5 + pr.plot) * 1.2;
        SPR.px(L, pos.x, pos.y - h, 2, h, '#5a7a32');
        SPR.pcircle(L, pos.x + sway, pos.y - h - 1, 3 + h * 0.28, '#4a9235');
        SPR.pcircle(L, pos.x + sway - 1, pos.y - h - 3, 2 + h * 0.18, '#6fbc45');
      }
      else if (pr.type === 'flowers') SPR.drawFlowerbed(L, G, pos.x, pos.y);
      else if (pr.type === 'bench') SPR.drawBench(L, G, pos.x, pos.y);
      else if (pr.type === 'bath') SPR.drawBirdbath(L, G, pos.x, pos.y);
      else if (pr.type === 'hive') SPR.drawHive(L, G, pos.x, pos.y);
      else if (pr.type === 'lamp') SPR.drawLamp(L, G, pos.x, pos.y);
      L.restore();
    }
    for (const v of G.visitors) SPR.drawVisitor(L, G, v);
  }
  SPR.drawSquirrel(L, G);
  if (!o.fall && o.growing === undefined) { SPR.drawCritters(L, G); SPR.drawTools(L, G); }
  SPR.layerEnd(dc, '#1a0f08');

  SPR.drawFireOnTree(dc, G);
  if (G.asleep && !G.dead) SPR.drawZzz(dc, G, CX() + 34, 84, 1.4);
  SPR.drawParticles(dc, G);
  // leaves the rake collected, floating up
  for (const m of G.parkMotes) {
    dc.globalAlpha = Math.max(0, m.t);
    SPR.drawLeafSprite(dc, m.x, m.y, '#8fd95a', '#3a7a28');
    dc.globalAlpha = 1;
  }
  if (fill > 0.1) SPR.drawUndergrowth(dc, G);
  if (fill > 0.25) SPR.drawForeground(dc, G);
  drawPickups(dc);
  if (fill > 0.4) SPR.drawVines(dc, G, 51);
  SPR.drawFrameFoliage(dc, G);
  SPR.drawBokeh(dc, G);
  SPR.drawOverlay(dc, G);

  if (!o.fall && hover.kind === 'leaf') {
    const l = G.groundLeaves[hover.i];
    if (l) {
      dc.globalAlpha = 0.45 + Math.sin(G.t * 8) * 0.2;
      SPR.pcircle(ctx, l.x + 3, l.y + 2, 7, '#ffffff');
      dc.globalAlpha = 1;
      SPR.drawLeafSprite(ctx, l.x, l.y, l.col, l.col2);
    }
  }
}


/* -------------------------------------------------------------------------
   THE LANE AND THE HOLLOW
   Same sky, same clock, same weather. Everything else is different, and
   deliberately emptier than the park: the point of them is the room.
   ------------------------------------------------------------------------- */
function drawSideArea() {
  const id = areaId();
  const lane = id === 'lane';
  const wild = lane || id === 'hollow' || id === 'seneca';

  SPR.drawBackdrop(dc, G);
  SPR.drawGround(dc, G);

  // the ground each place is actually made of
  if (lane) SPR.drawLaneRoad(dc, G);
  else if (id === 'bridge') SPR.drawBridgeScene(dc, G);
  else if (id === 'mall') SPR.drawMallScene(dc, G);
  else if (id === 'terrace') SPR.drawTerraceScene(dc, G);
  else if (id === 'rink') SPR.drawRinkScene(dc, G);

  if (wild) SPR.drawHedgerow(dc, G, lane ? W() * 0.22 : undefined);
  if (wild) SPR.drawCosyFoliage(dc, G, lane ? 707 : id === 'seneca' ? 1857 : 909,
                                lane ? 0.45 : id === 'seneca' ? 0.25 : 1.4);

  const L = SPR.layerBegin();
  SPR.drawGroundItems(L, G);
  if (lane) {
    SPR.drawNocCamp(L, G, Math.round(W() * 0.62) - 34, GROUND_Y + 14);
    SPR.drawNoc(L, G, G.noc);
  } else if (id === 'hollow') {
    SPR.drawStandingStone(L, G, Math.round(W() * 0.62), GROUND_Y + 12);
    SPR.drawFallenLog(L, G, Math.round(W() * 0.10), GROUND_Y + 26, Math.round(W() * 0.32));
  } else if (id === 'seneca') {
    SPR.drawSenecaScene(L, G);
  }
  if (G.suit && id === 'rink') SPR.drawSuit(L, G, G.suit);
  if (wild) SPR.drawCritters(L, G);
  SPR.layerEnd(dc, '#1a0f08');

  SPR.drawParticles(dc, G);
  if (wild && !lane && id !== 'seneca') SPR.drawUndergrowth(dc, G);
  if (wild) SPR.drawForeground(dc, G);
  drawPickups(dc);
  if (wild) SPR.drawVines(dc, G, lane ? 61 : 71);
  SPR.drawFrameFoliage(dc, G);
  SPR.drawBokeh(dc, G);
  SPR.drawOverlay(dc, G);
}

/* =========================================================================
   THE MAN IN THE RED TIE
   He turns up at the rink, walks across it with two people beside him, and
   leaves. He is never given a line: the oak narrates, because what the oak
   has is a record and not an impression.
   ========================================================================= */
function updateSuit(dt) {
  if (areaId() !== 'rink' || G.dead) { G.suit = null; return; }
  if (!G.suit) {
    G.suitTimer -= dt;
    if (G.suitTimer <= 0) {
      G.suitTimer = 55 + Math.random() * 45;
      const dir = Math.random() < 0.5 ? 1 : -1;
      G.suit = { x: dir === 1 ? -26 : W() + 26, y: GROUND_Y + 20, dir, moving: true, said: false, t: 0 };
      ACH('suit');
    }
    return;
  }
  const s = G.suit;
  s.t += dt;
  s.x += s.dir * 15 * dt;
  if (Math.random() < dt * 4) puff(s.x - s.dir * 8, s.y + 2, 1);
  if (!s.said && s.t > 1.6) {
    s.said = true;
    save.stats.suitSeen = (save.stats.suitSeen || 0) + 1;
    if (save.stats.suitSeen >= 5) ACH('suit5');
    persist();
    sayYou('Somebody is crossing the ice with two people beside him.');
    const pool = save.stats.suitSeen <= DATA.suitLines.length
      ? [DATA.suitLines[save.stats.suitSeen - 1]]
      : DATA.suitOakAsides;
    tellHimLater(pool[Math.floor(Math.random() * pool.length)], 'think');
  }
  if (s.x < -40 || s.x > W() + 40) G.suit = null;
}

function suitAt(x, y) {
  const s = G.suit;
  if (!s) return null;
  return (Math.abs(x - s.x) < 20 && y > s.y - 36 && y < s.y + 4) ? s : null;
}

function drawPickups(c) {
  for (const p of G.pickups) SPR.drawPickup(c, G, p, hover.kind === 'pickup' && hover.p === p);
}

/* the signposts, drawn on the finished frame so a click lands where it looks */
function refreshArrows() {
  G.arrows = [];
  if (G.cine || G.scene !== 'game' || G.dead || panelOpen()) return;
  for (const dir of [-1, 1]) {
    const i = G.area + dir;
    if (i < 0 || i >= AREAS.length) continue;
    const open = areaOpen(i);
    const label = open ? AREAS[i].name.replace(/^THE /, '') : 'LOCKED';
    const box = SPR.travelArrowBox(dir, label);
    G.arrows.push({ dir, label, open, hover: false, x: box.x, y: box.y, w: box.w, h: box.h });
  }
}

function arrowAt(x, y) {
  for (const a of G.arrows) if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) return a;
  return null;
}

function drawArrows(c) {
  for (const a of G.arrows) SPR.drawTravelArrow(c, G, a.dir, a.label, a.hover, !a.open);
}

/* Talking is the whole game, and on a phone the middle of him is all face.
   So there is one obvious, thumb-sized thing to press. */
function talkSignShown() {
  return G.scene === 'game' && !G.cine && !G.dead && !panelOpen() && !G.holding;
}

function talkSignBox() {
  const label = talkLabel();
  const w = Math.max(74, F.textWidth(label, 1) + 24);
  return { x: Math.round(W() / 2 - w / 2), y: H - 25, w, h: 19 };
}

function talkLabel() {
  if (G.asleep) return 'POKE HIM';
  if (areaId() === 'lane') return 'TALK TO NOC';
  if (!atOak()) return 'BACK TO THE OAK';
  if (DLG.choices && dialogueDone()) return 'TELL ME ANOTHER';
  return DLG.on ? 'GO ON' : 'TALK TO HIM';
}

function drawTalkSign(c) {
  if (!talkSignShown()) return;
  const b = talkSignBox();
  const hot = G.talkHover;
  const bob = Math.sin(G.t * 2.4) * (hot ? 1.4 : 0.7);
  const y = Math.round(b.y + bob);
  SPR.px(c, b.x + 8, y + b.h, 2, 6, '#5a3a1e');
  SPR.px(c, b.x + b.w - 10, y + b.h, 2, 6, '#5a3a1e');
  SPR.roundRect(c, b.x - 2, y - 2, b.w + 4, b.h + 4, 3, SPR.INK);
  SPR.roundRect(c, b.x, y, b.w, b.h, 2, hot ? '#c39a63' : '#a0703c');
  SPR.px(c, b.x + 2, y + 2, b.w - 4, 1, '#c9a06a');
  F.drawTextCentered(c, b.x + b.w / 2, y + 6, talkLabel(), hot ? '#2b1c10' : '#ffe9b0', 1);
  // how much further it is to the next subject
  if (atOak() && !G.asleep && !typeBarShown()) {
    const nx = nextSet();
    if (nx) {
      c.globalAlpha = 0.75;
      F.drawTextCentered(c, W() / 2, y - 9, (nx.at - heardTotal()) + ' to a new set', '#d8f0a0', 1, '#000000');
      c.globalAlpha = 1;
    }
  }
}

function overTalkSign(x, y) {
  if (!talkSignShown()) return false;
  const b = talkSignBox();
  return x >= b.x - 6 && x <= b.x + b.w + 6 && y >= b.y - 6 && y <= b.y + b.h + 8;
}

function pressTalkSign() {
  if (G.asleep) { wakeHim(); return; }
  if (areaId() === 'lane') { SFX.click(); startTyping(); return; }
  if (!atOak()) {
    const oakAt = AREAS.findIndex(a => a.id === 'oak');
    travel(G.area < oakAt ? 1 : -1);
    return;
  }
  // while replies are on offer this is the "keep going" one, so the whole
  // conversation can be had with a single thumb
  if (DLG.choices && dialogueDone()) {
    const more = DLG.choices.find(ch => !ch.follow && !ch.type && !ch.act) || DLG.choices[DLG.choices.length - 1];
    SFX.click();
    pickReply(more);
    return;
  }
  talkToTree();
}

function bagButtonBox() { return { x: 4, y: H - 26, w: 26, h: 26 }; }
function overBagButton(x, y) {
  const b = bagButtonBox();
  return G.hasBag && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

function drawCineFrame() {
  const st = cineStage(), p = cineProgress();
  const name = G.cine.name;

  if (name === 'lighter' || name === 'mercy' || name === 'grove') {
    drawWorld();
    if (name === 'mercy' && st === 'throw' && p < 0.6) {
      // the lighter turning over in the air on its way to the water
      const k = p / 0.6;
      const lx = CX() - k * 96, ly = 120 - Math.sin(k * Math.PI) * 46 + k * 44;
      dc.save(); dc.translate(lx, ly); dc.rotate(k * 9); dc.translate(-lx, -ly);
      SPR.drawItemIcon(dc, lx, ly, 'lighter');
      dc.restore();
    }
    return;
  }

  if (name === 'death') {
    if (st === 'collapse') { drawWorld(); }
    else if (st === 'fall') { drawWorld({ fall: Math.pow(p, 1.6) }); }
    else if (st === 'ash') { SPR.drawAshScene(dc, G); SPR.drawParticles(dc, G); SPR.drawFrameFoliage(dc, G); }
    else if (st === 'soul') {
      SPR.drawAshScene(dc, G);
      const y = GROUND_Y - 14 - p * 150;
      SPR.drawRays(dc, G, Math.min(1, p * 1.4) * 0.7, CX(), y);
      SPR.drawSoul(dc, G, CX(), y, 1 + p);
      SPR.drawParticles(dc, G);
      if (p > 0.8) { dc.globalAlpha = (p - 0.8) * 5; SPR.px(dc, 0, 0, W(), H, '#ffffff'); dc.globalAlpha = 1; }
    } else if (st === 'tunnel') {
      SPR.px(dc, 0, 0, W(), H, '#dceeff');
      SPR.drawCloudTunnel(dc, G, p, 1);
      SPR.drawSoul(dc, G, CX(), 110 - p * 30, 1.6);
      SPR.drawRays(dc, G, 0.5, CX(), 96);
      dc.globalAlpha = Math.max(0, p - 0.7) * 3.3; SPR.px(dc, 0, 0, W(), H, '#ffffff'); dc.globalAlpha = 1;
    } else if (st === 'arrive') {
      SPR.drawHeavenBackdrop(dc, G);
      const drop = (1 - Math.pow(1 - p, 3));
      SPR.drawGhostTree(dc, G, CX(), -60 + drop * 164 + Math.sin(G.t * 1.1) * 3, Math.min(1, p * 2));
      SPR.drawRays(dc, G, 0.8 * (1 - p * 0.6), CX(), 70);
      dc.globalAlpha = Math.max(0, 1 - p * 2.2); SPR.px(dc, 0, 0, W(), H, '#ffffff'); dc.globalAlpha = 1;
    }
  } else if (name === 'rebirth') {
    if (st === 'leave') {
      SPR.drawHeaven(dc, G);
      SPR.drawSoul(dc, G, CX(), 120 + p * 60, 1.2);
      dc.globalAlpha = Math.max(0, p - 0.75) * 4; SPR.px(dc, 0, 0, W(), H, '#ffffff'); dc.globalAlpha = 1;
    } else if (st === 'dive') {
      SPR.px(dc, 0, 0, W(), H, '#e2f0ff');
      SPR.drawCloudTunnel(dc, G, p, -1);
      const y = 40 + p * 70;
      SPR.drawSoul(dc, G, CX(), y, 1.4);
      for (let i = 0; i < 10; i++) {
        dc.globalAlpha = 0.5 * (1 - i / 10);
        SPR.pcircle(ctx, CX() + Math.sin(G.t * 4 + i) * 3, y - i * 6, 3 - i * 0.25, '#ffffff');
        dc.globalAlpha = 1;
      }
    } else if (st === 'land') {
      SPR.drawBackdrop(dc, G);
      SPR.drawGround(dc, G);
      SPR.drawForeground(dc, G);
      const y = -20 + p * (GROUND_Y + 10);
      SPR.drawSoul(dc, G, CX(), y, 1.4 * (1 - p * 0.4));
      SPR.drawFrameFoliage(dc, G);
      if (p > 0.9) { dc.globalAlpha = (p - 0.9) * 10; SPR.px(dc, 0, 0, W(), H, '#ffffff'); dc.globalAlpha = 1; }
    } else if (st === 'grow') {
      G.timeOfDay = 0.02 + p * 0.16;
      drawWorld({ growing: Math.pow(p, 0.9) });
    }
  }
}

function render() {
  dc.setTransform(1, 0, 0, 1, 0, 0);
  dc.clearRect(0, 0, W(), H);

  if (G.cine) drawCineFrame();
  else if (G.scene === 'garden') SPR.drawGarden(dc, G);
  else if (G.scene === 'hall') SPR.drawHall(dc, G);
  else if (G.scene === 'heaven') SPR.drawHeaven(dc, G);
  else drawWorld();

  // blit through the camera
  const cam = G.cam;
  const sh = G.cine && G.shake > 0 ? G.shake : 0;
  const c = camRect();
  const clamp = (v, hi) => Math.max(0, Math.min(hi, v));
  const sw = c.sw, sHt = c.sh;
  const sx = clamp(c.sx + (Math.random() * 2 - 1) * sh, W() - sw);
  const sy = clamp(c.sy + (Math.random() * 2 - 1) * sh, H - sHt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W(), H);
  ctx.drawImage(buf, sx, sy, sw, sHt, 0, 0, W(), H);

  if (G.flash > 0) { ctx.globalAlpha = Math.min(1, G.flash); SPR.px(ctx, 0, 0, W(), H, '#ffffff'); ctx.globalAlpha = 1; }
  if (G.veil > 0) { ctx.globalAlpha = Math.min(1, G.veil); SPR.px(ctx, 0, 0, W(), H, '#05080c'); ctx.globalAlpha = 1; }
  if (!G.cine && G.scene === 'game') { drawArrows(ctx); drawTypeBar(ctx); drawTalkSign(ctx); SPR.drawHud(ctx, G); }
  if (G.areaTitle > 0 && !G.cine) SPR.drawAreaTitle(ctx, G, AREAS[G.area].name, AREAS[G.area].sub, Math.min(1, G.areaTitle));
  if (!G.cine && G.scene === 'game') drawPost(ctx);
  drawHint(ctx);
  drawSigns(ctx);
  drawPanelScroll(ctx);
  drawDialogue(ctx);
  SPR.drawLetterbox(ctx, G.letterbox);
  if (G.areaFade > 0) {
    ctx.globalAlpha = Math.min(1, G.areaFade);
    SPR.px(ctx, 0, 0, W(), H, '#0a0f0a');
    ctx.globalAlpha = 1;
  }
  if (G.holding && G.scene === 'game') {
    const f = worldToFrame(G.holding.x, G.holding.y);
    SPR.drawCursorTool(ctx, G, f.x, f.y, G.holding.id);
  }
}

/* ---------------------------------------------------------------------
   INPUT
   --------------------------------------------------------------------- */
let hover = { kind: null, i: -1 };

/* screen -> world, undoing the camera */
function toLogical(ev) {
  const r = cv.getBoundingClientRect();
  const src = ev.touches && ev.touches[0] ? ev.touches[0] : (ev.changedTouches && ev.changedTouches[0]) || ev;
  const fx = (src.clientX - r.left) / r.width;
  const fy = (src.clientY - r.top) / r.height;
  const c = camRect();
  return { x: c.sx + fx * c.sw, y: c.sy + fy * c.sh };
}

/* screen -> the final frame, for the HUD which is drawn after the blit */
function toScreenPixels(ev) {
  const r = cv.getBoundingClientRect();
  const src = ev.touches && ev.touches[0] ? ev.touches[0] : (ev.changedTouches && ev.changedTouches[0]) || ev;
  return { x: (src.clientX - r.left) / r.width * W(), y: (src.clientY - r.top) / r.height * H };
}

/* which plinth is under this point, if any */
function hallSlotAt(x, y) {
  const h = G.hall;
  for (let i = 0; i < h.order.length; i++) {
    const p = SPR.hallSlotPos(i);
    const sx = p.x - h.scroll;
    if (Math.abs(x - sx) < 17 * p.scale && y > p.y - 46 * p.scale && y < p.y + 6) return i;
  }
  return -1;
}

function showHallLabel(i) {
  const h = G.hall;
  if (i < 0) { elHallLabel.classList.add('hidden'); return; }
  const id = h.order[i];
  const a = DATA.achievements.find(x => x.id === id);
  if (!a) { elHallLabel.classList.add('hidden'); return; }
  const got = h.unlocked[id];
  elHallLabel.className = got ? '' : 'locked';
  elHallLabel.innerHTML = '<b>' + (got ? a.name : '??? \u2014 not yet earned') + '</b><span>' + a.desc + '</span>';
}

function hitTest(x, y) {
  if (G.scene === 'hall') return { kind: 'hall', i: hallSlotAt(x, y) };
  if (G.scene === 'garden') return { kind: 'garden', i: gardenSlotAt(x, y) };

  // away from the oak there is no oak to click, only what is actually there
  if (G.scene === 'game' && !atOak()) {
    const pk = pickupAt(x, y);
    if (pk) return { kind: 'pickup', p: pk, i: -1 };
    for (let i = G.groundLeaves.length - 1; i >= 0; i--) {
      const l = G.groundLeaves[i];
      if (l.area && l.area !== areaId()) continue;
      if (x > l.x - 3 && x < l.x + 10 && y > l.y - 3 && y < l.y + 9) return { kind: 'leaf', i };
    }
    if (areaId() === 'lane' && Math.abs(x - G.noc.x) < 14 && y > G.noc.y - 40 && y < G.noc.y + 4)
      return { kind: 'noc', i: -1 };
    if (suitAt(x, y)) return { kind: 'suit', i: -1 };
    return { kind: null, i: -1 };
  }

  // the cottage and the noticeboard are solid objects, checked before him
  if (G.scene === 'game' && !G.dead) {
    if (cottageHere() && Math.abs(x - (parkMargin() + 26)) < 24 && y > GROUND_Y - 34 && y < GROUND_Y + 14)
      return { kind: 'house', i: -1 };
    if (boardHere() && Math.abs(x - (W() - parkMargin() - 26)) < 14 && y > GROUND_Y - 22 && y < GROUND_Y + 16)
      return { kind: 'board', i: -1 };
    for (const pr of save.park.props) {
      const pos = plotPos(pr.plot);
      if (Math.abs(x - pos.x) < 13 && y > pos.y - 30 && y < pos.y + 6)
        return { kind: 'prop', prop: pr, i: -1 };
    }
  }
  if (G.scene === 'heaven') {
    if (x > 92 && x < 164 && y > 40 && y < 130) return { kind: 'ghost', i: -1 };
    return { kind: 'sky', i: -1 };
  }
  if (G.scene !== 'game') return { kind: null, i: -1 };
  {
    const pk = pickupAt(x, y);
    if (pk) return { kind: 'pickup', p: pk, i: -1 };
  }
  for (let i = G.groundLeaves.length - 1; i >= 0; i--) {
    const l = G.groundLeaves[i];
    if (l.area && l.area !== areaId()) continue;
    if (x > l.x - 3 && x < l.x + 10 && y > l.y - 3 && y < l.y + 9) return { kind: 'leaf', i };
  }
  const s = G.squirrel;
  if (s.active && Math.abs(x - s.x) < 11 && y > s.y - 16 && y < s.y + 4) return { kind: 'squirrel', i: -1 };
  if (!G.dead) {
    // he is not one big button: every part of him answers differently
    const fx = x - CX(), fy = y;
    if (Math.abs(fx) < 34 && fy > 84 && fy < 152) {
      if (fy > 96 && fy < 112 && Math.abs(Math.abs(fx) - 13) < 9) return { kind: 'part', part: 'eye', i: -1 };
      if (fy >= 100 && fy < 126 && Math.abs(fx) < 9) return { kind: 'part', part: 'nose', i: -1 };
      if (fy >= 126 && fy < 145 && Math.abs(fx) < 20) return { kind: 'part', part: 'mouth', i: -1 };
      if (fy >= 145 && Math.abs(fx) < 26) return { kind: 'part', part: 'beard', i: -1 };
    }
    if (y > GROUND_Y - 6 && y < GROUND_Y + 12 && Math.abs(x - CX()) > 24 && Math.abs(x - CX()) < 56)
      return { kind: 'part', part: 'root', i: -1 };
    // trunk
    if (y > 88 && y < GROUND_Y + 6 && Math.abs(x - CX()) < SPR.trunkHalfWidth(y) + 4) return { kind: 'tree', i: -1 };
    // canopy
    const dx = (x - CX()) / 68, dy = (y - 52) / 40;
    if (dx * dx + dy * dy < 1) return { kind: 'part', part: 'canopy', i: -1 };
  }
  // the sky above: sun by day, moon by night
  const ang = Math.PI * (G.timeOfDay * 2 % 2);
  const sx = 20 + (1 - Math.cos(ang)) * 108, sy = 118 - Math.sin(ang) * 92;
  const night = SPR.isNight(G.timeOfDay);
  const bx = night ? W() - sx : sx;
  if (Math.hypot(x - bx, y - sy) < 14) return { kind: night ? 'moon' : 'sun', i: -1 };
  return { kind: null, i: -1 };
}

/* ------------------ touching him in specific places ------------------ */
const partAch = { eye: 'eyepoke', nose: 'nosepoke', mouth: 'mouthbite' };
const partCount = {};

function touchPart(part) {
  if (G.dead || G.scene !== 'game') return;
  if (G.asleep) { wakeHim(); return; }
  if (skipType()) return;
  G.sinceTreeClick = 0;
  const t = DATA.touch[part];
  if (!t) { talkToTree(); return; }
  partCount[part] = (partCount[part] || 0) + 1;
  if (partAch[part]) ACH(partAch[part]);
  const POKE = { eye: ['OW!', '#ff9a6a'], nose: ['BOOP', '#ffd8f0'], mouth: ['NOM', '#ffb0b0'],
                 beard: ['RUFFLE', '#d8f0a0'], root: ['TAP TAP', '#e8d0a0'], canopy: ['RUSTLE', '#b8e86a'] };
  const noise = POKE[part];
  if (noise) pop(noise[0], CX() + (part === 'eye' ? 18 : 0), 92, noise[1]);
  if (part === 'eye') { G.shake = 3; SFX.deny(); G.blink = 0.5; squash(0.5); ring(CX() + 13, 104, '#ffd8b0'); sweat(CX() + 26, 88); }
  else if (part === 'nose') { SFX.squeak(); squash(0.7); ring(CX(), 114, '#ffd8f0'); if (Math.random() < 0.35) setTimeout(triggerSneeze, 900); }
  else if (part === 'mouth') { G.stare = 1; G.stareHold = 2.2; SFX.boom(); squash(0.35); ring(CX(), 138, '#ffb0b0', 1.3); }
  else if (part === 'canopy') { SFX.pickup(); squash(-0.35); puff(CX(), 60, 4); for (let i = 0; i < 5; i++) dropLeaf(100 + Math.random() * 56, 40 + Math.random() * 30, i < 2); }
  else if (part === 'root') { SFX.click(); squash(0.25); puff(CX() + (Math.random() * 2 - 1) * 40, GROUND_Y + 4, 3); }
  else { SFX.click(); squash(0.3); }
  say('THE WISE OAK TREE', t.lines[partCount[part] % t.lines.length], t.mood);
}

function touchSky(kind) {
  if (skipType()) return;
  if (kind === 'moon') {
    ACH('moon'); SFX.ach();
    spawnParticles('star', CX(), 40, 12);
    say('THE WISE OAK TREE', DATA.moonLines[Math.floor(Math.random() * DATA.moonLines.length)], 'sleepy');
  } else {
    SFX.deny();
    say('THE WISE OAK TREE', DATA.sunLines[Math.floor(Math.random() * DATA.sunLines.length)], 'shock');
  }
}

let pan = null;      // { startX, startScroll }
let grab = null;     // dragging the trunk about
let tickle = { energy: 0, last: null, cool: 0 };

function onMove(ev) {
  const p = toLogical(ev);
  const fr = toScreenPixels(ev);
  if (panelOpen()) { cv.style.cursor = panelMove(fr.x, fr.y) ? 'pointer' : 'default'; return; }
  let onSign = false;
  for (const sg of signs) { sg.hover = signAt(fr.x, fr.y) === sg; onSign = onSign || sg.hover; }
  const ar = arrowAt(fr.x, fr.y);
  for (const a of G.arrows) a.hover = a === ar;
  G.bagHover = overBagButton(fr.x, fr.y);
  G.talkHover = overTalkSign(fr.x, fr.y);
  if (onSign || ar || G.bagHover || G.talkHover || overTypeBar(fr.x, fr.y)) { cv.style.cursor = 'pointer'; return; }
  DLG.hover = DLG.choices && dialogueDone() ? choiceAt(fr.x, fr.y) : -1;
  cv.style.cursor = DLG.hover >= 0 ? 'pointer' : (G.holding ? 'none' : cv.style.cursor);

  if (G.holding) { G.holding.x = p.x; G.holding.y = p.y; cv.style.cursor = 'none'; return; }

  G.look.x = Math.max(-1.4, Math.min(1.4, (p.x - CX()) / 60));
  G.look.y = Math.max(-1.2, Math.min(1.2, (p.y - 116) / 50));

  // hold the trunk and waggle the mouse: he gets shaken
  if (grab && G.scene === 'game' && !G.dead) {
    grab.moved += Math.abs(p.x - grab.lastX);
    if (grab.moved > 6) G.holdT = 0;
    G.shake = Math.min(5, G.shake + Math.abs(p.x - grab.lastX) * 0.25);
    grab.lastX = p.x;
    if (grab.moved > 70 && !grab.paid) {
      grab.paid = true;
      ACH('shake'); SFX.sneeze();
      squash(-0.55); pop('WOAH!', CX(), 84, '#ffd24a'); puff(CX(), GROUND_Y + 4, 6);
      for (let i = 0; i < 5; i++) dropLeaf(96 + Math.random() * 64, 40 + Math.random() * 40, i < 3);
      for (let i = 0; i < 10; i++) dropLeaf(90 + Math.random() * 76, 30 + Math.random() * 50, false);
      say('THE WISE OAK TREE', DATA.shakeLines[Math.floor(Math.random() * DATA.shakeLines.length)], 'shock');
    }
    return;
  }

  // scrub the cursor quickly over him without pressing: he is ticklish
  if (G.scene === 'game' && atOak() && !G.dead && tickle.cool <= 0) {
    const onHim = Math.abs(p.x - CX()) < 40 && p.y > 88 && p.y < GROUND_Y;
    if (onHim && tickle.last) {
      const d = Math.abs(p.x - tickle.last.x) + Math.abs(p.y - tickle.last.y);
      tickle.energy += d > 3 ? d * 0.5 : -1;
    } else tickle.energy -= 2;
    tickle.energy = Math.max(0, Math.min(120, tickle.energy));
    tickle.last = onHim ? { x: p.x, y: p.y } : null;
    if (tickle.energy > 100) {
      tickle.energy = 0; tickle.cool = 12;
      ACH('tickle');
      G.mood = 'laugh'; G.moodTimer = 6; G.shake = 3;
      SFX.hug();
      squash(0.5); pop('HEEHEE', CX() + 20, 88, '#ffd8f0');
      spawnParticles('heart', CX(), 110, 5);
      for (let i = 0; i < 6; i++) dropLeaf(96 + Math.random() * 64, 40 + Math.random() * 40, i < 2);
      say('THE WISE OAK TREE', DATA.tickleLines[Math.floor(Math.random() * DATA.tickleLines.length)], 'laugh');
    }
  }

  if (G.scene === 'garden') {
    if (pan) { G.garden.target = pan.startScroll + (pan.startX - p.x); cv.style.cursor = 'grabbing'; return; }
    G.garden.hover = gardenSlotAt(p.x, p.y);
    cv.style.cursor = G.garden.hover >= 0 ? 'pointer' : 'default';
    return;
  }

  if (G.scene === 'hall') {
    const h = G.hall;
    if (h.dragIndex >= 0) {
      h.dragX = p.x; h.dragY = p.y;
      h.hover = hallSlotAt(p.x, p.y);
      cv.style.cursor = 'grabbing';
      return;
    }
    if (pan) { h.target = pan.startScroll + (pan.startX - p.x); cv.style.cursor = 'grabbing'; return; }
    const i = hallSlotAt(p.x, p.y);
    showHallLabel(i);
    cv.style.cursor = i >= 0 && h.unlocked[h.order[i]] ? 'grab' : 'default';
    return;
  }

  hover = hitTest(p.x, p.y);
  cv.style.cursor = hover.kind && hover.kind !== 'sky' ? 'pointer' : 'default';
}
cv.addEventListener('mousemove', onMove);
cv.addEventListener('touchmove', ev => { ev.preventDefault(); onMove(ev); }, { passive: false });

function onRelease() {
  grab = null;
  if (G.holdT > 0) { G.holdT = 0; if (!save.ach.hug1) elHint.className = 'hidden'; }
  if (G.holding) {
    if (G.holding.fromBag) return;      // clicked out of the bag: wait for the next click
    const t = G.holding;
    G.holding = null;
    cv.style.cursor = 'default';
    elHint.className = 'hidden';
    if (!useTool(t.id, t.x, t.y)) { SFX.deny(); }
    // whatever happens, it goes back to the grass
    const home = G.tools.indexOf(t);
    if (home >= 0) { t.x = t.hx; t.y = t.hy; }
    refreshHUD();
    return;
  }
  const h = G.hall;
  if (G.scene === 'hall' && h.dragIndex >= 0) {
    const target = h.hover;
    if (target >= 0 && target !== h.dragIndex) {
      const a = h.order[h.dragIndex];
      h.order[h.dragIndex] = h.order[target];
      h.order[target] = a;
      SFX.trade();
    } else SFX.click();
    h.dragIndex = -1; h.hover = -1;
    save.hallOrder = h.order.slice(); persist();
  }
  pan = null;
  cv.style.cursor = 'default';
}
window.addEventListener('mouseup', onRelease);
window.addEventListener('touchend', onRelease);

cv.addEventListener('wheel', ev => {
  if (panelOpen()) {
    ev.preventDefault();
    PANEL.target = Math.max(0, Math.min(Math.max(0, PANEL.contentH - PANEL.viewH),
                                        PANEL.target + (ev.deltaY + ev.deltaX) * 0.5));
    return;
  }
  if (G.scene === 'garden') {
    ev.preventDefault();
    G.garden.target += (ev.deltaY + ev.deltaX) * 0.6;
    return;
  }
  if (G.scene !== 'hall') return;
  ev.preventDefault();
  G.hall.target += (ev.deltaY + ev.deltaX) * 0.6;
}, { passive: false });

function toolAt(x, y) {
  for (let i = G.tools.length - 1; i >= 0; i--) {
    const t = G.tools[i];
    if (Math.abs(x - t.x) < 8 && Math.abs(y - t.y) < 8) return t;
  }
  return null;
}

function onPress(ev) {
  if (!started) { beginGame(); return; }
  SFX.kick();
  const fr = toScreenPixels(ev);

  // a scroll swallows everything while it is open
  if (panelOpen()) { panelPress(fr.x, fr.y); return; }

  const sg = signAt(fr.x, fr.y);
  if (sg) { SFX.click(); sg.act(); return; }

  // the signposts at the edges, and the bag in the corner
  if (!G.cine && G.scene === 'game') {
    if (overTypeBar(fr.x, fr.y)) { SFX.click(); startTyping(); return; }
    if (overTalkSign(fr.x, fr.y)) { pressTalkSign(); return; }
    const ar = arrowAt(fr.x, fr.y);
    if (ar) { travel(ar.dir); return; }
    if (overBagButton(fr.x, fr.y)) { SFX.click(); toggleBag(); return; }
  }

  // a reply, if one is on offer
  if (DLG.on && DLG.choices && dialogueDone()) {
    const ci = choiceAt(fr.x, fr.y);
    if (ci >= 0) { SFX.click(); pickReply(DLG.choices[ci]); return; }
  }
  // stop the postman and open what he is carrying
  const sn = snailAt(fr.x, fr.y);
  if (sn) {
    if (sn.opened) { sn.speed = 150; SFX.squeak(); }
    else { sn.opened = true; sn.speed = 8; openPost(sn.note); }
    return;
  }

  if (G.cine) { skipStage(); return; }
  const p = toLogical(ev);

  // something taken out of the bag is used by clicking whatever it is for
  if (G.holding && G.holding.fromBag) {
    const t = G.holding;
    G.holding = null;
    cv.style.cursor = 'default';
    elHint.className = 'hidden';
    if (!useTool(t.id, p.x, p.y)) SFX.deny();
    refreshHUD();
    return;
  }

  if (G.scene === 'game') {
    // the sound switch, bottom right
    const sp = toScreenPixels(ev);
    if (sp.x > W() - 22 && sp.y > H - 20) { toggleMute(); return; }
    const t = toolAt(p.x, p.y);
    if (t) {
      G.holding = t; t.x = p.x; t.y = p.y;
      cv.style.cursor = 'none';
      SFX.pickup();
      elHint.textContent = TOOL_HINTS[t.id] || 'drag it somewhere';
      elHint.className = '';
      return;
    }
  }

  if (G.scene === 'garden') {
    const i = gardenSlotAt(p.x, p.y);
    if (i >= 0) {
      const rec = G.garden.list[i];
      SFX.pickup();
      openPost({ kind: rec.kind, name: rec.name, desc: rec.desc, icon: rec.icon, id: rec.id }, true);
    } else {
      pan = { startX: p.x, startScroll: G.garden.target };
    }
    return;
  }

  if (G.scene === 'hall') {
    const hl = G.hall;
    const i = hallSlotAt(p.x, p.y);
    if (i >= 0 && hl.unlocked[hl.order[i]]) {
      hl.dragIndex = i; hl.dragX = p.x; hl.dragY = p.y; hl.hover = i;
      SFX.pickup();
    } else {
      pan = { startX: p.x, startScroll: hl.target };
    }
    return;
  }

  const h = hitTest(p.x, p.y);

  // A critter can be clicked, but never at the cost of talking to him: if the
  // point is on his trunk or his face, he wins.
  if (G.scene === 'game' && !G.dead) {
    const onHim = h.kind === 'tree' || (h.kind === 'part' && h.part !== 'canopy');
    if (!onHim) {
      const k = critterAt(p.x, p.y);
      if (k) { touchCritter(k); return; }
    }
  }

  if (G.scene === 'heaven') {
    if (h.kind === 'ghost') {
      say('THE WISE OAK TREE (DECEASED)', DATA.heavenTreeLines[G.ghostIdx % DATA.heavenTreeLines.length], null, 'heaven');
      G.ghostIdx++;
    } else {
      ACH('god');
      say('THE SHIFT MANAGER', DATA.godLines[G.godIdx % DATA.godLines.length], null, 'heaven');
      G.godIdx++;
    }
    return;
  }
  if (h.kind === 'leaf') { collectLeaf(h.i); return; }
  if (h.kind === 'pickup') { takePickup(h.p); return; }
  if (h.kind === 'noc') { SFX.click(); openChat('noc'); return; }
  if (h.kind === 'suit') { SFX.click(); sayYou('A dark coat, a long red tie, two people keeping pace with him.'); return; }
  if (h.kind === 'squirrel') { clickSquirrel(); return; }
  if (h.kind === 'part') {
    grab = { x: p.x, lastX: p.x, moved: 0, t: 0 };
    if (h.part !== 'canopy') G.holdT = 0.0001;
    touchPart(h.part);
    return;
  }
  if (h.kind === 'moon' || h.kind === 'sun') { touchSky(h.kind); return; }
  if (h.kind === 'house') {
    ACH('house');
    openJournal();
    if (Math.random() < 0.5) return;
    say('THE WISE OAK TREE', DATA.houseLines[Math.floor(Math.random() * DATA.houseLines.length)], 'idle');
    return;
  }
  if (h.kind === 'prop') {
    const b = BUILD_BY_ID[h.prop.type];
    SFX.click();
    const rate = (b.rate * incomeMultiplier()).toFixed(2);
    say('THE WISE OAK TREE',
        b.name + '. ' + b.desc + ' Bringing in about ' + rate + ' leaves a second, which over nine hundred years is genuinely enormous.',
        'happy');
    return;
  }
  if (h.kind === 'board') {
    openQuestBoard();
    if (Math.random() < 0.4) say('THE WISE OAK TREE', DATA.boardLines[Math.floor(Math.random() * DATA.boardLines.length)], 'happy');
    return;
  }
  if (h.kind === 'tree') {
    grab = { x: p.x, lastX: p.x, moved: 0, t: 0 };
    G.holdT = 0.0001;                       // press and hold to hug him
    if (!save.ach.hug1) { elHint.textContent = 'keep holding to hug him'; elHint.className = ''; }
    talkToTree();
    return;
  }
  skipType();
}
cv.addEventListener('mousedown', onPress);
cv.addEventListener('touchstart', ev => { ev.preventDefault(); onPress(ev); }, { passive: false });

/* ---------------------------------------------------------------------
   THE FEW CONTROLS THAT ARE NOT IN THE WORLD
   --------------------------------------------------------------------- */
function toggleMute() {
  save.muted = !save.muted; persist();
  SFX.setMuted(save.muted);
  G.muted = save.muted;
  if (save.muted) {
    ACH('mute');
    say('THE WISE OAK TREE', "You muted me. I am still talking. I will ALWAYS still be talking.", 'smug');
  } else SFX.click();
}

function eraseEverything() {
  openModal('ERASE EVERYTHING?',
    "<p>Every trophy. Every ending. Every line you ever heard him say.</p><p class='small'>He will not remember you.</p>",
    [['Cancel', closeModal], ['Erase it all', () => {
      erased = true;
      try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
      location.reload();
    }, 'bad']]);
}

/* the transparent input: Enter sends, and every character it catches is
   redrawn in 5x7 pixels on the paper */
if (elTyping) {
  elTyping.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); sendChat(); }
    else if (e.key === 'Escape') { e.preventDefault(); stopTyping(); }
  });
  elTyping.addEventListener('blur', () => {
    if (G.typing && !G.cine) setTimeout(() => { if (G.typing) elTyping.focus(); }, 60);
  });
}

document.addEventListener('keydown', e => {
  const tag = (e.target && e.target.tagName) || '';
  if (!started) { if (!tag || tag === 'BODY') beginGame(); return; }
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (G.scene === 'garden') {
    if (e.key === 'ArrowRight') G.garden.target += 60;
    if (e.key === 'ArrowLeft') G.garden.target -= 60;
    if (e.key === 'Escape') closeGarden();
    return;
  }
  if (G.scene === 'hall') {
    if (e.key === 'ArrowRight') G.hall.target += 60;
    if (e.key === 'ArrowLeft') G.hall.target -= 60;
    if (e.key === 'Escape') closeHall();
    return;
  }
  if (e.key === 'Escape') closePanel();
  if (e.key === ' ') { e.preventDefault(); if (!skipType() && G.scene === 'game') talkToTree(); }
  if (e.key === 'ArrowLeft') travel(-1);
  if (e.key === 'ArrowRight') travel(1);
  if (e.key.toLowerCase() === 'b') toggleBag();
  if (e.key.toLowerCase() === 't' && !G.asleep) { if (chatPartner()) startTyping(); else sayYou('Nobody out here to talk to.'); }
  if (e.key.toLowerCase() === 'm') toggleMute();
  if (e.key.toLowerCase() === 'r' && e.shiftKey) eraseEverything();
  if (e.key.toLowerCase() === 'e' && G.scene === 'heaven') openEndings();
});

/* ---------------------------------------------------------------------
   BOOT
   --------------------------------------------------------------------- */
SFX.setMuted(save.muted);
G.muted = save.muted;
if (hadSave) ACH('refresh');
checkMetaAchievements();
checkCompletionist();
fit();
seedCritters();
buildHall();
for (const id in (save.items || {})) G.inv.items[id] = true;
G.hasBag = !!save.bag;
G.areaNow = areaId();
seedPickups();
refreshArrows();
G.muted = save.muted;
refreshHUD();
persist();

/* The menu holds until you tap anywhere. Tapping does not swap a screen; it
   pushes the camera in through the wood and hands you the same frame. */
function beginGame() {
  if (started || leaving > 0) return;
  leaving = 0.001;
  SFX.kick(); SFX.ach();
}

/* the far side of the push-in */
function enterWood() {
  started = true;
  leaving = 0;
  G.veil = 1;
  // he was asleep on the menu, so he is asleep in the world
  G.asleep = true; G.mood = 'asleep'; G.blink = 1; G.blinkTimer = 999;
  refreshHUD(); refreshActions();
  setTimeout(() => { if (G.asleep) nudge(hadSave ? 'he is asleep \u2014 poke him' : 'poke him', 30); }, 700);
}

/* the actual waking: a shudder, a blink, and nine hundred years of opinions */
function wakeHim() {
  if (!G.asleep) return;
  G.asleep = false; G.wakeT = 0; G.blinkTimer = 2;
  elHint.className = 'hidden';
  ACH('hello');
  G.blink = 0.45; G.shake = 3.6; G.mood = 'shock'; G.moodTimer = 5;
  SFX.sneeze();
  // he comes awake like a cartoon: stretches tall, rains leaves, shouts
  squash(-0.8);
  ring(CX(), 112, '#fff6d8', 1.6);
  lines(CX(), 108, '#fff6d8');
  pop('WHUMPH!', CX(), 82, '#ffd24a');
  puff(CX() - 40, GROUND_Y + 4, 5); puff(CX() + 40, GROUND_Y + 4, 5);
  for (let i = 0; i < 10; i++) dropLeaf(90 + Math.random() * 76, 40 + Math.random() * 40, i < 3);
  spawnParticles('star', CX(), 96, 8);
  setTimeout(() => {
    if (G.dead || G.cine) return;
    G.mood = 'sleepy';
    say('THE WISE OAK TREE', hadSave
      ? "Mm. You again. I had got all the way to sleep, which for me takes about a decade. Sit down. I'll be awake in a minute."
      : "Nnh. Someone is standing under me. Right. Give me a moment. Nine hundred years is a long nap to come out of.",
      'sleepy');
    if (!save.ach.lane && !save.ach.hollow) setTimeout(() => nudge('the signposts at the edges walk you west and east', 12), 8000);
    else if (!save.bag) setTimeout(() => nudge('there is a bag somewhere east of here', 10), 8000);
  }, 700);
}


/* Debug hooks, only when the page is opened with ?debug — used by the
   automated smoke test to reach the late game without playing for an hour. */
if (/[?&]debug/.test(location.search)) {
  window.OAK = { G, save, ACH, reachEnding, startBurning, goHeaven, reincarnate,
                 refreshHUD, dropLeaf, triggerSneeze, maybeSpawnSquirrel, persist,
                 skipAll: () => { if (G.cine) { G.cine.i = G.cine.stages.length - 1; skipStage(); } },
                 parkMargin, parkIncome, parkFill, talkSignBox, pressTalkSign, heardTotal, openSets, nextSet, openTopics,
                 unlockedTags, setHeard, setTotal, checkSets, talkToTree, openMap, areaOpen, areaWants, updateSuit, checkAreas,
                 openBirdDiary, openJobs, openPlans, sayYou, tellHimLater, birdsHere,
                 startTyping, stopTyping, typeBarBox, typeBarShown, sendChat, chatPartner,
                 seedCritters, touchCritter, refreshPanel, boardHere, cottageHere, puff, ring, pop, squash, PANEL, openPanel, closePanel, panelIs, panelOpen, openQuestBoard, openJournal, acceptQuest, checkQuests, questStatus, plotPos, hitTest,
                 travel, takePickup, seedPickups, openChat, closeChat, sendChat, openBag, closeBag,
                 agreePlan, completePlan, planById, areaId, wakeHim, AREAS,
                 openPost, closePost, openSettings, openCredits, openTrophies, openEndings, openGarden, closeGarden, buildGarden, snailName, finishQuest, questById, questProgress,
                 snailNotes: () => snails.map(s => ({ id: s.note && s.note.id, opened: s.opened })),
                 signLabels: () => signs.map(s => s.label), signFor: (l) => signs.find(s => s.label === l),
                 dlgText: () => DLG.text, DLG, snails: () => snails.length, toastQueue };
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!started) {
    dawn = Math.max(0, dawn - dt * 1.6);
    if (leaving > 0) {
      leaving += dt * 2.2;
      if (leaving >= 1) enterWood();
    }
    if (!started) { drawTitleFrame(dt); requestAnimationFrame(loop); return; }
  }
  G.veil = Math.max(0, G.veil - dt * 1.8);
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener('beforeunload', persist);

window.addEventListener('resize', () => fit());
window.addEventListener('orientationchange', () => setTimeout(fit, 200));
// a phone keyboard changes the usable height without firing resize on iOS
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => fit());
  window.visualViewport.addEventListener('scroll', () => fit());
}

})();
