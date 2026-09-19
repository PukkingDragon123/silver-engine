/* =========================================================================
   STATE — the save file, the economy, the ladder.

   Everything persistent lives in S. Resource buildings keep producing while
   the tab is shut, which is the quiet idle half of the game; the loud half
   is the trophy ladder, where rivals drift up and down while you are away
   so the leaderboard is never the same twice.
   ========================================================================= */
const SAVE_KEY = 'aetheria.save.v1';

/* ---- building catalogue -------------------------------------------------- */
const BUILDINGS = {
  house:   { name:'COTTAGE',  desc:'Home. Sleep here to bank your streak.', icon:'i_heart',
             cost:{}, res:null, rate:0, cap:0, maxLvl:5, up:{ coins:120, wood:40 } },
  sawmill: { name:'SAWMILL',  desc:'Turns the grove into planks.', icon:'i_wood',
             cost:{ coins:60 }, res:'wood', rate:7, cap:90, maxLvl:6, up:{ coins:140, wood:50 } },
  quarry:  { name:'QUARRY',   desc:'Chews rock into blocks.', icon:'i_stone',
             cost:{ coins:110, wood:30 }, res:'stone', rate:5, cap:70, maxLvl:6, up:{ coins:180, stone:40 } },
  well:    { name:'MANA WELL',desc:'Draws essence out of the cloud.', icon:'i_essence',
             cost:{ coins:200, stone:40 }, res:'essence', rate:3, cap:45, maxLvl:6, up:{ coins:260, essence:25 } },
  forge:   { name:'FORGE',    desc:'Hammers resources into armour.', icon:'i_sword',
             cost:{ coins:250, wood:60, stone:60 }, res:null, rate:0, cap:0, maxLvl:5, up:{ coins:320, stone:80 } },
  nest:    { name:'NESTRY',   desc:'Warms eggs between battles.', icon:'i_egg',
             cost:{ coins:180, wood:80 }, res:null, rate:0, cap:0, maxLvl:4, up:{ coins:240, wood:100 } },
  library: { name:'LIBRARY',  desc:'Writes your custom lessons. Trickles XP.', icon:'i_book',
             cost:{ coins:150, wood:50 }, res:'xp', rate:2, cap:30, maxLvl:5, up:{ coins:220, essence:20 } },
  gym:     { name:'TRAINING', desc:'+12 max HP per level.', icon:'i_shield',
             cost:{ coins:220, wood:70, stone:40 }, res:null, rate:0, cap:0, maxLvl:5, up:{ coins:280, stone:70 } }
};
/* where a building can stand on the home island */
const PLOTS = [
  { x: 86, y:334 }, { x:180, y:324 }, { x:274, y:334 },
  { x: 54, y:370 }, { x:306, y:370 },
  { x:112, y:410 }, { x:250, y:410 }, { x:180, y:428 }
];

/* ---- gear ---------------------------------------------------------------- */
const GEAR = {
  weapon: { name:'BLADE',  icon:'i_sword',  stat:'atk', per:4, cost:l => ({ wood:20+l*18, stone:10+l*14, coins:40+l*40 }) },
  armour: { name:'PLATE',  icon:'i_shield', stat:'def', per:5, cost:l => ({ stone:24+l*20, wood:10+l*10, coins:50+l*45 }) },
  charm:  { name:'CHARM',  icon:'i_essence',stat:'hp',  per:9, cost:l => ({ essence:12+l*12, coins:60+l*50 }) }
};
const GEAR_NAMES = ['PLAIN','COPPER','IRON','SILVER','GOLD','AETHER','STARFORGED'];

/* ---- ranks --------------------------------------------------------------- */
const RANKS = [
  { at:0,    name:'SPROUT',   col:'#8fd86a' }, { at:100,  name:'PEBBLE',   col:'#b9c6dd' },
  { at:220,  name:'BRONZE',   col:'#c08a4a' }, { at:400,  name:'SILVER',   col:'#d9e4ff' },
  { at:620,  name:'GOLD',     col:'#ffd23f' }, { at:900,  name:'PLATINUM', col:'#46ecd5' },
  { at:1250, name:'DIAMOND',  col:'#49a7ff' }, { at:1700, name:'MYTHIC',   col:'#a35cff' },
  { at:2300, name:'LEGEND',   col:'#ff5fb8' }
];
function rankOf(tr) {
  let r = RANKS[0], next = null;
  for (let i=0;i<RANKS.length;i++) if (tr >= RANKS[i].at) { r = RANKS[i]; next = RANKS[i+1] || null; }
  const span = next ? next.at - r.at : 1;
  return { ...r, next, prog: next ? clamp((tr-r.at)/span,0,1) : 1, idx:RANKS.indexOf(r) };
}

const RIVAL_NAMES = ['NOVA','PIXEL','KAI','JUNIPER','ZED','MIRA','OSCAR','LUMI','BRAM','SAGE','TOFU','ECHO',
                     'WREN','ATLAS','CLOVER','RIO','VESPER','QUILL','ONYX','MOSS','SUNNY','BYTE','FERN','ROOK'];

/* ------------------------------------------------------------------------- */
const S = (() => {
  const fresh = () => ({
    v:1, created:Date.now(), name:'SCHOLAR', cfg:AV.defaults(), made:false,
    lvl:1, xp:0, trophies:0, best:0,
    coins:120, gems:5, wood:30, stone:10, essence:0,
    gear:{ weapon:0, armour:0, charm:0 },
    progress:{}, buildings:[{ type:'house', plot:1, lvl:1, stock:0, last:Date.now() }],
    pets:[], activePet:null, eggs:[],
    decks:[], dex:{}, relics:{},
    stats:{ answered:0, correct:0, best:0, battles:0, wins:0, chests:0, chopped:0 },
    dayStreak:1, lastDay:today(), sound:true, seenIntro:false,
    chests:[], rivals:null, lastSeen:Date.now()
  });

  let d = store.get(SAVE_KEY, null);
  if (!d || d.v !== 1) d = fresh();
  else d = Object.assign(fresh(), d, { cfg: Object.assign(AV.defaults(), d.cfg||{}) });

  const api = {
    get d() { return d; },
    save() { d.lastSeen = Date.now(); store.set(SAVE_KEY, d); },
    reset() { d = fresh(); api.save(); },

    /* --- economy -------------------------------------------------------- */
    can(cost) { for (const k in cost) if ((d[k]||0) < cost[k]) return false; return true; },
    pay(cost) { if (!api.can(cost)) return false; for (const k in cost) d[k] -= cost[k]; api.save(); return true; },
    give(res, n) {
      if (res === 'xp') return api.addXp(n);
      d[res] = (d[res]||0) + n; api.save();
    },
    costText(cost) { return Object.keys(cost).map(k => cost[k]+' '+k.toUpperCase()).join('  '); },

    /* --- levels --------------------------------------------------------- */
    xpNeed: lvl => 50 + (lvl-1)*38,
    addXp(n) {
      d.xp += n;
      let ups = 0;
      while (d.xp >= api.xpNeed(d.lvl)) { d.xp -= api.xpNeed(d.lvl); d.lvl++; ups++; }
      api.save();
      return ups;
    },
    maxHp() {
      const gym = api.building('gym');
      return 100 + (d.lvl-1)*8 + d.gear.charm*GEAR.charm.per + (gym ? gym.lvl*12 : 0);
    },
    atk() { return 1 + d.gear.weapon*0.14; },
    def() { return d.gear.armour*GEAR.armour.per; },

    /* --- trophies ------------------------------------------------------- */
    addTrophies(n) {
      d.trophies = Math.max(0, d.trophies + n);
      d.best = Math.max(d.best, d.trophies);
      api.save();
      return rankOf(d.trophies);
    },
    rank() { return rankOf(d.trophies); },

    /* --- rivals, the reason the ladder feels alive ---------------------- */
    rivals() {
      if (!d.rivals) {
        d.rivals = shuffle(RIVAL_NAMES).slice(0,11).map((n,i) => ({
          n, t: Math.max(20, Math.round(120 + i*95 + rnd(-60,60))), cfg: AV.randomCfg()
        }));
      }
      const gone = Math.min(8, (Date.now() - (d.lastSeen||Date.now()))/3600000);
      if (gone > 0.02) {
        for (const r of d.rivals) r.t = Math.max(15, Math.round(r.t + rnd(-14,26)*gone));
        d.lastSeen = Date.now();
      }
      const all = d.rivals.concat([{ n:d.name, t:d.trophies, me:true, cfg:d.cfg }]);
      all.sort((a,b) => b.t - a.t);
      return all;
    },

    /* --- progress ------------------------------------------------------- */
    prog(packId) {
      if (!d.progress[packId]) d.progress[packId] = { cleared:0, stars:{} };
      return d.progress[packId];
    },
    unlockedPacks() {
      const out = [];
      for (let i=0;i<CONTENT.PACKS.length;i++) {
        const p = CONTENT.PACKS[i];
        const prev = i === 0 ? null : S.prog(CONTENT.PACKS[i-1].id);
        out.push({ pack:p, open: i === 0 || (prev && prev.cleared >= 4) });
      }
      return out;
    },
    clearNode(packId, idx, stars) {
      const pr = api.prog(packId);
      pr.stars[idx] = Math.max(pr.stars[idx]||0, stars);
      if (idx >= pr.cleared) pr.cleared = idx+1;
      api.save();
    },
    totalStars() {
      let n = 0;
      for (const k in d.progress) for (const i in d.progress[k].stars) n += d.progress[k].stars[i];
      return n;
    },

    /* --- buildings, including what happened while you were away --------- */
    building(type) { return d.buildings.find(b => b.type === type); },
    place(type, plot) {
      const def = BUILDINGS[type];
      if (!def || !api.pay(def.cost)) return false;
      d.buildings.push({ type, plot, lvl:1, stock:0, last:Date.now() });
      api.save(); return true;
    },
    upgradeCost(b) {
      const def = BUILDINGS[b.type], out = {};
      for (const k in def.up) out[k] = Math.round(def.up[k] * Math.pow(1.55, b.lvl-1));
      return out;
    },
    upgrade(b) {
      const def = BUILDINGS[b.type];
      if (b.lvl >= def.maxLvl) return false;
      if (!api.pay(api.upgradeCost(b))) return false;
      b.lvl++; api.save(); return true;
    },
    prodRate(b) { const def = BUILDINGS[b.type]; return def.rate ? def.rate * b.lvl : 0; },
    prodCap(b)  { const def = BUILDINGS[b.type]; return def.cap ? def.cap * b.lvl : 0; },
    tickBuildings() {                     /* call on load and every second */
      const now = Date.now();
      for (const b of d.buildings) {
        const def = BUILDINGS[b.type];
        if (!def.res) { b.last = now; continue; }
        const mins = (now - (b.last||now)) / 60000;
        if (mins <= 0) continue;
        b.stock = Math.min(api.prodCap(b), (b.stock||0) + mins*api.prodRate(b));
        b.last = now;
      }
    },
    collect(b) {
      const def = BUILDINGS[b.type];
      const n = Math.floor(b.stock||0);
      if (!def.res || n < 1) return 0;
      b.stock -= n; api.give(def.res, n); api.save();
      return n;
    },
    plotFree(i) { return !d.buildings.some(b => b.plot === i); },

    /* --- pets ----------------------------------------------------------- */
    PET_TYPES: [
      { id:'drake',    name:'DRAKE',   el:'nature', dmg:7,  spr:'pet_drake' },
      { id:'owlet',    name:'OWLET',   el:'arcane', dmg:6,  spr:'pet_owlet' },
      { id:'slimepup', name:'PUDDLE',  el:'water',  dmg:8,  spr:'pet_slimepup' },
      { id:'sparkfox', name:'SPARKFOX',el:'storm',  dmg:9,  spr:'pet_sparkfox' }
    ],
    addEgg(type) {
      if (d.eggs.length >= 3) return false;
      const nest = api.building('nest');
      d.eggs.push({ type, heat:0, need: Math.max(6, 14 - (nest ? nest.lvl*2 : 0)) });
      api.save(); return true;
    },
    hatch(egg) {
      const t = api.PET_TYPES.find(p => p.id === egg.type) || api.PET_TYPES[0];
      const pet = { type:t.id, name:t.name, lvl:1, xp:0 };
      d.pets.push(pet);
      d.eggs.splice(d.eggs.indexOf(egg),1);
      if (!d.activePet) d.activePet = d.pets.length-1;
      api.save();
      return pet;
    },
    pet() { return d.activePet != null ? d.pets[d.activePet] : null; },
    petDef(p) { return p ? api.PET_TYPES.find(t => t.id === p.type) : null; },

    /* --- the flashcard dex ---------------------------------------------- */
    sawCard(bank, q, a) {
      const key = bank + '|' + q;
      const e = d.dex[key] || { q, a, bank, seen:0, right:0 };
      e.seen++; d.dex[key] = e;
      return e;
    },
    gotCard(bank, q, right) {
      const e = d.dex[bank + '|' + q];
      if (e && right) e.right++;
    },
    dexList(bank) {
      return Object.keys(d.dex).map(k => d.dex[k]).filter(e => !bank || e.bank === bank);
    },

    /* --- daily streak --------------------------------------------------- */
    checkDay() {
      const t = today();
      if (d.lastDay === t) return 0;
      const y = new Date(Date.now()-86400000).toISOString().slice(0,10);
      d.dayStreak = d.lastDay === y ? d.dayStreak+1 : 1;
      d.lastDay = t;
      const reward = 40 + d.dayStreak*10;
      d.coins += reward; d.gems += 1;
      api.save();
      return reward;
    },

    /* --- chests --------------------------------------------------------- */
    pushChest(rarity, packId) { d.chests.push({ rarity, packId, at:Date.now() }); api.save(); },
    rollRarity(bonus) {
      const r = Math.random() + (bonus||0);
      return r > .965 ? 'legendary' : r > .86 ? 'epic' : r > .6 ? 'rare' : 'common';
    }
  };

  api.tickBuildings();
  return api;
})();

/* the daily goal — the thing that actually gets you to open the app */
S.DAILY_GOAL = 20;
S.daily = function() {
  const d = S.d;
  if (!d.dailyQ || d.dailyQ.day !== today()) d.dailyQ = { day:today(), n:0, claimed:false };
  return d.dailyQ;
};
S.dailyTick = function(n) { const g = S.daily(); g.n += (n||1); S.save(); return g; };
S.claimDaily = function() {
  const g = S.daily();
  if (g.claimed || g.n < S.DAILY_GOAL) return 0;
  g.claimed = true;
  const reward = 80 + S.d.dayStreak*15;
  S.d.coins += reward; S.d.gems += 2;
  S.pushChest(S.rollRarity(.12), null);
  S.save();
  return reward;
};
