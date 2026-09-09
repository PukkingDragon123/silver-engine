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
  bag: false, items: {}, taken: {}, plans: {}, planDone: {}, metNoc: false,
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
  area: 1, areaFade: 0, areaFadeDir: 0, areaTitle: 0, arrows: [], pickups: [],
  noc: { x: 0, y: GROUND_Y + 8, look: 0, talking: 0, thinking: 0 },
  asleep: false, wakeT: 0,
  hasBag: false, bagOpen: false, bagHover: false, bagBadge: 0,
  activePlan: null,
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
          dragIndex: -1, dragX: 0, dragY: 0, grabbed: false, hover: -1, from: 'heaven' }
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

/* dialogue bag: never the same line twice until the bag is empty */
let bag = [];
function refillBag() {
  bag = DATA.lines.map((l, i) => i);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
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

const elBag = $('bag'), elBagBody = $('bagbody');
const elChat = $('chat'), elChatLog = $('chatlog'), elChatInput = $('chatinput');
const elModal = $('modal'), elModalBody = $('modalbody'), elModalTitle = $('modaltitle');
const elEndingCard = $('endingcard');
const elTitle = $('title');

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

/* the little oak on the title card, drawn with the real renderer */
const logoCv = $('tlogo'), lctx = logoCv.getContext('2d');
lctx.imageSmoothingEnabled = false;
const titleG = {
  t: 0, season: 'summer', timeOfDay: 0.66, mood: 'asleep', asleep: true, talking: false,
  blink: 0, blinkTimer: 1.6, look: { x: 0, y: 0.2 }, stare: 0, shake: 0,
  burn: 0, dead: false, flags: { hatOn: false }, watchers: 0
};
function drawTitleLogo(dt) {
  titleG.t += dt;
  // he is asleep on the title card. He breathes, and that is all.
  titleG.look.x = Math.sin(titleG.t * 0.25) * 0.2;
  titleG.shake = 0;
  const k = 0.95;
  lctx.setTransform(1, 0, 0, 1, 0, 0);
  lctx.clearRect(0, 0, logoCv.width, logoCv.height);
  lctx.save();
  lctx.translate(logoCv.width / 2 - CX() * k, logoCv.height - (GROUND_Y + 8) * k);
  lctx.scale(k, k);
  SPR.drawTree(lctx, titleG);
  SPR.drawZzz(lctx, titleG, CX() + 30, 76, 1.8);
  lctx.restore();
}

/* ---------------------------------------------------------------------
   FIT — the world fills the window. Height is always 192 logical pixels;
   width follows the window's aspect so there are never any bars.
   --------------------------------------------------------------------- */
let SCALE = 4;
function fit() {
  const winW = window.innerWidth, winH = window.innerHeight;
  SCALE = winH / H;
  const logicalW = SPR.setLogicalWidth(winW / SCALE);
  cv.width = logicalW; cv.height = H;
  buf.width = logicalW; buf.height = H;
  ctx.imageSmoothingEnabled = false;
  dc.imageSmoothingEnabled = false;
  cv.style.width = (logicalW * SCALE) + 'px';
  cv.style.height = (H * SCALE) + 'px';
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
  if (G.menu) {
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
  const w = Math.min(212, W() - 24);
  const lh = 11;
  let y = H - 10 - list.length * (lh + 4);
  for (let i = 0; i < list.length; i++) {
    const x = Math.round(W() / 2 - w / 2);
    const hovered = DLG.hover === i;
    SPR.drawBalloon(c, x, y, w, lh, null, { fill: hovered ? '#ffe06a' : '#ffffff', radius: 4 });
    F.drawText(c, x + 5, y + 2, '\u203a', '#a06a2a', 1);
    F.drawText(c, x + 12, y + 2, list[i].text, '#2b1c10', 1);
    DLG.rects.push({ x, y, w, h: lh, i });
    y += lh + 4;
  }
}

function choiceAt(x, y) {
  for (const r of DLG.rects) {
    if (x >= r.x - 2 && x <= r.x + r.w + 2 && y >= r.y - 2 && y <= r.y + r.h + 2) return r.i;
  }
  return -1;
}

function pickReply(ch) {
  DLG.choices = null; DLG.rects = [];
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
  pushNote(a.kind, a.name, a.desc, a.icon);
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

function pushNote(kind, title, desc, icon) {
  toastQueue.push({ kind, name: title, desc, icon });
}

function updateToasts(dt) {
  if (toastQueue.length && snails.length < 2 && (!snails.length || snails[snails.length - 1].x > 90)) {
    const n = toastQueue.shift();
    const head = n.kind === 'ending' ? 'A LETTER FOR YOU' :
                 n.kind === 'chal' ? 'REGISTERED POST' : 'SPECIAL DELIVERY';
    const lines = [n.name].concat(F.wrapText(n.desc || '', 104, 1).slice(0, 3));
    snails.push({
      x: -26, y: H - 14, dir: 1, speed: 30, head, lines,
      w: Math.max(88, Math.min(148, Math.max(...lines.map(l => F.textWidth(l, 1)), F.textWidth(head, 1)) + 14)),
      kind: n.kind, life: 0
    });
    SFX.note();
  }
  for (let i = snails.length - 1; i >= 0; i--) {
    const sn = snails[i];
    sn.life += dt;
    sn.x += sn.speed * dt;
    if (sn.x > W() + 50) snails.splice(i, 1);
  }
}

/* a poke makes him hurry along */
function snailAt(x, y) {
  for (const sn of snails) {
    if (Math.abs(x - sn.x) < 14 && Math.abs(y - sn.y) < 12) return sn;
  }
  return null;
}

function drawPost(c) {
  for (const sn of snails) {
    SPR.drawSnail(c, G, sn);
    SPR.drawSnailMessage(c, G, sn);
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
    : G.scene === 'heaven'
      ? [['THE HALL', () => openHall('heaven')], ['ENDINGS', openEndings], ['BE BORN AGAIN', reincarnate]]
      : [];
  if (!labels.length) return;
  const pad = 8;
  const widths = labels.map(([t]) => F.textWidth(t, 1) + 16);
  const total = widths.reduce((a, b) => a + b, 0) + pad * (labels.length - 1);
  let x = Math.round(W() / 2 - total / 2);
  for (let i = 0; i < labels.length; i++) {
    signs.push({ label: labels[i][0], act: labels[i][1], x, y: H - 22, w: widths[i], h: 15, hover: false });
    x += widths[i] + pad;
  }
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
    const y = signs.length ? H - 34 : H - 14;
    SPR.roundRect(c, W() / 2 - w / 2 - 5, y - 3, w + 10, 13, 3, 'rgba(10,8,7,0.65)');
    F.drawTextCentered(c, W() / 2, y, G.hintText, '#e8dcc0', 1);
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
  for (const s of signs) if (x >= s.x - 2 && x <= s.x + s.w + 2 && y >= s.y - 2 && y <= s.y + s.h + 2) return s;
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
  if (!bag.length) refillBag();
  const line = DATA.lines[bag.pop()];
  save.heard[line.id] = 1; persist();
  say('THE WISE OAK TREE', line.text, line.mood, line.tag === 'world' ? 'serious' : '', repliesFor(line.tag));

  const hc = Object.keys(save.heard).length;
  if (hc >= 10) ACH('chat10');
  if (hc >= 30) ACH('chat30');
  if (hc >= 60) ACH('chat60');
  if (heardCount() >= totalCount()) { ACH('chatall'); reachEnding('listener'); }
  if (line.tag === 'world') ACH('world1');
  if (line.tag === 'pop') ACH('pop1');
  checkWorldProgress();
  if (heardCount('pop') >= 20) ACH('pop20');
  if (heardCount('pop') >= totalCount('pop')) { ACH('popall'); reachEnding('canon'); }
  if (line.tag === 'meta' && Math.random() < 0.2) spawnParticles('star', CX(), 60, 10);
}

function triggerSneeze() {
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

function clickSquirrel() {
  const s = G.squirrel;
  s.clicks++; s.clickT = 0;
  if (s.clicks >= 3) { ACH('poke'); SFX.squeak(); s.face = 0; say('SQUIRREL', "OW. HEY. i am a WILD ANIMAL. i have RIGHTS. (i do not have rights)", null); s.clicks = 0; return; }
  SFX.squeak();
  save.stats.sqChats++; persist();
  if (save.stats.sqChats >= 15) ACH('sqchat');
  let pool = DATA.squirrelLines;
  if (has('lighter') && !G.flags.lighterGone) pool = pool.concat(DATA.squirrelWarnLines);
  say('SQUIRREL', pool[Math.floor(Math.random() * pool.length)], null, 'squirrel');
}

/* =========================================================================
   THE WORLD IS WIDER THAN ONE TREE
   Three places, walked between with the signposts at the edges of the frame.
   ========================================================================= */
const AREAS = DATA.areas;
function areaId() { return AREAS[G.area].id; }
function atOak() { return areaId() === 'oak'; }

function canTravel(dir) {
  const i = G.area + dir;
  return i >= 0 && i < AREAS.length && !G.cine && G.scene === 'game' && !G.dead && !G.menu;
}

function travel(dir) {
  if (!canTravel(dir) || G.areaFadeDir) return;
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
      setTimeout(() => nocSay(DATA.nocIntro.join(' ')), 700);
    }
  }
  if (areaId() === 'hollow') ACH('hollow');
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
  save.taken[p.id] = 1;
  if (p.id === 'backpack') {
    save.bag = true; G.hasBag = true; G.bagBadge = 1;
    ACH('backpack');
    pushNote('goal', 'YOU HAVE A BAG', 'Everything you find goes in it. Tap the bag, bottom left.', 'reach');
    nudge('your bag is in the bottom left corner', 10);
    say('YOU', "A backpack. Somebody's. Yours now.", null, 'serious');
  } else {
    G.inv.items[p.id] = true;
    save.items[p.id] = 1;
    G.bagBadge = 1;
    pushNote('goal', p.name, 'It went into your bag.', p.id === 'lighter' ? 'flame' : 'reach');
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
    chatLine('noc', "Agreed, then. " + p.ask);
    pushNote('goal', 'PLAN: ' + p.name, 'Agreed with Noc. Come back when it can be done.', 'reach');
    return;
  }
  const blocker = planBlocker(p);
  if (blocker) { SFX.deny(); chatLine('noc', "Not yet. We need " + blocker); return; }
  completePlan(p);
}

function completePlan(p) {
  if (p.need.leaves) G.inv.leaves -= p.need.leaves;
  save.planDone[p.id] = 1;
  delete save.plans[p.id];
  SFX.ach(); G.flash = 0.4;
  spawnParticles('star', G.noc.x, GROUND_Y, 14);
  chatLine('noc', p.done);
  let gift = '';
  if (p.give.item) {
    G.inv.items[p.give.item] = true; save.items[p.give.item] = 1; G.bagBadge = 1;
    gift = 'It is in your bag now.';
  }
  if (p.give.leaves) { G.inv.leaves += p.give.leaves; save.stats.leavesTotal += p.give.leaves; gift = p.give.leaves + ' leaves, for your trouble.'; }
  if (p.give.upgrade) { save.park.upgrades[p.give.upgrade] = 1; gift = 'The lane keeps the lights.'; }
  if (gift) chatLine('noc', gift);
  pushNote('chal', 'PLAN DONE: ' + p.name, p.done, 'reach');
  ACH('plandone');
  if (plansDone() >= 3) ACH('plan3');
  if (plansDone() >= DATA.plans.length) { ACH('planall'); reachEnding('together'); }
  persist(); refreshHUD(); seedPickups();
}

/* ---------------------------------------------------------------------
   THE TALK BOX — your words go in, Noc's come out
   --------------------------------------------------------------------- */
let chatBusy = false;

function openChat() {
  if (G.cine) return;
  elChat.classList.remove('hidden');
  if (!elChatLog.childElementCount) {
    chatLine('sys', NOC_AI.live
      ? 'Noc is listening for real. (model: ' + NOC_AI.model + ')'
      : 'Type anything. Noc answers in his own words. · /help for the odd commands.');
    chatLine('noc', save.metNoc ? DATA.nocLines[Math.floor(Math.random() * DATA.nocLines.length)] : DATA.nocIntro[0]);
  }
  setTimeout(() => elChatInput.focus(), 30);
  ACH('talknoc');
}

function closeChat() { elChat.classList.add('hidden'); }

function chatLine(who, text, actions) {
  const row = document.createElement('div');
  row.className = 'cline ' + who;
  if (who !== 'sys') {
    const tag = document.createElement('b');
    tag.textContent = who === 'noc' ? 'NOC' : 'YOU';
    row.appendChild(tag);
  }
  const sp = document.createElement('span');
  sp.textContent = text;
  row.appendChild(sp);
  if (actions && actions.length) {
    const bar = document.createElement('div');
    bar.className = 'cbtns';
    for (const [label, fn] of actions) {
      const b = document.createElement('button');
      b.className = 'act';
      b.textContent = label;
      b.onclick = () => { b.parentElement.remove(); fn(); };
      bar.appendChild(b);
    }
    row.appendChild(bar);
  }
  elChatLog.appendChild(row);
  elChatLog.scrollTop = elChatLog.scrollHeight;
  if (who === 'noc') { G.noc.talking = 2; SFX.click(); }
  return row;
}

function chatCommand(text) {
  const [cmd, ...rest] = text.slice(1).split(/\s+/);
  const arg = rest.join(' ').trim();
  switch (cmd.toLowerCase()) {
    case 'help':
      chatLine('sys', '/key <anthropic api key> — let Noc answer with a real model · /model <id> · /nokey · /plans · /forget');
      return true;
    case 'key':
      if (!arg) { chatLine('sys', 'Paste the key after /key. It is stored in this browser only and never leaves it except to Anthropic.'); return true; }
      NOC_AI.setKey(arg);
      chatLine('sys', 'Right. Noc is thinking with a real model now (' + NOC_AI.model + '). Local brain stays as the backup.');
      ACH('realai');
      return true;
    case 'nokey':
      NOC_AI.setKey('');
      chatLine('sys', 'Key cleared. Back to the brain he was born with.');
      return true;
    case 'model':
      chatLine('sys', 'Model: ' + NOC_AI.setModel(arg));
      return true;
    case 'forget':
      NOC_AI.forget(); elChatLog.innerHTML = '';
      chatLine('sys', 'He has forgotten the conversation. He has not forgotten you.');
      return true;
    case 'plans':
      for (const p of DATA.plans) {
        const st = planStatus(p);
        chatLine('sys', (st === 'done' ? '✓ ' : st === 'open' ? '· ' : '  ') + p.name +
                        (st === 'open' ? ' — ' + (planBlocker(p) || 'ready. Say so.') : ''));
      }
      return true;
  }
  return false;
}

async function sendChat() {
  const text = elChatInput.value.trim();
  if (!text || chatBusy) return;
  elChatInput.value = '';
  if (text[0] === '/') { if (chatCommand(text)) return; }

  chatLine('you', text);
  save.stats.nocChats = (save.stats.nocChats || 0) + 1;
  if (save.stats.nocChats >= 12) ACH('nocchat');
  persist();

  chatBusy = true;
  G.noc.thinking = 1;
  const dots = chatLine('noc', '…');
  const ctx = {
    season: G.season, night: SPR.isNight(G.timeOfDay), leaves: G.inv.leaves,
    plansDone: plansDone(), backpack: !!save.bag
  };
  let res;
  try { res = await NOC_AI.ask(text, ctx); }
  catch (e) { res = { text: "Sorry. Lost my thread. Say it again?", plan: null }; }
  dots.remove();
  G.noc.thinking = 0;
  chatBusy = false;

  const p = res.plan ? planById(res.plan) : null;
  const acts = [];
  if (p && !save.planDone[p.id]) {
    acts.push([save.plans[p.id] ? 'DO IT NOW' : 'AGREE TO IT', () => agreePlan(p.id)]);
    acts.push(['NOT YET', () => chatLine('noc', "Fine. It'll keep. Everything out here keeps.")]);
  }
  chatLine('noc', res.text, acts);
  // the balloon is for when the talk box is shut; two of them at once is noise
  if (elChat.classList.contains('hidden')) nocSay(res.text.length > 150 ? res.text.slice(0, 148) + '…' : res.text);
  else G.noc.talking = 2.5;
}

/* =========================================================================
   THE BAG
   ========================================================================= */
function openBag() {
  if (!save.bag || G.cine) return;
  G.bagOpen = true; G.bagBadge = 0;
  elBag.classList.remove('hidden');
  renderBag();
  SFX.pickup();
}
function closeBag() { G.bagOpen = false; elBag.classList.add('hidden'); }
function toggleBag() { G.bagOpen ? closeBag() : openBag(); }

function renderBag() {
  if (!elBagBody) return;
  elBagBody.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'bagtop';
  head.innerHTML = '<span class="leaves">☘ ' + G.inv.leaves + ' leaves</span>' +
                   '<span class="dim">' + Object.keys(G.inv.items).length + ' things · ' +
                   plansDone() + '/' + DATA.plans.length + ' plans kept</span>';
  elBagBody.appendChild(head);

  const owned = DATA.shop.filter(it => has(it.id));
  if (!owned.length) {
    const e = document.createElement('p');
    e.className = 'bagempty';
    e.textContent = 'Empty, apart from crumbs and one very old bus ticket. Look around the lane and the hollow, and make plans with Noc.';
    elBagBody.appendChild(e);
  }
  for (const it of owned) {
    const row = document.createElement('div');
    row.className = 'bagrow';
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16; c.className = 'itemicon';
    drawIcon(c.getContext('2d'), it.icon, 16);
    const info = document.createElement('div');
    info.className = 'shopinfo';
    info.innerHTML = '<b>' + it.name + '</b><span>' + (TOOL_HINTS[it.id] || it.desc) + '</span>';
    const btn = document.createElement('button');
    btn.className = 'buy';
    btn.textContent = 'TAKE OUT';
    btn.onclick = (e) => { e.stopPropagation(); holdFromBag(it.id); };
    row.appendChild(c); row.appendChild(info); row.appendChild(btn);
    elBagBody.appendChild(row);
  }

  const open = DATA.plans.filter(p => save.plans[p.id]);
  const done = DATA.plans.filter(p => save.planDone[p.id]);
  if (open.length || done.length) {
    const h = document.createElement('div');
    h.className = 'bagsec';
    h.textContent = 'PLANS WITH NOC';
    elBagBody.appendChild(h);
    for (const p of open) {
      const d = document.createElement('div');
      d.className = 'planrow';
      d.innerHTML = '<b>' + p.name + '</b><span>' + (planBlocker(p) || 'ready — go and tell him') + '</span>';
      elBagBody.appendChild(d);
    }
    for (const p of done) {
      const d = document.createElement('div');
      d.className = 'planrow kept';
      d.innerHTML = '<b>✓ ' + p.name + '</b><span>' + p.done + '</span>';
      elBagBody.appendChild(d);
    }
  }
}

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
function openModal(title, html, buttons) {
  elModalTitle.textContent = title;
  elModalBody.innerHTML = html;
  const bar = document.createElement('div');
  bar.className = 'modalbtns';
  (buttons || [['Close', closeModal]]).forEach(([label, fn, cls]) => {
    const b = document.createElement('button');
    b.className = 'act ' + (cls || '');
    b.textContent = label;
    b.onclick = (e) => { e.stopPropagation(); SFX.click(); fn(); };
    bar.appendChild(b);
  });
  elModalBody.appendChild(bar);
  elModal.classList.remove('hidden');
}
function closeModal() { elModal.classList.add('hidden'); G.flags.confirming = false; }

function openTrophies() {
  const done = DATA.achievements.filter(a => save.ach[a.id]).length;
  let html = '<p class="small">' + done + ' / ' + DATA.achievements.length + ' unlocked</p><div class="grid">';
  for (const a of DATA.achievements) {
    const got = !!save.ach[a.id];
    html += '<div class="tro ' + a.kind + (got ? '' : ' locked') + '">' +
      '<canvas class="troicon" data-icon="' + (got ? a.icon : 'lock') + '" width="16" height="16"></canvas>' +
      '<div><b>' + (got ? a.name : '???') + '</b><span>' + a.desc + '</span></div></div>';
  }
  html += '</div>';
  openModal('TROPHY ROOM', html);
  elModalBody.querySelectorAll('.troicon').forEach(c => {
    const ic = c.getAttribute('data-icon');
    const cc = c.getContext('2d');
    if (ic === 'lock') { px(cc, 4, 7, 8, 7, '#555'); px(cc, 6, 3, 4, 4, '#555'); px(cc, 7, 9, 2, 3, '#222'); }
    else drawIcon(cc, ic, 16);
  });
}

function openEndings() {
  const done = DATA.endings.filter(e => save.endings[e.id]).length;
  let html = '<p class="small">' + done + ' / ' + DATA.endings.length + ' endings found</p><div class="grid">';
  for (const e of DATA.endings) {
    const got = !!save.endings[e.id];
    html += '<div class="tro ' + (got ? 'goal' : 'locked') + '">' +
      '<canvas class="troicon" data-icon="' + (got ? e.icon : 'lock') + '" width="16" height="16"></canvas>' +
      '<div><b>' + (got ? e.name : '???') + '</b><span>' + (got ? e.title : 'Hint: ' + e.hint) + '</span></div></div>';
  }
  html += '</div>';
  openModal('ENDINGS', html);
  elModalBody.querySelectorAll('.troicon').forEach(c => {
    const ic = c.getAttribute('data-icon');
    const cc = c.getContext('2d');
    if (ic === 'lock') { px(cc, 4, 7, 8, 7, '#555'); px(cc, 6, 3, 4, 4, '#555'); px(cc, 7, 9, 2, 3, '#222'); }
    else drawIcon(cc, ic, 16);
  });
}

/* ---------------------------------------------------------------------
   ENDINGS
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

function showEndingCard(e) {
  SFX.ending();
  pushNote('ending', e.name, e.title, e.icon);
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  drawIcon(c.getContext('2d'), e.icon, 16);
  elEndingCard.innerHTML =
    '<div class="ecard"><div class="etop">ENDING UNLOCKED</div>' +
    '<div class="ename">' + e.name + '</div>' +
    '<div class="etitle">' + e.title + '</div>' +
    '<p class="ebody">' + e.body + '</p>' +
    '<button class="act" id="econt">Continue</button></div>';
  elEndingCard.querySelector('.ecard').prepend(c);
  elEndingCard.classList.remove('hidden');
  $('econt').onclick = (ev) => {
    ev.stopPropagation(); SFX.click();
    elEndingCard.classList.add('hidden');
    if (G.pendingEnding) { const f = G.pendingEnding; G.pendingEnding = null; f(); }
  };
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
  closeBag(); closeChat();
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
function startIntroCine() {
  G.mood = 'asleep'; G.asleep = true; G.blinkTimer = 99; G.blink = 1;
  playCine('intro', [
    { id: 'wide', dur: 3.4, cam: [-18, -4, 1.28], snap: true, caption: 'There is a tree in this park. It is asleep.' },
    { id: 'near', dur: 3.2, cam: [0, 8, 1.35], caption: 'Nobody remembers planting it. Nobody alive, anyway.' },
    { id: 'wake', dur: 3.6, cam: [0, 18, 1.75], caption: '',
      enter: () => { G.mood = 'asleep'; G.asleep = true; },
      tick: (p) => {
        G.blink = p < 0.45 ? 1 : 0;
        if (p > 0.45 && G.asleep) {
          G.asleep = false; G.mood = 'shock'; SFX.pickup(); G.shake = 3;
          for (let i = 0; i < 6; i++) dropLeaf(90 + Math.random() * 76, 40 + Math.random() * 40, i < 2);
        }
        if (p > 0.7) G.mood = 'chill';
      } },
    { id: 'settle', dur: 2.4, cam: [0, 5, 1.09], caption: 'Oh. You are new.' }
  ], () => {
    G.blinkTimer = 2; G.asleep = false;
    G.scene = 'game';
    refreshHUD(); refreshActions();
    say('THE WISE OAK TREE', "Hello. I am an oak tree. I am nine hundred years old. Click me and I will say things. That is the entire product.", 'happy');
    setTimeout(() => { if (!save.ach.lane && !save.ach.hollow) nudge('the signposts at the edges walk you west and east', 12); }, 9000);
  });
}

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
    if (atOak()) { updatePark(dt); updateVisitors(dt); }
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
      else { s.x += Math.sign(d) * 46 * dt; s.dir = Math.sign(d); }
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

function parkMargin() {
  const step = [0.16, 0.105, 0.055, 0.015][Math.min(3, save.park.expansions)];
  return Math.round(W() * step);
}

/* Fewer plots than there used to be, and further apart. An empty park with
   three good things in it beats a full one with ten. */
function plotCount() { return 3 + save.park.expansions * 2; }

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
    } else if (G.groundLeaves.length < 18) {
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
  const wanted = benches.length ? (save.park.upgrades.gate ? 3 : 2) : 0;
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
        ACH('visitor');
        G.parkMotes.push({ x: v.x, y: GROUND_Y + 10, t: 1.2 });
        SFX.pickup();
      }
    } else {
      v.x += Math.sign(v.tx - v.x) * 26 * dt;
      if (v.x < -18 || v.x > W() + 18) G.visitors.splice(i, 1);
    }
  }
}

/* ---- building ---- */
function canAfford(n) { return G.inv.leaves >= n; }

function buyBuild(id) {
  const b = BUILD_BY_ID[id];
  if (!b) return;
  if (!canAfford(b.cost)) { SFX.deny(); sayTree("Not enough leaves. The park does not run on enthusiasm.", 'smug'); return; }
  const free = [];
  for (let i = 0; i < plotCount(); i++) if (!propAtPlot(i)) free.push(i);
  if (!free.length) { SFX.deny(); sayTree("There is nowhere to put it. Push the hedge back first.", 'think'); return; }
  G.inv.leaves -= b.cost;
  const plot = free[0];
  save.park.props.push({ type: id, plot, age: 0 });
  persist();
  SFX.plant();
  spawnParticles('star', plotPos(plot).x, GROUND_Y + 4, 8);
  checkParkAchievements();
  refreshHUD();
  sayTree("A " + b.name.toLowerCase() + ". Look at us. We are a DESTINATION.", 'happy');
}

function buyUpgrade(id) {
  const u = DATA.upgrades.find(x => x.id === id);
  if (!u || save.park.upgrades[id]) return;
  if (!canAfford(u.cost)) { SFX.deny(); sayTree("Not yet. Come back with more leaves.", 'smug'); return; }
  G.inv.leaves -= u.cost;
  save.park.upgrades[id] = 1;
  persist(); SFX.ach();
  checkParkAchievements();
  refreshHUD();
  sayTree(u.name + ". Money well spent, and I say that as a tree with no concept of money.", 'happy');
}

function buyExpansion() {
  const tier = save.park.expansions;
  const e = DATA.expansions[tier];
  if (!e) { sayTree("There is no more park to have. This is all of it. It is enough.", 'happy'); return; }
  if (!canAfford(e.cost)) { SFX.deny(); sayTree("The hedge stays where it is until you can afford otherwise.", 'smug'); return; }
  G.inv.leaves -= e.cost;
  save.park.expansions++;
  persist(); SFX.ach(); G.flash = 0.7;
  checkParkAchievements();
  refreshHUD();
  sayTree(e.desc + " I can see the lane from here now. I have not seen the lane since the war.", 'shock');
}

function sayTree(text, mood) { say('THE WISE OAK TREE', text, mood || 'idle', ''); }

/* ---------------------------------------------------------------------
   MENUS — wooden panels nailed up in the park, not interface
   --------------------------------------------------------------------- */
function openBuildMenu() {
  const rows = DATA.build.map(b => {
    const owned = save.park.props.filter(p => p.type === b.id).length;
    return {
      label: b.name + (owned ? ' x' + owned : ''),
      sub: b.desc,
      cost: b.cost,
      act: () => buyBuild(b.id)
    };
  });
  const tier = save.park.expansions;
  if (DATA.expansions[tier]) {
    rows.push({ label: 'Expand The Park', sub: DATA.expansions[tier].desc, cost: DATA.expansions[tier].cost, act: buyExpansion });
  }
  G.menu = { kind: 'build', title: 'THE NOTICEBOARD', rows, sel: -1 };
  SFX.page();
}

function openLedger() {
  const rows = DATA.upgrades.map(u => ({
    label: u.name, sub: u.desc, cost: u.cost,
    owned: !!save.park.upgrades[u.id],
    act: () => buyUpgrade(u.id)
  }));
  const inc = parkIncome();
  G.menu = {
    kind: 'ledger', title: "THE KEEPER'S LEDGER", rows, sel: -1,
    note: inc.toFixed(2) + ' leaves a second  ·  ' + save.park.earned + ' earned'
  };
  SFX.page();
}

function closeMenu() { G.menu = null; SFX.click(); }

function menuBox() {
  const m = G.menu;
  const w = Math.min(300, W() - 16);
  const h = 26 + m.rows.length * 17 + (m.note ? 10 : 0);
  return { x: Math.round(W() / 2 - w / 2), y: Math.round(H / 2 - h / 2) - 6, w, h };
}

function menuRowAt(x, y) {
  if (!G.menu) return -2;
  const b = menuBox();
  if (x > b.x + b.w - 12 && x < b.x + b.w + 2 && y > b.y - 2 && y < b.y + 12) return -1;   // close
  const top = b.y + 16 + (G.menu.note ? 10 : 0);
  for (let i = 0; i < G.menu.rows.length; i++) {
    if (x >= b.x + 3 && x <= b.x + b.w - 3 && y >= top + i * 17 && y < top + i * 17 + 16) return i;
  }
  return -2;
}

/* trim a string until it fits, with an ellipsis */
function fitText(str, maxW) {
  if (F.textWidth(str, 1) <= maxW) return str;
  let t = str;
  while (t.length > 1 && F.textWidth(t + '...', 1) > maxW) t = t.slice(0, -1);
  return t + '...';
}

function drawMenu(c) {
  const m = G.menu;
  if (!m) return;
  const b = menuBox();
  SPR.drawPanel(c, b.x, b.y, b.w, b.h, m.title);
  // leaf purse, top right
  F.drawText(c, b.x + b.w - 34, b.y + 3, String(G.inv.leaves), '#ffe9b0', 1);
  SPR.drawLeafSprite(c, b.x + b.w - 44, b.y + 3, '#8fd95a', '#3a7a28');
  // close
  F.drawText(c, b.x + b.w - 9, b.y + 3, 'x', m.sel === -1 ? '#ffd24a' : '#ffe9b0', 1);

  let top = b.y + 16;
  if (m.note) { F.drawTextCentered(c, b.x + b.w / 2, top, fitText(m.note, b.w - 10), '#6b4a2a', 1); top += 10; }

  for (let i = 0; i < m.rows.length; i++) {
    const r = m.rows[i];
    const y = top + i * 17;
    const afford = G.inv.leaves >= r.cost && !r.owned;
    const hot = m.sel === i;
    if (hot) SPR.roundRect(c, b.x + 3, y, b.w - 6, 16, 2, '#e8c98a');
    const priceW = F.textWidth(r.owned ? 'HAVE IT' : String(r.cost), 1) + 22;
    F.drawText(c, b.x + 7, y + 1, fitText(r.label, b.w - 14 - priceW), r.owned ? '#6b8a4a' : '#3a2410', 1);
    F.drawText(c, b.x + 7, y + 9, fitText(r.sub, b.w - 14), '#7a6248', 1);
    const price = r.owned ? 'HAVE IT' : String(r.cost);
    const pw = F.textWidth(price, 1);
    F.drawText(c, b.x + b.w - 9 - pw, y + 4, price, r.owned ? '#6b8a4a' : afford ? '#2d6b1f' : '#a05a4a', 1);
    if (!r.owned) SPR.drawLeafSprite(c, b.x + b.w - 17 - pw, y + 4, afford ? '#8fd95a' : '#b0a08a', '#3a7a28');
  }
}

/* ---------------------------------------------------------------------
   CRITTERS
   --------------------------------------------------------------------- */
/* The resting camera crops a sliver off each edge, so anything the player
   needs to be able to click has to stay inside this. */
const REST_ZOOM = 1.09;
function inset() { return Math.ceil((W() - W() / REST_ZOOM) / 2) + 6; }
function insetX(x) { return Math.max(inset(), Math.min(W() - inset(), x)); }
const BIRD_COLS = ['#8a4a3a', '#4a6a8a', '#6a5a3a', '#3a5a4a'];

function seedCritters() {
  G.critters = [];
  const branchPerch = () => {
    const b = SPR.CANOPY[Math.floor(Math.random() * SPR.CANOPY.length)];
    return { x: b.x + (Math.random() - 0.5) * 20, y: b.y + 14 };
  };
  for (let i = 0; i < 2; i++) {
    const p = branchPerch();
    G.critters.push({ kind: 'bird', x: p.x, y: p.y, hx: p.x, hy: p.y, col: BIRD_COLS[i % BIRD_COLS.length],
                      ph: Math.random() * 6.28, flying: false, t: 3 + Math.random() * 8, vx: 0, vy: 0 });
  }
  for (let i = 0; i < 3; i++) {
    G.critters.push({ kind: 'butterfly', x: inset() + Math.random() * (W() - inset() * 2), y: 100 + Math.random() * 50,
                      col: ['#ffd24a', '#e88ac0', '#8ac8f0'][i % 3], ph: Math.random() * 6.28, t: 0 });
  }
  G.critters.push({ kind: 'beetle', x: CX() - 20, y: 130, ph: 0, dir: 1, t: 0 });
  G.critters.push({ kind: 'rabbit', x: insetX(46), y: GROUND_Y + 22, dir: 1, moving: false, t: 2, ph: 0 });
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
      k.x += Math.sin(G.t * 0.7 + k.ph) * 16 * dt + 6 * dt;
      k.y += Math.sin(G.t * 1.9 + k.ph) * 12 * dt;
      if (k.x > W() - inset()) k.x = inset();
      k.y = Math.max(70, Math.min(GROUND_Y + 20, k.y));
    } else if (k.kind === 'beetle') {
      k.x += k.dir * 5 * dt;
      k.y += Math.sin(G.t * 0.6) * 3 * dt;
      if (Math.abs(k.x - CX()) > 20) k.dir *= -1;
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
    const r = k.kind === 'rabbit' ? 10 : k.kind === 'beetle' ? 5 : 7;
    if (Math.abs(x - k.x) < r && Math.abs(y - k.y) < r + 2) return k;
  }
  return null;
}

function touchCritter(k) {
  const lines = DATA.critterLines[k.kind];
  if (k.kind === 'bird' && !k.flying) { k.flying = true; k.t = 2.4; k.vx = (Math.random() > .5 ? 1 : -1) * 44; k.vy = -18; }
  if (k.kind === 'rabbit') { k.moving = true; k.t = 1.4; k.dir = k.x < CX() ? -1 : 1; }
  ACH('critter');
  SFX.squeak();
  say('THE WISE OAK TREE', lines[Math.floor(Math.random() * lines.length)], 'happy');
}

/* camera easing — cinematics move it, everything else leaves it alone */
function updateCam(dt) {
  if (!G.cine) {
    const rest = (G.scene === 'hall' || G.scene === 'heaven') ? [0, 0, 1] : [0, 5, 1.09];
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
  SPR.drawBoundary(dc, G, parkMargin());
  SPR.drawCosyFoliage(dc, G, 404, 0.9);
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
    SPR.drawTree(L, G);
    SPR.drawWatchers(L, G);
  }
  // the park you have built
  if (!o.fall && o.growing === undefined) {
    SPR.drawCottage(L, G, parkMargin() + 26, GROUND_Y + 12);
    SPR.drawNoticeBoard(L, G, W() - parkMargin() - 26, GROUND_Y + 14);
    for (const pr of save.park.props) {
      const pos = plotPos(pr.plot);
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
  SPR.drawUndergrowth(dc, G);
  SPR.drawForeground(dc, G);
  drawPickups(dc);
  SPR.drawVines(dc, G, 51);
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
  const lane = areaId() === 'lane';
  SPR.drawBackdrop(dc, G);
  SPR.drawGround(dc, G);
  if (lane) SPR.drawLaneRoad(dc, G);
  SPR.drawHedgerow(dc, G, lane ? W() * 0.22 : undefined);
  SPR.drawCosyFoliage(dc, G, lane ? 707 : 909, lane ? 0.45 : 1.4);

  const L = SPR.layerBegin();
  SPR.drawGroundItems(L, G);
  if (lane) {
    SPR.drawNocCamp(L, G, Math.round(W() * 0.62) - 34, GROUND_Y + 14);
    SPR.drawNoc(L, G, G.noc);
  } else {
    SPR.drawStandingStone(L, G, Math.round(W() * 0.62), GROUND_Y + 12);
    SPR.drawFallenLog(L, G, Math.round(W() * 0.10), GROUND_Y + 26, Math.round(W() * 0.32));
  }
  SPR.drawCritters(L, G);
  SPR.layerEnd(dc, '#1a0f08');

  SPR.drawParticles(dc, G);
  if (!lane) SPR.drawUndergrowth(dc, G);
  SPR.drawForeground(dc, G);
  drawPickups(dc);
  SPR.drawVines(dc, G, lane ? 61 : 71);
  SPR.drawFrameFoliage(dc, G);
  SPR.drawBokeh(dc, G);
  SPR.drawOverlay(dc, G);
}

function drawPickups(c) {
  for (const p of G.pickups) SPR.drawPickup(c, G, p, hover.kind === 'pickup' && hover.p === p);
}

/* the signposts, drawn on the finished frame so a click lands where it looks */
function refreshArrows() {
  G.arrows = [];
  if (G.cine || G.scene !== 'game' || G.dead || G.menu) return;
  for (const dir of [-1, 1]) {
    const i = G.area + dir;
    if (i < 0 || i >= AREAS.length) continue;
    const label = AREAS[i].name.replace(/^THE /, '');
    const box = SPR.travelArrowBox(dir, label);
    G.arrows.push({ dir, label, hover: false, x: box.x, y: box.y, w: box.w, h: box.h });
  }
}

function arrowAt(x, y) {
  for (const a of G.arrows) if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) return a;
  return null;
}

function drawArrows(c) {
  for (const a of G.arrows) SPR.drawTravelArrow(c, G, a.dir, a.label, a.hover);
}

function bagButtonBox() { return { x: 4, y: H - 26, w: 26, h: 26 }; }
function overBagButton(x, y) {
  const b = bagButtonBox();
  return G.hasBag && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

function drawCineFrame() {
  const st = cineStage(), p = cineProgress();
  const name = G.cine.name;

  if (name === 'intro' || name === 'lighter' || name === 'mercy' || name === 'grove') {
    drawWorld();
    if (name === 'intro' && st === 'wide') {
      dc.globalAlpha = Math.max(0, 1 - p * 2.2);
      SPR.px(dc, 0, 0, W(), H, '#000000');
      dc.globalAlpha = 1;
    }
    if (name === 'intro' && st === 'wake' && p > 0.45 && p < 0.75) {
      SPR.drawRays(dc, G, (p - 0.45) * 2, CX(), 106);
    }
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
  if (!G.cine && G.scene === 'game') { drawArrows(ctx); SPR.drawHud(ctx, G); }
  if (G.areaTitle > 0 && !G.cine) SPR.drawAreaTitle(ctx, G, AREAS[G.area].name, AREAS[G.area].sub, Math.min(1, G.areaTitle));
  if (!G.cine) drawPost(ctx);
  drawHint(ctx);
  drawSigns(ctx);
  if (G.menu) drawMenu(ctx);
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
    return { kind: null, i: -1 };
  }

  // the cottage and the noticeboard are solid objects, checked before him
  if (G.scene === 'game' && !G.dead) {
    if (Math.abs(x - (parkMargin() + 26)) < 24 && y > GROUND_Y - 34 && y < GROUND_Y + 14)
      return { kind: 'house', i: -1 };
    if (Math.abs(x - (W() - parkMargin() - 26)) < 14 && y > GROUND_Y - 22 && y < GROUND_Y + 16)
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
      if (fy >= 100 && fy < CX() && Math.abs(fx) < 9) return { kind: 'part', part: 'nose', i: -1 };
      if (fy >= CX() && fy < 145 && Math.abs(fx) < 20) return { kind: 'part', part: 'mouth', i: -1 };
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
  if (part === 'eye') { G.shake = 3; SFX.deny(); G.blink = 0.5; }
  else if (part === 'nose') { SFX.squeak(); if (Math.random() < 0.35) setTimeout(triggerSneeze, 900); }
  else if (part === 'mouth') { G.stare = 1; G.stareHold = 2.2; SFX.boom(); }
  else if (part === 'canopy') { SFX.pickup(); for (let i = 0; i < 4; i++) dropLeaf(100 + Math.random() * 56, 40 + Math.random() * 30, i < 2); }
  else if (part === 'root') { SFX.click(); }
  else SFX.click();
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
  if (G.menu) { G.menu.sel = menuRowAt(fr.x, fr.y); cv.style.cursor = G.menu.sel >= -1 ? 'pointer' : 'default'; return; }
  let onSign = false;
  for (const sg of signs) { sg.hover = signAt(fr.x, fr.y) === sg; onSign = onSign || sg.hover; }
  const ar = arrowAt(fr.x, fr.y);
  for (const a of G.arrows) a.hover = a === ar;
  G.bagHover = overBagButton(fr.x, fr.y);
  if (onSign || ar || G.bagHover) { cv.style.cursor = 'pointer'; return; }
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
      spawnParticles('heart', CX(), 110, 5);
      for (let i = 0; i < 6; i++) dropLeaf(96 + Math.random() * 64, 40 + Math.random() * 40, i < 2);
      say('THE WISE OAK TREE', DATA.tickleLines[Math.floor(Math.random() * DATA.tickleLines.length)], 'laugh');
    }
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
  SFX.kick();
  const fr = toScreenPixels(ev);

  // a menu swallows everything while it is open
  if (G.menu) {
    const r = menuRowAt(fr.x, fr.y);
    if (r === -1) { closeMenu(); return; }
    if (r >= 0) {
      const row = G.menu.rows[r];
      const kind = G.menu.kind;
      row.act();
      if (kind === 'build') openBuildMenu(); else openLedger();
      return;
    }
    closeMenu();
    return;
  }

  const sg = signAt(fr.x, fr.y);
  if (sg) { SFX.click(); sg.act(); return; }

  // the signposts at the edges, and the bag in the corner
  if (!G.cine && G.scene === 'game') {
    const ar = arrowAt(fr.x, fr.y);
    if (ar) { travel(ar.dir); return; }
    if (overBagButton(fr.x, fr.y)) { SFX.click(); toggleBag(); return; }
  }

  // a reply, if one is on offer
  if (DLG.on && DLG.choices && dialogueDone()) {
    const ci = choiceAt(fr.x, fr.y);
    if (ci >= 0) { SFX.click(); pickReply(DLG.choices[ci]); return; }
  }
  // hurry the postman along
  const sn = snailAt(fr.x, fr.y);
  if (sn) { sn.speed = 150; SFX.squeak(); return; }

  if (G.cine) { skipStage(); return; }
  const p = toLogical(ev);

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
  if (h.kind === 'noc') { SFX.click(); openChat(); return; }
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
    openLedger();
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
    openBuildMenu();
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

$('modalclose').onclick = () => { SFX.click(); closeModal(); };
$('chatsend').onclick = (e) => { e.stopPropagation(); sendChat(); };
elChatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); sendChat(); }
});
$('bagclose').onclick = (e) => { e.stopPropagation(); SFX.click(); closeBag(); };
$('chatclose').onclick = (e) => { e.stopPropagation(); SFX.click(); closeChat(); };
elModal.addEventListener('mousedown', e => { if (e.target === elModal && !G.flags.confirming) closeModal(); });

document.addEventListener('keydown', e => {
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') {
    if (e.key === 'Escape') { e.target.blur(); closeChat(); }
    return;
  }
  if (G.scene === 'hall') {
    if (e.key === 'ArrowRight') G.hall.target += 60;
    if (e.key === 'ArrowLeft') G.hall.target -= 60;
    if (e.key === 'Escape') closeHall();
    return;
  }
  if (e.key === 'Escape') { if (G.menu) closeMenu(); closeModal(); closeBag(); closeChat(); }
  if (e.key === ' ') { e.preventDefault(); if (!skipType() && G.scene === 'game') talkToTree(); }
  if (e.key === 'ArrowLeft') travel(-1);
  if (e.key === 'ArrowRight') travel(1);
  if (e.key.toLowerCase() === 'b') toggleBag();
  if (e.key.toLowerCase() === 't' && areaId() === 'lane') openChat();
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

/* the title card holds until you tap it */
function beginGame() {
  if (started) return;
  started = true;
  SFX.kick(); SFX.ach();
  elTitle.classList.add('out');
  setTimeout(() => elTitle.classList.add('hidden'), 520);
  // he was asleep on the card, so he is asleep in the world too
  G.asleep = true; G.mood = 'asleep';
  if (hadSave) {
    setTimeout(wakeHim, 1100);
  } else {
    startIntroCine();
  }
}

/* the actual waking: a shudder, a blink, and nine hundred years of opinions */
function wakeHim() {
  if (!G.asleep) return;
  G.asleep = false; G.wakeT = 0;
  G.blink = 0.45; G.shake = 3.2; G.mood = 'shock'; G.moodTimer = 5;
  SFX.sneeze();
  for (let i = 0; i < 7; i++) dropLeaf(90 + Math.random() * 76, 40 + Math.random() * 40, i < 2);
  spawnParticles('star', CX(), 96, 6);
  setTimeout(() => {
    if (G.dead || G.cine) return;
    G.mood = 'sleepy';
    say('THE WISE OAK TREE', hadSave
      ? "Mm. You again. I had got all the way to sleep, which for me takes about a decade. Sit down. I'll be awake in a minute."
      : "Nnh. Someone is standing under me. Right. Give me a moment. Nine hundred years is a long nap to come out of.",
      'sleepy');
    if (!save.ach.lane && !save.ach.hollow) setTimeout(() => nudge('the signposts at the edges walk you west and east', 12), 7000);
    else if (!save.bag) setTimeout(() => nudge('there is a bag somewhere east of here', 10), 7000);
  }, 700);
}
$('tstart').onclick = beginGame;
elTitle.addEventListener('mousedown', beginGame);
elTitle.addEventListener('touchstart', beginGame, { passive: true });

/* Debug hooks, only when the page is opened with ?debug — used by the
   automated smoke test to reach the late game without playing for an hour. */
if (/[?&]debug/.test(location.search)) {
  window.OAK = { G, save, ACH, reachEnding, startBurning, goHeaven, reincarnate,
                 refreshHUD, dropLeaf, triggerSneeze, maybeSpawnSquirrel, persist,
                 skipAll: () => { if (G.cine) { G.cine.i = G.cine.stages.length - 1; skipStage(); } },
                 parkMargin, parkIncome, menuBox, closeMenu, openBuildMenu, openLedger, plotPos, hitTest,
                 travel, takePickup, seedPickups, openChat, closeChat, sendChat, openBag, closeBag,
                 agreePlan, completePlan, planById, areaId, wakeHim, AREAS,
                 signLabels: () => signs.map(s => s.label), signFor: (l) => signs.find(s => s.label === l),
                 dlgText: () => DLG.text, DLG, snails: () => snails.length, toastQueue };
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!started) drawTitleLogo(dt);
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener('beforeunload', persist);

window.addEventListener('resize', () => fit());
window.addEventListener('orientationchange', () => setTimeout(fit, 200));

})();
