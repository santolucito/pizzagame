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
  pickup() { if (this.throttle('pickup', 60)) this.tone(520, 0.07, 'triangle', 0.05, 200); },
  drop() { if (this.throttle('drop', 60)) this.tone(380, 0.07, 'triangle', 0.05, -120); },
  cash() { if (this.throttle('cash', 120)) { this.tone(880, 0.12, 'sine', 0.07); setTimeout(() => this.tone(1320, 0.18, 'sine', 0.07), 70); } },
  pay() { if (this.throttle('pay', 100)) this.tone(660, 0.1, 'square', 0.03, 200); },
  unlock() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'triangle', 0.08), i * 90)); },
  buy() { this.tone(700, 0.1, 'triangle', 0.06, 300); },
  error() { this.tone(200, 0.2, 'sawtooth', 0.05, -80); },
  angry() { if (this.throttle('angry', 300)) this.tone(260, 0.25, 'sawtooth', 0.04, -100); },
  clean() { if (this.throttle('clean', 200)) this.tone(900, 0.15, 'sine', 0.05, 400); },
};

// Light haptic feedback where the platform supports it (Android Chrome); silently ignored elsewhere.
const Haptics = {
  enabled: true,
  buzz(pattern) { if (!this.enabled || Sfx.muted) return; try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* ignore */ } },
  tap() { this.buzz(12); },
  success() { this.buzz([20, 40, 30]); },
};
