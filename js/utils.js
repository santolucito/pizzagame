'use strict';
const U = {
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
  lerp: (a, b, t) => a + (b - a) * t,
  rand: (a, b) => a + Math.random() * (b - a),
  randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  ease: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  fmt: (n) => {
    n = Math.floor(n);
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString('en-US');
  },
  money: (n) => '$' + U.fmt(n),
  // Move a point toward a target at `speed` px/s. Returns true when it arrives.
  moveToward: (obj, tx, ty, speed, dt) => {
    const dx = tx - obj.x, dy = ty - obj.y;
    const d = Math.hypot(dx, dy);
    const step = speed * dt;
    if (d <= step || d < 0.5) { obj.x = tx; obj.y = ty; obj.moving = false; return true; }
    obj.x += (dx / d) * step; obj.y += (dy / d) * step;
    obj.moving = true;
    obj.facing = dx < 0 ? -1 : 1;
    return false;
  },
  roundRect: (ctx, x, y, w, h, r) => {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },
};
