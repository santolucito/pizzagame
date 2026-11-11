'use strict';
// Home shopping in the City. The things for your bedroom upstairs (CFG.UPSTAIRS.items) and for the secret cabin
// (CFG.SECRET.HOME.items) are not ordered from catalogs any more: each one sits on its own little display stand in a
// City shop (a toy shop full of furniture and toys, the fish at the pet shop, the drums and the record player at
// the music shop, the telescopes and the bookshelf at the bookshop, the plant at the flower shop, the cookie jar and
// the pizza oven at the bakery). Each stand is a small plinth with the item on top, a price tag and a tiny picture
// of where it goes (a bed for the bedroom, a log cabin for the cabin). Stand next to it: one big button buys it.
// The item then simply appears at home (the ownership flags stay in g.s.upstairs.owned / g.s.cabin.owned, so old
// saves keep what they bought); the bedroom and the cabin draw and block their things exactly as before.
// The cabin's stands only show up once the secret cabin has been found (so the secret stays a secret).
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
//
// Interfaces used: UpstairsExt.drawShopItem(r, g, key, x, y, scale), SecretExt.drawShopItem(...) (the items' own art).

CFG.HOMESHOP = {
  // { area: the shop interior's map, spot: the plinth's centre on its floor, home: 'bedroom' | 'cabin', key }
  STANDS: [
    // the toy shop (CFG.TOYSHOP): a row under the toy-car shelf, one in the nook beside the puppet show, one at the
    // end of the aisle under the plush shelf, one beside the counter; the cabin's things (once the cabin is found)
    // in a row below the counter, two by the door and one beside the ball pit
    { area: 'toyshop', spot: { x: -912, y: 3112 }, home: 'bedroom', key: 'racecar' },
    { area: 'toyshop', spot: { x: -872, y: 3112 }, home: 'bedroom', key: 'slide' },
    { area: 'toyshop', spot: { x: -832, y: 3112 }, home: 'bedroom', key: 'horse' },
    { area: 'toyshop', spot: { x: -792, y: 3112 }, home: 'bedroom', key: 'chest' },
    { area: 'toyshop', spot: { x: -752, y: 3112 }, home: 'bedroom', key: 'stars' },
    { area: 'toyshop', spot: { x: -1091, y: 3068 }, home: 'bedroom', key: 'poster' },
    { area: 'toyshop', spot: { x: -1246, y: 3113 }, home: 'bedroom', key: 'lava' },
    { area: 'toyshop', spot: { x: -1122, y: 3162 }, home: 'bedroom', key: 'beanbag' },
    { area: 'toyshop', spot: { x: -1246, y: 3240 }, home: 'cabin', key: 'teddy' },
    { area: 'toyshop', spot: { x: -1202, y: 3240 }, home: 'cabin', key: 'rug' },
    { area: 'toyshop', spot: { x: -1158, y: 3240 }, home: 'cabin', key: 'curtains' },
    { area: 'toyshop', spot: { x: -1114, y: 3240 }, home: 'cabin', key: 'painting' },
    { area: 'toyshop', spot: { x: -1030, y: 3266 }, home: 'cabin', key: 'lamp' },
    { area: 'toyshop', spot: { x: -968, y: 3266 }, home: 'cabin', key: 'armchair' },
    { area: 'toyshop', spot: { x: -750, y: 3268 }, home: 'cabin', key: 'clock' },
    // the pet shop (CFG.PETSHOP): a row in front of the big fish tank
    { area: 'petshop', spot: { x: 2618, y: 3128 }, home: 'bedroom', key: 'fish' },
    { area: 'petshop', spot: { x: 2680, y: 3128 }, home: 'cabin', key: 'fish' },
    { area: 'petshop', spot: { x: 2742, y: 3128 }, home: 'cabin', key: 'dogbed' },
    // the music shop (CFG.MUSIC): side by side between the door and the counter
    { area: 'music', spot: { x: 7030, y: 3298 }, home: 'bedroom', key: 'drums' },
    { area: 'music', spot: { x: 7078, y: 3298 }, home: 'cabin', key: 'record' },
    // the bookshop (CFG.BOOKS): a row in the middle of the floor, below the ladder's track
    { area: 'books', spot: { x: 4372, y: 3192 }, home: 'cabin', key: 'books' },
    { area: 'books', spot: { x: 4430, y: 3192 }, home: 'bedroom', key: 'telescope' },
    { area: 'books', spot: { x: 4488, y: 3192 }, home: 'cabin', key: 'telescope' },
    // the flower shop (CFG.FLOWERS): left of the walk-on circles
    { area: 'flowers', spot: { x: 10560, y: 3196 }, home: 'cabin', key: 'plant' },
    // the bakery (CFG.BAKERY): in the shop, right of the treat circles
    { area: 'bakery', spot: { x: 29700, y: 5740 }, home: 'cabin', key: 'jar' },
    { area: 'bakery', spot: { x: 29780, y: 5740 }, home: 'cabin', key: 'oven' },
  ],
  PLINTH: { w: 30, h: 14 },     // the solid footprint (the item stands on top and is drawn above it)
  REACH: 38,                    // stand this close to the plinth's centre to get its button
  BOX: { w: 40, h: 38 },        // each item is scaled to fit this box, standing on its plinth
};

const HomeShopExt = {
  name: 'homeshop',
  st: null,

  // ---------- data ----------
  homeItems(home) { return home === 'bedroom' ? CFG.UPSTAIRS.items : CFG.SECRET.HOME.items; },
  item(s) { return this.homeItems(s.home).find((it) => it.key === s.key); },
  ownedMap(g, home) {
    if (home === 'bedroom') { if (!g.s.upstairs) g.s.upstairs = { seen: false, owned: {}, drawing: null }; if (!g.s.upstairs.owned) g.s.upstairs.owned = {}; return g.s.upstairs.owned; }
    if (!g.s.cabin) g.s.cabin = { owned: {}, seen: false };
    if (!g.s.cabin.owned) g.s.cabin.owned = {};
    return g.s.cabin.owned;
  },
  owns(g, s) { return !!this.ownedMap(g, s.home)[s.key]; },
  // the cabin's things only go on sale once the secret cabin has been found (or something for it was bought already)
  cabinKnown(g) { const c = g.s.cabin; return !!(c && (c.seen || (c.owned && Object.keys(c.owned).some((k) => c.owned[k])))); },
  shown(g, s) { return s.home === 'bedroom' || this.cabinKnown(g); },
  stands(g) { return CFG.HOMESHOP.STANDS.filter((s) => s.area === g.area && this.shown(g, s) && this.item(s)); },
  rect(s) { const P = CFG.HOMESHOP.PLINTH; return { x: s.spot.x - P.w / 2, y: s.spot.y - P.h / 2, w: P.w, h: P.h }; },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  nearest(g) {
    if (!this.onFoot(g)) return null;
    const p = g.player; let best = null, bd = CFG.HOMESHOP.REACH;
    for (const s of this.stands(g)) { const d = U.dist(p.x, p.y, s.spot.x, s.spot.y); if (d < bd) { bd = d; best = s; } }
    return best;
  },
  where(s) { return s.home === 'bedroom' ? 'bedroom' : 'cabin'; },

  // ---------- game hooks ----------
  build() { this.st = { confetti: [], nope: 0 }; },
  obstacles(g) {
    return this.stands(g).map((s) => this.rect(s));
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st;
    st.nope = Math.max(0, st.nope - dt);
    for (const c of st.confetti) { c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 260 * dt; c.rot += c.vr * dt; }
    st.confetti = st.confetti.filter((c) => c.t < c.dur);
  },
  action(g) {
    const s = this.nearest(g);
    if (!s) return null;
    const it = this.item(s);
    if (this.owns(g, s)) return { label: '✅ You have this one!', run: (gg) => this.already(gg, s) };
    if (g.s.cash >= it.price) return { label: `🛒 Buy ${it.label} (${U.money(it.price)})`, run: (gg) => this.buy(gg, s) };
    return { label: `💰 Need ${U.money(it.price - g.s.cash)} more`, run: (gg) => this.notYet(gg, s) };
  },
  // The hint lives in a tiny object at the FRONT of Game.ext (so it beats the shops' own room hints), but only
  // speaks while this stand's button is the one showing (every other button in the game still wins).
  frontHint(g) {
    const s = this.nearest(g);
    if (!s) return undefined;
    for (const e of g.ext) if (e.action) { const a = e.action(g); if (a) { if (e !== this) return undefined; break; } }
    const it = this.item(s);
    if (this.owns(g, s)) return { text: `${it.ico} Already in your ${this.where(s)}!`, target: null };
    if (g.s.cash >= it.price) return { text: `${it.ico} ${it.label} for your ${this.where(s)}! 🛒`, target: null };
    return { text: 'Earn more at the pizzeria 🍕', target: null };
  },
  buy(g, s) {
    const it = this.item(s);
    if (!it || this.owns(g, s) || g.s.cash < it.price) return;
    g.s.cash -= it.price;
    this.ownedMap(g, s.home)[s.key] = true;
    Sfx.buy(); Haptics.success();
    const x = s.spot.x, y = s.spot.y - 24;
    g.fx.push({ kind: 'sparkle', x0: x, y0: y, x1: x, y1: y, t: 0, dur: 0.8 });
    const cols = ['#e4572e', '#ffd166', '#3b7dd8', '#7cc45f', '#ff8fb1', '#b388ff'];
    for (let i = 0; i < 36; i++) { const a = -Math.PI / 2 + U.rand(-1.1, 1.1), sp = U.rand(80, 210); this.st.confetti.push({ x: x + U.rand(-8, 8), y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, col: cols[i % cols.length], t: 0, dur: U.rand(1.0, 1.6), rot: U.rand(0, 6.3), vr: U.rand(-9, 9) }); }
    g.floats.push({ x: g.player.x, y: g.player.y - 56, text: s.home === 'bedroom' ? "🛏️ It's in your bedroom!" : "🏡 It's in your cabin!", color: '#ffe08a', t: 0, dur: 2, big: true });
    g.save();
  },
  already(g, s) {
    g.floats.push({ x: g.player.x, y: g.player.y - 56, text: s.home === 'bedroom' ? '🛏️ In your bedroom!' : '🏡 In your cabin!', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    Sfx.ding();
  },
  notYet(g, s) {
    if (this.st.nope > 0) return;
    this.st.nope = 1.2;
    g.floats.push({ x: g.player.x, y: g.player.y - 56, text: 'Earn more at the pizzeria 🍕', color: '#ffe08a', t: 0, dur: 1.6, big: true });
    Sfx.error();
  },

  // ---------- drawing ----------
  entities(r, g, items) {
    const list = this.stands(g);
    if (!list.length) return;
    for (const s of list) items.push({ y: s.spot.y + CFG.HOMESHOP.PLINTH.h / 2, draw: () => this.drawStand(r, g, s) });
  },
  overlay(r, g) {
    if (!this.st || !this.st.confetti.length) return;
    const ctx = r.ctx;
    for (const c of this.st.confetti) {
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - c.t / c.dur); ctx.translate(c.x, c.y); ctx.rotate(c.rot);
      ctx.fillStyle = c.col; ctx.fillRect(-3, -1.5, 6, 3); ctx.restore();
    }
  },
  drawStand(r, g, s) {
    const ctx = r.ctx, P = CFG.HOMESHOP.PLINTH, x = s.spot.x, y = s.spot.y, it = this.item(s), own = this.owns(g, s);
    const near = this.nearest(g) === s;
    const w = P.w + 4, top = y - P.h / 2 - 4, front = y + P.h / 2 - 6;
    // the plinth: a shadow, the front face, the top it stands on (warm wood for the bedroom, logs for the cabin)
    const wood = s.home === 'bedroom' ? ['#d9a066', '#b5773a', '#8d5a2b'] : ['#b8834a', '#8d5a2b', '#5b3a1a'];
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.ellipse(x + 2, y + P.h / 2 + 2, w / 2 + 3, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = wood[1]; U.roundRect(ctx, x - w / 2, front, w, P.h / 2 + 8, 3); ctx.fill();
    ctx.fillStyle = wood[0]; U.roundRect(ctx, x - w / 2, top, w, front - top + 2, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - w / 2 + 3, top + 2, w - 6, 2);
    if (near) { ctx.strokeStyle = 'rgba(255,224,138,0.9)'; ctx.lineWidth = 2; U.roundRect(ctx, x - w / 2 - 2, top - 2, w + 4, front - top + P.h / 2 + 12, 5); ctx.stroke(); }
    // the item, standing on top (fitted into the same little box whatever its size), gently bobbing when you are near
    const fit = this.fit(r, g, s);
    if (fit) {
      const bob = near && !own ? Math.sin(g.time * 3) * 1.5 : 0;
      fit.art.drawShopItem(r, g, s.key, x - fit.dx, top + 3 - fit.bottom + bob, fit.k);
    }
    // the price tag on the front, with the little picture of where it goes
    const tag = own ? '✓' : U.money(it ? it.price : 0);
    ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = Math.max(18, ctx.measureText(tag).width + 8), ty = front + 5;
    ctx.fillStyle = own ? '#2f9e44' : '#fff8ee'; U.roundRect(ctx, x - tw / 2 - 5, ty - 5, tw, 10, 4); ctx.fill();
    ctx.fillStyle = own ? '#fff' : '#b8401c'; ctx.fillText(tag, x - 5, ty + 0.5);
    this.drawMarker(ctx, s.home, x + tw / 2 + 2, ty);
  },
  // How to show an item on a stand: draw it once onto a scratch canvas, find the box its pixels fill, and scale it so
  // that box fits CFG.HOMESHOP.BOX, standing on the plinth. Cached per item (the art never changes size).
  fits: {},
  art(s) { return s.home === 'bedroom' ? (typeof UpstairsExt !== 'undefined' ? UpstairsExt : null) : (typeof SecretExt !== 'undefined' ? SecretExt : null); },
  fit(r, g, s) {
    const id = s.home + ':' + s.key;
    if (this.fits[id] !== undefined) return this.fits[id];
    const art = this.art(s), it = this.item(s);
    if (!art || !art.drawShopItem || !it || typeof document === 'undefined') return null;
    const N = 256, k0 = 0.3 * it.view.s, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
    const c2 = cv.getContext('2d'), real = r.ctx;
    let box = null;
    try {
      r.ctx = c2; art.drawShopItem(r, g, s.key, N / 2, N / 2, k0);
      const d = c2.getImageData(0, 0, N, N).data;
      let x0 = N, y0 = N, x1 = -1, y1 = -1;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (d[(y * N + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 >= 0) box = { x0: x0 - N / 2, x1: x1 + 1 - N / 2, y0: y0 - N / 2, y1: y1 + 1 - N / 2 };
    } catch (e) { box = null; } finally { r.ctx = real; }
    if (!box) return (this.fits[id] = null);
    const B = CFG.HOMESHOP.BOX, f = Math.min(B.w / (box.x1 - box.x0), B.h / (box.y1 - box.y0), 1.6 / k0);
    // drawShopItem(x, y, k) puts the item's centre at (x, y): the measured box scales by f around it
    return (this.fits[id] = { art, k: k0 * f, dx: (box.x0 + box.x1) / 2 * f, bottom: box.y1 * f });
  },
  // a tiny bed (the bedroom) or a tiny log cabin (the cabin) in a round badge
  drawMarker(ctx, home, x, y) {
    ctx.fillStyle = home === 'bedroom' ? '#3b7dd8' : '#3f9a4a'; ctx.beginPath(); ctx.arc(x, y, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff8ee'; ctx.lineWidth = 1.2; ctx.stroke();
    if (home === 'bedroom') {
      ctx.fillStyle = '#fff8ee'; ctx.fillRect(x - 4, y - 3, 1.5, 6); ctx.fillRect(x - 4, y + 0.5, 8, 2);   // headboard and frame
      ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 2.5, y - 1.5, 6.5, 2);                                   // the duvet
      ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(x - 1.5, y - 2, 1.2, 0, Math.PI * 2); ctx.fill(); // the pillow
    } else {
      ctx.fillStyle = '#c17f3a'; ctx.fillRect(x - 3.5, y - 1, 7, 4.5);                                    // log walls
      ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.moveTo(x - 5, y - 0.5); ctx.lineTo(x, y - 5); ctx.lineTo(x + 5, y - 0.5); ctx.closePath(); ctx.fill();   // roof
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x - 1, y + 0.5, 2, 3); ctx.fillStyle = '#fff8ee'; ctx.fillRect(x + 2, y - 5, 1.5, 3);   // door, chimney
    }
  },
};

Game.ext.push(HomeShopExt);
Game.ext.unshift({ name: 'homeshop-hint', hint: (g) => HomeShopExt.frontHint(g) });
Render.ext.push(HomeShopExt);
