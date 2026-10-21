'use strict';
// The post office: City building 15 (lower row, facing Harbour Street) is the grey 'POST' building. Step inside for a
// tiled hall with a counter and a postal clerk stamping letters, a wall of little brass PO boxes (one of them is yours:
// open it with the button and there is often a letter or a parcel with a picture inside; it refills every minute), a
// conveyor belt carrying parcels along, a big red mailbox you can post a $2 postcard into, a $1 stamp machine whose
// pretty stamps go into the album on the wall, a weighing scale to stand on, a mail trolley and a sleepy cat in a tray.
// Extension module: registered with Game.ext (first, so its door beats the City's taxis) and Render.ext (see js/EXTENSIONS.md).
CFG.POST = {
  BUILDING: 15,                                  // index in CFG.CITY.BUILDINGS: { x0: 4762, y0: 640, x1: 4890, y1: 876 }
  DOOR_OUT: { x: 4826, y: 890 },                 // on the sidewalk just below the door
  WORLD: { x0: 12200, y0: 3000, x1: 12800, y1: 3400 },
  ROOM: { x0: 12240, y0: 3100, x1: 12760, y1: 3340 }, WALL: 24, BACK_TOP: 3016,   // the tall back wall carries the PO boxes and the album
  BOXES: { x0: 12252, y0: 3028, x1: 12404, y1: 3094, cols: 6, rows: 3 },          // the wall of little brass doors
  MINE: { c: 3, r: 1 },                          // which little door is yours
  BOX_SPOT: { x: 12330, y: 3118 },               // stand here to open it
  COUNTER: { x0: 12430, y0: 3100, x1: 12600, y1: 3132 },
  CLERK: { x: 12490, y: 3112 },
  TRAY: { x: 12574, y: 3104 },                   // the in-tray on the counter's right end (the cat sleeps in it)
  ALBUM: { x: 12640, y: 3056 },                  // the stamp album on the wall
  BELT: { x0: 12614, y0: 3104, x1: 12750, y1: 3132 },   // the parcel conveyor along the back-right
  VENDING: { x0: 12240, y0: 3150, x1: 12278, y1: 3206 },   // the stamp machine against the left wall
  MAILBOX: { x: 12330, y: 3268 },                // the big red pillar box
  SCALE: { x: 12440, y: 3282 },                  // the weighing scale on the floor (walk-through)
  TROLLEY: { x: 12700, y: 3276 },
  PADS: { stamp: { x: 12308, y: 3178 }, card: { x: 12516, y: 3190 } },
  PLANTS: [{ x: 12742, y: 3312 }, { x: 12258, y: 3312 }],
  EXIT: { x: 12500, y: 3322 },                   // the mat inside the door (the door is in the bottom wall)
  REFILL: 60,                                    // seconds until your PO box has something in it again
  STAMPS: ['🌸', '🦋', '🐬', '🚂', '🌈', '🦜', '🌻', '🐳', '🚀', '🍕', '🦚', '🏰'],
  MAIL: ['🐶', '🎂', '🌞', '🐸', '🎈', '⛵', '🐱', '🎁', '🍦', '🦄'],
};
CFG.AREAS.post = { WORLD: CFG.POST.WORLD };

const PostExt = {
  name: 'post',
  st: null,
  defaults: { post: { seen: false, stamps: 0, sent: 0, mail: 0 } },

  // ---------- state ----------
  build(g) {
    const P = CFG.POST;
    if (!g.s.post) g.s.post = { seen: false, stamps: 0, sent: 0, mail: 0 };
    this.st = {
      fade: 0,
      box: { mail: this.newMail(0), timer: P.REFILL, open: 0, n: 1 },   // n counts refills: three in four bring something
      card: false, fly: null,                                              // the postcard in hand, and its flight into the mailbox
      pics: [],                                                            // pictures floating up (letters, parcels, stamps)
      weigh: false, weighed: false, needle: 0,
      clerk: { stamp: 0, cd: 2.5 },
      zz: [], zzT: 0,
      obs: null,
    };
    const R = P.ROOM, w = P.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: P.COUNTER.x0, y: R.y0, w: P.COUNTER.x1 - P.COUNTER.x0, h: P.COUNTER.y1 - R.y0 });
    o.push({ x: P.BELT.x0, y: R.y0, w: P.BELT.x1 - P.BELT.x0, h: P.BELT.y1 - R.y0 + 2 });
    o.push({ x: P.VENDING.x0, y: P.VENDING.y0, w: P.VENDING.x1 - P.VENDING.x0, h: P.VENDING.y1 - P.VENDING.y0 });
    o.push({ x: P.MAILBOX.x - 14, y: P.MAILBOX.y - 12, w: 28, h: 26 });
    o.push({ x: P.TROLLEY.x - 26, y: P.TROLLEY.y - 14, w: 52, h: 28 });
    for (const p of P.PLANTS) o.push({ x: p.x - 14, y: p.y - 14, w: 28, h: 26 });
    this.st.obs = o;
  },
  newMail(n) {
    const P = CFG.POST;
    return { kind: n % 2 ? 'parcel' : 'letter', pic: P.MAIL[(n * 7 + Math.floor(Math.random() * 3)) % P.MAIL.length] };
  },
  obstacles(g) { return g.area === 'post' && this.st ? this.st.obs : []; },
  free(x, y) {
    const R = CFG.POST.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  cityBusy() { return typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))); },
  atDoor(g) { const D = CFG.POST.DOOR_OUT, p = g.player; return g.area === 'city' && this.onFoot(g) && !this.cityBusy() && U.dist(p.x, p.y, D.x, D.y) < 30; },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    const p = g.player, P = CFG.POST, st = this.st;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'post') return null;
    if (U.dist(p.x, p.y, P.EXIT.x, P.EXIT.y) < 30) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (st.card && U.dist(p.x, p.y, P.MAILBOX.x, P.MAILBOX.y) < 44) return { label: '📮 Post it!', run: (gg) => this.post(gg) };
    if (U.dist(p.x, p.y, P.BOX_SPOT.x, P.BOX_SPOT.y) < 30) return { label: '📬 Open your box', run: (gg) => this.openBox(gg) };
    return null;
  },
  enter(g) {
    const P = CFG.POST, p = g.player;
    g.area = 'post'; p.x = P.EXIT.x; p.y = P.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.ding(); Haptics.tap();
    if (!g.s.post.seen) { g.s.post.seen = true; g.toast('📮 Welcome to the post office!', true); }
  },
  leave(g) {
    const P = CFG.POST, p = g.player;
    g.area = 'city'; p.x = P.DOOR_OUT.x; p.y = P.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; this.st.weigh = false; Sfx.drop();
  },
  openBox(g) {
    const st = this.st, b = st.box, p = g.player, P = CFG.POST, cell = this.mineCell();
    b.open = 1.1;
    if (b.mail) {
      const m = b.mail; b.mail = null; b.timer = P.REFILL; g.s.post.mail++;
      st.pics.push({ kind: m.kind, pic: m.pic, x: cell.x, y: cell.y, t: 0, dur: 2.2 });
      g.floats.push({ x: p.x, y: p.y - 64, text: "You've got mail! 💌", color: '#ffe08a', t: 0, dur: 1.8, big: true });
      for (let i = 0; i < 3; i++) g.fx.push({ kind: 'sparkle', x0: cell.x + U.rand(-8, 8), y0: cell.y + U.rand(-6, 6), x1: 0, y1: 0, t: -i * 0.1, dur: 0.5 });
      Sfx.ding(); Haptics.success();
    } else {
      g.floats.push({ x: p.x, y: p.y - 64, text: 'Nothing yet… 📭', color: '#fff', t: 0, dur: 1.4, big: true });
      Sfx.drop(); Haptics.tap();
    }
  },
  post(g) {
    const st = this.st, p = g.player, P = CFG.POST;
    if (!st.card) return;
    st.card = false; g.s.post.sent++;
    st.fly = { t: 0, x0: p.x + (p.facing || 1) * 16, y0: p.y - 22 };
    g.floats.push({ x: P.MAILBOX.x, y: P.MAILBOX.y - 60, text: 'Sent! ✈️', color: '#ffe08a', t: 0, dur: 1.8, big: true });
    for (let i = 0; i < 4; i++) g.fx.push({ kind: 'sparkle', x0: P.MAILBOX.x + U.rand(-6, 6), y0: P.MAILBOX.y - 24 + U.rand(-4, 4), x1: 0, y1: 0, t: -0.35 - i * 0.08, dur: 0.5 });
    Sfx.pickup(); Haptics.success();
  },
  home(g) { if (!this.st) return; const st = this.st; st.fade = 0; st.card = false; st.fly = null; st.weigh = false; st.pics = []; st.box.open = 0; },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, P = CFG.POST;
    if (this.free(p.x, p.y)) return false;
    p.x = P.EXIT.x; p.y = P.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, P = CFG.POST, b = st.box;
    st.fade = Math.max(0, st.fade - dt);
    // your PO box fills up again after a minute (three refills in four bring something)
    if (!b.mail) { b.timer -= dt; if (b.timer <= 0) { b.timer = P.REFILL; if (b.n % 4 !== 3) b.mail = this.newMail(b.n); b.n++; } }
    if (g.area !== 'post') { st.fly = null; st.pics = []; return; }
    this.rescue(g);
    b.open = Math.max(0, b.open - dt);
    if (st.fly) { st.fly.t += dt; if (st.fly.t > 0.55) st.fly = null; }
    for (const q of st.pics) q.t += dt;
    st.pics = st.pics.filter((q) => q.t < q.dur);
    // the scale: step on it and it tells you what you weigh
    const ds = U.dist(p.x, p.y, P.SCALE.x, P.SCALE.y);
    if (ds < 16 && !st.weigh) {
      st.weigh = true; st.weighed = true; st.needle = 1.4;
      g.floats.push({ x: p.x, y: p.y - 64, text: 'You weigh one chef! ⚖️', color: '#ffe08a', t: 0, dur: 1.8, big: true });
      Sfx.ding(); Haptics.tap();
    } else if (ds > 26) st.weigh = false;
    st.needle = Math.max(0, st.needle - dt);
    // the clerk stamps a letter every few seconds
    const c = st.clerk;
    if (c.stamp > 0) c.stamp = Math.max(0, c.stamp - dt); else { c.cd -= dt; if (c.cd <= 0) { c.cd = 2.2 + Math.random() * 1.5; c.stamp = 0.5; } }
    // the cat snores little z's
    for (const z of st.zz) z.t += dt;
    st.zz = st.zz.filter((z) => z.t < 2);
    st.zzT -= dt; if (st.zzT <= 0) { st.zzT = 1.4; st.zz.push({ x: P.TRAY.x + 10, y: P.TRAY.y - 10, t: 0 }); }
  },
  pads(g) {
    if (g.area !== 'post') return [];
    const P = CFG.POST.PADS;
    return [
      { key: 'postStamp', label: 'Stamp', ico: '💮', pos: P.stamp, price: 1, sub: 'pretty!' },
      { key: 'postCard', label: 'Postcard', ico: '💌', pos: P.card, price: 2, maxed: !!(this.st && this.st.card), sub: 'to a friend' },
    ];
  },
  onPad(g, pad) {
    const st = this.st, p = g.player, P = CFG.POST;
    if (pad.key === 'postStamp') {
      g.s.post.stamps++;
      const pic = U.pick(P.STAMPS);
      st.pics.push({ kind: 'stamp', pic, x: pad.pos.x, y: pad.pos.y - 30, t: 0, dur: 2 });
      g.floats.push({ x: p.x, y: p.y - 64, text: 'A pretty stamp! 💮', color: '#ffe08a', t: 0, dur: 1.6, big: true });
      Haptics.success();
    } else if (pad.key === 'postCard') {
      st.card = true;
      g.floats.push({ x: p.x, y: p.y - 64, text: 'A postcard! 💌', color: '#ffe08a', t: 0, dur: 1.6, big: true });
      Haptics.success();
    }
  },
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, P = CFG.POST, st = this.st, s = g.s.post;
    if (g.area === 'city') {
      if (!this.onFoot(g) || this.cityBusy()) return undefined;
      const d = U.dist(p.x, p.y, P.DOOR_OUT.x, P.DOOR_OUT.y);
      if (d < 70) return { text: 'Visit the post office! 📮', target: d < 30 ? null : P.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'post') return undefined;
    if (st.card) return { text: 'Pop it in the red mailbox! 📮', target: P.MAILBOX };
    if (st.box.mail) return { text: 'Open your PO box! 📬', target: P.BOX_SPOT };
    const paid = (k) => g.s.padPaid[k] || 0;
    if (!s.stamps && g.s.cash + paid('postStamp') >= 1) return { text: 'Buy a pretty stamp! 💮', target: P.PADS.stamp };
    if (!s.sent && g.s.cash + paid('postCard') >= 2) return { text: 'Buy a postcard! 💌', target: P.PADS.card };
    if (!st.weighed) return { text: 'Stand on the scale! ⚖️', target: P.SCALE };
    return { text: 'Shh, the mail cat is napping 🐱', target: null };
  },

  // ---------- the City outside: a pillar box and letter decals by the door ----------
  bld() { return CFG.CITY.BUILDINGS[CFG.POST.BUILDING]; },
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, D = CFG.POST.DOOR_OUT;
    // envelope decals in the shop windows
    ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14';
    ctx.fillText('✉️', b.x0 + 30, gy + 20); ctx.fillText('📦', b.x1 - 30, gy + 20);
    // a little red pillar box on the sidewalk, left of the door
    const mx = cx - 42, my = D.y - 2;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(mx + 2, my + 4, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, mx - 6, my - 20, 12, 22, 3); ctx.fill();
    ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(mx, my - 20, 6, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(mx - 4, my - 13, 8, 2);
    // a blue welcome mat with airmail stripes at the door
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(D.x - 15, D.y - 6, 30, 10);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#fff8ee' : '#e4572e'; ctx.fillRect(D.x - 15 + i * 7.5, D.y - 6, 7.5, 2.5); ctx.fillRect(D.x - 15 + i * 7.5, D.y + 1.5, 7.5, 2.5); }
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(D.x - 15, D.y - 6, 30, 10);
  },

  // ---------- the interior, static ----------
  paint: { post(r, g) { PostExt.paintRoom(r, g); } },
  mineCell() {
    const B = CFG.POST.BOXES, cw = (B.x1 - B.x0) / B.cols, ch = (B.y1 - B.y0) / B.rows, M = CFG.POST.MINE;
    return { x: B.x0 + (M.c + 0.5) * cw, y: B.y0 + (M.r + 0.5) * ch, w: cw, h: ch };
  },
  drawBoxDoor(ctx, x, y, w, h, mine, open) {
    // one little brass door: a plate, a keyhole, a number slot; the open one swings to the left and shows the inside
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(x, y, w, h);
    if (open > 0) { ctx.fillStyle = '#2b1d14'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2); }
    const k = open > 0 ? Math.max(0.12, 1 - open) : 1;   // how wide the door looks (it swings open to the side)
    ctx.fillStyle = mine ? '#e0b44c' : '#c89b4a'; U.roundRect(ctx, x + 1.5, y + 1.5, (w - 3) * k, h - 3, 2); ctx.fill();
    if (k > 0.5) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 3, y + 3, (w - 6) * k, 2);
      ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x + w * 0.5 * k + 1, y + h * 0.62, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = mine ? '#e4572e' : 'rgba(43,29,20,0.5)'; ctx.fillRect(x + 4, y + 5, (w - 8) * k, 3);
    }
  },
  paintRoom(r, g) {
    const ctx = r.ctx, P = CFG.POST, W = P.WORLD, R = P.ROOM, w = P.WALL;
    // outside the hall: dark slate with a faint tile pattern
    ctx.fillStyle = '#3a4a5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, P.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - P.BACK_TOP);
    // floor: big pale tiles with a blue diamond pattern
    const ts = 30;
    for (let y = R.y0, j = 0; y < R.y1; y += ts, j++) for (let x = R.x0, i = 0; x < R.x1; x += ts, i++) {
      ctx.fillStyle = (i + j) % 2 ? '#dfe6ee' : '#eef2f6'; ctx.fillRect(x, y, Math.min(ts, R.x1 - x), Math.min(ts, R.y1 - y));
      if ((i + j) % 2 && x + ts <= R.x1 && y + ts <= R.y1) { ctx.fillStyle = '#b9cde0'; ctx.beginPath(); ctx.moveTo(x + ts / 2, y + 8); ctx.lineTo(x + ts - 8, y + ts / 2); ctx.lineTo(x + ts / 2, y + ts - 8); ctx.lineTo(x + 8, y + ts / 2); ctx.closePath(); ctx.fill(); }
    }
    // walls: a tall cream back wall with an airmail-striped cornice; slate side and bottom walls
    ctx.fillStyle = '#fff4d6'; ctx.fillRect(R.x0 - w, P.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - P.BACK_TOP);
    ctx.fillStyle = 'rgba(0,0,0,0.04)'; for (let y = P.BACK_TOP + 20; y < R.y0; y += 20) ctx.fillRect(R.x0 - w, y, R.x1 - R.x0 + 2 * w, 1);
    for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#3b7dd8' : '#e4572e'; ctx.fillRect(R.x0 - w + i * ((R.x1 - R.x0 + 2 * w) / 12), P.BACK_TOP, (R.x1 - R.x0 + 2 * w) / 12 + 0.5, 6); }
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(R.x0 - w, R.y0 - 6, R.x1 - R.x0 + 2 * w, 6);   // skirting along the back wall
    ctx.fillStyle = '#6b7a8c'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = R.x0 - w; x < R.x1 + w; x += 16) ctx.fillRect(x, R.y1, 2, w); for (let y = R.y0; y < R.y1; y += 16) { ctx.fillRect(R.x0 - w, y, w, 2); ctx.fillRect(R.x1, y, w, 2); }
    ctx.fillStyle = '#4e5b6b'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - w, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1 + w - 3, R.y0, 3, R.y1 - R.y0);
    // the wall of PO boxes: a dark frame with rows of brass doors (yours is drawn live too)
    const B = P.BOXES, cw = (B.x1 - B.x0) / B.cols, ch = (B.y1 - B.y0) / B.rows;
    ctx.fillStyle = '#3e2a16'; U.roundRect(ctx, B.x0 - 5, B.y0 - 5, B.x1 - B.x0 + 10, B.y1 - B.y0 + 10, 4); ctx.fill();
    for (let rI = 0; rI < B.rows; rI++) for (let c = 0; c < B.cols; c++) this.drawBoxDoor(ctx, B.x0 + c * cw, B.y0 + rI * ch, cw, ch, c === P.MINE.c && rI === P.MINE.r, 0);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (B.x0 + B.x1) / 2 - 30, B.y0 - 18, 60, 12, 3); ctx.fill();
    ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffe08a'; ctx.fillText('PO BOXES', (B.x0 + B.x1) / 2, B.y0 - 12);
    // a round clock and a POST OFFICE sign over the counter
    const C = P.COUNTER, ccx = (C.x0 + C.x1) / 2;
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, ccx - 54, P.BACK_TOP + 12, 108, 16, 4); ctx.fill();
    ctx.font = r.font(9); ctx.fillStyle = '#fff8ee'; ctx.fillText('✉ POST OFFICE ✉', ccx, P.BACK_TOP + 20);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(ccx, P.BACK_TOP + 54, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(ccx, P.BACK_TOP + 54, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ccx, P.BACK_TOP + 54); ctx.lineTo(ccx, P.BACK_TOP + 46); ctx.moveTo(ccx, P.BACK_TOP + 54); ctx.lineTo(ccx + 6, P.BACK_TOP + 57); ctx.stroke();
    // a pigeonhole shelf of letters right of the clock
    for (let k = 0; k < 2; k++) for (let i = 0; i < 4; i++) {
      const x = ccx + 24 + i * 16, y = P.BACK_TOP + 40 + k * 20;
      ctx.fillStyle = '#8d5a2b'; ctx.fillRect(x, y, 15, 18); ctx.fillStyle = ['#fff8ee', '#ffe08a', '#bfe3ff', '#ffd1dc'][(i + k) % 4]; ctx.fillRect(x + 2, y + 2 + ((i + k) % 3) * 2, 11, 14 - ((i + k) % 3) * 2);
    }
    // the stamp album on the wall (the count badge is live)
    const A = P.ALBUM;
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, A.x - 22, A.y - 18, 44, 36, 3); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(A.x - 19, A.y - 15, 38, 30);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#ff8fab', '#41b883', '#3b7dd8', '#ffd166', '#8e5bd1', '#4dd0e1'][i]; ctx.fillRect(A.x - 16 + (i % 3) * 12, A.y - 12 + Math.floor(i / 3) * 13, 9, 10); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.setLineDash([1.5, 1.5]); ctx.lineWidth = 1; ctx.strokeRect(A.x - 16 + (i % 3) * 12, A.y - 12 + Math.floor(i / 3) * 13, 9, 10); ctx.setLineDash([]); }
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.fillText('STAMPS', A.x, A.y + 14);
    // the conveyor belt: a grey frame with rollers, hoods at both ends (the parcels move live)
    const Bt = P.BELT;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(Bt.x0 + 3, Bt.y0 + 4, Bt.x1 - Bt.x0, Bt.y1 - Bt.y0);
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, Bt.x0 - 2, Bt.y0 - 2, Bt.x1 - Bt.x0 + 4, Bt.y1 - Bt.y0 + 4, 5); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(Bt.x0, Bt.y0, Bt.x1 - Bt.x0, Bt.y1 - Bt.y0);
    ctx.fillStyle = '#9aa0a8'; for (let x = Bt.x0 + 4; x < Bt.x1 - 4; x += 14) ctx.fillRect(x, Bt.y1 + 2, 3, 6);   // legs
    // the stamp vending machine against the left wall
    const V = P.VENDING;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(V.x0 + 3, V.y0 + 4, V.x1 - V.x0, V.y1 - V.y0);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, V.x0, V.y0, V.x1 - V.x0, V.y1 - V.y0, 4); ctx.fill();
    ctx.fillStyle = '#2d5a8a'; ctx.fillRect(V.x0, V.y0, V.x1 - V.x0, 6);
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(V.x0 + 5, V.y0 + 10, V.x1 - V.x0 - 10, 22);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#ff8fab', '#ffd166', '#41b883', '#8e5bd1'][i]; ctx.fillRect(V.x0 + 7 + (i % 2) * 13, V.y0 + 12 + Math.floor(i / 2) * 10, 11, 8); }
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(V.x0 + 8, V.y0 + 38, V.x1 - V.x0 - 16, 4);   // the slot
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(V.x1 - 9, V.y0 + 48, 3, 0, Math.PI * 2); ctx.fill();   // the knob
    ctx.fillStyle = '#fff8ee'; ctx.font = r.font(6); ctx.fillText('STAMPS', (V.x0 + V.x1) / 2, V.y0 + 46);
    // the big red pillar box (the slot sparkles live when a card goes in)
    const M = P.MAILBOX;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(M.x + 3, M.y + 14, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, M.x - 15, M.y + 6, 30, 8, 2); ctx.fill();   // the base
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, M.x - 13, M.y - 36, 26, 44, 5); ctx.fill();
    ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(M.x, M.y - 36, 13, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#a81d1d'; ctx.fillRect(M.x - 13, M.y - 14, 26, 3);
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(M.x - 8, M.y - 26, 16, 3);   // the slot
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('✉', M.x, M.y - 4);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(M.x - 11, M.y - 34, 4, 38);
    // the mail trolley: a canvas bag on wheels, stuffed with letters
    const T = P.TROLLEY;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(T.x + 3, T.y + 16, 28, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; for (const dx of [-18, 18]) { ctx.beginPath(); ctx.arc(T.x + dx, T.y + 12, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(T.x - 24, T.y + 6, 48, 4);
    ctx.fillStyle = '#d7c7a8'; U.roundRect(ctx, T.x - 24, T.y - 18, 48, 26, 5); ctx.fill();
    ctx.fillStyle = '#b8a888'; ctx.fillRect(T.x - 24, T.y - 18, 48, 4);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = ['#fff8ee', '#bfe3ff', '#ffe08a', '#fff8ee', '#ffd1dc'][i]; ctx.save(); ctx.translate(T.x - 16 + i * 8, T.y - 20); ctx.rotate((i - 2) * 0.25); ctx.fillRect(-5, -7, 10, 8); ctx.restore(); }
    ctx.fillStyle = '#5c6670'; ctx.fillRect(T.x + 22, T.y - 30, 3, 36); ctx.fillRect(T.x + 14, T.y - 30, 11, 3);   // the push handle
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.fillText('MAIL', T.x, T.y - 4);
    // potted plants in the corners
    for (const Pl of P.PLANTS) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(Pl.x + 2, Pl.y + 12, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b86f2d'; U.roundRect(ctx, Pl.x - 11, Pl.y - 4, 22, 16, 4); ctx.fill(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(Pl.x - 12, Pl.y - 6, 24, 4);
      ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(Pl.x, Pl.y - 14, 12, 0, Math.PI * 2); ctx.arc(Pl.x - 10, Pl.y - 8, 8, 0, Math.PI * 2); ctx.arc(Pl.x + 10, Pl.y - 8, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(Pl.x - 3, Pl.y - 18, 5, 0, Math.PI * 2); ctx.fill();
    }
    // a "stand here" mat under your PO box
    const S = P.BOX_SPOT;
    ctx.fillStyle = 'rgba(59,125,216,0.25)'; ctx.beginPath(); ctx.ellipse(S.x, S.y + 4, 20, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(59,125,216,0.6)'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(S.x, S.y + 4, 20, 9, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    // the door in the bottom wall, its mat, and the name plate below
    const E = P.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, R.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 16, R.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 14, R.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b7dd8'; ctx.fillRect(E.x - 21, E.y - 8, 42, 14);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff8ee' : '#e4572e'; ctx.fillRect(E.x - 21 + i * 7, E.y - 8, 7, 3); ctx.fillRect(E.x - 21 + i * 7, E.y + 3, 7, 3); }
    ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(E.x - 21, E.y - 8, 42, 14);
    ctx.fillStyle = '#fff8ee'; ctx.font = r.font(7); ctx.fillText('EXIT', E.x, E.y - 1);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 56, R.y1 + w + 4, 112, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('📮 POST OFFICE 📮', (R.x0 + R.x1) / 2, R.y1 + w + 11);
  },

  // ---------- moving things ----------
  // outside the hall's little map the screen would show the dark backdrop: paint the pavement around it
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.POST.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#3a4a5c';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, y1 - W.y0);
  },
  // where the parcels are on the belt right now (also used by the test)
  beltBoxes(g) {
    const Bt = CFG.POST.BELT, len = Bt.x1 - Bt.x0, gap = 46, n = Math.ceil(len / gap) + 1, out = [];
    for (let i = 0; i < n; i++) { const x = Bt.x0 + ((g.time * 28 + i * gap) % (len + gap)) - gap / 2; if (x > Bt.x0 - 14 && x < Bt.x1 + 14) out.push({ x, i }); }
    return out;
  },
  drawBelt(r, g) {
    const ctx = r.ctx, Bt = CFG.POST.BELT, t = g.time;
    ctx.save(); ctx.beginPath(); ctx.rect(Bt.x0, Bt.y0, Bt.x1 - Bt.x0, Bt.y1 - Bt.y0); ctx.clip();
    // the belt's ribs slide along
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; const off = (t * 28) % 12; for (let x = Bt.x0 - 12 + off; x < Bt.x1; x += 12) ctx.fillRect(x, Bt.y0 + 2, 3, Bt.y1 - Bt.y0 - 4);
    const cols = ['#c89b4a', '#b8862c', '#d4a24c'];
    for (const b of this.beltBoxes(g)) {
      const bw = 22 + (b.i % 2) * 6, bh = 16 + (b.i % 3) * 2, x = b.x - bw / 2, y = Bt.y0 + 4;
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + 2, y + 3, bw, bh);
      ctx.fillStyle = cols[b.i % 3]; ctx.fillRect(x, y, bw, bh);
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(x, y, bw, 3);
      ctx.fillStyle = '#fff8ee'; ctx.fillRect(x + bw / 2 - 1.5, y, 3, bh); ctx.fillRect(x, y + bh / 2 - 1.5, bw, 3);   // string
      if (b.i % 2) { ctx.fillStyle = '#ffe08a'; ctx.fillRect(x + 3, y + 3, 6, 4); }   // a label
    }
    ctx.restore();
    // hoods over both ends
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, Bt.x0 - 4, Bt.y0 - 12, 14, Bt.y1 - Bt.y0 + 14, 3); ctx.fill(); U.roundRect(ctx, Bt.x1 - 10, Bt.y0 - 12, 14, Bt.y1 - Bt.y0 + 14, 3); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(Bt.x0 - 1, Bt.y0, 8, Bt.y1 - Bt.y0); ctx.fillRect(Bt.x1 - 7, Bt.y0, 8, Bt.y1 - Bt.y0);
  },
  drawScale(r, g) {
    const ctx = r.ctx, S = CFG.POST.SCALE, st = this.st, on = st.weigh, wob = st.needle > 0 ? Math.sin(st.needle * 14) * st.needle * 0.5 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(S.x + 2, S.y + 4, 22, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(S.x, S.y + 2, 22, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = on ? '#c9ccd2' : '#e0e3e8'; ctx.beginPath(); ctx.ellipse(S.x, S.y, 19, 9, 0, 0, Math.PI * 2); ctx.fill();
    // the dial at the top edge
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(S.x, S.y - 12, 8, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 1.5; ctx.stroke();
    const a = -Math.PI / 2 + (on ? 1.3 : 0) + wob;
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(S.x, S.y - 12); ctx.lineTo(S.x + Math.cos(a) * 6, S.y - 12 + Math.sin(a) * 6); ctx.stroke();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(S.x, S.y - 12, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#5c6670'; ctx.fillText('⚖️', S.x, S.y + 2);
  },
  dynamic(r, g) {
    if (!this.st || g.area !== 'post') return;
    const ctx = r.ctx, st = this.st, P = CFG.POST, t = g.time;
    this.drawOutside(r, g);
    // your PO box: a red flag up when something is inside, the door swinging open when you look
    const cell = this.mineCell(), b = st.box;
    this.drawBoxDoor(ctx, cell.x - cell.w / 2, cell.y - cell.h / 2, cell.w, cell.h, true, b.open > 0 ? Math.min(1, b.open / 0.3) : 0);
    if (b.open > 0 && b.mail) { ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.mail.kind === 'parcel' ? '📦' : '✉️', cell.x + 2, cell.y); }
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', cell.x - cell.w / 2 + 5, cell.y - cell.h / 2 + 5);
    if (b.mail) { const fx = cell.x + cell.w / 2 + 4, bob = Math.sin(t * 4) * 1.5; ctx.fillStyle = '#9aa0a8'; ctx.fillRect(fx - 1, cell.y - 12, 2, 20); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(fx, cell.y - 12 + bob); ctx.lineTo(fx + 9, cell.y - 8 + bob); ctx.lineTo(fx, cell.y - 4 + bob); ctx.closePath(); ctx.fill(); }
    // the album's count badge
    const n = g.s.post.stamps;
    if (n > 0) {
      const A = P.ALBUM;
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(A.x + 20, A.y - 16, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = r.font(8); ctx.fillText(String(Math.min(n, 999)), A.x + 20, A.y - 16);
    }
    this.drawBelt(r, g);
    this.drawScale(r, g);
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, P = CFG.POST;
    if (g.area !== 'post') return;
    if (st.card && !g.driving) items.push({ y: p.y + 1, draw: () => this.drawCard(r, g, p.x + (p.facing || 1) * 16, p.y - 22 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0), 1) });
    items.push({ y: P.CLERK.y, draw: () => this.drawClerk(r, g) });
    items.push({ y: P.COUNTER.y1, draw: () => this.drawCounter(r, g) });
    items.push({ y: P.MAILBOX.y + 20, draw: () => this.drawFly(r, g) });
  },
  drawCard(r, g, x, y, sc) {
    const ctx = r.ctx;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.rotate(-0.15);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-10, -6, 22, 16);
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(-12, -8, 22, 16); ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(-12, -8, 22, 16);
    ctx.fillStyle = '#9fd8ff'; ctx.fillRect(-10, -6, 11, 8); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(-6, -3, 2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#41b883'; ctx.fillRect(-10, -1, 11, 3);
    ctx.fillStyle = '#e4572e'; ctx.fillRect(4, -6, 4, 4);   // the stamp
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(-10, 4, 18, 1); ctx.fillRect(-10, 6, 12, 1);
    ctx.restore();
  },
  drawFly(r, g) {
    const f = this.st.fly; if (!f) return;
    const ctx = r.ctx, M = CFG.POST.MAILBOX, k = U.clamp(f.t / 0.45, 0, 1), e = U.easeOut(k);
    const x = U.lerp(f.x0, M.x, e), y = U.lerp(f.y0, M.y - 26, e) - Math.sin(k * Math.PI) * 30;
    // whoosh streaks behind the card
    ctx.strokeStyle = `rgba(255,255,255,${(0.7 * (1 - k)).toFixed(2)})`; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 1; i <= 3; i++) { const kk = Math.max(0, k - i * 0.08), ee = U.easeOut(kk); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(U.lerp(f.x0, M.x, ee), U.lerp(f.y0, M.y - 26, ee) - Math.sin(kk * Math.PI) * 30); ctx.stroke(); }
    if (k < 1) this.drawCard(r, g, x, y, 1 - k * 0.5);
  },
  drawClerk(r, g) {
    const ctx = r.ctx, C = CFG.POST.CLERK, st = this.st, p = g.player, k = st.clerk.stamp;
    r.drawPerson(C.x, C.y, { shirt: '#3b7dd8', skin: '#e0ac69', hat: 'cap', capColor: '#2d5a8a', facing: p.x < C.x ? -1 : 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a', bowtie: '#e4572e' });
    // the rubber stamp comes down on a letter on the counter top
    const sx = C.x + 20, sy = C.y - 10, down = k > 0 ? Math.abs(Math.sin((0.5 - k) / 0.5 * Math.PI)) : 0;
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(sx - 7, sy - 4, 14, 9); ctx.fillStyle = '#e4572e'; if (k > 0 && k < 0.3) { ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✔', sx, sy); }
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(sx - 2, sy - 18 + down * 9, 4, 10); ctx.fillStyle = '#2b1d14'; ctx.fillRect(sx - 6, sy - 9 + down * 9, 12, 4);
  },
  drawCounter(r, g) {
    const ctx = r.ctx, C = CFG.POST.COUNTER, T = CFG.POST.TRAY, st = this.st, t = g.time;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(C.x0 + 4, C.y0 + 2, C.x1 - C.x0, C.y1 - C.y0);
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, C.x0, C.y0 - 6, C.x1 - C.x0, C.y1 - C.y0 + 6, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; for (let x = C.x0 + 10; x < C.x1 - 8; x += 18) ctx.fillRect(x, C.y0 + 8, 9, C.y1 - C.y0 - 12);
    ctx.fillStyle = '#f6e7cf'; U.roundRect(ctx, C.x0 - 3, C.y0 - 14, C.x1 - C.x0 + 6, 16, 5); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(C.x0 - 3, C.y0 - 1, C.x1 - C.x0 + 6, 3);
    // a bell and a postcard rack on the counter top
    ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.arc(C.x0 + 20, C.y0 - 10, 5, Math.PI, 0); ctx.fill(); ctx.fillRect(C.x0 + 15, C.y0 - 10, 10, 2); ctx.fillStyle = '#2b1d14'; ctx.fillRect(C.x0 + 19, C.y0 - 14, 2, 3);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#9fd8ff', '#ffd1dc', '#c5e1a5'][i]; ctx.fillRect(C.x0 + 76 + i * 14, C.y0 - 22 + i * 2, 12, 14); ctx.fillStyle = '#fff8ee'; ctx.fillRect(C.x0 + 78 + i * 14, C.y0 - 14 + i * 2, 8, 4); }
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(C.x0 + 74, C.y0 - 9, 44, 3);
    // the in-tray with the sleepy mail cat: a grey tabby curled up, breathing
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, T.x - 20, T.y - 10, 40, 18, 3); ctx.fill(); ctx.fillStyle = '#3a4a5c'; ctx.fillRect(T.x - 18, T.y - 8, 36, 14);
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(T.x - 16, T.y - 6, 32, 3);   // letters under the cat
    const br = 1 + Math.sin(t * 2) * 0.04;
    ctx.save(); ctx.translate(T.x, T.y + 1); ctx.scale(br, 1 / br);
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(0, -3, 15, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6b7480'; ctx.lineWidth = 1.5; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 5 - 2, -9); ctx.lineTo(i * 5 + 1, -4); ctx.stroke(); }   // stripes
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(9, -6, 6, 0, Math.PI * 2); ctx.fill();   // head
    ctx.beginPath(); ctx.moveTo(5, -10); ctx.lineTo(6, -15); ctx.lineTo(9, -11); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(11, -11); ctx.lineTo(13, -15); ctx.lineTo(14, -10); ctx.closePath(); ctx.fill();   // ears
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(6, -6); ctx.lineTo(8.5, -5); ctx.moveTo(12, -6); ctx.lineTo(9.5, -5); ctx.stroke();   // closed eyes
    ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.arc(10.5, -3.5, 1, 0, Math.PI * 2); ctx.fill();   // nose
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(-20, -2 + Math.sin(t * 1.5) * 2, -16, -8); ctx.stroke();   // tail
    ctx.restore();
  },
  overlay(r, g) {
    if (!this.st || g.area !== 'post') return;
    const ctx = r.ctx, st = this.st, P = CFG.POST;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // the z's over the cat
    for (const z of st.zz) { const k = z.t / 2; ctx.globalAlpha = 1 - k; ctx.font = r.font(9 + k * 6); ctx.fillStyle = '#3b7dd8'; ctx.fillText('z', z.x + Math.sin(z.t * 3) * 4 + k * 8, z.y - k * 26); }
    ctx.globalAlpha = 1;
    // pictures floating up: a letter or a parcel out of your PO box, a stamp out of the machine
    for (const q of st.pics) {
      const k = q.t / q.dur, y = q.y - U.easeOut(Math.min(1, k * 1.6)) * 44, x = q.x;
      ctx.globalAlpha = 1 - U.clamp((k - 0.65) / 0.35, 0, 1);
      if (q.kind === 'stamp') {
        ctx.fillStyle = '#fff8ee'; ctx.fillRect(x - 13, y - 15, 26, 30); ctx.strokeStyle = '#e4572e'; ctx.setLineDash([2, 2]); ctx.lineWidth = 1.5; ctx.strokeRect(x - 11, y - 13, 22, 26); ctx.setLineDash([]);
        ctx.font = r.font(14); ctx.fillStyle = '#2b1d14'; ctx.fillText(q.pic, x, y - 2); ctx.font = r.font(6); ctx.fillText('$1', x, y + 9);
      } else if (q.kind === 'parcel') {
        ctx.fillStyle = '#c89b4a'; ctx.fillRect(x - 16, y - 12, 32, 24); ctx.fillStyle = '#fff8ee'; ctx.fillRect(x - 2, y - 12, 4, 24); ctx.fillRect(x - 16, y - 2, 32, 4);
        ctx.font = r.font(14); ctx.fillStyle = '#2b1d14'; ctx.fillText(q.pic, x, y - 28);
      } else {
        ctx.fillStyle = '#fff8ee'; ctx.fillRect(x - 16, y - 10, 32, 20); ctx.strokeStyle = 'rgba(43,29,20,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(x - 16, y - 10, 32, 20);
        ctx.beginPath(); ctx.moveTo(x - 16, y - 10); ctx.lineTo(x, y + 2); ctx.lineTo(x + 16, y - 10); ctx.stroke();
        ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(x, y + 1, 3, 0, Math.PI * 2); ctx.fill();
        ctx.font = r.font(14); ctx.fillStyle = '#2b1d14'; ctx.fillText(q.pic, x, y - 26);
      }
    }
    ctx.globalAlpha = 1;
    // the chef on the scale: a little readout on the floor in front of it
    if (st.weigh && st.needle > 0) { ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, P.SCALE.x - 18, P.SCALE.y + 12, 36, 12, 3); ctx.fill(); ctx.font = r.font(8); ctx.fillStyle = '#2b1d14'; ctx.fillText('1 chef ⚖️', P.SCALE.x, P.SCALE.y + 18); }
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(PostExt);   // first in line so the door's button and hint beat the City's taxis and coins
Render.ext.push(PostExt);
