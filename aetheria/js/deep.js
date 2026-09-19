/* =========================================================================
   THE DEEP — the mine under the island.

   A side-view tile world you fall into: gravity, jumping, digging, placing,
   ore veins that get better the further down you go, and dark you need a
   torch to see through. Terraria's loop, shrunk to a phone screen and wired
   to the study game — rune doors and buried chests only open for a correct
   answer, and anything that ambushes you asks a question before it bites.
   ========================================================================= */
Game.register('deep', (() => {
  const TS = 16;                                   /* tile size, one grid for everything */
  const WW = 56, WH = 120;                         /* world size in tiles */
  const AIR=0, GRASS=1, DIRT=2, STONE=3, COPPER=4, SILVER=5, CRYSTAL=6,
        BEDROCK=7, LOG=8, LEAF=9, RUNE=10, CHEST=11, TORCH=12, PLANK=13;

  const TILE = {
    [GRASS]:  { n:'GRASS',  hard:1, col:'#54d64a', col2:'#35ad3c', drop:'dirt' },
    [DIRT]:   { n:'DIRT',   hard:1, col:'#b9773d', col2:'#8a5328', drop:'dirt' },
    [STONE]:  { n:'STONE',  hard:2, col:'#8e9bb5', col2:'#6b789c', drop:'stone' },
    [COPPER]: { n:'COPPER', hard:3, col:'#d98a4a', col2:'#a8501f', drop:'copper', glint:'#ffc48a' },
    [SILVER]: { n:'SILVER', hard:4, col:'#cfd9ee', col2:'#8e9bb5', drop:'silver', glint:'#ffffff' },
    [CRYSTAL]:{ n:'CRYSTAL',hard:5, col:'#a35cff', col2:'#6a27c8', drop:'crystal', glint:'#e0b6ff' },
    [BEDROCK]:{ n:'BEDROCK',hard:99,col:'#3a3050', col2:'#241640' },
    [LOG]:    { n:'WOOD',   hard:2, col:'#c08a4a', col2:'#8a5a2c', drop:'wood' },
    [LEAF]:   { n:'LEAVES', hard:1, col:'#3fe07a', col2:'#1d9a52' },
    [RUNE]:   { n:'RUNE DOOR', hard:99, col:'#ff5fb8', col2:'#a3157a' },
    [CHEST]:  { n:'CHEST',  hard:99, col:'#ffd23f', col2:'#b3600f' },
    [TORCH]:  { n:'TORCH',  hard:1, col:'#ffd23f', col2:'#ff9330', drop:'torch', light:7 },
    [PLANK]:  { n:'PLANK',  hard:1, col:'#d9a45c', col2:'#a8703a', drop:'plank' }
  };
  const SOLID = t => t !== AIR && t !== TORCH;
  const PLACEABLE = ['dirt','stone','wood','plank','torch'];
  const PLACE_TILE = { dirt:DIRT, stone:STONE, wood:LOG, plank:PLANK, torch:TORCH };

  let map, cat, cam, t, haul, bag, sel, mobs, quiz, msg, msgT, over, depthBest, breaking, pack, bank;
  let surfH;
  let touchL, touchR;

  const idx = (x,y) => y*WW + x;
  const get = (x,y) => y < 0 ? AIR : (x<0||x>=WW||y>=WH) ? BEDROCK : map[idx(x,y)];
  const set = (x,y,v) => { if (x>=0&&y>=0&&x<WW&&y<WH) map[idx(x,y)] = v; };

  /* ---- world generation ------------------------------------------------ */
  function build() {
    map = new Uint8Array(WW*WH);
    surfH = new Int16Array(WW);
    const r = srnd(Date.now() & 0xffff);
    const surf = [];
    let h = 12;
    for (let x=0;x<WW;x++) {
      h += Math.round(r()*2-1);
      h = clamp(h, 9, 16);
      surf[x] = h; surfH[x] = h;
      for (let y=0;y<WH;y++) {
        let v = AIR;
        if (y === h) v = GRASS;
        else if (y > h && y < h+4) v = DIRT;
        else if (y >= h+4) v = STONE;
        if (y >= WH-2) v = BEDROCK;
        map[idx(x,y)] = v;
      }
      /* a few trees on the surface */
      if (r() > .86 && x > 2 && x < WW-3) {
        const th = 3 + Math.floor(r()*3);
        for (let i=1;i<=th;i++) set(x, h-i, LOG);
        for (let dx=-2;dx<=2;dx++) for (let dy=-2;dy<=0;dy++)
          if (Math.abs(dx)+Math.abs(dy) < 3 && get(x+dx,h-th+dy) === AIR) set(x+dx, h-th+dy, LEAF);
      }
    }
    /* caves */
    for (let i=0;i<26;i++) {
      let cx = 2+r()*(WW-4), cy = 22+r()*(WH-34), a = r()*TAU;
      const len = 8 + r()*24;
      for (let s2=0;s2<len;s2++) {
        a += (r()-.5)*.6;
        cx += Math.cos(a)*1.1; cy += Math.sin(a)*.6;
        const rr = 0.9 + r()*1.2;
        for (let dx=-rr;dx<=rr;dx++) for (let dy=-rr;dy<=rr;dy++)
          if (dx*dx+dy*dy <= rr*rr) {
            const tx = Math.round(cx+dx), ty = Math.round(cy+dy);
            if (ty > surf[clamp(Math.round(cx),0,WW-1)]+2 && ty < WH-3) set(tx,ty,AIR);
          }
      }
    }
    /* ore veins — deeper is richer */
    const vein = (kind, count, minY, maxY, size) => {
      for (let i=0;i<count;i++) {
        let cx = 1+r()*(WW-2), cy = minY + r()*(maxY-minY);
        for (let s2=0;s2<size;s2++) {
          cx += (r()-.5)*2.4; cy += (r()-.5)*2.4;
          const tx = Math.round(cx), ty = Math.round(cy);
          if (get(tx,ty) === STONE) set(tx,ty,kind);
        }
      }
    };
    vein(COPPER, 46, 18, WH-6, 7);
    vein(SILVER, 26, 42, WH-6, 5);
    vein(CRYSTAL, 16, 68, WH-4, 4);
    /* rune doors guarding pockets of treasure, and buried chests */
    for (let i=0;i<9;i++) {
      const cx = 3 + Math.floor(r()*(WW-6)), cy = 26 + Math.floor(r()*(WH-36));
      if (get(cx,cy) === AIR) continue;
      for (let dx=-2;dx<=2;dx++) for (let dy=-2;dy<=2;dy++) set(cx+dx,cy+dy,AIR);
      set(cx, cy, CHEST);
      for (let dy=-3;dy<=3;dy++) set(cx+3, cy+dy, RUNE);
      for (let dx=-3;dx<=3;dx++) { set(cx+dx, cy-3, BEDROCK); set(cx+dx, cy+3, BEDROCK); }
      set(cx-3, cy, RUNE);
    }
    return surf;
  }

  /* ---- the cat --------------------------------------------------------- */
  function spawn(surf) {
    const sx = Math.floor(WW/2);
    cat = { x:(sx+.5)*TS, y:(surf[sx]-1)*TS, vx:0, vy:0, w:11, h:20, onGround:false,
            face:1, f:0, ft:0, hp:100, maxHp:100, digT:0, hurt:0 };
  }
  function solidAt(px, py) { return SOLID(get(Math.floor(px/TS), Math.floor(py/TS))); }
  function collide(nx, ny) {
    const hw = cat.w/2;
    for (const [ox,oy] of [[-hw,-cat.h],[hw-1,-cat.h],[-hw,-cat.h/2],[hw-1,-cat.h/2],[-hw,-1],[hw-1,-1]])
      if (solidAt(nx+ox, ny+oy)) return true;
    return false;
  }

  /* ---- mobs ------------------------------------------------------------ */
  function seedMobs() {
    mobs = [];
    const kinds = ['m_bat','m_slime','m_shroom'];
    for (let i=0;i<14;i++) {
      let x, y, tries = 0;
      do { x = 2 + Math.floor(Math.random()*(WW-4)); y = 22 + Math.floor(Math.random()*(WH-30)); tries++; }
      while (get(x,y) !== AIR && tries < 60);
      if (get(x,y) !== AIR) continue;
      mobs.push({ x:(x+.5)*TS, y:(y+.5)*TS, spr:pick(kinds), dir: Math.random()<.5?-1:1,
                  t:rnd(0,9), alive:true });
    }
  }

  /* ---- digging --------------------------------------------------------- */
  function reachable(tx, ty) {
    const cx = cat.x/TS, cy = (cat.y - cat.h/2)/TS;
    return Math.abs(tx+.5-cx) <= 3.2 && Math.abs(ty+.5-cy) <= 3.2;
  }
  function dig(tx, ty) {
    const v = get(tx,ty);
    if (v === AIR) return;
    const def = TILE[v];
    if (!def) return;
    if (v === RUNE)  { askQuiz('rune', { tx, ty }); return; }
    if (v === CHEST) { askQuiz('chest', { tx, ty }); return; }
    if (def.hard >= 99) { flash('too hard to break'); return; }
    if (!breaking || breaking.tx !== tx || breaking.ty !== ty) breaking = { tx, ty, n:0 };
    breaking.n++;
    SFX.play(v === STONE || v >= COPPER ? 'mine' : 'chop');
    FX.burst(tx*TS+8 - cam.x, ty*TS+8 - cam.y, 5, [def.col, def.col2], { speed:60, g:160, size:2 });
    if (breaking.n >= def.hard) {
      set(tx,ty,AIR); breaking = null;
      FX.burst(tx*TS+8 - cam.x, ty*TS+8 - cam.y, 12, [def.col, def.col2], { speed:110, g:220 });
      if (def.drop) {
        haul[def.drop] = (haul[def.drop]||0) + 1;
        bag[def.drop] = (bag[def.drop]||0) + 1;
        FX.float(tx*TS+8 - cam.x, ty*TS - cam.y, '+1 ' + def.n, def.glint || P.white, { scale:1, life:.8 });
      }
      if (v === CRYSTAL) { SFX.play('rarity', 2); FX.stars(tx*TS+8-cam.x, ty*TS+8-cam.y, 10, P.purple); }
    }
  }
  function place(tx, ty) {
    const key = PLACEABLE[sel];
    if (!bag[key]) { flash('none left'); return; }
    if (get(tx,ty) !== AIR) return;
    const bx = Math.floor(cat.x/TS), by = Math.floor((cat.y-cat.h/2)/TS);
    if (tx === bx && (ty === by || ty === by+1)) return;      /* do not brick yourself in */
    set(tx,ty, PLACE_TILE[key]);
    bag[key]--;
    SFX.play('build');
    FX.dust(tx*TS+8-cam.x, ty*TS+8-cam.y, 4);
  }
  const flash = m => { msg = m; msgT = 1.3; };

  /* ---- question gates --------------------------------------------------- */
  function askQuiz(kind, at) {
    const q = CONTENT.question(bank);
    quiz = { kind, at, q, pick:-1, lock:0 };
    SFX.play('power');
  }
  function resolveQuiz(i) {
    const ok = quiz.q.o[i] === quiz.q.a;
    quiz.pick = i; quiz.lock = 1.1; quiz.ok = ok;
    S.dailyTick(1);
    S.sawCard(bank, quiz.q.q, quiz.q.a); S.gotCard(bank, quiz.q.q, ok);
    if (ok) {
      SFX.play('correct');
      if (quiz.kind === 'rune') {
        for (let y=0;y<WH;y++) for (let x=0;x<WW;x++) if (get(x,y) === RUNE && Math.abs(x-quiz.at.tx)<6 && Math.abs(y-quiz.at.ty)<6) set(x,y,AIR);
        flash('the runes let you through');
      } else if (quiz.kind === 'chest') {
        set(quiz.at.tx, quiz.at.ty, AIR);
        const loot = { copper:rndi(3,8), silver:rndi(1,4), crystal:rndi(0,2) };
        for (const k in loot) { haul[k] = (haul[k]||0)+loot[k]; bag[k] = (bag[k]||0)+loot[k]; }
        S.pushChest(S.rollRarity(.25), pack.id);
        flash('a chest, and it came home with you');
        FX.confetti(VW/2, 300, 50);
      } else if (quiz.kind === 'mob') {
        quiz.at.alive = false;
        FX.burst(quiz.at.x-cam.x, quiz.at.y-cam.y, 22, [P.red,P.white], { speed:150 });
        flash('driven off');
      }
    } else {
      SFX.play('wrong'); FX.shake(6,.3);
      cat.hp -= 14; cat.hurt = .5;
      if (quiz.kind === 'mob') { quiz.at.cool = 4; }
      flash('wrong — that hurt');
    }
  }

  /* ---- surfacing -------------------------------------------------------- */
  function surface(died) {
    const keep = died ? .5 : 1;
    const got = {};
    const give = (res, n) => { if (n > 0) { S.give(res, n); got[res] = n; } };
    give('wood',  Math.floor((haul.wood||0)*keep) + Math.floor((haul.plank||0)*keep));
    give('stone', Math.floor(((haul.stone||0) + (haul.dirt||0)*0.5)*keep));
    give('coins', Math.floor(((haul.copper||0)*9 + (haul.silver||0)*22)*keep));
    give('essence', Math.floor((haul.crystal||0)*3*keep));
    const xp = Math.floor((depthBest*0.7 + (haul.crystal||0)*6)*keep);
    S.addXp(xp);
    S.d.stats.chopped += (haul.stone||0) + (haul.dirt||0);
    S.save();
    over = { died, got, xp, t:0 };
    SFX.play(died ? 'lose' : 'win');
    if (!died) FX.confetti(VW/2, 240, 70);
  }

  /* ====================================================================== */
  return {
    enter(data) {
      t = 0; haul = {}; bag = { dirt:0, stone:0, wood:0, plank:6, torch:8 };
      sel = 4; quiz = null; msg = ''; msgT = 0; over = null; depthBest = 0; breaking = null;
      touchL = touchR = false;
      pack = CONTENT.pack((data && data.packId)) || pick(S.unlockedPacks().filter(u=>u.open)).pack;
      bank = pack.bank;
      const surf = build();
      spawn(surf);
      seedMobs();
      cam = { x: cat.x - VW/2, y: cat.y - VH/2 };
      SFX.music(false); SFX.duck(.05);
    },
    exit() { SFX.duck(.16); SFX.music(true); },
    back() { if (quiz) return; if (over) Game.go('island'); else surface(false); },

    update(dt) {
      t += dt;
      if (msgT > 0) msgT -= dt;
      if (over) { over.t += dt; return; }
      if (quiz) { if (quiz.lock > 0) { quiz.lock -= dt; if (quiz.lock <= 0) quiz = null; } return; }
      if (cat.hurt > 0) cat.hurt -= dt;
      if (cat.land > 0) cat.land -= dt;

      /* movement */
      const acc = cat.onGround ? 900 : 420;
      if (touchL) { cat.vx -= acc*dt; cat.face = -1; }
      if (touchR) { cat.vx += acc*dt; cat.face = 1; }
      if (!touchL && !touchR) cat.vx *= Math.pow(.0016, dt);
      cat.vx = clamp(cat.vx, -78, 78);
      cat.vy = Math.min(cat.vy + 620*dt, 320);

      let nx = cat.x + cat.vx*dt;
      if (!collide(nx, cat.y)) cat.x = nx;
      else { cat.vx = 0;
             /* step up a single block, the way Terraria lets you walk up a lip */
             if (cat.onGround && !collide(nx, cat.y - TS) && !collide(cat.x, cat.y - TS)) cat.y -= TS; }
      let ny = cat.y + cat.vy*dt;
      if (!collide(cat.x, ny)) { cat.y = ny; cat.onGround = false; }
      else { if (cat.vy > 0) { if (!cat.onGround && cat.vy > 120) { cat.land = .22; SFX.play('step'); FX.dust(cat.x-cam.x, cat.y-cam.y, 6); } cat.onGround = true; } cat.vy = 0;
             while (collide(cat.x, cat.y)) cat.y -= 1; }
      cat.x = clamp(cat.x, TS, (WW-1)*TS);

      if (Math.abs(cat.vx) > 6 && cat.onGround) {
        cat.ft += dt;
        if (cat.ft > .12) { cat.ft = 0; cat.f = (cat.f+1)%4; if (cat.f%2===0) SFX.play('step'); }
      } else cat.f = 0;

      const depth = Math.max(0, Math.floor(cat.y/TS) - 14);
      depthBest = Math.max(depthBest, depth);

      /* mobs */
      for (const m of mobs) {
        if (!m.alive) continue;
        m.t += dt;
        if (m.cool) { m.cool -= dt; }
        const nxm = m.x + m.dir*18*dt;
        if (SOLID(get(Math.floor(nxm/TS), Math.floor(m.y/TS)))) m.dir *= -1; else m.x = nxm;
        m.y += Math.sin(m.t*2)*.2;
        if (!m.cool && Math.abs(m.x-cat.x) < 14 && Math.abs(m.y-(cat.y-cat.h/2)) < 16) {
          askQuiz('mob', m);
        }
      }

      /* camera, easing and clamped to the world */
      cam.x += ((cat.x - VW/2) - cam.x) * Math.min(1, dt*6);
      cam.y += ((cat.y - VH*0.46) - cam.y) * Math.min(1, dt*6);
      cam.x = clamp(cam.x, 0, WW*TS - VW);
      cam.y = clamp(cam.y, -40, WH*TS - VH);

      if (cat.hp <= 0) surface(true);
    },

    draw(c) {
      const depth = Math.max(0, Math.floor(cat.y/TS) - 14);
      /* sky fades to rock as you go down */
      const k = clamp(depth/46, 0, 1);
      const sky = c.createLinearGradient(0,0,0,VH);
      sky.addColorStop(0, k < 1 ? shade('#6cc8ff', -k*.92) : '#0a0714');
      sky.addColorStop(1, k < 1 ? shade('#2c7ff0', -Math.min(1,k*1.1)*.95) : '#06040e');
      c.fillStyle = sky; c.fillRect(0,0,VW,VH);
      if (k < .6) { c.globalAlpha = 1-k/.6; drawCloud(c, 60 - (cam.x*.2)%400, 60 - cam.y*.15, 1.4, .5);
                    drawCloud(c, 260 - (cam.x*.2)%400, 110 - cam.y*.15, 1.1, .4); c.globalAlpha = 1; }

      const x0 = Math.floor(cam.x/TS)-1, x1 = x0 + Math.ceil(VW/TS)+2;
      const y0 = Math.floor(cam.y/TS)-1, y1 = y0 + Math.ceil(VH/TS)+2;

      /* light map: the cat carries one, torches add their own */
      const lights = [{ x:cat.x, y:cat.y-cat.h/2, r:5.4 }];
      for (let y=y0;y<=y1;y++) for (let x=x0;x<=x1;x++)
        if (get(x,y) === TORCH) lights.push({ x:(x+.5)*TS, y:(y+.5)*TS, r:7 });

      /* the wall layer: what you see through a hole in the rock is more rock,
         not the sky. Terraria lives or dies on this. */
      for (let y=Math.max(0,y0);y<=y1;y++) {
        for (let x=Math.max(0,x0);x<Math.min(WW,x1);x++) {
          const sh = surfH[x] == null ? 12 : surfH[x];
          if (y <= sh) continue;
          const sx = Math.round(x*TS - cam.x), sy = Math.round(y*TS - cam.y);
          const deep = y - sh;
          const wall = deep < 4 ? '#5e3719' : deep < 30 ? '#39304a' : '#241f33';
          c.fillStyle = wall; c.fillRect(sx, sy, TS, TS);
          c.fillStyle = rgba('#000000',.22);
          c.fillRect(sx, sy, TS, 1); c.fillRect(sx, sy, 1, TS);
          const wr = srnd(x*6151 + y*233);
          for (let i=0;i<2;i++)
            { c.fillStyle = rgba('#ffffff',.045);
              c.fillRect(sx+Math.floor(wr()*(TS-2)), sy+Math.floor(wr()*(TS-2)), 2, 2); }
        }
      }

      for (let y=y0;y<=y1;y++) {
        for (let x=x0;x<=x1;x++) {
          const v = get(x,y);
          if (v === AIR) continue;
          const def = TILE[v]; if (!def) continue;
          const sx = Math.round(x*TS - cam.x), sy = Math.round(y*TS - cam.y);
          if (v === TORCH) {
            c.fillStyle = P.wood3; c.fillRect(sx+7, sy+6, 2, 9);
            const fl = .8 + .2*Math.sin(t*9 + x);
            c.fillStyle = P.orange; c.fillRect(sx+6, sy+2, 4, 5);
            c.fillStyle = P.gold;   c.fillRect(sx+7, sy+1, 2, 4*fl);
            continue;
          }
          /* body — flat, so a solid mass does not band into stripes */
          c.fillStyle = def.col; c.fillRect(sx, sy, TS, TS);
          /* only the faces actually touching air get shaded */
          if (get(x,y+1) === AIR) { c.fillStyle = def.col2; c.fillRect(sx, sy+TS-3, TS, 3); }
          if (get(x,y-1) === AIR) { c.fillStyle = shade(def.col,.34); c.fillRect(sx, sy, TS, 3); }
          if (get(x-1,y) === AIR) { c.fillStyle = shade(def.col,.18); c.fillRect(sx, sy, 2, TS); }
          if (get(x+1,y) === AIR) { c.fillStyle = shade(def.col2,-.25); c.fillRect(sx+TS-2, sy, 2, TS); }
          /* texture, stable per tile so it never crawls */
          const rr = srnd(x*7919 + y*104729);
          for (let i=0;i<2;i++) {
            const px = sx + Math.floor(rr()*(TS-3)), py = sy + 3 + Math.floor(rr()*(TS-5));
            c.fillStyle = rgba(def.col2,.45); c.fillRect(px, py, 2, 2);
          }
          if (def.glint) {
            const g = srnd(x*31 + y*17);
            for (let i=0;i<3;i++) {
              const px = sx + 2 + Math.floor(g()*(TS-5)), py = sy + 3 + Math.floor(g()*(TS-6));
              c.fillStyle = def.glint; c.fillRect(px, py, 2, 2);
              c.fillStyle = shade(def.glint,-.35); c.fillRect(px+2, py+2, 1, 1);
            }
          }
          if (v === RUNE) {
            const pl = .6+.4*Math.sin(t*3 + y);
            c.globalAlpha = pl; c.fillStyle = P.pink;
            c.fillRect(sx+4, sy+4, 8, 2); c.fillRect(sx+7, sy+4, 2, 8); c.fillRect(sx+4, sy+10, 8, 2);
            c.globalAlpha = 1;
          }
          if (v === CHEST) { spr(c, 'chestSm', sx+2, sy+3, { scale:1 }); }
          if (breaking && breaking.tx === x && breaking.ty === y) {
            c.fillStyle = rgba('#000000',.35);
            const n = breaking.n / (TILE[v].hard||1);
            for (let i=0;i<8*n;i++) { const b = srnd(i*13+x+y);
              c.fillRect(sx+Math.floor(b()*14), sy+Math.floor(b()*14), 2, 2); }
          }
        }
      }

      /* mobs */
      for (const m of mobs) {
        if (!m.alive) continue;
        const sx = Math.round(m.x - cam.x), sy = Math.round(m.y - cam.y);
        if (sx < -40 || sx > VW+40 || sy < -40 || sy > VH+40) continue;
        spr(c, m.spr, sx, sy + Math.sin(m.t*3)*2, { center:true, scale:1, flip:m.dir<0 });
        if (m.cool) { c.globalAlpha = .5; ctxt(c, sx, sy-16, 'zzz', P.white, 1, P.ink); c.globalAlpha = 1; }
      }

      /* the cat */
      const pose = !cat.onGround ? 'attack' : Math.abs(cat.vx) > 6 ? 'walk' : cat.digT > 0 ? 'dig' : 'idle';
      const sq = cat.land > 0 ? 1 + ease.out(1 - cat.land/.22)*0 + (cat.land/.22)*.34
               : !cat.onGround ? (cat.vy < 0 ? .92 : 1.06) : 1;
      AV.draw(c, cat.x - cam.x, cat.y - cam.y, S.d.cfg, pose, cat.f,
              { scale:1, flip:cat.face < 0, shadow:false, squash:sq });
      if (cat.hurt > 0) { c.globalAlpha = cat.hurt*1.6; c.fillStyle = P.red;
                          c.fillRect(cat.x-cam.x-8, cat.y-cam.y-22, 16, 22); c.globalAlpha = 1; }

      /* darkness, punched through by every light */
      if (k > .05) {
        const dark = surface2();
        const d = dark.getContext('2d');
        d.clearRect(0,0,VW,VH);
        d.fillStyle = rgba('#05030c', Math.min(.93, k*1.05));
        d.fillRect(0,0,VW,VH);
        d.globalCompositeOperation = 'destination-out';
        for (const L of lights) {
          const lx = L.x - cam.x, ly = L.y - cam.y;
          if (lx < -140 || lx > VW+140 || ly < -140 || ly > VH+140) continue;
          const rad = L.r*TS*(0.94 + .06*Math.sin(t*6));
          const g = d.createRadialGradient(lx, ly, rad*.18, lx, ly, rad);
          g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(.55,'rgba(0,0,0,.72)');
          g.addColorStop(1,'rgba(0,0,0,0)');
          d.fillStyle = g; d.beginPath(); d.arc(lx, ly, rad, 0, TAU); d.fill();
        }
        d.globalCompositeOperation = 'source-over';
        c.drawImage(dark, 0, 0);
      }

      FX.drawParts(c); FX.drawFloats(c);

      /* --- touch: dig, place -------------------------------------------- */
      if (!quiz && !over && Input.down && Input.y < VH-150) {
        const tx = Math.floor((Input.x + cam.x)/TS), ty = Math.floor((Input.y + cam.y)/TS);
        if (reachable(tx,ty)) {
          cat.digT = .2;
          if (get(tx,ty) === AIR) { if (Input.justDown) place(tx,ty); }
          else if (Input.justDown || (t*7|0) !== ((t-.016)*7|0)) dig(tx,ty);
          /* the target square */
          const sx = tx*TS - cam.x, sy = ty*TS - cam.y;
          c.strokeStyle = rgba(P.white,.8); c.lineWidth = 1;
          c.strokeRect(Math.round(sx)+.5, Math.round(sy)+.5, TS-1, TS-1);
        } else {
          const sx = tx*TS - cam.x, sy = ty*TS - cam.y;
          c.strokeStyle = rgba(P.red,.5); c.lineWidth = 1;
          c.strokeRect(Math.round(sx)+.5, Math.round(sy)+.5, TS-1, TS-1);
        }
      }
      if (cat.digT > 0) cat.digT -= 1/60;

      drawHud(c, depth);
      if (quiz) drawQuiz(c);
      if (over) drawOver(c);
    }
  };

  let _dark = null;
  function surface2() { if (!_dark) _dark = surface(VW,VH); return _dark; }

  /* ---------------------------------------------------------------------- */
  function drawHud(c, depth) {
    pbox(c, -2, -2, VW+4, 26, rgba(P.ink,.85), 3);
    spr(c, 'i_heart', 6, 5);
    bar(c, 22, 8, 76, 8, cat.hp/cat.maxHp, cat.hp > 30 ? P.green : P.red);
    txt(c, 104, 9, 'DEPTH ' + depth + 'm', depth > 40 ? P.pink : P.bone, 1, P.shadow);
    const worth = (haul.copper||0)*9 + (haul.silver||0)*22;
    spr(c, 'i_coin', 196, 5); txt(c, 210, 9, String(worth), P.gold, 1, P.shadow);
    spr(c, 'i_essence', 244, 5); txt(c, 258, 9, String(haul.crystal||0), P.purple, 1, P.shadow);
    if (UI.btn(c, VW-64, 3, 60, 19, 'SURFACE', { col:'#1a7331', col2:'#3fe07a', shadow:false }))
      surface(false);

    if (msgT > 0) { c.globalAlpha = clamp(msgT,0,1);
      ctxt(c, VW/2, 34, msg, P.gold, 1, P.ink); c.globalAlpha = 1; }

    /* --- controls ------------------------------------------------------- */
    const by = VH-92;
    pbox(c, -2, by-8, VW+4, 104, rgba(P.ink,.9), 4);
    /* hotbar */
    for (let i=0;i<PLACEABLE.length;i++) {
      const key = PLACEABLE[i], x = 8 + i*44;
      const on = sel === i;
      pbox(c, x-1, by-3, 42, 30, on ? P.gold : P.ink, 3);
      pbox(c, x, by-2, 40, 28, '#241640', 3);
      const tv = PLACE_TILE[key], def = TILE[tv];
      c.fillStyle = def.col2; c.fillRect(x+12, by+4, 14, 14);
      c.fillStyle = def.col;  c.fillRect(x+12, by+4, 14, 11);
      c.fillStyle = shade(def.col,.3); c.fillRect(x+12, by+4, 14, 2);
      txt(c, x+3, by+18, String(bag[key]||0), bag[key] ? P.white : P.grey, 1, P.shadow);
      const z = UI.zone(x, by-2, 40, 28, 'hb'+i);
      if (z.click) { sel = i; SFX.play('tap'); }
    }
    /* d-pad + jump */
    const py = VH-58;
    const L = UI.zone(8, py, 60, 52, 'L'), R = UI.zone(76, py, 60, 52, 'R');
    touchL = L.down; touchR = R.down;
    const padBtn = (zx, zy, w, h, label, down) => {
      pbox(c, zx-1, zy-1+(down?2:0), w+2, h+2, P.ink, 4);
      pbox(c, zx, zy+(down?2:0), w, h-(down?2:0), down ? '#5a4790' : '#3a2a5e', 3);
      ctxt(c, zx+w/2, zy+h/2-4+(down?2:0), label, P.white, 2);
    };
    padBtn(8, py, 60, 52, '<', L.down);
    padBtn(76, py, 60, 52, '>', R.down);
    const J = UI.zone(VW-88, py, 80, 52, 'J');
    padBtn(VW-88, py, 80, 52, 'JUMP', J.down);
    if (J.down && cat.onGround) { cat.vy = -232; cat.onGround = false; SFX.play('pop'); FX.dust(cat.x-cam.x, cat.y-cam.y, 5); }
    ctxt(c, VW/2, py+18, 'TAP THE ROCK', P.grey, 1);
    ctxt(c, VW/2, py+30, 'TO DIG', P.grey, 1);
  }

  function drawQuiz(c) {
    c.fillStyle = rgba(P.shadow,.93); c.fillRect(0,0,VW,VH);
    const title = quiz.kind === 'rune' ? 'THE RUNES ASK' : quiz.kind === 'chest' ? 'THE CHEST IS LOCKED' : 'AMBUSHED!';
    const col = quiz.kind === 'mob' ? P.red : P.pink;
    ctxt(c, VW/2, 90, title, col, 3, P.ink);
    if (quiz.kind === 'mob') spr(c, quiz.at.spr, VW/2, 160, { center:true, scale:3 });
    else spr(c, quiz.kind === 'chest' ? 'chestSm' : 'crystal', VW/2, 160, { center:true, scale:3 });
    panel(c, 14, 196, VW-28, 74, '#241640', { r:4 });
    wrap(quiz.q.q, VW-46, 1).forEach((l,i) => ctxt(c, VW/2, 208+i*12, l, P.white, 1, P.shadow));
    for (let i=0;i<quiz.q.o.length;i++) {
      const y = 286 + i*56;
      const show = quiz.pick >= 0;
      const right = quiz.q.o[i] === quiz.q.a;
      const bg  = show ? (right ? '#1a7331' : (quiz.pick===i ? '#8a2a3a' : '#2e1b50')) : '#3a2a5e';
      const bg2 = show ? (right ? '#3fe07a' : (quiz.pick===i ? P.red : '#3f2a68')) : '#5a4790';
      if (UI.btnWrap(c, 20, y, VW-40, 46, quiz.q.o[i], { col:bg, col2:bg2, key:'dq'+i, disabled:show })
          && quiz.pick < 0) resolveQuiz(i);
    }
    if (quiz.pick >= 0)
      ctxt(c, VW/2, VH-36, quiz.ok ? 'CORRECT' : 'THE ANSWER WAS: ' + quiz.q.a,
           quiz.ok ? P.lime : P.red, quiz.ok ? 2 : 1, P.ink);
  }

  function drawOver(c) {
    c.fillStyle = rgba(P.shadow,.94); c.fillRect(0,0,VW,VH);
    const k = ease.back(clamp(over.t/.7,0,1));
    c.save(); c.translate(VW/2,120); c.scale(k,k); c.translate(-VW/2,-120);
    ctxt(c, VW/2, 100, over.died ? 'YOU BLACKED OUT' : 'BACK IN THE SUN', over.died ? P.red : P.gold, 3, P.ink);
    c.restore();
    ctxt(c, VW/2, 140, 'DEEPEST: ' + depthBest + 'm', P.cyan, 2, P.ink);
    if (over.died) ctxt(c, VW/2, 164, 'you dropped half the haul', P.red, 1);
    AV.draw(c, VW/2, 300, S.d.cfg, over.died ? 'hurt' : 'cheer', Math.floor(t*3)%2, { scale:3 });
    panel(c, 40, 326, VW-80, 132, '#241640', { r:4 });
    ctxt(c, VW/2, 336, 'WHAT YOU BROUGHT UP', P.gold, 1);
    let i = 0;
    for (const key in over.got) {
      const y = 356 + i*20; i++;
      spr(c, key === 'coins' ? 'i_coin' : 'i_'+key, 74, y);
      txt(c, 94, y+3, '+' + over.got[key] + '  ' + key.toUpperCase(), P.white, 1, P.shadow);
    }
    if (!i) ctxt(c, VW/2, 380, 'nothing. not one rock.', P.grey, 1);
    txt(c, 94, 356 + i*20 + 3, '+' + over.xp + '  XP', P.lime, 1, P.shadow);
    if (UI.btn(c, 40, 486, 130, 34, 'AGAIN', { col:'#3a2a5e', col2:'#5a4790' })) Game.go('deep', { packId:pack.id });
    if (UI.btn(c, 190, 486, 130, 34, 'HOME', { col:'#1a7331', col2:'#3fe07a', glow:P.gold })) Game.go('island');
  }
})());
