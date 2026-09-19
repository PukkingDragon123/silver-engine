/* =========================================================================
   AUDIO — a tiny chiptune box. No files, every sound is oscillators and a
   gain envelope, so the whole soundtrack weighs nothing.
   ========================================================================= */
const SFX = (() => {
  let ac = null, master = null, on = true, musicGain = null, musicTimer = null, musicStep = 0;

  function boot() {
    if (ac) return ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    master = ac.createGain(); master.gain.value = .5; master.connect(ac.destination);
    musicGain = ac.createGain(); musicGain.gain.value = .16; musicGain.connect(master);
    return ac;
  }

  function tone(freq, dur, type, vol, when, slideTo, dest) {
    if (!on || !boot()) return;
    const t0 = ac.currentTime + (when || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20,slideTo), t0+dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol == null ? .22 : vol, t0 + Math.min(.012,dur*.3));
    g.gain.exponentialRampToValueAtTime(.0006, t0 + dur);
    o.connect(g); g.connect(dest || master);
    o.start(t0); o.stop(t0 + dur + .02);
  }
  function noise(dur, vol, filt) {
    if (!on || !boot()) return;
    const n = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i=0;i<n;i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/n, 2);
    const src = ac.createBufferSource(); src.buffer = buf;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = filt || 1400; bp.Q.value = .8;
    const g = ac.createGain(); g.gain.value = vol == null ? .18 : vol;
    src.connect(bp); bp.connect(g); g.connect(master); src.start();
  }
  const arp = (notes, step, type, vol) =>
    notes.forEach((f,i) => tone(f, step*1.7, type || 'square', vol == null ? .18 : vol, i*step));

  /* --- the sound board ---------------------------------------------------- */
  const lib = {
    tap:     () => tone(680, .05, 'square', .13),
    hover:   () => tone(900, .03, 'sine', .07),
    back:    () => tone(420, .07, 'square', .12, 0, 300),
    step:    () => noise(.05, .05, 900),
    correct: () => arp([523,659,784,1047], .055, 'square', .17),
    wrong:   () => { tone(196,.22,'sawtooth',.16,0,120); noise(.1,.08,500); },
    hit:     () => { noise(.09,.2,2200); tone(210,.1,'square',.14,0,90); },
    crit:    () => { noise(.14,.26,3000); arp([880,1175,1568],.04,'square',.2); tone(120,.25,'sawtooth',.16,0,60); },
    guard:   () => { tone(330,.12,'triangle',.14); tone(494,.14,'triangle',.1,.05); },
    heal:    () => arp([659,880,1047,1319],.06,'sine',.16),
    ult:     () => { arp([392,523,659,784,1047,1319],.06,'square',.2);
                     tone(80,.7,'sawtooth',.2,.1,40); noise(.5,.16,700); },
    combo:   n => tone(520 + Math.min(n,12)*70, .07, 'square', .15),
    power:   () => arp([440,554,659,880,1108],.05,'triangle',.18),
    coin:    () => arp([988,1319],.05,'square',.14),
    chop:    () => { noise(.11,.22,700); tone(150,.09,'square',.12,0,80); },
    mine:    () => { noise(.12,.22,2600); tone(300,.07,'square',.1,0,180); },
    chest:   () => { arp([392,523,659,784],.07,'square',.18); noise(.3,.12,900); },
    rarity:  n => arp([523,659,784,1047,1319,1568].slice(0, 3 + n), .07, 'square', .2),
    hatch:   () => { noise(.12,.16,1800); arp([784,988,1319,1568],.07,'sine',.18); },
    levelup: () => arp([523,659,784,1047,1319,1568],.07,'square',.2),
    win:     () => arp([523,659,784,1047,880,1047,1319],.09,'square',.2),
    lose:    () => arp([440,392,330,262],.13,'triangle',.17),
    swipe:   () => noise(.12,.1,3200),
    build:   () => { noise(.14,.18,600); tone(180,.14,'square',.12); },
    egg:     () => tone(760,.06,'sine',.12,0,980),
    pop:     () => tone(1200,.05,'sine',.1,0,1600)
  };

  /* --- a gentle two-bar loop for the island; it idles under everything ---- */
  const SCALE = [0,2,4,7,9,12,14,16];
  const ROOTS = [196.00, 174.61, 146.83, 164.81];
  function musicTick() {
    if (!on || !ac) return;
    const bar = Math.floor(musicStep/8) % 4, root = ROOTS[bar];
    const nt = SCALE[(musicStep*3 + bar*2) % SCALE.length];
    const f = root * Math.pow(2, nt/12);
    tone(f*2, .34, 'triangle', .07, 0, null, musicGain);
    if (musicStep % 8 === 0) tone(root/2, .7, 'sine', .1, 0, null, musicGain);
    if (musicStep % 4 === 2) tone(f*4, .12, 'square', .025, .1, null, musicGain);
    musicStep++;
  }

  return {
    play(name, arg) { const f = lib[name]; if (f) f(arg); },
    get enabled() { return on; },
    unlock() { boot(); if (ac && ac.state === 'suspended') ac.resume(); },
    toggle(v) {
      on = v == null ? !on : v;
      if (!on) this.music(false); else this.music(true);
      return on;
    },
    music(want) {
      if (want && on) { if (!musicTimer && boot()) musicTimer = setInterval(musicTick, 340); }
      else if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    },
    duck(v) { if (musicGain && ac) musicGain.gain.setTargetAtTime(v, ac.currentTime, .2); }
  };
})();
