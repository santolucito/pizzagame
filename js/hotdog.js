'use strict';
// The City's hot dog stand.
// Extension module: registered first in Game.ext (so its button beats the City's taxi button) and in Render.ext.
// See js/EXTENSIONS.md.
//
// The hot dog cart on Bus Street (CFG.CITY.HOTDOG, its obstacle is the City's) gets a friendly vendor in a striped
// apron and a paper hat, who waves (a hop and a 👋) when the chef comes close. Stand in front of the cart and press the button: the
// vendor hands over a hot dog in a bun with a mustard zigzag ($3, or on the house when the chef is broke). The chef
// carries it for two seconds, then flips it up over his head (it spins once), it drops straight into his mouth:
// CHOMP! A mustard sparkle, a happy little head bob, "Yum! 😋". No arm waving for the chef: the hot dog does the work.

// ---------- config ----------
CFG.HOTDOG = {
  STAND: { x: 5674, y: 148 },      // front-left of the cart, at the top of Pizza Square: clear of the cart, the road and the tree's canopy
  REACH: 34,                        // how close to STAND the button shows
  HINT: 60,                         // how close to STAND the hint shows
  WAVE: 110,                        // the vendor waves when the chef is this close to the cart
  PRICE: 3,
  // seconds: the vendor hands it over, the chef holds it, flips it up, it drops into his mouth, he munches
  T: { give: 0.4, hold: 2.0, toss: 0.6, drop: 0.3, yum: 1.0 },
  APEX: 108,                        // how high above the chef's feet the hot dog flies
};

const HotdogExt = {
  name: 'hotdog',
  defaults: { hotdog: { eaten: 0 } },
  st: null,

  build(g) {
    if (!g.s.hotdog) g.s.hotdog = { eaten: 0 };
    this.st = { dog: null, say: null, sparks: [], drawn: 0 };
  },
  ready(g) { if (!this.st) this.build(g); if (!g.s.hotdog) g.s.hotdog = { eaten: 0 }; return this.st; },
  cart() { return CFG.CITY.HOTDOG; },
  vendor() { const H = this.cart(); return { x: H.x - 2, y: H.y - 4 }; },

  // ---------- small helpers ----------
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  cityBusy() { return typeof CityExt !== 'undefined' && !!(CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))); },
  free(g) { return g.area === 'city' && this.onFoot(g) && !this.cityBusy(); },
  atStand(g) { const S = CFG.HOTDOG.STAND, p = g.player; return this.free(g) && U.dist(p.x, p.y, S.x, S.y) < CFG.HOTDOG.REACH; },
  busy() { return !!(this.st && this.st.dog); },
  // the chef is drawn on foot right now (not hidden in a vehicle, a taxi or the Pizza Tower)
  visible(g) {
    if (g.driving || g.onTrain || g.travel) return false;
    if (typeof CityExt !== 'undefined' && g.area === 'city' && (CityExt.floor || (CityExt.st && CityExt.st.cab && CityExt.st.cab.phase !== 'coming'))) return false;
    return true;
  },

  // ---------- game hooks ----------
  action(g) {
    this.ready(g);
    if (this.busy() || !this.atStand(g)) return null;
    return { label: `🌭 Buy a hot dog ($${CFG.HOTDOG.PRICE})`, run: (gg) => this.buy(gg) };
  },
  buy(g) {
    const st = this.ready(g), K = CFG.HOTDOG, p = g.player, V = this.vendor();
    if (st.dog) return;
    const paid = g.s.cash >= K.PRICE;
    if (paid) { g.s.cash -= K.PRICE; Sfx.cash(); }
    st.dog = { phase: 'give', t: 0, paid };
    st.say = { text: paid ? 'Here you go! 🌭' : 'On the house! 🌭', t: 1.6 };
    g.floats.push({ x: p.x, y: p.y - 66, text: paid ? `-$${K.PRICE}` : 'On the house! 🌭', color: paid ? '#ffe08a' : '#7ee081', t: 0, dur: 1.3, big: true });
    p.facing = V.x >= p.x ? 1 : -1; p.hasMoved = true;
    Haptics.tap();
  },

  update(g, dt) {
    const st = this.ready(g), K = CFG.HOTDOG, T = K.T;
    if (st.say) { st.say.t -= dt; if (st.say.t <= 0) st.say = null; }
    for (const s of st.sparks) s.t += dt;
    st.sparks = st.sparks.filter((s) => s.t < s.dur);
    const d = st.dog; if (!d) return;
    d.t += dt;
    if (d.phase === 'give' && d.t >= T.give) { d.phase = 'hold'; d.t = 0; }
    else if (d.phase === 'hold' && d.t >= T.hold) { d.phase = 'toss'; d.t = 0; }
    else if (d.phase === 'toss' && d.t >= T.toss) { d.phase = 'drop'; d.t = 0; }
    else if (d.phase === 'drop' && d.t >= T.drop) { d.phase = 'yum'; d.t = 0; d.yummed = false; this.chomp(g); }
    else if (d.phase === 'yum') {
      if (!d.yummed && d.t >= 0.5) { d.yummed = true; const p = g.player; g.floats.push({ x: p.x, y: p.y - 70, text: 'Yum! 😋', color: '#ffe08a', t: 0, dur: 1.4, big: true }); }
      if (d.t >= T.yum) st.dog = null;
    }
  },
  chomp(g) {
    const st = this.st, p = g.player, m = this.mouth(g);
    g.s.hotdog.eaten = (g.s.hotdog.eaten || 0) + 1;
    g.floats.push({ x: p.x, y: p.y - 84, text: 'CHOMP!', color: '#ffd60a', t: 0, dur: 1, big: true });
    st.sparks.push({ x: m.x, y: m.y, area: g.area, t: 0, dur: 0.6 });
    Sfx.pickup(); Haptics.success();
  },

  hint(g) {
    this.ready(g);
    if (!this.free(g)) return undefined;
    const S = CFG.HOTDOG.STAND, p = g.player, d = U.dist(p.x, p.y, S.x, S.y);
    if (d >= CFG.HOTDOG.HINT) return undefined;
    return { text: 'Hot dogs! 🌭', target: d < 24 ? null : S };
  },

  // Take-me-home: the hot dog in hand (or in the air) is gone, the vendor stops talking
  home(g) { const st = this.ready(g); st.dog = null; st.say = null; st.sparks = []; },

  // ---------- where things are on the chef ----------
  bodyBob(p) { return p.moving ? Math.sin(p.bob || 0) * 2 : 0; },
  hand(g) { const p = g.player, f = p.facing || 1; return { x: p.x + f * 19, y: p.y - 21 + this.bodyBob(p) }; },
  mouth(g) { const p = g.player, f = p.facing || 1; return { x: p.x + f * 2, y: p.y - 38 + this.bodyBob(p) + 6.5 }; },
  // where the hot dog is now: position, spin and size (null once it is eaten)
  dogPose(g) {
    const d = this.st.dog, T = CFG.HOTDOG.T, p = g.player, f = p.facing || 1;
    if (!d || d.phase === 'yum') return null;
    const h = this.hand(g);
    if (d.phase === 'give') {
      const V = this.vendor(), k = U.clamp(d.t / T.give, 0, 1), sx = V.x - 18, sy = V.y - 26;
      return { x: U.lerp(sx, h.x, k), y: U.lerp(sy, h.y, k) - Math.sin(k * Math.PI) * 18, rot: 0, s: 1, f };
    }
    if (d.phase === 'hold') return { x: h.x, y: h.y, rot: 0, s: 1, f, held: true };
    const ax = p.x + f * 2, ay = p.y - CFG.HOTDOG.APEX;
    if (d.phase === 'toss') {
      const k = U.clamp(d.t / T.toss, 0, 1), up = 1 - (1 - k) * (1 - k);   // slows down near the top, like a real throw
      return { x: U.lerp(h.x, ax, k), y: U.lerp(h.y, ay, up), rot: f * k * Math.PI * 2, s: 1, f };
    }
    const k = U.clamp(d.t / T.drop, 0, 1), m = this.mouth(g);
    return { x: m.x, y: U.lerp(ay, m.y, k * k), rot: 0, s: k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4 * 0.6, f };
  },

  // ---------- art ----------
  // a hot dog in a bun with a mustard zigzag, centred on (0, 0), about 28 px long
  drawHotdog(ctx) {
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(43,29,20,0.5)';
    ctx.fillStyle = '#c4472b'; U.roundRect(ctx, -14, -4.5, 28, 7, 3.5); ctx.fill(); ctx.stroke();          // the sausage, poking out both ends
    ctx.fillStyle = '#e8b062'; ctx.beginPath(); ctx.ellipse(0, 2.5, 11.5, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();   // the bun
    ctx.fillStyle = '#f6cf8e'; ctx.beginPath(); ctx.ellipse(-2, 1.2, 7, 1.6, 0, 0, Math.PI * 2); ctx.fill();             // a shine on the bun
    ctx.fillStyle = '#c4472b'; U.roundRect(ctx, -11, -4.5, 22, 5, 2.5); ctx.fill();                          // the sausage on top of the bun
    ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.beginPath();                 // mustard zigzag
    for (let i = 0; i <= 8; i++) { const x = -9 + i * 2.25, y = i % 2 ? -1 : -3.6; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke(); ctx.lineJoin = 'miter';
  },
  drawFlyingDog(r, g) {
    const pose = this.dogPose(g); if (!pose) return;
    const ctx = r.ctx;
    ctx.save(); ctx.translate(pose.x, pose.y); ctx.rotate(pose.rot); ctx.scale(pose.s * pose.f, pose.s); this.drawHotdog(ctx); ctx.restore();
    if (pose.held) { const p = g.player, f = p.facing || 1; ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(p.x + f * 14, p.y - 16 + this.bodyBob(p), 3.5, 0, Math.PI * 2); ctx.fill(); }   // the chef's hand in front of the bun
    this.st.drawn++;
  },
  // the chef's head drawn again on top of his own: mouth wide open as the hot dog drops in, then a happy munching bob
  drawHappyHead(r, g) {
    const d = this.st.dog; if (!d || (d.phase !== 'drop' && d.phase !== 'yum')) return;
    const ctx = r.ctx, p = g.player; if (p.carry > 0) return;
    const f = p.facing || 1, T = CFG.HOTDOG.T, x = p.x;
    const nod = d.phase === 'yum' ? Math.abs(Math.sin((d.t / T.yum) * Math.PI * 3)) * 3.5 : 0;
    const hy = p.y - 38 + this.bodyBob(p) - nod;
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(43,29,20,0.45)';
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(x, hy, 10.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; U.roundRect(ctx, x - 9, hy - 16, 18, 10, 3); ctx.fill(); ctx.stroke();               // chef's hat
    ctx.beginPath(); ctx.arc(x - 5, hy - 18, 6, 0, Math.PI * 2); ctx.arc(x + 5, hy - 18, 6, 0, Math.PI * 2); ctx.fill();
    // the mouth: wide open, then munching
    const open = d.phase === 'drop' ? 1 : Math.max(0, Math.sin(d.t * 22)) * 0.5;
    ctx.fillStyle = '#7a2a1e'; ctx.beginPath(); ctx.ellipse(x + f * 2, hy + 6.5, 3.5 + open * 1.5, 1.2 + open * 2.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.ellipse(x + f * 1 - 3, hy + 5, 3, 1.4, 0, 0, Math.PI * 2); ctx.ellipse(x + f * 1 + 3, hy + 5, 3, 1.4, 0, 0, Math.PI * 2); ctx.fill();   // mustache
    // eyes: wide while it falls, happy ^ ^ while munching
    if (d.phase === 'drop') { ctx.beginPath(); ctx.arc(x + f * 3 - 3, hy - 1, 2, 0, Math.PI * 2); ctx.arc(x + f * 3 + 3, hy - 1, 2, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; for (const dx of [-3, 3]) { ctx.beginPath(); ctx.arc(x + f * 3 + dx, hy + 0.5, 2.2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); } }
    ctx.fillStyle = 'rgba(255,120,120,0.45)'; const cheek = d.phase === 'yum' ? 3 : 2.2;
    ctx.beginPath(); ctx.arc(x + f * 3 - 7, hy + 3, cheek, 0, Math.PI * 2); ctx.arc(x + f * 3 + 7, hy + 3, cheek, 0, Math.PI * 2); ctx.fill();
  },
  drawVendor(r, g) {
    const ctx = r.ctx, V = this.vendor(), p = g.player, st = this.st, t = g.time, x = V.x, y = V.y;
    const near = g.area === 'city' && this.visible(g) && U.dist(p.x, p.y, this.cart().x, this.cart().y) < CFG.HOTDOG.WAVE;
    const f = p.x < x ? -1 : 1, giving = st.dog && st.dog.phase === 'give';
    // waving hello is a happy little hop and a 👋 beside the head (no arm reaching up)
    const hop = near && !giving ? Math.abs(Math.sin(t * 7)) * 3 : 0;
    ctx.save(); ctx.translate(0, -hop);
    r.drawPerson(x, y, { shirt: '#fff', skin: '#c68642', hair: '#2b1d14', hairStyle: 0, facing: f, moving: false, bob: 0, carry: 0, apron: '#fff', pants: '#2d3a4a' });
    // stripes on the apron
    ctx.fillStyle = '#e53935'; for (let k = 0; k < 3; k++) ctx.fillRect(x - 7 + k * 5.5, y - 24, 2.5, 17);
    ctx.strokeStyle = '#e53935'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 7, y - 24); ctx.lineTo(x - 4, y - 30); ctx.moveTo(x + 7, y - 24); ctx.lineTo(x + 4, y - 30); ctx.stroke();   // apron straps
    // paper hat: a little white boat with a red band
    ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(43,29,20,0.45)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x - 12, y - 44); ctx.lineTo(x + 12, y - 44); ctx.lineTo(x + 7, y - 55); ctx.lineTo(x - 7, y - 55); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e53935'; ctx.fillRect(x - 11, y - 48, 22, 3);
    ctx.restore();
    if (near && !giving) {
      ctx.save(); ctx.translate(x - 22, y - 48 - hop); ctx.rotate(Math.sin(t * 10) * 0.3);
      ctx.font = r.font(15); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('👋', 0, 0); ctx.restore();
    }
  },
  drawCart(r, g) {
    const ctx = r.ctx, H = this.cart(), t = g.time, x = H.x, y = H.y;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 11, 25, 7, 0, 0, Math.PI * 2); ctx.fill();
    // umbrella pole behind the counter, then the cart
    ctx.fillStyle = '#5c6670'; ctx.fillRect(x + 15, y - 72, 3, 62);
    ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.arc(x - 14, y + 8, 5, 0, Math.PI * 2); ctx.arc(x + 14, y + 8, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(x - 14, y + 8, 2, 0, Math.PI * 2); ctx.arc(x + 14, y + 8, 2, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(43,29,20,0.45)';
    ctx.fillStyle = '#f5f5f5'; U.roundRect(ctx, x - 22, y - 12, 44, 22, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e53935'; ctx.fillRect(x - 22, y - 6, 44, 4);
    ctx.fillStyle = '#e53935'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('HOT DOGS', x, y + 4);
    // the steamer on top with three sausages in it
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, x - 19, y - 17, 28, 8, 2); ctx.fill();
    ctx.fillStyle = '#c4472b'; for (let k = 0; k < 3; k++) { U.roundRect(ctx, x - 17 + k * 8.5, y - 15, 7, 4, 2); ctx.fill(); }
    // steam
    for (let i = 0; i < 3; i++) { const age = ((t * 0.8 + i * 0.33) % 1); ctx.fillStyle = `rgba(255,255,255,${(0.55 * (1 - age)).toFixed(3)})`; ctx.beginPath(); ctx.arc(x - 12 + i * 8 + Math.sin(age * 6 + i) * 3, y - 20 - age * 26, 3 + age * 4, 0, Math.PI * 2); ctx.fill(); }
    // striped umbrella high above the vendor's paper hat
    const ux = x + 16.5, uy = y - 72;
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#e53935'; ctx.beginPath(); ctx.moveTo(ux, uy); ctx.arc(ux, uy, 28, Math.PI + i * Math.PI / 6, Math.PI + (i + 1) * Math.PI / 6); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(ux, uy, 28, Math.PI, Math.PI * 2); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(ux, uy - 28, 3, 0, Math.PI * 2); ctx.fill();
    // the price sign hanging off the pole
    const sx = x + 20, sy = y - 44;
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 18, sy); ctx.lineTo(sx + 4, sy); ctx.stroke();
    ctx.fillStyle = '#ffe08a'; ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; U.roundRect(ctx, sx, sy - 2, 34, 16, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🌭 $3', sx + 17, sy + 6.5);
  },

  // ---------- render hooks ----------
  entities(r, g, items) {
    const st = this.ready(g);
    if (g.area === 'city' && !(typeof CityExt !== 'undefined' && CityExt.floor)) {
      const H = this.cart();
      items.push({ y: H.y - 4, draw: () => this.drawVendor(r, g) });
      items.push({ y: H.y + 12, draw: () => this.drawCart(r, g) });
    }
    if (st.dog && this.visible(g)) items.push({ y: g.player.y + 0.5, draw: () => { this.drawHappyHead(r, g); this.drawFlyingDog(r, g); } });
  },
  overlay(r, g) {
    const st = this.st; if (!st) return;
    const ctx = r.ctx;
    // the vendor's speech bubble, over the umbrella and the trees
    if (st.say && g.area === 'city' && !(typeof CityExt !== 'undefined' && CityExt.floor)) { const V = this.vendor(); r.drawBubble(V.x - 48, V.y - 64 + Math.sin(g.time * 4) * 2, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText(st.say.text, 0, 0); }, 124); }
    for (const s of st.sparks) {
      if (s.area !== g.area) continue;
      const k = s.t / s.dur;
      ctx.strokeStyle = `rgba(255,214,10,${(1 - k).toFixed(3)})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 + k, r1 = 6 + k * 22, r2 = r1 + (i % 2 ? 5 : 9); ctx.beginPath(); ctx.moveTo(s.x + Math.cos(a) * r1, s.y + Math.sin(a) * r1); ctx.lineTo(s.x + Math.cos(a) * r2, s.y + Math.sin(a) * r2); ctx.stroke(); }
      ctx.fillStyle = `rgba(255,214,10,${(1 - k).toFixed(3)})`;
      for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4, rr = 10 + k * 30; ctx.beginPath(); ctx.arc(s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr - k * 6, 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.lineCap = 'butt';
    }
  },
};

Game.ext.unshift(HotdogExt);
Render.ext.push(HotdogExt);
