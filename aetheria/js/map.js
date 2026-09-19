/* =========================================================================
   MAP — the adventure. A shelf of floating worlds, and inside each one a
   winding trail of stops that climbs into the sky.
   ========================================================================= */
Game.register('map', (() => {
  let t = 0, view = 'worlds', packId = null, scroll = 0, maxScroll = 0, sel = -1, dragging = false, startScroll = 0;

  const KIND = {
    fight:  { icon:'i_sword',   label:'BATTLE',    col:'#ff4d5e' },
    elite:  { icon:'i_flame',   label:'ELITE',     col:'#ff9330' },
    boss:   { icon:'i_trophy',  label:'BOSS',      col:'#ffd23f' },
    match:  { icon:'i_book',    label:'MATCH-UP',  col:'#49a7ff' },
    seq:    { icon:'i_clock',   label:'SEQUENCE',  col:'#46ecd5' },
    graph:  { icon:'i_bolt',    label:'GRAPH LAB', col:'#a35cff' },
    gather: { icon:'i_wood',    label:'GATHER',    col:'#3fe07a' }
  };

  const nodePos = (i) => ({
    x: VW/2 + Math.sin(i*0.85 + 0.4)*96,
    y: VH - 120 - i*74
  });

  function openNode(pack, i) {
    const n = pack.nodes[i];
    const common = { packId:pack.id, node:i };
    if (n.kind === 'fight' || n.kind === 'elite' || n.kind === 'boss')
      Game.go('battle', Object.assign(common, { mode:n.kind }));
    else if (n.kind === 'gather')
      Game.go('minigame', Object.assign(common, { kind: Math.random() < .5 ? 'chop' : 'mine' }));
    else
      Game.go('minigame', Object.assign(common, { kind:n.kind }));
  }

  return {
    enter(data) {
      t = 0; sel = -1;
      if (data && data.packId) { view = 'trail'; packId = data.packId; }
      else view = 'worlds';
      scroll = 0;
      if (view === 'trail') {
        const p = CONTENT.pack(packId);
        maxScroll = Math.max(0, p.nodes.length*74 - VH + 220);
        scroll = clamp(S.prog(packId).cleared*74 - 200, 0, maxScroll);
      }
    },
    back() { if (view === 'trail') { view = 'worlds'; } else Game.go('island'); },

    update(dt) {
      t += dt;
      if (view !== 'trail') return;
      if (Input.justDown) { dragging = true; startScroll = scroll; }
      if (Input.down && dragging) scroll = clamp(startScroll + Input.dy, 0, maxScroll);
      if (!Input.down) dragging = false;
      scroll = clamp(scroll - Input.wheel*24, 0, maxScroll);
    },

    draw(c) {
      if (view === 'worlds') drawWorlds(c); else drawTrail(c);
    }
  };

  /* --- world shelf ------------------------------------------------------- */
  function drawWorlds(c) {
    drawSky(c, t*.5, { top:'#1b2d6e', mid:'#4a7fd8', bot:'#b6ecff',
                       cloudLayers:[[.15,.6,140,.5],[.5,.9,230,.65],[.8,1.2,300,.8]] });
    UI.topBar(c);
    if (UI.btn(c, 8, 34, 36, 22, '<', { col:'#4a3a70', col2:'#6b56a0' })) Game.go('island');
    UI.header(c, 32, 'CHOOSE A WORLD', 'each island is a subject', P.gold);

    const list = S.unlockedPacks();
    let y = 78;
    for (let i=0;i<list.length;i++) {
      const p = list[i].pack, open = list[i].open, pr = S.prog(p.id);
      const done = pr.cleared >= p.nodes.length;
      const bob = Math.sin(t*1.3 + i)*2.5;
      panel(c, 10, y, VW-20, 66, open ? '#2e1b50' : '#1b1030', { r:4 });
      /* a little island portrait */
      c.save(); c.beginPath(); c.rect(14, y+2, 62, 62); c.clip();
      c.fillStyle = rgba(p.col2,.35); c.fillRect(14, y+2, 62, 62);
      drawFloatIsland(c, 45, y+30+bob, 46, { seed:i+3, depth:26, vines:false,
        grass: open ? p.col : '#6b789c', grass2: open ? p.col2 : '#434f74', grass3:'#2a3450' });
      if (open) drawTree(c, 36, y+31+bob, .5, i+12);
      spr(c, p.icon, 58, y+20+bob, { center:true, alpha: open?1:.4 });
      c.restore();
      pbox(c, 13, y+1, 64, 64, 'rgba(0,0,0,0)', 3);

      txt(c, 84, y+8, p.name, open ? p.col : P.grey, 2, P.shadow);
      txt(c, 84, y+26, p.sub, P.grey, 1);
      bar(c, 84, y+38, 170, 6, pr.cleared/p.nodes.length, open ? p.col : '#4a4a6a', { shine:t });
      txt(c, 84, y+48, pr.cleared + '/' + p.nodes.length + ' STOPS', P.bone, 1);
      spr(c, 'i_star', 160, y+47);
      txt(c, 174, y+50, String(Object.values(pr.stars).reduce((a,b)=>a+b,0)), P.gold, 1);

      if (!open) {
        spr(c, 'i_lock', VW-46, y+26, { center:true, scale:2 });
        txt(c, 258, y+50, 'CLEAR 4 BEFORE', P.grey, 1);
      } else if (UI.btn(c, VW-84, y+20, 66, 28, done ? 'REPLAY' : 'GO',
                        { col: done?'#3a2a5e':'#1a7331', col2: done?'#5a4790':'#3fe07a', glow: done?null:P.gold, key:'w'+i })) {
        packId = p.id; view = 'trail';
        maxScroll = Math.max(0, p.nodes.length*74 - VH + 220);
        scroll = clamp(pr.cleared*74 - 200, 0, maxScroll);
        SFX.play('power');
      }
      y += 70;
    }

    /* custom decks get their own world */
    panel(c, 10, y, VW-20, 52, '#241640', { r:4 });
    spr(c, 'i_book', 42, y+26, { center:true, scale:2 });
    txt(c, 78, y+8, 'YOUR OWN LESSONS', P.cyan, 2, P.shadow);
    txt(c, 78, y+26, S.d.decks.length + ' custom ' + plural(S.d.decks.length,'deck'), P.grey, 1);
    txt(c, 78, y+38, 'write one in the DECK screen', P.grey, 1);
    const hasDeck = S.d.decks.some(d => d.cards.filter(x=>x.term&&x.def).length >= 2);
    if (UI.btn(c, VW-84, y+12, 66, 28, hasDeck ? 'TRAIN' : 'WRITE',
               { col:'#2358c9', col2:P.blue, key:'cust' })) {
      if (hasDeck) {
        const deck = S.d.decks.find(d => d.cards.filter(x=>x.term&&x.def).length >= 2);
        Game.go('battle', { mode:'custom', deckId:deck.id });
      } else Game.go('dex', { tab:2 });
    }
  }

  /* --- the trail --------------------------------------------------------- */
  function drawTrail(c) {
    const p = CONTENT.pack(packId), pr = S.prog(packId);
    drawSky(c, t*.6, Object.assign({ cloudLayers:[[.12,.5,130,.4],[.42,.8,210,.55],[.78,1.1,290,.7]] }, p.sky));

    /* ground clouds that scroll with the trail */
    for (let i=0;i<8;i++) {
      const yy = VH - 40 - i*74 + scroll;
      if (yy < -40 || yy > VH+40) continue;
      c.globalAlpha = .3; drawCloud(c, (i*97)%VW, yy+30, 1.6, .5); c.globalAlpha = 1;
    }

    /* the dotted road */
    c.save();
    for (let i=0;i<p.nodes.length-1;i++) {
      const a = nodePos(i), b = nodePos(i+1);
      const ay = a.y + scroll, by = b.y + scroll;
      const steps = 9;
      for (let s2=1;s2<steps;s2++) {
        const k = s2/steps;
        const x = lerp(a.x,b.x,k), y = lerp(ay,by,k) + Math.sin(k*Math.PI)*6;
        if (y < -10 || y > VH+10) continue;
        const done = i < pr.cleared;
        c.fillStyle = done ? rgba(P.gold,.85) : rgba('#ffffff',.35);
        const r = done ? 3 : 2;
        c.fillRect(Math.round(x-r/2), Math.round(y-r/2), r, r);
      }
    }
    c.restore();

    /* the stops */
    for (let i=0;i<p.nodes.length;i++) {
      const n = p.nodes[i], pos = nodePos(i), y = pos.y + scroll;
      if (y < -60 || y > VH+50) continue;
      const cleared = i < pr.cleared, current = i === pr.cleared, locked = i > pr.cleared;
      const k = KIND[n.kind];
      const bob = Math.sin(t*1.8 + i*.7)*2;
      const isBoss = n.kind === 'boss';
      const R = isBoss ? 30 : 24;

      /* the little platform each stop stands on */
      drawFloatIsland(c, pos.x, y+R-6+bob, R*2, { seed:i+40, depth:18, vines:false,
        grass: cleared ? P.gold : locked ? '#6b789c' : p.col,
        grass2: cleared ? P.gold2 : locked ? '#434f74' : p.col2, grass3:'#2a3450' });

      if (current) {
        c.globalAlpha = .35 + .2*Math.sin(t*5);
        pxEllipse(c, pos.x, y+bob, R+8, R+8, P.white); c.globalAlpha = 1;
      }
      /* badge */
      const bcol = cleared ? P.gold : locked ? '#5a6480' : k.col;
      pbox(c, pos.x-R/1.6, y-R/1.6+bob, R*1.25, R*1.25, P.ink, 4);
      pbox(c, pos.x-R/1.6+1, y-R/1.6+1+bob, R*1.25-2, R*1.25-2, bcol, 4);
      pbox(c, pos.x-R/1.6+1, y-R/1.6+1+bob, R*1.25-2, 3, shade(bcol,.4), 3);
      spr(c, locked ? 'i_lock' : k.icon, pos.x, y+bob, { center:true, scale: isBoss?2:1.4 });
      if (cleared) UI.stars(c, pos.x, y+R/1.6+5+bob, pr.stars[i]||0, 3, 1);
      txt(c, pos.x + R/1.6 + 6, y-4+bob, String(i+1), rgba(P.white,.7), 1, P.ink);

      if (!locked) {
        const z = UI.zone(pos.x-R, y-R+bob, R*2, R*2, 'n'+i);
        if (z.over) { sel = i; }
        if (z.click) { SFX.play('power'); FX.stars(pos.x, y+bob, 10, bcol); openNode(p, i); }
      }
      /* you, standing on the next stop */
      if (current) AV.draw(c, pos.x, y - R/1.6 + bob - 2, S.d.cfg, 'idle', Math.floor(t*3)%2, { scale:1 });
    }

    /* --- chrome --------------------------------------------------------- */
    c.fillStyle = rgba(P.ink,.82); c.fillRect(0,0,VW,72);
    hline(c, 0, 72, VW, rgba(p.col,.7));
    if (UI.btn(c, 8, 8, 40, 24, '<', { col:'#4a3a70', col2:'#6b56a0' })) view = 'worlds';
    ctxt(c, VW/2, 10, p.name, p.col, 2, P.shadow);
    ctxt(c, VW/2, 28, p.sub, P.grey, 1);
    bar(c, 60, 44, VW-120, 7, pr.cleared/p.nodes.length, p.col, { shine:t, ticks:p.nodes.length });
    ctxt(c, VW/2, 56, pr.cleared + ' / ' + p.nodes.length + ' CLEARED', P.bone, 1);

    /* the info strip for whatever you are hovering */
    if (sel >= 0 && sel < p.nodes.length) {
      const n = p.nodes[sel], k = KIND[n.kind];
      pbox(c, 10, VH-34, VW-20, 26, rgba(P.ink,.88), 3);
      spr(c, k.icon, 18, VH-28);
      txt(c, 34, VH-28, 'STOP ' + (sel+1) + '  ' + k.label, k.col, 1, P.shadow);
      txt(c, 34, VH-18, sel < pr.cleared ? 'cleared — replay for loot' :
                        sel === pr.cleared ? 'tap to begin' : 'locked', P.grey, 1);
    }
  }
})());
