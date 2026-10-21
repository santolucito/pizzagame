'use strict';
// The bedroom telescope: once bought from the catalog it stands by the window upstairs; stand next to it to look
// out over the town with the same mechanism as the Pizza Tower's rooftop telescope (the chef held at the eyepiece,
// the stick panning the view). Also checks the City's own telescope still works after the mechanism was shared.
const path = require('path');
module.exports = async (t) => {
  // the extension is loaded by index.html once wired in; until then the case injects it itself
  const load = async () => { if (await t.ev(() => typeof BedroomScopeExt === 'undefined')) await t.page.addScriptTag({ path: path.join(__dirname, '..', '..', 'js', 'bedroomscope.js') }); };
  await t.boot();
  await load();
  t.expect(await t.ev(() => Game.ext.indexOf(BedroomScopeExt) < Game.ext.indexOf(CityExt) && Render.ext.includes(BedroomScopeExt)), 'registered first in Game.ext and in Render.ext');
  const spot = await t.ev(() => BedroomScopeExt.spot());
  t.expectEq([spot.x, spot.y].join(','), '6872,1594', 'the telescope spot is the catalog item by the window');

  // ---- not bought yet: nothing offered by the window
  await t.ev((s) => { Game.s.cash = 5000; T.tp(s.x, s.y + 28, 'upstairs'); T.step(2); }, spot);
  t.expect(await t.ev(() => T.label() !== '🔭 Look through the telescope'), 'no telescope button before buying it');
  t.expect(await t.ev(() => T.hint() !== 'Look through the telescope! 🔭'), 'no telescope hint before buying it');

  // ---- own it (as the catalog would) and stand by it
  const keyBefore = await t.ev(() => UpstairsExt.bgKey(Game));
  await t.ev((s) => { Game.s.upstairs.owned.telescope = true; T.tp(s.x, s.y + 28, 'upstairs'); T.step(2); }, spot);
  t.expect(await t.ev(() => UpstairsExt.bgKey(Game)) !== keyBefore, 'the room rebuilds with the telescope in it');
  t.expect(await t.ev(() => Game.obstacles().some((o) => o.x === 6858 && o.y === 1580)), 'the telescope is solid in the room');
  t.expectEq(await t.ev(() => T.label()), '🔭 Look through the telescope', 'telescope button by the window');
  t.expectEq(await t.ev(() => T.hint()), 'Look through the telescope! 🔭', 'telescope hint by the window');
  await t.wait(300);
  await t.shot('room');
  // too far away: the room's own buttons again
  await t.ev((s) => { T.tp(s.x - 60, s.y + 28, 'upstairs'); T.step(2); }, spot);
  t.expect(await t.ev(() => T.label() !== '🔭 Look through the telescope'), 'no telescope button 60 px away');
  t.expectEq(await t.ev(() => T.hint()), null, 'no stray hint away from it');
  await t.ev((s) => { T.tp(s.x, s.y + 28, 'upstairs'); T.step(2); }, spot);

  // ---- look: the view opens on Main Street, the chef is frozen, the stick pans the view
  await t.ev(() => T.act());
  const v0 = await t.ev(() => ({ on: !!BedroomScopeExt.viewing, f: BedroomScopeExt.viewing && BedroomScopeExt.viewing.f, hint: T.hint(), label: T.label() }));
  t.expect(v0.on, 'viewing state on');
  t.expectEq(v0.f, 0.35, 'the view opens on Main Street');
  t.expectEq(v0.hint, null, 'no hint while looking');
  t.expectEq(v0.label, '🚶 Done looking', 'done-looking button while looking');
  const pan = await t.ev(() => { const x = Game.player.x, y = Game.player.y, f0 = BedroomScopeExt.viewing.f; T.steer(1, 0); T.step(90); T.unsteer(); T.step(2); return { moved: Math.hypot(Game.player.x - x, Game.player.y - y), f0, f1: BedroomScopeExt.viewing.f, vel: BedroomScopeExt.viewing.vel }; });
  t.expect(pan.moved < 0.01, 'the chef stays at the eyepiece while steering');
  t.expect(pan.f1 > pan.f0 + 0.15, `steering right pans the view (${pan.f0} -> ${pan.f1.toFixed(3)})`);
  // steering up/down does nothing to the pan
  const vert = await t.ev(() => { T.step(90); const f = BedroomScopeExt.viewing.f; T.steer(0, 1); T.step(60); T.unsteer(); T.step(30); return Math.abs(BedroomScopeExt.viewing.f - f); });
  t.expect(vert < 0.01, 'up/down does not pan');
  await t.shot('view-mid');
  // all the way to the right: the City; the view stops at the end with a soft bump
  const right = await t.ev(() => { T.steer(1, 0); T.step(400); T.unsteer(); T.step(40); return { f: BedroomScopeExt.viewing.f, bumped: BedroomScopeExt.viewing.bumpDir }; });
  t.expectEq(right.f, 1, 'the view stops at the right end');
  t.expectEq(right.bumped, 1, 'a bump at the right end');
  await t.shot('view-city');
  // all the way to the left: the farm
  const left = await t.ev(() => { T.steer(-1, 0); T.step(600); T.unsteer(); T.step(40); return { f: BedroomScopeExt.viewing.f, bumped: BedroomScopeExt.viewing.bumpDir }; });
  t.expectEq(left.f, 0, 'the view stops at the left end');
  t.expectEq(left.bumped, -1, 'a bump at the left end');
  await t.shot('view-farm');
  // at dusk the view follows the Atmosphere tint
  if (await t.ev(() => typeof AtmosphereExt !== 'undefined')) {
    await t.ev(() => { AtmosphereExt.force({ phase: 'dusk' }); T.steer(1, 0); T.step(150); T.unsteer(); T.step(40); });
    t.expect(await t.ev(() => AtmosphereExt.dusk > 0.9), 'dusk forced');
    await t.shot('view-dusk');
    await t.ev(() => { AtmosphereExt.force({ phase: 'day' }); T.step(2); });
  }

  // ---- done looking: free again, the button comes back
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !BedroomScopeExt.viewing), 'viewing off after Done looking');
  t.expectEq(await t.ev(() => T.label()), '🔭 Look through the telescope', 'telescope button again');
  const walk = await t.ev(() => { const x = Game.player.x; T.steer(-1, 0); T.step(20); T.unsteer(); return x - Game.player.x; });
  t.expect(walk > 10, 'the chef can walk away after looking');

  // ---- the room's own scenes win: no telescope button while the catalog is open
  await t.ev((s) => { T.tp(s.x, s.y + 28, 'upstairs'); T.step(1); UpstairsExt.st.cat.on = true; UpstairsExt.st.cat.hold = { x: Game.player.x, y: Game.player.y }; T.step(1); }, spot);
  t.expect(await t.ev(() => T.label() !== '🔭 Look through the telescope'), 'no telescope button while the catalog is open');
  await t.ev(() => { UpstairsExt.st.cat.on = false; UpstairsExt.st.cat.hold = null; T.step(1); });

  // ---- Take me home while looking clears the view
  await t.ev((s) => { T.tp(s.x, s.y + 28, 'upstairs'); T.step(2); T.act(); T.step(5); }, spot);
  t.expect(await t.ev(() => !!BedroomScopeExt.viewing), 'looking again');
  await t.ev(() => { Game.goHome(); T.step(2); });
  t.expect(await t.ev(() => !BedroomScopeExt.viewing && Game.area === 'town'), 'Take me home clears the view and lands in the shop');
  t.expect(await t.ev(() => T.hint() !== 'Look through the telescope! 🔭'), 'no telescope hint in the shop');

  // ---- phone-size view
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev((s) => { Render.resize(); T.tp(s.x, s.y + 28, 'upstairs'); T.step(2); T.act(); T.step(5); }, spot);
  t.expectEq(await t.ev(() => T.label()), '🚶 Done looking', 'looking on a phone');
  await t.shot('view-phone-street');
  await t.ev(() => { T.steer(1, 0); T.step(200); T.unsteer(); T.step(40); });
  t.expect(await t.ev(() => BedroomScopeExt.viewing.f > 0.7), 'panned east on the phone');
  await t.shot('view-phone-east');
  await t.ev(() => { T.act(); T.step(2); });
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- the City's own rooftop telescope still works (the shared mechanism)
  const city = await t.ev(() => {
    CityExt.floor = CFG.CITY.TOWER.floors; const tl = CityExt.telescope(); T.tp(tl.x, tl.y + 20, 'city'); T.step(2);
    const label = T.label(); T.act(); const on = !!CityExt.viewing, f0 = CityExt.viewing && CityExt.viewing.f, hint = T.hint(), doneLabel = T.label();
    T.steer(1, 0); T.step(60); T.unsteer(); T.step(2); const f1 = CityExt.viewing.f;
    T.act(); const off = !CityExt.viewing;
    CityExt.floor = null; CityExt.viewing = null; T.tp(540, 430, 'town');
    return { label, on, f0, hint, doneLabel, f1, off };
  });
  t.expectEq(city.label, '🔭 Look through the telescope', 'City rooftop telescope button');
  t.expect(city.on && city.f0 === 0.14, 'City view opens on the pizza town');
  t.expectEq(city.hint, '◀ ▶ to look around', 'City look-around hint unchanged');
  t.expectEq(city.doneLabel, '🚶 Done looking', 'City done-looking button');
  t.expect(city.f1 > 0.2, `City view pans (${city.f1.toFixed(3)})`);
  t.expect(city.off, 'City view closes');
};
