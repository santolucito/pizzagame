'use strict';
// Saving and reloading keeps progress, position and map; old saves without the newer fields still load.
module.exports = async (t) => {
  await t.boot();
  await t.ev(() => {
    Game.s.cash = 1234; Game.s.unlocked.dining = true; Game.s.unlocked.station = true; Game.s.decor.plant1 = true;
    Game.s.vehicles.car = true; Game.s.paint.car = 'rainbow'; Game.s.islands.standOwned = true; Game.s.cabin.owned.rug = true;
    Game.s.balloon.kind = 'star'; Game.s.icDrive.owned = true; Game.s.upg.speed = 2;
    T.tp(3300, 500, 'site'); Game.save();
  });
  await t.reload();
  const s = await t.ev(() => ({ cash: Game.s.cash, dining: Game.s.unlocked.dining, car: Game.s.vehicles.car, paint: Game.s.paint.car, stand: Game.s.islands.standOwned, rug: !!Game.s.cabin.owned.rug, balloon: Game.s.balloon.kind, icd: Game.s.icDrive.owned, speed: Game.s.upg.speed, area: Game.area, x: Game.player.x, y: Game.player.y, siteTrain: Game.siteTrain.state, moved: Game.player.hasMoved }));
  t.expectEq(s.cash, 1234, 'cash survives a reload');
  t.expect(s.dining && s.car && s.stand && s.rug && s.icd, 'unlocks and purchases survive a reload');
  t.expectEq(s.paint, 'rainbow', 'paint survives a reload');
  t.expectEq(s.balloon, 'star', 'balloon survives a reload');
  t.expectEq(s.speed, 2, 'upgrades survive a reload');
  t.expect(s.area === 'site' && s.x === 3300 && s.y === 500, 'position and map restored');
  t.expectEq(s.siteTrain, 'stopped', 'the site train waits at the platform after a reload there');
  t.expect(!s.moved, 'circles stay inert until the player moves after a reload');

  // an old save from before the extensions: only the original fields
  await t.ev(() => { Game.save = () => {}; localStorage.setItem(CFG.SAVE_KEY, JSON.stringify({ v: 1, cash: 50, unlocked: { dining: true }, decor: {}, upg: { speed: 1, capacity: 0, oven: 0 }, staff: { cashier: { count: 1, level: 0 } }, piles: { oven: 2 }, savedAt: Date.now() })); });
  await t.reload();
  const o = await t.ev(() => ({ cash: Game.s.cash, dining: Game.s.unlocked.dining, cashier: Game.s.staff.cashier.count, vehicles: Game.s.vehicles, islands: !!Game.s.islands, cabin: !!Game.s.cabin, balloon: !!Game.s.balloon, icDrive: !!Game.s.icDrive, upstairs: !!Game.s.upstairs, area: Game.area, paint: Game.s.paint.car }));
  t.expectEq(o.cash, 50, 'old save keeps its cash');
  t.expect(o.dining && o.cashier === 1, 'old save keeps its unlocks and staff');
  t.expect(o.vehicles && o.vehicles.car === false && o.islands && o.cabin && o.balloon && o.icDrive && o.upstairs, 'old save gains the new fields with defaults');
  t.expectEq(o.area, 'town', 'old save starts in town');
  t.expect(typeof o.paint === 'string', 'old save has a paint colour');
  await t.ev(() => { T.step(120); });
};
