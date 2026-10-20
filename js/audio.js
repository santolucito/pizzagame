'use strict';
// Tiny procedural sound effects via WebAudio (no asset files needed).
const Sfx = {
  ctx: null, muted: false, lastAt: {},
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  tone(freq, dur, type = 'sine', gain = 0.08, slide = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  },
  throttle(key, ms) {
    const now = performance.now();
    if (this.lastAt[key] && now - this.lastAt[key] < ms) return false;
    this.lastAt[key] = now; return true;
  },
  // one blip per batch: moving a whole stack of pizzas makes a single sound, not one per pizza
  pickup() { if (this.throttle('pickup', 700)) this.tone(520, 0.07, 'triangle', 0.045, 200); },
  drop() { if (this.throttle('drop', 700)) this.tone(380, 0.07, 'triangle', 0.045, -120); },
  cash() { if (this.throttle('cash', 120)) { this.tone(880, 0.12, 'sine', 0.07); setTimeout(() => this.tone(1320, 0.18, 'sine', 0.07), 70); } },
  pay() { if (this.throttle('pay', 2500)) this.tone(660, 0.1, 'square', 0.025, 200); },   // once when money starts flowing into a circle
  // Alert-style sounds are soft and rate-limited so news never turns into a wall of bleeps.
  unlock() { if (this.throttle('unlock', 2500)) [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.045), i * 90)); },
  chime() { if (this.throttle('chime', 3000)) this.tone(988, 0.22, 'sine', 0.035); },
  buy() { this.tone(700, 0.1, 'triangle', 0.06, 300); },
  error() { if (this.throttle('error', 500)) this.tone(200, 0.2, 'sawtooth', 0.04, -80); },
  angry() { if (this.throttle('angry', 2000)) this.tone(260, 0.22, 'sawtooth', 0.025, -100); },
  clean() { if (this.throttle('clean', 200)) this.tone(900, 0.15, 'sine', 0.05, 400); },
  // steam whistle: two rich notes (a square and a sine an octave up) with a little slide
  whistle() {
    if (!this.throttle('whistle', 4000)) return;
    this.tone(587, 0.45, 'square', 0.045, 60); this.tone(1174, 0.45, 'sine', 0.03, 120);
    setTimeout(() => { this.tone(784, 0.7, 'square', 0.045, -40); this.tone(1568, 0.7, 'sine', 0.03, -80); }, 420);
  },
  // chugga chugga: a short puff of filtered noise, called on the train's rhythm while it rolls
  chuff(strength = 1) {
    if (!this.ctx || this.muted || !this.throttle('chuff', 120)) return;
    if (!this.noise) { const n = this.ctx.sampleRate * 0.12, buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; this.noise = buf; }
    const t = this.ctx.currentTime, src = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    src.buffer = this.noise; f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 0.8;
    g.gain.setValueAtTime(0.09 * strength, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    src.connect(f); f.connect(g); g.connect(this.ctx.destination); src.start(t); src.stop(t + 0.12);
  },
  ding() { if (this.throttle('ding', 2000)) this.tone(1760, 0.4, 'sine', 0.04); },
};

// Light haptic feedback where the platform supports it (Android Chrome); silently ignored elsewhere.
const Haptics = {
  enabled: true,
  buzz(pattern) { if (!this.enabled || Sfx.muted) return; try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* ignore */ } },
  tap() { this.buzz(12); },
  success() { this.buzz([20, 40, 30]); },
};
