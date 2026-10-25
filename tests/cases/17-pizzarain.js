'use strict';
// The pizza room off the bedroom: the door mat on the bedroom's east wall is free floor and reachable, the door's
// button and hint, going in (map, mat, the one-time toast), slices falling from the cloud (they stay inside the room,
// land and fade), eating three slices then being full (slices bounce off, the hint changes), going back out (eaten
// resets for the next visit, the saved total stays, also across a reload), a rescue from a wall, the armchair (sit,
// pinned, stand up), carrying pizzas up and eating a slice at the table, the landline (order, the delivery person comes
// in, puts a pizza on the plate and leaves; a second order is refused; eat it), leaving mid-delivery, Take me home.
const path = require('path');
module.exports = async (t) => {
  // the extension is loaded by index.html once wired in; until then the case injects it itself
  const load = async () => { if (await t.ev(() => typeof PizzaRainExt === 'undefined')) await t.page.addScriptTag({ path: path.join(__dirname, '..', '..', 'js', 'pizzarain.js') }); await t.ev(() => T.step(1)); };
  await t.boot();
  await load();
  t.expect(await t.ev(() => Game.ext.indexOf(PizzaRainExt) < Game.ext.indexOf(CityExt) && Game.ext.indexOf(PizzaRainExt) < Game.ext.indexOf(UpstairsExt) && Render.ext.includes(PizzaRainExt)), 'registered ahead of the bedroom and the City in Game.ext, and in Render.ext');
  t.expect(await t.ev(() => !!CFG.AREAS.pizzarain && CFG.AREAS.pizzarain.WORLD.x0 === 5000 && CFG.AREAS.pizzarain.WORLD.y0 === 4000), 'the pizza room map sits in its reserved rectangle');

  // ---- the mat in the bedroom: free floor, and the chef can walk onto it from the middle of the room
  const mat = await t.ev(() => {
    const M = CFG.PIZZARAIN.MAT_OUT; T.tp(M.x, M.y, 'upstairs'); T.step(1);
    const solid = Game.obstacles().some((o) => Game.hitRect(M.x, M.y, 12, o));
    T.tp(M.x - 70, M.y, 'upstairs'); T.steer(1, 0); T.step(70); T.unsteer(); T.step(1);
    const d1 = Math.hypot(Game.player.x - M.x, Game.player.y - M.y);
    // and from the top of the stairs: north first, then east
    const S = CFG.UPSTAIRS.top; T.tp(S.x, S.y, 'upstairs'); T.steer(0, -1); T.until(() => Game.player.y <= M.y, 300); T.unsteer(); T.steer(1, 0); T.step(80); T.unsteer(); T.step(1);
    const d2 = Math.hypot(Game.player.x - M.x, Game.player.y - M.y);
    return { solid, d1, d2, reach: CFG.PIZZARAIN.reach };
  });
  t.expect(!mat.solid, 'the bedroom mat is on free floor');
  t.expect(mat.d1 < mat.reach, `walked onto the mat from the west (${mat.d1.toFixed(1)} px away)`);
  t.expect(mat.d2 < mat.reach, `walked onto the mat from the top of the stairs (${mat.d2.toFixed(1)} px away)`);

  // ---- the door's button and hint
  await t.ev(() => { const M = CFG.PIZZARAIN.MAT_OUT; T.tp(M.x, M.y, 'upstairs'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🍕 Go into the pizza room', 'door button on the mat');
  t.expectEq(await t.ev(() => T.hint()), 'A pizza room! 🍕', 'door hint on the mat');
  await t.shot('bedroom-door');
  t.expectEq(await t.ev(() => { const M = CFG.PIZZARAIN.MAT_OUT; T.tp(M.x - 60, M.y, 'upstairs'); T.step(2); return T.hint(); }), 'A pizza room! 🍕', 'door hint 60 px away');
  t.expect(await t.ev(() => { const M = CFG.PIZZARAIN.MAT_OUT; T.tp(M.x - 120, M.y, 'upstairs'); T.step(2); return T.hint() !== 'A pizza room! 🍕' && T.label() !== '🍕 Go into the pizza room'; }), 'no door hint or button 120 px away');
  // not while napping, drawing or reading the catalog
  const busy = await t.ev(() => {
    const M = CFG.PIZZARAIN.MAT_OUT; T.tp(M.x, M.y, 'upstairs'); const st = UpstairsExt.st, out = [];
    st.nap = { phase: 'sleep', t: 0 }; out.push(T.label(), PizzaRainExt.hint(Game)); st.nap = null;
    st.draw.on = true; out.push(T.label(), PizzaRainExt.hint(Game)); st.draw.on = false;
    st.cat.on = true; out.push(T.label(), PizzaRainExt.hint(Game)); st.cat.on = false;
    return out;
  });
  t.expect(!busy.some((v) => v === '🍕 Go into the pizza room' || (v && v.text === 'A pizza room! 🍕')), `door button and hint stay away while the bedroom is busy (${JSON.stringify(busy)})`);

  // ---- go in
  await t.ev(() => { const M = CFG.PIZZARAIN.MAT_OUT; T.tp(M.x, M.y, 'upstairs'); T.step(2); T.act(); T.step(2); });
  const inside = await t.ev(() => ({ area: Game.area, d: Math.hypot(Game.player.x - CFG.PIZZARAIN.EXIT.x, Game.player.y - CFG.PIZZARAIN.EXIT.y), hint: T.hint(), toasts: T.toasts.filter((m) => m === "🍕 It's raining pizza!").length, visits: Game.s.pizzarain.visits, label: T.label() }));
  t.expectEq(inside.area, 'pizzarain', 'in the pizza room');
  t.expect(inside.d < 1, 'standing on the exit mat');
  t.expectEq(inside.hint, 'Catch the falling pizza! 🍕', 'catch hint inside');
  t.expectEq(inside.toasts, 1, 'the pizza-rain toast once');
  t.expectEq(inside.visits, 1, 'one visit counted');
  t.expectEq(inside.label, '🚪 Back to the bedroom', 'exit button on the mat');

  // ---- the rain: slices appear, stay inside the room, land and fade
  const rain = await t.ev(() => {
    const st = PizzaRainExt.st, R = CFG.PIZZARAIN.ROOM, W = CFG.PIZZARAIN.WORLD;
    T.tp(5100, 4200, 'pizzarain');   // out of the rain's way, by the west wall
    T.step(180);
    const n1 = st.slices.length, spawned1 = st.spawned;
    let outside = 0, maxN = 0;
    for (let i = 0; i < 600; i++) { Game.update(1 / 60); maxN = Math.max(maxN, st.slices.length); for (const s of st.slices) { const sy = s.gy - s.h; if (s.x < R.x0 || s.x > R.x1 || s.gy < R.y0 || s.gy > R.y1 || sy < W.y0 || sy > R.y1) outside++; } }
    return { n1, spawned1, spawned: st.spawned, landed: st.landed, faded: st.faded, maxN, outside, eaten: st.eaten, max: CFG.PIZZARAIN.rain.max };
  });
  t.expect(rain.n1 >= 3 && rain.spawned1 >= 4, `slices fall after 3 s (${rain.n1} in the air, ${rain.spawned1} spawned)`);
  t.expect(rain.spawned > rain.spawned1 + 10, `the rain keeps coming (${rain.spawned} spawned after 13 s)`);
  t.expect(rain.landed > 5 && rain.faded > 3, `slices land (${rain.landed}) and fade away (${rain.faded})`);
  t.expect(rain.maxN <= rain.max, `never more than ${rain.max} slices at once (${rain.maxN})`);
  t.expectEq(rain.outside, 0, 'every slice stays inside the room');
  t.expectEq(rain.eaten, 0, 'nothing eaten while standing out of the rain');
  await t.ev(() => { T.tp(5300, 4250, 'pizzarain'); T.step(40); });
  await t.shot('room');

  // ---- eating: a slice dropped right over the chef is caught when it comes low enough
  const eat = await t.ev(() => {
    const st = PizzaRainExt.st, p = Game.player; T.tp(5300, 4250, 'pizzarain');
    PizzaRainExt.resetVisit(); st.inside = true; st.spawnT = 99; Game.s.pizzarain.eaten = 0;   // the random rain may already have fed the chef a slice while posing: start the count over
    const s = PizzaRainExt.spawn(p.x, p.y, 160); s.vx = 0;
    const high = T.until(() => s.h <= CFG.PIZZARAIN.catchZone.h + 2 || st.eaten > 0, 300);
    const eatenEarly = st.eaten;
    const n = T.until(() => st.eaten === 1, 120);
    return { high, eatenEarly, n, eaten: st.eaten, total: Game.s.pizzarain.eaten, float: Game.floats.some((f) => f.text === 'Mmm! 🍕'), chew: st.chew, sparkle: Game.fx.some((f) => f.kind === 'sparkle'), crumbs: st.crumbs.length, gone: !st.slices.includes(s) };
  });
  t.expect(eat.high >= 0 && eat.eatenEarly === 0, 'a slice high over the chef is not eaten yet');
  t.expect(eat.n >= 0 && eat.eaten === 1 && eat.gone, 'the slice is eaten once it comes down to the chef');
  t.expectEq(eat.total, 1, 'the saved total counts it');
  t.expect(eat.float && eat.sparkle && eat.crumbs > 0 && eat.chew > 0, 'Mmm float, sparkle, crumbs and a chew');
  await t.shot('eating');
  // a slice lying on the floor is eaten by walking over it
  const floor = await t.ev(() => {
    const st = PizzaRainExt.st, p = Game.player; st.slices.length = 0;
    const s = PizzaRainExt.spawn(p.x + 60, p.y, 1); s.vx = 0; T.until(() => s.state === 'floor', 200);
    T.steer(1, 0); const n = T.until(() => st.eaten === 2, 120); T.unsteer();
    return { n, eaten: st.eaten, full: st.full };
  });
  t.expect(floor.n >= 0 && floor.eaten === 2 && !floor.full, 'walked over a slice on the floor and ate it');
  // the third slice fills the chef up
  const full = await t.ev(() => {
    const st = PizzaRainExt.st, p = Game.player; st.slices.length = 0; Game.floats.length = 0;
    const s = PizzaRainExt.spawn(p.x, p.y, 50); s.vx = 0; const n = T.until(() => st.eaten === 3, 120); T.step(30);
    return { n, eaten: st.eaten, full: st.full, float: Game.floats.some((f) => f.text === "I'm full! 😋"), hint: T.hint(), total: Game.s.pizzarain.eaten };
  });
  t.expect(full.n >= 0 && full.eaten === 3 && full.full, 'full after the third slice');
  t.expect(full.float, "I'm full float");
  t.expectEq(full.hint, "You're full! The cloud will rain again next visit 😋", 'the hint changes when full');
  t.expectEq(full.total, 3, 'saved total is 3');
  // full: the cloud stops raining (what is in the air still lands and fades)
  const stopped = await t.ev(() => { const st = PizzaRainExt.st, before = st.spawned; T.step(300); return { before, after: st.spawned, left: st.slices.length }; });
  t.expect(stopped.after === stopped.before && stopped.left === 0, `the rain stops once full (${stopped.before} → ${stopped.after} spawned, ${stopped.left} left)`);
  await t.shot('full');
  // full: more slices bounce off and are not eaten, one burp
  const bounce = await t.ev(() => {
    const st = PizzaRainExt.st, p = Game.player; st.slices.length = 0; Game.floats.length = 0;
    const a = PizzaRainExt.spawn(p.x, p.y, 50); a.vx = 0; T.step(10); const burps = Game.floats.filter((f) => f.text === 'Burp! 😅').length; T.step(80);
    const b = PizzaRainExt.spawn(p.x, p.y, 50); b.vx = 0; T.step(10); const burps2 = Game.floats.filter((f) => f.text === 'Burp! 😅' && f.t < 0.2).length; T.step(80);
    const c = PizzaRainExt.spawn(p.x + 60, p.y, 1); c.vx = 0; T.until(() => c.state === 'floor', 200); T.steer(1, 0); T.step(60); T.unsteer();
    return { eaten: st.eaten, hitA: a.hit, hitB: b.hit, burps, burps2, still: st.slices.length, cOnFloor: st.slices.includes(c), total: Game.s.pizzarain.eaten };
  });
  t.expectEq(bounce.eaten, 3, 'no more slices eaten when full');
  t.expect(bounce.hitA && bounce.hitB, 'falling slices bounce off the full chef');
  t.expectEq(bounce.burps, 1, 'one burp float');
  t.expectEq(bounce.burps2, 0, 'no second burp');
  t.expect(bounce.cOnFloor, 'a slice on the floor stays there when the chef is full');
  t.expectEq(bounce.total, 3, 'the total stays 3');

  // ---- phone-size room
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.tp(5300, 4250, 'pizzarain'); PizzaRainExt.st.spawnT = 0; T.step(120); });
  await t.shot('room-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(2); });

  // ---- back to the bedroom: on the mat, the visit's count reset, the total kept; a second visit gives three more
  await t.ev(() => { const E = CFG.PIZZARAIN.EXIT; T.tp(E.x, E.y, 'pizzarain'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Back to the bedroom', 'exit button on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  const out = await t.ev(() => ({ area: Game.area, d: Math.hypot(Game.player.x - CFG.PIZZARAIN.MAT_OUT.x, Game.player.y - CFG.PIZZARAIN.MAT_OUT.y), eaten: PizzaRainExt.st.eaten, full: PizzaRainExt.st.full, slices: PizzaRainExt.st.slices.length, total: Game.s.pizzarain.eaten, hint: T.hint() }));
  t.expectEq(out.area, 'upstairs', 'back in the bedroom');
  t.expect(out.d < 1, 'standing on the bedroom mat');
  t.expect(out.eaten === 0 && !out.full && out.slices === 0, 'the visit count and the slices are cleared');
  t.expectEq(out.total, 3, 'the saved total stays');
  t.expectEq(out.hint, 'A pizza room! 🍕', 'the door hint again on the mat');
  const again = await t.ev(() => {
    T.act(); T.step(2); const st = PizzaRainExt.st, p = Game.player; st.slices.length = 0; st.spawnT = 99;
    const s = PizzaRainExt.spawn(p.x, p.y, 40); s.vx = 0; T.until(() => st.eaten === 1, 120);
    return { area: Game.area, eaten: st.eaten, total: Game.s.pizzarain.eaten, visits: Game.s.pizzarain.visits, toasts: T.toasts.filter((m) => m === "🍕 It's raining pizza!").length, hint: T.hint() };
  });
  t.expectEq(again.area, 'pizzarain', 'second visit');
  t.expect(again.eaten === 1 && again.total === 4 && again.visits === 2, `three more on the next visit (${JSON.stringify(again)})`);
  t.expectEq(again.toasts, 1, 'the toast is not repeated');
  t.expectEq(again.hint, 'Catch the falling pizza! 🍕', 'catch hint again');

  // ---- reload inside the room: the total is kept, the chef is on the floor, the room's own count starts over
  await t.ev(() => Game.save());
  await t.reload();
  await load();
  // (until index.html loads the file, the map is unknown at boot and the saved spot is not restored: go there by hand)
  const kept = await t.ev(() => { const pos = Game.s.pos; if (Game.area !== 'pizzarain' && pos && pos.area === 'pizzarain') T.tp(pos.x, pos.y, 'pizzarain'); T.step(3); return { posArea: pos && pos.area, area: Game.area, total: Game.s.pizzarain.eaten, visits: Game.s.pizzarain.visits, seen: Game.s.pizzarain.seen, eaten: PizzaRainExt.st.eaten, free: PizzaRainExt.roomFree(Game.player.x, Game.player.y) }; });
  t.expectEq(kept.posArea, 'pizzarain', 'the save remembers the pizza room');
  t.expectEq(kept.area, 'pizzarain', 'back inside the room after the reload');
  t.expect(kept.total === 4 && kept.visits === 2 && kept.seen, 'the saved totals survive a reload');
  t.expect(kept.eaten === 0 && kept.free, 'fresh count after the reload, chef on the floor');

  // ---- a push into the wall is rescued onto the exit mat
  const rescued = await t.ev(() => { Game.player.x = 5012; Game.player.y = 4200; T.step(3); const E = CFG.PIZZARAIN.EXIT; return { d: Math.hypot(Game.player.x - E.x, Game.player.y - E.y), free: PizzaRainExt.roomFree(Game.player.x, Game.player.y), float: Game.floats.some((f) => f.text === 'Oops! Back inside') }; });
  t.expect(rescued.d < 1 && rescued.free && rescued.float, 'rescued from the wall onto the exit mat');
  const rescued2 = await t.ev(() => { const B = CFG.PIZZARAIN.CHAIR.block; Game.player.x = B[0] + B[2] / 2; Game.player.y = B[1] + B[3] / 2; T.step(3); return PizzaRainExt.roomFree(Game.player.x, Game.player.y); });
  t.expect(rescued2, 'rescued from inside the armchair');

  // both screen sizes of the same moment
  const both = async (name) => {
    await t.shot(name);
    await t.page.setViewportSize({ width: 390, height: 844 }); await t.ev(() => { Render.resize(); Game.cameraSnap = true; });
    await t.shot(name + '-phone');
    await t.page.setViewportSize({ width: 1100, height: 720 }); await t.ev(() => { Render.resize(); Game.cameraSnap = true; });
  };

  // ---- the layout: the stool, the spot in front of the armchair, the phone spot and the delivery path are free floor
  const layout = await t.ev(() => {
    const C = CFG.PIZZARAIN, free = (x, y) => PizzaRainExt.roomFree(x, y) && !Game.obstacles().some((o) => Game.hitRect(x, y, 12, o));
    const pts = { seat: C.TABLE.seat, stand: C.CHAIR.stand, phone: C.PHONE.spot, server: C.TABLE.server };
    const bad = Object.keys(pts).filter((k) => !free(pts[k].x, pts[k].y));
    const P = C.DELIVERY.path; let pathBad = 0;
    for (let i = 1; i < P.length - 1; i++) for (let k = 0; k <= 20; k++) { const x = U.lerp(P[i][0], P[i + 1][0], k / 20), y = U.lerp(P[i][1], P[i + 1][1], k / 20); if (!PizzaRainExt.roomFree(x, y)) pathBad++; }
    // the chef can walk from the exit mat to the phone and to the stool
    T.tp(C.EXIT.x, C.EXIT.y, 'pizzarain'); T.steer(0.25, -1); T.until(() => Game.player.y <= C.PHONE.spot.y, 200); T.unsteer(); T.step(1);
    const toPhone = Math.hypot(Game.player.x - C.PHONE.spot.x, Game.player.y - C.PHONE.spot.y);
    T.tp(5300, C.TABLE.seat.y, 'pizzarain'); T.steer(1, 0); T.until(() => Game.player.x >= C.TABLE.seat.x, 200); T.unsteer(); T.step(1);
    const toSeat = Math.hypot(Game.player.x - C.TABLE.seat.x, Game.player.y - C.TABLE.seat.y);
    return { bad, pathBad, toPhone, toSeat };
  });
  t.expectEq(layout.bad.join(','), '', 'stool, armchair front, phone spot and server spot are free floor');
  t.expectEq(layout.pathBad, 0, 'the delivery path crosses only free floor');
  t.expect(layout.toPhone < 30, `walked from the mat to the phone (${layout.toPhone.toFixed(1)} px)`);
  t.expect(layout.toSeat < 8, `walked to the stool by the table (${layout.toSeat.toFixed(1)} px)`);

  // ---- the armchair: sit (also when full), pinned facing into the room, a comfy sigh; stand up
  const chair = await t.ev(() => {
    const C = CFG.PIZZARAIN.CHAIR, st = PizzaRainExt.st, p = Game.player;
    T.tp(C.stand.x, C.stand.y, 'pizzarain'); st.full = true; T.step(2);
    const label = T.label(), hint = T.hint();
    Game.floats.length = 0; T.act(); T.step(2);
    const sat = { seat: st.seat, d: Math.hypot(p.x - C.sit.x, p.y - C.sit.y), facing: p.facing, sigh: Game.floats.some((f) => f.text === 'Ahh 😌'), label: T.label(), hint: T.hint(), sits: Game.s.pizzarain.sits };
    T.steer(-1, 0.6); T.step(60); T.unsteer(); T.steer(1, -1); T.step(40); T.unsteer(); T.step(1);
    return { label, hint, sat, pinned: Math.hypot(p.x - C.sit.x, p.y - C.sit.y) < 0.5 && st.seat === 'chair' && !p.moving && p.facing === 1, rescued: Game.floats.some((f) => f.text === 'Oops! Back inside') };
  });
  t.expectEq(chair.label, '🪑 Sit in the armchair', 'sit button by the armchair (even when full)');
  t.expectEq(chair.hint, 'Sit in the comfy chair 🪑', 'chair hint by the armchair');
  t.expect(chair.sat.seat === 'chair' && chair.sat.d < 0.5 && chair.sat.facing === 1, 'sitting in the armchair, facing into the room');
  t.expect(chair.sat.sigh, 'the comfy sigh float');
  t.expectEq(chair.sat.label, '🚶 Stand up', 'stand-up button while sitting');
  t.expectEq(chair.sat.hint, 'Ahh, so comfy 😌', 'comfy hint while sitting');
  t.expect(chair.sat.sits >= 1, 'sits are counted');
  t.expect(chair.pinned && !chair.rescued, 'pinned in the chair while steering (and never "rescued" out of it)');
  await both('armchair');
  const stood = await t.ev(() => { T.act(); T.step(2); const p = Game.player, x0 = p.x; T.steer(1, 0); T.step(20); T.unsteer(); return { seat: PizzaRainExt.st.seat, free: PizzaRainExt.roomFree(x0, p.y), moved: p.x - x0, label: T.label() }; });
  t.expect(stood.seat === null && stood.free && stood.moved > 10, `stood up onto free floor and walks again (${JSON.stringify(stood)})`);

  // ---- carry pizzas up from the shop and eat a slice at the table
  await t.ev(() => { const E = CFG.PIZZARAIN.EXIT; T.tp(E.x, E.y, 'pizzarain'); T.step(2); T.act(); T.step(2); Game.player.carry = 2; T.act(); T.step(2); });
  const carryIn = await t.ev(() => ({ area: Game.area, carry: Game.player.carry, hint: T.hint(), target: Game.hint && Game.hint.target, seat: CFG.PIZZARAIN.TABLE.seat, label: T.label() }));
  t.expect(carryIn.area === 'pizzarain' && carryIn.carry === 2, 'came in carrying two pizzas');
  t.expectEq(carryIn.hint, 'Eat a slice at the table 🍽️', 'the table hint when carrying');
  t.expect(carryIn.target && carryIn.target.x === carryIn.seat.x && carryIn.target.y === carryIn.seat.y, 'the hint points at the stool');
  const meal = await t.ev(() => {
    const C = CFG.PIZZARAIN, st = PizzaRainExt.st, p = Game.player;
    T.tp(C.TABLE.seat.x - 20, C.TABLE.seat.y - 10, 'pizzarain'); T.step(2);
    const label = T.label(); Game.floats.length = 0; T.act();
    const now = { carry: p.carry, plate: st.plate && st.plate.kind, meal: !!st.meal, seat: st.seat, d: Math.hypot(p.x - C.TABLE.seat.x, p.y - C.TABLE.seat.y), facing: p.facing, label: T.label(), hint: T.hint(), left: PizzaRainExt.plateLeft() };
    T.steer(-1, -1); T.step(50); T.unsteer();
    now.pinned = Math.hypot(p.x - C.TABLE.seat.x, p.y - C.TABLE.seat.y) < 0.5; now.bites = st.meal ? st.meal.bites : -1; now.left2 = PizzaRainExt.plateLeft();
    return { label, now };
  });
  t.expectEq(meal.label, '🍽️ Eat a slice at the table', 'eat-a-slice button at the table');
  t.expect(meal.now.carry === 1 && meal.now.plate === 'slice' && meal.now.meal && meal.now.left === 1, `a pizza comes off the stack and a slice lands on the plate (${JSON.stringify(meal.now)})`);
  t.expect(meal.now.seat === 'table' && meal.now.d < 0.5 && meal.now.facing === 1 && meal.now.pinned, 'sitting on the stool facing the table, pinned');
  t.expect(meal.now.label === null && meal.now.hint === 'Yum yum! 😋', 'no button and a yum hint while eating');
  t.expect(meal.now.bites >= 1 && meal.now.left2 < 1, `bite by bite (${meal.now.bites} bites, ${meal.now.left2} left)`);
  await both('table-eating');
  const ate = await t.ev(() => {
    const st = PizzaRainExt.st; let noms = 0, seen = new Set();
    const n = T.until(() => { for (const f of Game.floats) if (f.text === 'nom' && !seen.has(f)) { seen.add(f); noms++; } return !st.meal; }, 400);
    return { n, noms, plate: st.plate, seat: st.seat, yum: Game.floats.some((f) => f.text === 'Delicious! 😋'), carry: Game.player.carry, meals: Game.s.pizzarain.meals, crumbs: st.crumbs.length, label: T.label(), free: PizzaRainExt.roomFree(Game.player.x, Game.player.y) };
  });
  t.expect(ate.n >= 0 && ate.plate === null && ate.seat === null && ate.free, `eaten up: the plate is empty and the chef is free (${JSON.stringify(ate)})`);
  t.expect(ate.noms >= 1 && ate.yum, `nom floats and a Delicious float (${ate.noms} noms)`);
  t.expect(ate.carry === 1 && ate.meals === 1, 'one pizza left on the stack, one meal counted');
  t.expectEq(ate.label, '🍽️ Eat a slice at the table', 'another slice can be eaten from the stack');
  // keep the last pizza for the trip back down
  await t.ev(() => { Game.player.carry = 0; T.step(2); });

  // ---- the landline: order, a delivery person brings a whole pizza to the plate and leaves; then eat it
  const call = await t.ev(() => {
    const C = CFG.PIZZARAIN, st = PizzaRainExt.st, p = Game.player;
    T.tp(C.PHONE.spot.x, C.PHONE.spot.y, 'pizzarain'); T.step(2);
    const label = T.label(), hint = T.hint();
    T.act(); const d = st.del, phase = d && d.phase, orders = Game.s.pizzarain.orders, facing = p.facing;
    T.step(50);
    const lifted = PizzaRainExt.receiverLifted(Game), hint2 = T.hint();
    Game.floats.length = 0; T.act();
    const twice = { same: st.del === d, orders: Game.s.pizzarain.orders, float: Game.floats.some((f) => f.text === 'Your pizza is on its way! 🍕') };
    return { label, hint, phase, orders, facing, lifted, hint2, twice };
  });
  t.expectEq(call.label, '📞 Order a pizza', 'order button at the phone');
  t.expectEq(call.hint, 'Call for a pizza! 📞', 'phone hint at the phone');
  t.expect(call.phase === 'call' && call.orders === 1 && call.facing === -1, 'the call starts (turned to the phone, one order)');
  t.expect(call.lifted, 'the receiver is lifted during the call');
  t.expectEq(call.hint2, 'Your pizza is on its way! 🍕', 'on-its-way hint');
  t.expect(call.twice.same && call.twice.orders === 1 && call.twice.float, 'a second order is refused while one is on its way');
  await t.shot('phone-call');
  // the chef walks off and sits in the armchair; the delivery still comes
  const arrive = await t.ev(() => {
    const C = CFG.PIZZARAIN, st = PizzaRainExt.st, d = st.del;
    T.steer(1, 1); T.step(40); T.unsteer();
    T.tp(C.CHAIR.stand.x, C.CHAIR.stand.y, 'pizzarain'); T.step(1); T.act();
    const sat = st.seat;
    const n = T.until(() => d.phase === 'in' && d.wp >= 2, 600);
    return { sat, n, door: st.door, x: d.x, y: d.y, phase: d.phase, hung: !PizzaRainExt.receiverLifted(Game) };
  });
  t.expect(arrive.sat === 'chair', 'sitting in the armchair while waiting');
  t.expect(arrive.n >= 0 && arrive.door > 0.5 && arrive.hung, `the delivery person comes in through the open door (${JSON.stringify(arrive)})`);
  await both('delivery-arriving');
  const served = await t.ev(() => {
    const C = CFG.PIZZARAIN, st = PizzaRainExt.st, d = st.del; let off = 0;
    const n = T.until(() => { if (d.phase === 'in' && !PizzaRainExt.roomFree(d.x, d.y)) off++; return d.placed; }, 900);
    return { n, off, phase: d.phase, dServer: Math.hypot(d.x - C.TABLE.server.x, d.y - C.TABLE.server.y), plate: st.plate && st.plate.kind, seat: st.seat, hint: T.hint() };
  });
  t.expect(served.n >= 0 && served.plate === 'pizza', `a whole pizza is put on the plate (${JSON.stringify(served)})`);
  t.expect(served.dServer < 1 && served.off === 0, 'the delivery person walked on free floor to the table');
  t.expect(served.seat === 'chair', 'the chef stayed in the armchair the whole time');
  t.expectEq(served.hint, 'Your pizza is here! 🍽️', 'pizza-is-here hint, even from the armchair');
  await t.ev(() => T.step(20));
  await t.shot('delivery-serving');
  const gone = await t.ev(() => {
    const st = PizzaRainExt.st, d = st.del; let waved = false, said = false;
    const n = T.until(() => { if (d.phase === 'wave') waved = true; return !st.del; }, 1500);
    T.act(); T.step(2);   // stand up
    return { n, waved, door: st.door, plate: st.plate && st.plate.kind, delivered: st.delivered, hint: T.hint(), seat: st.seat };
  });
  t.expect(gone.n >= 0 && gone.waved && gone.door === 0, `the delivery person waves, walks out and the door closes (${JSON.stringify(gone)})`);
  t.expect(gone.plate === 'pizza' && gone.delivered >= 1 && gone.seat === null, 'the pizza waits on the plate');
  t.expectEq(gone.hint, 'Your pizza is here! 🍽️', 'pizza-is-here hint');
  await t.ev(() => { T.tp(CFG.PIZZARAIN.TABLE.x - 70, CFG.PIZZARAIN.TABLE.y - 50, 'pizzarain'); T.step(2); });
  await both('pizza-plate');
  const already = await t.ev(() => {
    const C = CFG.PIZZARAIN, st = PizzaRainExt.st;
    T.tp(C.PHONE.spot.x, C.PHONE.spot.y, 'pizzarain'); T.step(2); Game.floats.length = 0; T.act();
    return { del: st.del, orders: Game.s.pizzarain.orders, float: Game.floats.some((f) => f.text === 'Your pizza is already here! 🍕') };
  });
  t.expect(already.del === null && already.orders === 1 && already.float, 'ordering with a pizza on the plate says it is already here');
  const eatPizza = await t.ev(() => {
    const C = CFG.PIZZARAIN, st = PizzaRainExt.st;
    T.tp(C.TABLE.x, C.TABLE.y - 40, 'pizzarain'); T.step(2);
    const label = T.label(); T.act(); const kind = st.meal && st.meal.kind, seat = st.seat; T.step(110);
    return { label, kind, seat, carry: Game.player.carry, left: PizzaRainExt.plateLeft() };
  });
  t.expectEq(eatPizza.label, '🍽️ Eat the pizza', 'eat-the-pizza button at the table');
  t.expect(eatPizza.kind === 'pizza' && eatPizza.seat === 'table' && eatPizza.carry === 0, 'eating the delivered pizza at the table');
  t.expect(eatPizza.left > 0 && eatPizza.left < 1, `the pizza gets smaller (${eatPizza.left} left)`);
  await both('pizza-eating');
  const pizzaDone = await t.ev(() => { const st = PizzaRainExt.st; const n = T.until(() => !st.meal, 400); return { n, plate: st.plate, seat: st.seat, yum: Game.floats.some((f) => f.text === 'Delicious! 😋'), meals: Game.s.pizzarain.meals }; });
  t.expect(pizzaDone.n >= 0 && pizzaDone.plate === null && pizzaDone.seat === null && pizzaDone.yum && pizzaDone.meals === 2, 'the pizza is eaten up, the plate is empty');

  // ---- leaving mid-delivery: the pizza waits on the plate, nothing is left half done
  const midway = await t.ev(() => {
    const C = CFG.PIZZARAIN, st = PizzaRainExt.st;
    T.tp(C.PHONE.spot.x, C.PHONE.spot.y, 'pizzarain'); T.step(2); T.act();
    T.until(() => st.del && st.del.phase === 'in' && st.del.wp >= 2, 600);
    T.tp(C.EXIT.x, C.EXIT.y, 'pizzarain'); T.step(1); const label = T.label(); T.act(); T.step(30);
    const out = { label, area: Game.area, del: st.del, door: st.door, plate: st.plate && st.plate.kind };
    T.act(); T.step(30);
    const back = { area: Game.area, del: st.del, plate: st.plate && st.plate.kind, hint: T.hint() };
    // leaving in the middle of the call works too
    st.plate = null; T.tp(C.PHONE.spot.x, C.PHONE.spot.y, 'pizzarain'); T.step(2); T.act(); T.step(10);
    const phase = st.del && st.del.phase;
    T.tp(C.EXIT.x, C.EXIT.y, 'pizzarain'); T.step(1); T.act(); T.step(10);
    const out2 = { phase, area: Game.area, del: st.del, plate: st.plate && st.plate.kind };
    T.act(); T.step(2);
    return { out, back, out2 };
  });
  t.expectEq(midway.out.label, '🚪 Back to the bedroom', 'exit button mid-delivery');
  t.expect(midway.out.area === 'upstairs' && midway.out.del === null && midway.out.door === 0 && midway.out.plate === 'pizza', `leaving mid-delivery completes it at once (${JSON.stringify(midway.out)})`);
  t.expect(midway.back.area === 'pizzarain' && midway.back.del === null && midway.back.plate === 'pizza' && midway.back.hint === 'Your pizza is here! 🍽️', 'back inside: the pizza waits on the plate, nobody walking about');
  t.expect(midway.out2.phase === 'call' && midway.out2.del === null && midway.out2.plate === 'pizza', 'leaving during the call works the same');

  // ---- Take me home from inside clears everything and lands in the shop
  // (with a pizza on the plate, another on its way and the chef in the armchair)
  await t.ev(() => {
    const C = CFG.PIZZARAIN, st = PizzaRainExt.st; T.tp(5300, 4250, 'pizzarain'); T.step(60);
    st.plate = null; T.tp(C.PHONE.spot.x, C.PHONE.spot.y, 'pizzarain'); T.step(2); T.act(); T.until(() => st.del && st.del.phase === 'in', 600);
    T.tp(C.CHAIR.stand.x, C.CHAIR.stand.y, 'pizzarain'); T.step(1); T.act(); T.step(2);
    Game.goHome(); T.step(2);
  });
  const home = await t.ev(() => { const st = PizzaRainExt.st; return { area: Game.area, slices: st.slices.length, eaten: st.eaten, inside: st.inside, total: Game.s.pizzarain.eaten, hint: PizzaRainExt.hint(Game), del: st.del, plate: st.plate, seat: st.seat, meal: st.meal, door: st.door, label: T.label() }; });
  t.expectEq(home.area, 'town', 'Take me home lands in the shop');
  t.expect(home.slices === 0 && home.eaten === 0 && !home.inside, 'the room state is cleared');
  t.expect(home.del === null && home.plate === null && home.seat === null && home.meal === null && home.door === 0, `the delivery, plate, seat and meal are cleared (${JSON.stringify(home)})`);
  t.expect(home.label !== '🚶 Stand up', 'no stand-up button left over in the shop');
  t.expect(home.total >= 4, `the total is still saved (${home.total}: the rain may feed the chef while the delivery comes)`);
  t.expectEq(home.hint, undefined, 'no pizza-room hint in the shop');
};
