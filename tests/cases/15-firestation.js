'use strict';
// The town fire station: the little door on its west wall (free sidewalk, reachable, clear of the truck's route), the
// label and hint there, going inside (welcome toast, no stray hint), the town's own truck in its bay when it is home
// (climb in: siren float, staying put, climbing out) and the empty bay with the cone when the truck is out, the stairs
// and the pole slide, a helmet, the bell that calls the crew down and back, the hose and the target, stop-drop-and-roll
// by the poster, the $3 chili, the cat, the sleepy Dalmatian, a rescue from a wall, Take-me-home from inside, and going
// back out onto the door spot.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/firestation.js into index.html, load it into the booted page
  if (await t.ev(() => typeof FireStationExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/firestation.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof FireStationExt !== 'undefined' && !!CFG.AREAS.firestation), 'the fire station extension and its map are registered');
  t.expect(await t.ev(() => Game.ext.indexOf(FireStationExt) < Game.ext.indexOf(CityExt)), 'the fire station answers before the City');
  t.expect(await t.ev(() => { const W = CFG.FIRESTATION.WORLD; return W.x0 === 3000 && W.y0 === 4000 && W.x1 === 3600 && W.y1 === 4400; }), 'the interior sits in its reserved rectangle');

  // ---- the door spot on the town sidewalk: free, reachable from the road, and clear of the truck's route
  const spot = await t.ev(() => {
    const D = CFG.FIRESTATION.DOOR_OUT;
    const blocked = Game.obstacles().some((o) => Game.hitRect(D.x, D.y, 12, o));
    T.tp(1280, D.y, 'town'); T.steer(1, 0); T.step(90); T.unsteer();
    const reached = Math.hypot(Game.player.x - D.x, Game.player.y - D.y);
    let moved = 0;
    for (const [ax, ay] of [[-1, 0], [0, 1], [0, -1]]) { T.tp(D.x, D.y, 'town'); T.steer(ax, ay); T.step(8); T.unsteer(); moved = Math.max(moved, Math.hypot(Game.player.x - D.x, Game.player.y - D.y)); }
    // the truck's outing and return paths, as segments between the home spot and the waypoints
    const pts = [CFG.FIRE_TRUCK_HOME].concat(CFG.FIRE_TRUCK_OUT), back = CFG.FIRE_TRUCK_BACK;
    const segs = []; for (let i = 1; i < pts.length; i++) segs.push([pts[i - 1], pts[i]]); for (let i = 1; i < back.length; i++) segs.push([back[i - 1], back[i]]);
    let dPath = Infinity;
    for (const [a, b] of segs) { const L = Math.hypot(b.x - a.x, b.y - a.y) || 1, k = Math.max(0, Math.min(1, ((D.x - a.x) * (b.x - a.x) + (D.y - a.y) * (b.y - a.y)) / (L * L))); dPath = Math.min(dPath, Math.hypot(D.x - (a.x + k * (b.x - a.x)), D.y - (a.y + k * (b.y - a.y)))); }
    return { D, blocked, reached, moved, dPath };
  });
  t.expect(!spot.blocked, `the door spot ${JSON.stringify(spot.D)} is clear of obstacles`);
  t.expect(spot.reached < 8, `walking east from East Road reaches the door spot (${spot.reached.toFixed(1)} px short)`);
  t.expect(spot.moved > 20, 'the chef can walk away from the door spot');
  t.expect(spot.dPath >= 36, `the door spot is clear of the truck's route (${spot.dPath.toFixed(0)} px; the truck is 24 px wide from its middle, the chef 12)`);
  await t.ev(() => { const D = CFG.FIRESTATION.DOOR_OUT; T.tp(D.x - 50, D.y - 30, 'town'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Go into the fire station! 🚒', 'fire station hint near the door');
  t.expect(await t.ev(() => { const D = CFG.FIRESTATION.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door spot');
  t.expect(await t.ev(() => T.label() !== '🚪 Go into the fire station'), 'no door button away from the door');
  t.expectEq(await t.ev(() => { const D = CFG.FIRESTATION.DOOR_OUT; T.tp(D.x - 100, D.y, 'town'); T.step(2); return FireStationExt.hint(Game); }), undefined, 'no fire station hint out on the road');
  await t.ev(() => { Render.setZoom(1.2); const D = CFG.FIRESTATION.DOOR_OUT; T.tp(D.x, D.y, 'town'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go into the fire station', 'door label at the door spot');
  t.expectEq(await t.ev(() => T.hint()), 'Go into the fire station! 🚒', 'door hint at the door spot');
  await t.shot('door');

  // ---- go in: on the mat, welcome toast, the hint points at the truck
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'firestation', 'inside the fire station');
  t.expect(await t.ev(() => T.toasts.includes('🚒 Welcome to the fire station!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.FIRESTATION.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => FireStationExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expect(await t.ev(() => FireStationExt.st.dog.sleep), 'the Dalmatian is asleep in its basket');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  t.expectEq(await t.ev(() => T.hint()), 'Climb into the fire truck! 🚒', 'truck hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, c = CFG.FIRESTATION.CAB_IN; return !!h.target && h.target.x === c.x && h.target.y === c.y; }), 'the hint points at the cab');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('inside');

  // ---- every spot you press the button on is free floor (with the truck home)
  const spots = await t.ev(() => { const F = CFG.FIRESTATION; return [F.CAB_IN, F.STAIRS.foot, F.HELMET_SPOT, F.BELL_SPOT, F.POSTER_SPOT, F.SPRAY, F.PADS.chili, F.POLE.land, F.EXIT, F.DOG_HOME].concat(F.LINE).map((s) => FireStationExt.free(s.x, s.y)); });
  t.expect(spots.every(Boolean), `every spot is free floor (${JSON.stringify(spots)})`);

  // ---- the town's truck is in its bay: climb in, siren, stay put, climb out
  t.expect(await t.ev(() => Game.fireTruck.state === 'home' && FireStationExt.truckHome(Game)), 'the truck is home');
  t.expect(await t.ev(() => Game.obstacles().some((o) => o === CFG.FIRESTATION.TRUCK_BOX)), 'the truck is solid in its bay');
  await t.ev(() => { const c = CFG.FIRESTATION.CAB_IN; T.tp(c.x, c.y + 4, 'firestation'); });
  t.expectEq(await t.ev(() => T.label()), '🚒 Climb in', 'climb-in label by the cab');
  await t.ev(() => { T.act(); T.step(5); });
  const cab = await t.ev(() => { const S = CFG.FIRESTATION.CAB_SEAT; return { cab: !!FireStationExt.st.cab, rides: Game.s.firestation.rides, label: T.label(), hint: T.hint(), floats: Game.floats.map((f) => f.text), d: Math.hypot(Game.player.x - S.x, Game.player.y - S.y) }; });
  t.expect(cab.cab, 'sitting in the cab');
  t.expectEq(cab.rides, 1, 'one ride counted');
  t.expectEq(cab.label, '🚶 Climb out', 'climb-out label in the cab');
  t.expectEq(cab.hint, 'Wee-woo! Press the button to climb out 🚒', 'cab hint');
  t.expect(cab.floats.includes('Wee-woo! 🚒'), 'the siren float');
  t.expect(cab.d < 1, 'the chef sits on the cab seat');
  const stayed = await t.ev(() => { const S = CFG.FIRESTATION.CAB_SEAT; T.steer(1, 1); T.step(40); T.unsteer(); return Math.hypot(Game.player.x - S.x, Game.player.y - S.y); });
  t.expect(stayed < 1, 'the chef stays in the cab while seated');
  await t.shot('cab');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !FireStationExt.st.cab && FireStationExt.free(Game.player.x, Game.player.y)), 'climbed out onto free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Climb the stairs to the fire pole! 🪜', 'stairs hint after the ride');

  // ---- the truck goes out (the core's outing, started the way the entity does it): the bay empties, with a cone
  const out = await t.ev(() => {
    Game.s.unlocked.driveThru = true; Game.fireTruck.state = 'home'; Game.fireTruck.timer = 0; T.step(2);
    const c = CFG.FIRESTATION.CAB_IN; T.tp(c.x, c.y + 4, 'firestation'); T.step(2);
    return { state: Game.fireTruck.state, home: FireStationExt.truckHome(Game), solid: Game.obstacles().some((o) => o === CFG.FIRESTATION.TRUCK_BOX), label: T.label(), floats: Game.floats.map((f) => f.text), toasts: T.toasts.slice() };
  });
  t.expectEq(out.state, 'out', 'the core sent the truck out for pizza');
  t.expect(!out.home && !out.solid, 'the bay is empty while the truck is out');
  t.expect(out.label !== '🚒 Climb in', 'no climb-in button with the truck away');
  t.expect(out.floats.includes('The truck is out! 🍕'), 'the chef notices the truck is out');
  await t.shot('bay-empty');
  // standing in the empty bay when the truck rolls back in: nudged out beside the cab, no wall rescue
  const back = await t.ev(() => {
    const Tk = CFG.FIRESTATION.TRUCK; T.tp(Tk.x, Tk.y, 'firestation');
    const ft = Game.fireTruck; ft.state = 'home'; ft.path = []; ft.x = CFG.FIRE_TRUCK_HOME.x; ft.y = CFG.FIRE_TRUCK_HOME.y; ft.angle = Math.PI; ft.timer = 9999; T.step(3);
    const c = CFG.FIRESTATION.CAB_IN; return { d: Math.hypot(Game.player.x - c.x, Game.player.y - c.y), floats: Game.floats.map((f) => f.text), free: FireStationExt.free(Game.player.x, Game.player.y) };
  });
  t.expect(back.d < 1 && back.free && back.floats.includes('Beep beep! 🚒'), `the truck coming home nudges the chef out beside the cab (${JSON.stringify(back)})`);
  // the truck leaving while the chef sits in the cab: out you hop
  const hop = await t.ev(() => {
    T.act(); T.step(3); const was = !!FireStationExt.st.cab;
    Game.fireTruck.state = 'away'; T.step(3);
    const r = { was, cab: !!FireStationExt.st.cab, floats: Game.floats.map((f) => f.text), free: FireStationExt.free(Game.player.x, Game.player.y) };
    Game.fireTruck.state = 'home'; Game.fireTruck.timer = 9999; T.step(2);
    return r;
  });
  t.expect(hop.was && !hop.cab && hop.free && hop.floats.includes('Off it goes! 🚒'), `the chef hops out when the truck leaves (${JSON.stringify(hop)})`);

  // ---- the stairs and the pole
  await t.ev(() => { const s = CFG.FIRESTATION.STAIRS.foot; T.tp(s.x, s.y + 2, 'firestation'); });
  t.expectEq(await t.ev(() => T.label()), '🪜 Climb the stairs', 'stairs label at the foot');
  await t.ev(() => { T.act(); T.step(5); });
  t.expect(await t.ev(() => !!FireStationExt.st.climb), 'climbing');
  t.expectEq(await t.ev(() => T.hint()), 'Up we go! 🪜', 'climbing hint');
  const up = await t.ev(() => { const n = T.until(() => FireStationExt.st.up, 400); const P = CFG.FIRESTATION.POLE, G = CFG.FIRESTATION.GALLERY; return { n, label: T.label(), hint: T.hint(), d: Math.hypot(Game.player.x - P.x, Game.player.y - G.floor) }; });
  t.expect(up.n >= 0 && up.d < 1, 'arrived up on the gallery by the pole');
  t.expectEq(up.label, '🧑‍🚒 Slide down!', 'slide label up top');
  t.expectEq(up.hint, 'Press the button to slide down the pole!', 'slide hint up top');
  await t.shot('gallery');
  await t.ev(() => { T.act(); T.step(3); });
  t.expect(await t.ev(() => !!FireStationExt.st.slide && T.hint() === 'Wheee! 🧑‍🚒'), 'sliding down the pole');
  const landed = await t.ev(() => { const n = T.until(() => !FireStationExt.st.slide && !FireStationExt.st.up, 300); const L = CFG.FIRESTATION.POLE.land; return { n, d: Math.hypot(Game.player.x - L.x, Game.player.y - L.y), slides: Game.s.firestation.slides, free: FireStationExt.free(Game.player.x, Game.player.y) }; });
  t.expect(landed.n >= 0 && landed.d < 1 && landed.free, 'landed on the mat at the foot of the pole');
  t.expectEq(landed.slides, 1, 'one slide counted');
  t.expectEq(await t.ev(() => T.hint()), 'Try on a fire helmet! ⛑️', 'helmet hint after the slide');

  // ---- the helmet wall
  await t.ev(() => { const s = CFG.FIRESTATION.HELMET_SPOT; T.tp(s.x, s.y, 'firestation'); });
  t.expectEq(await t.ev(() => T.label()), '⛑️ Try a helmet', 'helmet label');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => FireStationExt.st.helmet > 29 && Game.s.firestation.helmets === 1), 'wearing a helmet for half a minute');
  t.expectEq(await t.ev(() => T.hint()), 'Spray the target with the hose! 💦', 'hose hint next');

  // ---- the hose and the practice target
  await t.ev(() => { const s = CFG.FIRESTATION.SPRAY; T.tp(s.x, s.y, 'firestation'); });
  t.expectEq(await t.ev(() => T.label()), '💦 Spray the hose', 'hose label');
  await t.ev(() => { T.act(); T.step(40); });
  const spray = await t.ev(() => ({ spray: !!FireStationExt.st.spray, hint: T.hint(), floats: Game.floats.map((f) => f.text), spin: FireStationExt.st.targetSpin, sprays: Game.s.firestation.sprays }));
  t.expect(spray.spray && spray.hint === 'Splash! 💦' && spray.floats.includes('Splash! 💦') && spray.spin > 0, `spraying the target (${JSON.stringify(spray)})`);
  await t.shot('hose');
  t.expect(await t.ev(() => { const n = T.until(() => !FireStationExt.st.spray, 300); return n >= 0 && FireStationExt.free(Game.player.x, Game.player.y); }), 'the spray ends on free floor');
  t.expectEq(spray.sprays, 1, 'one spray counted');
  t.expectEq(await t.ev(() => T.hint()), 'Ring the bell to call the crew! 🔔', 'bell hint next');

  // ---- the bell: the crew slides down the pole, lines up, then climbs back
  await t.ev(() => { const s = CFG.FIRESTATION.BELL_SPOT; T.tp(s.x, s.y, 'firestation'); });
  t.expectEq(await t.ev(() => T.label()), '🔔 Ring the bell', 'bell label');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !!FireStationExt.st.alarm && FireStationExt.st.bellSwing > 0 && Game.s.firestation.bells === 1), 'the alarm is on');
  const lined = await t.ev(() => { const n = T.until(() => FireStationExt.st.crew.every((c) => c.state === 'line'), 1200); const L = CFG.FIRESTATION.LINE; return { n, ok: FireStationExt.st.crew.every((c, i) => Math.hypot(c.x - L[i].x, c.y - L[i].y) < 1) }; });
  t.expect(lined.n >= 0 && lined.ok, `the crew slid down and lined up (${JSON.stringify(lined)})`);
  await t.shot('crew-line');
  const backUp = await t.ev(() => { const n = T.until(() => !FireStationExt.st.alarm, 2400); const H = CFG.FIRESTATION.CREW_HOMES; return { n, ok: FireStationExt.st.crew.every((c, i) => c.state === 'up' && Math.hypot(c.x - H[i].x, c.y - H[i].y) < 1) }; });
  t.expect(backUp.n >= 0 && backUp.ok, `the crew went back up to the gallery (${JSON.stringify(backUp)})`);
  t.expectEq(await t.ev(() => T.hint()), 'Stop, drop and roll by the poster! 🔥', 'poster hint next');

  // ---- stop, drop and roll by the poster
  await t.ev(() => { const s = CFG.FIRESTATION.POSTER_SPOT; T.tp(s.x, s.y, 'firestation'); });
  t.expectEq(await t.ev(() => T.label()), '🔥 Stop, drop and roll!', 'poster label');
  await t.ev(() => { T.act(); T.step(80); });
  const roll = await t.ev(() => ({ roll: !!FireStationExt.st.roll, hint: T.hint(), label: T.label(), floats: Game.floats.map((f) => f.text) }));
  t.expect(roll.roll && roll.hint === 'Stop, drop and roll! 🔥' && roll.label === null, `rolling on the floor (${JSON.stringify(roll)})`);
  t.expect(roll.floats.includes('Roll! 🔄'), 'the roll call-out');
  await t.shot('roll');
  const rolled = await t.ev(() => { const n = T.until(() => !FireStationExt.st.roll, 300); const S = CFG.FIRESTATION.POSTER_SPOT; return { n, d: Math.hypot(Game.player.x - S.x, Game.player.y - S.y), rolls: Game.s.firestation.rolls, floats: Game.floats.map((f) => f.text), free: FireStationExt.free(Game.player.x, Game.player.y) }; });
  t.expect(rolled.n >= 0 && rolled.d < 1 && rolled.free && rolled.rolls === 1 && rolled.floats.includes('Safe! ⭐'), `up again by the poster (${JSON.stringify(rolled)})`);

  // ---- a bowl of chili for $3
  await t.ev(() => { Game.s.cash = 10; T.step(1); });
  t.expectEq(await t.ev(() => T.hint()), 'Have a bowl of chili! 🌶️', 'chili hint with cash in hand');
  const chili = await t.ev(() => { const P = CFG.FIRESTATION.PADS.chili; T.tp(P.x, P.y, 'firestation'); const n = T.until(() => Game.s.firestation.chilis > 0, 600); return { n, cash: Game.s.cash, bowl: FireStationExt.st.chili, floats: Game.floats.map((f) => f.text) }; });
  t.expect(chili.n >= 0 && chili.bowl > 0 && chili.floats.includes('Spicy! 🌶️'), `a bowl of chili (${JSON.stringify(chili)})`);
  t.expectEq(chili.cash, 7, 'the chili cost $3');
  await t.shot('chili');
  t.expectEq(await t.ev(() => T.hint()), 'Pet the station cat! 🐈', 'cat hint next');

  // ---- the station's cat
  await t.ev(() => { const C = CFG.FIRESTATION.CAT; T.tp(C.x + 30, C.y, 'firestation'); });
  t.expectEq(await t.ev(() => T.label()), '🐈 Pet the cat', 'cat label');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => FireStationExt.st.catHappy > 0 && Game.s.firestation.pets === 1 && Game.floats.some((f) => f.text === 'Purrr 💗')), 'the cat purrs');
  t.expectEq(await t.ev(() => T.hint()), 'Looking brave! ⛑️', 'the helmet hint once everything is tried');

  // ---- the sleepy Dalmatian: asleep in its basket, wakes when you come close, follows, nods off again
  const dog = await t.ev(() => {
    const d = FireStationExt.st.dog, D = CFG.FIRESTATION.DOG_HOME;
    const asleep = d.sleep && Math.hypot(d.x - D.x, d.y - D.y) < 1;
    T.tp(D.x + 70, D.y - 90, 'firestation'); T.steer(-1, 1); T.step(30); T.unsteer();   // walking up to it wakes it
    const woke = !d.sleep && Game.floats.some((f) => f.text === 'Woof! 🐶');
    T.tp(3480, 4140, 'firestation'); T.step(150);   // across the room: it trots after you
    const followed = Math.hypot(d.x - Game.player.x, d.y - Game.player.y) < 80 && d.x > D.x + 150;
    T.step(60 * 10);   // nothing happens for a while: it sits, then nods off
    const sat = d.sit, napping = d.sleep;
    T.tp(3480, 4280, 'firestation'); T.step(60);   // standing still nearby lets it sleep
    return { asleep, woke, followed, sat, napping, stillAsleep: d.sleep };
  });
  t.expect(dog.asleep && dog.woke && dog.followed && dog.sat && dog.napping && dog.stillAsleep, `the Dalmatian dozes, wakes, follows and nods off (${JSON.stringify(dog)})`);

  // the helmet and the bowl run out after a while
  t.expect(await t.ev(() => { T.step(60 * 20); return FireStationExt.st.helmet === 0 && FireStationExt.st.chili === 0; }), 'helmet and chili are gone after a while');
  t.expectEq(await t.ev(() => { T.step(1); return T.hint(); }), 'The Dalmatian loves you! 🐶', 'the quiet hint once everything is done');

  // ---- a reload or push into a wall lands back on the mat
  await t.ev(() => { const R = CFG.FIRESTATION.ROOM; T.tp(R.x0 - 10, 4250, 'firestation'); T.step(3); });
  t.expect(await t.ev(() => FireStationExt.free(Game.player.x, Game.player.y)), 'pushed into the wall: rescued onto the floor');
  t.expect(await t.ev(() => { const E = CFG.FIRESTATION.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'the rescue lands on the exit mat');
  t.expect(await t.ev(() => Game.floats.some((f) => f.text === 'Oops! Back inside')), 'the rescue says so');

  // ---- phone-size station
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.tp(3200, 4250, 'firestation'); T.step(2); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- Take-me-home from the cab, with the alarm running
  await t.ev(() => { const s = CFG.FIRESTATION.BELL_SPOT; T.tp(s.x, s.y, 'firestation'); T.act(); const c = CFG.FIRESTATION.CAB_IN; T.tp(c.x, c.y, 'firestation'); T.act(); T.step(5); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'Take-me-home leaves the station');
  t.expect(await t.ev(() => !FireStationExt.st.cab && !FireStationExt.st.alarm && FireStationExt.st.crew.every((c) => c.state === 'up')), 'the cab and the alarm are cleared by Take-me-home');
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');
  t.expectEq(await t.ev(() => FireStationExt.hint(Game)), undefined, 'no fire station hint in the pizzeria');

  // ---- out through the door: back on the sidewalk at the door spot
  await t.ev(() => { const E = CFG.FIRESTATION.EXIT; T.tp(E.x, E.y, 'firestation'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'back outside');
  t.expect(await t.ev(() => { const D = CFG.FIRESTATION.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing on the door spot');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go into the fire station', 'the door button is back');
  t.expect(await t.ev(() => Game.fireTruck.state === 'home' && !Game.obstacles().some((o) => o === CFG.FIRESTATION.TRUCK_BOX)), 'the interior\'s truck box never leaks into the town');
  await t.ev(() => { T.tp(540, 430, 'town'); T.step(1); });
};
