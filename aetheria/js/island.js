/* =========================================================================
   ISLAND — the main menu, which is not a menu. It is a place you live on.

   Your character wanders about on their own, naps, dances, gets rained on
   by leaves. Buildings quietly produce while you are gone and put a bubble
   over their head when they have something for you. Everything else in the
   game is reached by walking up to it or by the bar along the bottom.
   ========================================================================= */
Game.register('island', (() => {
  let t = 0, popup = null, hero, pet, spawnT = 0, welcome = 0, camShift = 0;

  const ICX = 180, ICY = 368, IRX = 156, IRY = 64;   /* the grass disc */
  const CX = 180, CY = 370, RX = 128, RY = 50;       /* where feet may go */
  /* things further back are drawn smaller — cheap, convincing depth */
  const depthScale = y => (y > ICY + 6 ? 2 : 1);   /* two zoom steps, never a fraction */
  const inside = (x,y) => ((x-CX)/RX)**2 + ((y-CY)/RY)**2 <= 1;
  function randomSpot() {
    for (let i=0;i<30;i++) {
      const a = rnd(0,TAU), r = Math.sqrt(Math.random());
      const x = CX + Math.cos(a)*RX*r*.92, y = CY + Math.sin(a)*RY*r*.92;
      if (inside(x,y)) return [x,y];
    }
    return [CX,CY];
  }

  /* --- the little person, who has opinions about what to do next -------- */
  function newHero() {
    return { x:CX, y:CY+10, tx:CX, ty:CY+10, st:'idle', timer:2, f:0, ft:0, flip:false, z:0, zz:0 };
  }
  function heroThink() {
    const roll = Math.random();
    if (roll < .42)      { const [x,y] = randomSpot(); hero.tx = x; hero.ty = y; hero.st = 'walk'; hero.timer = 8; }
    else if (roll < .58) { hero.st = 'idle';  hero.timer = rnd(1.6,3.4); }
    else if (roll < .70) { hero.st = 'dance'; hero.timer = rnd(2.5,5); SFX.play('pop'); }
    else if (roll < .80) { hero.st = 'sit';   hero.timer = rnd(3,6); }
    else if (roll < .88) { hero.st = 'cheer'; hero.timer = rnd(1,2); }
    else                 { hero.st = 'sleep'; hero.timer = rnd(4,9); }
  }
  function heroUpdate(dt) {
    hero.ft += dt;
    hero.timer -= dt;
    if (hero.st === 'walk') {
      const d = dist(hero.x,hero.y,hero.tx,hero.ty);
      if (d < 2 || hero.timer <= 0) { hero.st = 'idle'; hero.timer = rnd(1,2.4); }
      else {
        const sp = 26*dt;
        hero.flip = hero.tx < hero.x;
        hero.x += (hero.tx-hero.x)/d*sp; hero.y += (hero.ty-hero.y)/d*sp;
        if (Math.floor(hero.ft*7) !== Math.floor((hero.ft-dt)*7)) {
          hero.f = (hero.f+1)%4;
          if (hero.f % 2 === 0) { FX.dust(hero.x, hero.y, 2); SFX.play('step'); }
        }
      }
    } else if (hero.timer <= 0) heroThink();
    if (hero.st !== 'walk') { if (hero.ft % .34 < dt) hero.f = (hero.f+1)%2; }
    if (hero.st === 'sleep') { hero.zz += dt; if (hero.zz > .9) { hero.zz = 0;
      FX.float(hero.x+10, hero.y-20, 'z', rgba(P.white,.9), { life:1.6, vy:-16 }); } }
    /* the pet trots along behind */
    if (pet) {
      const tx = hero.x + (hero.flip ? 16 : -16), ty = hero.y + 4;
      const d = dist(pet.x,pet.y,tx,ty);
      if (d > 3) { pet.x += (tx-pet.x)*Math.min(1,dt*2.4); pet.y += (ty-pet.y)*Math.min(1,dt*2.4); pet.flip = tx < pet.x; }
      pet.bob = Math.sin(t*6)*2;
    }
  }

  /* --- buildings -------------------------------------------------------- */
  function buildingAt(i) { return S.d.buildings.find(b => b.plot === i); }

  /* the choppable tree and the mineable rock */
  const CHOP = { x:58, y:344 }, MINE = { x:308, y:400 };

  function drawIslandBody(c) {
    drawPlateau(c, ICX, ICY, IRX, IRY, 208, { seed:21 });
    /* a pond at the back, spilling off the front rim as a waterfall */
    const pxx = 244, pyy = 340;
    pxEllipse(c, pxx, pyy+1, 25, 10, '#1a3f8f');
    pxEllipse(c, pxx, pyy, 24, 9, '#2358c9');
    pxEllipse(c, pxx, pyy-1, 22, 7, '#49a7ff');
    c.fillStyle = rgba('#b6ecff',.75);
    for (let i=0;i<4;i++) {
      const w = 9 + i*3, yy = pyy - 4 + i*3;
      c.fillRect(Math.round(pxx - w/2 + Math.sin(t*1.5+i)*3), Math.round(yy), w, 1);
    }
    c.fillStyle = '#49a7ff';
    for (let i=0;i<24;i++) c.fillRect(Math.round(246+Math.sin(i*.5)*2), 348+i*2, 2, 2);
    drawWaterfall(c, 244, 396, 7, 150, t);
    /* the scenery, seeded so nothing ever shuffles */
    drawTree(c, CHOP.x, CHOP.y, 1.15, 31, { fruit:P.red });
    drawTree(c, 306, 336, .8, 32);
    drawBush(c, 132, 322, .8, 33);
    drawBush(c, 198, 320, .7, 34);
    for (let i=0;i<11;i++) {
      const r = srnd(60+i), a = r()*TAU, rr = Math.sqrt(r());
      const x = ICX + Math.cos(a)*IRX*rr*.88, y = ICY + Math.sin(a)*IRY*rr*.88;
      spr(c, r() > .5 ? 'flower' : 'flower2', x, y, { scale:1 });
    }
    spr(c, 'mushroom', 146, 404); spr(c, 'mushroom', 212, 416);
    spr(c, 'crystal', 86, 386);
  }

  return {
    enter(data) {
      t = 0; popup = null; welcome = data && data.welcome ? 2.4 : 0;
      hero = newHero();
      const p = S.pet();
      pet = p ? { x:CX-16, y:CY+4, flip:false, bob:0, def:S.petDef(p) } : null;
      SFX.music(true);
      if (data && data.dailyBonus) UI.toast('DAY ' + S.d.dayStreak + ' +' + data.dailyBonus, P.gold, 'i_coin');
      if (!S.d.seenIntro) {
        S.d.seenIntro = true; S.save();
        setTimeout(() => UI.toast('tap ADVENTURE to start climbing', P.gold, 'i_star'), 2400);
        setTimeout(() => UI.toast('this island is yours — build on the + plots', P.lime, 'i_wood'), 4600);
      }
      S.tickBuildings();
    },
    exit() { popup = null; },
    back() { if (popup) popup = null; },

    update(dt) {
      t += dt;
      if (welcome > 0) welcome -= dt;
      if (!popup) heroUpdate(dt);
      spawnT += dt;
      if (spawnT > 1.6) { spawnT = 0; if (Math.random() < .5) FX.leaves(rnd(30,330), 270, 1); }
      camShift = Math.sin(t*.35)*2;
    },

    draw(c) {
      const hour = new Date().getHours();
      const night = hour >= 20 || hour < 6, dusk = hour >= 17 && hour < 20, dawn = hour >= 6 && hour < 8;
      drawSky(c, t, night ? { top:'#160b34', mid:'#2e1b50', bot:'#5b3a8e', sun:false, stars:true,
                              cloudLayers:[[.2,.5,150,.25],[.42,.8,230,.3]] }
                  : dusk ? { top:'#3b1e6e', mid:'#c05fb0', bot:'#ffb27a', sunX:52, sunY:150 }
                  : dawn ? { top:'#6c7fd8', mid:'#ffb0c8', bot:'#ffe9a8', sunX:300, sunY:140 }
                         : { top:'#2c7ff0', mid:'#6cc8ff', bot:'#b6ecff' });

      /* distant islands = the other lesson worlds, drifting */
      const packs = S.unlockedPacks();
      for (let i=0;i<packs.length;i++) {
        const p = packs[i].pack;
        const x = 30 + ((i*67 + t*3) % (VW+70)) - 35;
        const y = 120 + Math.sin(t*.4+i*1.3)*7 + (i%3)*22;
        c.globalAlpha = packs[i].open ? .85 : .4;
        drawFloatIsland(c, x, y, 30, { seed:i+2, depth:20, vines:false,
          grass: packs[i].open ? p.col : '#6b789c', grass2: packs[i].open ? p.col2 : '#434f74' });
        if (packs[i].open) spr(c, p.icon, x, y-8, { center:true });
        c.globalAlpha = 1;
      }

      c.save(); c.translate(0, camShift);
      drawIslandBody(c);

      /* --- everything that stands on the ground, sorted back to front --- */
      const items = [];
      for (let i=0;i<PLOTS.length;i++) {
        const b = buildingAt(i);
        items.push({ y: PLOTS[i].y, kind: b ? 'b' : 'plot', b, plot:i, x:PLOTS[i].x });
      }
      items.push({ y: hero.y, kind:'hero', x:hero.x });
      if (pet) items.push({ y: pet.y+1, kind:'pet', x:pet.x });
      if (S.d.chests.length) items.push({ y: 414, kind:'chest', x:276 });
      items.push({ y: MINE.y, kind:'mine', x:MINE.x });
      items.sort((a,b) => a.y - b.y);

      let tapped = null;
      for (const it of items) {
        if (it.kind === 'b') {
          const r = drawBuilding(c, it.b.type, it.x, it.y, it.b.lvl, t, 1);
          const z = UI.zone(r.x, r.y, r.w, r.h, 'b'+it.plot);
          if (z.over) { c.globalAlpha = .2; pbox(c, r.x-2, r.y-2, r.w+4, r.h+4, P.white, 3); c.globalAlpha = 1; }
          if (z.click && !popup) tapped = { type:'building', b:it.b };
          /* resource bubble */
          const def = BUILDINGS[it.b.type];
          if (def.res && Math.floor(it.b.stock||0) >= 1) {
            const by = r.y - 16 + Math.sin(t*3 + it.plot)*2;
            const full = (it.b.stock||0) >= S.prodCap(it.b) - .01;
            pbox(c, it.x-11, by-9, 22, 18, full ? P.gold : P.white, 3);
            pbox(c, it.x-10, by-8, 20, 16, full ? '#fff0a8' : '#e9f4ff', 3);
            c.fillStyle = full ? P.gold : P.white;
            c.fillRect(it.x-2, by+8, 4, 3); c.fillRect(it.x-1, by+11, 2, 2);
            spr(c, def.res === 'xp' ? 'i_book' : 'i_'+def.res, it.x, by, { center:true });
            const bz = UI.zone(it.x-13, by-12, 26, 26, 'bub'+it.plot);
            if (bz.click) {
              const n = S.collect(it.b);
              if (n > 0) {
                SFX.play('coin');
                FX.float(it.x, by-6, '+' + n, P.gold, { scale:2 });
                FX.burst(it.x, by, 12, [P.gold,P.white], { speed:70, g:-30 });
                UI.toast('+' + n + ' ' + (def.res === 'xp' ? 'XP' : def.res.toUpperCase()), P.gold,
                         def.res === 'xp' ? 'i_book' : 'i_'+def.res);
              }
            }
          }
        } else if (it.kind === 'plot') {
          const bob2 = Math.sin(t*2 + it.plot)*1.5;
          c.globalAlpha = .55;
          pxEllipse(c, it.x, it.y, 13, 5, rgba(P.ink,.5));
          pbox(c, it.x-11, it.y-22+bob2, 22, 20, rgba(P.ink,.65), 3);
          pbox(c, it.x-10, it.y-21+bob2, 20, 18, rgba(P.grassLt,.25), 3);
          ctxt(c, it.x, it.y-17+bob2, '+', P.white, 2);
          c.globalAlpha = 1;
          const z = UI.zone(it.x-14, it.y-22, 28, 26, 'p'+it.plot);
          if (z.click && !popup) tapped = { type:'plot', plot:it.plot };
        } else if (it.kind === 'hero') {
          const hs = 2;
          /* a little squash on each footfall — the whole game bounces */
          const sq = hero.st === 'walk' ? 1 + (hero.f % 2 ? .06 : -.04)
                   : hero.st === 'idle' ? 1 + Math.sin(t*3)*.02 : 1;
          AV.draw(c, hero.x, hero.y, S.d.cfg, hero.st === 'walk' ? 'walk' : hero.st, hero.f,
                  { scale:hs, flip:hero.flip, squash:sq });
          if (hero.st === 'sleep') { /* a blanket of Zs handled by particles */ }
          const z = UI.zone(hero.x-18, hero.y-46, 36, 48, 'hero');
          if (z.click && !popup) { hero.st = 'cheer'; hero.timer = 1.2; SFX.play('pop');
                                   FX.stars(hero.x, hero.y-30, 8, P.gold); }
          /* name plate */
          ctxt(c, hero.x, hero.y - 34*hs, S.d.name, P.white, 1, P.ink);
        } else if (it.kind === 'pet' && pet) {
          spr(c, pet.def.spr, pet.x, pet.y - 10 + pet.bob, { center:true, flip:pet.flip,
                                                             scale: 1 });
        } else if (it.kind === 'chest') {
          const n = S.d.chests.length;
          const by = Math.sin(t*2.4)*2;
          c.globalAlpha = .3 + .2*Math.sin(t*4); pxEllipse(c, it.x, 414, 20, 8, P.gold); c.globalAlpha = 1;
          spr(c, 'chestSm', it.x, 406 + by, { center:true, scale:2 });
          if (n > 1) { pbox(c, it.x+12, 392, 16, 14, P.red, 3); ctxt(c, it.x+20, 395, String(n), P.white, 1); }
          const z = UI.zone(it.x-14, 390, 30, 30, 'chest');
          if (z.click && !popup) Game.go('chest');
        } else if (it.kind === 'mine') {
          /* the way down into The Deep: a timber frame over a dark hole */
          const mx = MINE.x, my = MINE.y;
          c.fillStyle = P.shadow; pxEllipse(c, mx, my, 15, 7, '#0a0714');
          c.fillStyle = '#05030c'; pxEllipse(c, mx, my-1, 13, 5, '#05030c');
          c.fillStyle = P.wood3;
          c.fillRect(mx-16, my-22, 4, 22); c.fillRect(mx+12, my-22, 4, 22);
          c.fillRect(mx-18, my-26, 36, 5);
          c.fillStyle = P.wood2; c.fillRect(mx-18, my-26, 36, 2);
          c.fillStyle = P.wood;  c.fillRect(mx-16, my-22, 4, 2); c.fillRect(mx+12, my-22, 4, 2);
          for (let i=0;i<3;i++) {
            const gy2 = my - 2 - ((t*14 + i*9) % 20);
            c.globalAlpha = .5; c.fillStyle = P.purple;
            c.fillRect(Math.round(mx - 5 + Math.sin(t*2+i)*5), Math.round(gy2), 2, 2);
            c.globalAlpha = 1;
          }
          ctxt(c, mx, my-36, 'THE DEEP', P.pink, 1, P.ink);
          const z = UI.zone(mx-20, my-30, 40, 34, 'mine');
          if (z.over) ctxt(c, mx, my+6, 'dig for ore', P.white, 1, P.ink);
          if (z.click && !popup) Game.go('deep');
        }
      }
      /* the choppable tree sits behind everything, so handle it separately */
      {
        const z = UI.zone(CHOP.x-20, CHOP.y-56, 40, 58, 'chop');
        if (z.over) ctxt(c, CHOP.x, CHOP.y-64, 'CHOP', P.white, 1, P.ink);
        if (z.click && !popup) Game.go('minigame', { kind:'chop' });
      }
      /* eggs warming beside the nestry */
      const nest = S.building('nest');
      if (nest && S.d.eggs.length) {
        const p = PLOTS[nest.plot];
        for (let i=0;i<S.d.eggs.length;i++) {
          const e = S.d.eggs[i];
          const ex = p.x - 16 + i*14, ey = p.y + 4 + Math.sin(t*3+i)*1;
          spr(c, 'i_egg', ex, ey, { center:true });
          bar(c, ex-7, ey+8, 14, 3, e.heat/e.need, P.pink);
        }
      }
      c.restore();

      /* --- HUD ----------------------------------------------------------- */
      UI.topBar(c);
      UI.levelChip(c, 6, 30);
      /* streak + daily goal */
      const g = S.daily();
      panel(c, 108, 30, 142, 22, '#2e1b50');
      spr(c, 'i_flame', 111, 35, { scale:1 });
      txt(c, 124, 33, 'DAY ' + S.d.dayStreak, P.orange, 1, P.shadow);
      bar(c, 124, 43, 120, 4, g.n/S.DAILY_GOAL, P.lime, { shine:t*.7 });
      txt(c, 190, 33, g.n + '/' + S.DAILY_GOAL, P.grey, 1);
      if (g.n >= S.DAILY_GOAL && !g.claimed) {
        if (UI.btn(c, 254, 30, 98, 22, 'CLAIM!', { col:'#b3600f', col2:P.gold, txt:P.ink, glow:P.white })) {
          const r = S.claimDaily();
          UI.toast('DAILY DONE  +' + r, P.gold, 'i_coin');
          FX.confetti(VW/2, 120, 50); SFX.play('levelup');
        }
      } else {
        panel(c, 254, 30, 98, 22, '#2e1b50');
        spr(c, 'i_gem', 257, 35);
        txt(c, 271, 33, String(S.d.gems), P.cyan, 1, P.shadow);
        spr(c, 'i_paw', 300, 35);
        txt(c, 314, 33, String(S.d.pets.length), P.lime, 1, P.shadow);
      }

      if (welcome > 0) {
        c.globalAlpha = clamp(welcome,0,1);
        panel(c, 60, 226, VW-120, 48, rgba(P.ink,.85), { r:4 });
        ctxt(c, VW/2, 234, 'WELCOME HOME,', P.white, 1, P.ink);
        ctxt(c, VW/2, 248, S.d.name, P.gold, 3, P.ink);
        c.globalAlpha = 1;
      }

      /* --- bottom nav ---------------------------------------------------- */
      const navY = 556;
      pbox(c, -2, navY-8, VW+4, 96, rgba(P.ink,.93), 4);
      hline(c, 0, navY-8, VW, rgba(P.purple,.6));
      /* the two things this game is for, given the whole top row */
      if (UI.btn(c, 8, navY, 168, 40, 'ADVENTURE',
                 { col:'#1a7331', col2:'#3fe07a', glow:P.gold, scale:2 }))
        Game.go('map');
      const dl = AI.material().examDate
        ? Math.ceil((new Date(AI.material().examDate + 'T23:59:59') - Date.now())/86400000) : null;
      if (UI.btn(c, 184, navY, 168, 40, 'STUDY',
                 { col:'#2358c9', col2:P.blue, glow:P.cyan, scale:2 }))
        Game.go('study');
      if (dl != null && dl >= 0) {
        pbox(c, 296, navY-6, 56, 14, dl <= 3 ? P.red : '#b3600f', 3);
        ctxt(c, 324, navY-4, dl + 'd', P.white, 1);
      }
      /* everything else, small */
      const small = [
        ['BASE',  '#6a4a10', '#c08a4a', 'i_wood',  () => Game.go('build')],
        ['CARDS', '#2358c9', '#49a7ff', 'i_book',  () => Game.go('dex')],
        ['RANK',  '#6a27c8', '#a35cff', 'i_trophy',() => Game.go('rank')],
        ['PETS',  '#3a2a5e', '#5a4790', 'i_paw',   () => { popup = { type:'pets' }; }],
        ['GEAR',  '#3a2a5e', '#5a4790', 'i_sword', () => { popup = { type:'gear' }; }],
        ['LABS',  '#6a27c8', '#a35cff', 'i_flask', () => Game.go('lab')],
        ['ME',    '#3a2a5e', '#5a4790', null,      () => Game.go('creator')]
      ];
      small.forEach((b,i) => {
        const x = 8 + (i%7)*50;
        if (UI.btn(c, x, navY+46, 46, 24, b[0], { col:b[1], col2:b[2], key:'nv'+i })) b[4]();
      });
      if (UI.btn(c, 8, navY+74, 170, 12, S.d.sound ? 'SOUND ON' : 'SOUND OFF',
                 { col:'#241640', col2:'#3a2a5e', shadow:false })) { S.d.sound = SFX.toggle(); S.save(); }
      if (UI.btn(c, 182, navY+74, 170, 12, 'HOW IT WORKS',
                 { col:'#241640', col2:'#3a2a5e', shadow:false })) popup = { type:'info' };

      if (tapped) { popup = tapped; SFX.play('tap'); }
      if (popup) drawPopup(c);
    }
  };

  /* ---------------------------------------------------------------------- */
  function sheet(c, h, title, col) {
    c.fillStyle = rgba(P.shadow,.72); c.fillRect(0,0,VW,VH);
    const y = VH - h;
    panel(c, 6, y, VW-12, h-6, '#241640', { r:4 });
    pbox(c, 6, y, VW-12, 20, col || '#6a27c8', 4);
    ctxt(c, VW/2, y+7, title, P.white, 1);
    if (UI.btn(c, VW-40, y+2, 30, 18, 'X', { col:'#8a2a3a', col2:P.red })) popup = null;
    return y;
  }

  function drawPopup(c) {
    if (popup.type === 'building') {
      const b = popup.b, def = BUILDINGS[b.type];
      const y = sheet(c, 178, def.name + '  LV ' + b.lvl, '#6a4a10');
      if (!popup) return;
      spr(c, def.icon, 26, y+30, { scale:2 });
      txt(c, 56, y+30, def.name, P.gold, 2, P.shadow);
      const lines = wrap(def.desc, VW-90, 1);
      lines.forEach((l,i) => txt(c, 56, y+48+i*10, l, P.grey, 1));
      if (def.res) {
        txt(c, 16, y+76, 'PRODUCES  ' + S.prodRate(b) + ' ' + def.res.toUpperCase() + ' / MIN', P.lime, 1);
        bar(c, 16, y+88, VW-44, 7, (b.stock||0)/Math.max(1,S.prodCap(b)), P.lime, { shine:UI.time });
        txt(c, 16, y+98, Math.floor(b.stock||0) + ' / ' + S.prodCap(b) + ' STORED', P.grey, 1);
      }
      if (b.type === 'forge')   { if (UI.btn(c, 16, y+76, VW-44, 26, 'OPEN THE FORGE', { col:'#8a2a10', col2:P.orange })) popup = { type:'gear' }; }
      if (b.type === 'nest')    { if (UI.btn(c, 16, y+76, VW-44, 26, 'EGGS & PETS', { col:'#1a7331', col2:P.green })) popup = { type:'pets' }; }
      if (b.type === 'library') { if (UI.btn(c, 16, y+108, VW-44, 24, 'WRITE A CUSTOM LESSON', { col:'#2358c9', col2:P.blue })) Game.go('dex', { tab:2 }); }
      const maxed = b.lvl >= def.maxLvl;
      const cost = S.upgradeCost(b);
      const can = !maxed && S.can(cost);
      if (UI.btn(c, 16, y+140, VW-44, 28, maxed ? 'FULLY UPGRADED' : 'UPGRADE  ' + S.costText(cost),
                 { col: can ? '#1a7331' : '#3a2a5e', col2: can ? '#3fe07a' : '#5a4790', disabled:!can })) {
        if (S.upgrade(b)) { SFX.play('build'); FX.confetti(VW/2, y+120, 30);
                            UI.toast(def.name + ' IS NOW LV ' + b.lvl, P.gold, def.icon); }
      }
    } else if (popup.type === 'plot') {
      const plot = popup.plot;
      const y = sheet(c, 296, 'BUILD HERE', '#6a4a10');
      if (!popup) return;
      const keys = Object.keys(BUILDINGS).filter(k => k !== 'house' && !S.building(k));
      if (!keys.length) ctxt(c, VW/2, y+100, 'you have built everything', P.grey, 1);
      keys.forEach((k,i) => {
        const def = BUILDINGS[k];
        const yy = y + 26 + i*33;
        if (yy > VH-34) return;
        panel(c, 12, yy, VW-24, 30, '#2e1b50');
        spr(c, def.icon, 18, yy+9);
        txt(c, 34, yy+5, def.name, P.white, 1, P.shadow);
        txt(c, 34, yy+17, S.costText(def.cost), S.can(def.cost) ? P.lime : P.red, 1);
        if (UI.btn(c, VW-86, yy+3, 66, 24, 'BUILD',
                   { col: S.can(def.cost) ? '#1a7331' : '#3a2a5e', col2: S.can(def.cost) ? '#3fe07a' : '#5a4790',
                     disabled:!S.can(def.cost), key:'bl'+k })) {
          if (S.place(k, plot)) { SFX.play('build'); FX.confetti(PLOTS[plot].x, PLOTS[plot].y, 34);
                                        UI.toast(def.name + ' BUILT', P.gold, def.icon); popup = null; }
        }
      });
    } else if (popup.type === 'gear') {
      const y = sheet(c, 244, 'THE FORGE', '#8a2a10');
      if (!popup) return;
      let i = 0;
      for (const slot in GEAR) {
        const gdef = GEAR[slot], lvl = S.d.gear[slot];
        const yy = y + 28 + i*46; i++;
        panel(c, 12, yy, VW-24, 42, '#2e1b50');
        spr(c, gdef.icon, 18, yy+14, { scale:1 });
        txt(c, 34, yy+5, (GEAR_NAMES[Math.min(lvl,GEAR_NAMES.length-1)]) + ' ' + gdef.name, P.white, 1, P.shadow);
        txt(c, 34, yy+17, '+' + (lvl*gdef.per) + ' ' + gdef.stat.toUpperCase() + '   LV ' + lvl, P.cyan, 1);
        const cost = gdef.cost(lvl);
        txt(c, 34, yy+29, S.costText(cost), S.can(cost) ? P.lime : P.red, 1);
        const ok = S.building('forge') && S.can(cost) && lvl < 6;
        if (UI.btn(c, VW-78, yy+9, 58, 24, lvl >= 6 ? 'MAX' : 'FORGE',
                   { col: ok ? '#8a2a10' : '#3a2a5e', col2: ok ? P.orange : '#5a4790', disabled:!ok, key:'g'+slot })) {
          if (S.pay(cost)) { S.d.gear[slot]++; S.save(); SFX.play('crit');
                             FX.confetti(VW/2, yy, 30); UI.toast(gdef.name + ' UPGRADED', P.orange, gdef.icon); }
        }
      }
      if (!S.building('forge'))
        ctxt(c, VW/2, y+178, 'build a FORGE on the island first', P.red, 1);
      else ctxt(c, VW/2, y+178, 'gear is permanent — it carries into every fight', P.grey, 1);
    } else if (popup.type === 'pets') {
      const y = sheet(c, 250, 'EGGS & COMPANIONS', '#1a7331');
      if (!popup) return;
      txt(c, 14, y+26, 'EGGS  (they hatch while you fight)', P.gold, 1);
      if (!S.d.eggs.length) txt(c, 14, y+38, 'no eggs. chests drop them.', P.grey, 1);
      S.d.eggs.forEach((e,i) => {
        const yy = y+36+i*22;
        spr(c, 'i_egg', 16, yy);
        txt(c, 32, yy+3, (e.type||'').toUpperCase(), P.white, 1);
        bar(c, 100, yy+3, 150, 6, e.heat/e.need, P.pink, { shine:UI.time });
        txt(c, 256, yy+3, Math.floor(e.heat) + '/' + e.need, P.grey, 1);
      });
      txt(c, 14, y+112, 'COMPANIONS', P.gold, 1);
      if (!S.d.pets.length) txt(c, 14, y+124, 'none yet — hatch one in battle', P.grey, 1);
      S.d.pets.forEach((p,i) => {
        const def = S.petDef(p), yy = y+122+i*28;
        if (yy > VH-30) return;
        const active = S.d.activePet === i;
        panel(c, 12, yy, VW-24, 24, active ? '#1a5a33' : '#2e1b50');
        spr(c, def.spr, 16, yy+5, { scale:1 });
        txt(c, 34, yy+8, def.name + '  LV ' + p.lvl, P.white, 1, P.shadow);
        txt(c, 150, yy+8, '+' + def.dmg + ' DMG', P.lime, 1);
        if (UI.btn(c, VW-70, yy+2, 52, 20, active ? 'ACTIVE' : 'PICK',
                   { col: active ? '#1a7331' : '#3a2a5e', col2: active ? '#3fe07a' : '#5a4790', key:'pt'+i })) {
          S.d.activePet = i; S.save(); SFX.play('power');
          const pp = S.pet(); pet = pp ? { x:hero.x, y:hero.y, flip:false, bob:0, def:S.petDef(pp) } : null;
        }
      });
    } else if (popup.type === 'info') {
      const y = sheet(c, 250, 'HOW AETHERIA WORKS', '#2358c9');
      if (!popup) return;
      const lines = [
        'ADVENTURE is a road of islands. Each stop',
        'is a card battle, a mini game or a haul.',
        '',
        'In battle your ANSWER is your attack. Fast',
        'and correct hits hardest. Five answers gets',
        'you a relic. Fill the FOCUS bar for an ult.',
        '',
        'Chests, eggs and materials come home with',
        'you. Build, upgrade, forge armour, hatch',
        'pets. Everything keeps working offline.',
        '',
        'Trophies move you up the ranks. Lose and',
        'you drop some. That is the whole game.'
      ];
      lines.forEach((l,i) => txt(c, 14, y+26+i*11, l, i%7===0?P.gold:P.bone, 1));
      if (UI.btn(c, 14, y+200, 150, 24, 'RESET SAVE', { col:'#8a2a3a', col2:P.red })) {
        if (popup.confirm) { S.reset(); Game.go('creator'); }
        else { popup.confirm = true; UI.toast('tap again to wipe everything', P.red); }
      }
      txt(c, 180, y+206, 'v1.0  ' + Game.fps + ' fps', P.grey, 1);
    }
  }
})());
