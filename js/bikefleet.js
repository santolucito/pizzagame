'use strict';
// A fleet of delivery bikes. They live in a little bike rack on the grass south of the pizzeria, between the
// conveyor's dock and South Road. When a house orders pizza (the core's h.order) and pizzas wait on the dock
// (js/conveyor.js), one idle bike rides over, loads what the order still needs (up to three), rides along South Road
// to that house's door, fills the order ("Thank you!") and comes back. If the order goes away first, the bike rides
// home and keeps its boxes for the next order (saved, so no pizza is ever lost). No orders: the bikes stay put.
// The money lands in a cash pile at the rack that the chef collects by walking over it. Bikes are bought on a
// walk-on pad beside the rack (once the conveyor is built) and any bike resting in the rack can be ridden.
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
//
// Conveyor interface used (all guarded): CFG.CONVEYOR.DOCK {x, y}; ConveyorExt.owned(g), dockCount(g), takeFromDock(g, n).

CFG.BIKEFLEET = {
  RACK: { x0: 422, y0: 826, x1: 582, y1: 892 },        // concrete slab under the fountain, above the South Road sidewalk (y 894)
  SLOTS: [{ x: 442, y: 862 }, { x: 472, y: 862 }, { x: 502, y: 862 }, { x: 532, y: 862 }, { x: 562, y: 862 }],
  EXIT_Y: 812,                                          // bikes leave the rack north to here, then head for the dock
  CASH: { x: 636, y: 868 },                             // the pile the chef walks over to collect
  PAD: { x: 724, y: 868 },                              // buy another bike
  PRICES: [150, 250, 400, 600, 850],
  CAP: 3,                                               // boxes per trip
  SPEED: 190,
  LANE_W: 948, LANE_E: 972,                             // South Road: westbound / eastbound lane (drive on the right)
  CURB: 1000,                                           // where a bike stops in front of a house door
  QUEUE: { dx: 70, dy: 70 },                            // the second bike waits here, below the flower bed; every bike passes it on the way in
  LOAD_EVERY: 0.4, DROP_EVERY: 0.35,
  DEFAULT_DOCK: { x: 220, y: 760 },
};
CFG.VEHICLES.fleetbike = { speed: 420, radius: 13, label: '🛵 Ride', exit: '🚶 Hop off' };

const BikeFleetExt = {
  name: 'bikefleet',
  defaults: { bikefleet: { bikes: 0, cash: 0, trips: 0, held: [] } },
  bikes: [],
  queue: [],

  // ---- the conveyor (guarded: it may not be loaded)
  conv() { return typeof ConveyorExt !== 'undefined' && ConveyorExt && typeof ConveyorExt.takeFromDock === 'function' ? ConveyorExt : null; },
  dock() { return (CFG.CONVEYOR && CFG.CONVEYOR.DOCK) || CFG.BIKEFLEET.DEFAULT_DOCK; },
  convOwned(g) { const c = this.conv(); return !!(c && c.owned(g)); },
  dockCount(g) { const c = this.conv(); return c && c.owned(g) ? c.dockCount(g) || 0 : 0; },
  visible(g) { return g.s.bikefleet.bikes > 0 || this.convOwned(g); },
  queueSpot(k) { const D = this.dock(), Q = CFG.BIKEFLEET.QUEUE; return k === 0 ? { x: D.x, y: D.y } : { x: D.x + Q.dx * k, y: D.y + Q.dy }; },

  makeBike(i, load) {
    const S = CFG.BIKEFLEET.SLOTS[i];
    return { kind: 'fleetbike', id: i, x: S.x, y: S.y, angle: -Math.PI / 2, vx: 0, vy: 0, state: 'parked', path: [], load: load || 0, t: 0, dest: null, earned: 0 };
  },
  build(g) {
    this.bikes = []; this.queue = [];
    const n = Math.min(CFG.BIKEFLEET.SLOTS.length, g.s.bikefleet.bikes | 0), held = g.s.bikefleet.held || [];
    for (let i = 0; i < n; i++) this.bikes.push(this.makeBike(i, held[i] | 0));
  },
  home(g) {},

  vehicles(g) {
    return this.bikes.filter((b) => (g.driving && g.vehicle === b) || (g.area === 'town' && (b.state === 'parked' || b.state === 'leftout')));
  },
  ridden(g, b) { return g.driving && g.vehicle === b; },

  // ---- orders: bikes only ride for a house that asked for pizza (the core's h.order)
  busy(b) { return b.state === 'toDock' || b.state === 'loading' || b.state === 'out' || b.state === 'drop'; },
  need(h) { return h && h.order ? Math.max(0, h.order.want - h.order.have) : 0; },
  openOrders(g) { return (g.houses || []).filter((h) => this.need(h) > 0 && !this.bikes.some((b) => this.busy(b) && b.dest && b.dest.house === h)); },
  // the order this bike rides for is gone (the chef filled it, or it timed out)
  orderGone(b) { return !b.dest || this.need(b.dest.house) <= 0; },
  homePath(b, slot) {
    // from the road / a door: along a lane and up into the slot; from the grass by the dock: past the waiting spot
    const F = CFG.BIKEFLEET;
    if (b.y > F.RACK.y1) { const lane = slot.x > b.x ? F.LANE_E : F.LANE_W; return [{ x: b.x, y: lane }, { x: slot.x, y: lane }, { x: slot.x, y: slot.y }]; }
    const q1 = this.queueSpot(1), out = [];
    if (b.x < q1.x - 2) out.push(q1);
    out.push({ x: slot.x, y: F.EXIT_Y }, { x: slot.x, y: slot.y });
    return out;
  },
  goHome(g, b) {
    const slot = CFG.BIKEFLEET.SLOTS[b.id];
    b.state = 'back'; b.dest = null; b.goal = null; b.thanks = false; b.path = this.homePath(b, slot);
    this.queue = this.queue.filter((o) => o !== b);
  },

  // ---- simulation
  update(g, dt) {
    const F = CFG.BIKEFLEET, s = g.s.bikefleet;
    while (this.bikes.length < Math.min(F.SLOTS.length, s.bikes)) this.bikes.push(this.makeBike(this.bikes.length));
    this.queue = this.queue.filter((b) => b.state === 'toDock' || b.state === 'loading');
    // one bike per open order: a bike already holding boxes (from an order that went away) goes first; otherwise
    // an empty one goes when pizzas wait on the dock (two bikes at the dock at most)
    for (const h of this.openOrders(g)) {
      const free = this.bikes.filter((o) => o.state === 'parked' && !this.ridden(g, o));
      if (!free.length) break;
      const need = this.need(h), dest = { x: h.door.x, y: h.door.y, house: h };
      const loaded = free.filter((o) => o.load > 0).sort((a, b) => b.load - a.load)[0];
      const n = this.dockCount(g);
      if (loaded && (loaded.load >= need || n === 0)) { loaded.dest = dest; this.depart(g, loaded); continue; }
      if (n <= 0 || this.queue.length >= 2) continue;
      const b = loaded || free.find((o) => o.load === 0) || free[0];
      b.dest = dest; b.state = 'toDock'; b.goal = null; b.path = []; b.t = 0; this.queue.push(b);
    }
    for (const b of this.bikes) this.updateBike(g, b, dt);
    s.held = this.bikes.map((b) => b.load);   // boxes on the bikes are saved too: pizzas never vanish
    // the cash pile: walk over it to pick it up
    if (s.cash > 0 && g.area === 'town' && !g.driving && U.dist(g.player.x, g.player.y, F.CASH.x, F.CASH.y) < 46) {
      const amt = s.cash; s.cash = 0; Shop.pocket(g, amt, F.CASH);
    }
  },
  // follow the waypoints; true once the last one is reached
  follow(b, dt) {
    while (b.path.length) {
      const w = b.path[0], dx = w.x - b.x, dy = w.y - b.y;
      if (Math.hypot(dx, dy) > 1) {
        const want = Math.atan2(dy, dx); let d = want - b.angle;
        while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        b.angle += d * Math.min(1, dt * 12);
      }
      if (U.moveToward(b, w.x, w.y, CFG.BIKEFLEET.SPEED, dt)) { b.path.shift(); continue; }
      b.moving = true;
      return false;
    }
    b.moving = false;
    return true;
  },
  turnTo(b, a, dt) { let d = a - b.angle; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; b.angle += d * Math.min(1, dt * 8); },
  updateBike(g, b, dt) {
    const F = CFG.BIKEFLEET, slot = F.SLOTS[b.id];
    if (this.ridden(g, b)) { if (b.state !== 'ridden') { this.queue = this.queue.filter((o) => o !== b); b.state = 'ridden'; b.path = []; b.dest = null; } return; }
    // the order went away (the chef brought it, or it timed out): ride home, boxes and all
    if (this.busy(b) && this.orderGone(b) && !(b.state === 'drop' && b.thanks)) { this.goHome(g, b); return; }
    switch (b.state) {
      case 'parked': b.moving = false; this.turnTo(b, -Math.PI / 2, dt); return;
      case 'ridden': b.state = 'leftout'; b.t = 0; return;                 // the chef hopped off somewhere
      case 'leftout': {
        // after a moment the bike pops back into its slot (a sparkle at both ends)
        b.t += dt;
        const near = g.area === 'town' && U.dist(g.player.x, g.player.y, b.x, b.y) < 90;
        if (b.t > 3 && !near) {
          for (let i = 0; i < 6; i++) { g.fx.push({ kind: 'sparkle', x0: b.x + U.rand(-16, 16), y0: b.y + U.rand(-12, 12), x1: 0, y1: 0, t: -i * 0.05, dur: 0.5 }); g.fx.push({ kind: 'sparkle', x0: slot.x + U.rand(-10, 10), y0: slot.y + U.rand(-20, 20), x1: 0, y1: 0, t: -i * 0.05, dur: 0.5 }); }
          Object.assign(b, { x: slot.x, y: slot.y, angle: -Math.PI / 2, vx: 0, vy: 0, state: 'parked', path: [] });
        }
        return;
      }
      case 'toDock': {
        const k = Math.max(0, this.queue.indexOf(b)), spot = this.queueSpot(k);
        if (!b.goal || b.goal.x !== spot.x || b.goal.y !== spot.y) {
          // out of the rack first, then by the waiting spot (it keeps the bikes off the flower bed), then on to the dock
          const q1 = this.queueSpot(1);
          b.goal = spot; b.path = [];
          if (b.y > F.EXIT_Y + 1 && b.x > q1.x + 2) b.path.push({ x: b.x, y: F.EXIT_Y });
          if (b.x > q1.x + 2) b.path.push(q1);
          if (k === 0) b.path.push(spot);
        }
        if (this.follow(b, dt)) {
          if (k === 0) { b.state = 'loading'; b.t = 0; b.wait = 0; }
          else this.turnTo(b, Math.PI, dt);
        }
        return;
      }
      case 'loading': {
        this.turnTo(b, Math.PI / 2, dt);   // nose toward the road, ready to go
        b.t += dt;
        const c = this.conv(), D = this.dock(), want = Math.min(F.CAP, this.need(b.dest.house));
        if (b.t >= F.LOAD_EVERY && b.load < want) {
          b.t = 0;
          const got = c && c.owned(g) ? c.takeFromDock(g, 1) || 0 : 0;
          if (got > 0) {
            b.load += got; b.wait = 0;
            const cx = b.x - Math.cos(b.angle) * 24, cy = b.y - Math.sin(b.angle) * 24;
            g.fx.push({ kind: 'pizza', x0: D.x, y0: D.y - 34, x1: cx, y1: cy - 14 - b.load * 5, t: 0, dur: 0.3 });
            if (g.area === 'town' && U.dist(g.player.x, g.player.y, b.x, b.y) < 500) Sfx.pickup();
          } else b.wait += F.LOAD_EVERY;
        }
        // enough for the order, or the dock ran dry: off we go (an empty bike waits a little, then goes home)
        if (b.load >= want || (b.load > 0 && b.wait >= 0.8)) { this.depart(g, b); this.queue = this.queue.filter((o) => o !== b); }
        else if (b.load === 0 && b.wait >= 3) this.goHome(g, b);
        return;
      }
      case 'out':
        if (this.follow(b, dt)) { b.state = 'drop'; b.t = 0; b.thanks = false; }
        return;
      case 'drop': {
        this.turnTo(b, Math.PI / 2, dt);
        b.t += dt;
        const h = b.dest.house;
        if (!b.thanks && b.t >= F.DROP_EVERY && b.load > 0 && this.need(h) > 0) { b.t = 0; this.dropOne(g, b); }
        if (!b.thanks && (this.need(h) <= 0 || b.load <= 0)) {
          // filled, like the core does it (or as much as this bike had: the order stays open for the next bike)
          if (this.need(h) <= 0) {
            h.order = null; h.happy = 3; g.s.stats.delivered = (g.s.stats.delivered || 0) + 1;
            g.floats.push({ x: h.door.x, y: h.door.y - 56, text: 'Thank you!', color: '#ff6b8a', t: 0, dur: 1.5, big: true });
            Haptics.success();
          }
          g.s.bikefleet.trips++;
          b.thanks = true; b.t = 0;
        }
        if (b.thanks && b.t >= 0.4) this.goHome(g, b);
        return;
      }
      case 'back':
        if (this.follow(b, dt)) { b.state = 'parked'; b.earned = 0; }
        return;
    }
  },
  // from the dock, or straight from the rack (a bike already holding boxes), to the house's door
  depart(g, b) {
    const F = CFG.BIKEFLEET, d = b.dest;
    const lane = d.x > b.x ? F.LANE_E : F.LANE_W;
    b.state = 'out';
    b.path = [{ x: b.x, y: lane }, { x: d.x, y: lane }, { x: d.x, y: F.CURB }];
  },
  dropOne(g, b) {
    const F = CFG.BIKEFLEET, d = b.dest;
    b.load--;
    const amt = Math.round(g.price() * CFG.DELIVERY_TIP);
    g.s.bikefleet.cash += amt; b.earned += amt;
    g.secEarned += amt;
    d.house.order.have++;
    g.fx.push({ kind: 'pizza', x0: b.x, y0: b.y - 24, x1: d.x, y1: d.y - 10, t: 0, dur: 0.25 });
    g.fx.push({ kind: 'cash', x0: d.x, y0: d.y - 10, x1: F.CASH.x, y1: F.CASH.y, t: 0.1, dur: 0.8 });
    g.floats.push({ x: d.x, y: d.y - 30, text: '+' + U.money(amt), color: '#ffe08a', t: 0, dur: 1, big: true });
    if (g.area === 'town' && U.dist(g.player.x, g.player.y, b.x, b.y) < 600) Sfx.cash();
  },

  // ---- buying bikes
  price(g) { const n = g.s.bikefleet.bikes; return n < CFG.BIKEFLEET.PRICES.length ? CFG.BIKEFLEET.PRICES[n] : null; },
  pads(g) {
    if (g.area !== 'town' || !this.visible(g)) return [];
    const p = this.price(g), n = g.s.bikefleet.bikes, max = CFG.BIKEFLEET.PRICES.length;
    if (p === null) return [];
    return [{ key: 'bikefleet', label: n ? 'Another Bike' : 'Delivery Bike', ico: '🛵', pos: CFG.BIKEFLEET.PAD, price: p, sub: `${n}/${max} · delivers for you` }];
  },
  onPad(g, pad) {
    const F = CFG.BIKEFLEET;
    g.s.bikefleet.bikes = Math.min(F.SLOTS.length, g.s.bikefleet.bikes + 1);
    const b = this.makeBike(g.s.bikefleet.bikes - 1);
    if (!this.bikes.some((o) => o.id === b.id)) this.bikes.push(b);
    Sfx.unlock(); Haptics.success();
    g.toast(g.s.bikefleet.bikes === 1 ? '🛵 A delivery bike! It takes pizzas from the dock to the houses' : `🛵 Bike number ${g.s.bikefleet.bikes}!`, true, 'town');
    for (let i = 0; i < 10; i++) g.fx.push({ kind: 'sparkle', x0: b.x + U.rand(-16, 16), y0: b.y + U.rand(-26, 26), x1: 0, y1: 0, t: -i * 0.05, dur: 0.5 });
  },

  hint(g) {
    if (g.area !== 'town' || g.driving || !this.visible(g)) return undefined;
    const F = CFG.BIKEFLEET, p = g.player, R = F.RACK;
    if (U.dist(p.x, p.y, (R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2) > 300) return undefined;
    if (g.s.bikefleet.cash > 0) return { text: 'Bike money! 💵', target: F.CASH };
    const price = this.price(g);
    if (price !== null && g.s.cash + (g.s.padPaid.bikefleet || 0) >= price) return { text: 'Buy a delivery bike! 🛵', target: F.PAD };
    return undefined;
  },

  // ---- drawing
  dynamic(r, g) {
    if (g.area !== 'town' || !this.visible(g)) return;
    const ctx = r.ctx, F = CFG.BIKEFLEET, R = F.RACK;
    // slab
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; U.roundRect(ctx, R.x0 + 3, R.y0 + 4, R.x1 - R.x0, R.y1 - R.y0, 8); ctx.fill();
    ctx.fillStyle = '#c9c4ba'; U.roundRect(ctx, R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
    for (let x = R.x0 + 32; x < R.x1; x += 32) { ctx.beginPath(); ctx.moveTo(x, R.y0 + 2); ctx.lineTo(x, R.y1 - 2); ctx.stroke(); }
    // parking lines under each slot
    ctx.fillStyle = '#fff';
    for (const S of F.SLOTS) { ctx.fillRect(S.x - 15, S.y - 30, 2, 52); }
    ctx.fillRect(F.SLOTS[F.SLOTS.length - 1].x + 13, F.SLOTS[0].y - 30, 2, 52);
    // the stand: a red bar on two posts along the top, with the shop's name on it
    ctx.fillStyle = '#7a7f86'; ctx.fillRect(R.x0 + 8, R.y0 + 2, 5, 14); ctx.fillRect(R.x1 - 13, R.y0 + 2, 5, 14);
    ctx.fillStyle = '#d62828'; U.roundRect(ctx, R.x0 + 4, R.y0 - 6, R.x1 - R.x0 - 8, 14, 5); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = r.font(9); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🛵 PIZZA BIKES 🍕', (R.x0 + R.x1) / 2, R.y0 + 1);
    // cash pile
    r.drawCashPile(F.CASH.x, F.CASH.y, g.s.bikefleet.cash);
    // empty slots look empty; a ghost bike on the next one you can buy
    const n = g.s.bikefleet.bikes;
    if (n < F.SLOTS.length) {
      const S = F.SLOTS[n];
      ctx.save(); ctx.globalAlpha = 0.28; ctx.translate(S.x, S.y); ctx.rotate(-Math.PI / 2); this.drawBike(r, g, { load: 0 }, false, '#9aa0a8'); ctx.restore();
    }
  },
  entities(r, g, items) {
    if (g.area !== 'town' && !(g.driving && this.bikes.includes(g.vehicle))) return;
    for (const b of this.bikes) items.push({ y: b.y + 8, draw: () => this.drawBikeAt(r, g, b) });
  },
  drawBikeAt(r, g, b) {
    const ctx = r.ctx, chef = this.ridden(g, b);
    const rider = chef ? 'chef' : (b.state === 'parked' || b.state === 'leftout') ? null : 'rider';
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.angle);
    this.drawBike(r, g, b, rider);
    ctx.restore();
    // boxes stacked on the carrier, upright on screen
    if (b.load > 0) {
      const cx = b.x - Math.cos(b.angle) * 24, cy = b.y - Math.sin(b.angle) * 24;
      for (let i = 0; i < b.load; i++) this.drawBox(ctx, cx, cy - 8 - i * 7);
    }
    if (b.state === 'parked' || b.state === 'leftout' || chef) r.drawRidingExtras(g, b, 22);
  },
  drawBox(ctx, x, y) {
    ctx.fillStyle = '#c98a4b'; U.roundRect(ctx, x - 11, y - 3, 22, 9, 2); ctx.fill();
    ctx.fillStyle = '#f2d2a0'; U.roundRect(ctx, x - 11, y - 5, 22, 6, 2); ctx.fill();
    ctx.fillStyle = '#d62828'; ctx.beginPath(); ctx.arc(x, y - 2, 2.2, 0, Math.PI * 2); ctx.fill();
  },
  // a pizza-red scooter seen from above, nose +x, with a box carrier on the back (about 62 px long)
  drawBike(r, g, b, rider, tint) {
    const ctx = r.ctx;
    const col = tint || r.paintColor(g.s.paint.fleetbike || '#e4572e', g);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 4, 31, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.ellipse(-18, 0, 8, 5, 0, 0, Math.PI * 2); ctx.ellipse(23, 0, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col; U.roundRect(ctx, -14, -8, 36, 16, 7); ctx.fill();                   // body
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; U.roundRect(ctx, 6, -6, 12, 4, 2); ctx.fill();  // gleam
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, -10, -6, 16, 12, 5); ctx.fill();               // seat
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(16, -12, 3, 24);                                    // handlebar
    ctx.fillStyle = '#1e1e1e'; ctx.fillRect(16, -13, 3, 4); ctx.fillRect(16, 9, 3, 4);         // grips
    ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.arc(25, 0, 3, 0, Math.PI * 2); ctx.fill(); // headlight
    // the carrier: a white box with the pizza-red lid and a slice on it
    ctx.fillStyle = '#f5f5f5'; U.roundRect(ctx, -33, -11, 20, 22, 3); ctx.fill();
    ctx.fillStyle = col; U.roundRect(ctx, -31, -9, 16, 18, 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(-27, -5); ctx.lineTo(-27, 5); ctx.lineTo(-18, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d62828'; ctx.beginPath(); ctx.arc(-24, -1, 1.4, 0, Math.PI * 2); ctx.arc(-24, 2, 1.4, 0, Math.PI * 2); ctx.fill();
    if (rider === 'chef') {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(3, 0, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(1, 0, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(14, -9, 2.5, 0, Math.PI * 2); ctx.arc(14, 9, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (rider) {
      // the delivery rider: red shirt, arms to the bars, a white helmet with a red stripe and a visor
      ctx.fillStyle = '#d62828'; ctx.beginPath(); ctx.ellipse(-1, 0, 9, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d62828'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(2, -8); ctx.lineTo(14, -10); ctx.moveTo(2, 8); ctx.lineTo(14, 10); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#e0ac69'; ctx.beginPath(); ctx.arc(15, -10, 2.5, 0, Math.PI * 2); ctx.arc(15, 10, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(2, 0, 7.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d62828'; ctx.fillRect(-5, -1.5, 13, 3);
      ctx.fillStyle = '#2d3a4a'; ctx.beginPath(); ctx.arc(2, 0, 7.5, -0.7, 0.7); ctx.lineTo(2, 0); ctx.closePath(); ctx.fill();
    }
  },
};
Game.ext.push(BikeFleetExt);
Render.ext.push(BikeFleetExt);
