/* =========================================================================
   BASE + LADDER — the two screens hanging off the bottom bar.

   BASE is the Clash-style management view: everything you own, everything
   you could own, and a crafting queue that keeps running with the tab shut.
   LADDER is the competitive half: a live board of rivals and a duel button.
   ========================================================================= */

/* --- consumables, crafted on a timer ------------------------------------- */
const ITEMS = {
  elixir:    { name:'ELIXIR',    desc:'Heals 34 HP mid-battle.',   icon:'i_heart',   col:'#3fe07a', mins:3,  cost:{ essence:10, coins:30 } },
  bomb:      { name:'RUNE BOMB', desc:'32 free damage, no question.', icon:'i_flame', col:'#ff9330', mins:4,  cost:{ wood:30, stone:20 } },
  hourglass: { name:'HOURGLASS', desc:'+8 seconds on one question.', icon:'i_clock', col:'#46ecd5', mins:2,  cost:{ wood:25, coins:20 } },
  lens:      { name:'LENS',      desc:'Burns away two wrong answers.', icon:'i_book', col:'#49a7ff', mins:5,  cost:{ essence:14, stone:20 } }
};
S.items = function() { if (!S.d.items) S.d.items = {}; return S.d.items; };
S.queue = function() { if (!S.d.queue) S.d.queue = []; return S.d.queue; };
S.craft = function(key) {
  const def = ITEMS[key];
  if (!def || S.queue().length >= 4 || !S.pay(def.cost)) return false;
  S.queue().push({ key, done: Date.now() + def.mins*60000 });
  S.save(); return true;
};
S.collectQueue = function() {
  const q = S.queue(), now = Date.now();
  let got = 0;
  for (let i=q.length-1;i>=0;i--) if (q[i].done <= now) {
    S.items()[q[i].key] = (S.items()[q[i].key]||0) + 1; q.splice(i,1); got++;
  }
  if (got) S.save();
  return got;
};
S.useItem = function(key) {
  const it = S.items();
  if (!it[key]) return false;
  it[key]--; S.save(); return true;
};

/* ========================================================================= */
Game.register('build', (() => {
  let t = 0, tab = 0;
  const TABS = ['BUILDINGS','CRAFT','STORE'];

  return {
    enter() { t = 0; S.tickBuildings(); S.collectQueue(); },
    back() { Game.go('island'); },
    update(dt) { t += dt; if (Math.floor(t*2) !== Math.floor((t-dt)*2)) S.collectQueue(); },

    draw(c) {
      drawSky(c, t*.4, { top:'#2e1b50', mid:'#6a3fa8', bot:'#c07ad8', sun:false, stars:true });
      c.fillStyle = rgba(P.ink,.35); c.fillRect(0,0,VW,VH);
      UI.topBar(c);
      UI.header(c, 32, 'YOUR BASE', 'everything keeps working while you are away', P.gold);
      if (UI.btn(c, 8, 34, 36, 22, '<', { col:'#4a3a70', col2:'#6b56a0' })) Game.go('island');

      for (let i=0;i<TABS.length;i++)
        if (UI.btn(c, 10 + i*114, 72, 110, 24, TABS[i],
                   { col: tab===i?'#6a27c8':'#2e1b50', col2: tab===i?P.purple:'#3f2a68', txt: tab===i?P.white:P.grey })) tab = i;

      if (tab === 0) drawBuildings(c);
      else if (tab === 1) drawCraft(c);
      else drawStore(c);
    }
  };

  function drawBuildings(c) {
    /* collect everything at once — the single most satisfying button */
    let ready = 0;
    for (const b of S.d.buildings) ready += Math.floor(b.stock||0);
    if (UI.btn(c, 10, 102, VW-20, 28, ready > 0 ? 'COLLECT ALL  (' + ready + ')' : 'NOTHING TO COLLECT',
               { col: ready?'#1a7331':'#3a2a5e', col2: ready?'#3fe07a':'#5a4790', disabled:!ready, glow: ready?P.gold:null })) {
      let total = 0;
      for (const b of S.d.buildings) total += S.collect(b);
      SFX.play('coin'); FX.confetti(VW/2, 140, 40);
      UI.toast('COLLECTED ' + total, P.gold, 'i_coin');
    }
    let y = 138;
    for (const b of S.d.buildings) {
      const def = BUILDINGS[b.type];
      panel(c, 10, y, VW-20, 44, '#2e1b50');
      spr(c, def.icon, 16, y+16, { scale:1 });
      txt(c, 34, y+5, def.name + '  LV ' + b.lvl, P.white, 1, P.shadow);
      if (def.res) {
        txt(c, 34, y+17, S.prodRate(b) + ' ' + def.res.toUpperCase() + '/MIN', P.lime, 1);
        bar(c, 34, y+29, 150, 6, (b.stock||0)/Math.max(1,S.prodCap(b)), P.lime, { shine:t });
        txt(c, 190, y+29, Math.floor(b.stock||0) + '/' + S.prodCap(b), P.grey, 1);
      } else txt(c, 34, y+19, def.desc, P.grey, 1);
      const cost = S.upgradeCost(b), maxed = b.lvl >= def.maxLvl, can = !maxed && S.can(cost);
      if (UI.btn(c, VW-78, y+10, 60, 24, maxed ? 'MAX' : 'LV ' + (b.lvl+1),
                 { col: can?'#6a4a10':'#3a2a5e', col2: can?P.gold:'#5a4790', txt: can?P.ink:P.grey,
                   disabled:!can, key:'u'+b.type })) {
        if (S.upgrade(b)) { SFX.play('build'); FX.confetti(VW-50, y+20, 26); UI.toast(def.name + ' LV ' + b.lvl, P.gold, def.icon); }
      }
      if (!maxed) { const ct = S.costText(cost); txt(c, Math.min(VW-80, VW-16-tw(ct,1)), y+36, ct, can ? P.lime : P.red, 1); }
      y += 48;
      if (y > VH-120) break;
    }
    /* what is left to build */
    const left = Object.keys(BUILDINGS).filter(k => !S.building(k));
    if (left.length && y < VH-96) {
      txt(c, 12, y+4, 'NOT BUILT YET', P.gold, 1);
      y += 16;
      for (const k of left) {
        if (y > VH-52) break;
        const def = BUILDINGS[k], free = PLOTS.findIndex((p,i) => S.plotFree(i));
        const can = S.can(def.cost) && free >= 0;
        panel(c, 10, y, VW-20, 28, '#241640');
        spr(c, def.icon, 16, y+8);
        txt(c, 34, y+4, def.name, P.white, 1, P.shadow);
        txt(c, 34, y+16, S.costText(def.cost), can ? P.lime : P.red, 1);
        if (UI.btn(c, VW-76, y+2, 58, 24, 'BUILD',
                   { col: can?'#1a7331':'#3a2a5e', col2: can?'#3fe07a':'#5a4790', disabled:!can, key:'nb'+k })) {
          if (S.place(k, free)) { SFX.play('build'); UI.toast(def.name + ' BUILT', P.gold, def.icon); FX.confetti(VW/2, y, 34); }
        }
        y += 32;
      }
    }
  }

  function drawCraft(c) {
    txt(c, 12, 106, 'IN THE WORKSHOP', P.gold, 1);
    const q = S.queue();
    for (let i=0;i<4;i++) {
      const x = 10 + i*87, job = q[i];
      panel(c, x, 118, 82, 50, job ? '#2e1b50' : '#1b1030');
      if (job) {
        const def = ITEMS[job.key];
        const left = Math.max(0, job.done - Date.now());
        const total = def.mins*60000;
        spr(c, def.icon, x+35, 126, { center:true });
        bar(c, x+6, 146, 70, 6, 1-left/total, def.col, { shine:t });
        ctxt(c, x+41, 156, left > 0 ? Math.ceil(left/1000) + 's' : 'READY', left > 0 ? P.grey : P.lime, 1);
      } else ctxt(c, x+41, 138, 'EMPTY', P.grey, 1);
    }
    let y = 178;
    for (const k in ITEMS) {
      const def = ITEMS[k], have = S.items()[k]||0;
      panel(c, 10, y, VW-20, 42, '#2e1b50');
      spr(c, def.icon, 16, y+15, { scale:1 });
      txt(c, 34, y+4, def.name + (have ? '  x' + have : ''), def.col, 1, P.shadow);
      txt(c, 34, y+16, def.desc, P.grey, 1);
      txt(c, 34, y+28, S.costText(def.cost) + '   ' + def.mins + ' MIN', S.can(def.cost) ? P.lime : P.red, 1);
      const can = S.can(def.cost) && S.queue().length < 4;
      if (UI.btn(c, VW-74, y+9, 56, 24, 'CRAFT',
                 { col: can?'#2358c9':'#3a2a5e', col2: can?P.blue:'#5a4790', disabled:!can, key:'cr'+k })) {
        if (S.craft(k)) { SFX.play('build'); UI.toast(def.name + ' STARTED', def.col, def.icon); }
      }
      y += 46;
    }
    txt(c, 12, y+4, 'carry items into battle from the pouch button', P.grey, 1);
  }

  function drawStore(c) {
    txt(c, 12, 106, 'GEM EXCHANGE', P.gold, 1);
    const deals = [
      { n:'300 COINS',     gem:2, act:() => S.give('coins',300),  icon:'i_coin' },
      { n:'120 WOOD',      gem:2, act:() => S.give('wood',120),   icon:'i_wood' },
      { n:'90 STONE',      gem:2, act:() => S.give('stone',90),   icon:'i_stone' },
      { n:'40 ESSENCE',    gem:3, act:() => S.give('essence',40), icon:'i_essence' },
      { n:'A MYSTERY EGG', gem:5, act:() => S.addEgg(pick(S.PET_TYPES).id), icon:'i_egg' },
      { n:'A RARE CHEST',  gem:6, act:() => S.pushChest(S.rollRarity(.4), null), icon:'i_trophy' }
    ];
    let y = 120;
    for (const d of deals) {
      panel(c, 10, y, VW-20, 36, '#2e1b50');
      spr(c, d.icon, 16, y+12, { scale:1 });
      txt(c, 34, y+13, d.n, P.white, 1, P.shadow);
      const can = S.d.gems >= d.gem;
      if (UI.btn(c, VW-80, y+6, 62, 24, d.gem + ' GEM',
                 { col: can?'#1a9e93':'#3a2a5e', col2: can?P.cyan:'#5a4790', icon:'i_gem', disabled:!can, key:'st'+d.n })) {
        S.d.gems -= d.gem; d.act(); S.save();
        SFX.play('chest'); FX.confetti(VW/2, y, 30); UI.toast('GOT ' + d.n, P.cyan, d.icon);
      }
      y += 40;
    }
    txt(c, 12, y+6, 'gems come from daily goals and boss islands.', P.grey, 1);
    txt(c, 12, y+18, 'nothing here costs real money. there is no shop.', P.grey, 1);
  }
})());

/* ========================================================================= */
Game.register('rank', (() => {
  let t = 0, scroll = 0;
  return {
    enter() { t = 0; scroll = 0; },
    back() { Game.go('island'); },
    update(dt) {
      t += dt;
      if (Input.down && Math.abs(Input.dy) > 4) scroll = clamp(scroll - Input.dy*.06, 0, 120);
      scroll = clamp(scroll + Input.wheel*8, 0, 120);
    },
    draw(c) {
      const rk = S.rank();
      drawSky(c, t*.3, { top:'#1a0a3a', mid:'#4a1a6e', bot:shade(rk.col,-.3), sun:false, stars:true });
      c.fillStyle = rgba(P.ink,.3); c.fillRect(0,0,VW,VH);
      UI.topBar(c);
      if (UI.btn(c, 8, 30, 36, 22, '<', { col:'#4a3a70', col2:'#6b56a0' })) Game.go('island');

      /* --- the badge ---------------------------------------------------- */
      const by = 66 + Math.sin(t*1.6)*3;
      c.globalAlpha = .2 + .1*Math.sin(t*3); pxEllipse(c, VW/2, by+18, 58, 34, rk.col); c.globalAlpha = 1;
      for (let i=0;i<8;i++) {
        const a = t*.6 + i*TAU/8;
        c.globalAlpha = .35;
        c.fillStyle = rk.col;
        c.fillRect(Math.round(VW/2+Math.cos(a)*56), Math.round(by+18+Math.sin(a)*30), 3, 3);
        c.globalAlpha = 1;
      }
      spr(c, 'i_trophy', VW/2, by+14, { center:true, scale:3 });
      ctxt(c, VW/2, by+42, rk.name, rk.col, 3, P.ink);
      ctxt(c, VW/2, by+68, S.d.trophies + ' TROPHIES   BEST ' + S.d.best, P.white, 1, P.ink);
      if (rk.next) {
        bar(c, 60, by+84, VW-120, 8, rk.prog, rk.col, { shine:t });
        ctxt(c, VW/2, by+96, (rk.next.at - S.d.trophies) + ' TO ' + rk.next.name, P.grey, 1);
      } else ctxt(c, VW/2, by+88, 'TOP OF THE SKY', P.gold, 1);

      /* --- duel ---------------------------------------------------------- */
      if (UI.btn(c, 20, 188, VW-40, 32, 'DUEL A RIVAL', { col:'#8a2a3a', col2:P.red, glow:P.gold, scale:1 })) {
        const board = S.rivals().filter(r => !r.me);
        const close = board.reduce((a,b) => Math.abs(b.t-S.d.trophies) < Math.abs(a.t-S.d.trophies) ? b : a, board[0]);
        const packs = S.unlockedPacks().filter(u => u.open);
        Game.go('battle', { mode:'duel', rival:close, packId: pick(packs).pack.id });
      }
      ctxt(c, VW/2, 224, 'win +30 trophies   lose -18', P.grey, 1);

      /* --- board --------------------------------------------------------- */
      const board = S.rivals();
      const top = 242;
      c.save();
      c.beginPath(); c.rect(0, top, VW, VH-top); c.clip();
      let y = top + 4 - scroll;
      txt(c, 12, y, 'THE SKY LADDER', P.gold, 1); y += 14;
      for (let i=0;i<board.length;i++) {
        const r = board[i];
        if (y > VH) break;
        const me = !!r.me;
        panel(c, 8, y, VW-16, 28, me ? '#1a5a33' : (i < 3 ? '#4a3a10' : '#2e1b50'));
        ctxt(c, 22, y+9, '#' + (i+1), i < 3 ? P.gold : P.grey, 1);
        AV.draw(c, 46, y+26, r.cfg || AV.defaults(), 'idle', Math.floor(t*3+i)%2, { scale:.85, shadow:false });
        txt(c, 62, y+9, r.n, me ? P.lime : P.white, 1, P.shadow);
        spr(c, 'i_trophy', VW-64, y+8);
        txt(c, VW-48, y+11, String(r.t), P.gold, 1, P.shadow);
        y += 32;
      }
      c.restore();
      c.fillStyle = rgba(P.ink,.9); c.fillRect(0, VH-2, VW, 2);
    }
  };
})());
