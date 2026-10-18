'use strict';
// Core simulation: persistent state, economy, player interactions and all systems.
const Game = {
  s: null,
  player: null,
  customers: [], cars: [], staff: [], fx: [], floats: [], tables: [], ovens: [],
  seq: 0, time: 0, spawnT: 1.5, carT: 4, saveT: 0, secT: 0, secEarned: 0,
  hint: null, padInside: Object.create(null), lastTotal: 0,
  onUnlock: null, onFranchise: null, onToast: null,

  // ---------- state ----------
  defaultState() {
    return {
      v: 1,
      cash: 0, city: 0,
      unlocked: {},
      padPaid: {},
      upg: { speed: 0, capacity: 0, profit: 0, ovenSpeed: 0, ovenCap: 0, marketing: 0, decor: 0 },
      staff: { cashier: { count: 0, level: 0 }, helper: { count: 0, level: 0 }, cleaner: { count: 0, level: 0 } },
      piles: { oven: 0, display: 0, dt: 0, cash: 0, dtCash: 0 },
      tablesDirty: [false, false, false, false],
      stats: { earned: 0, served: 0, lost: 0, franchises: 0 },
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
    this.tables = CFG.TABLES.map((t, i) => ({ x: t.x, y: t.y, i, dirty: !!s.tablesDirty[i], occupied: null, cleanProg: 0, cleaner: null }));
    this.ovens = CFG.OVENS.map(() => ({ t: 0 }));
    for (const role of Object.keys(s.staff)) {
      for (let i = 0; i < s.staff[role].count; i++) this.staff.push(new Staff(role, i));
    }
    this.padInside = Object.create(null);
    this.spawnT = 1.5; this.carT = 4;
    Sfx.muted = !!s.muted;
  },

  load() {
    try {
      const raw = localStorage.getItem(CFG.SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || data.v !== 1) return false;
      const d = this.defaultState();
      // shallow-merge nested objects so new fields get defaults
      this.s = Object.assign(d, data, {
        upg: Object.assign(d.upg, data.upg || {}),
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
  priceMult() { return Math.pow(CFG.CITY_PRICE_GROWTH, this.s.city); },
  costMult() { return Math.pow(CFG.CITY_COST_GROWTH, this.s.city); },
  price() { return CFG.PIZZA_PRICE * this.priceMult() * (1 + 0.15 * this.s.upg.profit); },
  playerSpeed() { return 175 + 22 * this.s.upg.speed; },
  playerCap() { return Math.round(4 * Math.pow(1.5, this.s.upg.capacity)); },
  bakeTime() { return CFG.BAKE_TIME / (1 + 0.25 * this.s.upg.ovenSpeed); },
  ovenPileCap() { return 6 + 3 * this.s.upg.ovenCap; },
  ovenCount() { return this.isUnlocked('oven2') ? 2 : 1; },
  spawnInterval() { return CFG.SPAWN_BASE / (1 + 0.12 * this.s.upg.marketing + 0.1 * this.s.upg.decor); },
  carSpawnInterval() { return CFG.CAR_SPAWN_BASE / (1 + 0.1 * this.s.upg.marketing + 0.05 * this.s.upg.decor); },
  patienceBonus() { return 1 + 0.08 * this.s.upg.decor; },
  checkoutTime() {
    const staffed = this.staff.some((st) => st.role === 'cashier' && st.state === 'working');
    const lvl = staffed ? this.s.staff.cashier.level : 0;
    return CFG.CHECKOUT_TIME / (1 + 0.3 * lvl);
  },
  staffSpeed(role) { return 145 + 16 * this.s.staff[role].level; },
  helperCap() { return 3 + this.s.staff.helper.level; },
  cleanTime(who) { return who === 'cleaner' ? CFG.CLEAN_TIME / (1 + 0.35 * this.s.staff.cleaner.level) : CFG.CLEAN_TIME; },
  cityName() { return CFG.CITIES[Math.min(this.s.city, CFG.CITIES.length - 1)] + (this.s.city >= CFG.CITIES.length ? ' ' + (this.s.city - CFG.CITIES.length + 2) : ''); },

  upgradeCost(key) { const u = CFG.UPGRADES[key]; return Math.round(u.base * Math.pow(u.growth, this.s.upg[key]) * this.costMult()); },
  upgradeMaxed(key) { return this.s.upg[key] >= CFG.UPGRADES[key].max; },
  buyUpgrade(key) {
    if (this.upgradeMaxed(key)) return false;
    const c = this.upgradeCost(key);
    if (this.s.cash < c) { Sfx.error(); return false; }
    this.s.cash -= c; this.s.upg[key]++; Sfx.buy();
    this.toast(`${CFG.UPGRADES[key].name} → Lv ${this.s.upg[key]}`);
    return true;
  },
  staffHireCost(role) { const st = CFG.STAFF[role]; const n = this.s.staff[role].count; return n >= st.hire.length ? null : Math.round(st.hire[n] * this.costMult()); },
  staffAvailable(role) { const st = CFG.STAFF[role]; return !st.needs || this.isUnlocked(st.needs); },
  hireStaff(role) {
    const c = this.staffHireCost(role);
    if (c === null || !this.staffAvailable(role)) return false;
    if (this.s.cash < c) { Sfx.error(); return false; }
    this.s.cash -= c;
    const idx = this.s.staff[role].count++;
    this.staff.push(new Staff(role, idx));
    Sfx.buy();
    this.toast(`Hired a ${CFG.STAFF[role].name}!`);
    return true;
  },
  staffUpgradeCost(role) { const st = CFG.STAFF[role]; const l = this.s.staff[role].level; return l >= st.upMax ? null : Math.round(st.upBase * Math.pow(st.upGrowth, l) * this.costMult()); },
  upgradeStaff(role) {
    const c = this.staffUpgradeCost(role);
    if (c === null || this.s.staff[role].count < 1) return false;
    if (this.s.cash < c) { Sfx.error(); return false; }
    this.s.cash -= c; this.s.staff[role].level++; Sfx.buy();
    this.toast(`${CFG.STAFF[role].name} → Lv ${this.s.staff[role].level}`);
    return true;
  },

  isUnlocked(key) { return !!this.s.unlocked[key]; },
  padPrice(pad) { return Math.round(pad.price * this.costMult()); },
  visiblePads() { return CFG.PADS.filter((p) => !this.isUnlocked(p.key) && p.req.every((r) => this.isUnlocked(r))); },
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
  countMainQueue() { return this.customers.filter((c) => c.inMainQueue).length; },

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
  cleanTable(t) {
    t.dirty = false; t.cleanProg = 0;
    this.fx.push({ kind: 'sparkle', x0: t.x, y0: t.y, x1: t.x, y1: t.y, t: 0, dur: 0.6 });
    Sfx.clean();
  },
  toast(msg) { if (this.onToast) this.onToast(msg); },

  unlock(key) {
    this.s.unlocked[key] = true;
    delete this.s.padPaid[key];
    Sfx.unlock(); Haptics.success();
    if (key === 'franchise') { this.franchise(); return; }
    const pad = CFG.PADS.find((p) => p.key === key);
    this.toast(`Unlocked: ${pad.label}!`);
    if (this.onUnlock) this.onUnlock(key);
  },

  // Move to the next city: bigger prices, bigger costs, fresh shop.
  franchise() {
    const s = this.s;
    const keep = { city: s.city + 1, stats: s.stats, muted: s.muted, seenHelp: s.seenHelp, incomeRate: 0 };
    keep.stats.franchises++;
    this.s = Object.assign(this.defaultState(), keep);
    this.buildRuntime();
    Render.updateCamera(this, true);
    this.save();
    if (this.onFranchise) this.onFranchise(this.cityName());
  },

  // ---------- update loop ----------
  update(dt) {
    const s = this.s;
    this.time += dt;
    this.updatePlayer(dt);
    this.updateOvens(dt);
    this.updateInteractions(dt);
    this.updateSpawns(dt);

    for (const c of this.customers) c.update(dt, this);
    this.customers = this.customers.filter((c) => c.state !== 'gone');
    for (const c of this.cars) c.update(dt, this);
    this.cars = this.cars.filter((c) => c.state !== 'gone');
    for (const st of this.staff) st.update(dt, this);

    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter((f) => f.t < f.dur);
    for (const f of this.floats) { f.t += dt; f.y -= 28 * dt; }
    this.floats = this.floats.filter((f) => f.t < f.dur);

    // income rate (EMA of $/s), used for offline earnings
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
      const r = 12;
      const obstacles = this.obstacles();
      p.x = U.clamp(p.x + a.x * sp * dt, 20, CFG.W - 20);
      for (const o of obstacles) if (this.hitRect(p.x, p.y, r, o)) p.x = a.x > 0 ? o.x - r : o.x + o.w + r;
      p.y = U.clamp(p.y + a.y * sp * dt, CFG.ROAD.y2 + 16, CFG.H - 16);
      for (const o of obstacles) if (this.hitRect(p.x, p.y, r, o)) p.y = a.y > 0 ? o.y - r : o.y + o.h + r;
    }
  },
  obstacles() {
    const o = [{ x: CFG.COUNTER.x1, y: CFG.COUNTER.y, w: CFG.COUNTER.x2 - CFG.COUNTER.x1, h: CFG.COUNTER.h }];
    for (let i = 0; i < this.ovenCount(); i++) o.push({ x: CFG.OVENS[i].x - 36, y: CFG.OVENS[i].y - 30, w: 72, h: 60 });
    for (const t of this.activeTables()) o.push({ x: t.x - 24, y: t.y - 14, w: 48, h: 30 });
    o.push({ x: CFG.UPG_PAD.x - 40, y: CFG.UPG_PAD.y + 18, w: 80, h: 30 });
    o.push({ x: CFG.HR_PAD.x - 40, y: CFG.HR_PAD.y + 18, w: 80, h: 30 });
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

    // Pick up from the oven pile
    if (near(CFG.OVEN_PILE, 52) && s.piles.oven > 0 && p.carry < this.playerCap() && p.xferCd <= 0) {
      s.piles.oven--; p.carry++; p.xferCd = CFG.XFER_DELAY;
      this.fx.push({ kind: 'pizza', x0: CFG.OVEN_PILE.x, y0: CFG.OVEN_PILE.y - 10, x1: p.x, y1: p.y - 30, t: 0, dur: 0.15 });
      Sfx.pickup();
    }
    // Drop on counter / drive-thru
    for (const t of this.dropTargets()) {
      if (near(t.pos, 54) && p.carry > 0 && s.piles[t.key] < t.cap && p.xferCd <= 0) {
        s.piles[t.key]++; p.carry--; p.xferCd = CFG.XFER_DELAY;
        this.fx.push({ kind: 'pizza', x0: p.x, y0: p.y - 30, x1: t.pos.x, y1: t.pos.y - 10, t: 0, dur: 0.15 });
        Sfx.drop();
      }
    }
    // Collect cash
    if (near(CFG.CASH_PILE, 46)) this.collect('cash', CFG.CASH_PILE);
    if (this.isUnlocked('driveThru') && near(CFG.DT_CASH, 46)) this.collect('dtCash', CFG.DT_CASH);

    // Clean tables by standing next to them
    p.cleanTarget = null;
    for (const t of this.activeTables()) {
      if (t.dirty && near(t, 58)) {
        p.cleanTarget = t;
        t.cleanProg += dt / this.cleanTime('player');
        if (t.cleanProg >= 1) { if (t.cleaner) { t.cleaner.target = null; t.cleaner.state = 'idle'; t.cleaner = null; } this.cleanTable(t); }
        break;
      }
    }

    // Unlock pads: stand on them to pour money in
    for (const pad of this.visiblePads()) {
      if (!near(pad.pos, CFG.PAD_RADIUS + 6)) continue;
      const price = this.padPrice(pad);
      const paid = s.padPaid[pad.key] || 0;
      const remaining = price - paid;
      if (remaining <= 0) { this.unlock(pad.key); break; }
      if (s.cash <= 0) continue;
      const chunk = Math.min(s.cash, remaining, Math.max(1, price * dt * 0.6));
      s.cash -= chunk; s.padPaid[pad.key] = paid + chunk;
      if (p.xferCd <= 0) {
        p.xferCd = 0.08;
        this.fx.push({ kind: 'bill', x0: p.x, y0: p.y - 10, x1: pad.pos.x + U.rand(-10, 10), y1: pad.pos.y + U.rand(-6, 6), t: 0, dur: 0.25 });
        Sfx.pay();
      }
      if (s.padPaid[pad.key] >= price - 0.01) { this.unlock(pad.key); break; }
    }

    // Menu desks
    for (const [key, pos] of [['upgrades', CFG.UPG_PAD], ['staff', CFG.HR_PAD]]) {
      const inside = near(pos, 44);
      if (inside && !this.padInside[key]) { this.padInside[key] = true; if (this.onDesk) this.onDesk(key); }
      else if (!inside) this.padInside[key] = false;
    }
  },

  updateSpawns(dt) {
    const s = this.s;
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = this.spawnInterval() * U.rand(0.7, 1.3);
      if (this.countMainQueue() < CFG.QUEUE.max && this.customers.length < 16) {
        const want = U.randInt(1, 2 + Math.floor(s.upg.marketing / 3));
        this.customers.push(new Customer(this.seq++, want));
      }
    }
    if (this.isUnlocked('driveThru')) {
      this.carT -= dt;
      if (this.carT <= 0) {
        this.carT = this.carSpawnInterval() * U.rand(0.7, 1.3);
        if (this.cars.filter((c) => c.inLine).length < CFG.DT_SLOTS) {
          this.cars.push(new Car(this.seq++, U.randInt(1, 3 + Math.floor(s.upg.marketing / 4))));
        }
      }
    }
  },

  // Contextual hint: what should the player do next?
  computeHint() {
    const s = this.s, p = this.player;
    const hasCashier = this.staff.some((st) => st.role === 'cashier');
    const paying = this.customers.some((c) => c.state === 'paying' || c.state === 'toPay');
    const hasHelper = this.staff.some((st) => st.role === 'helper');
    let h = null;
    if (paying && !hasCashier && !this.cashierPresent()) h = { text: 'Stand at the register to check out customers', target: CFG.CASHIER_SPOT };
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
      const pad = this.visiblePads().find((pd) => s.cash + (s.padPaid[pd.key] || 0) >= this.padPrice(pd) * 0.999);
      const upg = Object.keys(CFG.UPGRADES).find((k) => !this.upgradeMaxed(k) && s.cash >= this.upgradeCost(k));
      const hire = Object.keys(CFG.STAFF).find((k) => this.staffAvailable(k) && this.staffHireCost(k) !== null && s.cash >= this.staffHireCost(k));
      if (dirty && !this.staff.some((st) => st.role === 'cleaner')) h = { text: 'Clean the dirty table', target: dirty };
      else if (pad) h = { text: `Stand on the pad to unlock ${pad.label}`, target: pad.pos };
      else if (hire) h = { text: `You can hire a ${CFG.STAFF[hire].name} at the Staff desk`, target: CFG.HR_PAD };
      else if (upg && s.cash >= this.upgradeCost(upg) * 1.5) h = { text: 'Visit the Upgrades desk', target: CFG.UPG_PAD };
      else if (!hasHelper) h = { text: 'Pizzas are baking… get ready!', target: null };
      else h = null;
    }
    this.hint = h;
  },
};
