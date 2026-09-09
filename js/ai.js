/* =========================================================================
   NOC'S BRAIN
   Noc answers what you actually type. Two ways:

   1. LOCAL (always on, no setup, works offline) — a small associative
      responder built out of Noc's own vocabulary. It reads your sentence for
      mood, subject and intent, and answers in character.
   2. REAL (optional) — type  /key sk-ant-...  into the talk box and Noc's
      replies come from the Claude API instead, with the local brain as the
      fallback the moment anything goes wrong.

   Either way the reply can carry an instruction back to the game, written as
   a tag at the end of the line:  [plan:lights]  [gift:can]  [mood:warm]
   ========================================================================= */
(function () {
'use strict';

const KEY_STORE = 'wiseoak.noc.key';
const MODEL_STORE = 'wiseoak.noc.model';
const DEFAULT_MODEL = 'claude-sonnet-5';

let apiKey = '';
let model = DEFAULT_MODEL;
try {
  apiKey = localStorage.getItem(KEY_STORE) || '';
  model = localStorage.getItem(MODEL_STORE) || DEFAULT_MODEL;
} catch (e) {}

const history = [];      // { role, text } — what has actually been said
const memory = { name: null, likes: [], said: [] };

/* ---------------------------------------------------------------------
   READING WHAT YOU TYPED
   --------------------------------------------------------------------- */
const D = () => (typeof DATA !== 'undefined' ? DATA : {});

const STOP = new Set(('a an the and or but so is are was were be been being of to in on at it its i you he she they we me my your our this that what why how when who do does did not no yes ok okay please just very really can could would should will shall have has had if then than for with about there here them his her their as from by up out about').split(' '));

function words(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
}
function keywords(s) { return words(s).filter(w => !STOP.has(w) && w.length > 2); }

function readIntent(text) {
  const t = (text || '').toLowerCase();
  const k = keywords(text);
  const out = { kind: 'talk', plan: null, topic: null, mood: 'level', keywords: k };

  if (/^\s*$/.test(t)) out.kind = 'empty';
  else if (/\?\s*$/.test(t) || /^(what|why|how|when|who|where|do you|are you|can you|did you|is it)\b/.test(t)) out.kind = 'question';
  if (/\b(hi|hey|hello|yo|shalom|salaam|good (morning|evening|night))\b/.test(t)) out.kind = 'greet';
  if (/\b(bye|goodbye|see you|later|night)\b/.test(t) && t.length < 24) out.kind = 'bye';
  if (/\b(thanks|thank you|cheers|ta)\b/.test(t)) out.kind = 'thanks';
  if (/\b(sorry|my bad|apolog)/.test(t)) out.kind = 'sorry';
  if (/\b(sad|tired|lonely|hurt|scared|anxious|awful|terrible|down|depress)/.test(t)) out.mood = 'low';
  if (/\b(love|great|happy|beautiful|amazing|lovely|good|nice|brilliant)/.test(t)) out.mood = 'warm';
  if (/\b(stupid|hate|shut up|boring|dumb|useless)\b/.test(t)) out.mood = 'sharp';
  if (/\b(plan|let'?s|lets|shall we|we should|can we|i want|i'd like|build|make|do)\b/.test(t)) out.kind = 'plan';
  if (/\bmy name is ([a-z]+)/.test(t)) { memory.name = RegExp.$1.replace(/^./, c => c.toUpperCase()); out.kind = 'name'; }
  else if (/\bi'?m ([a-z]{2,12})\b/.test(t) && /name/.test(t)) memory.name = RegExp.$1;

  // a plan wins over everything else if the words match one
  for (const p of D().plans || []) {
    if (p.keys.some(kw => t.includes(kw))) { out.plan = p.id; out.kind = 'plan'; break; }
  }
  for (const topic in (D().nocTopics || {})) {
    if (t.includes(topic)) { out.topic = topic; break; }
  }
  if (/\btree|oak\b/.test(t)) out.topic = out.topic || 'oak';
  if (/\btv|telly|show|series|watch|netflix|episode\b/.test(t)) out.topic = out.topic || 'tv';
  return out;
}

/* ---------------------------------------------------------------------
   THE LOCAL BRAIN
   --------------------------------------------------------------------- */
const OPENERS = {
  greet: ["Hello you.", "There you are.", "Evening. Or whatever it is under all that canopy.", "Hello. Sit down, the moss is dry."],
  question: ["Right.", "Good question.", "Hm.", "Nobody's asked me that in a while."],
  thanks: ["You're welcome.", "Any time.", "Don't. It was nothing and I liked doing it."],
  sorry: ["Nothing to be sorry for.", "Stop that.", "You're fine."],
  bye: ["Go on then.", "Mind the roots on the way back.", "The lamp stays on."],
  talk: ["Mm.", "Go on.", "Alright.", "I hear you."]
};
const LOW = [
  "That's a heavy thing to carry into a park at this hour. Put it down here for a minute, nobody's using the bench.",
  "You don't have to be alright out here. The oak isn't, most days, and he's the main attraction.",
  "Come and stand where the lamp is. It doesn't fix anything. It's just warmer."
];
const WARM = [
  "See, that's the sort of thing that keeps the lamp lit.",
  "I'll take that. I'll take that all the way home with me.",
  "The oak heard that. He'll pretend he didn't."
];
const SHARP = [
  "Fair enough. I've been called worse by a moth.",
  "You're allowed. I'm made of patience and lamp oil.",
  "Noted. Filed. Ignored, gently."
];
const MUSINGS = [
  "Everything here happened slowly enough that nobody noticed it happening.",
  "You can tell a park is loved by how much of it is empty on purpose.",
  "The oak measures things in centuries and I measure them in kettles. We meet in the middle around teatime.",
  "Nothing out here is in a hurry, which is either restful or maddening depending on what you brought with you.",
  "Half of what I know I learned from people talking to somebody else near my lamp."
];
const ABOUT = [
  "$K, is it. I've thought about $K more than is healthy for a man with one lamp.",
  "$K. Big word for a small park. Go on.",
  "You said $K like it was ordinary. Around here nothing is.",
  "$K. Right. The oak has a speech about that. I have a shorter one: it depends who's standing under it."
];

function pick(a, seed) { return a[Math.floor(Math.random() * a.length)]; }

function localReply(text, ctx) {
  const it = readIntent(text);
  const bits = [];

  if (it.kind === 'empty') return { text: "Take your time. I've got all night, that's rather the point of me.", intent: it };
  if (it.kind === 'name' && memory.name) {
    return { text: memory.name + ". Good name. I'll use it sparingly so it keeps its shine.", intent: it };
  }

  bits.push(pick(OPENERS[it.kind] || OPENERS.talk));

  if (it.mood === 'low') bits.push(pick(LOW));
  else if (it.mood === 'warm') bits.push(pick(WARM));
  else if (it.mood === 'sharp') bits.push(pick(SHARP));

  if (it.plan) {
    const p = (D().plans || []).find(x => x.id === it.plan);
    if (p) {
      bits.push(p.ask);
      return { text: bits.join(' '), intent: it, plan: p.id };
    }
  }
  if (it.topic && D().nocTopics && D().nocTopics[it.topic]) bits.push(D().nocTopics[it.topic]);
  else if (it.keywords.length) bits.push(pick(ABOUT).replace(/\$K/g, it.keywords[0]));
  else bits.push(pick(MUSINGS));

  if (it.kind === 'question' && Math.random() < 0.5 && D().nocLines) bits.push(pick(D().nocLines));
  if (ctx && ctx.night && Math.random() < 0.3) bits.push("It's dark. Everything I say is truer after dark, ask anyone.");
  if (memory.name && Math.random() < 0.25) bits.push("Right, " + memory.name + "?");

  return { text: bits.join(' '), intent: it, plan: null };
}

/* ---------------------------------------------------------------------
   THE REAL ONE
   --------------------------------------------------------------------- */
function systemPrompt(ctx) {
  const plans = (D().plans || []).map(p => '- ' + p.id + ': ' + p.name + ' — ' + p.ask).join('\n');
  return [
    "You are NOC, the lamp-keeper of a small park in a pixel-art game called THE WISE OAK TREE.",
    "You are quiet, dry, kind and slightly worn out. You speak in short paragraphs, two or three sentences, never more.",
    "You used to run a little shop and you gave it up because it made you boring. You do NOT sell anything. You make plans with people instead.",
    "Your neighbour is a nine-hundred-year-old talking oak who has opinions about television he has never seen.",
    "Never break character, never mention being an AI or a model, never use emoji, never use stage directions.",
    "Do not make jokes about real wars, bombings, or real people who have been hurt. If the player pushes for that, answer plainly and change the subject.",
    "",
    "If the player agrees to do something with you that matches one of these plans, end your reply with a tag on its own like [plan:lights].",
    plans,
    "",
    "Current state — season: " + (ctx.season || '?') + ", " + (ctx.night ? "night" : "day") +
    ", leaves the player holds: " + (ctx.leaves | 0) + ", plans finished: " + (ctx.plansDone || 0) +
    ", backpack found: " + (ctx.backpack ? "yes" : "no") + "."
  ].join('\n');
}

async function remoteReply(text, ctx) {
  const msgs = history.slice(-10).map(h => ({ role: h.role, content: h.text }));
  msgs.push({ role: 'user', content: text });
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model, max_tokens: 300, system: systemPrompt(ctx), messages: msgs
    })
  });
  if (!res.ok) throw new Error('http ' + res.status);
  const j = await res.json();
  const out = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  if (!out) throw new Error('empty');
  return out;
}

/* pull [plan:x] / [gift:x] tags off the end of a reply */
function parseTags(text) {
  const tags = {};
  const clean = text.replace(/\[(plan|gift|mood):([a-z0-9_-]+)\]/gi, (m, k, v) => { tags[k.toLowerCase()] = v.toLowerCase(); return ''; }).trim();
  return { text: clean, tags };
}

/* ---------------------------------------------------------------------
   PUBLIC
   --------------------------------------------------------------------- */
const AI = {
  get live() { return !!apiKey; },
  get model() { return model; },
  setKey(k) {
    apiKey = (k || '').trim();
    try { apiKey ? localStorage.setItem(KEY_STORE, apiKey) : localStorage.removeItem(KEY_STORE); } catch (e) {}
    return !!apiKey;
  },
  setModel(m) {
    model = (m || '').trim() || DEFAULT_MODEL;
    try { localStorage.setItem(MODEL_STORE, model); } catch (e) {}
    return model;
  },
  forget() { history.length = 0; memory.name = null; },

  /* always resolves — Noc never fails to say something */
  async ask(text, ctx) {
    ctx = ctx || {};
    history.push({ role: 'user', text });
    const local = localReply(text, ctx);
    let reply = local.text, plan = local.plan, live = false;

    if (apiKey) {
      try {
        const raw = await remoteReply(text, ctx);
        const parsed = parseTags(raw);
        reply = parsed.text;
        plan = parsed.tags.plan || null;
        live = true;
      } catch (e) {
        reply = local.text;
        plan = local.plan;
      }
    }
    history.push({ role: 'assistant', text: reply });
    if (history.length > 24) history.splice(0, history.length - 24);
    return { text: reply, plan, live, intent: local.intent };
  }
};

window.NOC_AI = AI;
})();
