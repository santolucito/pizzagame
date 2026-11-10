'use strict';
// The delivery bike fleet: the rack south of the pizzeria is clear and reachable, bikes are bought on a pad there,
// with pizzas waiting on the conveyor's dock an idle bike rides over, loads, rides South Road to a door, earns into
// the rack's cash pile and comes home; two bikes queue at the dock without overlapping; nothing moves without
// pizzas; a parked fleet bike can be ridden and pops back into the rack after.
module.exports = async (t) => {
  // the extension may not be wired into index.html yet: load it into the page when it is missing
  const load = async () => { if (!(await t.ev(() => typeof BikeFleetExt !== 'undefined'))) { await t.page.addScriptTag({ url: '/js/bikefleet.js' }); await t.ev(() => { BikeFleetExt.build(Game); T.step(1); }); } };
  // a dock with pizzas: the real conveyor when it is there (built for free, pizzas put on its dock), otherwise a stand-in
  const setup = () => t.ev(() => {
    const real = typeof ConveyorExt !== 'undefined' && ConveyorExt && typeof ConveyorExt.takeFromDock === 'function' && !!(Game.s.conveyor);
    window.BF = { real };
    if (real) {
      // the real belt, built for free, with its feeding from the oven paused so the test decides what lands on the dock
      Game.s.conveyor.owned = true; Game.s.conveyor.belt = []; Game.s.conveyor.dock = 0;
      BF.feed = ConveyorExt.canFeed; ConveyorExt.canFeed = () => false;
      BF.set = (n) => { Game.s.conveyor.dock = n; }; BF.count = () => ConveyorExt.dockCount(Game);
      return real;
    }
    let n = 0;
    window.ConveyorExt = Object.assign(typeof ConveyorExt !== 'undefined' && ConveyorExt ? ConveyorExt : {}, {
      owned: () => true, dockCount: () => n, takeFromDock: (g, k) => { const m = Math.min(n, k); n -= m; return m; },
    });
    if (!CFG.CONVEYOR) CFG.CONVEYOR = { DOCK: { x: 220, y: 760 } };
    BF.set = (k) => { n = k; }; BF.count = () => n;
    return real;
  });
  await t.boot();
  await load();
  const real = await setup();
  console.log('    conveyor:', real ? 'real' : 'stand-in');
  const F = await t.ev(() => CFG.BIKEFLEET);
  t.expect(await t.ev(() => Game.ext.includes(BikeFleetExt) && Render.ext.includes(BikeFleetExt)), 'registered with Game and Render');
  t.expect(await t.ev(() => !!CFG.VEHICLES.fleetbike), 'fleetbike vehicle kind');

  // ---- the rack, cash pile and pad are clear of every obstacle (on foot and for vehicles), off the roads, away from the dock
  const clear = await t.ev((F) => {
    const D = CFG.CONVEYOR.DOCK, bad = [];
    const spots = [...F.SLOTS, F.CASH, F.PAD, { x: (F.RACK.x0 + F.RACK.x1) / 2, y: (F.RACK.y0 + F.RACK.y1) / 2 }];
    for (const s of spots) {
      if (Game.obstacles().some((o) => Game.hitRect(s.x, s.y, 14, o))) bad.push(['obs', s]);
      if (Game.townObstacles(true).some((o) => o.w && Game.hitRect(s.x, s.y, 13, o))) bad.push(['carobs', s]);
      if (CFG.ROADS.some((r) => s.x > r.x0 && s.x < r.x1 && s.y > r.y0 && s.y < r.y1)) bad.push(['road', s]);
    }
    const R = F.RACK, f = CFG.FOUNTAIN;
    if (!(R.x1 < f.x - 60 || R.y0 > f.y + 32)) bad.push('fountain');
    if (D.x > R.x0 - 20 && D.x < R.x1 + 20 && D.y > R.y0 - 20) bad.push('dock in rack');
    return bad;
  }, F);
  t.expectEq(clear.length, 0, `rack spots clear ${JSON.stringify(clear)}`);
  // walk there from the pizzeria door
  const walked = await t.ev((F) => {
    T.tp(CFG.DOOR_OUT.x, CFG.DOOR_OUT.y + 80);
    T.steer(0, 1); T.until(() => Game.player.y >= F.PAD.y, 400);
    T.steer(-1, 0); const n = T.until(() => Game.player.x <= F.PAD.x, 600); T.unsteer();
    return { n, x: Math.round(Game.player.x), y: Math.round(Game.player.y) };
  }, F);
  t.expect(walked.n >= 0, `walked to the bike pad (${JSON.stringify(walked)})`);

  // ---- the pad: buy the first bike
  const pad0 = await t.ev(() => { const p = Game.allPads().find((q) => q.key === 'bikefleet'); return p && { price: p.price, x: p.pos.x }; });
  t.expect(pad0 && pad0.price === F.PRICES[0], `bike pad at $${F.PRICES[0]} (${JSON.stringify(pad0)})`);
  const hint0 = await t.ev((F) => { Game.s.cash = 1000; T.tp(F.PAD.x, F.PAD.y + 60); return T.hint(); }, F);
  t.expectEq(hint0, 'Buy a delivery bike! 🛵', 'hint near the rack');
  const buy1 = await t.ev((F) => { T.tp(F.PAD.x, F.PAD.y); T.until(() => Game.s.bikefleet.bikes === 1, 600); T.tp(F.PAD.x + 150, F.PAD.y); return { bikes: Game.s.bikefleet.bikes, n: BikeFleetExt.bikes.length, cash: Game.s.cash, next: Game.allPads().find((q) => q.key === 'bikefleet').price }; }, F);
  t.expectEq(buy1.bikes, 1, 'one bike bought');
  t.expectEq(buy1.n, 1, 'one bike in the rack');
  t.expectEq(buy1.cash, 1000 - F.PRICES[0], 'paid for it');
  t.expectEq(buy1.next, F.PRICES[1], 'the next bike costs more');

  // ---- nothing happens without pizzas
  const idle = await t.ev(() => { BF.set(0); T.step(300); const b = BikeFleetExt.bikes[0]; return { state: b.state, x: b.x, y: b.y }; });
  t.expectEq(idle.state, 'parked', 'stays parked with an empty dock');
  t.expect(idle.x === F.SLOTS[0].x && idle.y === F.SLOTS[0].y, 'still in its slot');

  // ---- a delivery: dock → load → road → door → cash pile → home
  const trip = await t.ev((F) => {
    T.tp(700, 760);
    const b = BikeFleetExt.bikes[0], D = CFG.CONVEYOR.DOCK, out = {};
    const cash0 = Game.s.bikefleet.cash, del0 = Game.s.stats.delivered;
    BF.set(2);
    out.leave = T.until(() => b.state === 'toDock', 30);
    out.reach = T.until(() => b.state === 'loading', 600);
    out.atDock = Math.round(U.dist(b.x, b.y, D.x, D.y));
    out.load = T.until(() => b.state === 'out', 600);
    out.loaded = b.load; out.dockLeft = BF.count();
    // on the road with its boxes: zoom in for a picture later
    out.road = T.until(() => b.y > 930, 600);
    let insideBuilding = false, maxY = 0;
    const B = CFG.BUILDING;
    const obs = Game.obstacles().concat(Game.townObstacles(true)).filter((o) => o.w && o.h);
    let hit = null; const chk = () => { if (!hit) { const o = obs.find((o) => Game.hitRect(b.x, b.y, 8, o)); if (o) hit = { o, x: Math.round(b.x), y: Math.round(b.y), st: b.state }; } };
    out.drop = T.until(() => { chk(); if (b.x > B.x0 && b.x < B.x1 && b.y > B.y0 && b.y < B.y1) insideBuilding = true; for (const h of CFG.HOUSES) if (b.x > h.x0 + 4 && b.x < h.x1 - 4 && b.y > h.y0 + 4) insideBuilding = true; maxY = Math.max(maxY, b.y); return b.state === 'drop'; }, 1200);
    out.dest = b.dest && { x: b.dest.x, y: b.dest.y };
    out.atDoor = b.dest ? Math.round(U.dist(b.x, b.y, b.dest.x, b.dest.y)) : -1;
    out.back = T.until(() => b.state === 'back', 600);
    out.thanks = Game.floats.some((f) => f.text === 'Thank you!');
    out.earned = Game.s.bikefleet.cash - cash0;
    out.delivered = Game.s.stats.delivered - del0;
    out.home = T.until(() => { chk(); if (b.x > B.x0 && b.x < B.x1 && b.y > B.y0 && b.y < B.y1) insideBuilding = true; return b.state === 'parked'; }, 1500);
    out.slot = Math.round(U.dist(b.x, b.y, F.SLOTS[0].x, F.SLOTS[0].y));
    out.insideBuilding = insideBuilding; out.hit = hit; out.maxY = Math.round(maxY);
    return out;
  }, F);
  t.expect(trip.leave >= 0, 'a bike leaves when pizzas wait');
  t.expect(trip.reach >= 0 && trip.atDock <= 2, `reaches the dock (${JSON.stringify(trip)})`);
  t.expect(trip.load >= 0 && trip.loaded === 2 && trip.dockLeft === 0, `loads both pizzas (${trip.loaded}, ${trip.dockLeft} left)`);
  t.expect(trip.road >= 0, 'rides onto South Road');
  t.expect(trip.drop >= 0 && trip.atDoor <= 22, `stops at a door (${JSON.stringify(trip.dest)}, ${trip.atDoor})`);
  t.expect(trip.back >= 0 && trip.thanks, 'drops off with a Thank you!');
  t.expectEq(trip.earned, 2 * Math.round(8 * 2), 'earns double the pizza price per box into the pile');
  t.expectEq(trip.delivered, 1, 'counts a delivery');
  t.expect(trip.home >= 0 && trip.slot <= 1, `rides home into its slot (${trip.slot})`);
  t.expect(!trip.insideBuilding, 'never drives through a building');
  t.expect(!trip.hit, `never inside an obstacle (${JSON.stringify(trip.hit)})`);
  t.expect(trip.maxY <= 1001, `stays out of the houses (${trip.maxY})`);

  // ---- the cash pile: walk over it
  const coll = await t.ev((F) => { const c0 = Game.s.cash, pile = Game.s.bikefleet.cash; T.tp(F.CASH.x + 120, F.CASH.y); const h = T.hint(); T.tp(F.CASH.x, F.CASH.y); T.step(2); return { pile, got: Game.s.cash - c0, left: Game.s.bikefleet.cash, h }; }, F);
  t.expectEq(coll.h, 'Bike money! 💵', 'hint points at the bike money');
  t.expect(coll.pile > 0 && coll.got === coll.pile && coll.left === 0, `collects the pile (${JSON.stringify(coll)})`);

  // ---- an open house order gets filled by a bike
  const order = await t.ev(() => {
    const h = Game.houses[2]; for (const o of Game.houses) o.order = null; h.order = { want: 2, have: 0, t: 999 }; Game.orderT = 999;
    BF.set(2); const b = BikeFleetExt.bikes[0];
    T.until(() => b.state === 'out', 600); const dest = b.dest && b.dest.x;
    T.until(() => b.state === 'back', 1500);
    return { dest, door: h.door.x, order: h.order };
  });
  t.expectEq(order.dest, order.door, 'the bike goes to the house that ordered');
  t.expectEq(order.order, null, 'and fills the order');
  await t.ev(() => T.until(() => BikeFleetExt.bikes.every((b) => b.state === 'parked'), 1500));

  // ---- more bikes; the price grows; at most five
  const more = await t.ev((F) => {
    Game.s.cash = 10000; const prices = [];
    for (let i = 0; i < 6; i++) { const p = Game.allPads().find((q) => q.key === 'bikefleet'); if (!p) break; prices.push(p.price); T.tp(F.PAD.x + 200, F.PAD.y); T.tp(F.PAD.x, F.PAD.y); const n = Game.s.bikefleet.bikes; T.until(() => Game.s.bikefleet.bikes > n, 900); T.tp(F.PAD.x + 200, F.PAD.y); }
    return { prices, bikes: Game.s.bikefleet.bikes, n: BikeFleetExt.bikes.length, pad: !!Game.allPads().find((q) => q.key === 'bikefleet') };
  }, F);
  t.expectEq(JSON.stringify(more.prices), JSON.stringify(F.PRICES.slice(1)), 'growing prices');
  t.expectEq(more.bikes, 5, 'five bikes');
  t.expectEq(more.n, 5, 'five in the rack');
  t.expect(!more.pad, 'no pad when the rack is full');
  await t.ev(() => { T.tp(560, 800); Render.MIN_ZOOMED_VIEW = 150; Render.setZoom(2.2); Game.cameraSnap = true; T.step(2); });
  await t.shot('rack');

  // ---- lots of pizzas: bikes queue at the dock and never overlap there
  const two = await t.ev(() => {
    BF.set(8);
    const n = T.until(() => BikeFleetExt.queue.length === 2 && BikeFleetExt.queue.every((b) => !b.moving) && BikeFleetExt.queue[0].state === 'loading', 900);
    const D = CFG.CONVEYOR.DOCK; T.tp(D.x + 140, D.y - 20); Render.setZoom(2.2); Game.cameraSnap = true; T.step(1);
    return n;
  });
  t.expect(two >= 0, 'two bikes at the dock: one loading, one waiting');
  await t.shot('dock');
  const q = await t.ev(() => {
    let minD = 999, maxQ = 0, worst = null, out = 0;
    T.until(() => {
      const st = BikeFleetExt.bikes.filter((b) => b.state === 'loading' || (b.state === 'toDock' && !b.moving));
      maxQ = Math.max(maxQ, BikeFleetExt.bikes.filter((b) => b.state === 'loading' || b.state === 'toDock').length);
      for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) { const d = U.dist(st[i].x, st[i].y, st[j].x, st[j].y); if (d < minD) { minD = d; worst = [st[i].state, st[j].state]; } }
      out = Math.max(out, BikeFleetExt.bikes.filter((b) => b.state === 'out' || b.state === 'drop').length);
      return BF.count() === 0 && BikeFleetExt.bikes.every((b) => b.state !== 'loading' && b.state !== 'toDock');
    }, 3000);
    return { minD: Math.round(minD), maxQ, worst, out, left: BF.count() };
  });
  t.expect(q.minD >= 40, `bikes at the dock keep apart (${JSON.stringify(q)})`);
  t.expect(q.maxQ <= 2, 'at most two bikes at the dock');
  t.expect(q.out >= 2, `several bikes deliver at once (${q.out})`);
  t.expectEq(q.left, 0, 'the dock is emptied');
  // a picture of a bike on the road with its boxes
  await t.ev(() => {
    const b = BikeFleetExt.bikes.find((o) => o.state === 'out' && o.y > 930) || BikeFleetExt.bikes.find((o) => o.state === 'out');
    if (b) { T.tp(b.x, Math.min(b.y + 60, 1000)); Game.player.x = b.x - 40; }
    Render.setZoom(2.4); Game.cameraSnap = true; T.step(1);
  });
  await t.shot('road');
  await t.ev(() => T.until(() => BikeFleetExt.bikes.every((b) => b.state === 'parked'), 3000));

  // ---- the whole chain with the real belt: oven pile → belt → dock → bike → house
  if (real) {
    const chain = await t.ev(() => {
      ConveyorExt.canFeed = BF.feed; Game.s.conveyor.dock = 0; Game.s.conveyor.belt = []; Game.s.piles.oven = 3;
      const trips0 = Game.s.bikefleet.trips, cash0 = Game.s.bikefleet.cash;
      const n = T.until(() => Game.s.bikefleet.trips > trips0, 4000);
      ConveyorExt.canFeed = () => false;
      return { n, trips: Game.s.bikefleet.trips - trips0, earned: Game.s.bikefleet.cash - cash0, dock: BF.count(), belt: Game.s.conveyor.belt.length };
    });
    t.expect(chain.n >= 0 && chain.trips >= 1 && chain.earned > 0, `pizzas ride the belt to the dock and a bike delivers them (${JSON.stringify(chain)})`);
    await t.ev(() => { Game.s.conveyor.belt = []; Game.s.conveyor.dock = 0; T.until(() => BikeFleetExt.bikes.every((b) => b.state === 'parked'), 3000); });
  }

  // ---- ride a parked fleet bike; it pops back into the rack after you hop off and walk away
  const ride = await t.ev((F) => {
    BF.set(0);
    const S = F.SLOTS[4]; T.tp(S.x, S.y + 40);
    const label = Game.carNear && CFG.VEHICLES[Game.nearVehicle.kind].label; Game.enterCar(); T.step(1);
    const b = Game.vehicle, kind = b && b.kind; if (!b) return { label, near: Game.nearVehicle && Game.nearVehicle.kind, states: BikeFleetExt.bikes.map((o) => o.state + "@" + Math.round(o.x) + "," + Math.round(o.y)) };
    T.steer(1, 0); T.step(40); T.unsteer(); T.step(20);
    const moved = Math.round(b.x - S.x);
    Game.exitCar(); T.step(2);
    const state = b.state;
    Game.player.x = 900; Game.player.y = 760; T.step(240);
    return { label, kind, moved, state, after: b.state, at: Math.round(U.dist(b.x, b.y, S.x, S.y)) };
  }, F);
  t.expectEq(ride.label, '🛵 Ride', 'vehicle button at a parked bike');
  t.expectEq(ride.kind, 'fleetbike', 'riding a fleet bike');
  t.expect(ride.moved > 60, `it drives (${ride.moved})`);
  t.expectEq(ride.state, 'leftout', 'left where you hopped off');
  t.expect(ride.after === 'parked' && ride.at <= 1, `back in the rack (${JSON.stringify(ride)})`);

  // ---- saved: the fleet size and the pile survive a reload
  await t.ev(() => { Game.s.bikefleet.cash = 37; Game.save(); });
  await t.reload();
  await load();
  const saved = await t.ev(() => ({ bikes: Game.s.bikefleet.bikes, cash: Game.s.bikefleet.cash, n: BikeFleetExt.bikes.length }));
  t.expectEq(saved.bikes, 5, 'fleet size saved');
  t.expectEq(saved.cash, 37, 'cash pile saved');
  t.expectEq(saved.n, 5, 'bikes rebuilt');
  t.assertNoPageErrors();
};
