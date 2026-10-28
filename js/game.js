'use strict';
// Core simulation: persistent state, economy, player interactions and all systems.
const Game = {
  s: null,
  player: null,
  customers: [], cars: [], staff: [], fx: [], floats: [], tables: [], ovens: [], coins: [], dog: null,
  houses: [], icCustomers: [], car: null, bike: null, vehicle: null, driving: false, orderT: 30, icSpawnT: 4, carNear: false, nearVehicle: null, fireTruck: null, nearPrep: false,
  plots: [], cow: null, train: null, ride: null, rideLeft: true, tractor: null, fishing: null, onTrain: false, nearPond: false, nearTrain: false, inPaintBay: false,
  seq: 0, time: 0, spawnT: 1.5, carT: 4, saveT: 0, secT: 0, secEarned: 0, groupLeft: 0, groupT: 0,
  hint: null, padDwell: Object.create(null), lastTotal: 0,
  onUnlock: null, onToast: null,
  // Feature extensions (see js/city.js etc.): objects with optional hooks the core calls at set points.
  ext: [],

  // ---------- state ----------
  defaultState() {
    return {
      v: 1,
      cash: 0,
      unlocked: {},
      decor: {},
      iceCream: { owned: false, flavors: 0, cash: 0 },
      farm: { wheat: 0, tomato: 0, cheese: 0, mushroom: 0, basil: 0 },
      paint: { car: '#ffffff', bike: '#ffffff', tractor: '#43a047' },
      vehicles: { car: false, bike: false },   // bought at the showroom
      padPaid: {},
      upg: { speed: 0, capacity: 0, oven: 0 },
      staff: { cashier: { count: 0, level: 0 }, helper: { count: 0, level: 0 }, cleaner: { count: 0, level: 0 } },
      piles: { oven: 0, display: 0, dt: 0, cash: 0, dtCash: 0 },
      tablesDirty: [false, false, false, false],
      tablesTip: [0, 0, 0, 0],
      stats: { earned: 0, served: 0, lost: 0, coins: 0, delivered: 0, scoops: 0 },
      incomeRate: 0,
      savedAt: Date.now(),
      muted: false,
      seenHelp: false,
    };
  },

  init() {
    const loaded = this.load();
    if (!loaded) this.s = this.defaultState();
    for (const e of this.ext) if (e.defaults) for (const k of Object.keys(e.defaults)) if (this.s[k] === undefined) this.s[k] = JSON.parse(JSON.stringify(e.defaults[k]));
    this.buildRuntime();
    return loaded;
  },

  buildRuntime() {
    const s = this.s;
    const start = CFG.PLAYER_START;
    this.player = { x: start.x, y: start.y, carry: 0, facing: 1, moving: false, xferCd: 0, bob: 0, cleanTarget: null, hasMoved: false };
    this.customers = []; this.cars = []; this.staff = []; this.fx = []; this.floats = [];
    this.tables = CFG.TABLES.map((t, i) => ({ x: t.x, y: t.y, i, dirty: !!s.tablesDirty[i], tip: (s.tablesTip || [])[i] || 0, occupied: null, cleanProg: 0, cleaner: null }));
    this.ovens = CFG.OVENS.map(() => ({ t: 0 }));
    for (const role of Object.keys(s.staff)) {
      for (let i = 0; i < s.staff[role].count; i++) this.staff.push(new Staff(role, i));
    }
    this.coins = [];   // the old cash coins are gone: the hidden Pizza Coins (js/pizzacoins.js) are the only coins in the world
    this.dog = new Dog();
    this.houses = CFG.HOUSES.map((h, i) => Object.assign({ i, order: null, happy: 0 }, h));
    this.icCustomers = [];
    // owned vehicles wait at their usual spots; unsold ones sit in the showroom
    const SR = CFG.GARAGE.showroom;
    this.car = s.vehicles.car ? { kind: 'car', x: CFG.DELIVERY_CAR.x, y: CFG.DELIVERY_CAR.y, angle: -Math.PI / 2, vx: 0, vy: 0 } : { kind: 'car', x: SR.car.x, y: SR.car.y, angle: -Math.PI / 2, vx: 0, vy: 0 };
    this.bike = s.vehicles.bike ? { kind: 'bike', x: CFG.DELIVERY_BIKE.x, y: CFG.DELIVERY_BIKE.y, angle: -Math.PI / 2, vx: 0, vy: 0 } : { kind: 'bike', x: SR.bike.x, y: SR.bike.y, angle: -Math.PI / 2, vx: 0, vy: 0 };
    this.tractor = { kind: 'tractor', x: CFG.FARM.tractor.x, y: CFG.FARM.tractor.y, angle: -0.3, vx: 0, vy: 0 };
    this.fishing = null; this.onTrain = false;
    this.vehicle = null; this.driving = false; this.orderT = U.rand(20, 35); this.icSpawnT = 4;
    this.fireTruck = new FireTruck();
    this.train = new Train(); this.ride = null; this.rideLeft = true;
    // Construction Town: reached by train; its own train waits there to bring you home
    this.area = 'town'; this.travel = null; this.cameraSnap = false;
    this.siteTrain = new Train(CFG.SITE.STATION, CFG.SITE.WORLD, true);
    const SV = CFG.SITE.VEHICLES;
    this.excavator = { kind: 'excavator', x: SV.excavator.x, y: SV.excavator.y, angle: 0.4, vx: 0, vy: 0, arm: 0 };
    this.dumptruck = { kind: 'dumptruck', x: SV.dumptruck.x, y: SV.dumptruck.y, angle: Math.PI, vx: 0, vy: 0 };
    this.bulldozer = { kind: 'bulldozer', x: SV.bulldozer.x, y: SV.bulldozer.y, angle: -0.5, vx: 0, vy: 0 };
    this.mounds = CFG.SITE.MOUNDS.map((m, i) => ({ i, x: m.x, y: m.y, r: m.r, flat: 0, t: 0 }));
    // pick up where you left off (circles stay inert until you move, so reloading onto one costs nothing)
    const pos = s.pos;
    if (pos && CFG.AREAS[pos.area]) {
      this.area = pos.area; this.player.x = pos.x; this.player.y = pos.y;
      if (this.area === 'site') { const t = this.siteTrain, st = CFG.SITE.STATION; t.state = 'stopped'; t.x = st.stopX; t.unload = Infinity; t.departIn = Infinity; t.toDrop = 0; }
    }
    this.plots = CFG.FARM.plots.map((pl, i) => ({ i, kind: pl.kind, x: pl.x, y: pl.y, ready: true, t: 0, phase: Math.random() * 6 }));
    this.cow = { x: CFG.FARM.cowHome.x, y: CFG.FARM.cowHome.y, facing: 1, moving: false, bob: 0, target: null, timer: 0, ready: true, t: 0, moo: 0 };
    this.padDwell = Object.create(null);
    this.spawnT = 1.5; this.carT = 4; this.groupLeft = 0;
    Sfx.muted = !!s.muted;
    for (const e of this.ext) if (e.build) e.build(this);
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
      const staff = Object.assign(d.staff, data.staff || {});
      for (const role of Object.keys(staff)) staff[role].count = Math.min(staff[role].count, CFG.STAFF[role].hire.length); // one of each now
      this.s = Object.assign(d, data, {
        upg, decor,
        staff,
        piles: Object.assign(d.piles, data.piles || {}),
        stats: Object.assign(d.stats, data.stats || {}),
        iceCream: Object.assign(d.iceCream, data.iceCream || {}),
        farm: Object.assign(d.farm, data.farm || {}),
        paint: Object.assign(d.paint, data.paint || {}),
        vehicles: Object.assign(d.vehicles, data.vehicles || {}),
        unlocked: data.unlocked || {},
        padPaid: data.padPaid || {},
        pos: data.pos || null,
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
      // remember where you are (on foot only; mid-ride the last spot stands)
      if (this.player && !this.driving && !this.onTrain && !this.travel && !this.ride) this.s.pos = { x: Math.round(this.player.x), y: Math.round(this.player.y), area: this.area };
      localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(this.s));
    } catch (e) { /* storage may be unavailable */ }
  },

  // Emergency exit from anywhere: back on the pizzeria floor on foot, every ride, vehicle, overlay and
  // scripted scene dropped. Nothing bought or earned is lost.
  goHome() {
    if (this.driving) { this.driving = false; this.vehicle = null; }
    this.onTrain = false; this.ride = null; this.fishing = null; this.travel = null; this.inPaintBay = false;
    for (const e of this.ext) if (e.home) e.home(this);
    this.area = 'town';
    const st = CFG.PLAYER_START; this.player.x = st.x; this.player.y = st.y; this.player.moving = false; this.player.hasMoved = false;
    this.cameraSnap = true; this.save();
    this.toast('🏠 Back at the pizza shop!', true);
  },

  reset() {
    try { localStorage.removeItem(CFG.SAVE_KEY); } catch (e) { /* ignore */ }
    this.s = this.defaultState();
    for (const e of this.ext) if (e.defaults) for (const k of Object.keys(e.defaults)) this.s[k] = JSON.parse(JSON.stringify(e.defaults[k]));
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
  iceCreamPrice() { return Math.round(CFG.ICE_CREAM.price * (1 + 0.3 * this.s.iceCream.flavors)); },
  iceCreamSpawn() { return CFG.ICE_CREAM.spawnBase / (1 + 0.25 * this.s.iceCream.flavors); },
  flavorsCost() { const IC = CFG.ICE_CREAM; return this.s.iceCream.flavors >= IC.flavorsMax ? null : Math.round(IC.flavorsBase * Math.pow(IC.flavorsGrowth, this.s.iceCream.flavors)); },
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
  staffSpeed(role) { return 145 + 20 * this.s.staff[role].level; },
  helperCap() { return 3 + 2 * this.s.staff.helper.level; },
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
  // What a staff pad does next. Default: hire while there are openings, then train.
  // mode 'hire' / 'train' splits the two onto separate pads (used for helpers).
  staffPadAction(role, mode) {
    const hire = this.staffHireCost(role);
    const up = this.staffUpgradeCost(role);
    if (mode === 'hire') return hire !== null ? { action: 'hire', cost: hire } : null;
    if (mode === 'train') return up !== null && this.s.staff[role].count > 0 ? { action: 'train', cost: up } : null;
    if (hire !== null) return { action: 'hire', cost: hire };
    if (up !== null) return { action: 'train', cost: up };
    return null;
  },
  applyStaffPad(role, mode) {
    const a = this.staffPadAction(role, mode);
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
        const info = this.s.staff[p.key];
        if (p.mode === 'train' && info.count < 1) continue; // training pad appears once somebody is hired
        const a = this.staffPadAction(p.key, p.mode);
        const label = a ? (a.action === 'hire' ? 'Hire ' + st.name : 'Train ' + st.name) : (p.mode === 'hire' ? st.name + 's' : st.name);
        out.push({ key: p.key + (p.mode ? '_' + p.mode : ''), role: p.key, mode: p.mode, kind: 'staff', label, ico: p.mode === 'train' ? '⭐' : st.ico, pos: p.pos, price: a ? a.cost : 0, maxed: !a, sub: p.mode === 'train' ? `Lv ${info.level}/${st.upMax}` : info.count ? `${info.count} hired${p.mode ? '' : ' · Lv ' + info.level}` : '' });
      }
    }
    const IC = CFG.ICE_CREAM;
    if (!this.s.iceCream.owned) out.push({ key: 'icecream', kind: 'icecream', label: 'Buy Ice Cream Shop', ico: '🍦', pos: IC.buyPad, price: IC.price, maxed: false, sub: 'earns money for you' });
    else { const c = this.flavorsCost(); out.push({ key: 'flavors', kind: 'flavors', label: 'More Flavors', ico: '🍨', pos: IC.flavorsPad, price: c || 0, maxed: c === null, sub: `${this.s.iceCream.flavors}/${IC.flavorsMax}` }); }
    const SR = CFG.GARAGE.showroom;
    if (!this.s.vehicles.car) out.push({ key: 'buyCar', kind: 'vehicle', vkind: 'car', label: 'Delivery Car', ico: '🚗', pos: SR.car.pad, price: SR.car.price, maxed: false, sub: 'deliveries pay double' });
    if (!this.s.vehicles.bike) out.push({ key: 'buyBike', kind: 'vehicle', vkind: 'bike', label: 'Scooter', ico: '🛵', pos: SR.bike.pad, price: SR.bike.price, maxed: false, sub: 'zippy!' });
    for (const e of this.ext) if (e.pads) for (const p of e.pads(this)) out.push(Object.assign({ kind: 'ext', ext: e, maxed: false, sub: '' }, p));
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
    else if (pad.kind === 'icecream') { this.s.iceCream.owned = true; Sfx.unlock(); Haptics.success(); this.toast('🍦 You own the ice cream shop!', true); }
    else if (pad.kind === 'flavors') { this.s.iceCream.flavors++; this.toast(`More flavors! ${this.s.iceCream.flavors}/${CFG.ICE_CREAM.flavorsMax}`); }
    else if (pad.kind === 'vehicle') { this.s.vehicles[pad.vkind] = true; this.s.paint[pad.vkind] = '#ffffff'; Sfx.unlock(); Haptics.success(); this.toast(`${pad.ico} Your new ${pad.label.toLowerCase()}! Drive it into the bay to pick a colour`, true, 'town'); }
    else if (pad.kind === 'ext') pad.ext.onPad(this, pad);
    else this.applyStaffPad(pad.role, pad.mode);
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
  // How many more pizzas a stack needs: what the people waiting on it still want, minus what is already there.
  stackNeed(key) {
    const wanted = key === 'display'
      ? this.customers.filter((c) => c.inMainQueue || c.entering).reduce((n, c) => n + (c.want - c.have), 0)
      : this.cars.filter((c) => c.inLine).reduce((n, c) => n + (c.want - c.have), 0);
    return wanted - this.s.piles[key];
  },
  // Where a helper should take pizzas: the stack with the biggest unmet demand, else the emptiest one.
  bestDropTarget(exclude) {
    let best = null, bestScore = -Infinity;
    for (const t of this.dropTargets()) {
      if (exclude && t.key === exclude) continue;
      if (this.s.piles[t.key] >= t.cap) continue;
      const need = this.stackNeed(t.key);
      const score = need > 0 ? 100 + need : (1 - this.s.piles[t.key] / t.cap);
      if (score > bestScore) { bestScore = score; best = t; }
    }
    return best;
  },
  queueIndex(c) { let i = 0; for (const o of this.customers) { if (o === c) return i; if (o.inMainQueue) i++; } return i; },
  payIndex(c) { let i = 0; for (const o of this.customers) { if (o === c) return i; if (o.inPayQueue) i++; } return i; },
  carIndex(c) { let i = 0; for (const o of this.cars) { if (o === c) return i; if (o.inLine) i++; } return i; },
  countMainQueue() { return this.customers.filter((c) => c.inMainQueue || c.entering).length; },
  insideBuilding(x, y) { const b = CFG.BUILDING; return x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1; },
  // which map the player is on: the pizza town or Construction Town down the line
  bounds() { return CFG.AREAS[this.area].WORLD; },
  station() { return this.area === 'site' ? CFG.SITE.STATION : CFG.STATION; },
  currentTrain() { return this.area === 'site' ? this.siteTrain : this.train; },

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
  // Only important news goes to the big toasts at the top; small stuff floats up from the chef.
  // where: the map the news is about; an important toast about the town is not shown while you are away
  toast(msg, important = false, where = 'any') {
    if (important) { if (where !== 'any' && this.area !== where) return; if (this.onToast) this.onToast(msg); return; }
    this.floats.push({ x: this.player.x, y: this.player.y - 70, text: msg, color: '#ffe08a', t: 0, dur: 1.6, big: true });
  },

  unlock(key) {
    this.s.unlocked[key] = true;
    delete this.s.padPaid[key];
    Sfx.unlock(); Haptics.success();
    const pad = CFG.PADS.find((p) => p.key === key);
    if (key === 'station') {
      // the line reopens: first train in a little while
      const S = CFG.STATION; this.train.timer = U.rand(S.first[0], S.first[1]); this.train.warned = false;
      this.toast('🚂 The station is fixed! Trains are running!', true);
    } else this.toast(`Unlocked: ${pad.label}!`);
    if (this.onUnlock) this.onUnlock(key);
  },

  // ---------- update loop ----------
  update(dt) {
    const s = this.s;
    this.time += dt;
    if (this.travel) this.updateTravel(dt);
    if (this.driving) this.updateDriving(dt); else if (this.onTrain) this.updateOnTrain(dt); else if (this.ride) this.updateRide(dt); else this.updatePlayer(dt);
    this.updateSite(dt);
    for (const e of this.ext) if (e.update) e.update(this, dt);
    this.updateFishing(dt);
    this.updateOvens(dt);
    this.updateInteractions(dt);
    this.updateSpawns(dt);
    this.updateOutside(dt);
    this.updateTown(dt);
    this.updateFarm(dt);

    for (const c of this.customers) c.update(dt, this);
    this.customers = this.customers.filter((c) => c.state !== 'gone');
    for (const c of this.cars) c.update(dt, this);
    this.cars = this.cars.filter((c) => c.state !== 'gone');
    for (const st of this.staff) st.update(dt, this);
    this.dog.update(dt, this);
    for (const c of this.icCustomers) c.update(dt, this);
    this.fireTruck.update(dt, this);
    this.train.update(dt, this);
    this.siteTrain.update(dt, this);
    this.icCustomers = this.icCustomers.filter((c) => c.state !== 'gone');

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
      p.hasMoved = true;
      if (a.x) p.facing = a.x < 0 ? -1 : 1;
      p.bob += dt * 14;
      const r = 12, w = this.bounds();
      // an obstacle you are already inside (one that just appeared under you, say a bought decoration) never
      // shoves you: it is ignored until you have stepped out of it, so you can never be flung through a wall
      const obstacles = this.obstacles().filter((o) => !this.hitRect(p.x, p.y, r, o));
      p.x = U.clamp(p.x + a.x * sp * dt, w.x0 + 16, w.x1 - 16);
      for (const o of obstacles) if (this.hitRect(p.x, p.y, r, o)) p.x = a.x > 0 ? o.x - r : o.x + o.w + r;
      p.y = U.clamp(p.y + a.y * sp * dt, w.y0 + 16, w.y1 - 16);
      for (const o of obstacles) if (this.hitRect(p.x, p.y, r, o)) p.y = a.y > 0 ? o.y - r : o.y + o.h + r;
    }
    this.checkRides();
  },
  // Construction Town: station house, the half-built house's walls (with a door gap), crane base, toilet, barrels, pallets
  siteObstacles(forCar) {
    const S = CFG.SITE, B = S.BUILDING, H = S.STATION.house, o = [];
    o.push({ x: H.x0, y: H.y0, w: H.x1 - H.x0, h: H.y1 - H.y0 });
    const fw = 8;
    o.push({ x: B.x0, y: B.y0, w: B.x1 - B.x0, h: fw });
    o.push({ x: B.x0, y: B.y0, w: fw, h: B.y1 - B.y0 });
    o.push({ x: B.x1 - fw, y: B.y0, w: fw, h: B.y1 - B.y0 });
    o.push({ x: B.x0, y: B.y1 - fw, w: B.door.x - B.door.half - B.x0, h: fw });
    o.push({ x: B.door.x + B.door.half, y: B.y1 - fw, w: B.x1 - (B.door.x + B.door.half), h: fw });
    o.push({ x: S.CRANE.x - 22, y: S.CRANE.y - 22, w: 44, h: 44 });
    o.push({ x: S.TOILET.x - 16, y: S.TOILET.y - 30, w: 32, h: 40 });
    for (const [x, y] of S.BARRELS) o.push({ x: x - 10, y: y - 14, w: 20, h: 20 });
    for (const [x, y] of S.PALLETS) o.push({ x: x - 24, y: y - 16, w: 48, h: 30 });
    return o;
  },
  obstacles() {
    for (const e of this.ext) if (e.obstaclesOverride) { const o = e.obstaclesOverride(this); if (o) return o; }   // e.g. walking on a roof: only the roof's edges count
    const b = CFG.BUILDING, d = CFG.DOOR;
    const o = [
      { x: b.x0 - 6, y: b.y0, w: b.x1 - b.x0 + 6, h: 12 },               // top wall
      { x: b.x0 - 6, y: b.y0, w: 6, h: b.y1 - b.y0 },                      // left wall
      { x: b.x0 - 6, y: b.y1 - 6, w: b.x1 - b.x0 + 6, h: 6 },              // bottom wall
      { x: b.x1 - 6, y: b.y0, w: 6, h: d.y0 - b.y0 },                      // right wall above door
      { x: b.x1 - 6, y: d.y1, w: 6, h: b.y1 - d.y1 },                      // right wall below door
      { x: CFG.COUNTER.x1 + 10, y: CFG.COUNTER.y + 6, w: CFG.COUNTER.x2 - CFG.COUNTER.x1 - 20, h: CFG.COUNTER.h - 12 }, // a bit smaller than the counter so corners can be cut
    ];
    for (let i = 0; i < this.ovenCount(); i++) o.push({ x: CFG.OVENS[i].x - 36, y: CFG.OVENS[i].y - 30, w: 72, h: 60 });
    for (const t of this.activeTables()) o.push({ x: t.x - 18, y: t.y - 10, w: 36, h: 22 });
    const pt = CFG.PREP_TABLE; o.push({ x: pt.x - pt.w / 2, y: pt.y - pt.h / 2, w: pt.w, h: pt.h });
    return o.concat(this.townObstacles(false));
  },
  // Town buildings. The ice cream shop has a door gap in its bottom wall for people; cars see it solid.
  townObstacles(forCar) {
    const o = this.siteObstacles(forCar);
    for (const e of this.ext) if (e.obstacles) o.push(...e.obstacles(this, forCar));
    const IC = CFG.ICE_CREAM.rect, dw = CFG.ICE_CREAM.doorW / 2, dx = CFG.ICE_CREAM.door.x;
    if (forCar) o.push({ x: IC.x0, y: IC.y0, w: IC.x1 - IC.x0, h: IC.y1 - IC.y0 });
    else {
      o.push({ x: IC.x0, y: IC.y0, w: IC.x1 - IC.x0, h: 6 });
      o.push({ x: IC.x0, y: IC.y0, w: 6, h: IC.y1 - IC.y0 });
      o.push({ x: IC.x1 - 6, y: IC.y0, w: 6, h: IC.y1 - IC.y0 });
      o.push({ x: IC.x0, y: IC.y1 - 6, w: dx - dw - IC.x0, h: 6 });
      o.push({ x: dx + dw, y: IC.y1 - 6, w: IC.x1 - (dx + dw), h: 6 });
      o.push({ x: CFG.ICE_CREAM.counter.x - 50, y: CFG.ICE_CREAM.counter.y - 8, w: 100, h: 16 });
    }
    for (const h of CFG.HOUSES) o.push({ x: h.x0, y: h.y0, w: h.x1 - h.x0, h: h.y1 - h.y0 });
    const GA = CFG.GARAGE, gd = GA.door;
    o.push({ x: GA.x0, y: GA.y0, w: gd.x - gd.half - GA.x0, h: 8 }, { x: gd.x + gd.half, y: GA.y0, w: GA.x1 - (gd.x + gd.half), h: 8 });
    o.push({ x: GA.x0, y: GA.y0, w: 8, h: GA.y1 - GA.y0 }, { x: GA.x1 - 8, y: GA.y0, w: 8, h: GA.y1 - GA.y0 }, { x: GA.x0, y: GA.y1 - 8, w: GA.x1 - GA.x0, h: 8 });
    const F = CFG.FIRE_STATION; o.push({ x: F.x0, y: F.y0, w: F.x1 - F.x0, h: F.y1 - F.y0 });
    const B2 = CFG.FARM.barn; o.push({ x: B2.x0 + 24, y: B2.y0, w: B2.x1 - B2.x0 - 24, h: B2.y1 - B2.y0 });   // a slot behind the barn leads to the hidden fence gap
    // farm fences: perimeter with the east gate open, cow pen with a gate in its bottom rail
    const FA = CFG.FARM, G = FA.gate, P = FA.pen, PG = FA.penGate, fw = 8;
    const SG = FA.secretGate;   // the west fence has a hidden gap behind the barn
    o.push({ x: FA.x0, y: FA.y0 - 4, w: FA.x1 - FA.x0, h: fw }, { x: FA.x0, y: FA.y1 - 4, w: FA.x1 - FA.x0, h: fw });
    o.push({ x: FA.x0 - 4, y: FA.y0, w: fw, h: SG.y - SG.half - FA.y0 }, { x: FA.x0 - 4, y: SG.y + SG.half, w: fw, h: FA.y1 - (SG.y + SG.half) });
    o.push({ x: FA.x1 - 14, y: FA.y0, w: fw, h: G.y - G.half - FA.y0 }, { x: FA.x1 - 14, y: G.y + G.half, w: fw, h: FA.y1 - (G.y + G.half) });
    o.push({ x: P.x0, y: P.y0 - 4, w: P.x1 - P.x0, h: fw }, { x: P.x0 - 4, y: P.y0, w: fw, h: P.y1 - P.y0 }, { x: P.x1 - 4, y: P.y0, w: fw, h: P.y1 - P.y0 });
    o.push({ x: P.x0, y: P.y1 - 4, w: PG.x - PG.half - P.x0, h: fw }, { x: PG.x + PG.half, y: P.y1 - 4, w: P.x1 - (PG.x + PG.half), h: fw });
    const H = CFG.STATION.house; o.push({ x: H.x0, y: H.y0, w: H.x1 - H.x0, h: H.y1 - H.y0 });
    o.push({ x: CFG.FARM.silo.x - 22, y: CFG.FARM.silo.y - 40, w: 44, h: 80 });
    if (forCar) {
      const B = CFG.BUILDING; o.push({ x: B.x0 - 6, y: B.y0, w: B.x1 - B.x0 + 6, h: B.y1 - B.y0 });
      const pd = CFG.POND; o.push({ x: pd.x - pd.rx, y: pd.y - pd.ry, w: pd.rx * 2, h: pd.ry * 2 });
      const f = CFG.FOUNTAIN; o.push({ x: f.x - 60, y: f.y - 32, w: 120, h: 64 });
      for (let i = 0; i < 2; i++) o.push({ x: CFG.OVENS[i].x, y: CFG.OVENS[i].y, w: 0, h: 0 });
    }
    return o;
  },

  // ---------- farm: pick ingredients, cow gives cheese ----------
  addIngredient(kind, x, y) {
    const f = this.s.farm;
    f[kind]++;
    this.floats.push({ x, y: y - 34, text: CFG.INGREDIENTS[kind] + ' +1', color: '#ffe08a', t: 0, dur: 1, big: true });
    this.fx.push({ kind: 'sparkle', x0: x, y0: y, x1: x, y1: y, t: 0, dur: 0.5 });
    Sfx.pickup(); Haptics.tap();
    return true;
  },
  updateFarm(dt) {
    const p = this.player, F = CFG.FARM;
    for (const pl of this.plots) {
      if (!pl.ready) { pl.t -= dt; if (pl.t <= 0) pl.ready = true; continue; }
      // on foot, or riding the tractor (a car or scooter cannot harvest)
      const harvester = !this.driving || this.vehicle.kind === 'tractor';
      if (harvester && U.dist(p.x, p.y, pl.x, pl.y) < (this.driving ? 44 : 34)) { if (this.addIngredient(pl.kind, pl.x, pl.y)) { pl.ready = false; pl.t = F.regrow[pl.kind]; } }
    }
    const c = this.cow;
    c.moo = Math.max(0, c.moo - dt); c.timer -= dt;
    if (!c.ready) { c.t -= dt; if (c.t <= 0) c.ready = true; }
    if (!c.target || c.timer <= 0) { c.target = { x: U.rand(F.pen.x0 + 30, F.pen.x1 - 30), y: U.rand(F.pen.y0 + 30, F.pen.y1 - 24) }; c.timer = U.rand(3, 7); }
    if (U.moveToward(c, c.target.x, c.target.y, 28, dt)) { c.moving = false; c.target = null; c.timer = U.rand(2, 5); } else c.bob += dt * 6;
    if (c.ready && (!this.driving || this.vehicle.kind === 'tractor') && U.dist(p.x, p.y, c.x, c.y) < 56) {
      if (this.addIngredient('cheese', c.x, c.y)) { c.ready = false; c.t = F.regrow.cheese; c.moo = 1.5; this.floats.push({ x: c.x, y: c.y - 56, text: 'Moo!', color: '#2b1d14', t: 0, dur: 1.2, big: true }); }
    }
  },
  nearFarm() { const p = this.player, F = CFG.FARM; return p.x > F.x0 - 80 && p.x < F.x1 + 80 && p.y > F.y0 - 60 && p.y < F.y1; },

  // ---------- the one big action button: make a pizza, fish, ride the train ----------
  actionLabel() {
    if (this.travel) return null;
    if (this.onTrain) return this.currentTrain().state === 'stopped' ? '🚶 Hop off the train' : null;
    if (this.fishing) return this.fishing.phase === 'bite' ? '🎣 Reel in!' : this.fishing.phase === 'wait' ? '🎣 Wait for it…' : null;
    for (const e of this.ext) if (e.action) { const a = e.action(this); if (a) return a.label; }
    if (this.nearPrep) return '👐 Make a pizza';
    if (this.nearPond) return '🎣 Go fishing';
    if (this.nearTrain) return '🚂 Ride the train';
    return null;
  },
  doAction() {
    if (this.travel) return;
    if (this.onTrain) { if (this.currentTrain().state === 'stopped') this.leaveTrain(); return; }
    if (this.fishing) { this.reel(); return; }
    for (const e of this.ext) if (e.action) { const a = e.action(this); if (a) { a.run(this); return; } }
    if (this.nearPrep) { if (this.onMakePizza) this.onMakePizza(); return; }
    if (this.nearPond) { this.startFishing(); return; }
    if (this.nearTrain) { this.boardTrain(); return; }
  },

  // ---------- fishing ----------
  startFishing() {
    const F = CFG.FISHING;
    this.player.x = F.spot.x; this.player.y = F.spot.y; this.player.moving = false;
    this.fishing = { phase: 'wait', t: 0, biteT: U.rand(F.bite[0], F.bite[1]), splash: 0 };
  },
  reel() {
    const f = this.fishing; if (!f || f.phase === 'done') return;
    const F = CFG.FISHING;
    if (f.phase === 'bite') {
      const total = F.catches.reduce((n, c) => n + c.weight, 0); let r = Math.random() * total; let got = F.catches[0];
      for (const c of F.catches) { r -= c.weight; if (r <= 0) { got = c; break; } }
      f.phase = 'done'; f.t = 0; f.result = got;
      if (got.value > 0) { this.s.cash += got.value; this.s.stats.earned += got.value; }
      this.s.stats.fish = (this.s.stats.fish || 0) + (got.kind === 'boot' ? 0 : 1);
      this.floats.push({ x: F.bobber.x, y: F.bobber.y - 30, text: `${got.ico} ${got.label}${got.value ? ' +' + U.money(got.value) : ''}`, color: '#ffe08a', t: 0, dur: 1.8, big: true });
      this.fx.push({ kind: 'sparkle', x0: F.bobber.x, y0: F.bobber.y, x1: F.bobber.x, y1: F.bobber.y, t: 0, dur: 0.6 });
      if (got.kind === 'boot') Sfx.error(); else { Sfx.cash(); Haptics.success(); }
    } else {
      f.phase = 'done'; f.t = 0; f.result = null;
      this.floats.push({ x: F.bobber.x, y: F.bobber.y - 30, text: 'Too early!', color: '#8a7a6a', t: 0, dur: 1.2 });
    }
  },
  updateFishing(dt) {
    const f = this.fishing; if (!f) return;
    f.t += dt; f.splash = Math.max(0, f.splash - dt);
    if (f.phase === 'wait' && f.t >= f.biteT) { f.phase = 'bite'; f.t = 0; f.splash = 0.6; Sfx.pickup(); Haptics.tap(); }
    else if (f.phase === 'bite' && f.t > CFG.FISHING.window) { f.phase = 'done'; f.t = 0; f.result = null; this.floats.push({ x: CFG.FISHING.bobber.x, y: CFG.FISHING.bobber.y - 30, text: 'It got away!', color: '#8a7a6a', t: 0, dur: 1.2 }); }
    else if (f.phase === 'done' && f.t > 1.3) { this.fishing = null; }
    const a = Input.axis(); if (f.phase !== 'done' && (a.x || a.y)) this.fishing = null; // walking away stops fishing
  },

  // ---------- riding the train ----------
  // climbing aboard: the train pulls out right away (a second to settle in)
  boardTrain() { const t = this.currentTrain(); this.onTrain = true; this.player.moving = false; if (t.remote) t.departIn = 1; else { t.unload = Math.min(t.unload, 1); t.hold = 0; t.toDrop = 0; } Haptics.tap(); },
  leaveTrain() { const st = this.station(); this.onTrain = false; this.player.x = st.stopX + st.boardDx; this.player.y = st.platform.y1 - 12; this.player.hasMoved = true; },
  updateOnTrain(dt) { const t = this.currentTrain(); this.player.x = t.x + this.station().boardDx + 60; this.player.y = t.y; this.player.moving = false; this.player.hasMoved = true; },

  // ---------- the ride between towns, and Construction Town itself ----------
  // via: 'train' (the core's mountain ride) or an extension's own ride ('bus', 'ferry', ...) which draws and lands itself
  startTravel(to, via = 'train', dur = CFG.TRAVEL.dur) { this.travel = { t: 0, dur, to, via, from: this.area }; if (via === 'train') Sfx.whistle(); },
  updateTravel(dt) {
    const tr = this.travel; tr.t += dt;
    if (tr.via === 'train') { tr.chug = (tr.chug || 0) - dt; if (tr.chug <= 0) { Sfx.chuff(); tr.chug = tr.t < 1.2 || tr.t > tr.dur - 1.2 ? 0.34 : 0.21; } }
    if (tr.t < tr.dur) return;
    this.travel = null; this.area = tr.to; this.cameraSnap = true;
    if (tr.via === 'train') {
      const t = this.currentTrain(); t.summon(); this.player.x = t.x - 240; this.player.y = t.y;
      this.toast(tr.to === 'site' ? '🏗️ Welcome to Construction Town!' : '🍕 Home sweet home!', true);
    }
    for (const e of this.ext) if (e.arrive) e.arrive(this, tr);
  },
  updateSite(dt) {
    const S = CFG.SITE;
    for (const m of this.mounds) if (m.flat) { m.t -= dt; if (m.t <= 0) { m.flat = 0; this.floats.push({ x: m.x, y: m.y - 30, text: 'Fresh dirt!', color: '#ffe08a', t: 0, dur: 1 }); } }
    const v = this.vehicle;
    if (this.driving && this.isSiteVehicle(v)) {
      const speed = Math.hypot(v.vx, v.vy);
      if (v === this.excavator) v.arm += dt * (speed > 15 ? 5 : 1.5);
      for (const m of this.mounds) {
        if (m.flat || speed < 30 || U.dist(v.x, v.y, m.x, m.y) > m.r + 8) continue;
        m.flat = 1; m.t = S.MOUND_REGROW;
        this.s.cash += S.FLATTEN_PAY; this.s.stats.earned += S.FLATTEN_PAY; this.s.stats.dirt = (this.s.stats.dirt || 0) + 1;
        for (let i = 0; i < 10; i++) this.fx.push({ kind: 'dirt', x0: m.x + U.rand(-m.r, m.r) * 0.6, y0: m.y - 10, x1: m.x + U.rand(-m.r, m.r) * 1.4, y1: m.y + U.rand(-10, 16), t: -i * 0.02, dur: 0.45 });
        this.floats.push({ x: m.x, y: m.y - 36, text: '+' + U.money(S.FLATTEN_PAY), color: '#ffe08a', t: 0, dur: 1, big: true });
        Sfx.drop(); Haptics.tap();
      }
    }
  },

  // ---------- handmade pizza (mini-game reward) ----------
  finishHandmade(result) {
    const p = this.player, n = CFG.HANDMADE_PIZZAS + (result.farmBonus || 0);
    const room = Math.max(0, this.playerCap() - p.carry);
    const carried = Math.min(n, room); p.carry += carried;
    const extra = n - carried; if (extra > 0) this.s.piles.oven = Math.min(this.ovenPileCap() + extra, this.s.piles.oven + extra);
    this.s.stats.handmade = (this.s.stats.handmade || 0) + 1;
    for (let i = 0; i < n; i++) this.fx.push({ kind: 'pizza', x0: CFG.PREP_TABLE.x, y0: CFG.PREP_TABLE.y - 10, x1: p.x, y1: p.y - 30, t: -i * 0.08, dur: 0.3 });
    this.floats.push({ x: p.x, y: p.y - 60, text: result.crispy ? 'Extra crispy pizza!' : result.farmBonus ? 'Farm-fresh pizza!' : 'Handmade pizza!', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    this.toast(`counts as ${n} pizzas!`);
  },

  // ---------- delivery vehicles (car and scooter) ----------
  vehicles() { const v = [this.tractor, this.excavator, this.dumptruck, this.bulldozer]; if (this.s.vehicles.car) v.push(this.car); if (this.s.vehicles.bike) v.push(this.bike); for (const e of this.ext) if (e.vehicles) v.push(...e.vehicles(this)); return v; },
  isSiteVehicle(v) { return v === this.excavator || v === this.dumptruck || v === this.bulldozer; },
  findNearVehicle() {
    if (this.driving) return null;
    let best = null, bd = 70;
    for (const v of this.vehicles()) { const d = U.dist(this.player.x, this.player.y, v.x, v.y); if (d < bd) { bd = d; best = v; } }
    return best;
  },
  canEnterCar() { return !!this.findNearVehicle(); },
  enterCar() { const v = this.findNearVehicle(); if (!v) return; this.vehicle = v; this.driving = true; v.vx = 0; v.vy = 0; Haptics.tap(); },
  paintVehicle(color) {
    if (!this.driving) return;
    this.s.paint[this.vehicle.kind] = color;
    for (let i = 0; i < 10; i++) this.fx.push({ kind: 'sparkle', x0: this.vehicle.x + U.rand(-30, 30), y0: this.vehicle.y + U.rand(-20, 20), x1: 0, y1: 0, t: -i * 0.05, dur: 0.5 });
    Haptics.tap();
  },
  exitCar() {
    if (!this.driving) return;
    const c = this.vehicle, spec = CFG.VEHICLES[c.kind], w = this.bounds(), obs = this.obstacles();
    // step off beside it, on a spot that is not inside anything (a flying vehicle also looks a little further out)
    const cands = [[0, 46], [46, 0], [-46, 0], [0, -46]];
    if (spec.flies) for (const d of [46, 64]) for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; cands.push([Math.cos(a) * d, Math.sin(a) * d]); }
    let spot = null;
    for (const [dx, dy] of cands) {
      const x = c.x + dx, y = c.y + dy;
      if (x < w.x0 + 16 || x > w.x1 - 16 || y < w.y0 + 16 || y > w.y1 - 16) continue;
      if (!obs.some((o) => this.hitRect(x, y, 12, o))) { spot = { x, y }; break; }
    }
    // a flying vehicle will not set you down in the trees or on a roof: it keeps flying until there is room to step out
    if (!spot && spec.flies) {
      this.floats.push({ x: c.x, y: c.y - 70, text: 'No room to land here! Find a clear spot', color: '#ffe08a', t: 0, dur: 1.6, big: true });
      Sfx.error(); Haptics.tap();
      return;
    }
    this.inPaintBay = false;
    this.driving = false; this.vehicle = null; c.vx = 0; c.vy = 0;
    this.player.x = spot ? spot.x : c.x; this.player.y = spot ? spot.y : c.y + 46;
  },
  updateDriving(dt) {
    const c = this.vehicle, a = Input.axis();
    const spec = CFG.VEHICLES[c.kind];
    const sp = spec.speed;
    const tx = a.x * sp, ty = a.y * sp;
    const k = (a.x || a.y) ? 1 - Math.pow(0.02, dt) : 1 - Math.pow(0.001, dt); // snappy accelerate, quick stop
    c.vx += (tx - c.vx) * k; c.vy += (ty - c.vy) * k;
    const speed = Math.hypot(c.vx, c.vy);
    if (speed > 15) { const target = Math.atan2(c.vy, c.vx); let d = target - c.angle; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; c.angle += d * Math.min(1, dt * 10); }
    const r = spec.radius, w = this.bounds(), obs = spec.flies || c.free ? [] : this.townObstacles(true);   // a flying vehicle (or one taking off) passes over everything
    c.x = c.x + c.vx * dt; if (!c.free) c.x = U.clamp(c.x, w.x0 + 30, w.x1 - 30);   // `free`: a vehicle on its way off the map (a plane taking off)
    for (const o of obs) if (o.w && this.hitRect(c.x, c.y, r, o)) { c.x = c.vx > 0 ? o.x - r : o.x + o.w + r; c.vx = 0; }
    c.y = c.y + c.vy * dt; if (!c.free) c.y = U.clamp(c.y, w.y0 + 30, w.y1 - 30);
    for (const o of obs) if (o.w && this.hitRect(c.x, c.y, r, o)) { c.y = c.vy > 0 ? o.y - r : o.y + o.h + r; c.vy = 0; }
    this.player.x = c.x; this.player.y = c.y; this.player.moving = speed > 15; this.player.hasMoved = true;
    const GA = CFG.GARAGE; this.inPaintBay = c.x > GA.x0 + 20 && c.x < GA.x1 - 20 && c.y > GA.y0 + 30 && c.y < GA.y1 - 20 && speed < 15;
  },

  // ---------- town: house orders, ice cream shop ----------
  updateTown(dt) {
    const s = this.s, p = this.player;
    // new orders
    this.orderT -= dt;
    if (this.orderT <= 0) {
      this.orderT = U.rand(CFG.ORDER_EVERY[0], CFG.ORDER_EVERY[1]);
      const open = this.houses.filter((h) => !h.order);
      if (open.length && this.houses.filter((h) => h.order).length < CFG.ORDER_MAX) {
        const h = U.pick(open);
        h.order = { want: U.randInt(1, 3), have: 0, t: CFG.ORDER_WAIT };
        this.toast(`🍕 ${h.name} wants pizza!`, true, 'town');
      }
    }
    for (const h of this.houses) {
      h.happy = Math.max(0, h.happy - dt);
      if (!h.order) continue;
      h.order.t -= dt;
      if (h.order.t <= 0) { h.order = null; this.floats.push({ x: h.door.x, y: h.door.y - 40, text: 'Maybe next time', color: '#8a7a6a', t: 0, dur: 1.5 }); continue; }
      // deliver: by car or on foot, standing by the door with pizzas
      if (p.carry > 0 && U.dist(p.x, p.y, h.door.x, h.door.y) < 80 && p.xferCd <= 0) {
        p.carry--; h.order.have++; p.xferCd = CFG.XFER_DELAY * 2;
        const amt = Math.round(this.price() * CFG.DELIVERY_TIP);
        s.cash += amt; s.stats.earned += amt;
        this.fx.push({ kind: 'pizza', x0: p.x, y0: p.y - 30, x1: h.door.x, y1: h.door.y - 10, t: 0, dur: 0.25 });
        this.floats.push({ x: h.door.x, y: h.door.y - 30, text: '+' + U.money(amt), color: '#ffe08a', t: 0, dur: 1, big: true });
        Sfx.cash();
        if (h.order.have >= h.order.want) { h.order = null; h.happy = 3; s.stats.delivered++; this.floats.push({ x: h.door.x, y: h.door.y - 56, text: 'Thank you!', color: '#ff6b8a', t: 0, dur: 1.5, big: true }); Haptics.success(); }
      }
    }
    // ice cream shop runs itself once owned
    if (s.iceCream.owned) {
      this.icSpawnT -= dt;
      if (this.icSpawnT <= 0) {
        this.icSpawnT = this.iceCreamSpawn() * U.rand(0.6, 1.5);
        if (this.icCustomers.length < 4) this.icCustomers.push(new IceCreamCustomer(this.seq++));
      }
      const IC = CFG.ICE_CREAM;
      if (s.iceCream.cash > 0 && U.dist(p.x, p.y, IC.cash.x, IC.cash.y) < 50) {
        const amt = s.iceCream.cash; s.iceCream.cash = 0; s.cash += amt; s.stats.earned += amt;
        for (let i = 0; i < Math.min(8, Math.ceil(amt / 15)); i++) this.fx.push({ kind: 'bill', x0: IC.cash.x + U.rand(-14, 14), y0: IC.cash.y, x1: p.x, y1: p.y - 10, t: -i * 0.04, dur: 0.3, follow: true });
        this.floats.push({ x: p.x, y: p.y - 46, text: '+' + U.money(amt), color: '#ffe08a', t: 0, dur: 1, big: true });
        Sfx.cash(); Haptics.tap();
      }
    }
    this.nearVehicle = this.findNearVehicle(); this.carNear = !!this.nearVehicle;
    this.nearPrep = !this.driving && !this.onTrain && U.dist(p.x, p.y, CFG.PREP_TABLE.x, CFG.PREP_TABLE.y + 10) < 64;
    this.nearPond = !this.driving && !this.onTrain && U.dist(p.x, p.y, CFG.FISHING.spot.x, CFG.FISHING.spot.y) < 54;
    { const t = this.currentTrain(), st = this.station(); this.nearTrain = !this.driving && !this.onTrain && t.state === 'stopped' && p.y < 0 && Math.abs(p.x - (st.stopX + st.boardDx)) < 200; }
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
    // driving past the drive-thru window loads pizzas from the window stack onto the vehicle
    if (this.driving && this.isUnlocked('driveThru') && near(CFG.DT_WINDOW, 84) && s.piles.dt > 0 && p.carry < this.playerCap() && p.xferCd <= 0) {
      s.piles.dt--; p.carry++; p.xferCd = CFG.XFER_DELAY;
      this.fx.push({ kind: 'pizza', x0: CFG.DT_STACK.x, y0: CFG.DT_STACK.y - 10, x1: p.x, y1: p.y - 30, t: 0, dur: 0.2 });
      Sfx.pickup();
    }
    for (const t of this.driving ? [] : this.dropTargets()) {
      if (near(t.pos, 54) && p.carry > 0 && s.piles[t.key] < t.cap && p.xferCd <= 0) {
        s.piles[t.key]++; p.carry--; p.xferCd = CFG.XFER_DELAY;
        this.fx.push({ kind: 'pizza', x0: p.x, y0: p.y - 30, x1: t.pos.x, y1: t.pos.y - 10, t: 0, dur: 0.15 });
        Sfx.drop();
      }
    }
    // the bin by the station: walk up with pizzas to throw them away, one at a time
    const bin = CFG.STATION.trash;
    if (!this.driving && !this.onTrain && near(bin, 42) && p.carry > 0 && p.xferCd <= 0) {
      p.carry--; p.xferCd = CFG.XFER_DELAY * 2;
      this.fx.push({ kind: 'pizza', x0: p.x, y0: p.y - 30, x1: bin.x, y1: bin.y - 24, t: 0, dur: 0.2 });
      if (p.carry === 0) this.floats.push({ x: bin.x, y: bin.y - 40, text: 'All gone!', color: '#8a7a6a', t: 0, dur: 1 });
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
    // Nothing is bought until the player has moved at least once after loading, so a reload never buys by itself.
    for (const pad of this.allPads()) {
      if (pad.maxed || !p.hasMoved || this.driving || this.ride) continue;
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

  spawnTrainPassenger() {
    if (this.customers.length >= 22) return;
    const want = U.randInt(1, 2 + Math.floor(this.decorCount() / 3));
    const c = new Customer(this.seq++, want, true);
    this.customers.push(c);
  },

  // ---------- playground rides: walk onto a ride and it plays out on its own ----------
  updateRide(dt) {
    const r = this.ride, p = this.player; r.t += dt;
    const k = r.t / r.dur, def = r.def, x = def.x, y = def.y;
    p.moving = true; p.bob += dt * 10;
    if (def.kind === 'slide') {
      if (k < 0.45) { const c = k / 0.45; p.x = x; p.y = y + 36 - 56 * c; p.facing = 1; }
      else { const c = (k - 0.45) / 0.55; p.x = x + 80 * c; p.y = y - 20 + 60 * c; p.facing = 1; }
    } else if (def.kind === 'swing') {
      // pendulum from the top bar: rope length 70, swinging up to ~45 degrees each way
      const a = Math.sin(r.t * 4) * 0.8; r.angle = a; p.x = r.seatX + Math.sin(a) * 70; p.y = y + Math.cos(a) * 70 + 4; p.facing = Math.cos(r.t * 4) < 0 ? -1 : 1;
    } else if (def.kind === 'seesaw') {
      const b = Math.abs(Math.sin(r.t * 5)); p.x = x - 40; p.y = y - 10 - b * 26; r.tilt = Math.sin(r.t * 5);
    } else if (def.kind === 'spring') {
      r.bounce = Math.abs(Math.sin(r.t * 8)) * 22; p.x = x; p.y = y - 10 - r.bounce; p.facing = 1;
    }
    if (r.t >= r.dur) {
      if (def.kind === 'slide') { p.x = x + 100; p.y = y + 46; }
      else if (def.kind === 'swing') { p.x = r.seatX; p.y = y + 100; }
      else if (def.kind === 'seesaw') { p.x = x - 40; p.y = y + 28; }
      else { p.x = x; p.y = y + 30; }
      this.ride = null; this.rideLeft = false; p.moving = false;
    }
  },
  checkRides() {
    const p = this.player;
    let nearAny = false;
    for (const def of CFG.PLAYGROUND.rides) {
      const spots = def.kind === 'swing' ? [{ x: def.x - 24, y: def.y + 74 }, { x: def.x + 24, y: def.y + 74 }] : def.kind === 'slide' ? [{ x: def.x, y: def.y + 40 }] : def.kind === 'seesaw' ? [{ x: def.x - 40, y: def.y + 2 }] : [{ x: def.x, y: def.y + 16 }];
      for (const sp of spots) {
        if (U.dist(p.x, p.y, sp.x, sp.y) < 22) {
          nearAny = true;
          if (!this.rideLeft) return;
          const dur = def.kind === 'slide' ? 2.2 : def.kind === 'swing' ? 4 : def.kind === 'seesaw' ? 2 : 2.2;
          this.ride = { def, t: 0, dur, seatX: sp.x, tilt: 0 };
          this.floats.push({ x: p.x, y: p.y - 60, text: def.kind === 'seesaw' || def.kind === 'spring' ? 'Boing!' : 'Wheee!', color: '#ffe08a', t: 0, dur: 1.2, big: true });
          Haptics.tap();
          return;
        }
      }
    }
    if (!nearAny) this.rideLeft = true;
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
          const kind = Math.random() < CFG.FUN_CAR_CHANCE ? U.pick(CFG.FUN_CARS) : 'car';
          this.cars.push(new Car(this.seq++, U.randInt(1, 3 + Math.floor(this.decorCount() / 4)), kind));
        }
      }
    }
  },

  // Contextual hint: what should the player do next? Kept short and simple.
  siteHint() {
    const p = this.player;
    if (this.travel) return null;   // the ride draws its own banner
    if (this.onTrain) return { text: 'Choo choo! Enjoy the ride', target: null };
    if (this.nearTrain) return { text: 'Hop on the train to go home 🍕', target: null };
    if (this.driving) {
      const pile = this.mounds.filter((m) => !m.flat).sort((a, b) => U.dist(p.x, p.y, a.x, a.y) - U.dist(p.x, p.y, b.x, b.y))[0];
      return pile ? { text: 'Drive into the dirt piles to flatten them!', target: pile } : { text: 'Vroom! Big machines at work', target: null };
    }
    const v = [this.excavator, this.bulldozer, this.dumptruck].sort((a, b) => U.dist(p.x, p.y, a.x, a.y) - U.dist(p.x, p.y, b.x, b.y))[0];
    const names = { excavator: 'excavator', bulldozer: 'bulldozer', dumptruck: 'dump truck' };
    const coin = this.coins.filter((c) => !c.taken && c.x > CFG.SITE.WORLD.x0).sort((a, b) => U.dist(p.x, p.y, a.x, a.y) - U.dist(p.x, p.y, b.x, b.y))[0];
    if (coin && U.dist(p.x, p.y, coin.x, coin.y) < 300) return { text: 'Grab the shiny coin!', target: coin };
    return { text: `Hop on the ${names[v.kind]}!`, target: v };
  },
  computeHint() {
    const s = this.s, p = this.player;
    if (this.travel) { this.hint = this.siteHint(); return; }
    // Extensions answer in order. When the first answer points at something close by (a shop door, say) and other
    // extensions point at other close things, the nearest one wins, so two neighbouring doors never fight.
    const NEAR = 120;
    let first, best = null, bd = Infinity;
    for (const e of this.ext) if (e.hint) {
      const h = e.hint(this); if (h === undefined) continue;
      const d = h && h.target ? U.dist(p.x, p.y, h.target.x, h.target.y) : Infinity;
      if (first === undefined) { first = h; if (d > NEAR) break; }
      if (d < bd) { bd = d; best = h; }
    }
    if (first !== undefined) { this.hint = first && first.target && bd <= NEAR ? best : first; return; }
    if (this.area === 'site') { this.hint = this.siteHint(); return; }   // Construction Town's own hints, after the extensions had their say
    const hasCashier = this.staff.some((st) => st.role === 'cashier');
    const paying = this.customers.some((c) => c.state === 'paying' || c.state === 'toPay');
    const hasHelper = this.staff.some((st) => st.role === 'helper');
    let h = null;
    const order = this.houses.find((hh) => hh.order);
    if (order && p.carry > 0) h = { text: `Deliver to ${order.name}!`, target: order.door };
    else if (this.train.state === 'stopped' && !this.onTrain && !this.nearTrain && !this.driving) h = { text: `🚂 Train leaves in ${Math.ceil(this.train.leavesIn)}s!`, target: { x: CFG.STATION.stopX + CFG.STATION.boardDx, y: CFG.STATION.platform.y1 } };
    else if (this.driving) {
      const IC = CFG.ICE_CREAM;
      if (order && this.isUnlocked('driveThru') && s.piles.dt > 0) h = { text: 'Swing by the drive-thru window to load pizzas', target: CFG.DT_WINDOW };
      else if (s.iceCream.owned && s.iceCream.cash > 20) h = { text: 'Pick up the ice cream money', target: IC.cash };
      else h = { text: this.vehicle.kind === 'bike' ? 'Zoom! Ride around town' : 'Vroom! Drive around town', target: null };
    }
    else if (!this.insideBuilding(p.x, p.y)) {
      const IC = CFG.ICE_CREAM;
      const coin = this.coins.filter((c) => !c.taken).sort((a, b) => U.dist(p.x, p.y, a.x, a.y) - U.dist(p.x, p.y, b.x, b.y))[0];
      const ripe = this.nearFarm() ? this.plots.filter((pl) => pl.ready).sort((a, b) => U.dist(p.x, p.y, a.x, a.y) - U.dist(p.x, p.y, b.x, b.y))[0] : null;
      const PG = CFG.PLAYGROUND;
      if (this.onTrain) h = { text: 'Choo choo! Enjoy the ride', target: null };
      else if (this.fishing) h = { text: this.fishing.phase === 'bite' ? 'Now! Tap to reel in!' : 'Shh… wait for the bobber', target: null };
      else if (this.nearTrain) h = { text: 'Hop on the train!', target: null };
      else if (p.x > PG.x0 - 60 && p.x < PG.x1 + 60 && p.y > PG.y0 - 80) h = { text: 'Go play! Try the slide or the swings', target: null };
      else if (ripe) h = { text: `Pick the ${ripe.kind}! ${CFG.INGREDIENTS[ripe.kind]}`, target: ripe };
      else if (this.nearFarm() && this.cow.ready) h = { text: 'Say hi to the cow for cheese 🧀', target: this.cow };
      else if (s.iceCream.owned && s.iceCream.cash >= 30 && U.dist(p.x, p.y, IC.cash.x, IC.cash.y) < 500) h = { text: 'Collect the ice cream money', target: IC.cash };
      else if (coin && U.dist(p.x, p.y, coin.x, coin.y) < 420) h = { text: 'Grab the shiny coin!', target: coin };
      else if (order && !s.vehicles.car && !s.vehicles.bike) h = { text: 'Deliver on foot, or buy a car at the showroom!', target: CFG.GARAGE.showroom.car.pad };
      else if (order) h = { text: 'Grab pizzas, then deliver by car!', target: CFG.DOOR_OUT };
      else h = { text: 'Walk back to the pizza shop', target: CFG.DOOR_OUT };
    }
    else if (paying && !hasCashier && !this.cashierPresent()) h = { text: 'Stand at the register to take the money', target: CFG.CASHIER_SPOT };
    else if (this.nearPrep && p.carry === 0 && s.piles.oven === 0) h = { text: 'Make a pizza by hand!', target: null };
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
