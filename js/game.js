/* =========================================================================
   THE WISE OAK TREE
   A very goofy game about a tree who has seen everything.
   ========================================================================= */
(function () {
'use strict';

const { W, H, GROUND_Y, px, dot, pcircle, mix, mulberry, SEASON_NAMES } = SPR;
const SAVE_KEY = 'wiseoak.save.v3';

/* ---------------------------------------------------------------------
   SAVE
   --------------------------------------------------------------------- */
const defaultSave = () => ({
  ach: {}, endings: {}, heard: {}, muted: false, sessions: 0,
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
  inv: { leaves: 0, items: {} },
  sessionTime: 0, sinceTreeClick: 0, spamCount: 0, spamTimer: 0,
  sneezeTimer: 14 + Math.random() * 18,
  burnTimer: 0, burnStage: 0, deathTimer: 0, ascended: false,
  heavenTalk: 0, godIdx: 0, ghostIdx: 0,
  pendingEnding: null,
  // face performance
  stare: 0, stareTimer: 20 + Math.random() * 40, moodTimer: 0, stillBurning: false,
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
cv.width = W; cv.height = H;
ctx.imageSmoothingEnabled = false;

/* The scene is drawn 1:1 into this buffer and then blitted through the
   camera. Scaling the context directly leaves seams between the 1px rows
   every sprite is built from; blitting a finished frame does not. */
const buf = document.createElement('canvas');
buf.width = W; buf.height = H;
const dc = buf.getContext('2d');
dc.imageSmoothingEnabled = false;

const elDialog = $('dialogue'), elSpeaker = $('speaker'), elText = $('dtext');
const elLeaves = $('leafcount'), elItems = $('items'), elActions = $('actions');
const elToasts = $('toasts'), elShop = $('shop'), elShopList = $('shoplist');
const elModal = $('modal'), elModalBody = $('modalbody'), elModalTitle = $('modaltitle');
const elEndingCard = $('endingcard');
const elHint = $('hint');
const elSeason = $('seasonpill');

/* ---------------------------------------------------------------------
   DIALOGUE (typewriter)
   --------------------------------------------------------------------- */
let typeQueue = null, typeIdx = 0, typeTimer = 0, talkHold = 0;
function say(speaker, text, mood, cls) {
  G.stare = 0; G.watchers = Math.min(G.watchers, 0.2);
  elDialog.classList.remove('hidden');
  elDialog.className = 'dialogue ' + (cls || '');
  elSpeaker.textContent = speaker;
  elText.textContent = '';
  typeQueue = text; typeIdx = 0; typeTimer = 0;
  G.talking = true; talkHold = 0;
  if (mood) G.mood = mood;
}
function updateType(dt) {
  if (typeQueue === null) {
    if (G.talking) { talkHold += dt; if (talkHold > 3.2) { G.talking = false; } }
    return;
  }
  typeTimer += dt;
  const speed = 0.018;
  while (typeTimer > speed && typeIdx < typeQueue.length) {
    typeTimer -= speed;
    const ch = typeQueue[typeIdx++];
    elText.textContent += ch;
    if (typeIdx % 3 === 0 && ch !== ' ') SFX.talk(typeIdx);
  }
  if (typeIdx >= typeQueue.length) { typeQueue = null; }
}
function skipType() {
  if (typeQueue !== null) { elText.textContent = typeQueue; typeQueue = null; talkHold = 0; return true; }
  return false;
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
  toastQueue.push(ACH_BY_ID[id]);
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

let toastActive = null, toastTimer = 0;
function updateToasts(dt) {
  if (!toastActive && toastQueue.length) {
    toastActive = toastQueue.shift();
    toastTimer = 0;
    SFX.ach();
    const el = document.createElement('div');
    el.className = 'toast ' + toastActive.kind;
    const cvIcon = document.createElement('canvas');
    cvIcon.width = 16; cvIcon.height = 16; cvIcon.className = 'ticon';
    drawIcon(cvIcon.getContext('2d'), toastActive.icon, 16);
    const txt = document.createElement('div');
    txt.className = 'tbody';
    txt.innerHTML = '<div class="tkind">' +
      (toastActive.kind === 'chal' ? 'Challenge Complete!' : toastActive.kind === 'goal' ? 'Goal Reached!' : 'Achievement Get!') +
      '</div><div class="tname">' + toastActive.name + '</div>';
    el.appendChild(cvIcon); el.appendChild(txt);
    elToasts.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    const mine = el;
    setTimeout(() => { mine.classList.remove('in'); setTimeout(() => mine.remove(), 500); }, 4200);
    setTimeout(() => { toastActive = null; }, 700);
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
   INVENTORY / HUD
   --------------------------------------------------------------------- */
function has(id) { return !!G.inv.items[id]; }

function refreshHUD() {
  elLeaves.textContent = G.inv.leaves;
  elItems.innerHTML = '';
  for (const it of DATA.shop) {
    if (!has(it.id)) continue;
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16; c.className = 'itemicon';
    c.title = it.name + ' — ' + it.desc;
    drawIcon(c.getContext('2d'), it.icon, 16);
    elItems.appendChild(c);
  }
  refreshActions();
}

function actionBtn(label, cls, fn) {
  const b = document.createElement('button');
  b.className = 'act ' + (cls || '');
  b.textContent = label;
  b.onclick = (e) => { e.stopPropagation(); SFX.click(); fn(); };
  elActions.appendChild(b);
}

function refreshActions() {
  elActions.innerHTML = '';
  if (G.scene === 'cine') return;
  if (G.scene === 'hall') {
    actionBtn('\u2190 Back', '', closeHall);
    actionBtn('Sort by unlocked', '', sortHall);
    actionBtn('List view', '', openTrophies);
    return;
  }
  if (G.scene === 'heaven') {
    actionBtn('Hall of Trophies', 'good', () => openHall('heaven'));
    actionBtn('Reincarnate \u21bb', 'good', reincarnate);
    return;
  }
  if (G.scene !== 'game') return;
  if (G.dead) return;
  actionBtn('Hug', 'good', doHug);
  if (has('can')) actionBtn('Water', 'good', doWater);
  if (has('acorn')) actionBtn('Plant Acorn', 'good', doPlant);
  if (has('hat') && !G.flags.hatOn) actionBtn('Give Hat', 'good', doHat);
  if (has('pamph')) actionBtn('Show Newspaper', '', doNews);
  if (has('diary')) actionBtn('Read Diary', '', doDiary);
  if (has('lighter') && !G.flags.lighterGone) {
    actionBtn('Flick Lighter', 'bad', doFlick);
    actionBtn('BURN THE TREE', 'bad', askBurn);
    actionBtn('Throw It Away', 'good', doThrowAway);
  }
}

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
  say('THE WISE OAK TREE', line.text, line.mood, line.tag === 'world' ? 'serious' : '');

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
  if (line.tag === 'meta' && Math.random() < 0.2) spawnParticles('star', 128, 60, 10);
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
  spawnParticles('spark', 128, 128, 8);
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
  spawnParticles('heart', 128, 110, 8);
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

function doPlant() {
  if (!has('acorn')) return;
  G.inv.items.acorn = false;
  save.stats.plants++; persist();
  SFX.plant();
  const x = 30 + Math.random() * 190;
  G.saplings.push({ x: Math.floor(x), age: 0, ph: Math.random() * 6.28 });
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
    "Five. That is a wood. That is an actual wood. I have been trying to do that for four hundred years and you did it in an afternoon."
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
    "I am not going to beg. I have been here four hundred years and I will not beg to a person with a lighter.",
    "...Okay. I will beg. Please. There are mice in my roots."
  ];
  say('THE WISE OAK TREE', lines[Math.min(lines.length - 1, save.stats.flicks - 1)], save.stats.flicks > 4 ? 'sad' : 'shock');
}

function askBurn() {
  G.flags.confirming = true;
  openModal('ARE YOU SURE?',
    "<p>He is four hundred years old.</p>" +
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
  s.x = s.dir === 1 ? -14 : W + 14;
  s.targetX = s.dir === 1 ? 186 : 70;
  s.moving = true;
  ACH('squirrel');
  setTimeout(() => {
    if (G.scene === 'game' && !G.dead)
      say('SQUIRREL', "yo. yo. down here. i heard sneezing which means LEAVES which means BUSINESS.", null);
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
  say('SQUIRREL', pool[Math.floor(Math.random() * pool.length)], null);
  openShop();
}

function openShop() {
  // open on the opposite side to the squirrel so he is never hidden behind
  // his own shop window
  const onLeft = G.squirrel.x < W / 2;
  elShop.style.left = onLeft ? 'auto' : '8px';
  elShop.style.right = onLeft ? '8px' : 'auto';
  elShop.classList.remove('hidden');
  elShopList.innerHTML = '';
  for (const it of DATA.shop) {
    const row = document.createElement('div');
    row.className = 'shoprow' + (has(it.id) ? ' owned' : '') + (G.inv.leaves < it.cost ? ' poor' : '');
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16; c.className = 'itemicon';
    drawIcon(c.getContext('2d'), it.icon, 16);
    const info = document.createElement('div');
    info.className = 'shopinfo';
    info.innerHTML = '<b>' + it.name + '</b><span>' + it.desc + '</span>';
    const btn = document.createElement('button');
    btn.className = 'buy';
    btn.textContent = has(it.id) && it.id !== 'acorn' ? 'OWNED' : (it.cost + ' ☘');
    btn.disabled = has(it.id) && it.id !== 'acorn';
    btn.onclick = (e) => { e.stopPropagation(); buy(it); };
    row.appendChild(c); row.appendChild(info); row.appendChild(btn);
    elShopList.appendChild(row);
  }
}
function closeShop() { elShop.classList.add('hidden'); }

function buy(it) {
  if (G.inv.leaves < it.cost) {
    SFX.deny();
    say('SQUIRREL', "nope. not enough leaves. i'm running a business here, not a charity. (i am running neither)", null);
    return;
  }
  G.inv.leaves -= it.cost;
  G.inv.items[it.id] = true;
  save.stats.trades++; persist();
  SFX.trade();
  ACH('trade1');
  if (it.id === 'lighter') {
    ACH('lighter');
    refreshHUD(); closeShop();
    startLighterCine();
    return;
  } else {
    say('SQUIRREL', "pleasure doing business. don't tell the tree. he thinks i'm a saver.", null);
  }
  if (DATA.shop.every(s => has(s.id) || (s.id === 'acorn' && save.stats.plants > 0))) ACH('tradeall');
  refreshHUD();
  openShop();
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
  elDialog.classList.add('hidden');
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
  elDialog.classList.add('hidden');
  const got = DATA.achievements.filter(a => save.ach[a.id]).length;
  elHint.textContent = got + ' / ' + DATA.achievements.length + ' \u00b7 drag to scroll \u00b7 lift a trophy onto another plinth to rearrange';
  elHint.classList.remove('hidden');
  refreshActions();
  SFX.ach();
}

function closeHall() {
  elHallLabel.classList.add('hidden');
  G.scene = G.hall.from === 'game' ? 'game' : 'heaven';
  elHint.classList.toggle('hidden', G.scene === 'game');
  if (G.scene === 'heaven') elHint.textContent = 'click the ghost tree \u00b7 click the clouds \u00b7 visit the hall \u00b7 then reincarnate';
  refreshActions();
}

function resetWorld() {
  G.burn = 0; G.dead = false; G.burnStage = 0; G.deathTimer = 0; G.ascended = false;
  G.particles = []; G.groundLeaves = []; G.saplings = [];
  G.inv = { leaves: 0, items: {} };
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
          G.groundLeaves.push({ x: Math.max(4, Math.min(W - 10, p.x | 0)), y: GROUND_Y + 4 + Math.random() * 18, col: p.col, col2: p.col2, ph: Math.random() * 6.28, landed: true });
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

let seasonPillText = '';
function updateSeasonPill() {
  const label = (SPR.isNight(G.timeOfDay) ? '\u263D ' : '\u2600 ') + G.season;
  if (label !== seasonPillText) { seasonPillText = label; elSeason.textContent = label; }
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
  elDialog.classList.add('hidden');
  elShop.classList.add('hidden');
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
      enter: () => { G.stillBurning = false; spawnParticles('ash', 128, 100, 60); } },
    { id: 'soul', dur: 4.2, cam: [0, -10, 1.3], caption: 'Something is leaving.',
      enter: () => { SFX.ascend(); } },
    { id: 'tunnel', dur: 2.8, cam: [0, 0, 1.0], snap: true, caption: '' },
    { id: 'arrive', dur: 3.4, cam: [0, 0, 1.0], caption: 'Somewhere very bright.' }
  ], () => { goHeaven(); reachEnding('arson'); });
}

/* ---- the opening: the wood, then the tree, then he notices you ---- */
function startIntroCine() {
  G.mood = 'sleepy'; G.blinkTimer = 99; G.blink = 1;
  playCine('intro', [
    { id: 'wide', dur: 3.4, cam: [-18, -4, 1.28], snap: true, caption: 'There is a tree in this park.' },
    { id: 'near', dur: 3.2, cam: [0, 8, 1.35], caption: 'Nobody remembers who planted it.' },
    { id: 'wake', dur: 3.6, cam: [0, 18, 1.75], caption: '',
      enter: () => { G.mood = 'sleepy'; },
      tick: (p) => {
        G.blink = p < 0.45 ? 1 : 0;
        if (p > 0.45 && G.mood === 'sleepy') { G.mood = 'shock'; SFX.pickup(); }
        if (p > 0.7) G.mood = 'chill';
      } },
    { id: 'settle', dur: 2.4, cam: [0, 5, 1.09], caption: 'Oh. You are new.' }
  ], () => {
    G.blinkTimer = 2;
    G.scene = 'game';
    refreshHUD(); refreshActions();
    say('THE WISE OAK TREE', "Hello. I am an oak tree. I am four hundred years old. Click me and I will say things. That is the entire product.", 'happy');
  });
}

/* ---- the squirrel hands over the lighter ---- */
function startLighterCine() {
  playCine('lighter', [
    { id: 'deal', dur: 3.2, cam: [(G.squirrel.x - 128) * 0.5, 40, 1.9], caption: '"For nest purposes."',
      enter: () => { G.squirrel.face = 1; G.squirrel.holding = 'lighter'; SFX.trade(); } },
    { id: 'oblivious', dur: 3.4, cam: [0, 16, 1.6], caption: 'He does not know you have it.',
      enter: () => { G.squirrel.holding = null; G.mood = 'happy'; } }
  ], () => {
    G.scene = 'game'; refreshHUD(); refreshActions();
    say('THE WISE OAK TREE', "You have gone very quiet. Everything alright? You have got a face like a man holding something behind his back.", 'think');
  });
}

/* ---- the lighter goes in the pond ---- */
function startMercyCine() {
  playCine('mercy', [
    { id: 'throw', dur: 2.8, cam: [-40, 30, 1.5], caption: '',
      enter: () => { SFX.water(); },
      tick: (p) => { if (p > 0.55 && !G._splashed) { G._splashed = true; spawnParticles('drop', 30, GROUND_Y + 16, 22); SFX.pickup(); } } },
    { id: 'relief', dur: 3.6, cam: [0, 10, 1.4], caption: 'sss.',
      enter: () => { G._splashed = false; G.mood = 'happy'; spawnParticles('heart', 128, 110, 6); } }
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
function update(dt) {
  G.t += dt; G.dt = dt;
  G.sessionTime += dt;
  updateType(dt);
  updateToasts(dt);
  updateParticles(dt);

  saveTimer += dt; if (saveTimer > 5) { saveTimer = 0; persist(); }
  if (G.sessionTime > 600) ACH('idle');
  updateCam(dt);

  if (G.cine) {
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
  updateSeasonPill();
  G.seasonTimer += dt;
  if (G.seasonTimer > G.seasonLen) {
    G.seasonTimer = 0;
    G.seasonIdx = (G.seasonIdx + 1) % 4;
    G.season = SEASON_NAMES[G.seasonIdx];
    save.stats.seasons[G.season] = 1; persist();
    updateSeasonPill();
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

    if (tickle.cool > 0) tickle.cool -= dt;

    // stillness ending
    G.sinceTreeClick += dt;
    if (save.ach.hello && G.sinceTreeClick > 180) { ACH('silence'); reachEnding('stillness'); G.sinceTreeClick = -1e9; }

    // sneezes
    G.sneezeTimer -= dt;
    if (G.sneezeTimer <= 0) triggerSneeze();

    // ambient falling leaves
    const rate = G.season === 'autumn' ? 2.2 : G.season === 'winter' ? 0.3 : 0.5;
    if (Math.random() < dt * rate) dropLeaf(80 + Math.random() * 96, 40 + Math.random() * 40, Math.random() < 0.35);

    // squirrel appears on its own eventually
    if (!G.squirrel.spawned && G.sessionTime > 45) maybeSpawnSquirrel();
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
      s.targetX = 40 + Math.random() * 176;
      if (Math.abs(s.targetX - s.x) > 20) s.moving = true;
    }
    if (G.dead || G.scene === 'burning') { s.targetX = s.x < 128 ? -24 : W + 24; s.moving = true; s.face = 0; }
  }

  // burning
  if (G.scene === 'burning') {
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
  const maxScroll = Math.max(0, SPR.hallWidth(h.order.length) - W);
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
  SPR.drawBackdrop(dc, G);
  if (G.burn > 0 && !o.growing) {
    // firelight swallows the daylight
    dc.globalAlpha = Math.min(0.40, G.burn * 0.45);
    SPR.px(dc, 0, 0, W, H, '#5a1f0c');
    dc.globalAlpha = 1;
  }
  SPR.drawGround(dc, G);
  SPR.drawPond(dc, G);
  SPR.drawFireGlow(dc, G);

  // everything solid in the foreground shares one dark contour
  const L = SPR.layerBegin();
  SPR.drawGroundItems(L, G);
  if (o.fall) {
    SPR.drawStump(L, G);
    // the trunk goes over, hinged where it snapped
    L.save();
    L.translate(128, GROUND_Y + 4);
    L.rotate(o.fall * 1.15);
    L.translate(-128, -(GROUND_Y + 4));
    SPR.drawTree(L, G);
    L.restore();
  } else if (o.growing !== undefined) {
    SPR.drawGrowingTree(L, G, o.growing);
  } else {
    SPR.drawTree(L, G);
    SPR.drawWatchers(L, G);
  }
  SPR.drawSquirrel(L, G);
  SPR.layerEnd(dc, '#1a0f08');

  SPR.drawFireOnTree(dc, G);
  SPR.drawParticles(dc, G);
  SPR.drawForeground(dc, G);
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

function drawCineFrame() {
  const st = cineStage(), p = cineProgress();
  const name = G.cine.name;

  if (name === 'intro' || name === 'lighter' || name === 'mercy' || name === 'grove') {
    drawWorld();
    if (name === 'intro' && st === 'wide') {
      dc.globalAlpha = Math.max(0, 1 - p * 2.2);
      SPR.px(dc, 0, 0, W, H, '#000000');
      dc.globalAlpha = 1;
    }
    if (name === 'intro' && st === 'wake' && p > 0.45 && p < 0.75) {
      SPR.drawRays(dc, G, (p - 0.45) * 2, 128, 106);
    }
    if (name === 'mercy' && st === 'throw' && p < 0.6) {
      // the lighter turning over in the air on its way to the water
      const k = p / 0.6;
      const lx = 128 - k * 96, ly = 120 - Math.sin(k * Math.PI) * 46 + k * 44;
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
      SPR.drawRays(dc, G, Math.min(1, p * 1.4) * 0.7, 128, y);
      SPR.drawSoul(dc, G, 128, y, 1 + p);
      SPR.drawParticles(dc, G);
      if (p > 0.8) { dc.globalAlpha = (p - 0.8) * 5; SPR.px(dc, 0, 0, W, H, '#ffffff'); dc.globalAlpha = 1; }
    } else if (st === 'tunnel') {
      SPR.px(dc, 0, 0, W, H, '#dceeff');
      SPR.drawCloudTunnel(dc, G, p, 1);
      SPR.drawSoul(dc, G, 128, 110 - p * 30, 1.6);
      SPR.drawRays(dc, G, 0.5, 128, 96);
      dc.globalAlpha = Math.max(0, p - 0.7) * 3.3; SPR.px(dc, 0, 0, W, H, '#ffffff'); dc.globalAlpha = 1;
    } else if (st === 'arrive') {
      SPR.drawHeavenBackdrop(dc, G);
      const drop = (1 - Math.pow(1 - p, 3));
      SPR.drawGhostTree(dc, G, 128, -60 + drop * 164 + Math.sin(G.t * 1.1) * 3, Math.min(1, p * 2));
      SPR.drawRays(dc, G, 0.8 * (1 - p * 0.6), 128, 70);
      dc.globalAlpha = Math.max(0, 1 - p * 2.2); SPR.px(dc, 0, 0, W, H, '#ffffff'); dc.globalAlpha = 1;
    }
  } else if (name === 'rebirth') {
    if (st === 'leave') {
      SPR.drawHeaven(dc, G);
      SPR.drawSoul(dc, G, 128, 120 + p * 60, 1.2);
      dc.globalAlpha = Math.max(0, p - 0.75) * 4; SPR.px(dc, 0, 0, W, H, '#ffffff'); dc.globalAlpha = 1;
    } else if (st === 'dive') {
      SPR.px(dc, 0, 0, W, H, '#e2f0ff');
      SPR.drawCloudTunnel(dc, G, p, -1);
      const y = 40 + p * 70;
      SPR.drawSoul(dc, G, 128, y, 1.4);
      for (let i = 0; i < 10; i++) {
        dc.globalAlpha = 0.5 * (1 - i / 10);
        SPR.pcircle(ctx, 128 + Math.sin(G.t * 4 + i) * 3, y - i * 6, 3 - i * 0.25, '#ffffff');
        dc.globalAlpha = 1;
      }
    } else if (st === 'land') {
      SPR.drawBackdrop(dc, G);
      SPR.drawGround(dc, G);
      SPR.drawForeground(dc, G);
      const y = -20 + p * (GROUND_Y + 10);
      SPR.drawSoul(dc, G, 128, y, 1.4 * (1 - p * 0.4));
      SPR.drawFrameFoliage(dc, G);
      if (p > 0.9) { dc.globalAlpha = (p - 0.9) * 10; SPR.px(dc, 0, 0, W, H, '#ffffff'); dc.globalAlpha = 1; }
    } else if (st === 'grow') {
      G.timeOfDay = 0.02 + p * 0.16;
      drawWorld({ growing: Math.pow(p, 0.9) });
    }
  }
}

function render() {
  dc.setTransform(1, 0, 0, 1, 0, 0);
  dc.clearRect(0, 0, W, H);

  if (G.cine) drawCineFrame();
  else if (G.scene === 'hall') SPR.drawHall(dc, G);
  else if (G.scene === 'heaven') SPR.drawHeaven(dc, G);
  else drawWorld();

  // blit through the camera
  const cam = G.cam;
  const sh = G.cine && G.shake > 0 ? G.shake : 0;
  const sw = W / cam.z, sHt = H / cam.z;
  // the buffer is the whole world; a pan that runs off it would show bare canvas
  const clamp = (v, hi) => Math.max(0, Math.min(hi, v));
  const sx = clamp((W - sw) / 2 + cam.x + (Math.random() * 2 - 1) * sh, W - sw);
  const sy = clamp((H - sHt) / 2 + cam.y + (Math.random() * 2 - 1) * sh, H - sHt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(buf, sx, sy, sw, sHt, 0, 0, W, H);

  if (G.flash > 0) { ctx.globalAlpha = Math.min(1, G.flash); SPR.px(ctx, 0, 0, W, H, '#ffffff'); ctx.globalAlpha = 1; }
  SPR.drawLetterbox(ctx, G.letterbox);
}

/* ---------------------------------------------------------------------
   INPUT
   --------------------------------------------------------------------- */
let hover = { kind: null, i: -1 };

function toLogical(ev) {
  const r = cv.getBoundingClientRect();
  const cx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
  const cy = (ev.touches ? ev.touches[0].clientY : ev.clientY) - r.top;
  return { x: cx / r.width * W, y: cy / r.height * H };
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
  if (G.scene === 'heaven') {
    if (x > 92 && x < 164 && y > 40 && y < 130) return { kind: 'ghost', i: -1 };
    return { kind: 'sky', i: -1 };
  }
  if (G.scene !== 'game') return { kind: null, i: -1 };
  for (let i = G.groundLeaves.length - 1; i >= 0; i--) {
    const l = G.groundLeaves[i];
    if (x > l.x - 3 && x < l.x + 10 && y > l.y - 3 && y < l.y + 9) return { kind: 'leaf', i };
  }
  const s = G.squirrel;
  if (s.active && Math.abs(x - s.x) < 11 && y > s.y - 16 && y < s.y + 4) return { kind: 'squirrel', i: -1 };
  if (!G.dead) {
    // he is not one big button: every part of him answers differently
    const fx = x - 128, fy = y;
    if (Math.abs(fx) < 34 && fy > 84 && fy < 152) {
      if (fy > 96 && fy < 112 && Math.abs(Math.abs(fx) - 13) < 9) return { kind: 'part', part: 'eye', i: -1 };
      if (fy >= 100 && fy < 128 && Math.abs(fx) < 9) return { kind: 'part', part: 'nose', i: -1 };
      if (fy >= 128 && fy < 145 && Math.abs(fx) < 20) return { kind: 'part', part: 'mouth', i: -1 };
      if (fy >= 145 && Math.abs(fx) < 26) return { kind: 'part', part: 'beard', i: -1 };
    }
    if (y > GROUND_Y - 6 && y < GROUND_Y + 12 && Math.abs(x - 128) > 24 && Math.abs(x - 128) < 56)
      return { kind: 'part', part: 'root', i: -1 };
    // trunk
    if (y > 88 && y < GROUND_Y + 6 && Math.abs(x - 128) < SPR.trunkHalfWidth(y) + 4) return { kind: 'tree', i: -1 };
    // canopy
    const dx = (x - 128) / 68, dy = (y - 52) / 40;
    if (dx * dx + dy * dy < 1) return { kind: 'part', part: 'canopy', i: -1 };
  }
  // the sky above: sun by day, moon by night
  const ang = Math.PI * (G.timeOfDay * 2 % 2);
  const sx = 20 + (1 - Math.cos(ang)) * 108, sy = 118 - Math.sin(ang) * 92;
  const night = SPR.isNight(G.timeOfDay);
  const bx = night ? W - sx : sx;
  if (Math.hypot(x - bx, y - sy) < 14) return { kind: night ? 'moon' : 'sun', i: -1 };
  return { kind: null, i: -1 };
}

/* ------------------ touching him in specific places ------------------ */
const partAch = { eye: 'eyepoke', nose: 'nosepoke', mouth: 'mouthbite' };
const partCount = {};

function touchPart(part) {
  if (G.dead || G.scene !== 'game') return;
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
    spawnParticles('star', 128, 40, 12);
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
  G.look.x = Math.max(-1.4, Math.min(1.4, (p.x - 128) / 60));
  G.look.y = Math.max(-1.2, Math.min(1.2, (p.y - 116) / 50));

  // hold the trunk and waggle the mouse: he gets shaken
  if (grab && G.scene === 'game' && !G.dead) {
    grab.moved += Math.abs(p.x - grab.lastX);
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
  if (G.scene === 'game' && !G.dead && tickle.cool <= 0) {
    const onHim = Math.abs(p.x - 128) < 40 && p.y > 88 && p.y < GROUND_Y;
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
      spawnParticles('heart', 128, 110, 5);
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

function onPress(ev) {
  SFX.kick();
  if (G.cine) { skipStage(); return; }
  const p = toLogical(ev);

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
  if (h.kind === 'squirrel') { clickSquirrel(); return; }
  if (h.kind === 'part') { grab = { x: p.x, lastX: p.x, moved: 0, t: 0 }; touchPart(h.part); return; }
  if (h.kind === 'moon' || h.kind === 'sun') { touchSky(h.kind); return; }
  if (h.kind === 'tree') {
    grab = { x: p.x, lastX: p.x, moved: 0, t: 0 };
    talkToTree();
    return;
  }
  skipType();
}
cv.addEventListener('mousedown', onPress);
cv.addEventListener('touchstart', ev => { ev.preventDefault(); onPress(ev); }, { passive: false });

/* ---------------------------------------------------------------------
   CHROME BUTTONS
   --------------------------------------------------------------------- */
$('btnTrophies').onclick = () => {
  SFX.click();
  if (G.cine || G.scene === 'burning') return;
  if (G.scene === 'hall') { closeHall(); return; }
  openHall(G.scene === 'heaven' ? 'heaven' : 'game');
};
$('btnEndings').onclick = () => { SFX.click(); openEndings(); };
$('btnShop').onclick = () => {
  SFX.click();
  if (!G.squirrel.active) { say('THE WISE OAK TREE', "The squirrel is not here. He is 'running errands'. He is burying things.", 'smug'); return; }
  openShop();
};
$('btnMute').onclick = () => {
  save.muted = !save.muted; persist();
  SFX.setMuted(save.muted);
  $('btnMute').textContent = save.muted ? 'Sound: off' : 'Sound: on';
  if (save.muted) { ACH('mute'); say('THE WISE OAK TREE', "You muted me. I am still talking. I will ALWAYS still be talking.", 'smug'); }
};
$('btnReset').onclick = () => {
  SFX.click();
  openModal('ERASE EVERYTHING?',
    "<p>Every trophy. Every ending. Every line you ever heard him say.</p><p class='small'>He will not remember you.</p>",
    [['Cancel', closeModal], ['Erase it all', () => {
      erased = true;
      try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
      location.reload();
    }, 'bad']]);
};
$('modalclose').onclick = () => { SFX.click(); closeModal(); };
$('shopclose').onclick = (e) => { e.stopPropagation(); SFX.click(); closeShop(); };
elModal.addEventListener('mousedown', e => { if (e.target === elModal && !G.flags.confirming) closeModal(); });

document.addEventListener('keydown', e => {
  if (G.scene === 'hall') {
    if (e.key === 'ArrowRight') G.hall.target += 60;
    if (e.key === 'ArrowLeft') G.hall.target -= 60;
    if (e.key === 'Escape') closeHall();
    return;
  }
  if (e.key === 'Escape') { closeModal(); closeShop(); }
  if (e.key === ' ') { e.preventDefault(); if (!skipType() && G.scene === 'game') talkToTree(); }
  if (e.key.toLowerCase() === 't') openTrophies();
  if (e.key.toLowerCase() === 'e') openEndings();
});

/* ---------------------------------------------------------------------
   BOOT
   --------------------------------------------------------------------- */
SFX.setMuted(save.muted);
$('btnMute').textContent = save.muted ? 'Sound: off' : 'Sound: on';
if (hadSave) ACH('refresh');
checkMetaAchievements();
checkCompletionist();
buildHall();
refreshHUD();
updateSeasonPill();
persist();

if (hadSave) {
  say('THE WISE OAK TREE',
      "You came back. I did not think you would. I have been standing here in the exact same spot, which is my only move.",
      'happy');
} else {
  startIntroCine();
}

/* Debug hooks, only when the page is opened with ?debug — used by the
   automated smoke test to reach the late game without playing for an hour. */
if (/[?&]debug/.test(location.search)) {
  window.OAK = { G, save, ACH, reachEnding, startBurning, goHeaven, reincarnate,
                 refreshHUD, dropLeaf, triggerSneeze, maybeSpawnSquirrel, persist };
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener('beforeunload', persist);

/* resize: keep integer pixel scaling */
function fit() {
  const pad = 24;
  const availW = window.innerWidth - pad, availH = window.innerHeight - 150;
  let scale = Math.max(1, Math.floor(Math.min(availW / W, availH / H)));
  if (scale * W > availW || scale * H > availH) scale = Math.max(1, scale - 1);
  const stage = $('stage');
  stage.style.width = (W * scale) + 'px';
  cv.style.width = (W * scale) + 'px';
  cv.style.height = (H * scale) + 'px';
}
window.addEventListener('resize', fit);
fit();

})();
