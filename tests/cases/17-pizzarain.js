'use strict';
// The pizza room off the bedroom: the door mat on the bedroom's east wall is free floor and reachable, the door's
// button and hint, going in (map, mat, the one-time toast), slices falling from the cloud (they stay inside the room,
// land and fade), eating three slices then being full (slices bounce off, the hint changes), going back out (eaten
// resets for the next visit, the saved total stays, also across a reload), a rescue from a wall, Take me home.
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
  t.expectEq(full.hint, "You're full! Enjoy the pizza rain 😋", 'the hint changes when full');
  t.expectEq(full.total, 3, 'saved total is 3');
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

  // ---- Take me home from inside clears everything and lands in the shop
  await t.ev(() => { T.tp(5300, 4250, 'pizzarain'); T.step(60); Game.goHome(); T.step(2); });
  const home = await t.ev(() => ({ area: Game.area, slices: PizzaRainExt.st.slices.length, eaten: PizzaRainExt.st.eaten, inside: PizzaRainExt.st.inside, total: Game.s.pizzarain.eaten, hint: PizzaRainExt.hint(Game) }));
  t.expectEq(home.area, 'town', 'Take me home lands in the shop');
  t.expect(home.slices === 0 && home.eaten === 0 && !home.inside, 'the room state is cleared');
  t.expectEq(home.total, 4, 'the total is still saved');
  t.expectEq(home.hint, undefined, 'no pizza-room hint in the shop');
};
