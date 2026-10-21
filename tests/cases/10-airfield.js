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

  // ---- screenshots of the airfield
  await t.ev(() => { Render.setZoom(0.3); T.tp(2000, 600, 'town'); T.step(2); });
  await t.shot('strip');
  await t.ev(() => { Render.setZoom(1.2); T.tp(1700, 560, 'town'); T.step(2); });
  await t.shot('gate');
  await t.ev(() => { T.tp(2150, 520, 'town'); T.step(2); });
  await t.shot('apron');
  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
