'use strict';
// Every vehicle at both airports can be ridden or driven. The inventory: on the town airfield the chef's yellow plane
// (stand 1), the visitors' blue and red planes (stands 2 and 3), the big jet at Gate 1, the green helicopter, the bag
// train (a baggage tug pulling two luggage carts), the fuel truck and the two cars in the car park; at Cloud Harbor the plane waiting on the cloud
// runway and the hot-air balloon. Indoors, the hangar's tug and the fuel farm's truck drive you out onto the apron at the
// wheel of the bag train and the fuel truck. For each one: get in, drive (it moves), get out (onto free ground). Then the
// two ground vehicles in detail: the carts following the tug, loading the bags into the jet and fetching more at the
// terminal, the fuel truck fuelling a plane (the hose, glug glug, a full tank), their hints, a plane taking off sending a
// vehicle left on the runway back to its bay, hopping out anywhere free, Take-me-home parking them, and screenshots at
// desktop and phone size.
module.exports = async (t) => {
  await t.boot();
  await t.ev(() => {
    // steer towards a spot every step until the vehicle (or the chef) gets there; returns the steps taken, or -1
    window.V = {
      driveTo(tx, ty, max = 600, r = 16) {
        for (let i = 0; i < max; i++) {
          const v = Game.driving ? Game.vehicle : Game.player, dx = tx - v.x, dy = ty - v.y, d = Math.hypot(dx, dy);
          if (d < r) { T.unsteer(); T.step(20); return i; }
          T.steer(dx / d, dy / d); Game.update(1 / 60);
        }
        T.unsteer(); return -1;
      },
      freeAt(x, y) { return !Game.obstacles().some((o) => Game.hitRect(x, y, 12, o)); },
      gse() { return AirfieldExt.rt.gse; },
    };
  });

  // ---- registered: the two ground vehicles are vehicles like any car, with their own labels
  const reg = await t.ev(() => ({
    specs: ['bagtug', 'fuelbowser'].map((k) => CFG.VEHICLES[k] && [CFG.VEHICLES[k].label, CFG.VEHICLES[k].exit]),
    listed: Game.vehicles().includes(V.gse().tug) && Game.vehicles().includes(V.gse().fuel),
    homes: ['tug', 'fuel'].map((k) => { const v = V.gse()[k], H = CFG.AIRFIELD.GSE[k]; return v.x === H.x && v.y === H.y; }),
  }));
  t.expectEq(JSON.stringify(reg.specs), JSON.stringify([['🧳 Drive the bag train', '🚶 Hop out'], ['⛽ Drive the fuel truck', '🚶 Hop out']]), 'the bag train and the fuel truck are registered vehicles');
  t.expect(reg.listed && reg.homes.every(Boolean), 'both are listed and parked in their bays');

  // ---- the inventory: every vehicle at the two airports. Get in, drive, get out
  const LIST = [
    ['town', 'yellow plane', 'rt.plane', [-1, 0]], ['town', 'blue plane', 'rt.visitors[0]', [0, -1]], ['town', 'red plane', 'rt.visitors[1]', [0, -1]],
    ['town', 'big jet', 'rt.jet', [-1, 0]], ['town', 'helicopter', 'rt.heli', [1, 0]], ['town', 'bag train', 'rt.gse.tug', [0, 1]], ['town', 'fuel truck', 'rt.gse.fuel', [0, 1]],
    ['town', 'green car', 'rt.gse.cars[0]', [1, 0], [-60, 0]], ['town', 'purple car', 'rt.gse.cars[1]', [1, 0], [-60, 0]],
    ['cloud', 'cloud plane', 'rt.cloudPlane', [-1, 0]], ['cloud', 'balloon', 'rt.balloon', [-1, 0]],
  ];
  // nothing at the airports that moves is left out of the list
  const all = await t.ev((list) => {
    const rt = AirfieldExt.rt, S = CFG.AIRFIELD.STRIP, W = CFG.CLOUD.WORLD, mine = list.map(([, , path]) => eval(path));   // eslint-disable-line no-eval
    const at = Game.vehicles().filter((v) => (v.x >= S.x0 && v.x <= S.x1 && v.y >= S.y0 && v.y <= S.y1) || (v.x >= W.x0 && v.x <= W.x1 && v.y >= W.y0 && v.y <= W.y1));
    return { n: at.length, missing: at.filter((v) => !mine.includes(v)).map((v) => v.kind) };
  }, LIST);
  t.expectEq(all.missing.join(','), '', 'every vehicle at the airfield and at Cloud Harbor is in the inventory');
  t.expectEq(all.n, LIST.length, 'eleven vehicles at the two airports');
  for (const [area, name, path, dir, off] of LIST) {
    const r = await t.ev(([area, path, dir, off]) => {
      const rt = AirfieldExt.rt, v = eval(path), o = off || [0, 46];   // eslint-disable-line no-eval
      T.tp(v.x + o[0], v.y + o[1], area); T.step(2);
      const near = Game.findNearVehicle() === v, label = CFG.VEHICLES[v.kind].label;
      Game.enterCar(); T.step(2);
      const inIt = Game.driving && Game.vehicle === v, x0 = v.x, y0 = v.y;
      T.steer(dir[0], dir[1]); T.step(50); T.unsteer(); T.step(20);
      const moved = Math.hypot(v.x - x0, v.y - y0), still = Game.driving && Game.vehicle === v, exitLabel = CFG.VEHICLES[v.kind].exit;
      Game.exitCar(); T.step(2);
      const out = !Game.driving && V.freeAt(Game.player.x, Game.player.y), outArea = Game.area;
      // back where it was, so the next one is the nearest to its own spot
      for (const q of rt.planes) AirfieldExt.park(q, q.home); AirfieldExt.park(rt.cloudPlane, CFG.CLOUD.PLANE_HOME); rt.balloon.x = CFG.CLOUD.BALLOON.x; rt.balloon.y = CFG.CLOUD.BALLOON.y; AirfieldExt.home(Game);
      return { near, label, inIt, moved: Math.round(moved), still, exitLabel, out, area: outArea };
    }, [area, path, dir, off]);
    t.expect(r.near, `${name}: standing beside it, the vehicle button offers it (${r.label})`);
    t.expect(r.inIt, `${name}: in it`);
    t.expect(r.moved > 20 && r.still, `${name}: it moves with the joystick (${r.moved} px)`);
    t.expect(r.out && r.area === area, `${name}: out again ('${r.exitLabel}') onto free ground`);
  }
  // put everything back where it belongs
  await t.ev(() => { const rt = AirfieldExt.rt; for (const v of rt.planes) AirfieldExt.park(v, v.home); AirfieldExt.park(rt.cloudPlane, CFG.CLOUD.PLANE_HOME); rt.balloon.x = CFG.CLOUD.BALLOON.x; rt.balloon.y = CFG.CLOUD.BALLOON.y; AirfieldExt.home(Game); T.tp(2300, 400, 'town'); T.step(2); });

  // ---- indoors: the hangar's tug and the fuel farm's truck drive you out onto the apron
  for (const [room, spot, label, which, kind] of [['afhangar', 'TUG_SPOT', '🚜 Drive the tug', 'tug', 'bagtug'], ['affuel', 'TRUCK_SPOT', '🚚 Drive the fuel truck', 'fuel', 'fuelbowser']]) {
    const r = await t.ev(([room, spot, which]) => {
      const R = CFG.AF_IN.ROOMS[room], v = V.gse()[which]; v.x += 300; T.step(1);   // parked somewhere else: it comes back to its bay to meet you
      T.tp(R[spot].x, R[spot].y, room); const l = T.label(); T.act(); T.until(() => Game.area === 'town', 200); T.step(2);
      const H = CFG.AIRFIELD.GSE[which], inIt = Game.driving && Game.vehicle === v, d = Math.hypot(v.x - H.x, v.y - H.y);
      const x0 = v.x, y0 = v.y; T.steer(0, 1); T.step(40); T.unsteer(); T.step(10); const moved = Math.hypot(v.x - x0, v.y - y0);
      Game.exitCar(); T.step(2);
      return { l, area: Game.area, inIt, kind: v.kind, d: Math.round(d), moved: Math.round(moved), out: !Game.driving && V.freeAt(Game.player.x, Game.player.y) };
    }, [room, spot, which]);
    t.expectEq(r.l, label, `${room}: the indoor ${which} button`);
    t.expect(r.area === 'town' && r.inIt && r.kind === kind && r.d < 1, `${room}: out on the apron at the wheel, in its bay (${JSON.stringify(r)})`);
    t.expect(r.moved > 20 && r.out, `${room}: drive it, hop out (${JSON.stringify(r)})`);
  }
  await t.ev(() => { AirfieldExt.home(Game); for (const k of Object.keys(Game.s.afGse)) Game.s.afGse[k] = 0; T.step(1); });

  // ======== the bag train ========
  const tugIn = await t.ev(() => {
    const v = V.gse().tug; T.tp(v.x, v.y + 40, 'town'); T.step(2);
    const hint = T.hint(), target = Game.hint && Game.hint.target;
    Game.enterCar(); T.step(3);
    return { hint, target, rides: Game.s.afGse.tugRides, floats: Game.floats.map((f) => f.text), hint2: T.hint(), toJet: !!(Game.hint && Game.hint.target === AirfieldExt.rt.jet), label: T.label() };
  });
  t.expectEq(tugIn.hint, 'Drive the bag train! 🧳', 'bag train: the hint beside it');
  t.expect(!tugIn.target, 'bag train: no arrow right beside it');
  t.expect(tugIn.rides === 1 && tugIn.floats.includes('Beep beep! 🧳'), 'bag train: beep beep as you hop in');
  t.expectEq(tugIn.hint2, 'Drive the bags to the big jet! 🧳', 'bag train: drive the bags to the jet');
  t.expect(tugIn.toJet, 'bag train: the arrow points at the jet');
  t.expect(tugIn.label === null, 'bag train: no load button in its bay, away from the jet');
  // the carts follow the tug round a corner, always hitched up close behind
  const follow = await t.ev(() => {
    const v = V.gse().tug, c0 = { x: v.carts[0].x, y: v.carts[0].y };
    T.steer(-1, 0); T.step(25); T.steer(0, 1); T.step(25); T.unsteer(); T.step(10);
    const [a, b] = v.carts;
    return { moved: Math.hypot(a.x - c0.x, a.y - c0.y), d0: Math.hypot(a.x - v.x, a.y - v.y), d1: Math.hypot(b.x - a.x, b.y - a.y), behind: (a.x - v.x) * Math.cos(v.angle) + (a.y - v.y) * Math.sin(v.angle) };
  });
  t.expect(follow.moved > 20 && follow.d0 > 30 && follow.d0 < 42 && follow.d1 > 30 && follow.d1 < 41 && follow.behind < -20, `bag train: the carts follow behind the tug (${JSON.stringify(follow)})`);
  // drive up beside the jet: load the bags
  const toJet = await t.ev(() => { const j = AirfieldExt.rt.jet; const n = V.driveTo(j.x + 20, j.y + 60, 600, 12); return { n, label: T.label(), hint: T.hint() }; });
  t.expect(toJet.n >= 0, 'bag train: drove over to the jet');
  t.expectEq(toJet.label, '🧳 Load the bags', 'bag train: load label beside the jet');
  t.expectEq(toJet.hint, 'Press the button to load the bags! 🧳', 'bag train: load hint');
  const load = await t.ev(() => {
    const v = V.gse().tug, x0 = v.x, y0 = v.y; T.act(); T.steer(1, 1); T.step(25);
    const mid = { bags: v.bags, flying: AirfieldExt.rt.flyBags.length, hint: T.hint(), label: T.label(), held: Math.hypot(v.x - x0, v.y - y0) < 1 };
    T.unsteer(); T.until(() => !AirfieldExt.rt.load, 300); T.step(2);
    return { mid, bags: v.bags, loads: Game.s.afGse.loads, floats: Game.floats.map((f) => f.text), hint: T.hint(), target: Game.hint && Game.hint.target, pick: CFG.AIRFIELD.BAG_PICKUP };
  });
  t.expect(load.mid.bags < 4 && load.mid.flying > 0 && load.mid.label === null && load.mid.held, `bag train: the bags hop into the hold, the train waits (${JSON.stringify(load.mid)})`);
  t.expectEq(load.mid.hint, 'Thump, thump! In go the bags 🧳', 'bag train: loading hint');
  t.expect(load.bags === 0 && load.loads === 1 && load.floats.includes('All aboard! 🧳✈️'), `bag train: all aboard (${JSON.stringify(load)})`);
  t.expectEq(load.hint, 'Get more bags at the terminal! 🧳', 'bag train: then more bags at the terminal');
  t.expect(load.target && load.target.x === load.pick.x && load.target.y === load.pick.y, 'bag train: the arrow points at the pickup by the arrivals hall');
  await t.ev(() => { const v = V.gse().tug; v.bags = 4; const j = AirfieldExt.rt.jet; Render.setZoom(1.2); T.step(1); T.act(); T.step(12); Game.cameraSnap = true; });
  await t.shot('bagtrain-loading');
  await t.ev(() => { T.until(() => !AirfieldExt.rt.load, 300); Render.setZoom(1); });
  // over to the arrivals hall for more bags
  const pick = await t.ev(() => { const P = CFG.AIRFIELD.BAG_PICKUP; const n = V.driveTo(P.x, P.y, 900, 10); return { n, label: T.label(), hint: T.hint() }; });
  t.expect(pick.n >= 0, 'bag train: drove over to the arrivals hall');
  t.expectEq(pick.label, '🧳 Get more bags', 'bag train: get-more-bags label');
  t.expectEq(pick.hint, 'Press the button for more bags! 🧳', 'bag train: pickup hint');
  const more = await t.ev(() => { T.act(); T.step(10); const h = T.hint(); T.until(() => !AirfieldExt.rt.load, 300); T.step(2); return { h, bags: V.gse().tug.bags, n: Game.s.afGse.pickups, floats: Game.floats.map((f) => f.text), hint: T.hint() }; });
  t.expectEq(more.h, 'Here come more bags! 🧳', 'bag train: bags coming hint');
  t.expect(more.bags === 4 && more.n === 1 && more.floats.includes('More bags! 🧳'), `bag train: full again (${JSON.stringify(more)})`);
  t.expectEq(more.hint, 'Drive the bags to the big jet! 🧳', 'bag train: and off to the jet again');
  await t.ev(() => { Render.setZoom(1.2); Game.cameraSnap = true; T.step(2); });
  await t.shot('bagtrain-terminal');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.steer(1, -0.2); T.step(30); T.unsteer(); T.step(2); });
  await t.shot('bagtrain-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); Render.setZoom(1); T.step(1); });
  // hop out anywhere free: it stays where you left it
  const left = await t.ev(() => { const v = V.gse().tug; Game.exitCar(); T.step(2); const H = CFG.AIRFIELD.GSE.tug; return { out: !Game.driving && V.freeAt(Game.player.x, Game.player.y), away: Math.hypot(v.x - H.x, v.y - H.y) > 200 }; });
  t.expect(left.out && left.away, 'bag train: hopped out by the terminal, the train stays there');

  // ======== the fuel truck ========
  const fuelIn = await t.ev(() => {
    const v = V.gse().fuel; T.tp(v.x, v.y + 40, 'town'); T.step(2);
    const hint = T.hint(); Game.enterCar(); T.step(3);
    const h = Game.hint, rt = AirfieldExt.rt;
    return { hint, rides: Game.s.afGse.fuelRides, floats: Game.floats.map((f) => f.text), hint2: h && h.text, toPlane: !!(h && h.target && (rt.planes.includes(h.target) || h.target === rt.heli)), label: T.label() };
  });
  t.expectEq(fuelIn.hint, 'Drive the fuel truck! ⛽', 'fuel truck: the hint beside it');
  t.expect(fuelIn.rides === 1 && fuelIn.floats.includes('Vroom! ⛽'), 'fuel truck: vroom as you hop in');
  t.expectEq(fuelIn.hint2, 'Drive to a plane and fuel it up! ⛽', 'fuel truck: drive to a plane');
  t.expect(fuelIn.toPlane && fuelIn.label === null, 'fuel truck: the arrow points at a plane; no fuel button in its bay');
  // every plane and the helicopter can be fuelled: parked beside each filler, the truck offers it
  const reach = await t.ev(() => {
    const rt = AirfieldExt.rt, v = V.gse().fuel, out = [];
    for (const p of rt.planes.concat([rt.heli])) { const fp = AirfieldExt.fuelPoint(p); v.x = fp.x - 40; v.y = fp.y + 40; out.push(AirfieldExt.planeToFuel(Game) === p); }
    AirfieldExt.parkGse(v); Game.player.x = v.x; Game.player.y = v.y; T.step(1);
    return out;
  });
  t.expect(reach.every(Boolean), `fuel truck: each plane and the helicopter can be fuelled (${JSON.stringify(reach)})`);
  // drive over to the blue plane on stand 2 and fuel it up
  const toPlane = await t.ev(() => { const p = AirfieldExt.rt.visitors[0]; const n = V.driveTo(p.x - 70, p.y - 30, 700, 12); return { n, label: T.label(), hint: T.hint(), which: AirfieldExt.planeToFuel(Game) === p }; });
  t.expect(toPlane.n >= 0 && toPlane.which, `fuel truck: drove up to the blue plane (${JSON.stringify(toPlane)})`);
  t.expectEq(toPlane.label, '⛽ Fuel up', 'fuel truck: fuel-up label');
  t.expectEq(toPlane.hint, 'Press the button to fuel up! ⛽', 'fuel truck: fuel-up hint');
  const glug = await t.ev(() => {
    const v = V.gse().fuel, rt = AirfieldExt.rt, x0 = v.x, y0 = v.y; T.act(); T.steer(-1, 0); T.step(40);
    const mid = { on: !!rt.fuelup && rt.fuelup.plane === rt.visitors[0], held: Math.hypot(v.x - x0, v.y - y0) < 1, hint: T.hint(), label: T.label(), floats: Game.floats.map((f) => f.text) };
    T.unsteer(); T.until(() => !rt.fuelup, 400); T.step(2);
    return { mid, n: Game.s.afGse.fuelups, floats: Game.floats.map((f) => f.text), label: T.label() };
  });
  t.expect(glug.mid.on && glug.mid.held && glug.mid.label === null && glug.mid.floats.includes('Glug glug! ⛽'), `fuel truck: the hose on, glug glug, the truck waits (${JSON.stringify(glug.mid)})`);
  t.expectEq(glug.mid.hint, 'Glug glug! Filling up the plane ⛽', 'fuel truck: fuelling hint');
  t.expect(glug.n === 1 && glug.floats.includes('Full tank! ✈️') && glug.label === '⛽ Fuel up', `fuel truck: a full tank, and you can fuel it again (${JSON.stringify(glug)})`);
  await t.ev(() => { Render.setZoom(1.3); T.act(); T.step(70); Game.cameraSnap = true; });
  await t.shot('fueltruck-glug');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.step(2); });
  await t.shot('fueltruck-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); Render.setZoom(1); T.until(() => !AirfieldExt.rt.fuelup, 400); });
  // hop out on the grass by the plane spotting bench: free ground, the truck stays there
  const grass = await t.ev(() => { V.driveTo(2060, 960, 700, 14); const v = V.gse().fuel; Game.exitCar(); T.step(2); return { out: !Game.driving && V.freeAt(Game.player.x, Game.player.y), d: Math.hypot(v.x - 2060, v.y - 960) }; });
  t.expect(grass.out && grass.d < 30, `fuel truck: hopped out on the grass, it stays there (${JSON.stringify(grass)})`);

  // ---- a plane taking off sends a vehicle left on the runway back to its bay
  const runway = await t.ev(() => {
    const v = V.gse().tug, R = CFG.AIRFIELD.RUNWAY; v.x = (R.x0 + R.x1) / 2; v.y = 300; v.angle = Math.PI / 2; T.step(3);
    const H = CFG.AIRFIELD.PLANE_HOME; T.tp(H.x, H.y + 50, 'town'); Game.enterCar(); T.step(1); const label = T.label(); T.act(); T.step(2);
    const G = CFG.AIRFIELD.GSE.tug, home = Math.hypot(v.x - G.x, v.y - G.y) < 1, fuelStays = Math.hypot(V.gse().fuel.x - 2060, V.gse().fuel.y - 960) < 30;
    T.until(() => Game.area === 'cloud' && !Game.travel && !Game.driving, 4000);
    return { label, home, fuelStays, area: Game.area };
  });
  t.expectEq(runway.label, '🛫 Take off!', 'runway: take-off offered');
  t.expect(runway.home, 'runway: the bag train left on the runway is back in its bay before the plane rolls');
  t.expect(runway.fuelStays, 'runway: the fuel truck out on the grass stays where it was');
  t.expectEq(runway.area, 'cloud', 'runway: and off to Cloud Harbor');

  // ---- Take-me-home: in the middle of loading bags far from home, the fuel truck left out: both back in their bays
  const home = await t.ev(() => {
    T.tp(2300, 400, 'town'); const G = V.gse(), j = AirfieldExt.rt.jet; T.tp(G.tug.x, G.tug.y + 40, 'town'); Game.enterCar(); T.step(1);
    G.cars[0].x = 900; G.cars[0].y = 900;   // a car driven off into town and left there
    G.tug.x = j.x + 20; G.tug.y = j.y + 60; T.step(2); T.act(); T.step(10);
    const busy = !!AirfieldExt.rt.load && G.tug.bags < 4;
    Game.goHome(); T.step(3);
    const at = (k) => { const H = CFG.AIRFIELD.GSE[k], v = G[k]; return Math.hypot(v.x - H.x, v.y - H.y) < 1 && v.angle === H.angle; };
    const S = CFG.PLAYER_START;
    return { busy, driving: Game.driving, area: Game.area, d: Math.hypot(Game.player.x - S.x, Game.player.y - S.y), tug: at('tug'), fuel: at('fuel'), cars: G.cars.every((c) => c.x === c.home.x && c.y === c.home.y), bags: G.tug.bags, load: AirfieldExt.rt.load, fly: AirfieldExt.rt.flyBags.length, carts: G.tug.carts.every((c) => c.a === CFG.AIRFIELD.GSE.tug.angle) };
  });
  t.expect(home.busy, 'home: loading bags before Take-me-home');
  t.expect(!home.driving && home.area === 'town' && home.d < 2, 'home: back at the pizzeria on foot');
  t.expect(home.tug && home.fuel && home.carts && home.cars, `home: the bag train, the fuel truck and the cars parked in their bays (${JSON.stringify(home)})`);
  t.expect(home.bags === 4 && home.load === null && home.fly === 0, 'home: the train full of bags again, nothing half done');
  t.expect(await t.ev(() => AirfieldExt.hint(Game) === undefined || !/bag|fuel/i.test(AirfieldExt.hint(Game).text)), 'home: no bag train or fuel truck hint at the pizzeria');
  await t.ev(() => { Render.setZoom(1.1); T.tp(2300, 400, 'town'); T.step(2); });
  await t.shot('parked');
  await t.ev(() => { const c = V.gse().cars[0]; T.tp(c.x - 60, c.y, 'town'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Drive a car! 🚗', 'car park: the hint beside a car');
  await t.shot('carpark');
  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); T.step(1); });
};
