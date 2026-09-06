/* =========================================================================
   THE WISE OAK TREE — tiny WebAudio chiptune engine.
   No files: everything is synthesised. Muting is remembered.
   ========================================================================= */
const SFX = (function () {
  let ctx = null, master = null, muted = false, started = false;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    return ctx;
  }

  function beep(freq, dur, type = 'square', vol = 0.5, slide = 0) {
    if (muted) return;
    const c = ensure(); if (!c) return;
    if (c.state === 'suspended') c.resume();
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), c.currentTime + dur);
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(vol, c.currentTime + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g); g.connect(master);
    o.start(); o.stop(c.currentTime + dur + 0.02);
  }

  function noise(dur, vol = 0.3, hp = 400) {
    if (muted) return;
    const c = ensure(); if (!c) return;
    if (c.state === 'suspended') c.resume();
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = c.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master); src.start();
  }

  const A = {
    talk(i) { beep(180 + (i % 5) * 24, 0.045, 'square', 0.18); },
    click() { beep(520, 0.05, 'square', 0.25, -160); },
    pickup() { beep(660, 0.06, 'square', 0.3); setTimeout(() => beep(880, 0.08, 'square', 0.3), 55); },
    sneeze() { noise(0.10, 0.35, 800); setTimeout(() => noise(0.30, 0.5, 300), 130); },
    ach() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.16, 'triangle', 0.35), i * 70)); },
    trade() { [440, 587, 740].forEach((f, i) => setTimeout(() => beep(f, 0.09, 'square', 0.28), i * 60)); },
    deny() { beep(160, 0.16, 'sawtooth', 0.3, -60); },
    hug() { [392, 494, 587, 784].forEach((f, i) => setTimeout(() => beep(f, 0.22, 'sine', 0.3), i * 90)); },
    water() { noise(0.5, 0.16, 1600); },
    flick() { noise(0.05, 0.4, 2000); beep(900, 0.03, 'square', 0.2); },
    fire() { noise(1.2, 0.5, 200); },
    boom() { noise(0.9, 0.6, 90); beep(70, 0.7, 'sawtooth', 0.4, -40); },
    ascend() { [392, 523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => beep(f, 0.5, 'sine', 0.28), i * 130)); },
    ending() { [523, 494, 587, 784].forEach((f, i) => setTimeout(() => beep(f, 0.5, 'triangle', 0.3), i * 220)); },
    squeak() { beep(1200, 0.05, 'square', 0.25, -600); },
    plant() { beep(330, 0.1, 'triangle', 0.3); setTimeout(() => beep(494, 0.16, 'triangle', 0.3), 90); },
    page() { noise(0.08, 0.2, 2500); },
    setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.22; },
    isMuted() { return muted; },
    kick() { if (!started) { started = true; ensure(); } }
  };
  return A;
})();
