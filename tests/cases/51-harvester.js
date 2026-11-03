'use strict';
// The big red harvester on the farm: parked on free ground, hop in, the reel spins, drive over ripe plots (the core
// counts the ingredients, the crop bits fly into the tank and it fills), unload the grain by the barn (the auger swings
// out and a pile grows), hop out on free ground, Take-me-home mid-unload. Screenshots desktop + phone, zoomed in.
const path = require('path');
module.exports = async (t) => {
  // the extension is loaded by index.html once wired in; until then the case injects it itself
  const load = async () => { if (await t.ev(() => typeof HarvesterExt === 'undefined')) await t.page.addScriptTag({ path: path.join(__dirname, '..', '..', 'js', 'harvester.js') }); await t.ev(() => T.step(1)); };
  await t.boot();
  await load();
  t.expect(await t.ev(() => Game.ext.indexOf(HarvesterExt) < Game.ext.indexOf(CityExt) && Render.ext.includes(HarvesterExt)), 'registered ahead of the City in Game.ext, and in Render.ext');
  const spec = await t.ev(() => CFG.VEHICLES.combine);
  t.expect(spec && spec.harvests === true && spec.harvestReach >= 60 && spec.radius >= 26 && spec.speed >= 150 && spec.speed <= 240, `combine spec ${JSON.stringify(spec)}`);
  t.expectEq(spec.label, '🚜 Drive the harvester', 'vehicle button label');
  t.expectEq(spec.exit, '🚶 Hop out', 'exit button label');
  if (await t.ev(() => typeof AtmosphereExt !== 'undefined' && !!AtmosphereExt.force)) await t.ev(() => { AtmosphereExt.force({ phase: 'day' }); T.step(1); });

  // ---- parked on free ground on the farm, clear of the plots, the tractor, the barn's yard and secret gap, the pen
  const park = await t.ev(() => {
    const v = HarvesterExt.v, F = CFG.FARM, r = CFG.VEHICLES.combine.radius + 20;
    const inFarm = v.x - 60 > F.x0 && v.x + 60 < F.x1 && v.y - 70 > F.y0 && v.y + 70 < F.y1;
    const solid = Game.obstacles(true).filter((o) => Game.hitRect(v.x, v.y, r, o)).length;
    const plot = Math.min(...F.plots.map((pl) => U.dist(v.x, v.y, pl.x, pl.y)));
    const tractor = U.dist(v.x, v.y, F.tractor.x, F.tractor.y);
    const barn = v.y - 70 > F.barn.y1 + 300, pen = v.y - 70 > F.pen.y1 + 300;
    const door = U.dist(v.x, v.y, CFG.BARN.DOOR_OUT.x, CFG.BARN.DOOR_OUT.y);
    const vehicles = Game.vehicles().filter((o) => o !== v && Game.area === 'town' && U.dist(o.x, o.y, v.x, v.y) < 160).length;
    return { x: v.x, y: v.y, inFarm, solid, plot: Math.round(plot), tractor: Math.round(tractor), barn, pen, door: Math.round(door), vehicles, listed: Game.vehicles().includes(v) };
  });
  t.expect(park.inFarm && park.solid === 0 && park.plot > 110 && park.tractor > 200 && park.barn && park.pen && park.door > 400 && park.vehicles === 0 && park.listed, `parked on free farm ground ${JSON.stringify(park)}`);
  // the chef can walk all round it (vehicles are not solid) and it does not block the walk down the farm's west side
  const walk = await t.ev(() => { const v = HarvesterExt.v; T.tp(v.x, v.y - 120, 'town'); T.steer(0, 1); T.step(80); T.unsteer(); return Math.round(Game.player.y - (v.y - 120)); });
  t.expect(walk > 200, `the chef walks straight past the parked harvester (${walk})`);

  // ---- on foot next to it: the hint and the vehicle button
  await t.ev(() => { const v = HarvesterExt.v; T.tp(v.x + 55, v.y + 10, 'town'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Drive the big harvester! 🚜', 'hint next to the harvester');
  t.expect(await t.ev(() => Game.nearVehicle === HarvesterExt.v), 'the vehicle button offers the harvester');
  t.expectEq(await t.ev(() => document.getElementById('btnCar') ? document.getElementById('btnCar').textContent : CFG.VEHICLES[Game.nearVehicle.kind].label), '🚜 Drive the harvester', 'vehicle button text');
  // far away: no harvester hint
  t.expect(await t.ev(() => { const v = HarvesterExt.v; T.tp(v.x + 160, v.y - 40, 'town'); T.step(2); return T.hint() !== 'Drive the big harvester! 🚜'; }), 'no harvester hint away from it');
  await t.ev(() => { const v = HarvesterExt.v; T.tp(v.x + 55, v.y + 10, 'town'); Render.setZoom(1.6); Game.cameraSnap = true; T.step(2); });
  await t.shot('parked');

  // ---- hop in: every plot ripe, the crops hint, the reel spins as it drives
  await t.ev(() => { for (const pl of Game.plots) { pl.ready = true; pl.t = 0; } Game.enterCar(); T.step(2); });
  t.expectEq(await t.ev(() => Game.driving && Game.vehicle.kind), 'combine', 'driving the harvester');
  t.expectEq(await t.ev(() => T.hint()), 'Drive over the crops! 🌾', 'crops hint while driving with ripe plots around');
  t.expectEq(await t.ev(() => T.label()), null, 'no unload button with an empty tank');
  const before = await t.ev(() => Object.assign({}, Game.s.farm));
  const reel0 = await t.ev(() => HarvesterExt.v.reel);
  // drive north up the west column: basil, then tomatoes
  const drive = await t.ev(() => { T.steer(0, -1); const n = T.until(() => Game.player.y < 470, 400); const reel = HarvesterExt.v.reel; return { n, reel, bits: HarvesterExt.st.bits.length, tank: HarvesterExt.st.tank, y: Math.round(Game.player.y) }; });
  t.expect(drive.n >= 0, `drove up to the tomatoes ${JSON.stringify(drive)}`);
  t.expect(drive.reel > reel0 + 2, `the reel spins while driving (${reel0} -> ${drive.reel})`);
  await t.ev(() => { Game.floats.length = 0; T.step(6); });
  await t.shot('harvesting');
  await t.ev(() => { T.until(() => Game.player.y < 345, 200); T.unsteer(); T.step(40); });
  const after = await t.ev(() => Object.assign({}, Game.s.farm));
  t.expect(after.basil >= before.basil + 4, `basil picked by the harvester (${before.basil} -> ${after.basil})`);
  t.expect(after.tomato >= before.tomato + 4, `tomatoes picked by the harvester (${before.tomato} -> ${after.tomato})`);
  const tank = await t.ev(() => ({ tank: HarvesterExt.st.tank, show: HarvesterExt.st.show, kinds: HarvesterExt.st.kinds.slice(), harvested: (Game.s.farm.basil + Game.s.farm.tomato) }));
  t.expect(tank.tank >= 6 && tank.tank <= 12, `tank filled (${JSON.stringify(tank)})`);
  t.expect(tank.show > 0.4, `the tank shows grain (${tank.show})`);
  t.expect(tank.kinds.includes('basil') && tank.kinds.includes('tomato'), 'crop bits of what was picked sit in the tank');
  // the reach is the wide header's: a plot 60 px to the side was picked, one 100 px away was not
  t.expect(await t.ev(() => { const P = (x, y) => Game.plots.find((pl) => pl.x === x && pl.y === y); return !P(-840, 440).ready && P(-740, 440).ready; }), 'the header reaches the next row but not the wheat');
  // a car still cannot harvest (the core's rule is unchanged for vehicles without the flag)
  t.expectEq(await t.ev(() => !!CFG.VEHICLES.car.harvests), false, 'cars do not harvest');

  // ---- away from the barn: no unload button; drive into the barn's yard
  t.expectEq(await t.ev(() => T.label()), null, 'no unload button away from the barn');
  const yard = await t.ev(() => {
    T.steer(1, 0); const a = T.until(() => Game.player.x > -752, 300);
    T.steer(0, -1); const b = T.until(() => Game.player.y < 250, 300); T.unsteer(); T.step(30);
    return { a, b, x: Math.round(Game.player.x), y: Math.round(Game.player.y), label: T.label(), hint: T.hint() };
  });
  t.expect(yard.a >= 0 && yard.b >= 0, `drove into the barn's yard ${JSON.stringify(yard)}`);
  t.expectEq(yard.label, '🌾 Unload the grain', 'unload button by the barn');
  t.expectEq(yard.hint, 'Unload the grain by the barn! 🌾', 'unload hint by the barn');

  // ---- unload: the auger swings out, grain pours into the pile, "Whoosh!", the tank empties; the farm stock is kept
  const farm1 = await t.ev(() => Object.assign({}, Game.s.farm));
  const un = await t.ev(() => {
    const st = HarvesterExt.st, load = st.tank, pile0 = Game.s.harvester.pile; Game.floats.length = 0;
    T.act(); let maxAuger = 0, whoosh = false, grains = 0;
    for (let i = 0; i < 60; i++) { T.step(1); maxAuger = Math.max(maxAuger, HarvesterExt.v.auger); grains = Math.max(grains, st.grains.length); whoosh = whoosh || Game.floats.some((f) => f.text === 'Whoosh! 🌾'); }
    return { load, pile0, maxAuger, whoosh, grains, label: T.label(), unloading: !!st.unload };
  });
  t.expect(un.maxAuger === 1 && un.whoosh && un.grains > 5 && un.unloading && un.label === null, `unloading: auger out, grain pours, Whoosh, no button meanwhile ${JSON.stringify(un)}`);
  await t.shot('unloading');
  const done = await t.ev(() => { T.until(() => !HarvesterExt.st.unload, 400); T.step(30); return { tank: HarvesterExt.st.tank, pile: Game.s.harvester.pile, auger: HarvesterExt.v.auger, grains: HarvesterExt.st.grains.length, label: T.label() }; });
  t.expect(done.tank === 0 && done.pile === un.pile0 + un.load && done.auger === 0 && done.grains === 0 && done.label === null, `unloaded: tank empty, pile grew by ${un.load}, auger stowed ${JSON.stringify(done)}`);
  t.expectEq(JSON.stringify(await t.ev(() => Game.s.farm)), JSON.stringify(farm1), 'the farm stock is not touched by unloading');
  await t.ev(() => { T.steer(0, 1); T.step(25); T.unsteer(); T.step(20); Game.floats.length = 0; T.step(1); });
  await t.shot('pile');

  // ---- hop out: the chef stands on free ground; the harvester stays where it was left
  const out = await t.ev(() => {
    const v = HarvesterExt.v; Game.exitCar(); T.step(2);
    const p = Game.player, solid = Game.obstacles().filter((o) => Game.hitRect(p.x, p.y, 12, o)).length;
    return { driving: Game.driving, solid, d: Math.round(U.dist(p.x, p.y, v.x, v.y)), hint: T.hint(), still: Math.hypot(v.vx, v.vy) };
  });
  t.expect(!out.driving && out.solid === 0 && out.d < 80 && out.still === 0, `hopped out on free ground ${JSON.stringify(out)}`);
  t.expectEq(out.hint, 'Drive the big harvester! 🚜', 'hint again on foot beside it');
  // the saved pile survives a save + reload (the harvester itself goes back to its spot)
  const pileSaved = await t.ev(() => { Game.save(); return Game.s.harvester.pile; });
  await t.reload(); await load();
  const re = await t.ev(() => ({ pile: Game.s.harvester && Game.s.harvester.pile, x: HarvesterExt.v.x, y: HarvesterExt.v.y, sx: CFG.HARVESTER.SPOT.x, sy: CFG.HARVESTER.SPOT.y }));
  t.expect(re.pile === pileSaved && re.x === re.sx && re.y === re.sy, `after a reload: pile kept, harvester parked again ${JSON.stringify(re)}`);

  // ---- phone screenshots, zoomed in: parked, and harvesting
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { const v = HarvesterExt.v; T.tp(v.x + 55, v.y + 10, 'town'); Render.resize(); Render.setZoom(1.6); Game.cameraSnap = true; T.step(2); Game.floats.length = 0; });
  await t.shot('phone-parked');
  await t.ev(() => {
    for (const pl of Game.plots) { pl.ready = true; pl.t = 0; }
    const v = HarvesterExt.v; T.tp(v.x + 55, v.y + 10, 'town'); Game.enterCar(); T.step(1);
    T.steer(0, -1); T.until(() => Game.player.y < 600, 300); T.step(4); Game.floats.length = 0; T.step(2); T.unsteer(); Game.cameraSnap = true; T.step(1);
  });
  await t.shot('phone-harvesting');

  // ---- Take-me-home in the middle of an unload: everything tidied, the grain still lands in the pile
  const home = await t.ev(() => {
    const v = HarvesterExt.v, st = HarvesterExt.st, P = CFG.HARVESTER.PILE, pile0 = Game.s.harvester.pile;
    T.tp(v.x + 55, v.y, 'town'); Game.enterCar(); v.x = P.x + 30; v.y = P.y + 60; st.tank = 7; T.step(2);
    const lbl = T.label(); T.act(); T.step(40);
    Game.goHome(); T.step(2);
    return { lbl, unload: st.unload, auger: v.auger, tank: st.tank, pile: Game.s.harvester.pile - pile0, driving: Game.driving, area: Game.area };
  });
  t.expect(home.lbl === '🌾 Unload the grain' && home.unload === null && home.auger === 0 && home.tank === 0 && home.pile === 7 && !home.driving && home.area === 'town', `Take-me-home mid-unload ${JSON.stringify(home)}`);

  // ---- the tractor still harvests with its old reach
  const tr = await t.ev(() => {
    const pl = Game.plots.find((p) => p.kind === 'wheat'); pl.ready = true; const n0 = Game.s.farm.wheat;
    T.tp(Game.tractor.x, Game.tractor.y + 40, 'town'); Game.enterCar(); const kind = Game.vehicle && Game.vehicle.kind;
    Game.tractor.x = pl.x - 40; Game.tractor.y = pl.y; T.step(2); const n1 = Game.s.farm.wheat;
    return { kind, picked: n1 - n0 };
  });
  t.expect(tr.kind === 'tractor' && tr.picked === 1, `the tractor still picks ${JSON.stringify(tr)}`);

};
