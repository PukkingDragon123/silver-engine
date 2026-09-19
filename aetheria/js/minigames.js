/* =========================================================================
   MINI GAMES — the stops that are not a fight.

   MATCH-UP   pair the term with the meaning before the clock runs out
   SEQUENCE   put the stages in order (mitosis, solving steps, sizes)
   GRAPH LAB  drag a line onto a mystery line and read off m and c
   CHOP/MINE  a timing bar, a swinging axe, and questions for bonus hauls
   ========================================================================= */
Game.register('minigame', (() => {
  let t, kind, packId, node, pack, bank, done, res, sub;

  function finish(ok, score, loot, statLine) {
    done = { ok, score, loot, statLine, t:0 };
    if (ok) {
      const stars = score >= .92 ? 3 : score >= .7 ? 2 : 1;
      if (packId != null && node != null) S.clearNode(packId, node, stars);
      done.stars = stars;
      for (const k in loot) S.give(k, loot[k]);
      S.pushChest(S.rollRarity(score > .9 ? .2 : 0), packId);
      S.addTrophies(4 + stars*2);
      SFX.play('win'); FX.confetti(VW/2, 220, 60);
    } else { SFX.play('lose'); }
    S.save();
  }
  function leave() {
    if (packId != null) Game.go('map', { packId });
    else Game.go('island');
  }

  function drawDone(c) {
    c.fillStyle = rgba(P.shadow,.95); c.fillRect(0,0,VW,VH);
    const k = ease.back(clamp(done.t/.7,0,1));
    c.save(); c.translate(VW/2,160); c.scale(k,k); c.translate(-VW/2,-160);
    ctxt(c, VW/2, 140, done.ok ? 'CLEARED' : 'MISSED IT', done.ok ? P.gold : P.red, 4, P.ink);
    c.restore();
    if (done.ok) UI.stars(c, VW/2, 200, done.stars, 3, 2);
    AV.draw(c, VW/2, 320, S.d.cfg, done.ok ? 'cheer' : 'idle', Math.floor(t*3)%2, { scale:3 });
    panel(c, 40, 340, VW-80, 110, '#241640', { r:4 });
    ctxt(c, VW/2, 352, done.statLine, P.cyan, 1);
    let i = 0;
    if (!done.ok || !Object.keys(done.loot||{}).length)
      ctxt(c, VW/2, 396, 'no haul this time — the stop stays open', P.grey, 1);
    for (const key in (done.loot||{})) {
      const y = 372 + i*20; i++;
      spr(c, key === 'xp' ? 'i_book' : 'i_'+key, 70, y);
      txt(c, 90, y+3, '+' + done.loot[key] + '  ' + key.toUpperCase(), P.gold, 1, P.shadow);
    }
    if (UI.btn(c, 40, 470, 130, 32, 'AGAIN', { col:'#3a2a5e', col2:'#5a4790' }))
      Game.go('minigame', { kind, packId, node });
    if (UI.btn(c, 190, 470, 130, 32, 'DONE', { col:'#1a7331', col2:'#3fe07a', glow:P.gold })) leave();
  }

  /* ==== MATCH-UP ======================================================== */
  const Match = {
    init(bank) {
      const pairs = (CONTENT.MATCHES[bank] || CONTENT.MATCHES.cells).slice(0,6);
      const tiles = [];
      pairs.forEach((p,i) => { tiles.push({ txt:p[0], pair:i, gone:false, pop:0 });
                               tiles.push({ txt:p[1], pair:i, gone:false, pop:0 }); });
      return { tiles:shuffle(tiles), sel:-1, left:6, time:60, wrong:0, flash:0 };
    },
    update(dt, s, finish) {
      s.time -= dt;
      if (s.flash > 0) s.flash -= dt;
      for (const tl of s.tiles) if (tl.pop > 0) tl.pop -= dt;
      if (s.time <= 0) finish(false, 0, {}, 'ran out of time');
    },
    draw(c, s, t) {
      UI.header(c, 34, 'MATCH-UP', 'pair each one with its meaning', P.blue);
      bar(c, 30, 78, VW-60, 8, s.time/60, s.time > 15 ? P.lime : P.red, { shine:t });
      ctxt(c, VW/2, 90, Math.ceil(s.time) + 's   ' + (6-s.left) + '/6 PAIRED   ' + s.wrong + ' MISSES', P.bone, 1);
      const cols = 2, tw2 = 166, th = 74, gx = 12, gy = 106;
      for (let i=0;i<s.tiles.length;i++) {
        const tl = s.tiles[i];
        const x = gx + (i%cols)*(tw2+8), y = gy + Math.floor(i/cols)*(th+8);
        if (tl.gone && tl.pop <= 0) continue;
        let sc = 1;
        if (tl.pop > 0) sc = 1 + Math.sin((1-tl.pop/.4)*Math.PI)*.35;
        const selected = s.sel === i;
        c.save(); c.translate(x+tw2/2, y+th/2); c.scale(sc,sc); c.translate(-tw2/2,-th/2);
        panel(c, 0, 0, tw2, th, selected ? '#6a4a10' : tl.gone ? '#1a5a33' : '#2e1b50', { r:3 });
        if (selected) pbox(c, 0, 0, tw2, 3, P.gold, 2);
        ctext(c, tw2/2, th/2, tl.txt, tw2-14, th-10, tl.gone ? P.lime : P.white, P.shadow, 2);
        c.restore();
        if (!tl.gone) {
          const z = UI.zone(x, y, tw2, th, 'm'+i);
          if (z.click) {
            SFX.play('tap');
            if (s.sel === i) s.sel = -1;
            else if (s.sel < 0) s.sel = i;
            else {
              const a = s.tiles[s.sel];
              if (a.pair === tl.pair) {
                a.gone = tl.gone = true; a.pop = tl.pop = .4; s.left--;
                SFX.play('correct');
                FX.stars(x+tw2/2, y+th/2, 12, P.lime);
                FX.float(x+tw2/2, y, 'PAIR!', P.lime, { scale:2 });
                S.dailyTick(1);
                if (s.left === 0) {
                  const score = clamp(1 - s.wrong*.12, .3, 1);
                  finish(true, score, { wood:14, coins:40, xp:26 },
                         'paired all six with ' + s.wrong + ' ' + plural(s.wrong,'miss','misses'));
                }
              } else {
                s.wrong++; s.time -= 3; SFX.play('wrong'); FX.shake(4,.2);
                FX.float(x+tw2/2, y, '-3s', P.red, { scale:2 });
              }
              s.sel = -1;
            }
          }
        }
      }
    }
  };

  /* ==== SEQUENCE ======================================================== */
  const Seq = {
    init(bank) {
      const d = CONTENT.SEQUENCES[bank] || CONTENT.SEQUENCES.cells;
      return { title:d.title, order:d.items, pool:shuffle(d.items.map((x,i)=>({ x, i }))),
               slots:[], tries:0, shake:0 };
    },
    update(dt, s) { if (s.shake > 0) s.shake -= dt; },
    draw(c, s, t, finishArg) {
      UI.header(c, 34, 'SEQUENCE', 'tap them in the right order', P.cyan);
      wrap(s.title, VW-40, 1).forEach((l,i) => ctxt(c, VW/2, 76+i*11, l, P.gold, 1));
      /* slots */
      for (let i=0;i<s.order.length;i++) {
        const y = 100 + i*44, has = s.slots[i];
        const jitter = s.shake > 0 ? Math.sin(t*50)*4 : 0;
        panel(c, 16+jitter, y, VW-32, 38, has ? '#1a5a33' : '#241640', { r:3 });
        pbox(c, 20+jitter, y+9, 20, 20, rgba(P.gold,.25), 3);
        ctxt(c, 30+jitter, y+14, String(i+1), P.gold, 1);
        if (has) {
          ctext(c, (VW+40)/2+jitter, y+19, has.x, VW-110, 30, P.white, P.shadow, 2);
          const z = UI.zone(16, y, VW-32, 38, 'sl'+i);
          if (z.click) { s.pool.push(has); s.slots[i] = null; SFX.play('back');
                         s.slots = s.slots.filter(Boolean); }
        }
      }
      /* pool */
      let py = 100 + s.order.length*44 + 4;
      txt(c, 16, py, 'TAP TO PLACE', P.grey, 1); py += 12;
      for (let i=0;i<s.pool.length;i++) {
        const x = 16 + (i%2)*(166+8), y = py + Math.floor(i/2)*30;
        if (UI.btnWrap(c, x, y, 166, 26, s.pool[i].x, { key:'pl'+i, maxScale:1 })) {
          s.slots.push(s.pool[i]); s.pool.splice(i,1);
          SFX.play('tap'); FX.stars(x+80, y+12, 4, P.cyan);
          break;
        }
      }
      pbox(c, 10, VH-46, VW-20, 38, rgba(P.ink,.8), 3);
      ctxt(c, VW/2, VH-38, 'it checks itself the moment all ' + s.order.length + ' are placed', P.grey, 1);
      ctxt(c, VW/2, VH-26, 'tap a placed one to send it back   ' + s.tries + ' wrong ' + plural(s.tries,'order'),
           s.tries ? P.red : P.grey, 1);
    }
  };
  Seq.update = function(dt, s, finish) {
    if (s.shake > 0) s.shake -= dt;
    if (s.slots.length === s.order.length && !s.checked) {
      s.checked = true;
      const ok = s.slots.every((v,i) => v.x === s.order[i]);
      if (ok) {
        SFX.play('correct');
        finish(true, clamp(1 - s.tries*.18, .3, 1), { essence:6, coins:44, xp:30 },
               'ordered it in ' + (s.tries+1) + ' ' + plural(s.tries+1,'try','tries'));
      } else {
        s.tries++; s.shake = .4; SFX.play('wrong'); FX.shake(6,.3);
        UI.toast('not quite — the wrong ones came back', P.red);
        /* keep the ones that are right, return the rest */
        const keep = [];
        s.slots.forEach((v,i) => { if (v.x === s.order[i]) keep[i] = v; else s.pool.push(v); });
        s.slots = keep.filter(Boolean);
        s.pool = shuffle(s.pool);
        s.checked = false;
        if (s.tries >= 4) finish(false, 0, {}, 'four wrong orders');
      }
    }
  };

  /* ==== GRAPH LAB ======================================================= */
  const Graph = {
    init(bank) {
      const rounds = (CONTENT.GRAPHS[bank] || CONTENT.GRAPHS.graphs).slice();
      return { rounds:shuffle(rounds).slice(0,4), idx:0, m:0, c:0, tries:0, ok:0, msg:'', msgT:0, win:0 };
    },
    update(dt, s, finish) {
      if (s.msgT > 0) s.msgT -= dt;
      if (s.win > 0) {
        s.win -= dt;
        if (s.win <= 0) {
          s.idx++;
          if (s.idx >= s.rounds.length)
            finish(true, clamp(1 - s.tries*.1, .3, 1), { essence:8, coins:50, xp:34 },
                   'four lines matched, ' + s.tries + ' ' + plural(s.tries,'retry','retries'));
          else { s.m = 0; s.c = 0; }
        }
      }
    },
    draw(c, s, t, pack) {
      const tgt = s.rounds[s.idx] || s.rounds[0];
      UI.header(c, 34, 'GRAPH LAB', 'move your line onto the ghost line', P.purple);
      ctxt(c, VW/2, 78, 'ROUND ' + (s.idx+1) + ' OF ' + s.rounds.length, P.grey, 1);

      /* --- the grid --------------------------------------------------- */
      const GX = 30, GY = 96, GW = 300, GH = 300, U = GW/12;   /* -6..6 */
      const px = (x) => GX + GW/2 + x*U, py = (y) => GY + GH/2 - y*U;
      panel(c, GX-4, GY-4, GW+8, GH+8, '#120a24', { r:3 });
      c.fillStyle = '#1c1136'; c.fillRect(GX, GY, GW, GH);
      for (let i=-6;i<=6;i++) {
        c.fillStyle = i === 0 ? rgba(P.white,.55) : rgba(P.white,.13);
        c.fillRect(Math.round(px(i)), GY, 1, GH);
        c.fillRect(GX, Math.round(py(i)), GW, 1);
      }
      for (let i=-6;i<=6;i+=2) if (i) {
        txt(c, px(i)-3, py(0)+3, String(i), rgba(P.white,.4), 1);
        txt(c, px(0)+4, py(i)-3, String(i), rgba(P.white,.4), 1);
      }
      /* ghost target */
      for (let x=-6;x<=6;x+=.12) {
        const y = tgt.m*x + tgt.c;
        if (y < -6.2 || y > 6.2) continue;
        c.fillStyle = rgba(P.white,.42);
        c.fillRect(Math.round(px(x)), Math.round(py(y)), 2, 2);
      }
      /* two points on the ghost, labelled — this is the thing to read off.
         Pick the widest pair that actually lands inside the window. */
      const onGrid = [];
      for (let xi=-6; xi<=6; xi++) {
        const yv = tgt.m*xi + tgt.c;
        if (yv >= -6 && yv <= 6 && Math.abs(yv*2 - Math.round(yv*2)) < 1e-6) onGrid.push(xi);
      }
      const marks = onGrid.length >= 2 ? [onGrid[0], onGrid[onGrid.length-1]] : onGrid;
      for (const gx3 of marks) {
        const gy3 = tgt.m*gx3 + tgt.c;
        pbox(c, px(gx3)-4, py(gy3)-4, 8, 8, P.ink, 2);
        pbox(c, px(gx3)-3, py(gy3)-3, 6, 6, P.white, 2);
        txt(c, clamp(px(gx3)+6, 32, GX+GW-54), py(gy3)-11, '(' + gx3 + ',' + fmt(gy3) + ')', P.white, 1, P.ink);
      }
      /* your line */
      const good = Math.abs(s.m-tgt.m) < .01 && Math.abs(s.c-tgt.c) < .01;
      for (let x=-6;x<=6;x+=.06) {
        const y = s.m*x + s.c;
        if (y < -6.2 || y > 6.2) continue;
        c.fillStyle = good ? P.lime : pack.col;
        c.fillRect(Math.round(px(x)), Math.round(py(y)), 2, 2);
      }
      /* the two handles, which you can also drag */
      const hx = px(0), hy = py(s.c);
      pbox(c, hx-4, hy-4, 8, 8, P.ink, 2); pbox(c, hx-3, hy-3, 6, 6, P.gold, 2);
      const gx2 = px(2), gy2 = py(s.m*2 + s.c);
      pbox(c, gx2-4, gy2-4, 8, 8, P.ink, 2); pbox(c, gx2-3, gy2-3, 6, 6, P.cyan, 2);
      if (Input.down && s.win <= 0) {
        if (dist(Input.x,Input.y,hx,hy) < 26 && Math.abs(Input.x-hx) < 40) {
          s.c = clamp(Math.round((GY+GH/2 - Input.y)/U*2)/2, -6, 6);
        } else if (dist(Input.x,Input.y,gx2,gy2) < 26) {
          const yv = (GY+GH/2 - Input.y)/U;
          s.m = clamp(Math.round(((yv - s.c)/2)*4)/4, -6, 6);
        }
      }

      /* --- readout + steppers ------------------------------------------ */
      panel(c, 20, 406, VW-40, 58, '#241640', { r:3 });
      ctxt(c, VW/2, 412, 'YOUR LINE:  y = ' + fmt(s.m) + 'x ' + (s.c < 0 ? '- ' + fmt(-s.c) : '+ ' + fmt(s.c)),
           good ? P.lime : P.white, 2, P.shadow);
      txt(c, 30, 436, 'GRADIENT m', P.cyan, 1);
      if (UI.btn(c, 104, 430, 26, 22, '-', { col:'#3a2a5e', col2:'#5a4790', key:'m-' })) s.m = clamp(s.m-.25,-6,6);
      if (UI.btn(c, 134, 430, 26, 22, '+', { col:'#3a2a5e', col2:'#5a4790', key:'m+' })) s.m = clamp(s.m+.25,-6,6);
      txt(c, 176, 436, 'INTERCEPT c', P.gold, 1);
      if (UI.btn(c, 262, 430, 26, 22, '-', { col:'#3a2a5e', col2:'#5a4790', key:'c-' })) s.c = clamp(s.c-.5,-6,6);
      if (UI.btn(c, 292, 430, 26, 22, '+', { col:'#3a2a5e', col2:'#5a4790', key:'c+' })) s.c = clamp(s.c+.5,-6,6);

      if (s.msgT > 0) ctxt(c, VW/2, 474, s.msg, s.msg[0] === 'M' ? P.lime : P.red, 2, P.ink);
      if (UI.btn(c, 60, 494, VW-120, 34, 'CHECK THE LINE', { col:'#6a27c8', col2:P.purple, glow:P.gold, scale:1 })
          && s.win <= 0) {
        if (good) {
          s.ok++; s.win = .9; s.msg = 'MATCHED!'; s.msgT = 1.2;
          SFX.play('correct'); FX.confetti(VW/2, 240, 40); S.dailyTick(1);
        } else {
          s.tries++; s.msg = 'not yet — check m and c'; s.msgT = 1.4;
          SFX.play('wrong'); FX.shake(5,.25);
        }
      }
      pbox(c, 10, 540, VW-20, 58, rgba(P.ink,.8), 3);
      ctxt(c, VW/2, 546, 'READ IT OFF THE TWO WHITE POINTS', P.gold, 1);
      ctxt(c, VW/2, 560, 'gradient m = change in y / change in x', P.bone, 1);
      ctxt(c, VW/2, 572, 'intercept c = where the ghost crosses the y axis', P.bone, 1);
      ctxt(c, VW/2, 586, 'or drag the gold dot for c and the cyan dot for m', P.grey, 1);
    }
  };
  const fmt = v => (Math.round(v*100)/100).toString();

  /* ==== CHOP / MINE ===================================================== */
  const Swing = {
    init(kind) {
      return { kind, pos:0, dir:1, speed:1.15, hits:0, need:8, misses:0, swing:0,
               bonusQ:null, bonusT:0, tree:1, loot:0, shakeT:0 };
    },
    update(dt, s, finish) {
      if (s.bonusQ) return;
      s.pos += s.dir*s.speed*dt;
      if (s.pos > 1) { s.pos = 1; s.dir = -1; }
      if (s.pos < 0) { s.pos = 0; s.dir = 1; }
      if (s.swing > 0) s.swing -= dt;
      if (s.shakeT > 0) s.shakeT -= dt;
      if (s.misses >= 4) finish(false, 0, {}, 'the axe slipped four times');
      if (s.hits >= s.need) {
        const score = clamp(1 - s.misses*.16, .3, 1);
        const loot = s.kind === 'chop' ? { wood: 18 + s.loot, coins:30, xp:20 }
                                       : { stone: 14 + s.loot, coins:30, xp:20 };
        S.d.stats.chopped += s.hits;
        finish(true, score, loot, s.hits + ' clean ' + (s.kind === 'chop' ? 'cuts' : 'strikes') +
               ', ' + s.misses + ' ' + plural(s.misses,'slip'));
      }
    },
    draw(c, s, t, pack) {
      const chop = s.kind === 'chop';
      UI.header(c, 34, chop ? 'CHOPPING' : 'MINING', 'stop the marker in the green', chop ? P.green : P.stone);
      ctxt(c, VW/2, 76, s.hits + ' / ' + s.need + '   MISSES ' + s.misses + '/4', P.bone, 1);

      /* the patch of ground you are working */
      const gy2 = 300, jitter = s.shakeT > 0 ? rnd(-3,3) : 0;
      drawPlateau(c, VW/2, gy2 + 8, 136, 22, 74, { seed:12 });
      if (chop) drawTree(c, VW/2 + 34 + jitter, gy2, 2.3, 5, { fruit:P.red });
      else { drawRock(c, VW/2 + 34 + jitter, gy2, 2.6, 8); drawRock(c, VW/2 + 78, gy2+8, 1.3, 9); }
      /* your character mid-swing */
      const swinging = s.swing > 0;
      AV.draw(c, VW/2 - 46, gy2 + 4, S.d.cfg, swinging ? 'attack' : 'idle', Math.floor(t*4)%2, { scale:2 });
      /* the axe/pick */
      const ang = swinging ? lerp(-1.1, .5, 1 - s.swing/.25) : -1.1 + Math.sin(t*2)*.08;
      c.save(); c.translate(VW/2-26, gy2-26); c.rotate(ang);
      c.fillStyle = P.wood2; c.fillRect(0,-2,26,4);
      c.fillStyle = P.ink; c.fillRect(24,-9,4,18);
      c.fillStyle = chop ? '#cfd9ee' : '#9aa6c4'; c.fillRect(25,-8,3,16);
      c.restore();

      /* --- the timing bar --------------------------------------------- */
      const bx = 30, by = 404, bw = VW-60, bh = 34;
      panel(c, bx, by, bw, bh, '#241640', { r:3 });
      const perfW = 26, goodW = 74;
      const cxp = bx + bw/2;
      c.fillStyle = rgba(P.lime,.45); c.fillRect(cxp-goodW/2, by+3, goodW, bh-6);
      c.fillStyle = rgba(P.gold,.8);   c.fillRect(cxp-perfW/2, by+3, perfW, bh-6);
      c.fillStyle = P.gold; c.fillRect(cxp-perfW/2, by+3, 1, bh-6); c.fillRect(cxp+perfW/2, by+3, 1, bh-6);
      const mx = bx + 6 + s.pos*(bw-12);
      pbox(c, mx-3, by-4, 6, bh+8, P.ink, 2);
      pbox(c, mx-2, by-3, 4, bh+6, P.white, 2);
      ctxt(c, VW/2, by+bh+8, 'GOLD = PERFECT', P.grey, 1);

      if (UI.btn(c, 60, 462, VW-120, 42, chop ? 'CHOP!' : 'STRIKE!',
                 { col: chop?'#1a7331':'#434f74', col2: chop?'#3fe07a':'#9aa6c4', glow:P.gold, scale:2 })
          && !s.bonusQ) {
        const off = Math.abs(mx - cxp);
        s.swing = .25; s.shakeT = .2;
        if (off < perfW/2) {
          s.hits++; s.loot += 3; s.speed += .1;
          SFX.play(chop ? 'chop' : 'mine'); FX.shake(5,.2);
          FX.float(VW/2, 250, 'PERFECT +3', P.gold, { scale:2 });
          if (chop) FX.leaves(VW/2, 250, 14); else FX.burst(VW/2, 280, 14, [P.stone,'#cfd9ee'], { speed:120 });
          if (s.hits % 3 === 0) { s.bonusQ = CONTENT.question(pack.bank); s.bonusT = 9; }
        } else if (off < goodW/2) {
          s.hits++; s.loot += 1; s.speed += .06;
          SFX.play(chop ? 'chop' : 'mine'); FX.shake(3,.15);
          FX.float(VW/2, 250, 'GOOD +1', P.lime, { scale:2 });
          if (chop) FX.leaves(VW/2, 250, 8); else FX.dust(VW/2, 290, 8, P.stone);
        } else {
          s.misses++; SFX.play('wrong'); FX.shake(4,.2);
          FX.float(VW/2, 250, 'SLIP', P.red, { scale:2 });
        }
      }
      /* the haul so far */
      pbox(c, 10, 522, VW-20, 62, rgba(P.ink,.82), 3);
      ctxt(c, VW/2, 528, 'THE HAUL', P.gold, 1);
      spr(c, chop ? 'i_wood' : 'i_stone', 96, 544, { scale:2 });
      txt(c, 124, 548, '+' + ((chop?18:14) + s.loot), P.lime, 2, P.shadow);
      spr(c, 'i_coin', 210, 544, { scale:2 });
      txt(c, 238, 548, '+30', P.gold, 2, P.shadow);
      ctxt(c, VW/2, 572, chop ? 'every third clean cut wakes something up' :
                                'every third clean strike splits a geode', P.grey, 1);

      /* --- the bonus question ------------------------------------------ */
      if (s.bonusQ) {
        s.bonusT -= 1/60;
        c.fillStyle = rgba(P.shadow,.95); c.fillRect(0,0,VW,VH);
        ctxt(c, VW/2, 120, 'BONUS HAUL', P.gold, 3, P.ink);
        panel(c, 16, 160, VW-32, 70, '#241640', { r:4 });
        wrap(s.bonusQ.q, VW-50, 1).forEach((l,i) => ctxt(c, VW/2, 172+i*11, l, P.white, 1, P.shadow));
        bar(c, 30, 236, VW-60, 6, clamp(s.bonusT/9,0,1), P.gold);
        for (let i=0;i<s.bonusQ.o.length;i++) {
          const y = 256 + i*48;
          if (UI.btnWrap(c, 30, y, VW-60, 40, s.bonusQ.o[i], { key:'bq'+i })) {
            const ok = s.bonusQ.o[i] === s.bonusQ.a;
            S.dailyTick(1);
            if (ok) { s.loot += 10; SFX.play('correct'); FX.confetti(VW/2, 300, 40);
                      UI.toast('+10 BONUS MATERIALS', P.gold, 'i_wood'); }
            else { SFX.play('wrong'); UI.toast('no bonus this time', P.red); }
            s.bonusQ = null;
          }
        }
        if (s.bonusT <= 0) { s.bonusQ = null; UI.toast('too slow', P.red); }
      }
    }
  };
  return {
    enter(data) {
      t = 0; done = null;
      kind = data.kind; packId = data.packId; node = data.node;
      pack = CONTENT.pack(packId) || CONTENT.PACKS[0];
      bank = pack.bank;
      if (kind === 'match') sub = Match.init(bank);
      else if (kind === 'seq') sub = Seq.init(bank);
      else if (kind === 'graph') sub = Graph.init(bank);
      else sub = Swing.init(kind);
      SFX.music(false); SFX.duck(.06);
    },
    exit() { SFX.duck(.16); SFX.music(true); },
    back() { leave(); },
    update(dt) {
      t += dt;
      if (done) { done.t += dt; return; }
      if (kind === 'match') Match.update(dt, sub, finish);
      else if (kind === 'seq') Seq.update(dt, sub, finish);
      else if (kind === 'graph') Graph.update(dt, sub, finish);
      else Swing.update(dt, sub, finish);
    },
    draw(c) {
      drawSky(c, t*.4, Object.assign({ sun:false }, pack.sky));
      c.fillStyle = rgba(P.ink,.45); c.fillRect(0,0,VW,VH);
      if (kind === 'match') Match.draw(c, sub, t);
      else if (kind === 'seq') Seq.draw(c, sub, t);
      else if (kind === 'graph') Graph.draw(c, sub, t, pack);
      else Swing.draw(c, sub, t, pack);
      if (UI.btn(c, 8, 8, 40, 22, '<', { col:'#4a3a70', col2:'#6b56a0' })) leave();
      if (done) drawDone(c);
    }
  };
})());
