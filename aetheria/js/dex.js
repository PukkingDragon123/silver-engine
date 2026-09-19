/* =========================================================================
   DECK — the study side of the study game.

   DEX      every card you have met, how often you got it right
   REVIEW   a ten-card quickfire built out of the ones you keep missing
   CUSTOM   write your own lesson and take it into a real battle
   ========================================================================= */

/* a pixel keyboard that any screen can borrow */
const KeyIn = (() => {
  let active = null;
  const ROWS = ['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
  return {
    open(title, value, max, cb) { active = { title, v:value||'', max:max||28, cb, num:false }; },
    get open2() { return !!active; },
    get isOpen() { return !!active; },
    close() { active = null; },
    draw(c) {
      if (!active) return true;
      c.fillStyle = rgba(P.shadow,.92); c.fillRect(0,0,VW,VH);
      ctxt(c, VW/2, 120, active.title, P.gold, 2, P.ink);
      panel(c, 20, 148, VW-40, 30, '#241640');
      const shown = active.v.length > 22 ? '…' + active.v.slice(-21) : active.v;
      ctxt(c, VW/2, 158, shown + (Math.floor(UI.time*2)%2 ? '_' : ''), P.white, 2);
      ctxt(c, VW/2, 182, active.v.length + '/' + active.max, P.grey, 1);
      let y = 200;
      const set = active.num ? ['1234567890','+-=/*.,()','<>%:?!'] : ROWS;
      for (let r=0;r<set.length;r++) {
        const row = set[r], kw = 32, gap = 3;
        const total = row.length*kw + (row.length-1)*gap;
        for (let i=0;i<row.length;i++) {
          if (UI.btn(c, VW/2-total/2 + i*(kw+gap), y, kw, 28, row[i],
                     { col:'#3a2a5e', col2:'#5a4790', scale:1, key:'ki'+r+i })) {
            if (active.v.length < active.max) active.v += row[i];
          }
        }
        y += 32;
      }
      if (UI.btn(c, 20, y, 80, 28, 'SPACE', { col:'#3a2a5e', col2:'#5a4790' }))
        { if (active.v.length < active.max) active.v += ' '; }
      if (UI.btn(c, 108, y, 70, 28, active.num ? 'ABC' : '123', { col:'#2358c9', col2:P.blue }))
        active.num = !active.num;
      if (UI.btn(c, 186, y, 70, 28, 'DEL', { col:'#8a2a3a', col2:P.red })) active.v = active.v.slice(0,-1);
      if (UI.btn(c, 264, y, 76, 28, 'OK', { col:'#1a7331', col2:'#3fe07a' })) {
        const cb = active.cb, v = active.v.trim(); active = null; cb(v);
      }
      if (UI.btn(c, VW/2-50, y+34, 100, 24, 'CANCEL', { col:'#3a2a5e', col2:'#5a4790' })) active = null;
      return false;
    },
    key(k) {
      if (!active) return;
      if (k === 'Backspace') active.v = active.v.slice(0,-1);
      else if (k === 'Enter') { const cb = active.cb, v = active.v.trim(); active = null; cb(v); }
      else if (k.length === 1 && active.v.length < active.max) active.v += k.toUpperCase();
    }
  };
})();

Game.register('dex', (() => {
  let t, tab, bankSel, cardSel, flip, scroll, editing, review;
  const TABS = ['DEX','REVIEW','CUSTOM'];
  const BANKS = () => CONTENT.PACKS.map(p => ({ id:p.bank, name:p.name, col:p.col, icon:p.icon }));

  return {
    enter(data) {
      t = 0; tab = (data && data.tab) || 0; bankSel = null; cardSel = null;
      flip = 0; scroll = 0; editing = null; review = null;
    },
    back() {
      if (KeyIn.isOpen) { KeyIn.close(); return; }
      if (review) { review = null; return; }
      if (editing) { editing = null; return; }
      if (cardSel != null) { cardSel = null; return; }
      if (bankSel) { bankSel = null; return; }
      Game.go('island');
    },
    key(k) { KeyIn.key(k); },
    update(dt) {
      t += dt;
      if (cardSel != null) flip = Math.min(1, flip + dt*3);
      if (!KeyIn.isOpen && Input.down && Math.abs(Input.dy) > 4) scroll = clamp(scroll - Input.dy*.05, 0, 400);
      scroll = clamp(scroll + Input.wheel*10, 0, 400);
      if (review) reviewUpdate(dt);
    },
    draw(c) {
      drawSky(c, t*.3, { top:'#0f1f4a', mid:'#2358c9', bot:'#6cc8ff', sun:false, stars:true });
      c.fillStyle = rgba(P.ink,.45); c.fillRect(0,0,VW,VH);
      UI.topBar(c);
      if (review) { drawReview(c); return; }
      if (editing) { drawEditor(c); KeyIn.draw(c); return; }

      UI.header(c, 32, 'YOUR DECK', 'every card you have met', P.cyan);
      for (let i=0;i<TABS.length;i++)
        if (UI.btn(c, 10 + i*114, 72, 110, 24, TABS[i],
                   { col: tab===i?'#2358c9':'#2e1b50', col2: tab===i?P.blue:'#3f2a68', txt: tab===i?P.white:P.grey })) {
          tab = i; bankSel = null; cardSel = null; scroll = 0;
        }
      if (tab === 0) drawDex(c);
      else if (tab === 1) drawReviewMenu(c);
      else drawCustom(c);

      if (UI.btn(c, 8, 34, 36, 22, '<', { col:'#4a3a70', col2:'#6b56a0' })) this.back();
      KeyIn.draw(c);
    }
  };

  /* ==== DEX ============================================================= */
  function drawDex(c) {
    if (cardSel) { drawCardFlip(c); return; }
    if (!bankSel) {
      let y = 106;
      const all = S.dexList();
      panel(c, 10, y, VW-20, 30, '#241640');
      txt(c, 18, y+6, 'CARDS MET', P.gold, 1);
      txt(c, 18, y+18, all.length + ' of ' + (Object.values(CONTENT.Q).reduce((a,b)=>a+b.length,0)) + ' in the world', P.bone, 1);
      const mastered = all.filter(e => e.right >= 2).length;
      txt(c, 220, y+6, 'MASTERED', P.lime, 1);
      txt(c, 220, y+18, String(mastered), P.white, 2);
      y += 38;
      for (const b of BANKS()) {
        const list = S.dexList(b.id);
        const total = (CONTENT.Q[b.id]||[]).length;
        panel(c, 10, y, VW-20, 44, '#2e1b50');
        spr(c, b.icon, 18, y+16, { scale:1 });
        txt(c, 36, y+6, b.name, b.col, 1, P.shadow);
        bar(c, 36, y+20, 200, 6, total ? list.length/total : 0, b.col, { shine:t });
        txt(c, 36, y+30, list.length + ' / ' + total + ' seen   ' +
                         list.filter(e=>e.right>=2).length + ' mastered', P.grey, 1);
        if (UI.btn(c, VW-70, y+10, 52, 24, 'OPEN', { col:'#2358c9', col2:P.blue, key:'dx'+b.id,
                   disabled: !list.length })) { bankSel = b; scroll = 0; }
        y += 48;
      }
      if (S.dexList().length === 0) ctxt(c, VW/2, y+20, 'play a battle to start collecting', P.grey, 1);
      return;
    }
    /* card list for one bank */
    txt(c, 12, 104, bankSel.name, bankSel.col, 2, P.shadow);
    if (UI.btn(c, VW-70, 100, 58, 22, 'BACK', { col:'#4a3a70', col2:'#6b56a0' })) { bankSel = null; return; }
    const list = S.dexList(bankSel.id);
    c.save(); c.beginPath(); c.rect(0,126,VW,VH-126); c.clip();
    let y = 128 - scroll;
    for (let i=0;i<list.length;i++) {
      const e = list[i];
      if (y > VH) break;
      if (y > 110) {
        const mastered = e.right >= 2;
        panel(c, 10, y, VW-20, 34, mastered ? '#1a5a33' : '#2e1b50');
        const lines = wrap(e.q, VW-90, 1);
        lines.slice(0,2).forEach((l,j) => txt(c, 18, y+6+j*11, l, P.white, 1, P.shadow));
        spr(c, mastered ? 'i_star' : 'i_book', VW-40, y+11);
        txt(c, VW-58, y+14, e.right + '/' + e.seen, mastered ? P.gold : P.grey, 1);
        const z = UI.zone(10, y, VW-20, 34, 'cd'+i);
        if (z.click) { cardSel = e; flip = 0; SFX.play('tap'); }
      }
      y += 38;
    }
    c.restore();
  }
  function drawCardFlip(c) {
    const e = cardSel;
    const k = ease.back(clamp(flip,0,1));
    const w = 280, h = 180, x = VW/2-w/2, y = 200;
    const squash = Math.abs(Math.cos(Math.min(flip,1)*Math.PI));
    c.save();
    c.translate(VW/2, y+h/2); c.scale(flip < .5 ? squash : 1, 1); c.translate(-VW/2, -(y+h/2));
    panel(c, x, y, w, h, '#241640', { r:4 });
    pbox(c, x, y, w, 5, P.cyan, 3);
    if (flip < .5) {
      ctxt(c, VW/2, y+16, 'QUESTION', P.grey, 1);
      wrap(e.q, w-24, 1).forEach((l,i) => ctxt(c, VW/2, y+50+i*13, l, P.white, 1, P.shadow));
    } else {
      ctxt(c, VW/2, y+16, 'ANSWER', P.gold, 1);
      wrap(e.a, w-24, 1).forEach((l,i) => ctxt(c, VW/2, y+64+i*15, l, P.lime, 2, P.shadow));
      ctxt(c, VW/2, y+h-28, 'seen ' + e.seen + '   right ' + e.right, P.grey, 1);
    }
    c.restore();
    if (flip >= 1 && UI.btn(c, 60, 420, VW-120, 30, 'BACK TO THE LIST', { col:'#4a3a70', col2:'#6b56a0' }))
      { cardSel = null; }
    ctxt(c, VW/2, 464, 'tap a card in the list to flip it', P.grey, 1);
  }

  /* ==== REVIEW ========================================================== */
  function buildReview() {
    const entries = S.dexList();
    const rows = [];
    for (const e of entries) {
      const bank = CONTENT.Q[e.bank];
      if (!bank) continue;
      const row = bank.find(r => r[0] === e.q);
      if (row) rows.push({ row, weak: e.seen - e.right });
    }
    if (!rows.length) return null;
    rows.sort((a,b) => b.weak - a.weak);
    const pool = shuffle(rows.slice(0, Math.max(10, Math.ceil(rows.length*.6)))).slice(0,10);
    return { qs: pool.map(r => ({ q:r.row[0], a:r.row[1], o:shuffle(r.row.slice(1)) })),
             i:0, right:0, pick:-1, lock:0, done:false };
  }
  function drawReviewMenu(c) {
    const weak = S.dexList().filter(e => e.right < e.seen);
    panel(c, 10, 106, VW-20, 70, '#241640');
    txt(c, 18, 114, 'QUICKFIRE REVIEW', P.gold, 2, P.shadow);
    txt(c, 18, 134, 'ten cards, weighted towards the ones', P.bone, 1);
    txt(c, 18, 146, 'you keep getting wrong. no monsters.', P.bone, 1);
    txt(c, 18, 162, weak.length + ' shaky ' + plural(weak.length,'card') + ' on file', P.red, 1);
    if (UI.btn(c, 40, 190, VW-80, 36, 'START REVIEW', { col:'#1a7331', col2:'#3fe07a', glow:P.gold, scale:1,
               disabled: S.dexList().length < 4 })) {
      review = buildReview();
      if (!review) UI.toast('meet a few cards first', P.red);
    }
    if (S.dexList().length < 4) ctxt(c, VW/2, 236, 'play a battle first — you need cards', P.grey, 1);
    /* stats block */
    panel(c, 10, 256, VW-20, 120, '#2e1b50');
    txt(c, 18, 264, 'YOUR NUMBERS', P.cyan, 1);
    const st = S.d.stats;
    const rows = [
      ['QUESTIONS ANSWERED', st.answered],
      ['CORRECT', st.correct + '  (' + (st.answered ? Math.round(st.correct/st.answered*100) : 0) + '%)'],
      ['BATTLES WON', st.wins + ' / ' + st.battles],
      ['CHESTS OPENED', st.chests],
      ['STARS EARNED', S.totalStars()],
      ['DAY STREAK', S.d.dayStreak]
    ];
    rows.forEach((r,i) => {
      txt(c, 18, 280+i*15, r[0], P.grey, 1);
      const s = String(r[1]);
      txt(c, VW-26-tw(s,1), 280+i*15, s, P.white, 1, P.shadow);
    });
  }
  function reviewUpdate(dt) {
    if (review.lock > 0) {
      review.lock -= dt;
      if (review.lock <= 0) {
        review.pick = -1;
        review.i++;
        if (review.i >= review.qs.length) review.done = true;
      }
    }
  }
  function drawReview(c) {
    if (review.done) {
      const acc = review.right/review.qs.length;
      ctxt(c, VW/2, 140, 'REVIEW DONE', P.gold, 3, P.ink);
      ctxt(c, VW/2, 180, review.right + ' / ' + review.qs.length, P.white, 4, P.ink);
      UI.stars(c, VW/2, 240, acc >= .9 ? 3 : acc >= .6 ? 2 : 1, 3, 2);
      AV.draw(c, VW/2, 380, S.d.cfg, acc >= .6 ? 'cheer' : 'idle', Math.floor(t*3)%2, { scale:3 });
      if (!review.paid) {
        review.paid = true;
        const coins = 20 + review.right*8, xp = 10 + review.right*4;
        S.give('coins', coins); S.addXp(xp);
        UI.toast('+' + coins + ' COINS  +' + xp + ' XP', P.gold, 'i_coin');
        if (acc >= .9) { S.pushChest(S.rollRarity(.1), null); UI.toast('A CHEST FOR THAT', P.gold, 'i_trophy'); }
        S.save();
      }
      if (UI.btn(c, 80, 440, VW-160, 34, 'DONE', { col:'#1a7331', col2:'#3fe07a', scale:1 })) review = null;
      return;
    }
    const q = review.qs[review.i];
    ctxt(c, VW/2, 40, 'CARD ' + (review.i+1) + ' OF ' + review.qs.length, P.grey, 1);
    bar(c, 40, 56, VW-80, 8, review.i/review.qs.length, P.cyan, { shine:t });
    panel(c, 12, 90, VW-24, 100, '#241640', { r:4 });
    wrap(q.q, VW-44, 1).forEach((l,i) => ctxt(c, VW/2, 110+i*13, l, P.white, 1, P.shadow));
    for (let i=0;i<q.o.length;i++) {
      const y = 214 + i*62;
      const isRight = q.o[i] === q.a;
      const show = review.pick >= 0;
      const col = show ? (isRight ? '#1a7331' : (review.pick === i ? '#8a2a3a' : '#2e1b50')) : '#3a2a5e';
      const col2 = show ? (isRight ? '#3fe07a' : (review.pick === i ? P.red : '#3f2a68')) : '#5a4790';
      if (UI.btnWrap(c, 20, y, VW-40, 52, q.o[i], { col, col2, key:'rv'+i, disabled:show }) && review.pick < 0) {
        review.pick = i; review.lock = 1;
        const ok = isRight;
        if (ok) { review.right++; SFX.play('correct'); FX.stars(VW/2, y+26, 10, P.lime); }
        else { SFX.play('wrong'); FX.shake(4,.2); }
        S.dailyTick(1);
        S.sawCard('review', q.q, q.a); S.gotCard('review', q.q, ok);
      }
    }
    if (UI.btn(c, 8, 8, 40, 22, 'X', { col:'#8a2a3a', col2:P.red })) review = null;
  }

  /* ==== CUSTOM ========================================================== */
  function drawCustom(c) {
    txt(c, 12, 104, 'YOUR OWN LESSONS', P.gold, 1);
    txt(c, 12, 116, 'write cards, then fight with them', P.grey, 1);
    let y = 132;
    for (let i=0;i<S.d.decks.length;i++) {
      const d = S.d.decks[i];
      const n = d.cards.filter(x => x.term && x.def).length;
      panel(c, 10, y, VW-20, 44, '#2e1b50');
      spr(c, 'i_book', 18, y+16);
      txt(c, 36, y+6, d.name, P.cyan, 1, P.shadow);
      txt(c, 36, y+20, n + ' ' + plural(n,'card') + (n < 2 ? '  (need 2 to fight)' : ''), n < 2 ? P.red : P.lime, 1);
      if (UI.btn(c, VW-136, y+10, 56, 24, 'EDIT', { col:'#2358c9', col2:P.blue, key:'ed'+i }))
        { editing = d; scroll = 0; }
      if (UI.btn(c, VW-74, y+10, 56, 24, 'FIGHT', { col:'#1a7331', col2:'#3fe07a', key:'fg'+i, disabled:n < 2 }))
        Game.go('battle', { mode:'custom', deckId:d.id });
      y += 48;
      if (y > VH-90) break;
    }
    if (!S.d.decks.length) {
      panel(c, 10, y, VW-20, 46, '#241640');
      ctxt(c, VW/2, y+12, 'no lessons yet', P.grey, 1);
      ctxt(c, VW/2, y+26, 'make one from tonight\'s homework', P.grey, 1);
      y += 52;
    }
    if (UI.btn(c, 40, Math.min(y+6, VH-60), VW-80, 32, 'NEW LESSON', { col:'#6a27c8', col2:P.purple, glow:P.gold })) {
      KeyIn.open('NAME THE LESSON', '', 22, v => {
        if (!v) return;
        const d = { id:'d'+Date.now(), name:v.toUpperCase(), prompt:'WHAT GOES WITH', cards:[] };
        S.d.decks.push(d); S.save(); editing = d;
        UI.toast('lesson created', P.cyan, 'i_book');
      });
    }
  }
  function drawEditor(c) {
    const d = editing;
    UI.header(c, 32, d.name, 'term on the left, answer on the right', P.cyan);
    if (UI.btn(c, 8, 34, 36, 22, '<', { col:'#4a3a70', col2:'#6b56a0' })) { editing = null; return; }
    if (UI.btn(c, VW-66, 34, 58, 22, 'DELETE', { col:'#8a2a3a', col2:P.red })) {
      S.d.decks.splice(S.d.decks.indexOf(d),1); S.save(); editing = null;
      UI.toast('lesson deleted', P.red); return;
    }
    c.save(); c.beginPath(); c.rect(0,72,VW,VH-132); c.clip();
    let y = 78 - scroll;
    for (let i=0;i<d.cards.length;i++) {
      const card = d.cards[i];
      if (y > VH-60) break;
      if (y > 60) {
        panel(c, 10, y, VW-20, 40, '#2e1b50');
        txt(c, 16, y+5, String(i+1), P.grey, 1);
        const tlines = wrap(card.term || '(tap to write a term)', 130, 1);
        tlines.slice(0,2).forEach((l,j) => txt(c, 28, y+5+j*11, l, card.term ? P.white : P.grey, 1));
        c.fillStyle = rgba(P.white,.2); c.fillRect(166, y+4, 1, 32);
        const dlines = wrap(card.def || '(the answer)', 130, 1);
        dlines.slice(0,2).forEach((l,j) => txt(c, 174, y+5+j*11, l, card.def ? P.lime : P.grey, 1));
        const zt = UI.zone(10, y, 156, 40, 'ct'+i), zd = UI.zone(166, y, 130, 40, 'cd'+i);
        if (zt.click) KeyIn.open('TERM', card.term||'', 40, v => { card.term = v; S.save(); });
        if (zd.click) KeyIn.open('ANSWER', card.def||'', 40, v => { card.def = v; S.save(); });
        if (UI.btn(c, VW-40, y+9, 26, 22, 'X', { col:'#8a2a3a', col2:P.red, key:'rm'+i }))
          { d.cards.splice(i,1); S.save(); break; }
      }
      y += 44;
    }
    c.restore();
    const n = d.cards.filter(x => x.term && x.def).length;
    pbox(c, -2, VH-62, VW+4, 64, rgba(P.ink,.92), 4);
    if (UI.btn(c, 10, VH-54, 150, 28, 'ADD A CARD', { col:'#2358c9', col2:P.blue })) {
      d.cards.push({ term:'', def:'' }); S.save();
      scroll = clamp(d.cards.length*44 - 200, 0, 400);
    }
    if (UI.btn(c, 172, VH-54, 176, 28, n >= 2 ? 'FIGHT WITH IT' : 'NEEDS 2 CARDS',
               { col: n>=2?'#1a7331':'#3a2a5e', col2: n>=2?'#3fe07a':'#5a4790', disabled:n < 2 }))
      Game.go('battle', { mode:'custom', deckId:d.id });
    ctxt(c, VW/2, VH-20, n + ' usable ' + plural(n,'card') + ' — drag to scroll', P.grey, 1);
  }
})());
