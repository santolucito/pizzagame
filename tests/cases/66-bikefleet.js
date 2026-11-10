'use strict';
// The delivery bike fleet: the rack south of the pizzeria is clear and reachable, bikes are bought on a pad there.
// Bikes only ride for a house order: none move without one (even with a full dock); one order sends exactly one bike
// that loads what the order needs, fills it, earns into the rack's cash pile and comes home; two orders send two
// bikes that queue at the dock without overlapping; an order filled meanwhile sends the bike home with its boxes
// (kept for the next order, never lost); a parked fleet bike can be ridden and pops back into the rack after.
module.exports = async (t) => {
  // the extension may not be wired into index.html yet: load it into the page when it is missing
  const load = async () => { if (!(await t.ev(() => typeof BikeFleetExt !== 'undefined'))) { await t.page.addScriptTag({ url: '/js/bikefleet.js' }); await t.ev(() => { BikeFleetExt.build(Game); T.step(1); }); } };
  // a dock with pizzas: the real conveyor when it is there (built for free, pizzas put on its dock), otherwise a stand-in
  const setup = () => t.ev(() => {
    const real = typeof ConveyorExt !== 'undefined' && ConveyorExt && typeof ConveyorExt.takeFromDock === 'function' && !!(Game.s.conveyor);
    window.BF = { real,
      order: (i, want) => { Game.houses[i].order = { want, have: 0, t: 999 }; },
      noOrders: () => { for (const h of Game.houses) h.order = null; Game.orderT = 1e9; },
      busy: (b) => b.state === 'toDock' || b.state === 'loading' || b.state === 'out' || b.state === 'drop' };
    BF.noOrders();
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

  // ---- no order, no trip: not even with a full dock; an order with an empty dock does nothing either
  const busy = null;
  const idle = await t.ev((busy) => {
    const isBusy = BF.busy; BF.noOrders(); BF.set(8); T.tp(700, 760);
    let moved = 0; T.until(() => { moved = Math.max(moved, BikeFleetExt.bikes.filter(isBusy).length); return false; }, 600);
    const r = { moved, dock: BF.count(), parked: BikeFleetExt.bikes.every((b, i) => b.state === 'parked' && b.x === CFG.BIKEFLEET.SLOTS[i].x && b.y === CFG.BIKEFLEET.SLOTS[i].y), hint: T.hint() };
    BF.set(0); BF.order(0, 2); T.until(() => { r.moved2 = Math.max(r.moved2 || 0, BikeFleetExt.bikes.filter(isBusy).length); return false; }, 300);
    BF.noOrders();
    return r;
  }, busy);
  t.expectEq(idle.moved, 0, 'no bike moves without an order, full dock or not');
  t.expectEq(idle.dock, 8, 'the dock keeps its pizzas');
  t.expect(idle.parked, 'every bike still in its slot');
  t.expectEq(idle.moved2 || 0, 0, 'an order with an empty dock: no bike goes');

  // ---- one order: exactly one bike goes, loads what the order needs, fills it, earns, comes home
  const trip = await t.ev(([F, busy]) => {
    const isBusy = BF.busy; BF.noOrders(); T.tp(700, 760);
    const D = CFG.CONVEYOR.DOCK, out = {}, h = Game.houses[2];
    const cash0 = Game.s.bikefleet.cash, del0 = Game.s.stats.delivered;
    BF.set(5); BF.order(2, 2);
    out.leave = T.until(() => BikeFleetExt.bikes.some(isBusy), 30);
    const b = BikeFleetExt.bikes.find(isBusy);
    let most = 0; const count = () => { most = Math.max(most, BikeFleetExt.bikes.filter(isBusy).length); };
    out.reach = T.until(() => { count(); return b.state === 'loading'; }, 600);
    out.atDock = Math.round(U.dist(b.x, b.y, D.x, D.y));
    out.load = T.until(() => { count(); return b.state === 'out'; }, 600);
    out.loaded = b.load; out.dockLeft = BF.count();
    out.road = T.until(() => b.y > 930, 600);
    let insideBuilding = false, maxY = 0;
    const B = CFG.BUILDING;
    const obs = Game.obstacles().concat(Game.townObstacles(true)).filter((o) => o.w && o.h);
    let hit = null; const chk = () => { count(); if (!hit) { const o = obs.find((o) => Game.hitRect(b.x, b.y, 8, o)); if (o) hit = { o, x: Math.round(b.x), y: Math.round(b.y), st: b.state }; } };
    out.drop = T.until(() => { chk(); if (b.x > B.x0 && b.x < B.x1 && b.y > B.y0 && b.y < B.y1) insideBuilding = true; for (const hh of CFG.HOUSES) if (b.x > hh.x0 + 4 && b.x < hh.x1 - 4 && b.y > hh.y0 + 4) insideBuilding = true; maxY = Math.max(maxY, b.y); return b.state === 'drop'; }, 1200);
    out.atDoor = Math.round(U.dist(b.x, b.y, h.door.x, h.door.y));
    out.back = T.until(() => { count(); return b.state === 'back'; }, 600);
    out.thanks = Game.floats.some((f) => f.text === 'Thank you!');
    out.order = h.order;
    out.earned = Game.s.bikefleet.cash - cash0;
    out.delivered = Game.s.stats.delivered - del0;
    out.home = T.until(() => { chk(); if (b.x > B.x0 && b.x < B.x1 && b.y > B.y0 && b.y < B.y1) insideBuilding = true; return b.state === 'parked'; }, 1500);
    const slot = CFG.BIKEFLEET.SLOTS[b.id];
    out.slot = Math.round(U.dist(b.x, b.y, slot.x, slot.y)); out.held = b.load;
    out.insideBuilding = insideBuilding; out.hit = hit; out.maxY = Math.round(maxY); out.most = most;
    out.after = (T.step(300), BikeFleetExt.bikes.filter(isBusy).length);
    return out;
  }, [F, busy]);
  t.expect(trip.leave >= 0, 'a bike leaves for the order');
  t.expectEq(trip.most, 1, 'exactly one bike goes');
  t.expect(trip.reach >= 0 && trip.atDock <= 2, `reaches the dock (${JSON.stringify(trip)})`);
  t.expect(trip.load >= 0 && trip.loaded === 2 && trip.dockLeft === 3, `loads just the 2 the order wants (${trip.loaded}, ${trip.dockLeft} left on the dock)`);
  t.expect(trip.road >= 0, 'rides onto South Road');
  t.expect(trip.drop >= 0 && trip.atDoor <= 22, `stops at the ordering house's door (${trip.atDoor})`);
  t.expect(trip.back >= 0 && trip.thanks, 'fills it with a Thank you!');
  t.expectEq(trip.order, null, 'the order is cleared');
  t.expectEq(trip.earned, 2 * Math.round(8 * 2), 'earns double the pizza price per box into the pile');
  t.expectEq(trip.delivered, 1, 'counts a delivery');
  t.expect(trip.home >= 0 && trip.slot <= 1 && trip.held === 0, `rides home into its slot, empty (${trip.slot}, ${trip.held})`);
  t.expect(!trip.insideBuilding, 'never drives through a building');
  t.expect(!trip.hit, `never inside an obstacle (${JSON.stringify(trip.hit)})`);
  t.expect(trip.maxY <= 1001, `stays out of the houses (${trip.maxY})`);
  t.expectEq(trip.after, 0, 'no more trips once the order is filled (3 pizzas still on the dock)');

  // ---- the cash pile: walk over it
  const coll = await t.ev((F) => { const c0 = Game.s.cash, pile = Game.s.bikefleet.cash; T.tp(F.CASH.x + 120, F.CASH.y); const h = T.hint(); T.tp(F.CASH.x, F.CASH.y); T.step(2); return { pile, got: Game.s.cash - c0, left: Game.s.bikefleet.cash, h }; }, F);
  t.expectEq(coll.h, 'Bike money! 💵', 'hint points at the bike money');
  t.expect(coll.pile > 0 && coll.got === coll.pile && coll.left === 0, `collects the pile (${JSON.stringify(coll)})`);

  // ---- two orders: two bikes, one each, queueing at the dock without overlapping
  const two = await t.ev((busy) => {
    const isBusy = BF.busy; BF.noOrders(); T.tp(700, 760);
    BF.set(8); BF.order(0, 3); BF.order(2, 3);
    const n = T.until(() => BikeFleetExt.queue.length === 2 && BikeFleetExt.queue.every((b) => !b.moving) && BikeFleetExt.queue[0].state === 'loading', 900);
    const dests = BikeFleetExt.bikes.filter(isBusy).map((b) => b.dest.house.i).sort();
    const D = CFG.CONVEYOR.DOCK; T.tp(D.x + 140, D.y - 20); Render.setZoom(2.2); Game.cameraSnap = true; T.step(1);
    return { n, dests };
  }, busy);
  t.expect(two.n >= 0, 'two bikes at the dock: one loading, one waiting');
  t.expectEq(JSON.stringify(two.dests), '[0,2]', 'one bike per ordering house');
  await t.shot('dock');
  const q = await t.ev((busy) => {
    const isBusy = BF.busy;
    let minD = 999, most = 0, worst = null, out = 0;
    T.until(() => {
      const st = BikeFleetExt.bikes.filter((b) => b.state === 'loading' || (b.state === 'toDock' && !b.moving));
      most = Math.max(most, BikeFleetExt.bikes.filter(isBusy).length);
      for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) { const d = U.dist(st[i].x, st[i].y, st[j].x, st[j].y); if (d < minD) { minD = d; worst = [st[i].state, st[j].state]; } }
      out = Math.max(out, BikeFleetExt.bikes.filter((b) => b.state === 'out' || b.state === 'drop').length);
      return BikeFleetExt.bikes.some((b) => b.state === 'out' && b.y > 940 && b.load > 0);
    }, 3000);
    const b = BikeFleetExt.bikes.find((o) => o.state === 'out' && o.y > 930);
    if (b) { T.tp(b.x - 130, 1000); }
    Render.setZoom(2.4); Game.cameraSnap = true; T.step(1);
    return { minD: Math.round(minD), most, worst, out };
  }, busy);
  await t.shot('road');
  const q2 = await t.ev(() => {
    let minD = 999, most = 0;
    T.until(() => {
      const st = BikeFleetExt.bikes.filter((b) => b.state === 'loading' || (b.state === 'toDock' && !b.moving));
      most = Math.max(most, BikeFleetExt.bikes.filter(BF.busy).length);
      for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) minD = Math.min(minD, U.dist(st[i].x, st[i].y, st[j].x, st[j].y));
      return Game.houses.every((h) => !h.order) && BikeFleetExt.bikes.every((b) => b.state === 'parked');
    }, 3000);
    return { minD: Math.round(minD), most, orders: Game.houses.filter((h) => h.order).length, dock: BF.count(), held: BikeFleetExt.bikes.reduce((a, b) => a + b.load, 0) }; });
  t.expect(q.minD >= 40 && q2.minD >= 40, `bikes at the dock keep apart (${JSON.stringify([q, q2])})`);
  t.expectEq(Math.max(q.most, q2.most), 2, 'exactly two bikes go');
  t.expectEq(q2.orders, 0, 'both orders filled');
  t.expectEq(q2.dock + q2.held, 2, `the other 2 pizzas are still there (${JSON.stringify(q2)})`);

  // ---- the order is filled by the chef while the bike is on its way: the bike rides home and keeps its boxes,
  // then takes them straight to the next order without the dock
  const gone = await t.ev((busy) => {
    const isBusy = BF.busy; BF.noOrders(); BF.set(3); const h = Game.houses[1]; BF.order(1, 3);
    T.until(() => BikeFleetExt.bikes.some(isBusy), 30);
    const b = BikeFleetExt.bikes.find(isBusy);
    const r = { out: T.until(() => b.state === 'out' && b.y > 930, 900), load: b.load };
    h.order = null;   // the chef got there first
    r.backState = (T.step(2), b.state);
    r.home = T.until(() => b.state === 'parked', 1500);
    r.held = b.load; r.dock = BF.count(); r.saved = Game.s.bikefleet.held[b.id];
    // a new order with an empty dock: the loaded bike goes straight from the rack
    const c0 = Game.s.bikefleet.cash; BF.order(0, 2);
    r.leaves = T.until(() => b.state === 'out', 30);
    r.toDock = BikeFleetExt.bikes.some((o) => o.state === 'toDock' || o.state === 'loading');
    r.done = T.until(() => b.state === 'parked' && !Game.houses[0].order, 2000);
    r.held2 = b.load; r.earned = Game.s.bikefleet.cash - c0;
    return r;
  }, busy);
  t.expect(gone.out >= 0 && gone.load === 3, `the bike set off with 3 (${JSON.stringify(gone)})`);
  t.expectEq(gone.backState, 'back', 'turns back when the order goes away');
  t.expect(gone.home >= 0 && gone.held === 3 && gone.dock === 0 && gone.saved === 3, `home with all 3 boxes, none lost (${JSON.stringify(gone)})`);
  t.expect(gone.leaves >= 0 && !gone.toDock, 'takes the held boxes straight to the next order');
  t.expect(gone.done >= 0 && gone.held2 === 1 && gone.earned === 32, `fills it with 2 and keeps 1 (${JSON.stringify(gone)})`);
  await t.ev(() => { BF.noOrders(); });

  // ---- the whole chain with the real belt: oven pile → belt → dock → bike → house
  if (real) {
    const chain = await t.ev(() => {
      BikeFleetExt.bikes.forEach((b) => { b.load = 0; });
      ConveyorExt.canFeed = BF.feed; Game.s.conveyor.dock = 0; Game.s.conveyor.belt = []; Game.s.piles.oven = 3;
      BF.order(2, 2);
      const trips0 = Game.s.bikefleet.trips, cash0 = Game.s.bikefleet.cash;
      const n = T.until(() => Game.s.bikefleet.trips > trips0 && !Game.houses[2].order, 4000);
      ConveyorExt.canFeed = () => false;
      return { n, trips: Game.s.bikefleet.trips - trips0, earned: Game.s.bikefleet.cash - cash0, order: Game.houses[2].order };
    });
    t.expect(chain.n >= 0 && chain.trips >= 1 && chain.earned > 0 && !chain.order, `pizzas ride the belt to the dock and a bike fills the order (${JSON.stringify(chain)})`);
    await t.ev(() => { Game.s.conveyor.belt = []; Game.s.conveyor.dock = 0; T.until(() => BikeFleetExt.bikes.every((b) => b.state === 'parked'), 3000); });
  }

  // ---- ride a parked fleet bike; it pops back into the rack after you hop off and walk away
  const ride = await t.ev((F) => {
    BF.set(0); BF.noOrders();
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
  await t.ev(() => { BikeFleetExt.bikes[0].load = 2; T.step(1); Game.s.bikefleet.cash = 37; Game.save(); });
  await t.reload();
  await load();
  const saved = await t.ev(() => ({ bikes: Game.s.bikefleet.bikes, cash: Game.s.bikefleet.cash, n: BikeFleetExt.bikes.length, held: BikeFleetExt.bikes[0].load }));
  t.expectEq(saved.bikes, 5, 'fleet size saved');
  t.expectEq(saved.cash, 37, 'cash pile saved');
  t.expectEq(saved.n, 5, 'bikes rebuilt');
  t.expectEq(saved.held, 2, 'boxes held on a bike are saved too');
  t.assertNoPageErrors();
};
