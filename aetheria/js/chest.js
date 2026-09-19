/* =========================================================================
   CHEST — the payoff loop. Answer one question to get the lid open, swipe
   it apart with your thumb, then flip the rewards over one at a time and
   find out how lucky you were.
   ========================================================================= */
Game.register('chest', (() => {
  let t, chest, phase, phaseT, q, crack, swipeAcc, lastX, lastY, rewards, revealed, shake, rar;

  const SLOT_POOL = [
    { key:'coins',   icon:'i_coin',    base:70,  spread:90 },
    { key:'wood',    icon:'i_wood',    base:22,  spread:30 },
    { key:'stone',   icon:'i_stone',   base:16,  spread:24 },
    { key:'essence', icon:'i_essence', base:7,   spread:12 },
    { key:'gems',    icon:'i_gem',     base:1,   spread:2 },
    { key:'egg',     icon:'i_egg',     base:1,   spread:0 }
  ];
  const RMUL = { common:1, rare:1.7, epic:2.8, legendary:4.6 };

  function rollRewards() {
    const n = { common:3, rare:4, epic:4, legendary:5 }[chest.rarity];
    const out = [];
    const pool = SLOT_POOL.filter(s => s.key !== 'egg' || chest.rarity !== 'common');
    for (let i=0;i<n;i++) {
      const s = i === n-1 && (chest.rarity === 'epic' || chest.rarity === 'legendary')
                ? (Math.random() < .55 ? SLOT_POOL[5] : SLOT_POOL[4]) : pick(pool);
      const amt = s.key === 'egg' ? 1
                : Math.max(1, Math.round((s.base + rnd(0,s.spread)) * RMUL[chest.rarity] * (bonus ? 1.25 : 1)));
      /* each slot rolls its own little rarity for the flash */
      const r = amt > (s.base+s.spread)*RMUL[chest.rarity]*.8 ? 'epic'
              : amt > (s.base+s.spread*.5)*RMUL[chest.rarity]*.6 ? 'rare' : 'common';
      out.push({ ...s, amt, rar: s.key === 'egg' ? 'legendary' : s.key === 'gems' ? 'epic' : r, flip:0 });
    }
    return out;
  }
  let bonus = false;

  function grant(r) {
    if (r.key === 'egg') S.addEgg(pick(S.PET_TYPES).id);
    else S.give(r.key, r.amt);
    S.save();
  }

  return {
    enter() {
      t = 0; phaseT = 0; crack = 0; swipeAcc = 0; lastX = null; lastY = null; revealed = -1; shake = 0; bonus = false;
      chest = S.d.chests[0];
      if (!chest) { Game.go('island', null, true); return; }
      rar = RARITY[chest.rarity];
      const pk = CONTENT.pack(chest.packId);
      q = CONTENT.question(pk ? pk.bank : pick(CONTENT.PACKS).bank);
      phase = 'quiz';
      rewards = [];
      SFX.music(false); SFX.duck(.05);
    },
    exit() { SFX.duck(.16); SFX.music(true); },
    back() { if (phase === 'done') Game.go('island'); },

    update(dt) {
      t += dt; phaseT += dt;
      if (shake > 0) shake -= dt;
      if (phase === 'swipe') {
        if (Input.down) {
          if (lastX != null) swipeAcc += Math.abs(Input.x - lastX) + Math.abs(Input.y - (lastY||Input.y))*.5;
          lastX = Input.x; lastY = Input.y;
          if (swipeAcc > 110) {
            swipeAcc = 0; crack++;
            shake = .25; SFX.play('swipe'); FX.shake(5,.2);
            FX.burst(VW/2, 300, 16, [rar.col, P.white, P.gold], { speed:150, g:180 });
            FX.ring(VW/2, 300, rar.glow, { r1:70 });
            if (crack >= 3) {
              phase = 'burst'; phaseT = 0;
              rewards = rollRewards();
              SFX.play('chest'); SFX.play('rarity', ['common','rare','epic','legendary'].indexOf(chest.rarity));
              FX.confetti(VW/2, 300, 90); FX.flash(rar.glow, .2); FX.shake(9,.5);
            }
          }
        } else { lastX = null; lastY = null; }
      }
      if (phase === 'burst' && phaseT > .8) { phase = 'reveal'; phaseT = 0; revealed = 0; flipIn(); }
      if (phase === 'reveal' && rewards[revealed]) rewards[revealed].flip = Math.min(1, rewards[revealed].flip + dt*3.4);
    },

    draw(c) {
      /* --- vault backdrop ---------------------------------------------- */
      drawSky(c, t*.3, { top:'#150a2e', mid:'#2e1b50', bot:shade(rar.col,-.55), sun:false, stars:true });
      c.fillStyle = rgba(P.ink,.58); c.fillRect(0,0,VW,VH);
      /* god rays */
      for (let i=0;i<10;i++) {
        const a = t*.35 + i*TAU/10;
        c.save(); c.translate(VW/2, 300); c.rotate(a);
        c.globalAlpha = phase === 'quiz' ? .07 : .16;
        c.fillStyle = rar.glow;
        c.beginPath(); c.moveTo(0,0); c.lineTo(400,-22); c.lineTo(400,22); c.closePath(); c.fill();
        c.restore(); c.globalAlpha = 1;
      }

      ctxt(c, VW/2, 40, rar.name + ' CHEST', rar.col, 3, P.ink);
      ctxt(c, VW/2, 68, S.d.chests.length + ' ' + plural(S.d.chests.length,'chest') + ' waiting', P.grey, 1);

      /* --- the chest itself --------------------------------------------- */
      if (phase !== 'reveal' && phase !== 'done') {
        const jit = shake > 0 ? rnd(-4,4) : 0;
        const bob = Math.sin(t*2)*3;
        const sc = phase === 'burst' ? 6 + ease.out(clamp(phaseT/.4,0,1))*3 : 6;
        const al = phase === 'burst' ? 1 - clamp(phaseT/.7,0,1) : 1;
        for (let g=3;g>0;g--) {
          c.globalAlpha = (.07 + .04*Math.sin(t*4)) * g;
          pxEllipse(c, VW/2, 318, 26*g, 9*g, rar.glow);
        }
        c.globalAlpha = 1;
        spr(c, 'chestSm', VW/2 + jit, 284 + bob, { center:true, scale:sc, alpha:al });
        /* cracks */
        c.globalAlpha = al;
        for (let i=0;i<crack;i++) {
          c.fillStyle = P.white;
          const r = srnd(90+i);
          for (let j=0;j<9;j++) {
            const x = VW/2 - 30 + r()*60, y = 258 + r()*52;
            c.fillRect(Math.round(x), Math.round(y), 2, 2);
          }
        }
        c.globalAlpha = 1;
      }

      /* --- phases -------------------------------------------------------- */
      if (phase === 'quiz') {
        panel(c, 12, 388, VW-24, 68, '#241640', { r:4 });
        ctxt(c, VW/2, 372, 'ANSWER TO UNLOCK IT', P.gold, 1, P.ink);
        wrap(q.q, VW-44, 1).forEach((l,i) => ctxt(c, VW/2, 398+i*11, l, P.white, 1, P.shadow));
        for (let i=0;i<q.o.length;i++) {
          const x = 12 + (i%2)*(170+8), y = 466 + Math.floor(i/2)*50;
          if (UI.btnWrap(c, x, y, 170, 42, q.o[i], { key:'q'+i })) {
            const ok = q.o[i] === q.a;
            S.dailyTick(1); S.sawCard('chest', q.q, q.a); S.gotCard('chest', q.q, ok);
            bonus = ok;
            if (ok) { SFX.play('correct'); FX.stars(VW/2, 300, 16, P.gold);
                      UI.toast('CORRECT — RICHER CHEST', P.gold, 'i_star'); }
            else { SFX.play('wrong'); UI.toast('wrong — it still opens, just meaner', P.red); }
            phase = 'swipe'; phaseT = 0;
          }
        }
      } else if (phase === 'swipe') {
        ctxt(c, VW/2, 396, 'SWIPE TO CRACK IT OPEN', P.white, 2, P.ink);
        const hand = Math.sin(t*3)*40;
        c.fillStyle = rgba(P.white,.5);
        for (let i=0;i<6;i++) c.fillRect(Math.round(VW/2 - 60 + i*22 + hand*.2), 424, 12, 3);
        bar(c, 60, 440, VW-120, 10, crack/3 + swipeAcc/110/3, rar.col, { shine:t*2, ticks:3 });
        ctxt(c, VW/2, 458, (3-crack) + ' ' + plural(3-crack,'lock') + ' left', P.grey, 1);
      } else if (phase === 'burst') {
        ctxt(c, VW/2, 420, 'OPEN!', rar.col, 4, P.ink);
      } else if (phase === 'reveal' || phase === 'done') {
        drawReveal(c);
      }

      if (phase !== 'reveal' && phase !== 'done' &&
          UI.btn(c, 8, 8, 40, 22, '<', { col:'#4a3a70', col2:'#6b56a0' })) Game.go('island');
    }
  };

  function flipIn() {
    const r = rewards[revealed];
    if (!r) return;
    SFX.play('rarity', ['common','rare','epic','legendary'].indexOf(r.rar));
    FX.confetti(VW/2, 300, r.rar === 'legendary' ? 70 : 30);
    FX.ring(VW/2, 300, RARITY[r.rar].glow, { r1:90, w:3 });
    if (r.rar === 'legendary') { FX.flash(RARITY[r.rar].glow, .18); FX.shake(7,.4); }
    grant(r);
  }

  function drawReveal(c) {
    const r = rewards[revealed];
    /* the little row of pips showing how many are left */
    for (let i=0;i<rewards.length;i++) {
      const x = VW/2 - rewards.length*9 + i*18;
      pbox(c, x, 100, 12, 12, i <= revealed ? RARITY[rewards[i].rar].col : '#3a2a5e', 2);
    }
    if (r) {
      const k = ease.back(r.flip);
      const rr = RARITY[r.rar];
      /* rays behind the card */
      for (let i=0;i<14;i++) {
        const a = t*.8 + i*TAU/14;
        c.save(); c.translate(VW/2, 300); c.rotate(a);
        c.globalAlpha = .18*k; c.fillStyle = rr.glow;
        c.beginPath(); c.moveTo(0,0); c.lineTo(340,-16); c.lineTo(340,16); c.closePath(); c.fill();
        c.restore(); c.globalAlpha = 1;
      }
      c.save(); c.translate(VW/2, 300); c.scale(k, k); c.translate(-VW/2, -300);
      panel(c, VW/2-76, 210, 152, 180, shade(rr.col,-.62), { r:4 });
      pbox(c, VW/2-76, 210, 152, 5, rr.col, 3);
      spr(c, r.icon, VW/2, 282, { center:true, scale:4 });
      ctxt(c, VW/2, 330, r.key === 'egg' ? 'MYSTERY EGG' : 'x' + commas(r.amt), P.white, 3, P.ink);
      ctxt(c, VW/2, 358, r.key.toUpperCase(), rr.col, 1);
      ctxt(c, VW/2, 372, rr.name, rr.col, 1);
      c.restore();
      /* sparkle halo for the good ones */
      if (r.rar === 'legendary' || r.rar === 'epic') {
        for (let i=0;i<8;i++) {
          const a = t*2 + i*TAU/8, rad = 100 + Math.sin(t*3+i)*10;
          c.fillStyle = rr.glow;
          c.fillRect(Math.round(VW/2+Math.cos(a)*rad), Math.round(300+Math.sin(a)*rad*.7), 3, 3);
        }
      }
    }
    const last = revealed >= rewards.length-1;
    if (UI.btn(c, 70, 430, VW-140, 38, last ? 'TAKE IT ALL' : 'NEXT', { col:'#1a7331', col2:'#3fe07a', glow:P.gold, scale:2 })) {
      if (last) {
        S.d.chests.shift(); S.save();
        SFX.play('levelup'); FX.confetti(VW/2, 300, 60);
        if (S.d.chests.length) Game.go('chest', null, true); else Game.go('island');
      } else { revealed++; flipIn(); }
    }
    ctxt(c, VW/2, 486, 'everything here is already in your pack', P.grey, 1);
    if (S.d.chests.length > 1 && last) ctxt(c, VW/2, 500, 'another chest is waiting', P.gold, 1);
  }
})());
