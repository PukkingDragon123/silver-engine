/* =========================================================================
   LABS — the Gizmo half.

   Not quizzes with pictures: things you actually drive. Pull the force up
   and watch the crate accelerate; step the cell through mitosis and watch
   the chromosomes line up and get dragged apart; cut the bar into sevenths
   and see what a seventh actually looks like. Every lab then asks you a
   question about the state YOU left it in, so the answer changes every time
   and cannot be memorised.
   ========================================================================= */
Game.register('lab', (() => {
  let t = 0, which = 0, sim = null, quiz = null, correctStreak = 0, answered = 0, done = null;

  /* ---- a draggable slider --------------------------------------------- */
  function slider(c, x, y, w, val, min, max, step, key, col) {
    const h = 18;
    pbox(c, x-1, y-1, w+2, h+2, P.ink, 3);
    pbox(c, x, y, w, h, '#1b1030', 2);
    const f = (val-min)/(max-min);
    pbox(c, x+1, y+1, Math.max(1,Math.round((w-2)*f)), h-2, col || P.purple, 2);
    c.fillStyle = shade(col || P.purple,.4); c.fillRect(x+1, y+1, Math.max(1,Math.round((w-2)*f)), 1);
    const kx = x + 2 + (w-6)*f;
    pbox(c, kx-4, y-3, 10, h+6, P.ink, 3);
    pbox(c, kx-3, y-2, 8, h+4, P.bone, 2);
    c.fillStyle = P.grey; c.fillRect(Math.round(kx), y+2, 1, h-4);
    const z = UI.zone(x-8, y-8, w+16, h+16, key);
    if (z.down) {
      const nf = clamp((Input.x - x - 2)/(w-6), 0, 1);
      const nv = Math.round((min + nf*(max-min))/step)*step;
      if (nv !== val) SFX.play('hover');
      return Math.round(nv*1000)/1000;
    }
    return val;
  }
  function stepper(c, x, y, label, val, fmt2, onMinus, onPlus, col) {
    txt(c, x, y+6, label, col || P.cyan, 1);
    if (UI.btn(c, x+96, y, 24, 20, '-', { col:'#3a2a5e', col2:'#5a4790', key:label+'-' })) onMinus();
    ctxt(c, x+142, y+6, fmt2, P.white, 2, P.shadow);
    if (UI.btn(c, x+166, y, 24, 20, '+', { col:'#3a2a5e', col2:'#5a4790', key:label+'+' })) onPlus();
  }

  /* ====================================================================== */
  const LABS = [
    /* ---------- 1. MITOSIS ------------------------------------------- */
    {
      name:'CELL DIVISION', sub:'step a cell through mitosis', col:'#3fe07a', icon:'i_paw',
      tries:['Step to ANAPHASE and count the chromosomes.',
             'Find the only phase where they sit in one row.',
             'Watch where the nucleus disappears, and comes back.'],
      init: () => ({ phase:0, anim:0 }),
      PHASES: ['INTERPHASE','PROPHASE','METAPHASE','ANAPHASE','TELOPHASE','CYTOKINESIS'],
      BLURB: [
        'The cell grows and copies its DNA. Each chromosome is now two identical sister chromatids.',
        'The copied chromosomes condense and become visible. The nuclear membrane breaks down.',
        'The chromosomes line up along the equator of the cell, in one row.',
        'Spindle fibres pull the sister chromatids apart, to opposite poles.',
        'A nuclear membrane reforms around each group. Two nuclei now exist.',
        'The cytoplasm pinches in two. Two genetically identical daughter cells.'
      ],
      update(s, dt) { s.anim = Math.min(1, s.anim + dt*2.2); },
      draw(c, s, y0) {
        const ph = s.phase, k = ease.out(s.anim);
        const cx = VW/2, cy = y0 + 92;
        /* cell body — one cell that pinches into two */
        const split = ph >= 5 ? k : ph >= 4 ? .35 : 0;
        const sep = split*26;
        c.globalAlpha = .25; pxEllipse(c, cx, cy+46, 60, 10, '#000'); c.globalAlpha = 1;
        for (const side of (split > .5 ? [-1,1] : [0])) {
          const ox = side*sep;
          pxEllipse(c, cx+ox, cy, split>.5?36:54, split>.5?36:42, '#1d9a52');
          pxEllipse(c, cx+ox, cy, split>.5?33:51, split>.5?33:39, '#54d64a');
          pxEllipse(c, cx+ox-10, cy-12, 12, 8, '#96f06a');
        }
        if (split > 0 && split <= .5) {                     /* the pinch */
          c.fillStyle = '#1d9a52';
          c.fillRect(cx-3, cy-40, 6, 12*split*2); c.fillRect(cx-3, cy+40-12*split*2, 6, 12*split*2);
        }
        /* nucleus present in interphase and again at telophase */
        if (ph === 0 || ph >= 4) {
          for (const side of (ph >= 4 ? [-1,1] : [0])) {
            const ox = ph >= 4 ? side*sep : 0;
            pxEllipse(c, cx+ox, cy, ph>=4?16:24, ph>=4?16:22, rgba('#2358c9',.55));
            pxEllipse(c, cx+ox, cy, ph>=4?14:22, ph>=4?14:20, rgba('#49a7ff',.5));
          }
        }
        /* four chromosomes, positioned by phase */
        const COLS = ['#ff4d5e','#ffd23f','#a35cff','#46ecd5'];
        for (let i=0;i<4;i++) {
          const a = (i/4)*TAU + t*.2;
          let x1, y1, x2, y2;
          if (ph === 0)      { x1 = x2 = cx + Math.cos(a)*11; y1 = y2 = cy + Math.sin(a)*9; }
          else if (ph === 1) { x1 = x2 = cx + Math.cos(a)*22; y1 = y2 = cy + Math.sin(a)*18; }
          else if (ph === 2) { x1 = x2 = cx; y1 = y2 = cy - 27 + i*18; }
          else if (ph === 3) { x1 = cx - lerp(0,30,k); x2 = cx + lerp(0,30,k); y1 = y2 = cy - 27 + i*18; }
          else               { x1 = cx - sep; x2 = cx + sep; y1 = y2 = cy - 12 + (i%2)*10 + (i>1?6:0); }
          const drawChrom = (x,y,pair) => {
            c.fillStyle = P.ink;
            c.fillRect(Math.round(x)-4, Math.round(y)-7, 8, 14);
            c.fillStyle = COLS[i];
            if (ph <= 2) {                                   /* two sister chromatids */
              c.fillRect(Math.round(x)-3, Math.round(y)-6, 2, 12);
              c.fillRect(Math.round(x)+1, Math.round(y)-6, 2, 12);
              c.fillStyle = shade(COLS[i],-.3); c.fillRect(Math.round(x)-1, Math.round(y)-1, 2, 2);
            } else {
              c.fillRect(Math.round(x)-2, Math.round(y)-6, 4, 12);
              c.fillStyle = shade(COLS[i],.35); c.fillRect(Math.round(x)-2, Math.round(y)-6, 4, 2);
            }
          };
          if (ph === 3 || ph >= 4) { drawChrom(x1,y1); drawChrom(x2,y2); }
          else drawChrom(x1,y1);
          if (ph === 3) {                                    /* spindle fibres */
            c.strokeStyle = rgba('#ffffff',.35); c.lineWidth = 1;
            c.beginPath(); c.moveTo(cx-52, cy); c.lineTo(x1, y1); c.stroke();
            c.beginPath(); c.moveTo(cx+52, cy); c.lineTo(x2, y2); c.stroke();
          }
        }
        if (ph === 3) { for (const sx of [-52,52]) { c.fillStyle = P.white;
          c.fillRect(cx+sx-2, cy-2, 4, 4); } }
      },
      controls(c, s, y0) {
        const P2 = LABS[0].PHASES;
        ctxt(c, VW/2, y0+4, P2[s.phase], LABS[0].col, 3, P.ink);
        wrap(LABS[0].BLURB[s.phase], VW-44, 1).forEach((l,i) =>
          ctxt(c, VW/2, y0+30+i*12, l, P.bone, 1));
        const np = slider(c, 30, y0+74, VW-60, s.phase, 0, 5, 1, 'mph', LABS[0].col);
        if (np !== s.phase) { s.phase = np; s.anim = 0; SFX.play('tap'); }
        for (let i=0;i<6;i++) {
          const x = 30 + (VW-60)*(i/5);
          c.fillStyle = i <= s.phase ? LABS[0].col : P.grey;
          c.fillRect(Math.round(x)-1, y0+96, 2, 4);
        }
        if (UI.btn(c, 30, y0+106, 96, 26, '< BACK', { col:'#3a2a5e', col2:'#5a4790' }) && s.phase > 0)
          { s.phase--; s.anim = 0; }
        if (UI.btn(c, VW-126, y0+106, 96, 26, 'NEXT >', { col:'#1a7331', col2:'#3fe07a' }) && s.phase < 5)
          { s.phase++; s.anim = 0; }
      },
      quiz(s) {
        const P2 = LABS[0].PHASES;
        const modes = [
          () => ({ q:'Which phase is the cell showing right now?', a:P2[s.phase],
                   o:shuffle([P2[s.phase]].concat(shuffle(P2.filter(x=>x!==P2[s.phase])).slice(0,3))) }),
          () => { const n = (s.phase+1)%6;
                  return { q:'What comes straight after ' + P2[s.phase] + '?', a:P2[n],
                           o:shuffle([P2[n]].concat(shuffle(P2.filter(x=>x!==P2[n])).slice(0,3))) }; },
          () => ({ q:'In the phase on screen, the chromosomes are...', a:LABS[0].BLURB[s.phase].split('.')[0] + '.',
                   o:shuffle([LABS[0].BLURB[s.phase].split('.')[0] + '.']
                     .concat(shuffle(LABS[0].BLURB.filter((_,i)=>i!==s.phase)).slice(0,3).map(b=>b.split('.')[0]+'.'))) })
        ];
        return pick(modes)();
      }
    },

    /* ---------- 2. FORCES --------------------------------------------- */
    {
      name:'FORCE AND MOTION', sub:'push a crate and watch F = ma', col:'#ffd23f', icon:'i_bolt',
      tries:['Double the mass. What happens to acceleration?',
             'Find a force and mass that give exactly 2 m/s2.',
             'Turn friction on and see what force it takes to move at all.'],
      init: () => ({ F:12, m:3, x:0, v:0, running:false, friction:false, trail:[] }),
      update(s, dt) {
        const a = (s.F - (s.friction ? 4*s.m : 0)) / s.m;
        s.a = Math.max(0, a);
        if (s.running) {
          s.v += s.a*dt*6;
          s.x += s.v*dt*6;
          if (s.x > 260) { s.x = 260; s.v = 0; s.running = false; }
        }
      },
      draw(c, s, y0) {
        const gy = y0 + 126;
        /* the track */
        c.fillStyle = '#5f4635'; c.fillRect(14, gy, VW-28, 12);
        c.fillStyle = '#7a5a42'; c.fillRect(14, gy, VW-28, 3);
        for (let i=0;i<VW-28;i+=16) { c.fillStyle = rgba('#000',.2); c.fillRect(14+i, gy+4, 1, 8); }
        /* metre marks */
        for (let i=0;i<=5;i++) { const x = 20 + i*(VW-52)/5;
          c.fillStyle = P.grey; c.fillRect(Math.round(x), gy+13, 1, 4);
          txt(c, Math.round(x)-3, gy+18, String(i), P.grey, 1); }
        /* the crate */
        const bx = 24 + s.x, sz = 16 + s.m*2;
        c.globalAlpha = .25; pxEllipse(c, bx+sz/2, gy+1, sz*.6, 3, '#000'); c.globalAlpha = 1;
        pbox(c, bx-1, gy-sz-1, sz+2, sz+2, P.ink, 3);
        pbox(c, bx, gy-sz, sz, sz, '#c08a4a', 2);
        c.fillStyle = '#d9a45c'; c.fillRect(bx, gy-sz, sz, 3);
        c.fillStyle = '#8a5a2c'; c.fillRect(bx+2, gy-sz+4, sz-4, 2); c.fillRect(bx+2, gy-6, sz-4, 2);
        txt(c, bx+4, gy-sz/2-3, s.m + 'kg', P.ink, 1);
        /* the force arrow, length proportional to F */
        const al = 6 + s.F*1.6;
        c.fillStyle = P.gold;
        c.fillRect(Math.round(bx-al), gy-sz/2-2, al, 4);
        for (let i=0;i<6;i++) c.fillRect(Math.round(bx-6+i), gy-sz/2-2-(5-i), 1, 4+(5-i)*2);
        txt(c, Math.round(bx-al), gy-sz/2-14, s.F + ' N', P.gold, 1, P.ink);
        if (s.friction && s.running) {
          c.fillStyle = P.red;
          c.fillRect(Math.round(bx+sz), gy-6, 10, 3);
          FX.dust(bx+2, gy, 1, '#c9a06a');
        }
        /* the numbers, which are the point */
        panel(c, 14, y0+8, VW-28, 58, '#241640');
        const items = [['FORCE', s.F + ' N', P.gold], ['MASS', s.m + ' kg', P.cyan],
                       ['ACCEL', (Math.round(s.a*100)/100) + ' m/s2', P.lime],
                       ['SPEED', (Math.round(s.v*10)/10) + ' m/s', P.pink]];
        items.forEach((it,i) => {
          const x = 24 + (i%4)*((VW-40)/4);
          ctxt(c, x + (VW-40)/8, y0+14, it[0], P.grey, 1);
          ctxt(c, x + (VW-40)/8, y0+26, it[1], it[2], 2, P.shadow);
        });
        ctxt(c, VW/2, y0+50, 'a = F / m' + (s.friction ? '   minus friction' : ''), P.white, 1);
      },
      controls(c, s, y0) {
        stepper(c, 22, y0+4, 'FORCE  N', s.F, String(s.F),
                () => { s.F = clamp(s.F-2, 0, 40); }, () => { s.F = clamp(s.F+2, 0, 40); }, P.gold);
        stepper(c, 22, y0+30, 'MASS  kg', s.m, String(s.m),
                () => { s.m = clamp(s.m-1, 1, 10); }, () => { s.m = clamp(s.m+1, 1, 10); }, P.cyan);
        if (UI.btn(c, 22, y0+58, 100, 26, s.running ? 'STOP' : 'RELEASE',
                   { col: s.running?'#8a2a3a':'#1a7331', col2: s.running?P.red:'#3fe07a' }))
          s.running = !s.running;
        if (UI.btn(c, 130, y0+58, 96, 26, 'RESET', { col:'#3a2a5e', col2:'#5a4790' }))
          { s.x = 0; s.v = 0; s.running = false; }
        if (UI.btn(c, 234, y0+58, 104, 26, s.friction ? 'FRICTION ON' : 'FRICTION OFF',
                   { col: s.friction?'#6a4a10':'#241640', col2: s.friction?P.gold:'#3a2a5e' }))
          s.friction = !s.friction;
      },
      quiz(s) {
        const a = Math.round(((s.F - (s.friction?4*s.m:0))/s.m)*100)/100;
        const modes = [
          () => ({ q:'With ' + s.F + ' N on ' + s.m + ' kg, what is the acceleration?',
                   a:a + ' m/s2',
                   o:shuffle([a + ' m/s2', (s.F*s.m) + ' m/s2', Math.round((s.m/s.F)*100)/100 + ' m/s2',
                              (a+2) + ' m/s2']) }),
          () => ({ q:'To double this acceleration, you could...',
                   a:'Double the force',
                   o:shuffle(['Double the force','Double the mass','Halve the force','Add friction']) }),
          () => ({ q:'What force would give ' + s.m + ' kg an acceleration of 4 m/s2?',
                   a:(s.m*4) + ' N',
                   o:shuffle([(s.m*4) + ' N', (s.m+4) + ' N', Math.round(s.m/4*100)/100 + ' N', (s.m*8) + ' N']) })
        ];
        return pick(modes)();
      }
    },

    /* ---------- 3. FRACTIONS ------------------------------------------ */
    {
      name:'FRACTION BAR', sub:'cut it up and see what it is worth', col:'#46ecd5', icon:'i_flask',
      tries:['Make A and B equal without the same number of parts.',
             'Find three different bars that are all 50%.',
             'Make A exactly 0.375. How many parts did you need?'],
      init: () => ({ n:4, m:1, n2:8, m2:2 }),
      update() {},
      draw(c, s, y0) {
        const barW = VW-48;
        const drawBar = (y, n, m, col, label) => {
          pbox(c, 22, y, barW, 34, P.ink, 3);
          for (let i=0;i<n;i++) {
            const w = barW/n, x = 24 + i*w;
            c.fillStyle = i < m ? col : '#2a1f45';
            c.fillRect(Math.round(x), y+2, Math.ceil(w)-1, 30);
            if (i < m) { c.fillStyle = shade(col,.35); c.fillRect(Math.round(x), y+2, Math.ceil(w)-1, 2); }
            c.fillStyle = P.ink; c.fillRect(Math.round(x)-1, y+2, 1, 30);
          }
          const val = m/n;
          txt(c, 22, y-11, label + '  ' + m + '/' + n, col, 1, P.ink);
          const s2 = (Math.round(val*1000)/1000) + '   ' + (Math.round(val*1000)/10) + '%';
          txt(c, VW-26-tw(s2,1), y-11, s2, P.bone, 1, P.ink);
        };
        drawBar(y0+22, s.n, s.m, LABS[2].col, 'A');
        drawBar(y0+78, s.n2, s.m2, P.pink, 'B');
        /* the verdict */
        const a = s.m/s.n, b2 = s.m2/s.n2;
        const same = Math.abs(a-b2) < 1e-9;
        panel(c, 22, y0+120, barW, 26, same ? '#1a5a33' : '#241640');
        ctxt(c, VW/2, y0+128,
             same ? 'EQUAL — ' + s.m + '/' + s.n + ' = ' + s.m2 + '/' + s.n2
                  : (a > b2 ? 'A IS BIGGER' : 'B IS BIGGER') + '   by ' + (Math.round(Math.abs(a-b2)*1000)/1000),
             same ? P.lime : P.white, 1);
      },
      controls(c, s, y0) {
        stepper(c, 16, y0+2, 'A  PARTS', s.n, String(s.n),
                () => { s.n = clamp(s.n-1,1,12); s.m = clamp(s.m,0,s.n); },
                () => { s.n = clamp(s.n+1,1,12); }, LABS[2].col);
        stepper(c, 16, y0+26, 'A  SHADED', s.m, String(s.m),
                () => { s.m = clamp(s.m-1,0,s.n); }, () => { s.m = clamp(s.m+1,0,s.n); }, LABS[2].col);
        stepper(c, 16, y0+52, 'B  PARTS', s.n2, String(s.n2),
                () => { s.n2 = clamp(s.n2-1,1,12); s.m2 = clamp(s.m2,0,s.n2); },
                () => { s.n2 = clamp(s.n2+1,1,12); }, P.pink);
        stepper(c, 16, y0+76, 'B  SHADED', s.m2, String(s.m2),
                () => { s.m2 = clamp(s.m2-1,0,s.n2); }, () => { s.m2 = clamp(s.m2+1,0,s.n2); }, P.pink);
      },
      quiz(s) {
        const pc = Math.round((s.m/s.n)*1000)/10;
        const dec = Math.round((s.m/s.n)*1000)/1000;
        const modes = [
          () => ({ q:'Bar A is ' + s.m + '/' + s.n + '. What is that as a percentage?',
                   a:pc + '%', o:shuffle([pc + '%', (s.m*10) + '%', (s.n*10) + '%',
                                          (Math.round((s.n/Math.max(1,s.m))*1000)/10) + '%']) }),
          () => ({ q:'Bar A is ' + s.m + '/' + s.n + '. What is that as a decimal?',
                   a:String(dec), o:shuffle([String(dec), String(s.m) + '.' + s.n,
                                             String(Math.round((s.n/Math.max(1,s.m))*100)/100), String(dec*2)]) }),
          () => ({ q:'Which is bigger: ' + s.m + '/' + s.n + ' or ' + s.m2 + '/' + s.n2 + '?',
                   a: (s.m/s.n) > (s.m2/s.n2) ? s.m + '/' + s.n
                    : (s.m/s.n) < (s.m2/s.n2) ? s.m2 + '/' + s.n2 : 'They are equal',
                   o:shuffle([s.m + '/' + s.n, s.m2 + '/' + s.n2, 'They are equal', 'Cannot tell']) })
        ];
        return pick(modes)();
      }
    }
  ];

  /* ====================================================================== */
  function newQuiz() { quiz = { ...LABS[which].quiz(sim), pick:-1, lock:0 }; }

  return {
    enter(data) {
      t = 0; which = (data && data.lab) || 0; answered = 0; correctStreak = 0; done = null;
      sim = LABS[which].init(); quiz = null;
      SFX.music(true);
    },
    back() { Game.go('study'); },
    update(dt) {
      t += dt;
      LABS[which].update(sim, dt);
      if (quiz && quiz.lock > 0) { quiz.lock -= dt; if (quiz.lock <= 0) quiz = null; }
    },
    draw(c) {
      const L = LABS[which];
      drawSky(c, t*.2, { top:'#12102c', mid:'#25204a', bot:'#3a3060', sun:false, stars:true });
      c.fillStyle = rgba(P.ink,.35); c.fillRect(0,0,VW,VH);
      UI.topBar(c);
      if (UI.btn(c, 8, 34, 36, 22, '<', { col:'#4a3a70', col2:'#6b56a0' })) Game.go('study');
      ctxt(c, VW/2, 36, L.name, L.col, 2, P.shadow);
      ctxt(c, VW/2, 54, L.sub, P.grey, 1);

      /* lab picker */
      for (let i=0;i<LABS.length;i++)
        if (UI.btn(c, 10 + i*114, 70, 110, 22, LABS[i].name.split(' ')[0],
                   { col: which===i?'#6a27c8':'#2e1b50', col2: which===i?P.purple:'#3f2a68',
                     txt: which===i?P.white:P.grey, key:'lb'+i }))
          { which = i; sim = LABS[i].init(); quiz = null; answered = 0; }

      /* the simulation */
      panel(c, 8, 98, VW-16, 176, '#151030', { r:4 });
      pbox(c, 8, 98, VW-16, 4, L.col, 3);
      c.save(); c.beginPath(); c.rect(8, 102, VW-16, 172); c.clip();
      L.draw(c, sim, 102);
      c.restore();

      /* the controls */
      panel(c, 8, 280, VW-16, 142, '#241640', { r:4 });
      L.controls(c, sim, 286);

      /* check my understanding */
      if (!quiz) {
        panel(c, 8, 430, VW-16, 200, '#1b1030', { r:4 });
        ctxt(c, VW/2, 440, 'CHANGE SOMETHING, THEN CHECK', P.gold, 1);
        ctxt(c, VW/2, 454, 'the question is about the state you left it in', P.grey, 1);
        if (UI.btn(c, 60, 470, VW-120, 28, 'CHECK MY UNDERSTANDING',
                   { col:'#1a7331', col2:'#3fe07a', glow:P.gold })) { newQuiz(); SFX.play('power'); }
        txt(c, 22, 512, 'TRY THIS', L.col, 1);
        (L.tries || []).forEach((l,i) => txt(c, 22, 528+i*14, '- ' + l, P.bone, 1));
      } else {
        panel(c, 8, 430, VW-16, 200, '#1b1030', { r:4 });
        wrap(quiz.q, VW-44, 1).forEach((l,i) => ctxt(c, VW/2, 438+i*12, l, P.white, 1, P.shadow));
        for (let i=0;i<quiz.o.length;i++) {
          const x = 16 + (i%2)*((VW-32)/2 + 2), y = 474 + Math.floor(i/2)*54;
          const show = quiz.pick >= 0, right = quiz.o[i] === quiz.a;
          const col  = show ? (right ? '#1a7331' : (quiz.pick===i ? '#8a2a3a' : '#2e1b50')) : '#3a2a5e';
          const col2 = show ? (right ? '#3fe07a' : (quiz.pick===i ? P.red : '#3f2a68')) : '#5a4790';
          if (UI.btnWrap(c, x, y, (VW-36)/2, 48, quiz.o[i], { col, col2, key:'lq'+i, disabled:show })
              && quiz.pick < 0) {
            quiz.pick = i; quiz.lock = 1.4;
            const ok = right;
            answered++; S.dailyTick(1);
            S.sawCard('lab', quiz.q, quiz.a); S.gotCard('lab', quiz.q, ok);
            if (ok) { correctStreak++; SFX.play('correct'); FX.stars(VW/2, y, 12, L.col);
                      S.give('coins', 12); S.addXp(6);
                      if (correctStreak % 3 === 0) { S.pushChest(S.rollRarity(0), null);
                                                     UI.toast('A CHEST FOR THAT RUN', P.gold, 'i_trophy'); } }
            else { correctStreak = 0; SFX.play('wrong'); FX.shake(4,.2); }
          }
        }
        if (quiz.pick >= 0)
          ctxt(c, VW/2, 586, quiz.o[quiz.pick] === quiz.a ? '+12 COINS  +6 XP' : 'ANSWER: ' + quiz.a,
               quiz.o[quiz.pick] === quiz.a ? P.lime : P.red, 1);
      }
      if (answered) ctxt(c, VW/2, VH-8, answered + ' checked   streak ' + correctStreak, P.grey, 1);
    }
  };
})());
