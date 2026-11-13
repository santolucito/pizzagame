'use strict';
// THE SHARED RESTAURANT SYSTEM. Both restaurants, the pizzeria (the core: js/game.js, js/entities.js) and the burger
// shop (js/burger.js), run on these rules and this code:
//  * a production station (the ovens, the grills) makes items into a pile on a timer; upgrades make it faster and
//    let the pile hold more (Shop.produce, Shop.stationTime, Shop.stationCap);
//  * customers turn up at the door (now and then a small group), walk in, line up at the display, take what they
//    want, line up at the register and pay into the cash pile once somebody (the chef or a hired cashier) stands
//    behind it, then some sit at a table to eat and leave a tip, and leave (ShopCustomer, Shop.spawns). They have
//    patience: the bar over the first in line runs down, the face turns grumpy when it is low, and when it runs out
//    they leave angry ("Too slow!"). Waiting outside the door costs no patience;
//  * staff: a carrier (the pizzeria's helper, the burger cook) takes items from the pile to the display, a cashier
//    stands at the register, a cleaner (only where tables get messy) wipes the tables (ShopStaff);
//  * the chef grabs items at the pile, puts them on the display and walks over the cash pile (Shop.chef, Shop.pocket);
//  * every pad that levels up costs base × growth^level (Shop.cost);
//  * while the game is closed the station fills its pile and, with a carrier and a cashier hired, the shop keeps a
//    share of the money it was making per second before (Shop.meter, Shop.awaySeconds, Shop.awayEarnings).
// Each shop passes the shared code a small "shop" object with its places, art hooks, prices and timings; see
// PizzeriaShop (js/game.js) and BurgerShop (js/burger.js) for the full list of what it answers.

// The shared rules and timings, in one place. Per-shop numbers (prices, base times, pile sizes, patience, how many
// customers fit) live in each shop's config: CFG (js/config.js) for the pizzeria, CFG.BURGER for the burger shop.
const SHOP = {
  WALK: [115, 145],        // customers' walking speed (px/s), picked per customer
  LEAVE: 1.1,              // ...a little quicker on the way out
  TAKE_GAP: 0.25,          // seconds between items a customer (or a drive-thru car) lifts off the display
  XFER: 0.11,              // seconds between items the chef picks up or puts down
  GRUMPY: 0.25,            // patience left (share of full) below which the face turns grumpy (the bar is red there too)
  PATIENCE_PER_LV: 0.08,   // each "busyness" level (decorations, grill upgrades) makes customers this much more patient
  EAT_JITTER: [0.8, 1.2],  // a diner eats for the shop's eat time times this
  STATION_SPEEDUP: 0.25,   // each station upgrade level: time / (1 + this × level)
  STATION_CAP_LV: 2,       // ...and the pile holds this many more
  BUSY_PER_LV: 0.15,       // each busyness level: customers come this much more often
  GROUP_BASE: 0.22, GROUP_PER_LV: 0.04,   // the chance a new arrival brings friends
  PAY_SPEEDUP: 0.3,        // each cashier training level: checkout time / (1 + this × level)
  STAFF_SPEED: 145, STAFF_SPEED_LV: 20,   // hired staff's walking speed, and per training level
  STAFF_CAP: 3, STAFF_CAP_LV: 2,          // how many items a carrier takes, and per training level
  LOAD_GAP: 0.2, UNLOAD_GAP: 0.14,        // seconds between items a carrier picks up / puts down
  CHEF_CAP: 4, CHEF_CAP_GROWTH: 1.5,      // the chef's stack: 4, then ×1.5 per Carry More level
  PRICE_GROWTH: 1.5,       // default pad price growth per level
  AWAY_MIN: 30, AWAY_MAX: 3 * 3600, AWAY_SHARE: 0.5,   // offline catch-up: from 30 s, at most 3 h, half the rate
  RATE_SMOOTH: 0.04,       // how fast the measured money-per-second follows the real one
};

const Shop = {
  // ---------- numbers ----------
  cost(base, level, growth) { return Math.round(base * Math.pow(growth || SHOP.PRICE_GROWTH, level)); },
  stationTime(base, lv) { return base / (1 + SHOP.STATION_SPEEDUP * lv); },
  stationCap(base, lv) { return base + SHOP.STATION_CAP_LV * lv; },
  spawnInterval(base, lv) { return base / (1 + SHOP.BUSY_PER_LV * lv); },
  groupChance(lv) { return SHOP.GROUP_BASE + SHOP.GROUP_PER_LV * lv; },
  want(lv) { return U.randInt(1, 2 + Math.floor(lv / 3)); },
  patience(base, lv) { return base * (1 + SHOP.PATIENCE_PER_LV * lv); },
  payTime(base, lv) { return base / (1 + SHOP.PAY_SPEEDUP * lv); },
  staffSpeed(lv) { return SHOP.STAFF_SPEED + SHOP.STAFF_SPEED_LV * lv; },
  staffCap(lv) { return SHOP.STAFF_CAP + SHOP.STAFF_CAP_LV * lv; },
  chefCap(lv) { return Math.round(SHOP.CHEF_CAP * Math.pow(SHOP.CHEF_CAP_GROWTH, lv)); },

  // ---------- the station: each oven / grill bakes on its own timer into one pile ----------
  // timers: [{ t }] per station; n: how many are running; onMake(i): art and sound for a finished item
  produce(timers, n, time, piles, key, cap, dt, onMake) {
    for (let i = 0; i < n; i++) {
      const ov = timers[i];
      if (piles[key] >= cap) { ov.t = Math.min(ov.t, time * 0.98); continue; }   // a full pile waits, nearly done
      ov.t += dt;
      if (ov.t >= time) { ov.t = 0; piles[key]++; if (onMake) onMake(i); }
    }
  },

  // ---------- the door: irregular arrivals, sometimes a small group together ----------
  // sp holds spawnT, groupLeft, groupT; spawn() lets one customer in (the shop checks its own limits)
  spawns(sp, dt, interval, groupChance, spawn) {
    sp.spawnT -= dt;
    if (sp.spawnT <= 0) {
      const r = Math.random();
      sp.spawnT = interval * (r < 0.2 ? U.rand(0.25, 0.6) : r < 0.85 ? U.rand(0.6, 1.4) : U.rand(1.4, 2.2));
      const size = Math.random() < groupChance ? U.randInt(2, Math.random() < 0.3 ? 4 : 3) : 1;
      spawn();
      sp.groupLeft = size - 1; sp.groupT = U.rand(0.35, 0.7);
      if (size > 1) sp.spawnT += 0.6 * size;
    }
    if (sp.groupLeft > 0) {
      sp.groupT -= dt;
      if (sp.groupT <= 0) { sp.groupLeft--; sp.groupT = U.rand(0.35, 0.7); spawn(); }
    }
  },

  // ---------- lines ----------
  // c's place among the people in list for whom inLine(o) holds
  lineIndex(list, c, inLine) { let i = 0; for (const o of list) { if (o === c) return i; if (inLine(o)) i++; } return i; },
  // what the people coming in and waiting at the display still want
  lineWant(list) { return list.filter((c) => c.inMainQueue || c.entering).reduce((n, c) => n + (c.want - c.have), 0); },
  // the chef (on foot, in the shop's map, by its register) or a hired cashier who got there
  cashierPresent(g, shop) {
    if (shop.staff(g).some((w) => w.role === 'cashier' && w.state === 'working')) return true;
    const p = g.player, sp = shop.cashierSpot;
    return g.area === shop.area && !g.driving && !g.onTrain && !g.travel && !g.ride && U.dist(p.x, p.y, sp.x, sp.y) < 46;
  },
  // where a carrier should go: the stack with the biggest unmet demand, else the emptiest one
  bestTarget(shop, g, exclude) {
    const piles = shop.piles(g);
    let best = null, bestScore = -Infinity;
    for (const t of shop.dropTargets(g)) {
      if (exclude && t.key === exclude) continue;
      if (piles[t.key] >= t.cap) continue;
      const need = shop.stackNeed(g, t.key);
      const score = need > 0 ? 100 + need : (1 - piles[t.key] / t.cap);
      if (score > bestScore) { bestScore = score; best = t; }
    }
    return best;
  },
  // a stack is starving when it is empty and somebody is (or may soon be) waiting on it
  starving(shop, g) { const piles = shop.piles(g); return shop.dropTargets(g).some((t) => piles[t.key] === 0 && (t.main || shop.stackNeed(g, t.key) > 0)); },

  // ---------- the chef ----------
  // grab items at the pile, put them on a display, walk over the cash pile. hands: what holds the chef's stack
  // ({ carry, xferCd }: the player for pizzas, the burger shop's state for burgers); the caller counts xferCd down.
  chef(g, shop, hands, cap) {
    const p = g.player, piles = shop.piles(g), K = shop.keys, near = (pos, r) => U.dist(p.x, p.y, pos.x, pos.y) < r;
    if (hands.xferCd <= 0 && piles[K.made] > 0 && hands.carry < cap && near(shop.pile, 52)) {
      piles[K.made]--; hands.carry++; hands.xferCd = SHOP.XFER;
      shop.fly(g, shop.pile.x, shop.pile.y - 10, p.x, p.y - shop.handY, 0.15);
      Sfx.pickup();
    }
    for (const t of shop.dropTargets(g)) {
      if (hands.xferCd <= 0 && hands.carry > 0 && piles[t.key] < t.cap && near(t.pos, 54)) {
        piles[t.key]++; hands.carry--; hands.xferCd = SHOP.XFER;
        shop.fly(g, p.x, p.y - shop.handY, t.pos.x, t.pos.y - 10, 0.15);
        Sfx.drop();
      }
    }
    if (piles[K.cash] > 0 && near(shop.cashPile, 46)) { const amt = piles[K.cash]; piles[K.cash] = 0; Shop.pocket(g, amt, shop.cashPile); }
  },
  // money into the chef's pocket: bills fly from pos, a big "+$n" over his head
  pocket(g, amt, pos, prefix = '+', per = 15, most = 8) {
    if (amt <= 0) return;
    const p = g.player;
    g.s.cash += amt; g.s.stats.earned += amt;
    for (let i = 0; i < Math.min(most, Math.ceil(amt / per)); i++) g.fx.push({ kind: 'bill', x0: pos.x + U.rand(-14, 14), y0: pos.y + U.rand(-10, 4), x1: p.x, y1: p.y - 10, t: -i * 0.04, dur: 0.3, follow: true });
    g.floats.push({ x: p.x, y: p.y - 46, text: prefix + U.money(amt), color: '#ffe08a', t: 0, dur: 1, big: true });
    Sfx.cash(); Haptics.tap();
  },

  // ---------- money per second, and the time the game was closed ----------
  // m holds secT and secEarned (sales add to secEarned as they happen); returns the new smoothed rate
  meter(m, dt, rate) {
    m.secT = (m.secT || 0) + dt;
    if (m.secT < 1) return rate || 0;
    const r = U.lerp(rate || 0, (m.secEarned || 0) / m.secT, SHOP.RATE_SMOOTH);
    m.secEarned = 0; m.secT = 0;
    return r;
  },
  awaySeconds(g) { return Math.min(SHOP.AWAY_MAX, Math.max(0, (Date.now() - (g.s.savedAt || Date.now())) / 1000)); },
  // what a staffed shop made while you were away (nothing without a carrier and a cashier, or under AWAY_MIN)
  awayEarnings(sec, staffed, rate) { return sec >= SHOP.AWAY_MIN && staffed ? (rate || 0) * sec * SHOP.AWAY_SHARE : 0; },
};

// A customer of any shop. shop is the shop object (see the top of this file); the states are:
// 'route' (walking a list of waypoints, then `after`), 'toQueue' / 'queue' (the display line), 'toPay' / 'paying'
// (the register line), 'toTable', 'eating', 'gone'.
class ShopCustomer {
  constructor(shop, id, want) {
    this.shop = shop; this.id = id;
    this.x = 0; this.y = 0; this.route = []; this.after = 'toQueue'; this.state = 'route';
    this.want = want; this.have = 0;
    this.patienceMax = shop.patience(); this.patience = this.patienceMax;
    this.takeCd = 0; this.payProg = 0;
    this.table = null; this.timer = 0; this.eatDur = 0;
    this.left = false;      // leaving angry
    this.mult = 1;          // a special visitor pays and tips more
    this.facing = -1; this.moving = false;
    this.speed = U.rand(SHOP.WALK[0], SHOP.WALK[1]);
    this.shirt = U.pick(COLORS.shirts);
    this.skin = U.pick(COLORS.skins);
    this.hair = U.pick(['#2b1d14', '#5a3a1a', '#d9a066', '#1a1a1a', '#8c3b2f', '#c7c7c7']);
    this.hairStyle = U.randInt(0, 3);
    this.stripes = Math.random() < 0.3;
    this.bob = Math.random() * Math.PI * 2;
    shop.enter(this);   // at the shop's door, with a route in
  }

  get entering() { return this.state === 'route' && this.after === 'toQueue'; }
  get inMainQueue() { return this.state === 'toQueue' || this.state === 'queue'; }
  get inPayQueue() { return this.state === 'toPay' || this.state === 'paying'; }
  // the grumpy face: low on patience while waiting, and on the way out after running out of it
  get angry() { return this.left || ((this.inMainQueue || this.inPayQueue) && this.patience < this.patienceMax * SHOP.GRUMPY); }

  // follow the route; true once it is used up
  walk(dt, speed) {
    while (this.route.length) {
      const wp = this.route[0];
      if (!U.moveToward(this, wp.x, wp.y, speed, dt)) return false;
      this.route.shift(); dt = 0;
    }
    this.moving = false;
    return true;
  }

  leave() {
    const t = this.table; let route = [];
    if (t) { if (t.occupied === this) t.occupied = null; route = this.shop.tableExit(t); this.table = null; }
    this.route = route.concat(this.shop.exitRoute(this));
    this.after = 'gone'; this.state = 'route';
  }

  leaveAngry(g) {
    this.left = true;
    g.floats.push({ x: this.x, y: this.y - 40, text: 'Too slow!', color: '#e4572e', t: 0, dur: 1.2 });
    this.shop.lost(g, this);
    Sfx.angry();
    this.leave();
  }

  update(dt, g) {
    const S = this.shop;
    this.takeCd -= dt;
    switch (this.state) {
      case 'route':
        if (this.walk(dt, this.after === 'gone' ? this.speed * SHOP.LEAVE : this.speed)) this.state = this.after;
        break;
      case 'toQueue':
      case 'queue': {
        const idx = S.lineIndex(g, this), spot = S.queueSpot(g, idx);
        const arrived = U.moveToward(this, spot.x, spot.y, this.speed, dt);
        this.state = arrived ? 'queue' : 'toQueue';
        if (!spot.outside) this.patience -= dt;   // nobody gets grumpy while waiting outside
        if (this.patience <= 0) { this.leaveAngry(g); break; }
        const piles = S.piles(g), key = S.keys.display;
        if (arrived && idx === 0 && this.takeCd <= 0 && piles[key] > 0 && this.have < this.want) {
          piles[key]--; this.have++; this.takeCd = SHOP.TAKE_GAP;
          S.fly(g, S.display.x, S.display.y - 10, this.x, this.y - S.handY, 0.25);
        }
        if (this.have >= this.want) { this.state = 'toPay'; this.patienceMax = this.patience = S.payPatience; }
        break;
      }
      case 'toPay':
      case 'paying': {
        const idx = S.payIndex(g, this), spot = S.paySpot(g, idx);
        const arrived = U.moveToward(this, spot.x, spot.y, this.speed, dt);
        this.state = arrived && idx === 0 ? 'paying' : 'toPay';
        this.patience -= dt;
        if (this.patience <= 0) { this.leaveAngry(g); break; }
        if (this.state === 'paying' && S.cashierPresent(g)) {
          this.payProg += dt / S.payTime(g);
          if (this.payProg >= 1) this.pay(g);
        }
        break;
      }
      case 'toTable':
        if (this.walk(dt, this.speed)) {
          this.state = 'eating'; this.eatDur = this.timer = S.eatTime * U.rand(SHOP.EAT_JITTER[0], SHOP.EAT_JITTER[1]);
          this.facing = S.tableFacing;
        }
        break;
      case 'eating':
        this.timer -= dt;
        if (this.timer <= 0) {
          const t = this.table, tip = Math.round(S.price(g) * this.want * S.tipRate * this.mult);
          S.tipped(g, this, t, tip);
          if (t.occupied === this) t.occupied = null;
          this.have = 0; this.leave();
        }
        break;
    }
  }

  // paid at the register: money into the cash pile, then maybe a table
  pay(g) {
    const S = this.shop;
    S.paid(g, this, S.price(g) * this.want * this.mult);
    const t = Math.random() < S.sitChance ? S.freeTable(g) : null;
    if (t) { t.occupied = this; this.table = t; this.route = S.tableRoute(t); this.state = 'toTable'; }
    else this.leave();
  }
}

// Hired help in any shop. role 'cashier' stands at the register, 'cleaner' wipes dirty tables (shops with messy
// tables), any other role ('helper', 'cook') is a carrier: items from the station's pile to the display(s).
class ShopStaff {
  constructor(shop, role, index) {
    this.shop = shop; this.role = role; this.index = index;
    const at = shop.staffStart(role, index); this.x = at.x; this.y = at.y;
    this.carry = 0;
    this.state = 'init';
    this.timer = 0; this.cd = 0;
    this.target = null;
    this.facing = 1; this.moving = false;
    this.skin = U.pick(COLORS.skins);
    this.bob = Math.random() * Math.PI * 2;
  }

  update(dt, g) {
    this.cd -= dt; this.timer += dt;
    if (this.role === 'cashier') return this.updateCashier(dt, g);
    if (this.role === 'cleaner') return this.updateCleaner(dt, g);
    return this.updateCarrier(dt, g);
  }

  updateCashier(dt, g) {
    const S = this.shop, sp = S.cashierStand;
    const arrived = U.moveToward(this, sp.x, sp.y, S.staffSpeed(g, this.role), dt);
    this.state = arrived ? 'working' : 'walking';
    if (arrived) this.facing = S.cashierFacing;
  }

  updateCarrier(dt, g) {
    const S = this.shop, speed = S.staffSpeed(g, this.role), cap = S.carrierCap(g), piles = S.piles(g), made = S.keys.made;
    switch (this.state) {
      case 'init':
      case 'toPile': {
        this.state = 'toPile';
        const at = S.pileStand(this);
        if (U.moveToward(this, at.x, at.y, speed, dt)) { this.state = 'loading'; this.timer = 0; }
        break;
      }
      case 'loading': {
        if (this.carry < cap && piles[made] > 0 && this.cd <= 0) {
          piles[made]--; this.carry++; this.cd = SHOP.LOAD_GAP; this.timer = 0;
          S.fly(g, S.pile.x, S.pile.y - 10, this.x, this.y - S.handY, 0.18);
        }
        // leave with a full stack, or early if a stack is starving or the station has gone quiet
        if (this.carry >= cap || (this.carry > 0 && piles[made] === 0 && (this.timer > 2.5 || (this.timer > 0.5 && Shop.starving(S, g))))) {
          const t = Shop.bestTarget(S, g);
          if (t) { this.target = t; this.state = 'toTarget'; } else this.timer = 0;
        }
        break;
      }
      case 'toTarget': {
        const at = S.dropStand(this.target, this);
        if (U.moveToward(this, at.x, at.y, speed, dt)) { this.state = 'unloading'; this.timer = 0; }
        break;
      }
      case 'unloading': {
        const t = this.target;
        if (this.carry > 0 && piles[t.key] < t.cap && this.cd <= 0) {
          piles[t.key]++; this.carry--; this.cd = SHOP.UNLOAD_GAP; this.timer = 0;
          S.fly(g, this.x, this.y - S.handY, t.pos.x, t.pos.y - 10, 0.18);
        }
        if (this.carry === 0) { this.state = 'toPile'; this.target = null; }
        else if (piles[t.key] >= t.cap && this.timer > 0.6) {
          const other = Shop.bestTarget(S, g, t.key);
          if (other) { this.target = other; this.state = 'toTarget'; } else this.timer = 0;
        } else if (S.stackNeed(g, t.key) <= -1) {
          // this stack has what its people want; if another one is short, take the rest there
          const other = Shop.bestTarget(S, g, t.key);
          if (other && S.stackNeed(g, other.key) > 0) { this.target = other; this.state = 'toTarget'; }
        }
        break;
      }
    }
  }

  updateCleaner(dt, g) {
    const S = this.shop, speed = S.staffSpeed(g, this.role);
    switch (this.state) {
      case 'init':
      case 'idle': {
        this.state = 'idle';
        U.moveToward(this, S.cleanerHome.x, S.cleanerHome.y, speed, dt);
        if (this.cd <= 0) {
          this.cd = 0.4;
          const t = S.tables(g).find((tb) => tb.dirty && !tb.cleaner);
          if (t) { t.cleaner = this; this.target = t; this.state = 'toTable'; }
        }
        break;
      }
      case 'toTable': {
        const t = this.target;
        if (U.moveToward(this, t.x + 30, t.y + 6, speed, dt)) { this.state = 'cleaning'; this.timer = 0; this.facing = -1; }
        break;
      }
      case 'cleaning': {
        const t = this.target;
        t.cleanProg += dt / S.cleanTime(g);
        if (t.cleanProg >= 1) { S.cleanTable(g, t); t.cleaner = null; this.target = null; this.state = 'idle'; }
        break;
      }
    }
  }
}
