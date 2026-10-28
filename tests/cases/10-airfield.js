'use strict';
// The airfield: the arrivals path stays clear, signs and benches are walk-through, the one-press take-off from the
// hangar stand, Cloud Harbor's Sky Café (cocoa, a seat by the window, back out), the flight home, and the helicopter
// that flies over everything in town.
module.exports = async (t) => {
  await t.boot();

  // ---- walk-in customers appear at the arrivals gate and walk west without anything solid in their way
  const walk = await t.ev(() => {
    const c = new Customer(1, 1), x0 = c.x, y0 = c.y;
    for (let i = 0; i < 200; i++) c.update(1 / 60, Game);
    const blockers = Game.obstacles().filter((o) => o.x < 1600 && o.x + o.w > 1540 && o.y < 650 && o.y + o.h > 560);
    return { x0, y0, x: c.x, y: c.y, blockers: blockers.length, spawn: CFG.SPAWN_OUT };
  });
  t.expectEq([walk.x0, walk.y0].join(','), [walk.spawn.x, walk.spawn.y].join(','), 'customer starts at the arrivals gate');
  t.expect(walk.x < walk.x0 - 300 && Math.abs(walk.y - 605) < 20, `customer walked west along the path (${Math.round(walk.x)},${Math.round(walk.y)})`);
  t.expectEq(walk.blockers, 0, 'nothing solid on the arrivals path west of the gate');

  // ---- signs and benches are scenery: nothing solid on their spots, and the chef walks straight over them
  const signs = await t.ev(() => {
    const A = CFG.AIRFIELD, spots = A.SIGNS.map(([x, y]) => [x, y]).concat([[A.BENCH.x, A.BENCH.y]]);
    const bad = [];
    for (const [x, y] of spots) {
      if (Game.obstacles().some((o) => Game.hitRect(x, y, 12, o))) { bad.push([x, y, 'solid']); continue; }
      let moved = 0;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { T.tp(x, y, 'town'); T.steer(ax, ay); T.step(8); T.unsteer(); moved = Math.max(moved, Math.hypot(Game.player.x - x, Game.player.y - y)); }
      if (moved < 20) bad.push([x, y, 'stuck']);
    }
    return { n: spots.length, bad };
  });
  t.expect(signs.n >= 5, `several sign spots checked (${signs.n})`);
  t.expectEq(signs.bad.length, 0, `sign spots are walk-through: ${JSON.stringify(signs.bad)}`);

  // ---- the plaza between the gate and the fire station is open ground
  const plaza = await t.ev(() => Game.obstacles().filter((o) => o.x < 1600 && o.x + o.w > 1520 && o.y < 720 && o.y + o.h > 540).length);
  t.expectEq(plaza, 0, 'no obstacle on the plaza in front of the gate');

  // ---- hop in the plane on its stand by the hangar: one press takes off
  await t.ev(() => { const H = CFG.AIRFIELD.PLANE_HOME; T.tp(H.x, H.y + 50, 'town'); T.step(2); Game.enterCar(); });
  t.expectEq(await t.ev(() => Game.vehicle && Game.vehicle.kind), 'plane', 'in the plane by the hangar');
  t.expectEq(await t.ev(() => T.label()), '🛫 Take off!', 'take-off offered at once');
  t.expectEq(await t.ev(() => { T.step(1); return T.hint(); }), '🛫 Press the button to take off!', 'take-off hint');
  await t.ev(() => { T.act(); T.until(() => Game.area === 'cloud' && !Game.travel && !Game.driving, 4000); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'cloud', 'landed at Cloud Harbor');
  t.expect(await t.ev(() => T.toasts.includes('☁️ Welcome to Cloud Harbor!')), 'welcome toast at Cloud Harbor');
  await t.shot('cloud-landed');

  // ---- into the Sky Café
  await t.ev(() => { const D = CFG.SKYCAFE.DOOR_OUT; T.tp(D.x, D.y + 60, 'cloud'); T.step(1); });
  t.expectEq(await t.ev(() => T.hint()), 'Go inside the Sky Café ☕', 'café hint near the door');
  await t.ev(() => { const D = CFG.SKYCAFE.DOOR_OUT; T.tp(D.x, D.y, 'cloud'); });
  t.expectEq(await t.ev(() => T.label()), '☕ Go inside', 'café door label');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'skycafe', 'inside the café');
  t.expectEq(await t.ev(() => T.hint()), 'Try a Cloud Cocoa! ☕', 'cocoa hint inside');
  await t.shot('cafe');
  // buy a cocoa: stand still on the circle at the counter
  const cocoa = await t.ev(() => {
    Game.s.cash = 20; const P = CFG.SKYCAFE.PADS.cocoa; T.tp(P.x, P.y, 'skycafe');
    const n = T.until(() => AirfieldExt.rt.cafe.cocoa > 0, 400);
    return { n, cash: Game.s.cash, cocoa: AirfieldExt.rt.cafe.cocoa, hint: T.hint(), cocoas: Game.s.stats.cocoas };
  });
  t.expect(cocoa.n >= 0, 'the cocoa circle served a cocoa');
  t.expectEq(cocoa.cash, 15, 'cocoa cost $5');
  t.expectEq(cocoa.cocoas, 1, 'cocoa counted in the stats');
  t.expectEq(cocoa.hint, 'Have a seat by the window 🪑', 'seat hint after the cocoa');
  // sit at a table, enjoy the view, stand up
  await t.ev(() => { const c = CFG.SKYCAFE.TABLES[1].chairs[0]; T.tp(c.x, c.y, 'skycafe'); });
  t.expectEq(await t.ev(() => T.label()), '🪑 Sit down', 'sit label at a chair');
  await t.ev(() => { T.act(); T.step(5); });
  t.expect(await t.ev(() => !!AirfieldExt.rt.cafe.seat && AirfieldExt.rt.cafe.view > 0), 'seated with the window view showing');
  t.expectEq(await t.ev(() => T.label()), '🚶 Stand up', 'stand-up label while seated');
  t.expectEq(await t.ev(() => T.hint()), 'Enjoy the view! ☁️', 'seated hint');
  await t.shot('cafe-view');
  const seated = await t.ev(() => { const c = CFG.SKYCAFE.TABLES[1].chairs[0]; T.steer(1, 1); T.step(60); T.unsteer(); return Math.hypot(Game.player.x - c.x, Game.player.y - c.y); });
  t.expect(seated < 1, 'the chef stays on the chair while seated');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !AirfieldExt.rt.cafe.seat), 'stood up');
  // a reload inside the café lands on the floor, never in the walls
  await t.ev(() => { Game.player.x = 7700; Game.player.y = 1530; T.step(3); });
  t.expect(await t.ev(() => AirfieldExt.cafeFree(Game.player.x, Game.player.y)), 'pushed into the wall: rescued onto the floor');
  // phone-size café
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const E = CFG.SKYCAFE.EXIT; T.tp(E.x, E.y - 60, 'skycafe'); });
  await t.shot('cafe-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); const E = CFG.SKYCAFE.EXIT; T.tp(E.x, E.y, 'skycafe'); });
  t.expectEq(await t.ev(() => T.label()), '☕ Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'cloud', 'back outside the café');
  t.expect(await t.ev(() => { const D = CFG.SKYCAFE.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the café door');

  // ---- fly home
  await t.ev(() => { const v = AirfieldExt.rt.cloudPlane; T.tp(v.x, v.y + 46, 'cloud'); T.step(2); Game.enterCar(); });
  t.expectEq(await t.ev(() => T.label()), '🛫 Fly home!', 'fly-home offered in the cloud plane');
  await t.ev(() => { T.act(); T.until(() => Game.area === 'town' && !Game.travel && !Game.driving, 4000); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'flew home');
  t.expect(await t.ev(() => T.toasts.includes('🍕 Home sweet home!')), 'home toast');
  const parked = await t.ev(() => { const v = AirfieldExt.rt.plane, H = CFG.AIRFIELD.PLANE_HOME; return { d: Math.hypot(v.x - H.x, v.y - H.y), pd: Math.hypot(Game.player.x - v.x, Game.player.y - v.y) }; });
  t.expect(parked.d < 2 && parked.pd < 60, 'the plane rolled back to its stand and the chef hopped out beside it');

  // ---- the helicopter flies over everything: the pizzeria building and the pond
  await t.ev(() => { const H = CFG.AIRFIELD.HELI; T.tp(H.x, H.y + 50, 'town'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Fly the helicopter! 🚁', 'helicopter hint by the helipad');
  await t.ev(() => { Game.enterCar(); T.step(1); });
  t.expectEq(await t.ev(() => Game.vehicle && Game.vehicle.kind), 'heli', 'in the helicopter');
  await t.wait(150);   // the HUD refreshes on the animation frame
  t.expectEq(await t.ev(() => document.getElementById('btn-car').textContent), '🛬 Land', 'the vehicle button says Land');
  t.expectEq(await t.ev(() => T.hint()), 'Whirrr! Fly anywhere you like 🚁', 'flying hint');
  const over = await t.ev(() => {
    const v = Game.vehicle, B = CFG.BUILDING, P = CFG.POND;
    v.x = 1100; v.y = 400; v.vx = 0; v.vy = 0; let inBuilding = false;
    T.steer(-1, 0); for (let i = 0; i < 240; i++) { Game.update(1 / 60); if (v.x > B.x0 + 40 && v.x < B.x1 - 40 && v.y > B.y0 && v.y < B.y1) inBuilding = true; } T.unsteer();
    const pastBuilding = v.x < B.x0 - 20;
    v.x = P.x; v.y = P.y - 120; v.vx = 0; v.vy = 0; let inPond = false;
    T.steer(0, 1); for (let i = 0; i < 120; i++) { Game.update(1 / 60); if (Math.abs(v.x - P.x) < 30 && Math.abs(v.y - P.y) < 20) inPond = true; } T.unsteer();
    return { inBuilding, pastBuilding, inPond, pastPond: v.y > P.y + P.ry + 20, lift: v.lift, driving: Game.driving };
  });
  t.expect(over.inBuilding && over.pastBuilding, `flew straight across the pizzeria (${JSON.stringify(over)})`);
  t.expect(over.inPond && over.pastPond, 'flew straight over the pond');
  t.expect(over.lift > 30, 'airborne (lifted) while flying');
  await t.shot('heli-flying');
  // land on the grass and get out on a free spot
  const landed = await t.ev(() => { const v = Game.vehicle; v.x = 300; v.y = 760; v.vx = 0; v.vy = 0; T.step(2); Game.exitCar(); T.step(30); const p = Game.player; return { driving: Game.driving, free: !Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o)), d: Math.hypot(p.x - v.x, p.y - v.y), lift: AirfieldExt.rt.heli.lift, heliAt: [Math.round(v.x), Math.round(v.y)] }; });
  t.expect(!landed.driving && landed.free && landed.d < 60, `landed and stepped out on a free spot (${JSON.stringify(landed)})`);
  t.expect(landed.lift === 0, 'the helicopter settled on the ground');

  // ---- every plane on the airfield is a vehicle: nothing static or solid is left where planes used to be painted
  const ghosts = await t.ev(() => {
    const A = CFG.AIRFIELD, rt = AirfieldExt.rt, spots = [A.PLANE_HOME, ...A.PARKED, A.JET];
    const all = Game.obstacles().concat(Game.townObstacles(true));
    const covering = spots.filter((q) => all.some((o) => o.w && q.x >= o.x && q.x <= o.x + o.w && q.y >= o.y && q.y <= o.y + o.h));
    return { covering: covering.length, kinds: rt.planes.map((v) => v.kind + '@' + v.key), listed: rt.planes.every((v) => Game.vehicles().includes(v)), colors: rt.visitors.map((v) => v.color), parked: A.PARKED.map((q) => q.color).join(','), at: rt.planes.map((v) => Math.hypot(v.x - v.home.x, v.y - v.home.y) < 1) };
  });
  t.expectEq(ghosts.covering, 0, 'no obstacle left on any plane spot (stands 1-3, gate 1)');
  t.expectEq(ghosts.kinds.join(','), 'plane@stand1,plane@stand2,plane@stand3,jet@gate1', 'four rideable planes: the chef\'s, two visitors\' and the jet');
  t.expect(ghosts.listed, 'all four planes are listed as vehicles');
  t.expectEq(ghosts.colors.join(','), ghosts.parked, 'the visitors\' planes keep their colours');
  t.expect(ghosts.at.every(Boolean), 'every plane starts on its own stand');

  // ---- hints near the planes
  await t.ev(() => { const v = AirfieldExt.rt.visitors[0]; T.tp(v.x, v.y + 50, 'town'); T.step(1); });
  t.expectEq(await t.ev(() => T.hint()), 'Hop in a plane! ✈️', 'hint by a visitor\'s plane');
  await t.ev(() => { const v = AirfieldExt.rt.jet; T.tp(v.x, v.y + 50, 'town'); T.step(1); });
  t.expectEq(await t.ev(() => T.hint()), 'Hop in the big jet! ✈️', 'hint by the jet');
  t.expectEq(await t.ev(() => Game.canEnterCar() && Game.findNearVehicle() === AirfieldExt.rt.jet), true, 'the jet can be entered from beside it');

  // ---- fly each of the four planes to Cloud Harbor and home again: it lands back on its own stand, the others stay put
  for (const key of ['stand1', 'stand2', 'stand3', 'gate1']) {
    const before = await t.ev((k) => {
      const rt = AirfieldExt.rt, v = rt.planes.find((q) => q.key === k);
      window._others = rt.planes.filter((q) => q !== v).map((q) => ({ q, x: q.x, y: q.y, a: q.angle }));
      T.tp(v.x, v.y + 50, 'town'); T.step(2); Game.enterCar(); T.step(1);
      return { entered: Game.vehicle === v, kind: Game.vehicle && Game.vehicle.kind, label: T.label(), hint: T.hint() };
    }, key);
    t.expect(before.entered, `${key}: hopped into the plane`);
    t.expectEq(before.label, '🛫 Take off!', `${key}: one-press take-off offered`);
    t.expectEq(before.hint, '🛫 Press the button to take off!', `${key}: take-off hint`);
    // press: it taxis out (never through a building), lines up on the runway, rolls, lifts off and leaves the screen
    const run = await t.ev((k) => {
      const rt = AirfieldExt.rt, v = Game.vehicle, R = CFG.AIRFIELD.RUNWAY, obs = Game.townObstacles(true);
      const hits0 = v.kind === 'jet' ? AirfieldExt.jetHits(Game, v.x, v.y, v.angle, obs) : 0;
      T.act();
      let maxHits = 0, lined = false, lifted = false, n = 0;
      for (; n < 900 && rt.runup; n++) {
        Game.update(1 / 60); Render.updateCamera(Game, 1 / 60);
        if (!rt.runup) break;
        if (rt.runup.taxi && v.kind === 'jet') maxHits = Math.max(maxHits, AirfieldExt.jetHits(Game, v.x, v.y, v.angle, obs));
        if (!rt.runup.taxi && !lined) lined = Math.abs(v.x - (R.x0 + R.x1) / 2) < 3 && Math.abs(Math.sin(v.angle)) > 0.99;
        if (!rt.runup.taxi && rt.runup.t > 0.2) break;   // racing down the runway: take the picture (it lifts off meanwhile)
      }
      return { hits0, maxHits, lined, n };
    }, key);
    t.expect(run.lined, `${key}: lined up on the runway centreline (${JSON.stringify(run)})`);
    t.expect(run.maxHits <= run.hits0, `${key}: the jet's wings never went through anything while taxiing (${run.maxHits} > ${run.hits0})`);
    await t.shot('takeoff-' + key);
    t.expect(await t.ev(() => { const ru = AirfieldExt.rt.runup; T.until(() => !AirfieldExt.rt.runup || AirfieldExt.rt.runup.plane.lift > 10, 600); return !!(Game.travel && Game.travel.via === 'flight') || (!!AirfieldExt.rt.runup && AirfieldExt.rt.runup.plane.lift > 10) || !ru; }), `${key}: lifted off the runway`);
    const off = await t.ev((k) => { const v = AirfieldExt.rt.planes.find((q) => q.key === k); T.until(() => !!Game.travel, 600); return { travel: Game.travel && Game.travel.via, away: v.away, listed: Game.vehicles().includes(v), flown: AirfieldExt.rt.flown === v }; }, key);
    t.expect(off.travel === 'flight' && off.away && !off.listed && off.flown, `${key}: flew off; gone from the airfield during the trip (${JSON.stringify(off)})`);
    if (key === 'gate1' || key === 'stand2') { await t.ev(() => T.step(30)); await t.shot('flight-' + key); }   // the cut-scene shows the plane you took
    const cloud = await t.ev(() => { T.until(() => Game.area === 'cloud' && !Game.travel && !Game.driving, 4000); T.step(2); const cp = AirfieldExt.rt.cloudPlane, f = AirfieldExt.rt.flown; return { area: Game.area, kind: cp.kind, same: cp.kind === f.kind && cp.color === f.color }; });
    t.expectEq(cloud.area, 'cloud', `${key}: reached Cloud Harbor`);
    t.expect(cloud.same, `${key}: the plane waiting at Cloud Harbor is the one you came in (${cloud.kind})`);
    if (key === 'gate1') { await t.ev(() => { const v = AirfieldExt.rt.cloudPlane; T.tp(v.x - 60, v.y + 110, 'cloud'); T.step(2); }); await t.shot('cloud-jet'); }
    const home = await t.ev((k) => {
      const rt = AirfieldExt.rt, cp = rt.cloudPlane; T.tp(cp.x, cp.y + 46, 'cloud'); T.step(2); Game.enterCar(); T.step(1);
      const label = T.label(); T.act();
      T.until(() => Game.area === 'town' && !Game.travel && !Game.driving, 4000); T.step(2);
      const v = rt.planes.find((q) => q.key === k), p = Game.player;
      const moved = window._others.filter((o) => Math.hypot(o.q.x - o.x, o.q.y - o.y) > 0.5 || Math.abs(o.q.angle - o.a) > 0.01).map((o) => o.q.key);
      return { label, area: Game.area, d: Math.hypot(v.x - v.home.x, v.y - v.home.y), da: Math.abs(AirfieldExt.wrap(v.angle - v.home.angle)), pd: Math.hypot(p.x - v.x, p.y - v.y), away: !!v.away, listed: Game.vehicles().includes(v), moved };
    }, key);
    t.expectEq(home.label, '🛫 Fly home!', `${key}: fly-home offered at Cloud Harbor`);
    t.expectEq(home.area, 'town', `${key}: flew home`);
    t.expect(home.d < 2 && home.da < 0.05 && !home.away && home.listed, `${key}: landed and rolled back onto its own stand (${JSON.stringify(home)})`);
    t.expect(home.pd < 80, `${key}: the chef hopped out beside it`);
    t.expectEq(home.moved.join(','), '', `${key}: the other planes did not move`);
  }

  // ---- the jet on the ground: slower, a big turning circle, and its wings never go through the terminal or the gate
  const handling = await t.ev(() => {
    const rt = AirfieldExt.rt, out = {};
    const drive = (v, x, y, a, steps, sx, sy) => { T.tp(v.x, v.y + 40, 'town'); Game.enterCar(); v.x = x; v.y = y; v.angle = a; v.vx = 0; v.vy = 0; T.step(2); const a0 = v.angle; T.steer(sx, sy); let top = 0; const x0 = v.x, y0 = v.y; for (let i = 0; i < steps; i++) { const px = v.x, py = v.y; Game.update(1 / 60); top = Math.max(top, Math.hypot(v.x - px, v.y - py) * 60); } T.unsteer(); const r = { turned: Math.abs(AirfieldExt.wrap(v.angle - a0)), top, moved: Math.hypot(v.x - x0, v.y - y0) }; T.step(30); Game.exitCar(); T.step(1); return r; };
    // open grass between the runway and the taxiway: heading east, the stick pulled south for half a second
    out.planeTurn = drive(rt.visitors[0], 2000, 900, 0, 30, 0, 1);
    out.jetTurn = drive(rt.jet, 2000, 900, 0, 30, 0, 1);
    out.planeRun = drive(rt.visitors[0], 1960, 950, 0, 60, 1, 0);
    { const v = rt.visitors[0]; v.x = v.home.x; v.y = v.home.y; v.angle = v.home.angle; }   // (back on its stand for the pictures)
    out.jetRun = drive(rt.jet, 1960, 950, 0, 60, 1, 0);
    // straight at the terminal from the runway, then at the gate pier from the apron: count wing/nose/tail hits
    const at = (v, x, y, a, sx, sy, steps) => { T.tp(v.x, v.y + 40, 'town'); Game.enterCar(); v.x = x; v.y = y; v.angle = a; v.vx = 0; v.vy = 0; T.step(2); const obs = Game.townObstacles(true); let worst = 0; T.steer(sx, sy); for (let i = 0; i < steps; i++) { Game.update(1 / 60); worst = Math.max(worst, AirfieldExt.jetHits(Game, v.x, v.y, v.angle, obs)); } T.unsteer(); const r = { worst, x: Math.round(v.x), y: Math.round(v.y) }; T.step(20); return r; };
    out.terminal = at(rt.jet, 1830, 605, Math.PI, -1, 0, 240);
    Game.exitCar(); T.step(1);
    out.pier = at(rt.jet, 2290, 690, 0, 1, -0.3, 300);
    out.pierAway = (() => { const v = rt.jet, x0 = v.x; T.steer(-1, 0); T.step(240); T.unsteer(); T.step(20); return Math.round(x0 - v.x); })();
    Game.exitCar(); T.step(1);
    // a long wobbly drive round the apron from the gate (the stick swinging about): never inside anything, never stuck
    { const v = rt.jet; v.x = v.home.x; v.y = v.home.y; v.angle = v.home.angle; T.tp(v.x, v.y + 50, 'town'); Game.enterCar(); T.step(1);
      let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const obs = Game.townObstacles(true), h0 = AirfieldExt.jetHits(Game, v.x, v.y, v.angle, obs); let worst = 0, still = 0, longest = 0, dist = 0;
      for (let k = 0; k < 40; k++) { const a = rnd() * Math.PI * 2; T.steer(Math.cos(a), Math.sin(a)); for (let i = 0; i < 40; i++) { const x = v.x, y = v.y, an = v.angle; Game.update(1 / 60); if (Math.hypot(v.x - x, v.y - y) < 0.2 && Math.abs(v.angle - an) < 0.001) { still++; longest = Math.max(longest, still); } else still = 0; worst = Math.max(worst, AirfieldExt.jetHits(Game, v.x, v.y, v.angle, obs) - h0); dist += Math.hypot(v.x - x, v.y - y); } }
      T.unsteer(); out.wobble = { worst, longest, dist: Math.round(dist), at: [Math.round(v.x), Math.round(v.y)] }; T.step(20); Game.exitCar(); T.step(1); v.x = v.home.x; v.y = v.home.y; v.angle = v.home.angle; }
    // Take me home while the jet waits at Cloud Harbor: it is back at its gate
    const v = rt.jet; v.x = v.home.x; v.y = v.home.y; v.angle = v.home.angle;
    T.tp(v.x, v.y + 50, 'town'); Game.enterCar(); T.act(); T.until(() => Game.area === 'cloud' && !Game.travel && !Game.driving, 4000);
    out.awayInCloud = v.away && Game.area === 'cloud';
    Game.goHome(); T.step(2);
    out.backAtGate = !v.away && Math.hypot(v.x - v.home.x, v.y - v.home.y) < 1 && Game.vehicles().includes(v);
    return out;
  });
  t.expect(handling.jetTurn.turned < handling.planeTurn.turned * 0.6 && handling.jetTurn.turned < 0.75, `the jet turns more slowly than a little plane (${handling.jetTurn.turned.toFixed(2)} vs ${handling.planeTurn.turned.toFixed(2)} rad)`);
  t.expect(handling.jetRun.top < handling.planeRun.top && handling.jetRun.top > 150, `the jet is a little slower on the ground (${Math.round(handling.jetRun.top)} vs ${Math.round(handling.planeRun.top)} px/s)`);
  t.expectEq(handling.terminal.worst, 0, `taxiing at the terminal, nothing of the jet goes into it (${JSON.stringify(handling.terminal)})`);
  t.expect(handling.terminal.x > 1700 + 80, `the jet stopped short of the terminal (${handling.terminal.x})`);
  t.expectEq(handling.pier.worst, 0, `taxiing at the gate pier, nothing of the jet goes into it (${JSON.stringify(handling.pier)})`);
  t.expect(handling.pierAway > 50, `and it can still drive away from the pier (${handling.pierAway} px)`);
  t.expect(handling.wobble.worst <= 0 && handling.wobble.longest < 90 && handling.wobble.dist > 1500, `a wobbly drive round the apron never puts the jet into anything or leaves it stuck (${JSON.stringify(handling.wobble)})`);
  t.expect(handling.awayInCloud && handling.backAtGate, 'Take me home from Cloud Harbor puts the jet back at its gate');

  // ---- on a phone: the jet and a visitor's plane taking off, and the jet in the cut-scene
  await t.page.setViewportSize({ width: 390, height: 844 });
  for (const key of ['gate1', 'stand3']) {
    await t.ev((k) => { Render.resize(); const v = AirfieldExt.rt.planes.find((q) => q.key === k); T.tp(v.x, v.y + 50, 'town'); T.step(2); Game.enterCar(); T.act(); T.until(() => !AirfieldExt.rt.runup || (!AirfieldExt.rt.runup.taxi && AirfieldExt.rt.runup.t > 0.2), 900); Render.updateCamera(Game, 1 / 60); }, key);
    await t.shot('takeoff-' + key + '-phone');
    if (key === 'gate1') { await t.ev(() => { T.until(() => !!Game.travel, 600); T.step(20); }); await t.shot('flight-' + key + '-phone'); }
    await t.ev(() => { T.until(() => Game.area === 'cloud' && !Game.travel && !Game.driving, 4000); Game.goHome(); T.step(2); });
  }
  t.expect(await t.ev(() => AirfieldExt.rt.planes.every((v) => !v.away && Math.hypot(v.x - v.home.x, v.y - v.home.y) < 1)), 'after Take me home every plane is back on its stand');
  await t.page.setViewportSize({ width: 1100, height: 720 }); await t.ev(() => Render.resize());

  // ---- screenshots of the airfield
  await t.ev(() => { Render.setZoom(0.3); T.tp(2000, 600, 'town'); T.step(2); });
  await t.shot('strip');
  await t.ev(() => { Render.setZoom(1.2); T.tp(1700, 560, 'town'); T.step(2); });
  await t.shot('gate');
  await t.ev(() => { T.tp(2150, 520, 'town'); T.step(2); });
  await t.shot('apron');
  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
