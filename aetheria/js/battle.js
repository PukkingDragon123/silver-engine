/* =========================================================================
   BATTLE — the heart of it.

   Every question is a hand of four attack cards. Only the true answer
   connects, and it connects harder the faster you are. Five answers buys a
   relic, a full FOCUS bar buys an ultimate, eggs hatch from the heat of the
   fight, and your pet joins in whether you asked it to or not.
   ========================================================================= */
Game.register('battle', (() => {
  let t, mode, packId, node, deck, pack, bank;
  let me, foe, q, cards, phase, phaseT, act, intent, draft, hatchPet;
  let timeLimit, timeLeft, relics, answered, correct, damageTaken, chosen;
  let shakeFoe, foeFlash, meFlash, result, typed, keypad;
  let stars, rewards, banner, ultReady, petTick;
  let aiPanel = null, lastWrong = null, hintUsed = false;

  const R = id => relics.includes(id);

  /* ---- setup ----------------------------------------------------------- */
  function enemyFor() {
    if (mode === 'duel') {
      return { rival:true, name:foeRival.n, hp:120 + S.rank().idx*26, atk:10 + S.rank().idx*2,
               el:'void', cfg:foeRival.cfg };
    }
    const list = pack.enemies;
    let key;
    if (mode === 'boss') key = pack.boss;
    else if (mode === 'elite') key = list[Math.min(list.length-1, 3)];
    else key = list[Math.min(list.length-1, Math.floor(node/2))];
    const base = CONTENT.ENEMIES[key];
    const scale = 1 + (node||0)*0.06 + S.d.lvl*0.03;
    return Object.assign({}, base, { hp: Math.round(base.hp*scale), atk: Math.round(base.atk*scale) });
  }
  let foeRival = null;

  function nextQuestion() {
    if (mode === 'custom' && deck) q = CONTENT.customQuestion(deck);
    else q = CONTENT.question(bank);
    S.sawCard(bank, q.q, q.a);
    /* every so often a maths question becomes a type-it-in */
    const num = /^-?\d+(\.\d+)?$/.test(String(q.a).replace(/^x\s*=\s*/,'').trim());
    keypad = null; typed = '';
    if (num && ['algebra','fractions','forces','graphs'].includes(bank) && answered > 0 && answered % 4 === 3) {
      keypad = String(q.a).replace(/^x\s*=\s*/,'').trim();
    }
    /* the four attack cards, one per option */
    const pool = shuffle(CONTENT.CARDS);
    cards = q.o.map((opt,i) => {
      const cd = pool[i % pool.length];
      return { opt, card:cd, dead:false, tilt:rnd(-.03,.03), in:0 };
    });
    if (R('glasses')) burnOne();
    timeLimit = 14 + (R('time') ? 4 : 0) - (mode === 'boss' ? 2 : 0);
    timeLeft = timeLimit;
    chosen = -1; hintUsed = false;
    phase = 'q'; phaseT = 0;
  }
  function burnOne(n) {
    n = n || 1;
    for (let k=0;k<n;k++) {
      const wrong = cards.filter(cd => cd.opt !== q.a && !cd.dead);
      if (wrong.length > 1) { const w = pick(wrong); w.dead = true;
        FX.burst(0,0,0,P.white); }
    }
  }

  /* ---- damage ---------------------------------------------------------- */
  function playerDamage(card) {
    const speed = clamp(timeLeft/timeLimit, 0, 1);
    const speedBonus = 1 + (R('crit') ? 1.2 : 0.6)*speed;
    const comboStep = R('combo') ? .24 : .12;
    const comboMul = 1 + me.combo*comboStep;
    let d = card.card.d * speedBonus * comboMul * S.atk() * (R('focus') ? 1.3 : 1);
    let crit = false;
    if (R('lucky') && Math.random() < .25) { d *= 2; crit = true; }
    if (speed > .8) crit = true;
    return { d: Math.max(1, Math.round(d)), crit };
  }
  function hitFoe(d, crit, label) {
    foe.hp = Math.max(0, foe.hp - d);
    shakeFoe = .3; foeFlash = .18;
    FX.shake(crit ? 7 : 4, .25);
    FX.float(foe.x, foe.y - 34, (crit?'':'') + d, crit ? P.gold : P.white, { scale: crit?3:2, shake: crit?1:0 });
    if (label) FX.float(foe.x, foe.y - 56, label, P.cyan, { scale:1, life:.9 });
    FX.spark(foe.x, foe.y, crit ? 26 : 14, crit ? [P.gold,P.white,P.orange] : [P.white,P.cyan]);
    FX.ring(foe.x, foe.y, crit ? P.gold : P.white, { r1: crit?62:40, w:2 });
    SFX.play(crit ? 'crit' : 'hit');
    if (foe.hp <= 0) endBattle(true);
  }
  function hitMe(raw, why) {
    let d = Math.max(1, Math.round(raw * (R('iron') ? .7 : 1) - S.def()*.35));
    me.hp = Math.max(0, me.hp - d);
    damageTaken += d;
    meFlash = .25; FX.shake(6,.3); FX.flash(rgba(P.red,.5), .12);
    FX.float(me.x, me.y - 40, '-' + d, P.red, { scale:2, shake:1 });
    FX.burst(me.x, me.y-16, 14, [P.red,'#ff97a4'], { speed:110 });
    SFX.play('wrong');
    if (why) FX.float(VW/2, 300, why, P.red, { scale:1, life:1.2 });
    if (R('thorn')) { hitFoe(8, false, 'THORNS'); }
    if (me.hp <= 0) endBattle(false);
  }

  /* ---- answering -------------------------------------------------------- */
  function answer(i) {
    if (phase !== 'q') return;
    chosen = i;
    const card = cards[i];
    const right = card.opt === q.a;
    answered++; S.d.stats.answered++;
    S.dailyTick(1);
    S.gotCard(bank, q.q, right);
    if (right) {
      correct++; S.d.stats.correct++;
      me.combo++;
      me.best = Math.max(me.best, me.combo);
      const { d, crit } = playerDamage(card);
      act = { type:'strike', t:0, dur:.55, card, d, crit, i };
      phase = 'resolve'; phaseT = 0;
      SFX.play('correct');
      if (me.combo > 1) SFX.play('combo', me.combo);
      me.focus = clamp(me.focus + (R('over') ? .29 : .18), 0, 1);
      if (R('vamp')) { me.hp = Math.min(me.maxHp, me.hp + 3); FX.float(me.x, me.y-46, '+3', P.green, { scale:1 }); }
      heatEgg(R('warm') ? 2 : 1);
      petTick++;
    } else {
      me.combo = 0;
      lastWrong = { q:q.q, given:card.opt, correct:q.a };
      act = { type:'miss', t:0, dur:.5, i };
      phase = 'resolve'; phaseT = 0;
      FX.float(VW/2, 300, 'WRONG', P.red, { scale:2 });
    }
  }
  function heatEgg(n) {
    const e = S.d.eggs[0];
    if (!e) return;
    e.heat += n;
    FX.float(me.x + 30, me.y - 30, 'EGG +' + n, P.pink, { scale:1, life:.7 });
    SFX.play('egg');
    if (e.heat >= e.need) {
      hatchPet = S.hatch(e);
      phase = 'hatch'; phaseT = 0;
      SFX.play('hatch');
      FX.confetti(VW/2, 300, 60);
    }
  }

  /* ---- the enemy's turn -------------------------------------------------- */
  function enemyAct(missed) {
    intent--;
    if (missed) {
      hitMe(foe.atk * (foe.boss ? 1.3 : 1), null);
    } else if (intent <= 0) {
      /* telegraphed heavy hit — being correct halves it */
      act = { type:'foeStrike', t:0, dur:.6 };
      hitMe(foe.atk * 1.6 * (missed ? 1 : .5), 'HEAVY STRIKE');
      intent = foe.boss ? 3 : 4;
    }
    if (intent <= 0) intent = foe.boss ? 3 : 4;
  }

  /* ---- relics ------------------------------------------------------------ */
  function openDraft() {
    const avail = CONTENT.POWERS.filter(p => !relics.includes(p.id));
    draft = shuffle(avail).slice(0,3).map((p,i) => ({ p, in:0, i }));
    phase = 'draft'; phaseT = 0;
    SFX.play('power'); FX.slow(.3);
  }
  function takeRelic(p) {
    relics.push(p.id);
    if (p.id === 'wind') { me.hp = Math.min(me.maxHp, me.hp + 18); FX.float(me.x, me.y-40, '+18', P.green, { scale:2 }); }
    if (p.id === 'glasses') burnOne();
    S.d.relics[p.id] = (S.d.relics[p.id]||0)+1; S.save();
    UI.toast(p.n + ' — ' + p.d, p.col, p.icon);
    SFX.play('levelup'); FX.confetti(VW/2, 300, 44);
    draft = null; nextQuestion();
  }

  /* ---- end --------------------------------------------------------------- */
  function endBattle(won) {
    phase = won ? 'win' : 'lose';
    phaseT = 0;
    S.d.stats.battles++;
    const acc = answered ? correct/answered : 0;
    stars = won ? (damageTaken === 0 || acc >= .95 ? 3 : acc >= .7 ? 2 : 1) : 0;
    rewards = { xp:0, coins:0, trophies:0, wood:0, stone:0, essence:0, chest:null };
    if (won) {
      S.d.stats.wins++;
      const mul = mode === 'boss' ? 2.6 : mode === 'elite' ? 1.7 : 1;
      rewards.xp = Math.round((18 + correct*4) * mul);
      rewards.coins = Math.round((22 + correct*5) * mul * (R('gold') ? 1.6 : 1));
      rewards.wood = Math.round(6*mul); rewards.stone = Math.round(4*mul);
      if (mode === 'boss') rewards.essence = 8;
      rewards.trophies = mode === 'duel' ? 30 : (8 + stars*3) * (mode === 'boss' ? 2 : 1);
      rewards.chest = S.rollRarity(mode === 'boss' ? .35 : mode === 'elite' ? .15 : 0);
      SFX.play('win');
      FX.confetti(VW/2, 200, 80);
    } else {
      rewards.trophies = mode === 'duel' ? -18 : -4;
      rewards.xp = Math.round(4 + correct*2);
      SFX.play('lose');
    }
    /* bank it */
    const ups = S.addXp(rewards.xp);
    S.give('coins', rewards.coins);
    if (rewards.wood) S.give('wood', rewards.wood);
    if (rewards.stone) S.give('stone', rewards.stone);
    if (rewards.essence) S.give('essence', rewards.essence);
    S.addTrophies(rewards.trophies);
    if (rewards.chest) { S.pushChest(rewards.chest, packId); S.d.stats.chests++; }
    if (won && mode !== 'duel' && mode !== 'custom') S.clearNode(packId, node, stars);
    if (ups) { UI.toast('LEVEL ' + S.d.lvl + '!', P.gold, 'i_star'); SFX.play('levelup'); }
    S.save();
  }

  /* ====================================================================== */
  return {
    enter(data) {
      t = 0; mode = data.mode || 'fight'; packId = data.packId; node = data.node || 0;
      foeRival = data.rival || null;
      deck = data.deckId != null ? S.d.decks.find(d => d.id === data.deckId) : null;
      pack = CONTENT.pack(packId) || CONTENT.PACKS[0];
      bank = deck ? 'custom' : pack.bank;
      relics = []; answered = 0; correct = 0; damageTaken = 0; petTick = 0;
      const e = enemyFor();
      foe = Object.assign({}, e, { maxHp:e.hp, x:VW/2, y:126, bob:0 });
      me = { hp:S.maxHp(), maxHp:S.maxHp(), focus:0, combo:0, best:0, x:70, y:556 };
      intent = foe.boss ? 3 : 4;
      shakeFoe = 0; foeFlash = 0; meFlash = 0; draft = null; hatchPet = null; result = null;
      banner = 1.6; ultReady = false; aiPanel = null; lastWrong = null; hintUsed = false;
      phase = 'intro'; phaseT = 0; act = null;
      SFX.music(false); SFX.duck(.05);
      nextQuestion();
      phase = 'intro';
    },
    exit() { SFX.duck(.16); SFX.music(true); },
    back() { if (phase === 'win' || phase === 'lose') leave(); },

    update(dt) {
      t += dt;
      if (aiPanel) return;                       /* the fight waits for the tutor */
      phaseT += dt;
      foe.bob = Math.sin(t*2.2)*3;
      if (shakeFoe > 0) shakeFoe -= dt;
      if (foeFlash > 0) foeFlash -= dt;
      if (meFlash > 0) meFlash -= dt;
      if (banner > 0) banner -= dt;
      for (const cd of cards) cd.in = Math.min(1, cd.in + dt*4);
      if (draft) for (const d of draft) d.in = Math.min(1, d.in + dt*3.2);

      if (phase === 'intro') { if (phaseT > 1.5) { phase = 'q'; phaseT = 0; } return; }

      if (phase === 'q') {
        timeLeft -= dt;
        if (mode === 'duel') {
          me.rivalT = (me.rivalT == null ? rnd(5,8) : me.rivalT) - dt;
          if (me.rivalT <= 0) {
            me.rivalT = rnd(5.5,8.5) - S.rank().idx*.2;
            act = { type:'foeStrike', t:0, dur:.6 };
            hitMe(foe.atk, 'THEY ANSWERED');
          }
        }
        if (timeLeft <= 0) {
          me.combo = 0;
          act = { type:'miss', t:0, dur:.5, i:-1 };
          phase = 'resolve'; phaseT = 0;
          FX.float(VW/2, 300, 'TOO SLOW', P.red, { scale:2 });
        }
        ultReady = me.focus >= 1;
        return;
      }

      if (phase === 'resolve') {
        if (act) act.t += dt;
        if (act && act.type === 'strike' && act.t >= act.dur*.55 && !act.landed) {
          act.landed = true;
          hitFoe(act.d, act.crit, act.crit ? 'CRITICAL' : null);
          if (petTick >= 3 && S.pet()) {
            petTick = 0;
            const pd = S.petDef(S.pet());
            const times = R('link') ? 2 : 1;
            for (let i=0;i<times;i++) setTimeout(() => {
              if (phase === 'win' || phase === 'lose') return;
              hitFoe(pd.dmg + S.pet().lvl*2, false, pd.name);
            }, 260 + i*220);
          }
        }
        if (act && act.type === 'miss' && act.t >= act.dur*.4 && !act.landed) {
          act.landed = true;
          enemyAct(true);
        }
        if (phase === 'resolve' && act && act.t >= act.dur + .25) {
          act = null;
          if (answered > 0 && answered % 5 === 0) openDraft();
          else { enemyAct(false); if (phase === 'resolve') nextQuestion(); }
        }
        return;
      }
      if (phase === 'hatch') { if (phaseT > 2.4) { hatchPet = null; nextQuestion(); } return; }
      if (phase === 'ult') {
        if (phaseT > .35 && !act.landed) {
          act.landed = true;
          const d = Math.round((38 + me.combo*6 + S.d.lvl*3) * S.atk());
          hitFoe(d, true, 'ULTIMATE');
          FX.flash('#ffffff', .2);
        }
        if (phaseT > 1.3) { me.focus = 0; if (phase === 'ult') nextQuestion(); }
      }
    },

    draw(c) {
      /* --- arena ------------------------------------------------------- */
      drawSky(c, t*.4, Object.assign({ sun:false, cloudLayers:[[.1,.6,120,.4],[.3,.9,200,.5]] },
              mode === 'duel' ? { top:'#2a0d3a', mid:'#6a1a5a', bot:'#ff7a6b' } : pack.sky));
      /* a couple of islands drifting behind the arena, for depth */
      for (let i=0;i<3;i++) {
        const x = ((i*128 + t*7) % (VW+90)) - 45, y = 60 + (i%2)*34;
        c.globalAlpha = .55;
        drawFloatIsland(c, x, y, 26, { seed:i+70, depth:18, vines:false,
          grass:shade(pack.col,-.2), grass2:shade(pack.col2,-.3), grass3:'#2a3450' });
        c.globalAlpha = 1;
      }
      /* the arena is a small disc the monster stands on */
      drawPlateau(c, VW/2, 172, 116, 22, 46, { seed:99,
        grass:pack.col, grass2:pack.col2, grass3:'#2a3450' });
      c.fillStyle = rgba(P.ink,.76); c.fillRect(0,198,VW,VH-198);
      hline(c, 0, 198, VW, rgba(pack.col,.5));

      /* --- the enemy ---------------------------------------------------- */
      const fx = foe.x + (shakeFoe > 0 ? rnd(-4,4) : 0);
      const fy = foe.y + foe.bob + (phase === 'intro' ? (1-ease.back(clamp(phaseT/.9,0,1)))*-140 : 0);
      if (foe.rival) {
        AV.draw(c, fx, 178, foe.cfg, phase === 'resolve' && act && act.type === 'foeStrike' ? 'attack' : 'idle',
                Math.floor(t*3)%2, { scale:2.6 });
      } else {
        const fsc = foe.boss ? 5 : 4;
        c.globalAlpha = .25; pxEllipse(c, fx, 172, 8*fsc, 2.4*fsc, '#000'); c.globalAlpha = 1;
        /* squash on impact, then an elastic overshoot back — cartoon weight */
        const fsq = shakeFoe > 0 ? 1 + shakeFoe*1.1 : 1 + Math.sin(t*2.4)*.03;
        const iw = Math.round(16*fsc*fsq), ih = Math.round(16*fsc*(2-fsq));
        const img = ART.get(foe.spr, foe.swap);
        c.drawImage(img, Math.round(fx-iw/2), Math.round(fy-ih/2), iw, ih);
        if (foeFlash > 0) spr(c, foe.spr, fx, fy, { center:true, scale:fsc, swap:foe.swap,
                                                     tint:'#ffffff', tintAmt:foeFlash*4 });
      }
      /* name + hp */
      const hpW = 190;
      ctxt(c, VW/2, 34, foe.name, P.white, 1, P.ink);
      bar(c, VW/2-hpW/2, 44, hpW, 9, foe.hp/foe.maxHp, foe.boss ? P.purple : P.red, { shine:t*.8 });
      if (mode !== 'duel') ctxt(c, VW/2, 56, Math.ceil(foe.hp) + ' / ' + foe.maxHp, P.bone, 1, P.ink);
      else ctxt(c, VW/2 - hpW/2 - 26, 45, Math.ceil(foe.hp), P.bone, 1, P.ink);
      /* intent */
      if (phase !== 'intro' && !foe.rival) {
        const ix = VW/2 + hpW/2 + 10;
        pbox(c, ix-4, 40, 30, 18, rgba(P.ink,.8), 3);
        spr(c, intent <= 1 ? 'i_flame' : 'i_sword', ix, 44, { scale:1 });
        txt(c, ix+13, 45, String(Math.max(1,intent)), intent <= 1 ? P.red : P.gold, 1);
      }
      if (mode === 'duel' && phase === 'q') {
        bar(c, VW/2-hpW/2, 56, hpW, 6, 1 - clamp((me.rivalT||8)/8,0,1), P.pink);
        ctxt(c, VW/2, 66, 'THEY ARE THINKING...', P.pink, 1, P.ink);
      }

      /* --- focus bar (the bar that fills up) ---------------------------- */
      const fby = 210;
      txt(c, 12, fby-1, 'FOCUS', P.cyan, 1, P.ink);
      bar(c, 48, fby-2, 200, 9, me.focus, ultReady ? P.gold : P.cyan, { shine:t*1.4, ticks:5 });
      if (me.combo > 1) {
        const s = 1 + Math.min(me.combo,10)*.06;
        ctxt(c, 300, fby-6, 'x' + me.combo, P.gold, Math.round(clamp(s,1,2)), P.ink);
        ctxt(c, 300, fby+6, 'COMBO', P.orange, 1, P.ink);
      }

      /* --- question ------------------------------------------------------ */
      if (phase === 'q' || phase === 'resolve') {
        const qy = 218;
        panel(c, 8, qy, VW-16, 84, '#241640', { r:4 });
        pbox(c, 8, qy, VW-16, 4, pack.col, 3);
        const lines = wrap(q.q, VW-36, 1);
        const sc = lines.length > 3 ? 1 : 1;
        lines.slice(0,5).forEach((l,i) => ctxt(c, VW/2, qy + 16 + i*11, l, P.white, sc, P.shadow));
        /* time ring */
        const frac = clamp(timeLeft/timeLimit,0,1);
        bar(c, 14, qy+72, VW-28, 6, frac, frac > .5 ? P.lime : frac > .25 ? P.gold : P.red, { shine:t*2 });
        txt(c, 14, qy+62, 'Q' + (answered+1), P.grey, 1);
        txt(c, VW-48, qy+62, Math.ceil(Math.max(0,timeLeft)) + 's', frac > .25 ? P.grey : P.red, 1);
      }

      /* --- answer cards --------------------------------------------------- */
      if ((phase === 'q' || phase === 'resolve') && !keypad) {
        const cw = 166, ch = 84, gx = 10, gy = 308;
        for (let i=0;i<cards.length;i++) {
          const cd = cards[i];
          const col = i%2, row = Math.floor(i/2);
          let x = gx + col*(cw+8), y = gy + row*(ch+8);
          let scale = 1, tilt = cd.tilt;
          /* entry bounce */
          const k = ease.back(cd.in);
          y += (1-k)*40; scale = .8 + .2*k;
          /* the chosen card flies at the enemy */
          if (act && act.i === i && act.type === 'strike') {
            const p2 = clamp(act.t/(act.dur*.55),0,1);
            const e2 = ease.in(p2);
            x = lerp(x, foe.x-cw/2, e2); y = lerp(y, foe.y-ch/2, e2);
            scale = lerp(1, .45, e2); tilt = lerp(cd.tilt, .9, e2);
            FX.trail(x+cw/2, y+ch/2, CONTENT.ELEM[cd.card.el].col);
          } else if (act && act.type === 'strike' && act.t < act.dur) {
            const e3 = ease.out(clamp(act.t/.3,0,1));
            y += e3*20; c.globalAlpha = 1-e3*.7;
          }
          if (act && act.type === 'miss' && act.i === i) {
            x += Math.sin(act.t*60)*5;
          }
          if (cd.dead) c.globalAlpha = .28;
          UI.card(c, x, y, cw, ch, { el:cd.card.el, tilt, scale, dim:cd.dead });
          /* card face */
          c.save();
          c.translate(x+cw/2, y+ch/2); if (tilt) c.rotate(tilt); if (scale!==1) c.scale(scale,scale);
          c.translate(-cw/2,-ch/2);
          const el = CONTENT.ELEM[cd.card.el];
          spr(c, el.icon, 6, 5, { scale:1 });
          txt(c, 21, 7, cd.card.n, rgba(P.white,.92), 1, P.shadow);
          pbox(c, cw-24, 4, 20, 14, rgba(P.ink,.7), 3);
          ctxt(c, cw-14, 7, String(cd.card.d), P.gold, 1);
          ctext(c, cw/2, 45, cd.opt, cw-22, 40, P.white, P.shadow, 2);
          hline(c, 8, ch-14, cw-16, rgba('#ffffff',.25));
          ctxt(c, cw/2, ch-11, el.name, rgba(P.white,.55), 1);
          c.restore();
          c.globalAlpha = 1;
          if (phase === 'q' && !cd.dead) {
            const z = UI.zone(x, y, cw, ch, 'c'+i);
            if (z.over) { c.globalAlpha = .18; pbox(c, x-2, y-2, cw+4, ch+4, P.white, 4); c.globalAlpha = 1; }
            if (z.click) answer(i);
          }
        }
      }

      /* --- type-it-in round ---------------------------------------------- */
      if ((phase === 'q' || phase === 'resolve') && keypad) {
        const gy = 318;
        ctxt(c, VW/2, 306, 'SOLVE IT - TYPE THE NUMBER', P.cyan, 1, P.ink);
        panel(c, 40, gy, VW-80, 34, '#2e1b50');
        ctxt(c, VW/2, gy+10, (typed || '?') + (Math.floor(t*2)%2 ? '_' : ''), P.gold, 3);
        const keys = ['789','456','123','-0.'];
        let ky = gy+42;
        for (let r=0;r<keys.length;r++) {
          for (let i=0;i<3;i++) {
            const ch2 = keys[r][i];
            if (UI.btn(c, 62 + i*80, ky, 72, 26, ch2, { col:'#3a2a5e', col2:'#5a4790', scale:2, key:'kp'+r+i })
                && phase === 'q') { if (typed.length < 7) typed += ch2; }
          }
          ky += 30;
        }
        if (UI.btn(c, 12, gy+42, 44, 26, 'DEL', { col:'#8a2a3a', col2:P.red }) && phase === 'q') typed = typed.slice(0,-1);
        if (UI.btn(c, VW-56, gy+42, 44, 86, 'GO', { col:'#1a7331', col2:'#3fe07a', scale:2 }) && phase === 'q') {
          const ok = typed !== '' && Math.abs(parseFloat(typed) - parseFloat(keypad)) < 1e-6;
          const i = cards.findIndex(cd => cd.opt === q.a);
          if (ok) answer(i); else { const w = cards.findIndex(cd => cd.opt !== q.a); answer(w < 0 ? 0 : w); }
        }
      }

      /* --- player strip --------------------------------------------------- */
      const py = 500;
      pbox(c, -2, py-6, VW+4, 60, rgba(P.ink,.85), 4);
      const pose = phase === 'resolve' && act && act.type === 'strike' ? 'attack'
                 : meFlash > 0 ? 'hurt' : phase === 'win' ? 'cheer' : 'idle';
      AV.draw(c, me.x, me.y, S.d.cfg, pose, Math.floor(t*3)%2, { scale:1.5 });
      if (meFlash > 0) { c.globalAlpha = meFlash*2; c.fillStyle = P.red;
                         c.fillRect(me.x-20, me.y-46, 40, 46); c.globalAlpha = 1; }
      txt(c, 96, py, S.d.name, P.white, 1, P.shadow);
      bar(c, 96, py+11, 150, 9, me.hp/me.maxHp, me.hp/me.maxHp > .3 ? P.green : P.red, { shine:t });
      txt(c, 96, py+23, Math.ceil(me.hp) + '/' + me.maxHp, P.bone, 1);
      spr(c, 'i_heart', 250, py+10);
      /* pet + egg */
      const p = S.pet();
      if (p) { const pd = S.petDef(p);
        spr(c, pd.spr, 288, py+18 + Math.sin(t*5)*2, { center:true });
        txt(c, 276, py+30, pd.name, P.lime, 1, P.shadow); }
      const egg = S.d.eggs[0];
      if (egg) { spr(c, 'i_egg', 330, py+10);
        bar(c, 322, py+24, 28, 4, egg.heat/egg.need, P.pink); }
      /* relics you have picked up */
      for (let i=0;i<relics.length;i++) {
        const rp = CONTENT.POWERS.find(x => x.id === relics[i]);
        const rx = 96 + i*15, ry = py+32;
        pbox(c, rx-1, ry-1, 14, 14, rgba(rp.col,.35), 2);
        spr(c, rp.icon, rx, ry, { scale:1 });
      }

      /* --- bottom: items + ultimate ---------------------------------------- */
      const by = 566;
      let ix = 8;
      for (const k in ITEMS) {
        const n = (S.items()[k]||0);
        const def = ITEMS[k];
        if (UI.btn(c, ix, by, 58, 30, 'x'+n, { col: n?'#2e1b50':'#1b1030', col2: n?'#4a3a70':'#241640',
                                               icon:def.icon, disabled: !n || phase !== 'q', key:'it'+k })) {
          if (S.useItem(k)) {
            if (k === 'elixir') { me.hp = Math.min(me.maxHp, me.hp+34); FX.float(me.x, me.y-46, '+34', P.green, { scale:2 }); SFX.play('heal'); }
            if (k === 'bomb')   { hitFoe(32, true, 'RUNE BOMB'); }
            if (k === 'hourglass') { timeLeft += 8; FX.float(VW/2, 290, '+8s', P.cyan, { scale:2 }); SFX.play('power'); }
            if (k === 'lens')   { burnOne(2); SFX.play('power'); FX.float(VW/2, 290, 'TWO BURNED', P.blue, { scale:1 }); }
          }
        }
        ix += 62;
      }
      if (UI.btn(c, 256, by, 96, 30, ultReady ? 'UNLEASH' : 'ULTIMATE',
                 { col: ultReady ? '#b3600f' : '#241640', col2: ultReady ? P.gold : '#3a2a5e',
                   txt: ultReady ? P.ink : P.grey, glow: ultReady ? P.white : null,
                   disabled: !ultReady || phase !== 'q' })) {
        phase = 'ult'; phaseT = 0; act = { landed:false };
        SFX.play('ult'); FX.slow(.5); FX.shake(9,.6);
      }

      /* --- overlays --------------------------------------------------------- */
      if (phase === 'intro') drawIntro(c);
      if (phase === 'ult') drawUlt(c);
      if (phase === 'hatch') drawHatch(c);
      if (draft) drawDraft(c);
      if (phase === 'win' || phase === 'lose') drawResult(c);

      if (phase === 'q' && UI.btn(c, VW-44, 4, 38, 18, 'FLEE', { col:'#3a2a5e', col2:'#5a4790' })) {
        S.addTrophies(mode === 'duel' ? -10 : -2); leave();
      }

      /* --- the tutor, in the middle of a fight ---------------------------- */
      if (phase === 'q' && !keypad && AI.available()) {
        if (UI.btn(c, VW-62, 284, 54, 16, hintUsed ? 'HINTED' : 'HINT',
                   { col: hintUsed ? '#241640' : '#2358c9', col2: hintUsed ? '#3a2a5e' : P.blue,
                     disabled: hintUsed, shadow:false })) {
          hintUsed = true;
          openTutor('A NUDGE', cb => AI.hint(q.q, cards.filter(x=>!x.dead).map(x=>x.opt), cb));
        }
      }
      if (phase === 'resolve' && lastWrong && act && act.type === 'miss' && AI.available()) {
        if (UI.btn(c, VW/2-70, 284, 140, 18, 'WHY WAS THAT WRONG?',
                   { col:'#8a2a10', col2:P.orange, shadow:false }))
          openTutor('WHY', cb => AI.explain(lastWrong.q, lastWrong.given, lastWrong.correct, cb));
      }
      if (aiPanel) drawTutorPanel(c);
    }
  };

  /* ---- the tutor overlay -------------------------------------------------- */
  function openTutor(label, fn) {
    aiPanel = { label, text:'', err:'', done:false };
    SFX.play('power');
    fn(({ text }) => { if (aiPanel) aiPanel.text = text; })
      .then(txt2 => { if (aiPanel) { aiPanel.text = txt2 || aiPanel.text; aiPanel.done = true; } })
      .catch(e => { if (aiPanel) { aiPanel.err = AI.errText(e); aiPanel.done = true; } });
  }
  function drawTutorPanel(c) {
    c.fillStyle = rgba(P.shadow,.92); c.fillRect(0,0,VW,VH);
    const boxY = 190;
    panel(c, 16, boxY, VW-32, 200, '#241640', { r:4 });
    pbox(c, 16, boxY, VW-32, 4, P.cyan, 3);
    AV.draw(c, 56, boxY+84, S.d.cfg, aiPanel.err ? 'hurt' : 'idle', Math.floor(t*3)%2,
            { scale:2, shadow:false });
    txt(c, 100, boxY+12, aiPanel.label === 'WHY' ? 'THE TUTOR SAYS' : 'A NUDGE', P.gold, 1);
    const body = aiPanel.err || aiPanel.text;
    if (!body) {
      txt(c, 100, boxY+34, 'thinking' + '.'.repeat(1+Math.floor(t*2)%3), P.grey, 1);
      bar(c, 100, boxY+50, VW-140, 5, (t*.4)%1, P.cyan, { shine:t*2 });
    } else {
      wrap(body, VW-70, 1).slice(0,11).forEach((l,i) =>
        txt(c, 30, boxY+34+i*13, l, aiPanel.err ? P.red : P.bone, 1));
    }
    if (aiPanel.label === 'WHY' && lastWrong && !aiPanel.err) {
      txt(c, 30, boxY+168, 'CORRECT: ' + String(lastWrong.correct).slice(0,30), P.lime, 1);
    }
    if (UI.btn(c, VW/2-70, boxY+176, 140, 22, aiPanel.done ? 'GOT IT' : 'SKIP',
               { col:'#1a7331', col2:'#3fe07a' })) {
      if (aiPanel.label === 'WHY' && aiPanel.done) S.dailyTick(0);
      aiPanel = null;
    }
  }

  /* ---- overlays ---------------------------------------------------------- */
  function drawIntro(c) {
    const k = clamp(phaseT/1.5,0,1);
    c.globalAlpha = k < .8 ? 1 : 1-(k-.8)/.2;
    const slide = ease.back(clamp(phaseT/.7,0,1));
    const y = 300;
    pbox(c, -20 + (1-slide)*-300, y, VW+40, 44, rgba(P.ink,.9), 4);
    ctxt(c, VW/2 + (1-slide)*-300, y+6, mode === 'boss' ? 'BOSS FIGHT' : mode === 'duel' ? 'RANKED DUEL' : 'BATTLE', P.red, 2, P.shadow);
    ctxt(c, VW/2 + (1-slide)*300, y+26, foe.name, P.white, 2, P.shadow);
    c.globalAlpha = 1;
  }
  function drawUlt(c) {
    const k = clamp(phaseT/1.3,0,1);
    c.fillStyle = rgba(P.ink, .5*(1-k)); c.fillRect(0,0,VW,VH);
    /* speed lines */
    for (let i=0;i<22;i++) {
      const y = (i*31 + t*400) % VH;
      c.fillStyle = rgba(pack.col, .5*(1-k));
      c.fillRect(0, y, VW, 2);
    }
    /* cut-in portrait */
    const slide = ease.back(clamp(phaseT/.35,0,1));
    const px2 = lerp(-120, 60, slide);
    AV.draw(c, px2, 340, S.d.cfg, 'attack', 1, { scale:4, glow:true });
    ctxt(c, VW/2+40, 250, 'ULTIMATE', P.gold, 4, P.ink);
    ctxt(c, VW/2+40, 290, S.d.name, P.white, 2, P.ink);
    /* slashes */
    if (phaseT > .3) {
      for (let i=0;i<5;i++) {
        const a = (phaseT-.3)*6 - i*.15;
        if (a < 0 || a > 1) continue;
        c.save(); c.translate(foe.x, foe.y); c.rotate(-.6 + i*.3);
        c.globalAlpha = 1-a;
        c.fillStyle = P.white;
        c.fillRect(-140*a, -2, 280*a, 4);
        c.restore(); c.globalAlpha = 1;
      }
    }
  }
  function drawHatch(c) {
    c.fillStyle = rgba(P.shadow,.93); c.fillRect(0,0,VW,VH);
    const k = clamp(phaseT/2.4,0,1);
    const pop = ease.back(clamp(phaseT/.6,0,1));
    ctxt(c, VW/2, 200, 'IT HATCHED!', P.gold, 3, P.ink);
    const pd = S.petDef(hatchPet);
    for (let i=0;i<12;i++) {
      const a = t*2 + i*TAU/12;
      c.fillStyle = rgba(P.pink,.6);
      c.fillRect(Math.round(VW/2+Math.cos(a)*(50+k*30)), Math.round(300+Math.sin(a)*(50+k*30)), 3, 3);
    }
    spr(c, pd.spr, VW/2, 300, { center:true, scale: 3*pop });
    ctxt(c, VW/2, 350, pd.name, P.lime, 2, P.ink);
    ctxt(c, VW/2, 372, '+' + pd.dmg + ' damage companion', P.white, 1, P.ink);
  }
  function drawDraft(c) {
    c.fillStyle = rgba(P.shadow,.95); c.fillRect(0,0,VW,VH);
    ctxt(c, VW/2, 120, 'FIVE ANSWERS.', P.white, 2, P.ink);
    ctxt(c, VW/2, 144, 'TAKE A RELIC', P.gold, 3, P.ink);
    for (let i=0;i<draft.length;i++) {
      const d = draft[i], p = d.p;
      const k = ease.back(clamp(d.in - i*.12, 0, 1));
      const y = 190 + i*120 + (1-k)*60;
      if (k <= 0) continue;
      c.globalAlpha = k;
      panel(c, 24, y, VW-48, 104, '#241640', { r:4 });
      pbox(c, 24, y, VW-48, 4, p.col, 3);
      /* the animated icon: spinning ring + bouncing sprite */
      const cx = 64, cy = y+52;
      for (let j=0;j<6;j++) {
        const a = t*2 + j*TAU/6;
        c.fillStyle = rgba(p.col,.65);
        c.fillRect(Math.round(cx+Math.cos(a)*22), Math.round(cy+Math.sin(a)*22), 3, 3);
      }
      c.globalAlpha = k*(.25+.15*Math.sin(t*4+i)); pxEllipse(c, cx, cy, 24, 24, p.col); c.globalAlpha = k;
      spr(c, p.icon, cx, cy + Math.sin(t*4+i)*3, { center:true, scale:2 });
      txt(c, 100, y+30, p.n, p.col, 2, P.shadow);
      wrap(p.d, VW-140, 1).forEach((l,j) => txt(c, 100, y+52+j*11, l, P.bone, 1));
      c.globalAlpha = 1;
      if (UI.btn(c, 100, y+72, 120, 24, 'TAKE IT', { col:'#1a7331', col2:'#3fe07a', key:'dr'+i })) { takeRelic(p); return; }
    }
  }
  function drawResult(c) {
    const won = phase === 'win';
    c.fillStyle = rgba(P.shadow,.95); c.fillRect(0,0,VW,VH);
    const k = ease.back(clamp(phaseT/.7,0,1));
    c.save(); c.translate(VW/2, 120); c.scale(k,k); c.translate(-VW/2,-120);
    ctxt(c, VW/2, 96, won ? 'VICTORY' : 'DEFEATED', won ? P.gold : P.red, 4, P.ink);
    c.restore();
    if (won) UI.stars(c, VW/2, 156, stars, 3, 2);
    AV.draw(c, VW/2, 260, S.d.cfg, won ? 'cheer' : 'hurt', Math.floor(t*3)%2, { scale:3 });

    panel(c, 30, 286, VW-60, 150, '#241640', { r:4 });
    const rows = [
      ['ACCURACY', Math.round((answered?correct/answered:0)*100) + '%   (' + correct + '/' + answered + ')', P.cyan],
      ['BEST COMBO', 'x' + me.best, P.orange],
      ['XP', '+' + rewards.xp, P.lime],
      ['COINS', '+' + rewards.coins, P.gold],
      ['TROPHIES', (rewards.trophies >= 0 ? '+' : '') + rewards.trophies, rewards.trophies >= 0 ? P.gold : P.red]
    ];
    if (rewards.wood) rows.push(['MATERIALS', '+' + rewards.wood + ' WOOD  +' + rewards.stone + ' STONE', P.bone]);
    rows.forEach((r,i) => {
      const y = 296 + i*22;
      if (phaseT < .3 + i*.12) return;
      txt(c, 42, y, r[0], P.grey, 1);
      const w = tw(r[1],1);
      txt(c, VW-42-w, y, r[1], r[2], 1, P.shadow);
    });
    if (rewards.chest && phaseT > 1) {
      const bob = Math.sin(t*3)*2;
      ctxt(c, VW/2, 446, 'A CHEST DROPPED', RARITY[rewards.chest].col, 1, P.ink);
      spr(c, 'chestSm', VW/2, 476+bob, { center:true, scale:2 });
      c.globalAlpha = .3+.2*Math.sin(t*5);
      pxEllipse(c, VW/2, 476, 30, 14, RARITY[rewards.chest].glow); c.globalAlpha = 1;
    }
    if (UI.btn(c, 30, 520, 140, 34, 'HOME', { col:'#3a2a5e', col2:'#5a4790', scale:1 })) leave('island');
    if (UI.btn(c, 190, 520, 140, 34, won ? 'CONTINUE' : 'RETRY',
               { col:'#1a7331', col2:'#3fe07a', glow:P.gold, scale:1 })) {
      if (!won) Game.go('battle', { mode, packId, node, rival:foeRival, deckId: deck ? deck.id : null });
      else if (S.d.chests.length) Game.go('chest');
      else leave();
    }
  }
  function leave(where) {
    if (where === 'island' || mode === 'duel') Game.go(mode === 'duel' ? 'rank' : 'island');
    else if (mode === 'custom') Game.go('map');
    else Game.go('map', { packId });
  }
})());
