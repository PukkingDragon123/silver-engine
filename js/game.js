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
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }

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
  pendingEnding: null
};

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
  if (G.scene === 'heaven') { actionBtn('Reincarnate \u21bb', 'good', reincarnate); return; }
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

function talkToTree() {
  if (G.dead || G.scene !== 'game') return;
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
  checkWorldProgress();
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
  if (save.stats.plants >= 5) { ACH('plant5'); reachEnding('grove'); }
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
  SFX.water();
  spawnParticles('drop', 30, GROUND_Y + 6, 14);
  ACH('refuse');
  say('THE WISE OAK TREE', "You threw it in the pond. It went 'sss'. That is the best sound I have ever heard and I have heard four hundred springs.", 'happy');
  reachEnding('mercy');
  refreshHUD();
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
    say('SQUIRREL', "for NEST purposes. that's what you said. that's what i heard. good luck buddy. i'm gonna go be somewhere else.", null);
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
  G.flash = 1.6;
  SFX.ascend();
  ACH('heaven');
  elDialog.classList.add('hidden');
  refreshActions();
  setTimeout(() => {
    say('THE WISE OAK TREE (DECEASED)', DATA.heavenTreeLines[0], null, 'heaven');
  }, 2200);
  elHint.textContent = 'click the ghost tree · click the clouds · then reincarnate';
  elHint.classList.remove('hidden');
}

function reincarnate() {
  save.stats.rebirths++; persist();
  ACH('reborn');
  if (save.stats.rebirths >= 5) ACH('reborn5');
  // reset the world, keep everything earned
  G.scene = 'game'; G.burn = 0; G.dead = false; G.burnStage = 0; G.deathTimer = 0;
  G.particles = []; G.groundLeaves = []; G.saplings = [];
  G.inv = { leaves: 0, items: {} };
  G.flags = { hatOn: false, lighterGone: false, confirming: false, newsRead: false };
  G.squirrel = { active: false, x: -20, y: GROUND_Y + 6, dir: 1, moving: false, targetX: 190, face: 0, holding: null, spawned: false, clicks: 0, clickT: 0 };
  G.sneezeTimer = 12 + Math.random() * 15;
  G.mood = 'idle'; G.flash = 1.2; G.sinceTreeClick = 0;
  elHint.classList.add('hidden');
  refreshHUD();
  say('THE WISE OAK TREE', "...Oh. It is you. I do not remember anything and yet I am inexplicably fond of you. Weird. Anyway: I am a tree.", 'happy');
}

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
    if (G.burn >= 1) {
      G.dead = true; G.scene = 'ash'; G.deathTimer = 0;
      SFX.boom(); G.shake = 6;
      elDialog.classList.add('hidden');
      refreshActions();
    }
  }

  if (G.scene === 'ash') {
    G.deathTimer += dt;
    if (G.deathTimer > 4 && !G.pendingEnding && !save.endings.arson) {
      G.pendingEnding = goHeaven;
      reachEnding('arson');
    } else if (G.deathTimer > 4 && save.endings.arson && !G.ascended) {
      G.ascended = true; goHeaven();
    }
  }
}

/* ---------------------------------------------------------------------
   RENDER
   --------------------------------------------------------------------- */
function drawPond(c) {
  const night = SPR.isNight(G.timeOfDay);
  const base = night ? '#20406a' : '#3f8fd0';
  const hi = night ? '#2c5488' : '#6fb6e8';
  for (let y = -6; y <= 6; y++) {
    const hw = Math.round(Math.sqrt(Math.max(0, 1 - (y / 6) ** 2)) * 20);
    px(c, 28 - hw, GROUND_Y + 14 + y, hw * 2, 1, base);
  }
  for (let i = 0; i < 5; i++) {
    const w = 4 + ((Math.sin(G.t * 1.4 + i) * 0.5 + 0.5) * 8 | 0);
    px(c, 20 + i * 4 - w / 2, GROUND_Y + 10 + i * 2, w, 1, hi);
  }
  if (G.flags.lighterGone) px(c, 27, GROUND_Y + 15, 3, 2, '#7a2a2a');
}

function render() {
  ctx.clearRect(0, 0, W, H);
  if (G.scene === 'heaven') {
    SPR.drawHeaven(ctx, G);
  } else if (G.scene === 'ash') {
    SPR.drawAshScene(ctx, G);
    SPR.drawParticles(ctx, G);
  } else {
    SPR.drawSky(ctx, G);
    SPR.drawClouds(ctx, G);
    SPR.drawHills(ctx, G);
    SPR.drawGround(ctx, G);
    drawPond(ctx);
    SPR.drawGroundItems(ctx, G);
    SPR.drawTree(ctx, G);
    SPR.drawFireOnTree(ctx, G);
    SPR.drawSquirrel(ctx, G);
    SPR.drawParticles(ctx, G);
    SPR.drawOverlay(ctx, G);
    // highlight whatever the cursor is over
    if (hover.kind === 'leaf') {
      const l = G.groundLeaves[hover.i];
      if (l) { ctx.globalAlpha = 0.5 + Math.sin(G.t * 8) * 0.2; px(ctx, l.x - 1, l.y - 1, 9, 8, '#ffffff'); ctx.globalAlpha = 1; SPR.drawLeafSprite(ctx, l.x, l.y, l.col, l.col2); }
    }
  }
  if (G.flash > 0) { ctx.globalAlpha = Math.min(1, G.flash); px(ctx, 0, 0, W, H, '#ffffff'); ctx.globalAlpha = 1; }
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

function hitTest(x, y) {
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
    // trunk / face
    if (y > 92 && y < GROUND_Y + 4 && Math.abs(x - 128) < SPR.trunkHalfWidth(y) + 4) return { kind: 'tree', i: -1 };
    // canopy ellipse
    const dx = (x - 128) / 68, dy = (y - 62) / 40;
    if (dx * dx + dy * dy < 1) return { kind: 'tree', i: -1 };
  }
  return { kind: null, i: -1 };
}

cv.addEventListener('mousemove', ev => {
  const p = toLogical(ev);
  G.look.x = Math.max(-1.4, Math.min(1.4, (p.x - 128) / 60));
  G.look.y = Math.max(-1.2, Math.min(1.2, (p.y - 116) / 50));
  hover = hitTest(p.x, p.y);
  cv.style.cursor = hover.kind && hover.kind !== 'sky' ? 'pointer' : 'default';
});

function onPress(ev) {
  SFX.kick();
  const p = toLogical(ev);
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
  if (h.kind === 'tree') { talkToTree(); return; }
  skipType();
}
cv.addEventListener('mousedown', onPress);
cv.addEventListener('touchstart', ev => { ev.preventDefault(); onPress(ev); }, { passive: false });

/* ---------------------------------------------------------------------
   CHROME BUTTONS
   --------------------------------------------------------------------- */
$('btnTrophies').onclick = () => { SFX.click(); openTrophies(); };
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
    [['Cancel', closeModal], ['Erase it all', () => { localStorage.removeItem(SAVE_KEY); location.reload(); }, 'bad']]);
};
$('modalclose').onclick = () => { SFX.click(); closeModal(); };
$('shopclose').onclick = (e) => { e.stopPropagation(); SFX.click(); closeShop(); };
elModal.addEventListener('mousedown', e => { if (e.target === elModal && !G.flags.confirming) closeModal(); });

document.addEventListener('keydown', e => {
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
refreshHUD();
updateSeasonPill();
persist();

say('THE WISE OAK TREE',
  hadSave
    ? "You came back. I did not think you would. I have been standing here in the exact same spot, which is my only move."
    : "Oh! A person. Hello. I am an oak tree. I am four hundred years old. Click me and I will say things. That is the entire product.",
  'happy');

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
