/* =========================================================================
   STUDY — the half of the game that is not a game.

   PLAN   the exam countdown, today's session, the whole dated plan
   NOTES  what you have fed the tutor, and turning it into playable worlds
   TUTOR  a cat that has read your notes and will answer questions
   ========================================================================= */
Game.register('study', (() => {
  let t = 0, tab = 0, scroll = 0, maxScroll = 0, dragging = false, startScroll = 0;
  let busy = null;            /* { label, streamed, err, kind } */
  let chat = [];              /* {role, content} */
  let chatStream = '', chatErr = '';
  const TABS = ['PLAN','NOTES','TUTOR'];

  const a = () => AI.material();
  const daysLeft = () => {
    const d = a().examDate;
    if (!d) return null;
    return Math.ceil((new Date(d + 'T23:59:59') - Date.now()) / 86400000);
  };
  const KIND = { learn:{ c:'#49a7ff', n:'LEARN' }, practice:{ c:'#3fe07a', n:'PRACTISE' },
                 review:{ c:'#ffd23f', n:'REVIEW' }, rest:{ c:'#9a8fb5', n:'REST' } };

  function run(kind, label, fn) {
    busy = { kind, label, streamed:'', err:'' };
    const onText = ({ text }) => { if (busy && busy.kind === kind) busy.streamed = text; };
    fn(onText).then(res => {
      busy = null; SFX.play('levelup'); FX.confetti(VW/2, 220, 50);
      if (kind === 'pack' && res) UI.toast(res.name + ' IS ON THE MAP', res.col, 'i_book');
      if (kind === 'plan') UI.toast('PLAN READY', P.gold, 'i_clock');
      if (kind === 'retune') { tab = 0; UI.toast('PLAN RETUNED', P.cyan, 'i_bolt'); }
    }).catch(e => {
      if (busy) { busy.err = AI.errText(e); busy.done = true; }
      SFX.play('wrong');
    });
  }

  return {
    enter(data) {
      t = 0; scroll = 0; busy = null;
      if (data && data.tab != null) tab = data.tab;
      AI.boot();
    },
    back() { if (Sheet.isOpen()) { Sheet.close(); return; } Game.go('island'); },
    update(dt) {
      t += dt;
      if (Sheet.isOpen()) return;
      if (Input.justDown) { dragging = true; startScroll = scroll; }
      if (Input.down && dragging && Math.abs(Input.dy) > 3) scroll = clamp(startScroll + Input.dy, -maxScroll, 0);
      if (!Input.down) dragging = false;
      scroll = clamp(scroll - Input.wheel*26, -maxScroll, 0);
    },

    draw(c) {
      drawSky(c, t*.25, { top:'#161036', mid:'#33215e', bot:'#5b3a8e', sun:false, stars:true });
      c.fillStyle = rgba(P.ink,.5); c.fillRect(0,0,VW,VH);
      UI.topBar(c);
      if (UI.btn(c, 8, 34, 36, 22, '<', { col:'#4a3a70', col2:'#6b56a0' })) Game.go('island');

      /* --- exam header -------------------------------------------------- */
      const d = daysLeft();
      panel(c, 10, 32, VW-20, 40, '#241640', { r:4 });
      const subj = (a().subject || 'YOUR EXAM').toUpperCase().slice(0,20);
      ctxt(c, VW/2, 38, subj, P.gold, 2, P.shadow);
      if (d == null) ctxt(c, VW/2, 58, 'no exam date set yet', P.grey, 1);
      else if (d < 0) ctxt(c, VW/2, 58, 'that exam has been and gone', P.grey, 1);
      else {
        const col = d <= 3 ? P.red : d <= 10 ? P.orange : P.lime;
        ctxt(c, VW/2, 58, d === 0 ? 'IT IS TODAY. GOOD LUCK.' : d + ' ' + plural(d,'DAY') + ' TO GO', col, 1);
      }
      if (UI.btn(c, VW-52, 36, 44, 20, d == null ? 'SET' : 'EDIT',
                 { col:'#6a27c8', col2:P.purple })) Sheet.examDate();

      for (let i=0;i<TABS.length;i++)
        if (UI.btn(c, 10 + i*114, 78, 110, 24, TABS[i],
                   { col: tab===i?'#6a27c8':'#2e1b50', col2: tab===i?P.purple:'#3f2a68',
                     txt: tab===i?P.white:P.grey })) { tab = i; scroll = 0; }

      /* --- tutor status strip ------------------------------------------- */
      const okAI = AI.available();
      pbox(c, 10, 106, VW-20, 16, rgba(okAI ? '#1a5a33' : '#3a2a5e', .8), 3);
      spr(c, 'i_paw', 14, 108);
      txt(c, 30, 110, AI.statusLine(), okAI ? P.lime : P.grey, 1);

      c.save(); c.beginPath(); c.rect(0, 126, VW, VH-126); c.clip();
      if (busy) drawBusy(c);
      else if (tab === 0) drawPlan(c);
      else if (tab === 1) drawNotes(c);
      else drawTutor(c);
      c.restore();

      /* --- bottom: straight to the cards -------------------------------- */
      pbox(c, -2, VH-42, VW+4, 44, rgba(P.ink,.92), 4);
      if (UI.btn(c, 8, VH-36, 108, 28, 'CARDS', { col:'#2358c9', col2:P.blue, icon:'i_book' }))
        Game.go('dex');
      if (UI.btn(c, 124, VH-36, 108, 28, 'DRILL', { col:'#1a7331', col2:'#3fe07a', icon:'i_bolt' }))
        Game.go('dex', { tab:1 });
      if (UI.btn(c, 240, VH-36, 112, 28, 'LABS', { col:'#6a27c8', col2:P.purple, icon:'i_flask' }))
        Game.go('lab');
    }
  };

  /* ---------------------------------------------------------------------- */
  function drawBusy(c) {
    const cy = 280;
    /* the tutor cat, reading */
    AV.draw(c, VW/2, cy, S.d.cfg, Math.floor(t*3)%2 ? 'idle' : 'blink', Math.floor(t*3)%2, { scale:3 });
    spr(c, 'i_book', VW/2 + 26, cy - 46, { center:true, scale:2 });
    for (let i=0;i<5;i++) {
      const k = (t*1.4 + i*.2) % 1;
      c.globalAlpha = 1-k;
      spr(c, 'i_star', VW/2 + 26 + Math.sin(i)*14, cy - 56 - k*30, { center:true });
      c.globalAlpha = 1;
    }
    ctxt(c, VW/2, 170, busy.err ? 'THE TUTOR STOPPED' : busy.label, busy.err ? P.red : P.gold, 2, P.ink);
    if (busy.err) {
      wrap(busy.err, VW-60, 1).forEach((l,i) => ctxt(c, VW/2, 200+i*12, l, P.bone, 1));
      if (UI.btn(c, VW/2-60, 380, 120, 28, 'OK', { col:'#3a2a5e', col2:'#5a4790' })) busy = null;
      return;
    }
    const dots = '.'.repeat(1 + Math.floor(t*2)%3);
    ctxt(c, VW/2, 194, 'reading your notes' + dots, P.grey, 1);
    bar(c, 50, 348, VW-100, 8, ((t*.35)%1), P.purple, { shine:t*2 });
    const n = (busy.streamed||'').length;
    ctxt(c, VW/2, 364, n ? n.toLocaleString() + ' characters written' : 'thinking', P.grey, 1);
    ctxt(c, VW/2, 392, 'this takes a few seconds — do not leave', P.grey, 1);
  }

  /* ==== PLAN ============================================================ */
  function drawPlan(c) {
    const plan = a().plan;
    if (!plan) {
      let y = 150;
      panel(c, 14, y, VW-28, 120, '#241640', { r:4 });
      ctxt(c, VW/2, y+12, 'NO PLAN YET', P.gold, 2);
      ['Give the tutor your notes and an exam', 'date, and it will lay out what to',
       'study on which day, working back', 'from the exam.'].forEach((l,i) =>
        ctxt(c, VW/2, y+38+i*13, l, P.bone, 1));
      y += 132;
      const hasMat = a().material.length > 0;
      if (UI.btn(c, 40, y, VW-80, 34, hasMat ? 'BUILD MY PLAN' : 'ADD NOTES FIRST',
                 { col: hasMat?'#1a7331':'#3a2a5e', col2: hasMat?'#3fe07a':'#5a4790',
                   glow: hasMat?P.gold:null, disabled: !AI.available() || !hasMat })) {
        run('plan', 'BUILDING YOUR PLAN', onText => AI.plan(a().examDate, a().subject, onText));
      }
      if (!hasMat && UI.btn(c, 40, y+44, VW-80, 30, 'GO TO NOTES', { col:'#6a27c8', col2:P.purple }))
        { tab = 1; scroll = 0; }
      maxScroll = 0;
      return;
    }
    let y = 134 + scroll;
    const top = y;
    if (plan.summary) {
      panel(c, 10, y, VW-20, 34, '#2e1b50');
      wrap(plan.summary, VW-36, 1).slice(0,2).forEach((l,i) => txt(c, 18, y+8+i*12, l, P.bone, 1));
      y += 40;
    }
    /* today */
    const today = new Date().toISOString().slice(0,10);
    const sessions = plan.sessions || [];
    const todays = sessions.find(s => s.date === today) || sessions.find(s => s.date >= today) || sessions[0];
    if (todays) {
      panel(c, 10, y, VW-20, 72, '#1a5a33', { r:4 });
      pbox(c, 10, y, VW-20, 4, P.lime, 3);
      txt(c, 18, y+8, todays.date === today ? 'TODAY' : 'NEXT UP  ' + todays.date, P.lime, 1);
      txt(c, 18, y+20, String(todays.title||'').toUpperCase().slice(0,24), P.white, 2, P.shadow);
      wrap(todays.focus||'', VW-120, 1).slice(0,2).forEach((l,i) => txt(c, 18, y+40+i*11, l, P.bone, 1));
      txt(c, VW-60, y+8, (todays.minutes||30) + ' MIN', P.gold, 1);
      const done = (a().doneDays||{})[todays.date];
      if (UI.btn(c, VW-92, y+44, 82, 22, done ? 'DONE' : 'START',
                 { col: done?'#3a2a5e':'#b3600f', col2: done?'#5a4790':P.gold, txt: done?P.grey:P.ink })) {
        if (!a().doneDays) a().doneDays = {};
        a().doneDays[todays.date] = 1; S.save();
        SFX.play('levelup'); FX.confetti(VW/2, y+40, 40);
        const mine = a().packs[0];
        Game.go(mine ? 'map' : 'dex', mine ? { packId:mine.id } : { tab:1 });
      }
      y += 80;
    }
    txt(c, 14, y, 'THE WHOLE PLAN', P.gold, 1); y += 14;
    for (const s of sessions) {
      if (y > VH) break;
      if (y > 110) {
        const k = KIND[s.kind] || KIND.learn;
        const isDone = (a().doneDays||{})[s.date];
        panel(c, 10, y, VW-20, 40, isDone ? '#1a3a28' : '#2e1b50');
        pbox(c, 10, y, 4, 40, k.c, 2);
        txt(c, 20, y+5, s.date + '   ' + k.n, k.c, 1);
        txt(c, 20, y+17, String(s.title||'').slice(0,26), isDone ? P.grey : P.white, 1, P.shadow);
        wrap(String(s.focus||''), VW-46, 1).slice(0,1).forEach(l => txt(c, 20, y+29, l, P.grey, 1));
        txt(c, VW-52, y+5, (s.minutes||30)+'m', P.bone, 1);
        if (isDone) spr(c, 'i_star', VW-40, y+20);
        const z = UI.zone(10, y, VW-20, 40, 'pl'+s.date);
        if (z.click) { if (!a().doneDays) a().doneDays = {};
                       a().doneDays[s.date] = isDone ? 0 : 1; S.save(); SFX.play('tap'); }
      }
      y += 44;
    }
    if (y < VH - 60) {
      if (UI.btn(c, 20, y+6, VW-40, 30, 'RETUNE AROUND MY WEAK SPOTS',
                 { col:'#2358c9', col2:P.blue, disabled:!AI.available() }))
        run('retune', 'WORKING OUT YOUR WEAK SPOTS', onText => AI.retune(onText));
      y += 40;
      const dr = (a().drills||[])[0];
      if (dr) {
        panel(c, 10, y, VW-20, 84, '#241640');
        txt(c, 18, y+6, 'LAST VERDICT', P.cyan, 1);
        wrap(dr.verdict||'', VW-36, 1).slice(0,2).forEach((l,i) => txt(c, 18, y+20+i*11, l, P.bone, 1));
        (dr.themes||[]).slice(0,2).forEach((th,i) => txt(c, 18, y+46+i*14, '- ' + th.name + ': ' + th.fix, P.grey, 1));
        y += 92;
      }
      if (UI.btn(c, 20, y, VW-40, 28, 'START AGAIN FROM MY NOTES',
                 { col:'#3a2a5e', col2:'#5a4790', disabled:!AI.available() }))
        run('plan', 'REBUILDING YOUR PLAN', onText => AI.plan(a().examDate, a().subject, onText));
      y += 36;
    }
    maxScroll = Math.max(0, (y - scroll) - VH + 60);
  }

  /* ==== NOTES =========================================================== */
  function drawNotes(c) {
    let y = 134 + scroll;
    const mats = a().material;
    if (UI.btn(c, 10, y, VW-20, 32, 'ADD STUDY MATERIAL',
               { col:'#1a7331', col2:'#3fe07a', icon:'i_book', glow:P.gold }))
      Sheet.addMaterial(() => { SFX.play('chest'); UI.toast('the tutor has read it', P.lime, 'i_book'); });
    y += 40;
    txt(c, 14, y, mats.length ? 'WHAT IT HAS READ' : 'IT HAS READ NOTHING YET', P.gold, 1);
    y += 14;
    if (!mats.length) {
      panel(c, 10, y, VW-20, 56, '#241640');
      ['Paste a chapter, a syllabus, a past paper','or your own messy notes. Anything you',
       'are actually being tested on.'].forEach((l,i) => ctxt(c, VW/2, y+10+i*13, l, P.grey, 1));
      y += 64;
    }
    mats.forEach((m,i) => {
      if (y > VH) return;
      panel(c, 10, y, VW-20, 40, '#2e1b50');
      spr(c, 'i_book', 16, y+13);
      txt(c, 34, y+6, m.name.toUpperCase().slice(0,24), P.white, 1, P.shadow);
      txt(c, 34, y+18, m.text.length.toLocaleString() + ' characters', P.grey, 1);
      txt(c, 34, y+29, m.text.replace(/\s+/g,' ').slice(0,38), P.grey, 1);
      if (UI.btn(c, VW-44, y+9, 30, 22, 'X', { col:'#8a2a3a', col2:P.red, key:'dm'+i })) {
        AI.dropMaterial(i); SFX.play('back');
      }
      y += 44;
    });
    if (mats.length) {
      y += 6;
      txt(c, 14, y, 'MAKE IT PLAYABLE', P.gold, 1); y += 14;
      panel(c, 10, y, VW-20, 46, '#241640');
      ['Turn everything above into a world on the','adventure map: battles, matching and a sequence.']
        .forEach((l,i) => txt(c, 18, y+9+i*13, l, P.bone, 1));
      y += 54;
      if (UI.btn(c, 20, y, VW-40, 34, 'BUILD A WORLD FROM THIS',
                 { col:'#6a27c8', col2:P.purple, glow:P.gold, disabled:!AI.available() }))
        run('pack', 'BUILDING YOUR WORLD', onText => AI.pack(a().subject, onText));
      y += 42;
      const made = a().packs || [];
      if (made.length) {
        txt(c, 14, y, 'WORLDS FROM YOUR NOTES', P.gold, 1); y += 14;
        made.forEach((g,i) => {
          if (y > VH) return;
          panel(c, 10, y, VW-20, 36, '#2e1b50');
          pbox(c, 10, y, 4, 36, g.col, 2);
          txt(c, 20, y+6, g.name, g.col, 1, P.shadow);
          txt(c, 20, y+19, g.rows.length + ' questions   ' + (g.pairs?'+ matching':'') + (g.seq?' + sequence':''), P.grey, 1);
          if (UI.btn(c, VW-70, y+6, 56, 24, 'PLAY', { col:'#1a7331', col2:'#3fe07a', key:'gp'+i }))
            Game.go('map', { packId:g.id });
          y += 40;
        });
      }
    }
    maxScroll = Math.max(0, (y - scroll) - VH + 60);
  }

  /* ==== TUTOR =========================================================== */
  function drawTutor(c) {
    let y = 134 + scroll;
    if (!chat.length && !chatStream) {
      panel(c, 10, y, VW-20, 96, '#241640', { r:4 });
      AV.draw(c, 48, y+82, S.d.cfg, 'idle', Math.floor(t*3)%2, { scale:2, shadow:false });
      txt(c, 86, y+10, 'THE TUTOR', P.gold, 2, P.shadow);
      ['It has read everything in NOTES.','Ask it why you got something wrong,','or to explain a thing properly.']
        .forEach((l,i) => txt(c, 86, y+32+i*13, l, P.bone, 1));
      y += 104;
    }
    for (const m of chat) {
      if (y > VH) break;
      const mine = m.role === 'user';
      const lines = wrap(m.content, VW-64, 1);
      const h = lines.length*12 + 14;
      if (y + h > 110) {
        panel(c, mine ? 46 : 10, y, VW-56, h, mine ? '#2358c9' : '#241640');
        if (!mine) spr(c, 'i_paw', 16, y+6);
        lines.forEach((l,i) => txt(c, mine ? 56 : 32, y+7+i*12, l, mine ? P.white : P.bone, 1));
      }
      y += h + 6;
    }
    if (chatStream) {
      const lines = wrap(chatStream, VW-64, 1);
      const h = lines.length*12 + 14;
      panel(c, 10, y, VW-56, h, '#241640');
      spr(c, 'i_paw', 16, y+6);
      lines.forEach((l,i) => txt(c, 32, y+7+i*12, l, P.bone, 1));
      y += h + 6;
    } else if (chat.length && chat[chat.length-1].role === 'user') {
      ctxt(c, VW/2, y+6, 'thinking' + '.'.repeat(1+Math.floor(t*2)%3), P.grey, 1);
      y += 24;
    }
    if (chatErr) { ctxt(c, VW/2, y+4, chatErr, P.red, 1); y += 18; }
    y += 6;
    if (UI.btn(c, 20, y, VW-40, 32, 'ASK A QUESTION',
               { col:'#1a7331', col2:'#3fe07a', icon:'i_paw', disabled:!AI.available() || !!chatStream }))
      Sheet.askBox(q => sendChat(q));
    y += 40;
    if (chat.length && UI.btn(c, 110, y, 140, 24, 'CLEAR', { col:'#3a2a5e', col2:'#5a4790' }))
      { chat = []; chatStream = ''; chatErr = ''; }
    if (chat.length) y += 32;
    maxScroll = Math.max(0, (y - scroll) - VH + 60);
  }

  function sendChat(q) {
    chat.push({ role:'user', content:q });
    chatErr = ''; chatStream = '';
    scroll = -Math.max(0, maxScroll);
    AI.chat(chat.map(m => ({ role:m.role, content:m.content })),
            ({ text }) => { chatStream = text; })
      .then(text => { chat.push({ role:'assistant', content:text || chatStream });
                      chatStream = ''; SFX.play('correct'); })
      .catch(e => { chatStream = ''; chatErr = AI.errText(e); SFX.play('wrong'); });
  }

  /* used by the battle screen's "why was I wrong" button */
  Game.explainQueue = null;
})());
