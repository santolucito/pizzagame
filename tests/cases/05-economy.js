'use strict';
// Every circle can be bought by standing on it, and buying does what it says.
module.exports = async (t) => {
  await t.boot();
  const buyAll = async (area, at) => t.ev(([area, at]) => {
    T.tp(at.x, at.y, area); Game.s.cash = 1e6;
    const bought = [];
    for (let i = 0; i < 80; i++) {
      const pads = Game.allPads().filter((p) => !p.maxed);
      if (!pads.length) break;
      const pad = pads[0];
      Game.player.x = pad.pos.x; Game.player.y = pad.pos.y; Game.player.hasMoved = true; Game.player.moving = false;
      const before = JSON.stringify([Game.s.unlocked, Game.s.upg, Game.s.staff, Game.s.decor, Game.s.iceCream.owned, Game.s.iceCream.flavors, Game.s.vehicles, Game.s.islands.standOwned, Game.s.icDrive.owned]);
      const n = T.until(() => JSON.stringify([Game.s.unlocked, Game.s.upg, Game.s.staff, Game.s.decor, Game.s.iceCream.owned, Game.s.iceCream.flavors, Game.s.vehicles, Game.s.islands.standOwned, Game.s.icDrive.owned]) !== before, 900);
      if (n < 0) return { failed: pad.key, bought };
      bought.push(pad.key);
      Game.player.x = at.x; Game.player.y = at.y; T.step(70);   // step off so the same circle's breather passes
    }
    return { bought, left: Game.allPads().filter((p) => !p.maxed).map((p) => p.key) };
  }, [area, at]);

  const town = await buyAll('town', { x: 540, y: 430 });
  t.expect(!town.failed, `every town circle completes (stuck on ${town.failed})`);
  t.expect(town.left.length === 0, `no town circles left unbought: ${JSON.stringify(town.left)}`);
  const s = await t.ev(() => ({ u: Game.s.unlocked, upg: Game.s.upg, staff: Game.s.staff, ic: Game.s.iceCream, v: Game.s.vehicles, icd: Game.s.icDrive.owned, flavorsMax: CFG.ICE_CREAM.flavorsMax, decor: Object.keys(Game.s.decor).length, max: { speed: CFG.UPGRADES.speed.max, capacity: CFG.UPGRADES.capacity.max, oven: CFG.UPGRADES.oven.max }, items: CFG.DECOR_ITEMS.length }));
  t.expect(s.u.dining && s.u.tables2 && s.u.oven2 && s.u.driveThru && s.u.station, 'all areas unlocked');
  t.expect(s.upg.speed === s.max.speed && s.upg.capacity === s.max.capacity && s.upg.oven === s.max.oven, 'all upgrades maxed');
  t.expect(s.staff.cashier.count === 1 && s.staff.helper.count === 1 && s.staff.cleaner.count === 1, 'all staff hired');
  t.expect(s.ic.owned && s.ic.flavors === s.flavorsMax, 'ice cream shop owned with all flavours');
  t.expect(s.v.car && s.v.bike, 'car and scooter bought from the showroom');
  t.expect(s.icd, 'ice cream drive-thru bought');
  t.expectEq(s.decor, s.items, 'every decoration bought');

  const isl = await buyAll('islands', { x: 3000, y: 1905 });
  t.expect(!isl.failed && isl.left.length === 0, `island circles complete: ${JSON.stringify(isl)}`);
  t.expect(await t.ev(() => Game.s.islands.standOwned), 'island pizza stand owned');

};
