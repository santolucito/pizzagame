'use strict';
// Riding the yellow taxis as a passenger: hail one from a City curb, ride along, get out onto a sidewalk, and a
// full loop without pressing anything brings you back to where you got in.
module.exports = async (t) => {
  await t.boot();
  const CURB = { x: 5250, y: 470 };   // the north sidewalk of Market Street, between the Pizza Tower and 2nd Avenue
  const where = () => t.ev(() => {
    const p = Game.player, C = CFG.CITY;
    const inRoad = C.ROADS.some((rd) => p.x >= rd.x0 && p.x <= rd.x1 && p.y >= rd.y0 && p.y <= rd.y1);
    const inObstacle = Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 10, o));
    const nearRoad = C.ROADS.some((rd) => Math.hypot(Math.max(rd.x0 - p.x, 0, p.x - rd.x1), Math.max(rd.y0 - p.y, 0, p.y - rd.y1)) <= 60);
    return { x: p.x, y: p.y, inRoad, inObstacle, nearRoad, driving: Game.driving, cab: CityExt.st.cab ? CityExt.st.cab.phase : null };
  });

  // ---- hail from the curb
  await t.ev((c) => T.tp(c.x, c.y, 'city'), CURB);
  t.expectEq(await t.ev(() => T.label()), '🚕 Hail a taxi', 'hail label on a City curb');
  await t.ev(() => T.act());
  t.expectEq(await t.ev(() => CityExt.st.cab && CityExt.st.cab.phase), 'coming', 'a taxi is on its way');
  t.expectEq(await t.ev(() => T.hint()), '🚕 Taxi’s coming!', 'waiting hint');
  await t.ev(() => T.until(() => CityExt.st.cab && CityExt.st.cab.phase === 'riding', 3000));
  t.expectEq(await t.ev(() => CityExt.st.cab && CityExt.st.cab.phase), 'riding', 'hopped in and the ride started');
  t.expectEq(await t.ev(() => T.label()), '🚶 Get out here', 'get-out label while riding');
  t.expectEq(await t.ev(() => T.hint()), 'Enjoy the ride! Press the button to get out', 'riding hint');

  // ---- the chef moves with the taxi, on foot (not driving), pinned to it
  const a = await where();
  await t.ev(() => T.step(180));
  const b = await where();
  t.expect(Math.hypot(a.x - b.x, a.y - b.y) > 120, 'the chef travelled with the taxi for three seconds');
  t.expect(!b.driving, 'riding as a passenger is not driving a vehicle');
  t.expect(await t.ev(() => { const c = CityExt.st.cab; return Math.abs(Game.player.x - c.taxi.x) < 1 && Math.abs(Game.player.y - c.taxi.y) < 1; }), 'the chef sits exactly where the taxi is');

  // ---- get out: the taxi pulls over and the chef steps onto a sidewalk
  await t.ev(() => T.act());
  t.expectEq(await t.ev(() => CityExt.st.cab && CityExt.st.cab.phase), 'pulling', 'pulling over after the button');
  await t.ev(() => T.until(() => !CityExt.st.cab, 600));
  const out = await where();
  t.expect(out.cab === null, 'the ride ended');
  t.expect(!out.inRoad, 'stepped out off the road');
  t.expect(!out.inObstacle, 'stepped out clear of every obstacle');
  t.expect(out.nearRoad, 'stepped out onto a sidewalk beside a street');
  t.expect(!out.driving, 'on foot after the ride');
  await t.shot('got-out');

  // ---- a whole loop without pressing anything ends back where you got in
  await t.ev((c) => T.tp(c.x, c.y, 'city'), CURB);
  t.expectEq(await t.ev(() => T.label()), '🚕 Hail a taxi', 'can hail again from the curb');
  await t.ev(() => { T.act(); T.until(() => CityExt.st.cab && CityExt.st.cab.phase === 'riding', 3000); });
  const steps = await t.ev(() => T.until(() => !CityExt.st.cab, 4000));
  t.expect(steps > 0, 'the loop ride ended by itself');
  const back = await where();
  t.expect(Math.hypot(back.x - CURB.x, back.y - CURB.y) < 40, 'dropped off where the chef got in');
  t.expect(!back.inRoad && !back.inObstacle, 'dropped off on the sidewalk');
  t.expect(await t.ev(() => CityExt.st.taxis.every((x) => !x.route)), 'every taxi is back to looping');
  t.expect(await t.ev(() => Game.s.cash >= 0), 'never charged');

  // ---- Take me home ends a ride
  await t.ev((c) => { T.tp(c.x, c.y, 'city'); T.act(); T.until(() => CityExt.st.cab && CityExt.st.cab.phase === 'riding', 3000); Game.goHome(); T.step(2); }, CURB);
  t.expect(await t.ev(() => CityExt.st.cab === null && Game.area === 'town'), 'home button drops the taxi ride');
};
