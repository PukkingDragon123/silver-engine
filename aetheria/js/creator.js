/* =========================================================================
   CREATOR — you arrive on a small island with nothing and decide who you
   are. Four tabs, live preview, and a keyboard made of pixels.
   ========================================================================= */
Game.register('creator', (() => {
  let t = 0, tab = 0, cfg, name, bob, petals = 0, entered = 0;
  const TABS = ['CAT','COAT','FIT','NAME'];
  const GENDERS = [
    { k:'girl', label:'GIRL',  body:0, pattern:3 },
    { k:'boy',  label:'BOY',   body:1, pattern:1 },
    { k:'them', label:'THEM',  body:0, pattern:5 }
  ];
  const KEYS = ['ABCDEFG','HIJKLMN','OPQRSTU','VWXYZ_'];

  /* a row of colour chips; returns the index tapped, or -1 */
  function swatches(c, x, y, cols, size, list, sel, key) {
    let picked = -1;
    for (let i=0;i<list.length;i++) {
      const cx = x + (i % cols) * (size+4), cy = y + Math.floor(i/cols) * (size+4);
      const z = UI.zone(cx, cy, size, size, key+i);
      const on = i === sel;
      const lift = z.down ? 2 : 0;
      pbox(c, cx-1, cy-1+lift, size+2, size+2, on ? P.gold : P.ink, 2);
      pbox(c, cx, cy+lift, size, size, list[i], 2);
      c.fillStyle = shade(list[i], .4); c.fillRect(cx+1, cy+1+lift, size-2, 1);
      c.fillStyle = shade(list[i], -.3); c.fillRect(cx+1, cy+size-2+lift, size-2, 1);
      if (on) { c.fillStyle = P.white; c.fillRect(cx+size/2-1, cy-4, 2, 2); }
      if (z.click) { picked = i; SFX.play('tap'); FX.stars(cx+size/2, cy+size/2, 5, list[i]); }
    }
    return picked;
  }
  function chips(c, x, y, w, labels, sel, key, perRow) {
    perRow = perRow || labels.length;
    let picked = -1;
    const cw = Math.floor((w - (perRow-1)*5) / perRow);
    for (let i=0;i<labels.length;i++) {
      const cx = x + (i%perRow)*(cw+5), cy = y + Math.floor(i/perRow)*27;
      const on = i === sel;
      if (UI.btn(c, cx, cy, cw, 22, labels[i],
                 { col: on ? '#b3600f' : '#3a2a5e', col2: on ? P.gold : '#5a4790',
                   txt: on ? P.ink : P.white, key:key+i })) picked = i;
    }
    return picked;
  }

  return {
    enter() {
      t = 0; tab = 0; entered = 0;
      cfg = Object.assign(AV.defaults(), S.d.cfg);
      name = S.d.made ? S.d.name : '';
      bob = 0;
      SFX.music(true);
    },
    update(dt) { t += dt; petals += dt; entered = Math.min(1, entered + dt*1.6); },

    draw(c) {
      /* --- backdrop: a lone island in a warm sky ------------------------ */
      drawSky(c, t, { top:'#5b2f9e', mid:'#c05fb0', bot:'#ffd0a8', sunX:252, sunY:62,
                      cloudLayers:[[.18,.5,140,.45],[.4,.8,220,.6]] });
      for (let i=0;i<3;i++) {
        const x = 46 + i*128, y = 112 + (i%2)*34 + Math.sin(t*.5+i)*4;
        drawFloatIsland(c, x, y, 40+i*8, { seed:i+4, depth:26, vines:true });
        drawTree(c, x, y, .5, i+9);
      }
      const gy = 286 + Math.sin(t*.7)*2;
      drawFloatIsland(c, VW/2, gy, 190, { seed:11, depth:52, grassH:9 });
      drawTree(c, VW/2-72, gy+3, 1.1, 3, { fruit:P.red });
      drawBush(c, VW/2+68, gy+4, 1, 6);
      drawRock(c, VW/2+84, gy+5, .8, 7);
      spr(c, 'flower', VW/2-30, gy-4, { scale:1 });
      spr(c, 'flower2', VW/2+34, gy-3, { scale:1 });
      spr(c, 'mushroom', VW/2+12, gy-6);

      /* petals drifting past */
      if (petals > .25) { petals = 0; FX.leaves(rnd(0,VW), -8, 1); }

      /* --- the star of the show ---------------------------------------- */
      const anim = Math.floor(t*3) % 2;
      const pose = tab === 3 ? 'wave' : (Math.floor(t) % 7 === 6 ? 'dance' : 'idle');
      const pf = pose === 'wave' ? anim : anim;
      const sc = 3;
      const ay = gy - 4 + Math.sin(t*2.2)*2;
      /* glow puddle */
      c.globalAlpha = .25; pxEllipse(c, VW/2, ay, 34, 10, P.gold); c.globalAlpha = 1;
      AV.draw(c, VW/2, ay, cfg, pose, pf, { scale:sc });
      if (Math.random() < .08) FX.stars(VW/2 + rnd(-30,30), ay - rnd(10,70), 1, P.gold);

      /* --- title -------------------------------------------------------- */
      const slide = ease.back(entered);
      c.save(); c.translate(0, (1-slide)*-60);
      ctxt(c, VW/2, 14, 'WHICH CAT ARE YOU?', P.white, 2, P.ink);
      ctxt(c, VW/2, 32, 'the sky is waiting, and so is the exam', rgba(P.white,.8), 1, P.ink);
      c.restore();

      /* --- tabs --------------------------------------------------------- */
      const tabY = 318, tw2 = 80;
      for (let i=0;i<TABS.length;i++) {
        const x = 8 + i*(tw2+4);
        if (UI.btn(c, x, tabY, tw2, 22, TABS[i],
                   { col: tab===i ? '#6a27c8' : '#2e1b50', col2: tab===i ? P.purple : '#3f2a68',
                     txt: tab===i ? P.white : P.grey })) { tab = i; }
      }

      /* --- panel -------------------------------------------------------- */
      const py = 344, ph = 236;
      panel(c, 8, py, VW-16, ph, rgba('#1b1030',.92), { r:4 });

      if (tab === 0) {
        ctxt(c, VW/2, py+8, 'PICK YOUR CAT', P.gold, 1);
        const gi = GENDERS.findIndex(g => g.k === (cfg.gender||'girl'));
        const g = chips(c, 18, py+20, VW-36, GENDERS.map(x=>x.label), gi < 0 ? 0 : gi, 'gen');
        if (g >= 0) { cfg.gender = GENDERS[g].k; cfg.body = GENDERS[g].body;
                      if (!cfg.touchedCoat) cfg.pattern = GENDERS[g].pattern; SFX.play('power'); }
        ctxt(c, VW/2, py+56, 'FUR', P.grey, 1);
        const sk = swatches(c, 22, py+70, 6, 48, AV.FURS, cfg.fur, 'fu');
        if (sk >= 0) cfg.fur = sk;
        ctxt(c, VW/2, py+176, 'BUILD', P.grey, 1);
        const b = chips(c, 60, py+190, VW-120, ['LITHE','CHONK'], cfg.body, 'bd');
        if (b >= 0) cfg.body = b;
      } else if (tab === 1) {
        ctxt(c, VW/2, py+8, 'COAT PATTERN', P.gold, 1);
        const h = chips(c, 18, py+20, VW-36, AV.PATTERNS.map(s=>s.toUpperCase()), cfg.pattern, 'pt', 3);
        if (h >= 0) { cfg.pattern = h; cfg.touchedCoat = 1; }
        ctxt(c, VW/2, py+90, 'MARKINGS', P.gold, 1);
        const hc = swatches(c, 22, py+104, 6, 48, AV.MARKS, cfg.mark, 'mk');
        if (hc >= 0) cfg.mark = hc;
        ctxt(c, VW/2, py+210, 'stripes, patches and points use this colour', P.grey, 1);
      } else if (tab === 2) {
        ctxt(c, VW/2, py+8, 'EYES', P.gold, 1);
        const ey = swatches(c, 48, py+20, 7, 36, AV.EYES, cfg.eyes, 'ey');
        if (ey >= 0) cfg.eyes = ey;
        ctxt(c, VW/2, py+64, 'WHAT THEY WEAR', P.gold, 1);
        const tp = chips(c, 18, py+76, VW-36, AV.OUTFITS.map(s=>s.toUpperCase()), cfg.outfit, 'of', 2);
        if (tp >= 0) cfg.outfit = tp;
        ctxt(c, VW/2, py+136, 'COLOUR', P.gold, 1);
        const sc2 = swatches(c, 32, py+150, 5, 48, AV.SHIRTS, cfg.shirtCol, 'sc');
        if (sc2 >= 0) cfg.shirtCol = sc2;
      } else {
        ctxt(c, VW/2, py+6, 'YOUR NAME', P.gold, 1);
        panel(c, 60, py+18, VW-120, 22, '#2e1b50');
        const shown = name || '';
        ctxt(c, VW/2, py+25, shown + (Math.floor(t*2)%2 ? '_' : ' '), P.white, 2);
        let ky = py+46;
        for (let r=0;r<KEYS.length;r++) {
          const row = KEYS[r], kw = 40, gap = 3;
          const total = row.length*kw + (row.length-1)*gap;
          for (let i=0;i<row.length;i++) {
            const ch = row[i];
            if (UI.btn(c, VW/2-total/2 + i*(kw+gap), ky, kw, 22, ch === '_' ? '-' : ch,
                       { col:'#3a2a5e', col2:'#5a4790', key:'k'+r+i })) {
              if (name.length < 9) { name += ch === '_' ? ' ' : ch; SFX.play('tap'); }
            }
          }
          ky += 25;
        }
        if (UI.btn(c, 22, py+172, 66, 22, 'DEL', { col:'#8a2a3a', col2:P.red })) name = name.slice(0,-1);
        if (UI.btn(c, VW-88, py+172, 66, 22, 'CLEAR', { col:'#8a2a3a', col2:P.red })) name = '';
      }

      /* --- bottom actions ------------------------------------------------ */
      if (UI.btn(c, 12, 592, 104, 30, 'SURPRISE', { col:'#6a27c8', col2:P.purple, scale:1 })) {
        const g = pick(GENDERS);
        cfg = Object.assign(AV.randomCfg(), { gender:g.k, body:g.body, touchedCoat:1 });
        SFX.play('power'); FX.stars(VW/2, gy-40, 14);
      }
      const ready = (name.trim().length > 0) || tab !== 3;
      if (UI.btn(c, 126, 592, VW-138, 30, S.d.made ? 'SAVE LOOK' : 'ENTER AETHERIA',
                 { col:'#1a7331', col2:'#3fe07a', glow:P.gold, scale:1, disabled:!ready })) {
        S.d.cfg = cfg;
        S.d.name = (name.trim() || 'SCHOLAR').toUpperCase();
        S.d.made = true;
        S.save();
        SFX.play('levelup');
        FX.confetti(VW/2, 300, 60);
        Game.go('island', { welcome:true });
      }
      if (S.d.made && UI.btn(c, 8, 8, 44, 24, '<', { col:'#4a3a70', col2:'#6b56a0' })) Game.go('island');
    }
  };
})());
