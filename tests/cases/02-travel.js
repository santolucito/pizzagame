'use strict';
// Every way of getting somewhere and back: train, bus, ferry, plane, cabin, upstairs, elevator.
module.exports = async (t) => {
  await t.boot();

  // ---- train to Construction Town and back
  await t.ev(() => { Game.s.unlocked.station = true; Game.train.summon(); T.until(() => Game.train.state === 'stopped', 1500); const S = CFG.STATION; T.tp(S.stopX + S.boardDx, S.platform.y1 - 12); });
  t.expectEq(await t.ev(() => T.label()), '🚂 Ride the train', 'train boarding label on the platform');
  await t.ev(() => { T.act(); T.until(() => Game.area === 'site' && Game.siteTrain.state === 'stopped' && !Game.travel, 3000); });
  t.expectEq(await t.ev(() => Game.area), 'site', 'arrived at Construction Town by train');
  t.expectEq(await t.ev(() => T.label()), '🚶 Hop off the train', 'hop-off label at the site');
  await t.ev(() => T.act());
  const sitePos = await t.ev(() => ({ x: Game.player.x, on: Game.onTrain, P: CFG.SITE.STATION.platform }));
  t.expect(!sitePos.on && sitePos.x > sitePos.P.x0 && sitePos.x < sitePos.P.x1, 'hopped off onto the site platform');
  await t.ev(() => { const S = CFG.SITE.STATION; T.tp(S.stopX + S.boardDx, S.platform.y1 - 12); });
  t.expectEq(await t.ev(() => T.label()), '🚂 Ride the train', 'can board the waiting train at the site');
  await t.ev(() => { T.act(); T.until(() => Game.area === 'town' && Game.train.state === 'stopped' && !Game.travel, 3000); T.act(); });
  const home = await t.ev(() => ({ area: Game.area, on: Game.onTrain, x: Game.player.x, P: CFG.STATION.platform }));
  t.expect(home.area === 'town' && !home.on && home.x > home.P.x0 && home.x < home.P.x1, 'back on the home platform');

  // ---- bus to the City and back
  await t.ev(() => { T.tp(500, -40, 'town'); CityExt.st.bus.timer = 0.3; T.until(() => T.label() === '🚌 Ride the bus', 2000); });
  t.expectEq(await t.ev(() => T.label()), '🚌 Ride the bus', 'bus arrives and can be boarded');
  await t.ev(() => { T.act(); T.until(() => Game.area === 'city' && !Game.travel, 3000); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'arrived in the City by bus');
  await t.ev(() => T.tp(CFG.CITY.STOP.x, CFG.CITY.STOP.y));
  t.expectEq(await t.ev(() => T.label()), '🚌 Ride the bus home', 'return bus waits in the City');
  await t.ev(() => { T.act(); T.until(() => Game.area === 'town' && !Game.travel, 3000); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'back in town by bus');

  // ---- ferry to the Islands and back, pizzas stashed on the dock
  await t.ev(() => { T.tp(10, 1256, 'town'); Game.player.carry = 2; });
  t.expectEq(await t.ev(() => T.label()), '⛴️ Ride the ferry', 'ferry label on the dock');
  await t.ev(() => { T.act(); T.until(() => Game.area === 'islands' && !Game.travel, 3000); });
  t.expectEq(await t.ev(() => Game.area), 'islands', 'arrived at the Islands');
  t.expectEq(await t.ev(() => Game.s.islands.dockPizzas), 2, 'pizzas waited in the dock crate');
  t.expectEq(await t.ev(() => Game.player.carry), 0, 'no pizzas carried onto the ferry');
  await t.ev(() => { T.step(60); });
  t.expectEq(await t.ev(() => T.label()), '⛴️ Ferry home', 'ferry home label on the island dock');
  await t.ev(() => { T.act(); T.until(() => Game.area === 'town' && !Game.travel, 3000); T.step(30); });
  t.expectEq(await t.ev(() => Game.player.carry), 2, 'pizzas handed back on the home dock');

  // ---- plane to Cloud Harbor and back
  await t.ev(() => { T.tp(1900, 520, 'town'); T.step(2); Game.enterCar(); });
  t.expectEq(await t.ev(() => Game.vehicle && Game.vehicle.kind), 'plane', 'hopped into the plane by the hangar');
  t.expectEq(await t.ev(() => T.label()), '🛫 Take off!', 'take-off offered as soon as you sit in the plane');
  await t.ev(() => { T.act(); T.until(() => Game.area === 'cloud' && !Game.travel && !Game.driving, 4000); });
  t.expectEq(await t.ev(() => Game.area), 'cloud', 'landed at Cloud Harbor');
  await t.ev(() => { T.step(200); const v = AirfieldExt.rt.cloudPlane; Game.player.x = v.x; Game.player.y = v.y + 46; T.step(2); Game.enterCar(); });
  t.expectEq(await t.ev(() => Game.vehicle && Game.vehicle.kind), 'plane', 'hopped into the plane at Cloud Harbor');
  t.expectEq(await t.ev(() => T.label()), '🛫 Fly home!', 'fly-home offered as soon as you sit in the cloud plane');
  await t.ev(() => { T.act(); T.until(() => Game.area === 'town' && !Game.travel && !Game.driving, 4000); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'flew home');

  // ---- the cabin
  await t.ev(() => { const H = CFG.SECRET.HOME; T.tp(H.porchDoor.x, H.porchDoor.y, 'town'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'cabin door label');
  await t.ev(() => T.act());
  t.expectEq(await t.ev(() => Game.area), 'cabin', 'inside the cabin');
  await t.ev(() => { T.step(30); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'cabin exit label on the mat');
  await t.ev(() => T.act());
  t.expectEq(await t.ev(() => Game.area), 'town', 'back on the porch');

  // ---- upstairs
  await t.ev(() => { const L = CFG.UPSTAIRS.STAIRS.landing; T.tp(L.x, L.y, 'town'); });
  t.expectEq(await t.ev(() => T.label()), '🪜 Go upstairs', 'stairs label on the landing');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'upstairs', 'in the bedroom');
  t.expectEq(await t.ev(() => T.label()), '🪜 Go downstairs', 'downstairs label at the top of the stairs');
  await t.ev(() => T.act());
  t.expectEq(await t.ev(() => Game.area), 'town', 'back in the office');

  // ---- the Pizza Tower elevator: lobby, floor 6, back to 1, out
  await t.ev(() => { const D = CFG.CITY.TOWER.door; T.tp(D.x, D.y, 'city'); });
  t.expectEq(await t.ev(() => T.label()), '🛗 Ride the elevator', 'tower door label');
  await t.ev(() => { T.act(); const sp = CityExt.liftSpot(); Game.player.x = sp.x; Game.player.y = sp.y; T.step(5); });
  t.expect(await t.ev(() => !!CityExt.st.panel), 'elevator panel opens inside the car');
  await t.ev(() => { CityExt.st.panel.sel = 6; T.act(); T.until(() => CityExt.floor === 6 && !CityExt.st.lift, 800); });
  t.expectEq(await t.ev(() => CityExt.floor), 6, 'rode to the rooftop');
  await t.ev(() => { const sp = CityExt.liftSpot(); Game.player.x = sp.x; Game.player.y = sp.y; T.step(5); CityExt.st.panel.sel = 1; T.act(); T.until(() => CityExt.floor === 1 && !CityExt.st.lift, 800); });
  t.expectEq(await t.ev(() => CityExt.floor), 1, 'rode back to the lobby');
  await t.ev(() => CityExt.leaveTower(Game));
  t.expectEq(await t.ev(() => CityExt.floor), null, 'out on the street');
};
