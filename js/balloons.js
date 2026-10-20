'use strict';
// Balloons: buy one at the balloon cart in the City and carry it around.
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
//
// Stand next to the balloon seller by Pizza Square and press the action button: a little picker shows the
// balloons one page at a time (push the joystick left/right to flip, down to close, the action button buys).
// Once bought, the balloon floats on a string above the chef on every map (on foot and while driving),
// lagging behind a little when the chef moves. It never pops; the action button lets the kid "let it go"
// and watch it fly away.

CFG.BALLOONS = {
  KINDS: [
    { key: 'red', label: 'Red balloon', color: '#e4572e', price: 15 },
    { key: 'blue', label: 'Blue balloon', color: '#3b7dd8', price: 15 },
    { key: 'yellow', label: 'Yellow balloon', color: '#ffd166', price: 15 },
    { key: 'pink', label: 'Pink balloon', color: '#ff8fab', price: 20 },
    { key: 'star', label: 'Star balloon', color: '#ffc93c', price: 25, shape: 'star' },
    { key: 'pizza', label: 'Pizza balloon', color: '#d98a3c', price: 40, shape: 'pizza' },
  ],
  BUY_RANGE: 70,      // how close to the cart (CFG.CITY.BALLOONS) the "Buy a balloon" button appears
  HINT_RANGE: 160,    // how close to the cart the "buy a balloon" hint shows
  STRING: 52,         // string length from hand to balloon (px)
  EASE: 7,            // how quickly the balloon catches up with the chef (per second)
  DRIFT: 0.16,        // how far behind the balloon trails per px/s of chef speed
  FLY_DUR: 3,         // seconds a released balloon takes to fly away
  PUSH: 0.5,          // joystick deflection that counts as a push in the picker
};

const BalloonsExt = {
  name: 'balloons',
  defaults: { balloon: { kind: null, boughtAt: 0, firstToast: false } },

  // runtime: the floating balloon position, a balloon that was just let go, and the open picker
  b: null,
  fly: null,
  prev: null,
  picker: null,
  settle: null,   // after closing the picker with the stick, the chef stays put until the stick is let go

  kindDef(key) { return CFG.BALLOONS.KINDS.find((k) => k.key === key) || null; },
  nearCart(g, range) { const BL = CFG.CITY.BALLOONS, p = g.player; return U.dist(p.x, p.y, BL.x, BL.y) < range; },
  onFoot(g) { return !g.driving && !g.onTrain && !g.travel && !g.ride && !g.fishing; },
  inTowerRoom(g) { return g.area === 'city' && typeof CityExt !== 'undefined' && !!CityExt.floor; },
  canShop(g) { return g.area === 'city' && this.onFoot(g) && !this.inTowerRoom(g) && this.nearCart(g, CFG.BALLOONS.BUY_RANGE); },

  // ---------- game hooks ----------
  build(g) { this.b = null; this.fly = null; this.prev = null; this.picker = null; },

  // ---------- the picker ----------
  openPicker(g) {
    const K = CFG.BALLOONS.KINDS, owned = g.s.balloon.kind;
    const start = Math.max(0, K.findIndex((k) => k.key !== owned));
    this.picker = { page: start, flip: 0, dir: 1, ready: false, hold: { x: g.player.x, y: g.player.y } };
    g.player.moving = false;
    Sfx.ding(); Haptics.tap();
  },
  closePicker(g) { this.picker = null; },
  flipPage(dir) {
    const P = this.picker, n = CFG.BALLOONS.KINDS.length;
    P.page = (P.page + dir + n) % n; P.dir = dir; P.flip = 1;
    Sfx.pickup(); Haptics.tap();
  },
  pickerAction(g) {
    const P = this.picker, k = CFG.BALLOONS.KINDS[P.page], s = g.s;
    if (s.balloon.kind === k.key) return { label: '✅ You have this one!', run: (gg) => this.closePicker(gg) };
    if (s.cash < k.price) {
      return { label: `💰 Need ${U.money(k.price - s.cash)} more`, run: (gg) => {
        gg.floats.push({ x: gg.player.x, y: gg.player.y - 70, text: `Need ${U.money(k.price - gg.s.cash)} more!`, color: '#ffe08a', t: 0, dur: 1.4, big: true });
        Sfx.error();
      } };
    }
    return { label: `🛒 Buy for ${U.money(k.price)}`, run: (gg) => this.buy(gg, k) };
  },
  buy(g, k) {
    const s = g.s, p = g.player, swap = !!s.balloon.kind;
    s.cash -= k.price;
    s.balloon.kind = k.key; s.balloon.boughtAt = Date.now();
    this.b = null; // the new balloon starts right above the chef
    Sfx.buy(); Haptics.success();
    g.fx.push({ kind: 'sparkle', x0: p.x, y0: p.y - 40, x1: p.x, y1: p.y - 40, t: 0, dur: 0.6 });
    g.floats.push({ x: p.x, y: p.y - 76, text: `🎈 ${k.label}!`, color: '#ffe08a', t: 0, dur: 1.6, big: true });
    if (!s.balloon.firstToast) { s.balloon.firstToast = true; g.toast('🎈 Your very own balloon!', true); }
    else if (swap) g.toast(`🎈 Swapped for the ${k.label.toLowerCase()}!`);
    this.closePicker(g);
  },
  updatePicker(g, dt) {
    const P = this.picker, p = g.player, B = CFG.BALLOONS;
    // the chef stays put while choosing
    p.x = P.hold.x; p.y = P.hold.y; p.moving = false;
    if (P.flip > 0) P.flip = Math.max(0, P.flip - dt * 5);
    const a = Input.axis();
    const pushed = Math.abs(a.x) > B.PUSH || Math.abs(a.y) > B.PUSH;
    if (!pushed) { P.ready = true; return; }      // the stick must come back to the middle between pushes
    if (!P.ready) return;
    P.ready = false;
    if (Math.abs(a.x) >= Math.abs(a.y)) this.flipPage(a.x < 0 ? -1 : 1);
    else if (a.y > 0) { this.closePicker(g); this.settle = { x: p.x, y: p.y }; Sfx.drop(); }
  },

  // where the string is held and how high the balloon should float
  anchor(g) {
    const p = g.player;
    if (g.driving && g.vehicle) {
      const v = g.vehicle, lift = 30, n = Math.min(p.carry, 30);
      return { hx: v.x + 6, hy: v.y - 10, top: v.y - lift - (p.carry > 0 ? n * 4 + 8 : 14), side: 6 };
    }
    const bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0, f = p.facing || 1;
    const n = Math.min(p.carry, 30);
    const top = p.carry > 0 ? p.y - 70 - n * 4 - 10 : p.y - 64;
    return { hx: p.x + f * 14, hy: p.y - 16 + bob, top, side: f * 14 };
  },

  update(g, dt) {
    const B = CFG.BALLOONS, p = g.player;
    if (this.picker && (!this.onFoot(g) || g.area !== 'city')) this.picker = null;   // a ride or a bus trip closes it
    if (this.picker) this.updatePicker(g, dt);
    else if (this.settle) {
      const a = Input.axis();
      if (Math.abs(a.x) > B.PUSH || Math.abs(a.y) > B.PUSH) { p.x = this.settle.x; p.y = this.settle.y; p.moving = false; }
      else this.settle = null;
    }
    // the balloon flying away
    if (this.fly) { this.fly.t += dt; if (this.fly.t >= this.fly.dur) this.fly = null; }
    // the carried balloon eases toward a spot above the chef, trailing behind movement and swaying
    if (!g.s.balloon.kind || g.onTrain || g.travel) { this.b = null; this.prev = null; return; }
    const a = this.anchor(g);
    const ref = g.driving && g.vehicle ? g.vehicle : p;
    let vx = 0, vy = 0;
    if (this.prev && dt > 0) { vx = (ref.x - this.prev.x) / dt; vy = (ref.y - this.prev.y) / dt; }
    if (Math.abs(vx) > 700 || Math.abs(vy) > 700) { vx = 0; vy = 0; this.b = null; } // teleported (new map, hopped in a car): snap
    this.prev = { x: ref.x, y: ref.y };
    const sway = Math.sin(g.time * 1.7) * 5, lift = Math.sin(g.time * 2.3) * 2;
    const tx = a.hx + a.side * 0.4 + sway - U.clamp(vx * B.DRIFT, -40, 40);
    const ty = a.top - 26 + lift - U.clamp(vy * B.DRIFT * 0.6, -24, 24);
    if (!this.b) this.b = { x: tx, y: ty };
    const k = Math.min(1, dt * B.EASE);
    this.b.x += (tx - this.b.x) * k; this.b.y += (ty - this.b.y) * k;
    // the string can stretch a little but never too far
    const dx = this.b.x - a.hx, dy = this.b.y - a.hy, d = Math.hypot(dx, dy), max = Math.max(B.STRING, a.hy - a.top + 26) + 22;
    if (d > max) { this.b.x = a.hx + dx / d * max; this.b.y = a.hy + dy / d * max; }
  },

  action(g) {
    if (this.picker) return this.pickerAction(g);
    if (this.canShop(g)) return { label: '🎈 Buy a balloon', run: (gg) => this.openPicker(gg) };
    if (!g.s.balloon.kind || !this.onFoot(g) || this.fly) return null;
    if (g.nearPrep || g.nearPond || g.nearTrain || g.nearVehicle) return null;
    for (const e of g.ext) if (e !== this && e.action && e.action(g)) return null;
    return { label: '🎈 Let the balloon go', run: (gg) => this.release(gg) };
  },
  release(g) {
    const kind = g.s.balloon.kind; if (!kind) return;
    const a = this.anchor(g), b = this.b || { x: a.hx, y: a.top - 26 };
    this.fly = { kind, x: b.x, y: b.y, baseY: g.player.y + 1, t: 0, dur: CFG.BALLOONS.FLY_DUR, sway: Math.random() * 6 };
    g.s.balloon.kind = null; this.b = null;
    g.floats.push({ x: g.player.x, y: g.player.y - 70, text: 'Bye bye, balloon!', color: '#ffe08a', t: 0, dur: 1.6, big: true });
    Sfx.whistle(); Haptics.tap();
  },

  hint(g) {
    if (this.picker) return null;
    if (g.area !== 'city' || g.driving || g.s.balloon.kind || this.fly || this.inTowerRoom(g)) return undefined;
    if (!this.nearCart(g, CFG.BALLOONS.HINT_RANGE)) return undefined;
    const BL = CFG.CITY.BALLOONS;
    return { text: 'Buy a balloon! 🎈', target: this.nearCart(g, CFG.BALLOONS.BUY_RANGE) ? null : { x: BL.x, y: BL.y } };
  },

  // ---------- drawing ----------
  // One balloon at (x, y) with its knot; scale shrinks it as it flies away (or grows it in the picker).
  drawBalloon(r, kind, x, y, scale, t) {
    const ctx = r.ctx, k = this.kindDef(kind); if (!k) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(43,29,20,0.35)';
    if (k.shape === 'pizza') {
      // a round pizza balloon with toppings
      ctx.fillStyle = '#c47a2c'; ctx.beginPath(); ctx.arc(1, 1, 15, 0, Math.PI * 2); ctx.fill();
      r.drawPizza(0, 0, 14);
      ctx.beginPath(); ctx.arc(0, 0, 14.5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-5, -6, 4, 2.5, -0.7, 0, Math.PI * 2); ctx.fill();
      this.knot(ctx, 0, 14, k.color);
    } else if (k.shape === 'star') {
      ctx.fillStyle = k.color; ctx.beginPath();
      for (let i = 0; i < 10; i++) { const rr = i % 2 ? 7.5 : 16, an = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-4, -5, 3.5, 2.2, -0.7, 0, Math.PI * 2); ctx.fill();
      this.knot(ctx, 0, 13, k.color);
    } else {
      ctx.fillStyle = k.color; ctx.beginPath(); ctx.ellipse(0, 0, 12, 14.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-4, -6, 3.5, 5, -0.4, 0, Math.PI * 2); ctx.fill();
      this.knot(ctx, 0, 14.5, k.color);
    }
    ctx.restore();
  },
  knot(ctx, x, y, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, y - 1); ctx.lineTo(x - 3.5, y + 4); ctx.lineTo(x + 3.5, y + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.arc(x, y + 3, 1.6, 0, Math.PI * 2); ctx.fill();
  },
  // the string from the hand to the balloon, bowing a little in the wind
  drawString(ctx, hx, hy, bx, by, t) {
    ctx.strokeStyle = 'rgba(43,29,20,0.55)'; ctx.lineWidth = 1;
    const mx = (hx + bx) / 2 + Math.sin(t * 2.2) * 3, my = (hy + by) / 2 + 4;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(mx, my, bx, by + 16); ctx.stroke();
  },
  drawCarried(r, g) {
    const a = this.anchor(g), b = this.b;
    this.drawString(r.ctx, a.hx, a.hy, b.x, b.y, g.time);
    this.drawBalloon(r, g.s.balloon.kind, b.x, b.y, 1, g.time);
  },

  // Inside the Pizza Tower the City paints the room (and the chef) over the entity layer, and next to the cart its
  // own bunch of balloons floats above everything, so in both spots the carried balloon is drawn on top too.
  onTop(g) { return this.inTowerRoom(g) || (g.area === 'city' && this.nearCart(g, 130)); },
  overlay(r, g) {
    if (!this.onTop(g) || !g.s.balloon.kind || !this.b) return;
    this.drawCarried(r, g);
  },

  entities(r, g, items) {
    const ctx = r.ctx;
    if (this.fly) {
      const F = this.fly;
      items.push({ y: F.baseY, draw: () => {
        const k = F.t / F.dur;
        const y = F.y - k * 90 - k * k * 70, x = F.x + Math.sin(g.time * 2 + F.sway) * 10 + k * 30;
        const sc = 1 - k * 0.55;
        ctx.save(); ctx.globalAlpha = k > 0.75 ? (1 - k) / 0.25 : 1;
        // a loose bit of string dangles below the balloon
        ctx.strokeStyle = 'rgba(43,29,20,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y + 16 * sc);
        ctx.quadraticCurveTo(x - 6 * sc + Math.sin(g.time * 3) * 4, y + 34 * sc, x + Math.sin(g.time * 2.5) * 6 * sc, y + 48 * sc); ctx.stroke();
        this.drawBalloon(r, F.kind, x, y, sc, g.time);
        ctx.restore();
      } });
    }
    if (!g.s.balloon.kind || !this.b || g.onTrain || g.travel || this.onTop(g)) return;
    const baseY = g.driving && g.vehicle ? g.vehicle.y + 13 : g.player.y + 1;
    items.push({ y: baseY, draw: () => this.drawCarried(r, g) });
  },

  // the picker card, screen space: one balloon per page, arrows at the sides
  screen(r, g) {
    const P = this.picker; if (!P) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    const K = CFG.BALLOONS.KINDS, k = K[P.page], owned = g.s.balloon.kind === k.key, afford = g.s.cash >= k.price;
    const cw = Math.min(360, W - 32), ch = 250, cx = W / 2, cy = Math.min(H / 2, H - ch / 2 - 90), x0 = cx - cw / 2, y0 = cy - ch / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(43,29,20,0.35)'; ctx.fillRect(0, 0, W, H);
    // card
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; U.roundRect(ctx, x0 + 4, y0 + 8, cw, ch, 22); ctx.fill();
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, x0, y0, cw, ch, 22); ctx.fill();
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 4; U.roundRect(ctx, x0, y0, cw, ch, 22); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(20); ctx.fillText('🎈 Pick a balloon', cx, y0 + 28);
    // the balloon, flipping in from the side it came from
    const f = P.flip, e = f * f;
    const bx = cx + P.dir * e * 60, by = y0 + 118 + Math.sin(g.time * 2.2) * 4, sc = 2.6 * (1 - e * 0.5);
    ctx.save(); ctx.globalAlpha = 1 - e;
    ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx, by + 40); ctx.quadraticCurveTo(bx + Math.sin(g.time * 2) * 6, by + 62, bx + 2, by + 84); ctx.stroke();
    this.drawBalloon(r, k.key, bx, by, sc, g.time);
    ctx.restore();
    // name, price, page counter
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(18); ctx.fillText(k.label, cx, y0 + 186);
    ctx.fillStyle = owned ? '#2f9e44' : afford ? '#1f6e2e' : '#b8401c'; ctx.font = r.font(16);
    ctx.fillText(owned ? 'Yours!' : U.money(k.price), cx, y0 + 208);
    ctx.fillStyle = '#8a7a6a'; ctx.font = r.font(13); ctx.fillText(`${P.page + 1} / ${K.length}`, cx, y0 + 230);
    // arrows
    const pulse = 1 + Math.sin(g.time * 4) * 0.08;
    for (const d of [-1, 1]) {
      const ax = cx + d * (cw / 2 - 30), ay = y0 + 118;
      ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.arc(ax, ay, 18 * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.moveTo(ax + d * 7, ay); ctx.lineTo(ax - d * 5, ay - 9); ctx.lineTo(ax - d * 5, ay + 9); ctx.closePath(); ctx.fill();
    }
    // how to close
    ctx.fillStyle = '#fff'; ctx.font = r.font(12); ctx.fillText('◀ ▶ flip  ·  ▼ close', cx, y0 + ch + 18);
    ctx.restore();
  },
};
// The City's hint and action hooks answer for most spots in the City, so this extension goes first in Game.ext:
// its hint only claims the few steps around the balloon cart, and its "let go" action defers to every other extension.
Game.ext.unshift(BalloonsExt);
Render.ext.push(BalloonsExt);
