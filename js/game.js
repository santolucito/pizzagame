'use strict';
// Core simulation: persistent state, economy, player interactions and all systems.
const Game = {
  s: null,
  player: null,
  customers: [], cars: [], staff: [], fx: [], floats: [], tables: [], ovens: [], coins: [], dog: null,
  seq: 0, time: 0, spawnT: 1.5, carT: 4, saveT: 0, secT: 0, secEarned: 0, groupLeft: 0, groupT: 0,
  hint: null, padDwell: Object.create(null), lastTotal: 0,
  onUnlock: null, onToast: null,

  // ---------- state ----------
  defaultState() {
    return {
      v: 1,
      cash: 0,
      unlocked: {},
      decor: {},
      padPaid: {},
      upg: { speed: 0, capacity: 0, oven: 0 },
      staff: { cashier: { count: 0, level: 0 }, helper: { count: 0, level: 0 }, cleaner: { count: 0, level: 0 } },
      piles: { oven: 0, display: 0, dt: 0, cash: 0, dtCash: 0 },
      tablesDirty: [false, false, false, false],
      tablesTip: [0, 0, 0, 0],
      stats: { earned: 0, served: 0, lost: 0, coins: 0 },
      incomeRate: 0,
      savedAt: Date.now(),
      muted: false,
      seenHelp: false,
    };
  },

  init() {
    const loaded = this.load();
    if (!loaded) this.s = this.defaultState();
    this.buildRuntime();
    return loaded;
  },

  buildRuntime() {
    const s = this.s;
    this.player = { x: CFG.PLAYER_START.x, y: CFG.PLAYER_START.y, carry: 0, facing: 1, moving: false, xferCd: 0, bob: 0, cleanTarget: null };
    this.customers = []; this.cars = []; this.staff = []; this.fx = []; this.floats = [];
    this.tables = CFG.TABLES.map((t, i) => ({ x: t.x, y: t.y, i, dirty: !!s.tablesDirty[i], tip: (s.tablesTip || [])[i] || 0, occupied: null, cleanProg: 0, cleaner: null }));
    this.ovens = CFG.OVENS.map(() => ({ t: 0 }));
    for (const role of Object.keys(s.staff)) {
      for (let i = 0; i < s.staff[role].count; i++) this.staff.push(new Staff(role, i));
    }
    this.coins = CFG.COINS.map((c) => ({ x: c.x, y: c.y, taken: false, t: 0, phase: Math.random() * 6 }));
    this.dog = new Dog();
    this.padDwell = Object.create(null);
    this.spawnT = 1.5; this.carT = 4; this.groupLeft = 0;
    Sfx.muted = !!s.muted;
  },

  load() {
    try {
      const raw = localStorage.getItem(CFG.SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || data.v !== 1) return false;
      const d = this.defaultState();
      const upg = Object.assign(d.upg, data.upg || {});
      // migrate older saves that had separate oven speed / storage / marketing upgrades
      if (upg.oven === 0 && (data.upg || {}).ovenSpeed) upg.oven = Math.min(CFG.UPGRADES.oven.max, data.upg.ovenSpeed);
      // decorations used to be one leveled upgrade: convert levels to owned items
      const decor = Object.assign({}, data.decor || {});
      if (data.upg && data.upg.decor) CFG.DECOR_ITEMS.slice(0, data.upg.decor).forEach((it) => { decor[it.key] = true; });
      for (const k of Object.keys(upg)) if (!(k in CFG.UPGRADES)) delete upg[k];
      for (const k of Object.keys(decor)) if (!CFG.DECOR_ITEMS.some((it) => it.key === k)) delete decor[k];
      this.s = Object.assign(d, data, {
        upg, decor,
        staff: Object.assign(d.staff, data.staff || {}),
        piles: Object.assign(d.piles, data.piles || {}),
        stats: Object.assign(d.stats, data.stats || {}),
        unlocked: data.unlocked || {},
        padPaid: data.padPaid || {},
      });
      return true;
    } catch (e) { console.warn('Save load failed', e); return false; }
  },

  save() {
    try {
      this.s.tablesDirty = this.tables.map((t) => t.dirty);
      this.s.tablesTip = this.tables.map((t) => t.tip);
      this.s.savedAt = Date.now();
      this.s.muted = Sfx.muted;
      localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(this.s));
    } catch (e) { /* storage may be unavailable */ }
  },

  reset() {
    try { localStorage.removeItem(CFG.SAVE_KEY); } catch (e) { /* ignore */ }
    this.s = this.defaultState();
    this.buildRuntime();
  },

  // Offline progress: staff keep a fraction of the measured income going while away.
  computeOffline() {
    const s = this.s;
    const elapsed = Math.min(CFG.OFFLINE_MAX_SEC, (Date.now() - (s.savedAt || Date.now())) / 1000);
    if (elapsed < 30) return null;
    if (s.staff.cashier.count < 1 || s.staff.helper.count < 1) return null;
    const earned = s.incomeRate * elapsed * CFG.OFFLINE_EFFICIENCY;
    if (earned < 1) return null;
    s.cash += earned; s.stats.earned += earned;
    return { earned, elapsed };
  },

  // ---------- derived values ----------
  costMult() { return 1; },
  price() { return CFG.PIZZA_PRICE; },
  decorCount() { return CFG.DECOR_ITEMS.filter((it) => this.s.decor[it.key]).length; },
  hasDecor(key) { return !!this.s.decor[key]; },
  coinValue() { return Math.round(this.price() * 2); },
  playerSpeed() { return 175 + 22 * this.s.upg.speed; },
  playerCap() { return Math.round(4 * Math.pow(1.5, this.s.upg.capacity)); },
  bakeTime() { return CFG.BAKE_TIME / (1 + 0.25 * this.s.upg.oven); },
  ovenPileCap() { return 6 + 2 * this.s.upg.oven; },
  ovenCount() { return this.isUnlocked('oven2') ? 2 : 1; },
  spawnInterval() { return CFG.SPAWN_BASE / (1 + 0.15 * this.decorCount()); },
  carSpawnInterval() { return CFG.CAR_SPAWN_BASE / (1 + 0.08 * this.decorCount()); },
  patienceBonus() { return 1 + 0.08 * this.decorCount(); },
  checkoutTime() {
    const staffed = this.staff.some((st) => st.role === 'cashier' && st.state === 'working');
    const lvl = staffed ? this.s.staff.cashier.level : 0;
    return CFG.CHECKOUT_TIME / (1 + 0.3 * lvl);
  },
  staffSpeed(role) { return 145 + 16 * this.s.staff[role].level; },
  helperCap() { return 3 + this.s.staff.helper.level; },
  cleanTime(who) { return who === 'cleaner' ? CFG.CLEAN_TIME / (1 + 0.35 * this.s.staff.cleaner.level) : CFG.CLEAN_TIME; },

  upgradeCost(key) { const u = CFG.UPGRADES[key]; return Math.round(u.base * Math.pow(u.growth, this.s.upg[key]) * this.costMult()); },
  upgradeMaxed(key) { return this.s.upg[key] >= CFG.UPGRADES[key].max; },
  applyUpgrade(key) {
    this.s.upg[key]++;
    this.toast(`${CFG.UPGRADES[key].name} ${this.s.upg[key]}/${CFG.UPGRADES[key].max}`);
  },
  staffAvailable(role) { const st = CFG.STAFF[role]; return !st.needs || this.isUnlocked(st.needs); },
  staffHireCost(role) { const st = CFG.STAFF[role]; const n = this.s.staff[role].count; return n >= st.hire.length ? null : Math.round(st.hire[n] * this.costMult()); },
  staffUpgradeCost(role) { const st = CFG.STAFF[role]; const l = this.s.staff[role].level; return l >= st.upMax ? null : Math.round(st.upBase * Math.pow(st.upGrowth, l) * this.costMult()); },
  // What the staff pad does next: hire while there are openings, then train.
  staffPadAction(role) {
    const hire = this.staffHireCost(role);
    if (hire !== null) return { action: 'hire', cost: hire };
    const up = this.staffUpgradeCost(role);
    if (up !== null) return { action: 'train', cost: up };
    return null;
  },
  applyStaffPad(role) {
    const a = this.staffPadAction(role);
    if (!a) return;
    if (a.action === 'hire') {
      const idx = this.s.staff[role].count++;
      this.staff.push(new Staff(role, idx));
      this.toast(`Hired a ${CFG.STAFF[role].name}!`);
    } else {
      this.s.staff[role].level++;
      this.toast(`${CFG.STAFF[role].name} trained! Lv ${this.s.staff[role].level}`);
    }
  },

  isUnlocked(key) { return !!this.s.unlocked[key]; },
  padPrice(pad) { return Math.round(pad.price * this.costMult()); },
  visiblePads() { return CFG.PADS.filter((p) => !this.isUnlocked(p.key) && p.req.every((r) => this.isUnlocked(r))); },

  // Every pad the player can stand on, unified: unlock pads, upgrade pads, staff pads.
  allPads() {
    const out = [];
    for (const p of this.visiblePads()) out.push({ key: p.key, kind: 'unlock', label: p.label, ico: p.ico, pos: p.pos, price: this.padPrice(p), maxed: false, sub: '' });
    for (const p of CFG.SHOP_PADS) {
      if (p.kind === 'upgrade') {
        const u = CFG.UPGRADES[p.key];
        const maxed = this.upgradeMaxed(p.key);
        out.push({ key: p.key, kind: 'upgrade', label: u.name, ico: u.ico, pos: p.pos, price: maxed ? 0 : this.upgradeCost(p.key), maxed, sub: `${this.s.upg[p.key]}/${u.max}` });
      } else {
        const st = CFG.STAFF[p.key];
        if (!this.staffAvailable(p.key)) continue; // appears once the dining area exists
        const a = this.staffPadAction(p.key);
        const info = this.s.staff[p.key];
        out.push({ key: p.key, kind: 'staff', label: a ? (a.action === 'hire' ? 'Hire ' + st.name : 'Train ' + st.name) : st.name, ico: st.ico, pos: p.pos, price: a ? a.cost : 0, maxed: !a, sub: info.count ? `${info.count} hired · Lv ${info.level}` : '' });
      }
    }
    for (const it of CFG.DECOR_ITEMS) {
      if (this.s.decor[it.key]) continue;
      out.push({ key: 'decor_' + it.key, kind: 'decor', item: it.key, label: it.label, ico: it.ico, pos: it.spot, price: it.price, maxed: false, sub: '' });
    }
    return out;
  },
  completePad(pad) {
    delete this.s.padPaid[pad.key];
    this.padDwell[pad.key] = -1.0; // short breather before the same pad can take money again
    if (pad.kind === 'unlock') { this.unlock(pad.key); return; }
    Sfx.buy(); Haptics.tap();
    this.fx.push({ kind: 'sparkle', x0: pad.pos.x, y0: pad.pos.y, x1: pad.pos.x, y1: pad.pos.y, t: 0, dur: 0.6 });
    if (pad.kind === 'upgrade') this.applyUpgrade(pad.key);
    else if (pad.kind === 'decor') { this.s.decor[pad.item] = true; this.toast(`${pad.label} bought!`); }
    else this.applyStaffPad(pad.key);
  },

  activeTables() { const n = this.isUnlocked('tables2') ? 4 : this.isUnlocked('dining') ? 2 : 0; return this.tables.slice(0, n); },
  findFreeTable() { return this.activeTables().find((t) => !t.dirty && !t.occupied) || null; },
  cashierPresent() {
    if (this.staff.some((st) => st.role === 'cashier' && st.state === 'working')) return true;
    return U.dist(this.player.x, this.player.y, CFG.CASHIER_SPOT.x, CFG.CASHIER_SPOT.y) < 46;
  },
  dropTargets() {
    const t = [{ key: 'display', pos: CFG.DISPLAY, stand: CFG.DISPLAY_STAND, cap: CFG.DISPLAY_CAP }];
    if (this.isUnlocked('driveThru')) t.push({ key: 'dt', pos: CFG.DT_STACK, stand: CFG.DT_STACK_STAND, cap: CFG.DT_STACK_CAP });
    return t;
  },
  bestDropTarget() {
    let best = null, bestRatio = 1;
    for (const t of this.dropTargets()) {
      const r = this.s.piles[t.key] / t.cap;
      if (r < bestRatio) { bestRatio = r; best = t; }
    }
    return best;
  },
  queueIndex(c) { let i = 0; for (const o of this.customers) { if (o === c) return i; if (o.inMainQueue) i++; } return i; },
  payIndex(c) { let i = 0; for (const o of this.customers) { if (o === c) return i; if (o.inPayQueue) i++; } return i; },
  carIndex(c) { let i = 0; for (const o of this.cars) { if (o === c) return i; if (o.inLine) i++; } return i; },
  countMainQueue() { return this.customers.filter((c) => c.inMainQueue || c.entering).length; },
  insideBuilding(x, y) { const b = CFG.BUILDING; return x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1; },

  earn(amount, pos, pileKey) {
    if (pileKey === 'register') this.s.piles.cash += amount; else this.s.piles.dtCash += amount;
    this.s.stats.served++;
    this.secEarned += amount; // income rate counts sales as they happen (staff can sell while you are away)
    this.floats.push({ x: pos.x + U.rand(-10, 10), y: pos.y - 20, text: '+' + U.money(amount), color: '#2f9e44', t: 0, dur: 1 });
  },
  collect(pileKey, pos) {
    const amt = pileKey === 'cash' ? this.s.piles.cash : this.s.piles.dtCash;
    if (amt <= 0) return;
    this.s.cash += amt; this.s.stats.earned += amt;
    this.s.piles[pileKey] = 0;
    const n = Math.min(8, Math.ceil(amt / 15));
    for (let i = 0; i < n; i++) {
      this.fx.push({ kind: 'bill', x0: pos.x + U.rand(-14, 14), y0: pos.y + U.rand(-10, 4), x1: this.player.x, y1: this.player.y - 10, t: -i * 0.04, dur: 0.3, follow: true });
    }
    this.floats.push({ x: this.player.x, y: this.player.y - 46, text: '+' + U.money(amt), color: '#ffe08a', t: 0, dur: 1, big: true });
    Sfx.cash(); Haptics.tap();
  },
  // Tips left on tables: the player pockets them directly; the cleaner carries them to the register pile.
  collectTip(t, byPlayer) {
    const amt = t.tip; t.tip = 0;
    if (amt <= 0) return;
    if (byPlayer) {
      this.s.cash += amt; this.s.stats.earned += amt;
      for (let i = 0; i < Math.min(5, Math.ceil(amt / 10)); i++) this.fx.push({ kind: 'bill', x0: t.x + U.rand(-10, 10), y0: t.y - 6, x1: this.player.x, y1: this.player.y - 10, t: -i * 0.04, dur: 0.3, follow: true });
      this.floats.push({ x: this.player.x, y: this.player.y - 46, text: 'Tip +' + U.money(amt), color: '#ffe08a', t: 0, dur: 1, big: true });
      Sfx.cash(); Haptics.tap();
    } else {
      this.s.piles.cash += amt;
      this.fx.push({ kind: 'cash', x0: t.x, y0: t.y - 6, x1: CFG.CASH_PILE.x, y1: CFG.CASH_PILE.y, t: 0, dur: 0.5 });
    }
  },
  cleanTable(t) {
    if (t.tip > 0) this.collectTip(t, false);
    t.dirty = false; t.cleanProg = 0;
    this.fx.push({ kind: 'sparkle', x0: t.x, y0: t.y, x1: t.x, y1: t.y, t: 0, dur: 0.6 });
    Sfx.clean();
  },
  toast(msg) { if (this.onToast) this.onToast(msg); },

  unlock(key) {
    this.s.unlocked[key] = true;
    delete this.s.padPaid[key];
    Sfx.unlock(); Haptics.success();
    const pad = CFG.PADS.find((p) => p.key === key);
    this.toast(`Unlocked: ${pad.label}!`);
    if (this.onUnlock) this.onUnlock(key);
  },

  // ---------- update loop ----------
  update(dt) {
    const s = this.s;
    this.time += dt;
    this.updatePlayer(dt);
    this.updateOvens(dt);
    this.updateInteractions(dt);
    this.updateSpawns(dt);
    this.updateOutside(dt);

    for (const c of this.customers) c.update(dt, this);
    this.customers = this.customers.filter((c) => c.state !== 'gone');
    for (const c of this.cars) c.update(dt, this);
    this.cars = this.cars.filter((c) => c.state !== 'gone');
    for (const st of this.staff) st.update(dt, this);
    this.dog.update(dt, this);

    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter((f) => f.t < f.dur);
    for (const f of this.floats) { f.t += dt; f.y -= 28 * dt; }
    this.floats = this.floats.filter((f) => f.t < f.dur);

    this.secT += dt;
    if (this.secT >= 1) {
      s.incomeRate = U.lerp(s.incomeRate, this.secEarned / this.secT, 0.04);
      this.secEarned = 0; this.secT = 0;
    }
    this.saveT += dt;
    if (this.saveT > 5) { this.saveT = 0; this.save(); }
    this.computeHint();
  },

  updatePlayer(dt) {
    const p = this.player;
    const a = Input.axis();
    const sp = this.playerSpeed();
    p.moving = !!(a.x || a.y);
    if (p.moving) {
      if (a.x) p.facing = a.x < 0 ? -1 : 1;
      p.bob += dt * 14;
      const r = 12, w = CFG.WORLD;
      const obstacles = this.obstacles();
      p.x = U.clamp(p.x + a.x * sp * dt, w.x0 + 16, w.x1 - 16);
      for (const o of obstacles) if (this.hitRect(p.x, p.y, r, o)) p.x = a.x > 0 ? o.x - r : o.x + o.w + r;
      p.y = U.clamp(p.y + a.y * sp * dt, w.y0 + 16, w.y1 - 16);
      for (const o of obstacles) if (this.hitRect(p.x, p.y, r, o)) p.y = a.y > 0 ? o.y - r : o.y + o.h + r;
    }
  },
  obstacles() {
    const b = CFG.BUILDING, d = CFG.DOOR;
    const o = [
      { x: b.x0 - 6, y: b.y0, w: b.x1 - b.x0 + 6, h: 12 },               // top wall
      { x: b.x0 - 6, y: b.y0, w: 6, h: b.y1 - b.y0 },                      // left wall
      { x: b.x0 - 6, y: b.y1 - 6, w: b.x1 - b.x0 + 6, h: 6 },              // bottom wall
      { x: b.x1 - 6, y: b.y0, w: 6, h: d.y0 - b.y0 },                      // right wall above door
      { x: b.x1 - 6, y: d.y1, w: 6, h: b.y1 - d.y1 },                      // right wall below door
      { x: CFG.COUNTER.x1, y: CFG.COUNTER.y, w: CFG.COUNTER.x2 - CFG.COUNTER.x1, h: CFG.COUNTER.h },
    ];
    for (let i = 0; i < this.ovenCount(); i++) o.push({ x: CFG.OVENS[i].x - 36, y: CFG.OVENS[i].y - 30, w: 72, h: 60 });
    for (const t of this.activeTables()) o.push({ x: t.x - 24, y: t.y - 14, w: 48, h: 30 });
    return o;
  },
  hitRect(px, py, r, o) { return px + r > o.x && px - r < o.x + o.w && py + r > o.y && py - r < o.y + o.h; },

  updateOvens(dt) {
    const bt = this.bakeTime();
    for (let i = 0; i < this.ovenCount(); i++) {
      const ov = this.ovens[i];
      if (this.s.piles.oven >= this.ovenPileCap()) { ov.t = Math.min(ov.t, bt * 0.98); continue; }
      ov.t += dt;
      if (ov.t >= bt) {
        ov.t = 0; this.s.piles.oven++;
        this.fx.push({ kind: 'pizza', x0: CFG.OVENS[i].x + 20, y0: CFG.OVENS[i].y, x1: CFG.OVEN_PILE.x, y1: CFG.OVEN_PILE.y - 10, t: 0, dur: 0.3 });
      }
    }
  },

  updateInteractions(dt) {
    const p = this.player, s = this.s;
    p.xferCd -= dt;
    const near = (pos, r) => U.dist(p.x, p.y, pos.x, pos.y) < r;

    if (near(CFG.OVEN_PILE, 52) && s.piles.oven > 0 && p.carry < this.playerCap() && p.xferCd <= 0) {
      s.piles.oven--; p.carry++; p.xferCd = CFG.XFER_DELAY;
      this.fx.push({ kind: 'pizza', x0: CFG.OVEN_PILE.x, y0: CFG.OVEN_PILE.y - 10, x1: p.x, y1: p.y - 30, t: 0, dur: 0.15 });
      Sfx.pickup();
    }
    for (const t of this.dropTargets()) {
      if (near(t.pos, 54) && p.carry > 0 && s.piles[t.key] < t.cap && p.xferCd <= 0) {
        s.piles[t.key]++; p.carry--; p.xferCd = CFG.XFER_DELAY;
        this.fx.push({ kind: 'pizza', x0: p.x, y0: p.y - 30, x1: t.pos.x, y1: t.pos.y - 10, t: 0, dur: 0.15 });
        Sfx.drop();
      }
    }
    if (near(CFG.CASH_PILE, 46)) this.collect('cash', CFG.CASH_PILE);
    if (this.isUnlocked('driveThru') && near(CFG.DT_CASH, 46)) this.collect('dtCash', CFG.DT_CASH);

    p.cleanTarget = null;
    for (const t of this.activeTables()) {
      if (t.tip > 0 && near(t, 58)) this.collectTip(t, true);
      if (t.dirty && near(t, 58)) {
        p.cleanTarget = t;
        t.cleanProg += dt / this.cleanTime('player');
        if (t.cleanProg >= 1) { if (t.cleaner) { t.cleaner.target = null; t.cleaner.state = 'idle'; t.cleaner = null; } this.cleanTable(t); }
        break;
      }
    }

    // Pads: stand on one for a moment, then money flows in until it is paid.
    for (const pad of this.allPads()) {
      if (pad.maxed) continue;
      if (!near(pad.pos, CFG.PAD_RADIUS + 6)) { this.padDwell[pad.key] = 0; continue; }
      if (p.moving) { this.padDwell[pad.key] = Math.min(this.padDwell[pad.key] || 0, 0); continue; } // only while standing still
      this.padDwell[pad.key] = (this.padDwell[pad.key] || 0) + dt;
      if (this.padDwell[pad.key] < CFG.PAD_DWELL) continue;
      const paid = s.padPaid[pad.key] || 0;
      const remaining = pad.price - paid;
      if (remaining <= 0.01) { this.completePad(pad); break; }
      if (s.cash <= 0) continue;
      const chunk = Math.min(s.cash, remaining, Math.max(1, pad.price * dt * 0.6));
      s.cash -= chunk; s.padPaid[pad.key] = paid + chunk;
      if (p.xferCd <= 0) {
        p.xferCd = 0.08;
        this.fx.push({ kind: 'bill', x0: p.x, y0: p.y - 10, x1: pad.pos.x + U.rand(-10, 10), y1: pad.pos.y + U.rand(-6, 6), t: 0, dur: 0.25 });
        Sfx.pay();
      }
      if (s.padPaid[pad.key] >= pad.price - 0.01) { this.completePad(pad); break; }
    }

    // Coins outside
    for (const c of this.coins) {
      if (!c.taken && near(c, 30)) {
        c.taken = true; c.t = CFG.COIN_RESPAWN;
        const v = this.coinValue();
        s.cash += v; s.stats.earned += v; s.stats.coins++;
        this.floats.push({ x: c.x, y: c.y - 24, text: '+' + U.money(v), color: '#ffe08a', t: 0, dur: 1, big: true });
        this.fx.push({ kind: 'sparkle', x0: c.x, y0: c.y, x1: c.x, y1: c.y, t: 0, dur: 0.5 });
        Sfx.cash(); Haptics.tap();
      }
    }
  },

  updateOutside(dt) {
    for (const c of this.coins) if (c.taken) { c.t -= dt; if (c.t <= 0) c.taken = false; }
  },

  spawnCustomer() {
    const s = this.s;
    if (this.countMainQueue() >= CFG.QUEUE.max || this.customers.length >= 16) return;
    const want = U.randInt(1, 2 + Math.floor(this.decorCount() / 3));
    const c = new Customer(this.seq++, want);
    c.y += U.rand(-12, 12);
    this.customers.push(c);
  },

  updateSpawns(dt) {
    const s = this.s;
    // Customers arrive at irregular intervals; sometimes a small group walks in together.
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      const r = Math.random();
      this.spawnT = this.spawnInterval() * (r < 0.2 ? U.rand(0.25, 0.6) : r < 0.85 ? U.rand(0.6, 1.4) : U.rand(1.4, 2.2));
      const groupChance = 0.22 + 0.04 * this.decorCount();
      const size = Math.random() < groupChance ? U.randInt(2, Math.random() < 0.3 ? 4 : 3) : 1;
      this.spawnCustomer();
      this.groupLeft = size - 1; this.groupT = U.rand(0.35, 0.7);
      if (size > 1) this.spawnT += 0.6 * size;
    }
    if (this.groupLeft > 0) {
      this.groupT -= dt;
      if (this.groupT <= 0) { this.groupLeft--; this.groupT = U.rand(0.35, 0.7); this.spawnCustomer(); }
    }
    if (this.isUnlocked('driveThru')) {
      this.carT -= dt;
      if (this.carT <= 0) {
        this.carT = this.carSpawnInterval() * U.rand(0.5, 1.6);
        if (this.cars.filter((c) => c.inLine).length < CFG.DT_SLOTS) {
          this.cars.push(new Car(this.seq++, U.randInt(1, 3 + Math.floor(this.decorCount() / 4))));
        }
      }
    }
  },

  // Contextual hint: what should the player do next? Kept short and simple.
  computeHint() {
    const s = this.s, p = this.player;
    const hasCashier = this.staff.some((st) => st.role === 'cashier');
    const paying = this.customers.some((c) => c.state === 'paying' || c.state === 'toPay');
    const hasHelper = this.staff.some((st) => st.role === 'helper');
    let h = null;
    if (!this.insideBuilding(p.x, p.y)) {
      const coin = this.coins.filter((c) => !c.taken).sort((a, b) => U.dist(p.x, p.y, a.x, a.y) - U.dist(p.x, p.y, b.x, b.y))[0];
      if (coin && U.dist(p.x, p.y, coin.x, coin.y) < 420) h = { text: 'Grab the shiny coin!', target: coin };
      else h = { text: 'Walk back to the pizza shop', target: CFG.DOOR_OUT };
    }
    else if (paying && !hasCashier && !this.cashierPresent()) h = { text: 'Stand at the register to take the money', target: CFG.CASHIER_SPOT };
    else if (p.carry > 0) {
      const t = this.bestDropTarget();
      h = t && t.key === 'dt' ? { text: 'Bring pizzas to the drive-thru window', target: CFG.DT_STACK } : { text: 'Put the pizzas on the counter', target: CFG.DISPLAY };
    }
    else if (s.piles.cash >= 40 || (s.piles.cash > 0 && s.piles.oven === 0)) h = { text: 'Collect your cash!', target: CFG.CASH_PILE };
    else if (s.piles.dtCash >= 40) h = { text: 'Collect the drive-thru cash!', target: CFG.DT_CASH };
    else if (s.piles.oven > 0 && !hasHelper && (s.piles.display < CFG.DISPLAY_CAP || (this.isUnlocked('driveThru') && s.piles.dt < CFG.DT_STACK_CAP))) h = { text: 'Grab pizzas from the oven', target: CFG.OVEN_PILE };
    else if (s.piles.cash > 0) h = { text: 'Collect your cash!', target: CFG.CASH_PILE };
    else if (s.piles.dtCash > 0) h = { text: 'Collect the drive-thru cash!', target: CFG.DT_CASH };
    else {
      const dirty = this.activeTables().find((t) => t.dirty && !t.cleaner);
      const pad = this.allPads().find((pd) => !pd.maxed && s.cash + (s.padPaid[pd.key] || 0) >= pd.price);
      if (dirty && !this.staff.some((st) => st.role === 'cleaner')) h = { text: 'Clean the dirty table', target: dirty };
      else if (pad) h = { text: `Stand still on the circle: ${pad.label}`, target: pad.pos };
      else if (!hasHelper) h = { text: 'Pizzas are baking… get ready!', target: null };
      else h = null;
    }
    this.hint = h;
  },
};
