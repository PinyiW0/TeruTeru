// Synthesized sounds via WebAudio — no assets needed.
// Three palettes:  chime (hang doll), tok (tap interaction), bloom (completion)

(function () {
  let ctx = null;
  let enabled = true;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Bell-like wind chime - sine + bright overtones, exponential decay.
  function chime(freq = 880) {
    if (!enabled) return;
    const ac = ensureCtx(); if (!ac) return;
    const now = ac.currentTime;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    gain.connect(ac.destination);

    // Fundamental + two overtones (3rd, 5th-ish) for bell timbre.
    [
      { f: freq,        type: 'sine',     g: 1.0  },
      { f: freq * 2.0,  type: 'sine',     g: 0.42 },
      { f: freq * 3.01, type: 'triangle', g: 0.18 },
      { f: freq * 5.4,  type: 'sine',     g: 0.08 },
    ].forEach((p) => {
      const o = ac.createOscillator();
      o.type = p.type;
      o.frequency.value = p.f;
      const og = ac.createGain();
      og.gain.value = p.g;
      o.connect(og).connect(gain);
      o.start(now);
      o.stop(now + 1.7);
    });
  }

  // Wooden fish "tok" — pitched noise burst through low-pass filter.
  function tok() {
    if (!enabled) return;
    const ac = ensureCtx(); if (!ac) return;
    const now = ac.currentTime;
    const buf = ac.createBuffer(1, ac.sampleRate * 0.12, ac.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.02));
    const src = ac.createBufferSource(); src.buffer = buf;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.value = 900;
    const g = ac.createGain(); g.gain.value = 0.18;
    src.connect(lp).connect(g).connect(ac.destination);
    src.start(now);

    // Plus a soft pitched component
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = 280;
    const og = ac.createGain();
    og.gain.setValueAtTime(0.001, now);
    og.gain.exponentialRampToValueAtTime(0.12, now + 0.005);
    og.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    o.connect(og).connect(ac.destination);
    o.start(now); o.stop(now + 0.2);
  }

  // Completion bloom — pentatonic arpeggio with bell timbre.
  function bloom() {
    if (!enabled) return;
    const ac = ensureCtx(); if (!ac) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C E G C E
    notes.forEach((f, i) => setTimeout(() => chime(f), i * 110));
  }

  // Tiny soft "pluck" for buttons / nav.
  function pluck(freq = 440) {
    if (!enabled) return;
    const ac = ensureCtx(); if (!ac) return;
    const now = ac.currentTime;
    const o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq * 1.2, now);
    o.frequency.exponentialRampToValueAtTime(freq, now + 0.04);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.13, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    o.connect(g).connect(ac.destination);
    o.start(now); o.stop(now + 0.32);
  }

  // The chime tone progresses slightly with each doll so the rhythm feels alive.
  const chimeScale = [659.25, 698.46, 783.99, 880, 987.77, 1046.5, 1174.66, 1318.5];
  function chimeAt(idx) {
    chime(chimeScale[idx % chimeScale.length]);
  }

  window.TeruAudio = {
    chime, chimeAt, tok, bloom, pluck,
    setEnabled: (v) => { enabled = !!v; },
    isEnabled: () => enabled,
  };
})();
