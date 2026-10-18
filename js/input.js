'use strict';
// Keyboard + pointer joystick input. Joystick coordinates are stored in screen (CSS px) space.
const Input = {
  keys: Object.create(null),
  joy: { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 },
  toScreen: (cx, cy) => ({ x: cx, y: cy }), // set by main.js; joystick lives in screen (CSS px) space
  enabled: true,
  JOY_RADIUS: 55,

  init(canvas) {
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      this.keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      Sfx.init(); Sfx.resume();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = Object.create(null); this.joy.active = false; });

    canvas.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      Sfx.init(); Sfx.resume();
      if (this.joy.active) return;
      const p = this.toScreen(e.clientX, e.clientY);
      this.joy.active = true; this.joy.id = e.pointerId;
      this.joy.ox = p.x; this.joy.oy = p.y; this.joy.x = p.x; this.joy.y = p.y;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.joy.active || e.pointerId !== this.joy.id) return;
      const p = this.toScreen(e.clientX, e.clientY);
      this.joy.x = p.x; this.joy.y = p.y;
      // Let the stick origin follow the finger when dragged past the ring, which feels better on touch.
      const dx = this.joy.x - this.joy.ox, dy = this.joy.y - this.joy.oy;
      const d = Math.hypot(dx, dy);
      if (d > this.JOY_RADIUS) {
        this.joy.ox = this.joy.x - (dx / d) * this.JOY_RADIUS;
        this.joy.oy = this.joy.y - (dy / d) * this.JOY_RADIUS;
      }
      e.preventDefault();
    });
    const end = (e) => { if (this.joy.active && e.pointerId === this.joy.id) { this.joy.active = false; this.joy.id = null; } };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  },

  // Returns movement vector {x, y} with magnitude 0..1
  axis() {
    if (!this.enabled) return { x: 0, y: 0 };
    let x = 0, y = 0;
    const k = this.keys;
    if (k.KeyA || k.ArrowLeft) x -= 1;
    if (k.KeyD || k.ArrowRight) x += 1;
    if (k.KeyW || k.ArrowUp) y -= 1;
    if (k.KeyS || k.ArrowDown) y += 1;
    if (x || y) { const d = Math.hypot(x, y); return { x: x / d, y: y / d }; }
    if (this.joy.active) {
      const dx = this.joy.x - this.joy.ox, dy = this.joy.y - this.joy.oy;
      const d = Math.hypot(dx, dy);
      if (d < 8) return { x: 0, y: 0 };
      const m = Math.min(1, d / this.JOY_RADIUS);
      return { x: (dx / d) * m, y: (dy / d) * m };
    }
    return { x: 0, y: 0 };
  },
};
