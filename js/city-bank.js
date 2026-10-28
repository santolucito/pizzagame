'use strict';
// The bank: City building 14 (lower row, facing Harbour Street) gets a '🏦 BANK' sign and two little marble columns by
// the door. Step inside for a marble-floored hall with teller windows and a smiling teller, a big round vault door that
// swings open to reveal piles of gold coins and a sleeping guard cat, a coin-counting machine (put a coin in, watch it
// rattle down to a jackpot of sparkles: it always gives the coin back), a piggy bank to save $10 at a time (and take it
// all back whenever you like, so nothing is ever lost), a pen on a chain to sign your name with, a queue rope, a potted
// plant, a security camera that follows you around and a bowl of free lollipops (one per visit).
// Extension module: registered with Game.ext (first, so its door beats the City's taxis) and Render.ext (see js/EXTENSIONS.md).
CFG.BANK = {
  BUILDING: 14,                                  // index in CFG.CITY.BUILDINGS: { x0: 4610, y0: 600, x1: 4750, y1: 876 }
  DOOR_OUT: { x: 4680, y: 890 },                 // on the sidewalk just below the door
  WORLD: { x0: 11300, y0: 3000, x1: 11900, y1: 3400 },
  ROOM: { x0: 11340, y0: 3100, x1: 11860, y1: 3340 }, WALL: 24, BACK_TOP: 3016,   // the back wall is tall: windows, vault and camera hang on it
  COUNTER: { x0: 11360, y0: 3100, x1: 11630, y1: 3124 },        // the tellers' counter along the back wall
  WINDOWS: [{ x: 11410 }, { x: 11540 }],                       // the glass teller windows above the counter
  TELLER: { x: 11410, y: 3112 },
  CLOCK: { x: 11475, y: 3046 },
  PEN: { x: 11520, y: 3100 }, PEN_SPOT: { x: 11520, y: 3140 },
  LOLLY: { x: 11600, y: 3100 }, LOLLY_SPOT: { x: 11604, y: 3140 },
  MACHINE: { x: 11670, y0: 3030, y1: 3124, w: 48 }, MACHINE_SPOT: { x: 11670, y: 3142 },
  VAULT: { x: 11776, y: 3062, r: 44 }, VAULT_SPOT: { x: 11748, y: 3140 },   // you stand by the hinge side, so the treasure shows when the door is open
  CAMERA: { x: 11846, y: 3034 },
  PIGGY: { x: 11420, y: 3212 }, PIGGY_TABLE: { x0: 11396, y0: 3202, x1: 11444, y1: 3228 },
  PADS: { save: { x: 11420, y: 3266 } },
  POSTS: [{ x: 11500, y: 3200 }, { x: 11580, y: 3200 }, { x: 11660, y: 3200 }],
  MEDALLION: { x: 11640, y: 3262 },
  PLANTS: [{ x: 11362, y: 3312 }, { x: 11838, y: 3312 }],
  EXIT: { x: 11500, y: 3322 },                   // the mat inside the door (the door is in the bottom wall)
  SAVE_STEP: 10, LOLLY: 20, SWING: 1.1, COIN: 2.2, SIGN: 1.3,   // $ per piggy-bank save; seconds: the lollipop, the vault swing, the coin's ride, the signature
};
CFG.AREAS.bank = { WORLD: CFG.BANK.WORLD };

const BankExt = {
  name: 'bank',
  st: null,
  defaults: { bank: { seen: false, saved: 0, coins: 0, vaultOpened: 0, lollies: 0 } },

  // ---------- state ----------
  build(g) {
    const B = CFG.BANK;
    if (!g.s.bank) g.s.bank = { seen: false, saved: 0, coins: 0, vaultOpened: 0, lollies: 0 };
    if (typeof g.s.bank.saved !== 'number' || !(g.s.bank.saved >= 0)) g.s.bank.saved = 0;
    this.st = {
      fade: 0,
      vault: { open: false, k: 0, spin: 0, revealed: false },        // k: 0 shut .. 1 wide open
      machine: { t: -1, paid: false },                                // t: seconds since the coin went in (-1: idle)
      sign: 0, signed: false,                                         // the signature being written (seconds) and whether a slip is signed
      lolly: 0, lollyTaken: false,
      cam: 0, teller: { bob: 0, wave: 0 }, pen: 0,
      obs: null,
    };
    const R = B.ROOM, w = B.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: B.COUNTER.x0, y: B.COUNTER.y0, w: B.COUNTER.x1 - B.COUNTER.x0, h: B.COUNTER.y1 - B.COUNTER.y0 });
    o.push({ x: B.MACHINE.x - B.MACHINE.w / 2, y: R.y0, w: B.MACHINE.w, h: B.MACHINE.y1 - R.y0 });
    o.push({ x: B.VAULT.x - B.VAULT.r - 6, y: R.y0, w: B.VAULT.r * 2 + 12, h: 16 });
    o.push({ x: B.PIGGY_TABLE.x0, y: B.PIGGY_TABLE.y0, w: B.PIGGY_TABLE.x1 - B.PIGGY_TABLE.x0, h: B.PIGGY_TABLE.y1 - B.PIGGY_TABLE.y0 });
    for (const p of B.POSTS) o.push({ x: p.x - 6, y: p.y - 6, w: 12, h: 12 });
    for (const p of B.PLANTS) o.push({ x: p.x - 14, y: p.y - 14, w: 28, h: 26 });
    this.st.obs = o;
  },
  obstacles(g) { return g.area === 'bank' && this.st ? this.st.obs : []; },
  free(x, y) {
    const R = CFG.BANK.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  cityBusy() { return typeof CityExt !== 'undefined' && !!(CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding))); },
  atDoor(g) { const D = CFG.BANK.DOOR_OUT, p = g.player; return g.area === 'city' && this.onFoot(g) && !this.cityBusy() && U.dist(p.x, p.y, D.x, D.y) < 30; },
  near(g, spot, r = 30) { const p = g.player; return U.dist(p.x, p.y, spot.x, spot.y) < r; },
  saving(g) { return (g.s.bank.saved || 0) + (g.s.padPaid.bankSave || 0); },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    const B = CFG.BANK, st = this.st;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'bank') return null;
    if (this.near(g, B.EXIT)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (this.near(g, B.VAULT_SPOT, 34)) return st.vault.open ? { label: '🔒 Close the vault', run: (gg) => this.closeVault(gg) } : { label: '🔐 Open the vault', run: (gg) => this.openVault(gg) };
    if (this.near(g, B.MACHINE_SPOT, 34) && st.machine.t < 0) return { label: '🪙 Put a coin in', run: (gg) => this.insertCoin(gg) };
    if (this.near(g, B.PADS.save, 44) && this.saving(g) > 0) return { label: '🐷 Take it back', run: (gg) => this.takeBack(gg) };
    if (this.near(g, B.LOLLY_SPOT) && !st.lollyTaken) return { label: '🍭 Take a lollipop', run: (gg) => this.takeLolly(gg) };
    if (this.near(g, B.PEN_SPOT) && st.sign <= 0) return { label: '✒️ Sign here', run: (gg) => this.signHere(gg) };
    return null;
  },
  enter(g) {
    const B = CFG.BANK, p = g.player;
    g.area = 'bank'; p.x = B.EXIT.x; p.y = B.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; this.st.lollyTaken = false; this.st.signed = false; Sfx.ding(); Haptics.tap();
    if (!g.s.bank.seen) { g.s.bank.seen = true; g.toast('🏦 Welcome to the bank! Your money is safe here', true); }
  },
  leave(g) {
    const B = CFG.BANK, p = g.player;
    g.area = 'city'; p.x = B.DOOR_OUT.x; p.y = B.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; Sfx.drop();
  },
  openVault(g) {
    const v = this.st.vault; if (v.open) return;
    v.open = true; v.revealed = false; g.s.bank.vaultOpened++; g.player.moving = false;
    Sfx.unlock(); Haptics.tap();
  },
  closeVault(g) { const v = this.st.vault; if (!v.open) return; v.open = false; Sfx.drop(); },
  insertCoin(g) {
    const m = this.st.machine; if (m.t >= 0) return;
    m.t = 0; m.paid = g.s.cash >= 1;
    if (m.paid) g.s.cash -= 1;   // the coin goes in... and comes back out at the bottom (a free go when the purse is empty)
    const M = CFG.BANK.MACHINE, p = g.player;
    g.fx.push({ kind: 'cash', x0: p.x, y0: p.y - 20, x1: M.x, y1: M.y0 + 6, t: 0, dur: 0.3 });
    Sfx.pickup(); Haptics.tap();
  },
  takeBack(g) {
    const amt = this.saving(g); if (amt <= 0) return;
    g.s.cash += amt; g.s.bank.saved = 0; delete g.s.padPaid.bankSave; if (g.padDwell) g.padDwell.bankSave = -1;   // a breather so the pad does not take it straight back
    const P = CFG.BANK.PIGGY, p = g.player;
    for (let i = 0; i < Math.min(6, Math.ceil(amt / 5)); i++) g.fx.push({ kind: 'cash', x0: P.x + U.rand(-8, 8), y0: P.y - 12, x1: 0, y1: 0, follow: true, t: -i * 0.08, dur: 0.5 });
    g.floats.push({ x: p.x, y: p.y - 64, text: `Here's your ${U.money(amt)} back! 🐷`, color: '#ffe08a', t: 0, dur: 1.8, big: true });
    Sfx.cash(); Haptics.success();
  },
  takeLolly(g) {
    const st = this.st; if (st.lollyTaken) return;
    st.lollyTaken = true; st.lolly = CFG.BANK.LOLLY; g.s.bank.lollies++;
    const p = g.player;
    g.floats.push({ x: p.x, y: p.y - 60, text: 'A free lollipop! 🍭', color: '#ffe08a', t: 0, dur: 1.5, big: true });
    Sfx.pickup(); Haptics.success();
  },
  signHere(g) { const st = this.st; if (st.sign > 0) return; st.sign = 0.0001; st.signed = false; g.player.moving = false; Sfx.pickup(); Haptics.tap(); },
  home(g) {
    if (!this.st) return;
    const st = this.st; st.fade = 0; st.vault.open = false; st.vault.k = 0; st.vault.revealed = false; st.machine.t = -1; st.sign = 0;
  },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, B = CFG.BANK;
    if (this.free(p.x, p.y)) return false;
    p.x = B.EXIT.x; p.y = B.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, B = CFG.BANK;
    st.fade = Math.max(0, st.fade - dt);
    st.lolly = Math.max(0, st.lolly - dt);
    if (g.area !== 'bank') { if (st.machine.t >= 0) st.machine.t = -1; st.sign = 0; return; }
    this.rescue(g);
    // the vault door swings; the first moment it stands wide open the treasure sparkles
    const v = st.vault;
    if (v.open && v.k < 1) { v.k = Math.min(1, v.k + dt / B.SWING); v.spin += dt * 6; if (v.k >= 1 && !v.revealed) { v.revealed = true; this.reveal(g); } }
    else if (!v.open && v.k > 0) { v.k = Math.max(0, v.k - dt / B.SWING); v.spin -= dt * 6; }
    // the coin rattles down through the machine, then the jackpot pays out
    const m = st.machine;
    if (m.t >= 0) {
      const was = m.t; m.t += dt;
      if (was < B.COIN - 0.4 && m.t >= B.COIN - 0.4) this.jackpot(g);
      if (m.t >= B.COIN) m.t = -1;
    }
    // the signature gets written
    if (st.sign > 0) {
      st.sign += dt;
      if (st.sign >= B.SIGN) { st.sign = 0; st.signed = true; g.floats.push({ x: p.x, y: p.y - 64, text: 'Nice signature! ✒️', color: '#ffe08a', t: 0, dur: 1.5, big: true }); Sfx.ding(); }
    }
    // the camera swivels after the chef; the teller waves when someone comes up to the window
    const C = B.CAMERA, want = Math.atan2(p.y - C.y, p.x - C.x);
    st.cam += (want - st.cam) * Math.min(1, dt * 4);
    const nearTeller = U.dist(p.x, p.y, B.TELLER.x, B.TELLER.y) < 90;
    st.teller.wave = nearTeller ? Math.min(1, st.teller.wave + dt * 3) : Math.max(0, st.teller.wave - dt * 3);
    st.teller.bob += dt;
    st.pen += dt;
  },
  reveal(g) {
    const V = CFG.BANK.VAULT, p = g.player;
    for (let i = 0; i < 6; i++) g.fx.push({ kind: 'sparkle', x0: V.x + U.rand(-30, 30), y0: V.y + U.rand(-24, 20), x1: 0, y1: 0, t: -i * 0.09, dur: 0.7 });
    g.floats.push({ x: p.x, y: p.y - 70, text: 'Ooooh! ✨', color: '#ffe08a', t: 0, dur: 1.8, big: true });
    Sfx.chime(); Haptics.success();
  },
  jackpot(g) {
    const M = CFG.BANK.MACHINE, p = g.player;
    g.s.cash += 1; g.s.bank.coins++;
    for (let i = 0; i < 5; i++) g.fx.push({ kind: 'sparkle', x0: M.x + U.rand(-18, 18), y0: M.y1 - 20 + U.rand(-10, 6), x1: 0, y1: 0, t: -i * 0.08, dur: 0.6 });
    g.fx.push({ kind: 'cash', x0: M.x, y0: M.y1 - 10, x1: 0, y1: 0, follow: true, t: 0, dur: 0.45 });
    g.floats.push({ x: p.x, y: p.y - 70, text: 'JACKPOT! ✨ +$1', color: '#ffe08a', t: 0, dur: 1.6, big: true });
    Sfx.cash(); Haptics.success();
  },
  pads(g) {
    if (g.area !== 'bank') return [];
    return [{ key: 'bankSave', label: 'Save $10', ico: '🐷', pos: CFG.BANK.PADS.save, price: CFG.BANK.SAVE_STEP, sub: 'saved ' + U.money(g.s.bank.saved || 0) }];
  },
  onPad(g, pad) {
    if (pad.key !== 'bankSave') return;
    const B = CFG.BANK, p = g.player;
    g.s.bank.saved = (g.s.bank.saved || 0) + B.SAVE_STEP;
    for (let i = 0; i < 3; i++) g.fx.push({ kind: 'cash', x0: pad.pos.x + U.rand(-10, 10), y0: pad.pos.y, x1: B.PIGGY.x, y1: B.PIGGY.y - 14, t: -i * 0.08, dur: 0.4 });
    g.floats.push({ x: p.x, y: p.y - 60, text: `Saved! ${U.money(g.s.bank.saved)} 🐷`, color: '#ffe08a', t: 0, dur: 1.5, big: true });
    Haptics.success();
  },
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, B = CFG.BANK, st = this.st, s = g.s.bank;
    if (g.area === 'city') {
      if (!this.onFoot(g) || this.cityBusy()) return undefined;
      const d = U.dist(p.x, p.y, B.DOOR_OUT.x, B.DOOR_OUT.y);
      if (d < 70) return { text: 'Visit the bank! 🏦', target: d < 30 ? null : B.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'bank') return undefined;
    if (st.vault.open && !st.vault.revealed) return { text: 'The vault is opening… 🔐', target: null };
    if (st.machine.t >= 0) return { text: 'Rattle rattle… 🪙', target: null };
    if (st.sign > 0) return { text: 'Signing… ✒️', target: null };
    if (!s.vaultOpened) return { text: 'Open the big vault! 🔐', target: B.VAULT_SPOT };
    if (!s.coins) return { text: 'Put a coin in the machine! 🪙', target: B.MACHINE_SPOT };
    if (!s.saved && !g.s.padPaid.bankSave && g.s.cash >= B.SAVE_STEP) return { text: 'Save $10 in the piggy bank! 🐷', target: B.PADS.save };
    if (!st.lollyTaken) return { text: 'Take a free lollipop! 🍭', target: B.LOLLY_SPOT };
    if (st.lolly > 0) return { text: 'Mmm, lollipop! 🍭', target: null };
    if (!st.signed) return { text: 'Sign your name with the pen! ✒️', target: B.PEN_SPOT };
    return { text: s.saved ? `${U.money(s.saved)} saved, safe and sound! 🏦` : 'Your money is safe here! 🏦', target: null };
  },

  // ---------- the City outside: the sign and the columns (static) ----------
  bld() { return CFG.CITY.BUILDINGS[CFG.BANK.BUILDING]; },
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, sign = '🏦 BANK';
    // two little marble columns either side of the door, under the awning
    for (const d of [-1, 1]) {
      const x = cx + d * 17;
      ctx.fillStyle = '#d9d2c2'; ctx.fillRect(x - 5, gy + 10, 10, 30);
      ctx.fillStyle = '#f6f1e6'; ctx.fillRect(x - 3, gy + 12, 3, 28);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + 2, gy + 12, 2, 28);
      ctx.fillStyle = '#e0b44c'; ctx.fillRect(x - 7, gy + 9, 14, 4); ctx.fillRect(x - 7, b.y1 - 4, 14, 4);
    }
    // a pale marble step on the sidewalk in front of the door
    ctx.fillStyle = '#e8e2d4'; ctx.fillRect(cx - 18, b.y1, 36, 7); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(cx - 18, b.y1 + 7, 36, 2);
    ctx.font = r.font(10); const tw = ctx.measureText(sign).width + 18;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, cx - tw / 2, gy - 22, tw, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sign, cx, gy - 13);
  },

  // ---------- the interior, static ----------
  paint: { bank(r, g) { BankExt.paintRoom(r, g); } },
  paintRoom(r, g) {
    const ctx = r.ctx, B = CFG.BANK, W = B.WORLD, R = B.ROOM, w = B.WALL;
    // outside the hall: dark slate with a faint tile pattern
    ctx.fillStyle = '#3a4a5c'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, B.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - B.BACK_TOP);
    // marble floor: big cream tiles with soft grey veins and thin grout lines
    const ts = 40;
    for (let y = R.y0, j = 0; y < R.y1; y += ts, j++) for (let x = R.x0, i = 0; x < R.x1; x += ts, i++) {
      ctx.fillStyle = (i + j) % 2 ? '#f3eee3' : '#e9e2d3'; ctx.fillRect(x, y, Math.min(ts, R.x1 - x), Math.min(ts, R.y1 - y));
      ctx.strokeStyle = 'rgba(120,110,95,0.22)'; ctx.lineWidth = 1.2; ctx.beginPath();
      const vx = x + ((i * 13 + j * 7) % 26) + 6, vy = y + ((i * 5 + j * 11) % 22) + 6;
      ctx.moveTo(vx, vy); ctx.quadraticCurveTo(vx + 14, vy + 6, vx + 22, vy + 20); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1; for (let x = R.x0; x <= R.x1; x += ts) { ctx.beginPath(); ctx.moveTo(x, R.y0); ctx.lineTo(x, R.y1); ctx.stroke(); } for (let y = R.y0; y <= R.y1; y += ts) { ctx.beginPath(); ctx.moveTo(R.x0, y); ctx.lineTo(R.x1, y); ctx.stroke(); }
    // a round gold-and-teal medallion inlaid in the floor
    const Md = B.MEDALLION;
    ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.ellipse(Md.x, Md.y, 46, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5cc1b5'; ctx.beginPath(); ctx.ellipse(Md.x, Md.y, 38, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f3eee3'; ctx.beginPath(); ctx.ellipse(Md.x, Md.y, 24, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e0b44c'; ctx.font = r.font(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', Md.x, Md.y + 1);
    // walls: a tall pale back wall with a gold cornice and a dark wood dado; grey marble side and bottom walls
    ctx.fillStyle = '#dfe7ef'; ctx.fillRect(R.x0 - w, B.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - B.BACK_TOP);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let x = R.x0 - w + 10; x < R.x1 + w; x += 40) ctx.fillRect(x, B.BACK_TOP + 8, 2, R.y0 - B.BACK_TOP - 20);   // faint panelling
    ctx.fillStyle = '#e0b44c'; ctx.fillRect(R.x0 - w, B.BACK_TOP, R.x1 - R.x0 + 2 * w, 5); ctx.fillStyle = '#b8862c'; ctx.fillRect(R.x0 - w, B.BACK_TOP + 5, R.x1 - R.x0 + 2 * w, 2);   // cornice
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(R.x0 - w, R.y0 - 8, R.x1 - R.x0 + 2 * w, 8);   // dado along the back wall
    ctx.fillStyle = '#7d8c9c'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let x = R.x0 - w; x < R.x1 + w; x += 40) ctx.fillRect(x, R.y1, 2, w); for (let y = R.y0; y < R.y1; y += 40) { ctx.fillRect(R.x0 - w, y, w, 2); ctx.fillRect(R.x1, y, w, 2); }
    ctx.fillStyle = '#5b6a7a'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - w, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1 + w - 3, R.y0, 3, R.y1 - R.y0);
    // the teller windows: wooden frames, pale glass with gold bars, a speaking hole and a name plate
    for (const Wn of B.WINDOWS) {
      ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, Wn.x - 44, B.BACK_TOP + 14, 88, 70, 6); ctx.fill();
      const gl = ctx.createLinearGradient(Wn.x - 40, B.BACK_TOP + 18, Wn.x + 40, B.BACK_TOP + 80); gl.addColorStop(0, '#dff3ff'); gl.addColorStop(1, '#b7dcf5');
      ctx.fillStyle = gl; ctx.fillRect(Wn.x - 40, B.BACK_TOP + 18, 80, 62);
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(Wn.x - 40, B.BACK_TOP + 18, 80, 3);
      ctx.fillStyle = '#e0b44c'; for (let k = -3; k <= 3; k++) ctx.fillRect(Wn.x + k * 11 - 1, B.BACK_TOP + 18, 2, 62);
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, Wn.x - 22, B.BACK_TOP + 2, 44, 12, 3); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TELLER', Wn.x, B.BACK_TOP + 8);
    }
    // a round clock between the windows
    const Ck = B.CLOCK;
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.arc(Ck.x, Ck.y, 13, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(Ck.x, Ck.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(Ck.x, Ck.y); ctx.lineTo(Ck.x, Ck.y - 7); ctx.moveTo(Ck.x, Ck.y); ctx.lineTo(Ck.x + 5, Ck.y + 2); ctx.stroke();
    // the coin-counting machine: a tall blue cabinet with a slot on top, a window of pegs and a tray at the bottom
    const M = B.MACHINE, mx0 = M.x - M.w / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(mx0 + 4, M.y0 + 4, M.w, M.y1 - M.y0);
    ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, mx0, M.y0, M.w, M.y1 - M.y0, 6); ctx.fill();
    ctx.fillStyle = '#2d5a8a'; ctx.fillRect(mx0, M.y1 - 6, M.w, 6);
    ctx.fillStyle = '#ffd166'; U.roundRect(ctx, mx0 + 6, M.y0 + 4, M.w - 12, 8, 3); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(M.x - 8, M.y0 + 6, 16, 3);   // the coin slot
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, mx0 + 5, M.y0 + 16, M.w - 10, 56, 4); ctx.fill();   // the window the coin rattles through
    ctx.fillStyle = '#9aa0a8'; for (let row = 0; row < 4; row++) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(M.x - 12 + k * 12 + (row % 2) * 6, M.y0 + 26 + row * 12, 2.2, 0, Math.PI * 2); ctx.fill(); }   // pegs
    ctx.fillStyle = '#e0b44c'; U.roundRect(ctx, mx0 + 6, M.y1 - 18, M.w - 12, 10, 3); ctx.fill(); ctx.fillStyle = '#b8862c'; ctx.fillRect(mx0 + 8, M.y1 - 12, M.w - 16, 2);   // the tray
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('COIN COUNTER', M.x, M.y0 + 78);
    // the vault frame: a steel ring set into the wall and a marble step in front (the door itself swings live)
    const V = B.VAULT;
    ctx.fillStyle = '#d9d2c2'; ctx.fillRect(V.x - V.r - 6, R.y0, V.r * 2 + 12, 16); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(V.x - V.r - 6, R.y0 + 14, V.r * 2 + 12, 2);
    ctx.fillStyle = '#5c6670'; ctx.beginPath(); ctx.arc(V.x, V.y, V.r + 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, V.x - 22, B.BACK_TOP + 2, 44, 12, 3); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('VAULT', V.x, B.BACK_TOP + 8);
    // the piggy bank on its little table (the "saved" placard is live)
    const Tb = B.PIGGY_TABLE, Pg = B.PIGGY;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(Tb.x0 + 3, Tb.y0 + 4, Tb.x1 - Tb.x0, Tb.y1 - Tb.y0);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, Tb.x0, Tb.y0, Tb.x1 - Tb.x0, Tb.y1 - Tb.y0, 4); ctx.fill(); ctx.fillStyle = '#b5773a'; ctx.fillRect(Tb.x0, Tb.y0, Tb.x1 - Tb.x0, 6);
    ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.ellipse(Pg.x, Pg.y - 10, 16, 11, 0, 0, Math.PI * 2); ctx.fill();   // body
    ctx.beginPath(); ctx.arc(Pg.x + 13, Pg.y - 12, 7, 0, Math.PI * 2); ctx.fill();   // head
    ctx.fillStyle = '#ff5c8a'; ctx.beginPath(); ctx.ellipse(Pg.x + 18, Pg.y - 11, 3.5, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.fillRect(Pg.x + 16.5, Pg.y - 12, 1.2, 1.2); ctx.fillRect(Pg.x + 19, Pg.y - 12, 1.2, 1.2);   // snout
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(Pg.x + 11, Pg.y - 15, 1.2, 0, Math.PI * 2); ctx.fill();   // eye
    ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.moveTo(Pg.x + 10, Pg.y - 18); ctx.lineTo(Pg.x + 12, Pg.y - 24); ctx.lineTo(Pg.x + 15, Pg.y - 18); ctx.fill();   // ear
    ctx.fillRect(Pg.x - 10, Pg.y - 2, 4, 5); ctx.fillRect(Pg.x + 4, Pg.y - 2, 4, 5);   // legs
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(Pg.x - 6, Pg.y - 21, 10, 2);   // the slot on top
    // the queue posts' bases are static (the posts and rope are y-sorted with the chef)
    for (const P of B.POSTS) { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(P.x + 1, P.y + 2, 9, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    // potted plants in the corners
    for (const P of B.PLANTS) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(P.x + 2, P.y + 12, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b86f2d'; U.roundRect(ctx, P.x - 11, P.y - 4, 22, 16, 4); ctx.fill(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(P.x - 12, P.y - 6, 24, 4);
      ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(P.x, P.y - 14, 12, 0, Math.PI * 2); ctx.arc(P.x - 10, P.y - 8, 8, 0, Math.PI * 2); ctx.arc(P.x + 10, P.y - 8, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(P.x - 3, P.y - 18, 5, 0, Math.PI * 2); ctx.fill();
    }
    // the door in the bottom wall, its mat, and the bank's name plate below
    const E = B.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, R.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 16, R.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 14, R.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c62828'; ctx.fillRect(E.x - 21, E.y - 8, 42, 14); ctx.fillStyle = '#e0b44c'; ctx.fillRect(E.x - 21, E.y - 8, 42, 2); ctx.fillRect(E.x - 21, E.y + 4, 42, 2);
    ctx.fillStyle = '#fff8ee'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', E.x, E.y - 1);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 40, R.y1 + w + 4, 80, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('🏦 BANK 🏦', (R.x0 + R.x1) / 2, R.y1 + w + 11);
  },

  // ---------- moving things ----------
  // outside the hall's little map the screen would show the dark backdrop: paint the pavement around it
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.BANK.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#3a4a5c';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  drawVault(r, g) {
    const ctx = r.ctx, V = CFG.BANK.VAULT, v = this.st.vault, t = g.time, k = U.easeOut(v.k);
    // inside the vault: a dark room, shelves of gold bars, piles of coins and the guard cat asleep on top of them
    ctx.save(); ctx.beginPath(); ctx.arc(V.x, V.y, V.r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(V.x - V.r, V.y - V.r, V.r * 2, V.r * 2);
    ctx.fillStyle = '#1f2a36'; ctx.fillRect(V.x - V.r, V.y + 16, V.r * 2, V.r);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(V.x - V.r, V.y - 22, V.r * 2, 4);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = '#ffd166'; U.roundRect(ctx, V.x - 36 + i * 15, V.y - 34, 12, 11, 2); ctx.fill(); ctx.fillStyle = '#fff3b0'; ctx.fillRect(V.x - 34 + i * 15, V.y - 32, 8, 2); }   // gold bars on a shelf
    const pile = (px, py, n) => { for (let row = 0; row < n; row++) for (let c = 0; c <= row; c++) { const cx = px + (c - row / 2) * 9, cy = py - (n - 1 - row) * 6; ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.ellipse(cx, cy + 2, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(cx, cy, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.ellipse(cx - 1, cy - 0.5, 2, 1, 0, 0, Math.PI * 2); ctx.fill(); } };
    pile(V.x - 24, V.y + 30, 4); pile(V.x + 26, V.y + 32, 4); pile(V.x + 2, V.y + 34, 3);
    // the sleeping guard cat (grey, with a tiny security cap) curled on the middle pile
    const cx = V.x + 2, cy = V.y + 12, breathe = Math.sin(t * 1.6) * 0.6, col = '#9aa0a8';
    ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + 6, cy - 2); ctx.quadraticCurveTo(cx + 16, cy + 2, cx + 10, cy - 9); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy - 5, 14, 8 + breathe, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9dde3'; ctx.beginPath(); ctx.ellipse(cx + 2, cy - 3, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx - 8, cy - 8, 6.5, 0, Math.PI * 2); ctx.fill();
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx - 8 + d * 6, cy - 10); ctx.lineTo(cx - 8 + d * 5, cy - 18); ctx.lineTo(cx - 8 + d * 1, cy - 14); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#2d5a8a'; U.roundRect(ctx, cx - 14, cy - 17, 12, 4, 2); ctx.fill(); ctx.fillStyle = '#e0b44c'; ctx.fillRect(cx - 9, cy - 16, 2, 2);   // the cap
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(cx - 13, cy - 9, 3, 1.2); ctx.fillRect(cx - 8, cy - 9, 3, 1.2); ctx.fillStyle = '#ff8fab'; ctx.fillRect(cx - 10, cy - 6.5, 2, 1.5);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx - 12, cy - 2, 2.5, 0, Math.PI * 2); ctx.arc(cx - 7, cy - 1, 2.5, 0, Math.PI * 2); ctx.fill();
    // a golden glow spills out while the door is open
    if (k > 0) { ctx.fillStyle = `rgba(255,224,138,${(0.12 + 0.06 * Math.sin(t * 3)).toFixed(3)})`; ctx.fillRect(V.x - V.r, V.y - V.r, V.r * 2, V.r * 2); }
    ctx.restore();
    // the door: a steel disc hinged on the left; opening it swings it towards us (a horizontal squash), bolts round the rim
    const hx = V.x - V.r - 2, sx = Math.max(0.1, 1 - k * 0.88);
    ctx.save(); ctx.translate(hx, V.y); ctx.scale(sx, 1);
    const dx = V.r + 2;
    ctx.fillStyle = '#6b7480'; ctx.beginPath(); ctx.arc(dx + 3, 3, V.r, 0, Math.PI * 2); ctx.fill();   // the door's thickness
    ctx.fillStyle = '#b0b7c0'; ctx.beginPath(); ctx.arc(dx, 0, V.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(dx, 0, V.r - 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c6670'; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.arc(dx + Math.cos(a) * (V.r - 3.5), Math.sin(a) * (V.r - 3.5), 2.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); ctx.translate(dx, 0); ctx.rotate(v.spin);
    ctx.strokeStyle = '#e0b44c'; ctx.lineWidth = 4; ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20); ctx.stroke(); }
    ctx.strokeStyle = '#e0b44c'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#b8862c'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.restore();
    ctx.fillStyle = '#5c6670'; ctx.fillRect(hx - 4, V.y - 26, 7, 12); ctx.fillRect(hx - 4, V.y + 14, 7, 12);   // hinges
  },
  drawMachineLive(r, g) {
    const ctx = r.ctx, M = CFG.BANK.MACHINE, m = this.st.machine, t = g.time, B = CFG.BANK;
    // lights along the top blink in turn while a coin is inside
    for (let i = 0; i < 3; i++) { const on = m.t >= 0 && Math.floor(t * 8) % 3 === i; ctx.fillStyle = on ? '#fff3b0' : 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(M.x - 14 + i * 14, M.y0 + 8, 2, 0, Math.PI * 2); ctx.fill(); }
    if (m.t < 0.25) return;
    const ride = B.COIN - 0.4, k = U.clamp((m.t - 0.25) / (ride - 0.25), 0, 1);
    if (k < 1) {
      // the coin bounces left and right off the pegs on the way down
      const x = M.x + Math.sin(k * Math.PI * 7) * 12, y = M.y0 + 20 + k * 54 + Math.abs(Math.sin(k * Math.PI * 7)) * -3;
      ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.arc(x, y + 1, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b8862c'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', x, y + 0.5);
    } else {
      // jackpot: the tray glows and the window flashes
      const fl = 0.5 + 0.5 * Math.sin(t * 20);
      ctx.fillStyle = `rgba(255,243,176,${(0.3 + fl * 0.4).toFixed(2)})`; U.roundRect(ctx, M.x - M.w / 2 + 5, M.y0 + 16, M.w - 10, 56, 4); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(M.x - 6, M.y1 - 13, 5, 0, Math.PI * 2); ctx.arc(M.x + 6, M.y1 - 12, 5, 0, Math.PI * 2); ctx.fill();
    }
  },
  drawCamera(r, g) {
    const ctx = r.ctx, C = CFG.BANK.CAMERA, a = this.st.cam, t = g.time;
    ctx.fillStyle = '#5c6670'; ctx.fillRect(C.x - 3, C.y - 14, 6, 10); ctx.beginPath(); ctx.arc(C.x, C.y, 5, 0, Math.PI * 2); ctx.fill();   // the bracket and pivot
    ctx.save(); ctx.translate(C.x, C.y); ctx.rotate(a);
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, -6, -6, 22, 12, 3); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; U.roundRect(ctx, 12, -4, 8, 8, 2); ctx.fill();
    ctx.fillStyle = '#4dd0e1'; ctx.beginPath(); ctx.arc(19, 0, 2.5, 0, Math.PI * 2); ctx.fill();   // the lens
    ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ff5c5c' : '#7a2a2a'; ctx.beginPath(); ctx.arc(-2, -3, 1.8, 0, Math.PI * 2); ctx.fill();   // the little red light
    ctx.restore();
  },
  drawPlacard(r, g) {
    const ctx = r.ctx, Tb = CFG.BANK.PIGGY_TABLE, saved = g.s.bank.saved || 0, x = (Tb.x0 + Tb.x1) / 2, y = Tb.y1 + 7;   // a little placard leaning on the table's front
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, x - 22, y - 6, 44, 12, 3); ctx.fill();
    ctx.fillStyle = saved ? '#1f6e2e' : '#8a7a6a'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('saved ' + U.money(saved), x, y);
  },
  drawCounterFront(r, g) {
    const ctx = r.ctx, B = CFG.BANK, C = B.COUNTER, st = this.st;
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, C.x0, C.y0 - 2, C.x1 - C.x0, C.y1 - C.y0 + 2, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let x = C.x0 + 10; x < C.x1 - 6; x += 26) ctx.fillRect(x, C.y0 + 8, 14, C.y1 - C.y0 - 12);   // panels
    ctx.fillStyle = '#d9d2c2'; U.roundRect(ctx, C.x0 - 2, C.y0 - 8, C.x1 - C.x0 + 4, 12, 4); ctx.fill(); ctx.fillStyle = '#f6f1e6'; ctx.fillRect(C.x0, C.y0 - 7, C.x1 - C.x0, 3);   // marble top
    // a brass bell by the first window
    const bx = B.WINDOWS[0].x + 30, by = C.y0 - 8;
    ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.arc(bx, by - 4, 6, Math.PI, 0); ctx.fill(); ctx.fillRect(bx - 7, by - 4, 14, 3); ctx.fillStyle = '#2b1d14'; ctx.fillRect(bx - 1, by - 12, 2, 3);
    // the pen on its chain: a little plinth, a gold chain and the pen swinging gently
    const P = B.PEN, sw = Math.sin(st.pen * 1.3) * (st.sign > 0 ? 0 : 0.18);
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, P.x - 6, P.y - 12, 12, 6, 2); ctx.fill();
    const px = P.x + 16 + Math.sin(sw) * 10, py = P.y - 16;
    ctx.strokeStyle = '#e0b44c'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(P.x, P.y - 12); for (let k = 1; k <= 6; k++) { const q = k / 6; ctx.lineTo(U.lerp(P.x, px, q) + (k % 2 ? 1.5 : -1.5), U.lerp(P.y - 12, py + 4, q) + Math.sin(q * Math.PI) * 5); } ctx.stroke();
    ctx.save(); ctx.translate(px, py); ctx.rotate(sw - 0.6);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, -2.5, -10, 5, 18, 2); ctx.fill(); ctx.fillStyle = '#e0b44c'; ctx.fillRect(-2.5, 4, 5, 3); ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.moveTo(-2, 8); ctx.lineTo(2, 8); ctx.lineTo(0, 13); ctx.closePath(); ctx.fill();
    ctx.restore();
    // a slip of paper on the counter: the signature appears on it as it is written
    const sx = P.x - 14, sy = C.y0 - 6, k = st.sign > 0 ? U.clamp(st.sign / B.SIGN, 0, 1) : st.signed ? 1 : 0;
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(sx - 14, sy - 5, 28, 10); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(sx - 11, sy - 2, 22, 1);
    if (k > 0) { ctx.strokeStyle = '#2d5a8a'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let i = 0; i <= 20 * k; i++) { const q = i / 20, x = sx - 10 + q * 20, y = sy + 1 - Math.abs(Math.sin(q * Math.PI * 4)) * 4 - (i % 5 === 0 ? 1 : 0); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
    // the lollipop bowl at the counter's end
    const L = B.LOLLY, lx = L.x, ly = C.y0 - 8;
    ctx.fillStyle = 'rgba(159,216,255,0.6)'; ctx.beginPath(); ctx.ellipse(lx, ly - 3, 13, 7, 0, 0, Math.PI); ctx.fill(); ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(lx, ly - 3, 13, 7, 0, 0, Math.PI); ctx.stroke();
    [['#ff8fab', -7, -14], ['#ffd166', -1, -17], ['#41b883', 6, -13], ['#3b7dd8', 2, -11], ['#ff5c8a', -4, -10]].forEach(([col, dx, dy]) => { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx + dx, ly + dy + 4); ctx.lineTo(lx + dx, ly - 2); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lx + dx, ly + dy, 4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(lx + dx, ly + dy, 2, 0, Math.PI * 1.5); ctx.stroke(); });
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, lx - 11, ly + 2, 22, 8, 2); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FREE', lx, ly + 6);
  },
  drawTeller(r, g) {
    const ctx = r.ctx, T = CFG.BANK.TELLER, st = this.st, t = g.time, k = st.teller.wave;
    // a wide smile, a happy hop and a 👋 beside the head (no arm reaching up) when the chef comes to the window
    const hop = k > 0 ? Math.abs(Math.sin(t * 7)) * 3 * k : 0, y = T.y - hop;
    r.drawPerson(T.x, y, { shirt: '#fff', skin: '#e0ac69', hair: '#5b3a1a', hairStyle: 2, facing: 1, moving: false, bob: 0, carry: 0, pants: '#2d3a4a', bowtie: '#3b7dd8' });
    ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(T.x + 2, y - 40, 3.5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    if (k > 0) {
      ctx.save(); ctx.globalAlpha = k; ctx.translate(T.x + 22, y - 46); ctx.rotate(Math.sin(t * 9) * 0.3);
      ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('👋', 0, 0); ctx.restore();
      if (k >= 1) r.drawBubble(T.x, T.y - 70, () => { ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('Hello! 😊', 0, 0); }, 62);
    }
  },
  drawPost(r, g, i) {
    const ctx = r.ctx, P = CFG.BANK.POSTS, p = P[i];
    if (i > 0) {   // the red velvet rope sagging from the previous post
      const q = P[i - 1];
      ctx.strokeStyle = '#8b1e2d'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(q.x, q.y - 26); ctx.quadraticCurveTo((q.x + p.x) / 2, q.y - 12, p.x, p.y - 26); ctx.stroke();
      ctx.strokeStyle = '#c62828'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(q.x, q.y - 27); ctx.quadraticCurveTo((q.x + p.x) / 2, q.y - 14, p.x, p.y - 27); ctx.stroke();
    }
    ctx.fillStyle = '#b8862c'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 8, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e0b44c'; ctx.fillRect(p.x - 2, p.y - 30, 4, 30); ctx.beginPath(); ctx.arc(p.x, p.y - 31, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3b0'; ctx.fillRect(p.x - 1, p.y - 28, 1, 26);
  },
  drawLolly(r, g) {
    const ctx = r.ctx, p = g.player, f = p.facing || 1, x = p.x + f * 16, y = p.y - 22 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0), t = g.time;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x, y + 14); ctx.stroke();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(x, y - 3, 7, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(x, y - 3); ctx.rotate(t * 1.5);
    ctx.strokeStyle = '#ff5c8a'; ctx.lineWidth = 2; ctx.beginPath(); for (let a = 0; a < Math.PI * 4; a += 0.3) { const rr = a / (Math.PI * 4) * 5.5; const px = Math.cos(a) * rr, py = Math.sin(a) * rr; if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(x - 2.5, y - 5.5, 1.6, 0, Math.PI * 2); ctx.fill();
  },
  dynamic(r, g) {
    if (!this.st || g.area !== 'bank') return;
    this.drawOutside(r, g);
    this.drawVault(r, g);
    this.drawMachineLive(r, g);
    this.drawCamera(r, g);
    this.drawPlacard(r, g);
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, B = CFG.BANK;
    if (st.lolly > 0 && !g.driving && !g.onTrain) items.push({ y: p.y + 1, draw: () => this.drawLolly(r, g) });
    if (g.area !== 'bank') return;
    items.push({ y: B.TELLER.y, draw: () => this.drawTeller(r, g) });
    items.push({ y: B.COUNTER.y1 + 2, draw: () => this.drawCounterFront(r, g) });
    for (let i = 0; i < B.POSTS.length; i++) items.push({ y: B.POSTS[i].y, draw: () => this.drawPost(r, g, i) });
  },
  overlay(r, g) {
    if (!this.st || g.area !== 'bank') return;
    const ctx = r.ctx, v = this.st.vault, V = CFG.BANK.VAULT, t = g.time;
    // little z's over the guard cat while the vault stands open
    if (v.k > 0.6) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#3b7dd8';
      for (let k = 0; k < 2; k++) { const ph = (t * 0.5 + k * 0.5) % 1; ctx.globalAlpha = (1 - ph) * U.clamp((v.k - 0.6) / 0.4, 0, 1); ctx.font = r.font(9 + ph * 7); ctx.fillText('z', V.x - 10 + ph * 16 + k * 4, V.y - 2 - ph * 26); }
      ctx.globalAlpha = 1;
    }
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(BankExt);   // first in line so the door's button and hint beat the City's taxis and coins
Render.ext.push(BankExt);
