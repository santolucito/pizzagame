'use strict';
// The fire station in the City: the door's label and hint on Harbour Street, going inside (welcome toast, no stray hint),
// the fire engine's cab (siren float, lights, staying put, climbing out), the stairs and the pole slide, a helmet to try
// on, the hose and the practice target, the bell that calls the crew down and back, the Dalmatian following and sitting,
// the $4 toy engine, a rescue from a wall, Take-me-home from inside, and going back out onto the door spot.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/city-firedept.js into index.html, load it into the booted page
  if (await t.ev(() => typeof FireDeptExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-firedept.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof FireDeptExt !== 'undefined' && !!CFG.AREAS.firedept), 'the fire station extension and its map are registered');
  t.expect(await t.ev(() => Game.ext.indexOf(FireDeptExt) < Game.ext.indexOf(CityExt)), 'the fire station answers before the City');
  t.expect(await t.ev(() => { const W = CFG.FIREDEPT.WORLD; return W.x0 === 15800 && W.y0 === 3000 && W.x1 === 16400 && W.y1 === 3400; }), 'the interior sits in building 19\'s reserved rectangle');

  // ---- the door on Harbour Street
  await t.ev(() => { const D = CFG.FIREDEPT.DOOR_OUT; T.tp(D.x, D.y + 60, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Visit the fire station! 🚒', 'fire station hint near the door');
  t.expect(await t.ev(() => { const D = CFG.FIREDEPT.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  t.expectEq(await t.ev(() => { const D = CFG.FIREDEPT.DOOR_OUT; T.tp(D.x, D.y + 90, 'city'); T.step(2); return FireDeptExt.hint(Game); }), undefined, 'no fire station hint further down the street');
  await t.ev(() => { Render.setZoom(1.2); const D = CFG.FIREDEPT.DOOR_OUT; T.tp(D.x, D.y, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  await t.shot('door');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'firedept', 'inside the fire station');
  t.expect(await t.ev(() => T.toasts.includes('🚒 Welcome to the fire station!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.FIREDEPT.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => FireDeptExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Climb into the fire engine! 🚒', 'engine hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, c = CFG.FIREDEPT.CAB_IN; return !!h.target && h.target.x === c.x && h.target.y === c.y; }), 'the hint points at the cab');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('inside');

  // ---- every spot you press the button on is free floor
  const spots = await t.ev(() => { const F = CFG.FIREDEPT; return [F.CAB_IN, F.STAIRS.foot, F.HELMET_SPOT, F.BELL_SPOT, F.SPRAY, F.PADS.toy, F.POLE.land, F.EXIT].map((s) => FireDeptExt.free(s.x, s.y)); });
  t.expect(spots.every(Boolean), `every spot is free floor (${JSON.stringify(spots)})`);

  // ---- the fire engine: climb in, siren, lights, stay put, climb out
  await t.ev(() => { const c = CFG.FIREDEPT.CAB_IN; T.tp(c.x, c.y + 4, 'firedept'); });
  t.expectEq(await t.ev(() => T.label()), '🚒 Climb in', 'climb-in label by the cab');
  await t.ev(() => { T.act(); T.step(5); });
  const cab = await t.ev(() => { const S = CFG.FIREDEPT.CAB_SEAT; return { cab: !!FireDeptExt.st.cab, rides: Game.s.firedept.rides, label: T.label(), hint: T.hint(), floats: Game.floats.map((f) => f.text), d: Math.hypot(Game.player.x - S.x, Game.player.y - S.y) }; });
  t.expect(cab.cab, 'sitting in the cab');
  t.expectEq(cab.rides, 1, 'one ride counted');
  t.expectEq(cab.label, '🚶 Climb out', 'climb-out label in the cab');
  t.expectEq(cab.hint, 'Wee-woo! Press the button to climb out 🚒', 'cab hint');
  t.expect(cab.floats.includes('Wee-woo! 🚒'), 'the siren float');
  t.expect(cab.d < 1, 'the chef sits on the cab seat');
  const stayed = await t.ev(() => { const S = CFG.FIREDEPT.CAB_SEAT; T.steer(1, 1); T.step(40); T.unsteer(); return Math.hypot(Game.player.x - S.x, Game.player.y - S.y); });
  t.expect(stayed < 1, 'the chef stays in the cab while seated');
  await t.shot('cab');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !FireDeptExt.st.cab && FireDeptExt.free(Game.player.x, Game.player.y)), 'climbed out onto free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Climb the stairs to the fire pole! 🪜', 'stairs hint after the ride');

  // ---- the stairs and the pole
  await t.ev(() => { const s = CFG.FIREDEPT.STAIRS.foot; T.tp(s.x, s.y + 2, 'firedept'); });
  t.expectEq(await t.ev(() => T.label()), '🪜 Climb the stairs', 'stairs label at the foot');
  await t.ev(() => { T.act(); T.step(5); });
  t.expect(await t.ev(() => !!FireDeptExt.st.climb), 'climbing');
  t.expectEq(await t.ev(() => T.hint()), 'Up we go! 🪜', 'climbing hint');
  const up = await t.ev(() => { const n = T.until(() => FireDeptExt.st.up, 400); const F = CFG.FIREDEPT; return { n, x: Game.player.x, y: Game.player.y, px: F.POLE.x, fy: F.GALLERY.floor, label: T.label(), hint: T.hint() }; });
  t.expect(up.n >= 0, 'reached the top of the pole');
  t.expect(Math.abs(up.x - up.px) < 1 && Math.abs(up.y - up.fy) < 1, `standing on the gallery by the pole (${Math.round(up.x)},${Math.round(up.y)})`);
  t.expectEq(up.label, '🧑‍🚒 Slide down!', 'slide label up top');
  t.expectEq(up.hint, 'Press the button to slide down the pole!', 'slide hint up top');
  const held = await t.ev(() => { const F = CFG.FIREDEPT; T.steer(-1, 1); T.step(30); T.unsteer(); return Math.hypot(Game.player.x - F.POLE.x, Game.player.y - F.GALLERY.floor); });
  t.expect(held < 1, 'the chef waits by the pole while up');
  await t.shot('gallery');
  await t.ev(() => { T.act(); T.step(12); });
  t.expect(await t.ev(() => !!FireDeptExt.st.slide && Game.floats.some((f) => f.text === 'Wheee!')), 'sliding with the Wheee float');
  t.expectEq(await t.ev(() => T.hint()), 'Wheee! 🧑‍🚒', 'sliding hint');
  await t.shot('slide');
  const landed = await t.ev(() => { const n = T.until(() => !FireDeptExt.st.slide, 200); const L = CFG.FIREDEPT.POLE.land; return { n, d: Math.hypot(Game.player.x - L.x, Game.player.y - L.y), slides: Game.s.firedept.slides, free: FireDeptExt.free(Game.player.x, Game.player.y) }; });
  t.expect(landed.n >= 0 && landed.d < 1 && landed.free, `landed on the mat under the pole (${JSON.stringify(landed)})`);
  t.expectEq(landed.slides, 1, 'one slide counted');
  t.expectEq(await t.ev(() => T.hint()), 'Try on a fire helmet! ⛑️', 'helmet hint after the slide');

  // ---- the helmet wall
  await t.ev(() => { const s = CFG.FIREDEPT.HELMET_SPOT; T.tp(s.x, s.y, 'firedept'); });
  t.expectEq(await t.ev(() => T.label()), '⛑️ Try a helmet', 'helmet label at the rack');
  await t.ev(() => { T.act(); T.step(2); });
  const helmet = await t.ev(() => ({ h: FireDeptExt.st.helmet, n: Game.s.firedept.helmets, hint: T.hint() }));
  t.expect(helmet.h > 28, 'wearing the helmet for half a minute');
  t.expectEq(helmet.n, 1, 'one helmet counted');
  t.expectEq(helmet.hint, 'Spray the target with the hose! 💦', 'hose hint after the helmet');
  await t.shot('helmet');

  // ---- the hose and the practice target
  await t.ev(() => { const s = CFG.FIREDEPT.SPRAY; T.tp(s.x, s.y, 'firedept'); });
  t.expectEq(await t.ev(() => T.label()), '💦 Spray the hose', 'hose label by the reel');
  await t.ev(() => { T.act(); T.step(40); });
  const spray = await t.ev(() => ({ spray: !!FireDeptExt.st.spray, spin: FireDeptExt.st.targetSpin, hint: T.hint(), floats: Game.floats.map((f) => f.text), n: Game.s.firedept.sprays }));
  t.expect(spray.spray && spray.spin > 0, 'the water flies and the target spins');
  t.expect(spray.floats.includes('Splash! 💦'), 'the Splash float');
  t.expectEq(spray.hint, 'Splash! 💦', 'spraying hint');
  t.expectEq(spray.n, 1, 'one spray counted');
  await t.shot('spray');
  t.expect(await t.ev(() => { T.until(() => !FireDeptExt.st.spray, 300); return FireDeptExt.st.targetSpin === 0 && FireDeptExt.free(Game.player.x, Game.player.y); }), 'the target settles and the chef is back on free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Ring the fire bell! 🔔', 'bell hint after the spray');

  // ---- the bell: the crew slides down the pole, lines up for 5 s, then climbs back up
  await t.ev(() => { const s = CFG.FIREDEPT.BELL_SPOT; T.tp(s.x, s.y, 'firedept'); });
  t.expectEq(await t.ev(() => T.label()), '🔔 Ring the bell', 'bell label under the bell');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !!FireDeptExt.st.alarm && FireDeptExt.st.bellSwing > 0 && Game.s.firedept.bells === 1), 'the alarm is on and the bell swings');
  const slid = await t.ev(() => T.until(() => FireDeptExt.st.crew.some((c) => c.state === 'slide'), 300));
  t.expect(slid >= 0, 'a firefighter slides down the pole');
  const lined = await t.ev(() => { const n = T.until(() => FireDeptExt.st.crew.every((c) => c.state === 'line') && FireDeptExt.st.captain.state === 'line', 1500); const F = CFG.FIREDEPT; return { n, ok: FireDeptExt.st.crew.every((c, i) => Math.hypot(c.x - F.LINE[i + 1].x, c.y - F.LINE[i + 1].y) < 1) }; });
  t.expect(lined.n >= 0 && lined.ok, 'the whole crew lined up on the floor');
  await t.shot('lineup');
  t.expect(await t.ev(() => { T.step(60 * 4); return FireDeptExt.st.crew.every((c) => c.state === 'line'); }), 'still lined up after 4 s');
  const back = await t.ev(() => { const n = T.until(() => !FireDeptExt.st.alarm, 2400); const F = CFG.FIREDEPT; return { n, home: FireDeptExt.st.crew.every((c, i) => c.state === 'up' && Math.hypot(c.x - F.CREW_HOMES[i].x, c.y - F.CREW_HOMES[i].y) < 1), cap: FireDeptExt.st.captain.state === 'home' }; });
  t.expect(back.n >= 0 && back.home && back.cap, `everyone went back to their places (${JSON.stringify(back)})`);

  // ---- the Dalmatian follows the chef and sits when the chef stops; the captain salutes
  const dog = await t.ev(() => {
    T.tp(16250, 3300, 'firedept'); T.step(60 * 2);
    const d = FireDeptExt.st.dog, near1 = Math.hypot(d.x - Game.player.x, d.y - Game.player.y), sat1 = d.sit;
    T.steer(-1, 0); T.step(50); T.unsteer();
    const moving = FireDeptExt.st.dog.moving || !FireDeptExt.st.dog.sit;
    T.step(60 * 2);
    const near2 = Math.hypot(d.x - Game.player.x, d.y - Game.player.y);
    return { near1, sat1, moving, near2, sat2: d.sit, free: !Game.obstacles().some((o) => Game.hitRect(d.x, d.y, 8, o)) };
  });
  t.expect(dog.near1 < 60 && dog.sat1, `the dog came over and sat (${JSON.stringify(dog)})`);
  t.expect(dog.moving, 'the dog got up when the chef walked');
  t.expect(dog.near2 < 60 && dog.sat2 && dog.free, 'the dog followed, sat again and is not in the furniture');
  const salute = await t.ev(() => { const C = CFG.FIREDEPT.CAPTAIN_HOME; T.tp(C.x + 40, C.y, 'firedept'); T.step(30); return { s: FireDeptExt.st.captain.salute, floats: Game.floats.map((f) => f.text) }; });
  t.expect(salute.s > 0.9 && salute.floats.includes('🫡'), 'the captain salutes');
  await t.shot('dog');

  // ---- a $4 toy fire engine from the circle
  const toy = await t.ev(() => {
    Game.s.cash = 20; const P = CFG.FIREDEPT.PADS.toy; T.tp(P.x, P.y, 'firedept');
    const hint = T.hint();
    const n = T.until(() => FireDeptExt.st.toy > 0, 400);
    return { hint, n, cash: Game.s.cash, toy: FireDeptExt.st.toy, toys: Game.s.firedept.toys };
  });
  t.expectEq(toy.hint, 'Buy a toy fire engine! 🚒', 'toy hint');
  t.expect(toy.n >= 0, 'the circle sold a toy engine');
  t.expectEq(toy.cash, 16, 'the toy cost $4');
  t.expectEq(toy.toys, 1, 'toy counted');
  t.expect(toy.toy > 35, 'the toy is carried for a while');
  t.expectEq(await t.ev(() => T.hint()), 'Looking brave! ⛑️', 'helmet hint while wearing it');
  // the helmet and toy come along outside, then run out
  t.expect(await t.ev(() => { T.tp(540, 430, 'town'); T.step(2); return FireDeptExt.st.helmet > 0 && FireDeptExt.st.toy > 30; }), 'helmet and toy come along to the town');
  t.expect(await t.ev(() => { T.step(60 * 45); return FireDeptExt.st.helmet === 0 && FireDeptExt.st.toy === 0; }), 'helmet and toy are gone after a while');

  // ---- a reload or push into a wall lands back on the mat
  await t.ev(() => { const R = CFG.FIREDEPT.ROOM; T.tp(R.x0 - 10, 3200, 'firedept'); T.step(3); });
  t.expect(await t.ev(() => FireDeptExt.free(Game.player.x, Game.player.y)), 'pushed into the wall: rescued onto the floor');
  t.expect(await t.ev(() => { const E = CFG.FIREDEPT.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'the rescue lands on the exit mat');
  await t.ev(() => { const E = CFG.FIREDEPT.ENGINE; T.tp((E.x0 + E.x1) / 2, (E.y0 + E.y1) / 2, 'firedept'); T.step(3); });
  t.expect(await t.ev(() => FireDeptExt.free(Game.player.x, Game.player.y)), 'dropped onto the engine: rescued');
  t.expectEq(await t.ev(() => T.hint()), 'The Dalmatian loves you! 🐶', 'the quiet hint once everything is done');

  // ---- phone-size station
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.tp(16100, 3240, 'firedept'); T.step(2); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- Take-me-home from the cab, with the alarm running
  await t.ev(() => { const s = CFG.FIREDEPT.BELL_SPOT; T.tp(s.x, s.y, 'firedept'); T.act(); const c = CFG.FIREDEPT.CAB_IN; T.tp(c.x, c.y, 'firedept'); T.act(); T.step(5); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'Take-me-home leaves the station');
  t.expect(await t.ev(() => !FireDeptExt.st.cab && !FireDeptExt.st.alarm && FireDeptExt.st.crew.every((c) => c.state === 'up')), 'the cab and the alarm are cleared by Take-me-home');
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');
  t.expectEq(await t.ev(() => FireDeptExt.hint(Game)), undefined, 'no fire station hint in the town');

  // ---- out through the door: back on the sidewalk at the door spot
  await t.ev(() => { const E = CFG.FIREDEPT.EXIT; T.tp(E.x, E.y, 'firedept'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back outside in the City');
  t.expect(await t.ev(() => { const D = CFG.FIREDEPT.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the door spot');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door offers going back in');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '🚒 Welcome to the fire station!').length === 1), 'the welcome toast shows only once');

  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
