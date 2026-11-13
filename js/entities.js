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

// A walk-in pizza customer: the shared shop customer (js/shop.js) at the pizzeria. Train passengers come down the
// platform path instead of along the sidewalk; one in a hundred is somebody special who announces themselves at the
// door and pays (and tips) triple.
class Customer extends ShopCustomer {
  constructor(id, want, fromTrain = false) {
    super(PizzeriaShop, id, want);
    if (fromTrain) {
      const S = CFG.STATION; this.x = S.stopX + S.boardDx + U.rand(-120, 80); this.y = S.platform.y1 - 10;
      this.route = S.route.map((p) => ({ x: p.x + U.rand(-8, 8), y: p.y + U.rand(-6, 6) })).concat([CFG.DOOR_OUT, CFG.ENTRANCE]);
      this.fromTrain = true;
    }
    // 1 in 100 customers is somebody special
    this.special = Math.random() < 0.01 ? U.pick(Object.keys(SPECIALS)) : null;
    if (this.special) { this.announced = false; this.mult = SPECIALS[this.special].tip; }
  }

  update(dt, g) {
    if (this.special && !this.announced && this.state === 'route' && this.x < CFG.DOOR_OUT.x + 40) {
      this.announced = true;
      g.toast(SPECIALS[this.special].arrive, true, 'town'); Sfx.chime();
      g.floats.push({ x: this.x, y: this.y - 60, text: SPECIALS[this.special].arrive, color: '#ffe08a', t: 0, dur: 2, big: true });
    }
    super.update(dt, g);
  }
}

class Car {
  constructor(id, want, kind = 'car') {
    this.id = id; this.kind = kind;
    this.x = CFG.ROADS[0].x0 + 70; this.y = (CFG.ROAD.y1 + CFG.ROAD.y2) / 2;   // on Main Street; the spawner moves it just out of sight (Game.trafficSpawnX)
    this.angle = 0; this.exitPath = null; this.onDone = null;
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
        return;
      }
      if (this.state === 'waiting' && this.takeCd <= 0 && g.s.piles.dt > 0 && this.have < this.want) {
        g.s.piles.dt--; this.have++; this.takeCd = SHOP.TAKE_GAP;
        g.fx.push({ kind: 'pizza', x0: CFG.DT_STACK.x, y0: CFG.DT_STACK.y - 10, x1: this.x, y1: this.y, t: 0, dur: 0.25 });
        if (this.have >= this.want) {
          const amount = g.price() * this.want * CFG.DT_PRICE_MULT * (this.kind === 'firetruck' ? 2 : 1);
          g.earn(amount, CFG.DT_CASH, 'dt');
          if (this.kind === 'firetruck') g.floats.push({ x: this.x, y: this.y - 50, text: 'Thanks, chief!', color: '#ff6b8a', t: 0, dur: 1.5, big: true });
          g.fx.push({ kind: 'cash', x0: this.x, y0: this.y, x1: CFG.DT_CASH.x, y1: CFG.DT_CASH.y, t: 0, dur: 0.35 });
          Sfx.pay();
          this.state = 'leaving';
        }
      }
    } else if (this.state === 'leaving') {
      this.x += this.speed * 1.2 * dt;
      if (this.exitPath && this.x >= this.exitPath[0].x) { this.state = 'path'; this.x = this.exitPath[0].x; }
      else if (this.x > CFG.WORLD.x1 + 130) this.state = 'gone';
    } else if (this.state === 'path') {
      const wp = this.exitPath[0];
      const ang = Math.atan2(wp.y - this.y, wp.x - this.x);
      let d = ang - this.angle; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; this.angle += d * Math.min(1, dt * 6);
      if (U.moveToward(this, wp.x, wp.y, this.speed, dt)) { this.exitPath.shift(); if (!this.exitPath.length) { this.state = 'gone'; if (this.onDone) this.onDone(); } }
    }
  }
}

// The train: lives off-screen, rolls in along the top tracks, stops at the platform, lets a crowd off, leaves.
class Train {
  // st: the station it serves, bounds: the world it runs across. The Construction Town train is
  // `remote`: it has no timetable, it waits at its platform until you hop on, then takes you home.
  constructor(st = CFG.STATION, bounds = CFG.WORLD, remote = false) {
    this.st = st; this.bounds = bounds; this.remote = remote;
    this.x = bounds.x0 - 500; this.y = st.trackY; this.state = 'away'; this.timer = remote ? Infinity : U.rand(st.first[0], st.first[1]);
    this.speed = 0; this.unload = 0; this.toDrop = 0; this.dropT = 0; this.smoke = []; this.whistled = false; this.warned = false; this.hold = 0; this.departIn = 0; this.hurrying = false;
  }
  // seconds until the train leaves the platform (for the countdown)
  get leavesIn() { return this.state === 'stopped' ? Math.max(0, this.unload + (this.hurrying ? this.hold : 0) + this.toDrop * 0.55) : 0; }
  // bring the train in right now (arriving with a rider from the other town)
  summon() { this.state = 'arriving'; this.x = this.bounds.x0 - 420; this.speed = 320; this.warned = true; this.smoke = []; }
  // the chef is on foot on (or right by) this train's platform, in its map
  chefWaiting(g) {
    const p = g.player, P = this.st.platform;
    if (g.area !== (this.remote ? 'site' : 'town') || g.driving || g.onTrain || g.travel || g.ride) return false;
    return p.x > P.x0 - 50 && p.x < P.x1 + 50 && p.y < P.y1 + 60;
  }
  update(dt, g) {
    const S = this.st, W = this.bounds, home = !this.remote && g.area === 'town';
    // chugga chugga while it rolls, when it is near enough to see (or you are aboard)
    if (this.state === 'arriving' || this.state === 'leaving') {
      this.chug = (this.chug || 0) - dt;
      const near = g.onTrain || (g.area === (this.remote ? 'site' : 'town') && Math.abs(this.x - g.player.x) < 900);
      if (near && this.chug <= 0) { Sfx.chuff(g.onTrain ? 1 : 0.7); this.chug = this.speed > 220 ? 0.2 : 0.32; }
    }
    for (const p of this.smoke) { p.t += dt; p.y -= 18 * dt; p.x += 8 * dt; } this.smoke = this.smoke.filter((p) => p.t < 1.6);
    // waiting by the platform calls the train (like the City bus): a few seconds there and it is on its way
    const waiting = this.state === 'away' && (this.remote || g.isUnlocked('station')) && this.chefWaiting(g);
    this.callWait = waiting ? (this.callWait || 0) + dt : 0;
    const called = waiting && this.callWait >= (S.callAfter || CFG.STATION.callAfter);
    if (called && (this.remote || this.timer > (S.callIn || 3))) {
      g.floats.push({ x: g.player.x, y: g.player.y - 70, text: 'Here comes the train! 🚂', color: '#ffe08a', t: 0, dur: 1.6, big: true });
      if (this.remote) this.summon(); else { this.timer = S.callIn || 3; this.warned = true; }
    }
    if (this.state === 'away') {
      if (this.remote || !g.isUnlocked('station')) return;   // no trains until the old station is repaired
      this.timer -= dt;
      if (!this.warned && this.timer <= S.warn && !g.onTrain && home) { this.warned = true; g.toast(`🚂 Train in ${S.warn} seconds! Run to the station!`, true); Sfx.whistle(); }
      if (this.timer <= 0) { this.summon(); this.warned = false; if (!g.onTrain && home) g.toast('🚂 The train is pulling in!', true); }
    } else if (this.state === 'arriving') {
      const dist = S.stopX - this.x;
      this.speed = Math.max(40, Math.min(320, dist * 1.2));
      this.x += this.speed * dt;
      if (Math.random() < dt * 6) this.smoke.push({ x: this.x - 14, y: this.y - 28, t: 0 });
      if (dist <= 2) {
        this.x = S.stopX; this.state = 'stopped'; this.dropT = 1.2; if (g.onTrain || g.area === (this.remote ? 'site' : 'town')) Sfx.whistle();
        if (this.remote) { this.unload = Infinity; this.hold = 0; this.toDrop = 0; this.departIn = Infinity; }   // waits until somebody boards
        else { this.unload = S.dwell; this.hold = S.hold; this.toDrop = U.randInt(S.passengers[0], S.passengers[1]); }
      }
    } else if (this.state === 'stopped') {
      if (this.remote) {
        // waits for you; two seconds after you climb aboard it pulls out
        if (g.onTrain) { this.departIn -= dt; if (this.departIn <= 0) { this.state = 'leaving'; this.speed = 0; } }
        return;
      }
      // the conductor waits a little longer while somebody is hurrying up the platform path
      const p = g.player, hurrying = !g.onTrain && !g.driving && g.area === 'town' && p.y < 120 && Math.abs(p.x - (S.stopX + S.boardDx)) < 420;
      this.hurrying = hurrying;
      if (this.unload <= 0 && hurrying && this.hold > 0) this.hold -= dt; else this.unload -= dt;
      this.dropT -= dt;
      if (this.toDrop > 0 && this.dropT <= 0) { this.dropT = 0.55; this.toDrop--; g.spawnTrainPassenger(); }
      if (this.unload <= 0 && this.toDrop === 0 && !(hurrying && this.hold > 0)) { this.state = 'leaving'; this.speed = 0; }
    } else if (this.state === 'leaving') {
      this.speed = Math.min(360, this.speed + 160 * dt); this.x += this.speed * dt;
      if (Math.random() < dt * 8) this.smoke.push({ x: this.x - 14, y: this.y - 28, t: 0 });
      if (this.x > W.x1 + 500) {
        this.state = 'away'; this.timer = this.remote ? Infinity : U.rand(S.every[0], S.every[1]);
        if (g.onTrain) g.startTravel(this.remote ? 'town' : 'site');   // off through the mountains to the other town
      }
    }
  }
}

// The town fire truck: parked in the station most of the time; now and then it drives the loop
// around the block, joins the drive-thru line for a big order, and comes back home.
class FireTruck {
  constructor() {
    this.x = CFG.FIRE_TRUCK_HOME.x; this.y = CFG.FIRE_TRUCK_HOME.y; this.angle = Math.PI; // nose toward the door
    this.state = 'home'; this.path = []; this.speed = 200; this.timer = U.rand(CFG.FIRE_TRUCK_FIRST[0], CFG.FIRE_TRUCK_FIRST[1]);
  }
  update(dt, g) {
    if (this.state === 'home') {
      this.timer -= dt;
      if (this.timer <= 0 && g.isUnlocked('driveThru')) {
        this.state = 'out'; this.path = CFG.FIRE_TRUCK_OUT.map((p) => ({ x: p.x, y: p.y }));
        g.toast('🚒 The fire truck is going out for pizza!', true, 'town'); Sfx.chime();
      }
    } else if (this.state === 'out') {
      const wp = this.path[0];
      const ang = Math.atan2(wp.y - this.y, wp.x - this.x);
      let d = ang - this.angle; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; this.angle += d * Math.min(1, dt * 6);
      if (U.moveToward(this, wp.x, wp.y, this.speed, dt)) {
        this.path.shift();
        if (!this.path.length) {
          // hand over to the drive-thru line as a vehicle, then come back along the return path
          const car = new Car(g.seq++, U.randInt(3, 4), 'firetruck');
          car.x = this.x; car.speed = 200;
          car.exitPath = CFG.FIRE_TRUCK_BACK.map((p) => ({ x: p.x, y: p.y }));
          car.onDone = () => { this.state = 'home'; this.x = CFG.FIRE_TRUCK_HOME.x; this.y = CFG.FIRE_TRUCK_HOME.y; this.angle = Math.PI; this.timer = U.rand(CFG.FIRE_TRUCK_EVERY[0], CFG.FIRE_TRUCK_EVERY[1]); };
          g.cars.push(car);
          this.state = 'away';
        }
      }
    }
  }
}

// Pizzeria staff: the shared shop staff (js/shop.js) with the pizzeria's shirts. Roles: cashier, helper (carries
// pizzas from the oven pile to the counter and the drive-thru window) and cleaner (wipes the dirty tables).
class Staff extends ShopStaff {
  constructor(role, index) {
    super(PizzeriaShop, role, index);
    this.shirt = role === 'cashier' ? '#3f6fb5' : role === 'helper' ? '#e4572e' : '#2f9e44';
  }
}

// Customers of the ice cream shop next door: walk in, order, pay, leave with a cone.
class IceCreamCustomer {
  constructor(id) {
    const IC = CFG.ICE_CREAM;
    this.id = id;
    // same way in as the pizza customers: along the sidewalk, over the East Road crosswalk, then up the
    // sidewalk beside the parking lot to the ice cream door
    this.x = CFG.SPAWN_OUT.x + U.rand(0, 20); this.y = CFG.SPAWN_OUT.y + U.rand(-8, 8);
    this.route = IceCreamCustomer.wayIn().concat([{ x: IC.inside.x + U.rand(-30, 30), y: IC.inside.y + U.rand(-6, 6) }]);
    this.state = 'in'; this.timer = U.rand(1.5, 2.5); this.cone = false;
    this.facing = 1; this.moving = false; this.bob = Math.random() * 6; this.speed = U.rand(SHOP.WALK[0], SHOP.WALK[1]);
    this.shirt = U.pick(COLORS.shirts); this.skin = U.pick(COLORS.skins);
    this.hair = U.pick(['#2b1d14', '#5a3a1a', '#d9a066', '#1a1a1a']); this.hairStyle = U.randInt(0, 3); this.stripes = Math.random() < 0.3;
    this.flavor = U.pick(['#ffb6c1', '#fff3c4', '#8d5a2b', '#b8f2c8', '#cdb4ff']);
  }
  // waypoints from the crosswalk to the ice cream door (the far sidewalk strip, then along the top of the lot)
  static wayIn() {
    const IC = CFG.ICE_CREAM, walkX = CFG.ICE_CREAM.walkX + U.rand(-6, 6);
    return [{ x: walkX, y: CFG.DOOR_OUT.y + U.rand(-8, 8) }, { x: walkX, y: IC.door.y + 24 }, { x: IC.door.x, y: IC.door.y + 20 }];
  }
  update(dt, g) {
    const IC = CFG.ICE_CREAM;
    if (this.state === 'in') {
      const wp = this.route[0];
      if (U.moveToward(this, wp.x, wp.y, this.speed, dt)) { this.route.shift(); if (!this.route.length) { this.state = 'order'; this.facing = 1; } }
    } else if (this.state === 'order') {
      this.timer -= dt; this.moving = false;
      if (this.timer <= 0) {
        const amt = g.iceCreamPrice();
        g.s.iceCream.cash += amt; g.secEarned += amt; g.s.stats.scoops = (g.s.stats.scoops || 0) + 1;
        g.floats.push({ x: IC.cash.x + U.rand(-8, 8), y: IC.cash.y - 18, text: '+' + U.money(amt), color: '#2f9e44', t: 0, dur: 1 });
        g.fx.push({ kind: 'cash', x0: this.x, y0: this.y - 20, x1: IC.cash.x, y1: IC.cash.y, t: 0, dur: 0.35 });
        this.cone = true; this.state = 'out';
        this.route = IceCreamCustomer.wayIn().reverse().concat([{ x: CFG.SPAWN_OUT.x + 10, y: CFG.SPAWN_OUT.y + U.rand(-8, 8) }]);
      }
    } else if (this.state === 'out') {
      const wp = this.route[0];
      if (U.moveToward(this, wp.x, wp.y, this.speed, dt)) { this.route.shift(); if (!this.route.length) this.state = 'gone'; }
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
      // trot after the player, but never into the building: wait outside the door instead of jumping out
      if (d > 48) { const nx = { x: this.x, y: this.y }; U.moveToward(nx, p.x, p.y, 150, dt); if (g.insideBuilding(nx.x, nx.y)) { this.moving = false; } else { this.x = nx.x; this.y = nx.y; this.moving = true; this.facing = p.x < this.x ? -1 : 1; this.bob += dt * 16; } }
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
    // safety net only (the follow logic above never steps inside): ease back out through the door side
    if (g.insideBuilding(this.x, this.y)) { this.x = Math.min(CFG.BUILDING.x1 + 20, this.x + 120 * dt); }
  }
}
