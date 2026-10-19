'use strict';
// Keyboard, one-finger joystick, two-finger pinch zoom and mouse-wheel zoom.
// Joystick coordinates are stored in screen (CSS px) space.
const Input = {
  keys: Object.create(null),
  joy: { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 },
  pointers: new Map(),
  pinch: { active: false, d0: 0, z0: 1, cooldown: false },
  toScreen: (cx, cy) => ({ x: cx, y: cy }), // set by main.js
  onZoom: null,                              // set by main.js: (factorRelativeToStart, absolute) => void
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
    window.addEventListener('blur', () => { this.keys = Object.create(null); this.joy.active = false; this.pointers.clear(); this.pinch.active = false; });

    canvas.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      Sfx.init(); Sfx.resume();
      if (Game.fishing) { Game.reel(); e.preventDefault(); return; } // any tap reels the line in
      const p = this.toScreen(e.clientX, e.clientY);
      this.pointers.set(e.pointerId, p);
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (this.pointers.size === 2) {
        // second finger: switch from joystick to pinch
        this.joy.active = false; this.joy.id = null;
        const [a, b] = [...this.pointers.values()];
        this.pinch.active = true; this.pinch.d0 = Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)); this.pinch.z0 = Render.zoom;
      } else if (this.pointers.size === 1 && !this.pinch.cooldown) {
        this.joy.active = true; this.joy.id = e.pointerId;
        this.joy.ox = p.x; this.joy.oy = p.y; this.joy.x = p.x; this.joy.y = p.y;
      }
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      const p = this.toScreen(e.clientX, e.clientY);
      this.pointers.set(e.pointerId, p);
      if (this.pinch.active && this.pointers.size >= 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.onZoom) this.onZoom(this.pinch.z0 * (d / this.pinch.d0));
      } else if (this.joy.active && e.pointerId === this.joy.id) {
        this.joy.x = p.x; this.joy.y = p.y;
        // Let the stick origin follow the finger when dragged past the ring, which feels better on touch.
        const dx = this.joy.x - this.joy.ox, dy = this.joy.y - this.joy.oy;
        const d = Math.hypot(dx, dy);
        if (d > this.JOY_RADIUS) {
          this.joy.ox = this.joy.x - (dx / d) * this.JOY_RADIUS;
          this.joy.oy = this.joy.y - (dy / d) * this.JOY_RADIUS;
        }
      }
      e.preventDefault();
    });
    const end = (e) => {
      this.pointers.delete(e.pointerId);
      if (this.joy.active && e.pointerId === this.joy.id) { this.joy.active = false; this.joy.id = null; }
      if (this.pinch.active && this.pointers.size < 2) {
        this.pinch.active = false;
        // ignore the remaining finger until it lifts, so the player does not lurch after a pinch
        this.pinch.cooldown = this.pointers.size > 0;
      }
      if (this.pointers.size === 0) this.pinch.cooldown = false;
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('wheel', (e) => {
      if (!this.enabled || !this.onZoom) return;
      e.preventDefault();
      this.onZoom(Render.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
    }, { passive: false });
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
