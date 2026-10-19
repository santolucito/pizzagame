'use strict';
// Rare special visitors: how they look is handled by Render.drawPerson; here is what they say and tip.
const SPECIALS = {
  santa:  { arrive: 'Ho ho ho! Santa is here!', thanks: 'Ho ho ho! Big tip!', tip: 3 },
  cat:    { arrive: 'A cat in a tall hat walks in!', thanks: 'Purr-fect pizza!', tip: 3 },
  robot:  { arrive: 'Beep boop. Robot customer!', thanks: 'PIZZA = OPTIMAL', tip: 3 },
  pirate: { arrive: 'Arrr! A pirate wants pizza!', thanks: 'Arrr, me treasure!', tip: 3 },
  dino:   { arrive: 'RAWR! A dinosaur is hungry!', thanks: 'RAWR! (thank you)', tip: 3 },
};
// Runtime actors: customers, drive-thru cars, hired staff and the park dog. Game drives their updates.

class Customer {
  constructor(id, want) {
    this.id = id;
    this.x = CFG.SPAWN_OUT.x; this.y = CFG.SPAWN_OUT.y;
    this.route = [CFG.DOOR_OUT, CFG.ENTRANCE]; this.after = 'toQueue';
    this.state = 'route';
    this.want = want; this.have = 0;
    this.patience = CFG.PATIENCE * Game.patienceBonus();
    this.takeCd = 0;
    this.payProg = 0;
    this.table = null;
    this.timer = 0;
    this.angry = false;
    this.facing = -1; this.moving = false;
    this.speed = U.rand(115, 145);
    this.shirt = U.pick(COLORS.shirts);
    this.skin = U.pick(COLORS.skins);
    this.hair = U.pick(['#2b1d14', '#5a3a1a', '#d9a066', '#1a1a1a', '#8c3b2f', '#c7c7c7']);
    this.hairStyle = U.randInt(0, 3);
    this.stripes = Math.random() < 0.3;
    this.bob = Math.random() * Math.PI * 2;
    // 1 in 100 customers is somebody special
    this.special = Math.random() < 0.01 ? U.pick(Object.keys(SPECIALS)) : null;
    if (this.special) { this.announced = false; }
  }

  get entering() { return this.state === 'route' && this.after === 'toQueue'; }
  get inMainQueue() { return this.state === 'toQueue' || this.state === 'queue'; }
  get inPayQueue() { return this.state === 'toPay' || this.state === 'paying'; }

  leave() {
    if (this.table) { this.table.occupied = null; this.table = null; }
    this.route = [CFG.ENTRANCE, CFG.DOOR_OUT, { x: CFG.SPAWN_OUT.x + U.rand(0, 10), y: CFG.SPAWN_OUT.y + U.rand(-12, 12) }];
    this.after = 'gone'; this.state = 'route';
  }

  update(dt, g) {
    this.takeCd -= dt;
    switch (this.state) {
      case 'route': {
        if (this.special && !this.announced && this.x < CFG.DOOR_OUT.x + 40) {
          this.announced = true;
          g.toast(SPECIALS[this.special].arrive); Sfx.unlock();
          g.floats.push({ x: this.x, y: this.y - 60, text: SPECIALS[this.special].arrive, color: '#ffe08a', t: 0, dur: 2, big: true });
        }
        const wp = this.route[0];
        const sp = this.after === 'gone' ? this.speed * 1.1 : this.speed;
        if (U.moveToward(this, wp.x, wp.y, sp, dt)) {
          this.route.shift();
          if (this.route.length === 0) this.state = this.after;
        }
        break;
      }
      case 'toQueue':
      case 'queue': {
        const idx = g.queueIndex(this);
        const tx = CFG.QUEUE.x, ty = CFG.QUEUE.y + idx * CFG.QUEUE.dy;
        const arrived = U.moveToward(this, tx, ty, this.speed, dt);
        this.state = arrived ? 'queue' : 'toQueue';
        this.patience -= dt;
        if (this.patience <= 0) { this.leaveAngry(g); break; }
        if (arrived && idx === 0 && this.takeCd <= 0 && g.s.piles.display > 0 && this.have < this.want) {
          g.s.piles.display--; this.have++; this.takeCd = 0.25;
          g.fx.push({ kind: 'pizza', x0: CFG.DISPLAY.x, y0: CFG.DISPLAY.y - 10, x1: this.x, y1: this.y - 30, t: 0, dur: 0.25 });
          Sfx.pickup();
        }
        if (this.have >= this.want) { this.state = 'toPay'; this.patience = 70; }
        break;
      }
      case 'toPay':
      case 'paying': {
        const idx = g.payIndex(this);
        const tx = CFG.PAY_QUEUE.x + idx * CFG.PAY_QUEUE.dx, ty = CFG.PAY_QUEUE.y;
        const arrived = U.moveToward(this, tx, ty, this.speed, dt);
        this.state = arrived && idx === 0 ? 'paying' : 'toPay';
        this.patience -= dt;
        if (this.patience <= 0) { this.leaveAngry(g); break; }
        if (this.state === 'paying' && g.cashierPresent()) {
          this.payProg += dt / g.checkoutTime();
          if (this.payProg >= 1) {
            const amount = g.price() * this.want * (this.special ? SPECIALS[this.special].tip : 1);
            g.earn(amount, CFG.CASH_PILE, 'register');
            if (this.special) { g.floats.push({ x: this.x, y: this.y - 64, text: SPECIALS[this.special].thanks, color: '#ff6b8a', t: 0, dur: 1.6, big: true }); g.s.stats.specials = (g.s.stats.specials || 0) + 1; }
            g.fx.push({ kind: 'cash', x0: this.x, y0: this.y - 20, x1: CFG.CASH_PILE.x, y1: CFG.CASH_PILE.y, t: 0, dur: 0.35 });
            Sfx.pay();
            const table = g.findFreeTable();
            if (table && Math.random() < 0.65) { table.occupied = this; this.table = table; this.state = 'toTable'; }
            else this.leave();
          }
        }
        break;
      }
      case 'toTable': {
        const t = this.table;
        if (U.moveToward(this, t.x, t.y - 34, this.speed, dt)) { this.state = 'eating'; this.timer = CFG.EAT_TIME * U.rand(0.8, 1.2); this.facing = 1; }
        break;
      }
      case 'eating': {
        this.timer -= dt;
        if (this.timer <= 0) {
          this.table.occupied = null; this.table.dirty = true; this.table.cleanProg = 0; this.table = null;
          this.have = 0; this.leave();
        }
        break;
      }
    }
  }

  leaveAngry(g) {
    this.angry = true;
    g.floats.push({ x: this.x, y: this.y - 40, text: 'Too slow!', color: '#e4572e', t: 0, dur: 1.2 });
    g.s.stats.lost++;
    Sfx.angry();
    this.leave();
  }
}

class Car {
  constructor(id, want) {
    this.id = id;
    this.x = CFG.WORLD.x0 - 110; this.y = (CFG.ROAD.y1 + CFG.ROAD.y2) / 2;
    this.state = 'arriving';
    this.want = want; this.have = 0;
    this.patience = CFG.CAR_PATIENCE;
    this.takeCd = 0;
    this.color = U.pick(COLORS.cars);
    this.speed = 240;
    this.angry = false;
  }
  get inLine() { return this.state === 'arriving' || this.state === 'waiting'; }
  update(dt, g) {
    this.takeCd -= dt;
    if (this.inLine) {
      const idx = g.carIndex(this);
      const tx = CFG.DT_WINDOW.x - idx * CFG.DT_SLOT_DX;
      const arrived = U.moveToward(this, tx, this.y, this.speed, dt);
      this.state = arrived && idx === 0 ? 'waiting' : 'arriving';
      this.patience -= dt;
      if (this.patience <= 0) {
        this.angry = true; this.state = 'leaving'; g.s.stats.lost++;
        g.floats.push({ x: this.x, y: this.y - 30, text: 'Drove off!', color: '#e4572e', t: 0, dur: 1.2 });
        Sfx.angry();
        return;
      }
      if (this.state === 'waiting' && this.takeCd <= 0 && g.s.piles.dt > 0 && this.have < this.want) {
        g.s.piles.dt--; this.have++; this.takeCd = 0.22;
        g.fx.push({ kind: 'pizza', x0: CFG.DT_STACK.x, y0: CFG.DT_STACK.y - 10, x1: this.x, y1: this.y, t: 0, dur: 0.25 });
        Sfx.pickup();
        if (this.have >= this.want) {
          const amount = g.price() * this.want * CFG.DT_PRICE_MULT;
          g.earn(amount, CFG.DT_CASH, 'dt');
          g.fx.push({ kind: 'cash', x0: this.x, y0: this.y, x1: CFG.DT_CASH.x, y1: CFG.DT_CASH.y, t: 0, dur: 0.35 });
          Sfx.pay();
          this.state = 'leaving';
        }
      }
    } else if (this.state === 'leaving') {
      this.x += this.speed * 1.2 * dt;
      if (this.x > CFG.WORLD.x1 + 130) this.state = 'gone';
    }
  }
}

class Staff {
  constructor(role, index) {
    this.role = role; this.index = index;
    const desk = CFG.OFFICE_DESK; this.x = desk.x; this.y = desk.y - 50;
    this.carry = 0;
    this.state = 'init';
    this.timer = 0; this.cd = 0;
    this.target = null;
    this.facing = 1; this.moving = false;
    this.skin = U.pick(COLORS.skins);
    this.bob = Math.random() * Math.PI * 2;
    this.shirt = role === 'cashier' ? '#3f6fb5' : role === 'helper' ? '#e4572e' : '#2f9e44';
  }

  update(dt, g) {
    this.cd -= dt; this.timer += dt;
    if (this.role === 'cashier') return this.updateCashier(dt, g);
    if (this.role === 'helper') return this.updateHelper(dt, g);
    if (this.role === 'cleaner') return this.updateCleaner(dt, g);
  }

  updateCashier(dt, g) {
    const sp = CFG.CASHIER_SPOT;
    const arrived = U.moveToward(this, sp.x + 24, sp.y, g.staffSpeed('cashier'), dt);
    this.state = arrived ? 'working' : 'walking';
    if (arrived) this.facing = -1;
  }

  updateHelper(dt, g) {
    const speed = g.staffSpeed('helper');
    const cap = g.helperCap();
    switch (this.state) {
      case 'init':
      case 'toOven': {
        this.state = 'toOven';
        const off = (this.index - 1) * 34;
        if (U.moveToward(this, CFG.OVEN_PILE_STAND.x + off, CFG.OVEN_PILE_STAND.y + 10, speed, dt)) { this.state = 'loading'; this.timer = 0; }
        break;
      }
      case 'loading': {
        if (this.carry < cap && g.s.piles.oven > 0 && this.cd <= 0) {
          g.s.piles.oven--; this.carry++; this.cd = 0.2; this.timer = 0;
          g.fx.push({ kind: 'pizza', x0: CFG.OVEN_PILE.x, y0: CFG.OVEN_PILE.y - 10, x1: this.x, y1: this.y - 30, t: 0, dur: 0.18 });
        }
        // Leave with a full stack, or early if the shop is starving for pizzas or the oven has gone quiet.
        const starving = g.s.piles.display === 0 || (g.isUnlocked('driveThru') && g.s.piles.dt === 0 && g.cars.some((c) => c.inLine));
        if (this.carry >= cap || (this.carry > 0 && g.s.piles.oven === 0 && (this.timer > 2.5 || (starving && this.timer > 0.5)))) {
          const t = g.bestDropTarget();
          if (t) { this.target = t; this.state = 'toTarget'; }
          else { this.timer = 0; }
        }
        break;
      }
      case 'toTarget': {
        const t = this.target;
        const off = (this.index - 1) * 30;
        if (U.moveToward(this, t.stand.x + off, t.stand.y, speed, dt)) { this.state = 'unloading'; this.timer = 0; }
        break;
      }
      case 'unloading': {
        const t = this.target;
        if (this.carry > 0 && g.s.piles[t.key] < t.cap && this.cd <= 0) {
          g.s.piles[t.key]++; this.carry--; this.cd = 0.14; this.timer = 0;
          g.fx.push({ kind: 'pizza', x0: this.x, y0: this.y - 30, x1: t.pos.x, y1: t.pos.y - 10, t: 0, dur: 0.18 });
        }
        if (this.carry === 0) { this.state = 'toOven'; this.target = null; }
        else if (g.s.piles[t.key] >= t.cap && this.timer > 0.6) {
          const other = g.bestDropTarget();
          if (other && other.key !== t.key) { this.target = other; this.state = 'toTarget'; }
          else this.timer = 0;
        }
        break;
      }
    }
  }

  updateCleaner(dt, g) {
    const speed = g.staffSpeed('cleaner');
    switch (this.state) {
      case 'init':
      case 'idle': {
        this.state = 'idle';
        U.moveToward(this, CFG.CLEANER_HOME.x, CFG.CLEANER_HOME.y, speed, dt);
        if (this.cd <= 0) {
          this.cd = 0.4;
          const t = g.tables.find((tb) => tb.dirty && !tb.cleaner);
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
        t.cleanProg += dt / g.cleanTime('cleaner');
        if (t.cleanProg >= 1) { g.cleanTable(t); t.cleaner = null; this.target = null; this.state = 'idle'; }
        break;
      }
    }
  }
}

// A friendly dog that lives in the park and follows the player around outside.
class Dog {
  constructor() {
    this.x = CFG.DOG_HOME.x; this.y = CFG.DOG_HOME.y;
    this.state = 'wander'; this.target = null; this.timer = 0;
    this.facing = 1; this.moving = false; this.bob = 0; this.wag = 0; this.happy = 0;
  }
  update(dt, g) {
    const p = g.player;
    this.timer -= dt; this.wag += dt * 10; this.happy = Math.max(0, this.happy - dt);
    const playerOutside = !g.insideBuilding(p.x, p.y);
    const d = U.dist(this.x, this.y, p.x, p.y);
    if (playerOutside && d < 170) {
      this.state = 'follow';
      if (d > 48) { U.moveToward(this, p.x, p.y, 150, dt); this.bob += dt * 16; }
      else { this.moving = false; this.facing = p.x < this.x ? -1 : 1; if (d < 36 && this.happy <= 0) { this.happy = 1.2; g.floats.push({ x: this.x, y: this.y - 36, text: '♥', color: '#ff6b8a', t: 0, dur: 1 }); } }
    } else {
      this.state = 'wander';
      if (!this.target || this.timer <= 0) {
        this.target = { x: CFG.DOG_HOME.x + U.rand(-110, 110), y: CFG.DOG_HOME.y + U.rand(-140, 120) };
        this.timer = U.rand(2, 5);
      }
      if (U.moveToward(this, this.target.x, this.target.y, 70, dt)) { this.moving = false; this.target = null; this.timer = U.rand(1, 3); }
      else this.bob += dt * 10;
    }
    // keep the dog out of the building
    if (g.insideBuilding(this.x, this.y)) { this.x = CFG.BUILDING.x1 + 20; }
  }
}
