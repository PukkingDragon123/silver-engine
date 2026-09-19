/* =========================================================================
   THE TUTOR — a cat that has read your notes.

   Everything here goes through the artifact `sample` capability, which is
   how a published page asks Claude a question. It is not available when the
   file is opened straight off disk, so every entry point degrades: the UI
   says so plainly instead of pretending to work.

   Four jobs, all asked for by name:
     plan()     your material + an exam date -> a dated revision plan
     pack()     your material -> a real playable world on the adventure map
     explain()  a question you just got wrong -> why, in two sentences
     retune()   the cards you keep missing -> a rewritten plan and drills
   ========================================================================= */
const AI = (() => {
  let sample = null, state = 'cold';     /* cold | booting | ready | absent */
  let bootPromise = null;

  function boot() {
    if (bootPromise) return bootPromise;
    state = 'booting';
    bootPromise = (async () => {
      try {
        if (typeof claude === 'undefined' || !claude || !claude.use) { state = 'absent'; return null; }
        sample = await claude.use('sample');
        state = sample ? 'ready' : 'absent';
        return sample;
      } catch (e) { state = 'absent'; return null; }
    })();
    return bootPromise;
  }
  boot();

  const available = () => state === 'ready';
  const statusLine = () => state === 'ready' ? 'tutor is awake'
                         : state === 'booting' ? 'waking the tutor...'
                         : 'the tutor only wakes in the published game';

  /* everything the tutor has been given to read */
  function material() {
    if (!S.d.ai) S.d.ai = { material:[], plan:null, packs:[], examDate:'', drills:[] };
    return S.d.ai;
  }
  function materialText(limit) {
    const m = material().material.map(x => '### ' + x.name + '\n' + x.text).join('\n\n');
    return m.length > (limit||14000) ? m.slice(0, limit||14000) + '\n[...truncated]' : m;
  }
  function addMaterial(name, text) {
    const a = material();
    text = String(text||'').replace(/\r/g,'').trim();
    if (!text) return false;
    a.material.push({ name: (name||'notes').slice(0,40), text: text.slice(0,40000), at: Date.now() });
    S.save(); return true;
  }
  function dropMaterial(i) { material().material.splice(i,1); S.save(); }

  /* ---- shared call wrapper ------------------------------------------- */
  async function ask(prompt, opts) {
    const s = await boot();
    if (!s) throw { code:'not_granted', message:'The tutor is not available here.' };
    return s(prompt, opts);
  }
  async function askJson(prompt, opts) {
    const s = await boot();
    if (!s) throw { code:'not_granted', message:'The tutor is not available here.' };
    return s.json(prompt, opts);
  }
  const errText = e => {
    const code = e && e.code;
    if (code === 'not_granted') return 'You said no to the tutor. Reload to be asked again.';
    if (code === 'rate_limited') return 'Too many questions too fast. Give it a minute.';
    if (code === 'cancelled') return 'Stopped.';
    return (e && e.message) || 'The tutor could not answer that one.';
  };

  /* ==== 1. THE PLAN ===================================================== */
  async function plan(examDate, subject, onText) {
    const notes = materialText(9000);
    const today = new Date().toISOString().slice(0,10);
    const days = examDate ? Math.max(1, Math.round((new Date(examDate) - new Date(today))/86400000)) : 14;
    const out = await askJson(
`You are a study coach for a teenager revising for an exam. Today is ${today}.
The exam is on ${examDate || 'about two weeks from today'} — ${days} days away.
Subject: ${subject || 'inferred from the notes'}.

Their material:
"""
${notes || '(they have not added any notes yet — build a sensible generic plan for the subject)'}
"""

Write a revision plan. Rules:
- One entry per study day, at most ${Math.min(days, 21)} entries, in date order starting ${today}.
- Each session is 25-50 minutes and names ONE specific topic drawn from their material.
- Build up: recall first, then application, then mixed practice, then two review days before the exam.
- Leave the day before the exam light.
- "focus" must be concrete and specific to the notes, never "revise chapter 1".

Reply as JSON only:
{"subject":"...","examDate":"YYYY-MM-DD","summary":"one sentence on the shape of the plan",
 "sessions":[{"date":"YYYY-MM-DD","title":"short title, 3-5 words","focus":"what to actually do, one sentence","minutes":30,"kind":"learn|practice|review|rest"}],
 "weakSpotsToWatch":["...","..."]}`,
      { onText, modelTier:'default' });
    const a = material();
    a.plan = out; a.examDate = examDate || out.examDate || '';
    S.save();
    return out;
  }

  /* ==== 2. A PLAYABLE WORLD ============================================= */
  async function pack(name, onText) {
    const notes = materialText(9000);
    if (!notes) throw { code:'no_material', message:'Add some notes first — the tutor has nothing to read.' };
    const out = await askJson(
`Turn these study notes into a playable quiz world for a study RPG.

Notes:
"""
${notes}
"""

Produce:
- 18 multiple-choice questions covering the WHOLE of the material, easiest first, hardest last.
  Each has exactly one correct answer and three wrong ones that are plausible and similar in
  length and shape to the correct one — never "none of these", never obviously silly.
  Keep every option under 60 characters. Keep every question under 90 characters.
- 6 term/meaning pairs for a matching game, drawn from the same material.
- One ordered sequence of 6 steps that genuinely has a correct order (a process, a
  timeline, a ranking). If the material has no natural sequence, order six facts by size,
  date or magnitude and say so in the title.

Reply as JSON only:
{"name":"SHORT WORLD NAME IN CAPS, 1-3 words","sub":"lowercase subtitle, under 40 chars",
 "questions":[{"q":"...","a":"correct","w":["wrong1","wrong2","wrong3"]}],
 "pairs":[["term","meaning"]],
 "sequence":{"title":"Order these ...","items":["first","second","third","fourth","fifth","sixth"]}}`,
      { onText, modelTier:'complex' });
    return install(out, name);
  }

  /* drop a generated world into the game's own content tables */
  function install(out, fallbackName) {
    const id = 'ai' + Date.now().toString(36);
    const rows = (out.questions||[])
      .filter(q => q && q.q && q.a && Array.isArray(q.w) && q.w.length >= 3)
      .map(q => [String(q.q), String(q.a), String(q.w[0]), String(q.w[1]), String(q.w[2])])
      .filter(r => new Set(r.slice(1)).size === 4);
    if (rows.length < 4) throw { code:'thin', message:'The tutor could not get enough questions out of that.' };
    CONTENT.Q[id] = rows;
    if (out.pairs && out.pairs.length >= 4)
      CONTENT.MATCHES[id] = out.pairs.slice(0,6).map(p => [String(p[0]), String(p[1])]);
    if (out.sequence && (out.sequence.items||[]).length >= 4)
      CONTENT.SEQUENCES[id] = { title:String(out.sequence.title||'Put these in order'),
                                items: out.sequence.items.slice(0,6).map(String) };
    const hue = ['#46ecd5','#ff5fb8','#c3ff4d','#ff9330','#49a7ff','#a35cff'];
    const c1 = pick(hue), c2 = shade(c1,-.35);
    const p = {
      id, name: String(out.name || fallbackName || 'YOUR NOTES').toUpperCase().slice(0,18),
      sub: String(out.sub || 'made from your own material').slice(0,40),
      col:c1, col2:c2, el:'arcane', icon:'i_book', ai:true,
      sky:{ top:shade(c2,-.45), mid:c2, bot:shade(c1,.35) },
      bank:id,
      enemies:['slime','bat','shroom','wisp','golem'], boss:'wyrm',
      nodes:['fight','match','fight','seq','elite','gather','fight','match','fight','boss'].map((k,i)=>({kind:k,i}))
    };
    if (!CONTENT.MATCHES[id]) p.nodes = p.nodes.map(n => n.kind === 'match' ? { kind:'fight', i:n.i } : n);
    if (!CONTENT.SEQUENCES[id]) p.nodes = p.nodes.map(n => n.kind === 'seq' ? { kind:'fight', i:n.i } : n);
    CONTENT.PACKS.push(p);
    const a = material();
    a.packs.push({ id, name:p.name, sub:p.sub, col:c1, rows,
                   pairs: CONTENT.MATCHES[id] || null,
                   seq: CONTENT.SEQUENCES[id] || null, at:Date.now() });
    S.save();
    return p;
  }
  /* rebuild every generated world from the save on boot */
  function restore() {
    const a = material();
    for (const g of a.packs || []) {
      if (CONTENT.pack(g.id)) continue;
      CONTENT.Q[g.id] = g.rows;
      if (g.pairs) CONTENT.MATCHES[g.id] = g.pairs;
      if (g.seq) CONTENT.SEQUENCES[g.id] = g.seq;
      CONTENT.PACKS.push({
        id:g.id, name:g.name, sub:g.sub, col:g.col, col2:shade(g.col,-.35),
        el:'arcane', icon:'i_book', ai:true,
        sky:{ top:shade(g.col,-.6), mid:shade(g.col,-.35), bot:shade(g.col,.35) },
        bank:g.id, enemies:['slime','bat','shroom','wisp','golem'], boss:'wyrm',
        nodes:['fight','match','fight','seq','elite','gather','fight','match','fight','boss']
          .map((k,i) => ({ kind: (k==='match' && !g.pairs) || (k==='seq' && !g.seq) ? 'fight' : k, i }))
      });
    }
  }

  /* ==== 3. WHY WAS I WRONG ============================================== */
  async function explain(q, given, correct, onText, signal) {
    const r = await ask(
`A student answered a revision question wrongly. Explain it to them.

Question: ${q}
They answered: ${given}
The correct answer: ${correct}

Reply in at most 45 words, plain language, no preamble, no "great question".
First say in one sentence why the correct answer is correct. Then, in one sentence,
say what their answer confused it with. No markdown, no bullet points.`,
      { onText, signal, modelTier:'quick', cache:true });
    return r.text;
  }

  /* a hint that does not give the answer away */
  async function hint(q, options, onText, signal) {
    const r = await ask(
`Give a nudge for this revision question WITHOUT revealing the answer.

Question: ${q}
Options: ${options.join(' | ')}

In at most 25 words, point at the idea they need or the thing to rule out first.
Never name the correct option. No preamble. No markdown.`,
      { onText, signal, modelTier:'quick' });
    return r.text;
  }

  /* ==== 4. RETUNE ======================================================= */
  async function retune(onText) {
    const a = material();
    const weak = S.dexList()
      .filter(e => e.seen > e.right)
      .sort((x,y) => (y.seen-y.right) - (x.seen-x.right))
      .slice(0,25)
      .map(e => `- ${e.q} (got it right ${e.right} of ${e.seen})`);
    if (!weak.length) throw { code:'no_data', message:'Play a few rounds first — there is nothing to go on yet.' };
    const today = new Date().toISOString().slice(0,10);
    const out = await askJson(
`You coach a student revising for an exam on ${a.examDate || 'a date they have not set'}. Today is ${today}.

These are the questions they keep getting wrong:
${weak.join('\n')}

${a.plan ? 'Their current plan focuses on: ' + (a.plan.sessions||[]).map(s=>s.title).join(', ') : 'They have no plan yet.'}

Work out what the UNDERLYING weak spots are — group the misses into 2-4 themes, not a list of
individual questions. Then give them today's drill.

Reply as JSON only:
{"verdict":"one blunt sentence on where they actually stand",
 "themes":[{"name":"SHORT NAME IN CAPS","why":"one sentence on what the misses have in common","fix":"one concrete thing to do about it"}],
 "todayDrill":{"title":"short title","minutes":20,"steps":["...","...","..."]}}`,
      { onText, modelTier:'default' });
    a.drills = [{ at:Date.now(), ...out }].concat((a.drills||[]).slice(0,4));
    S.save();
    return out;
  }

  /* ==== free chat ======================================================= */
  async function chat(turns, onText, signal) {
    const notes = materialText(5000);
    const sys = `You are a study tutor cat in a pixel-art study RPG called Aetheria. You are warm,
brief and a bit dry. The student is a teenager revising for an exam${material().examDate ? ' on ' + material().examDate : ''}.
${notes ? 'Their own notes, use them when relevant:\n"""\n' + notes + '\n"""' : 'They have not added notes yet.'}
Answer in at most 70 words. No markdown, no bullet lists, no headings. Plain sentences.
If they ask something off-topic, answer briefly and steer back to studying.`;
    const msgs = [{ role:'user', content: sys + '\n\nFirst message follows.\n\n' + turns[0].content }]
      .concat(turns.slice(1));
    const r = await ask(msgs, { onText, signal, modelTier:'default' });
    return r.text;
  }

  return { boot, available, get state() { return state; }, statusLine, errText,
           material, materialText, addMaterial, dropMaterial,
           plan, pack, install, restore, explain, hint, retune, chat };
})();
