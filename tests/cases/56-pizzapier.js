'use strict';
// Pizza Pier, the park itself (js/pizzapier.js): arriving on Line 2 lands on the terminal platform (one welcome toast);
// the boardwalk is walkable end to end; '🚇 Ride home' starts the ride back to the City; the Ferris wheel takes the chef
// all the way round (the camera follows, "What a view!" at the top) and lets them off at the bottom; helping build the
// Pizza Drop adds a piece (saved) and ends in a test run; the three food stands; the pizza coin by the sandcastle is
// reachable; rescues from walls and the wheel; Take-me-home in the middle of a ride.
const fs = require('fs');
const path = require('path');
module.exports = async (t) => {
  // until the coordinator wires js/pizzapier.js into index.html, serve the page with it added
  const root = path.resolve(__dirname, '..', '..');
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    if (!body.includes('js/pier-layout.js') && fs.existsSync(path.join(root, 'js', 'pier-layout.js'))) body = body.replace('<script src="js/main.js"></script>', '<script src="js/pier-layout.js"></script>\n  <script src="js/main.js"></script>');
    // the park's own file, then the other parts of the pier when they exist
    for (const f of ['pizzapier.js', 'pier-coaster.js', 'pier-bumper.js', 'pier-games.js']) {
      if (!body.includes('js/' + f) && fs.existsSync(path.join(root, 'js', f))) body = body.replace('<script src="js/main.js"></script>', `<script src="js/${f}"></script>\n  <script src="js/main.js"></script>`);
    }
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();

  // ---- registered, ahead of the City; a fresh save
  const reg = await t.ev(() => ({
    ok: typeof PizzaPierExt !== 'undefined' && Game.ext.includes(PizzaPierExt) && Render.ext.includes(PizzaPierExt),
    order: Game.ext.indexOf(PizzaPierExt) < Game.ext.indexOf(CityExt),
    save: Game.s.pizzapier && Game.s.pizzapier.seen === false && Game.s.pizzapier.built === CFG.PIERPARK.BUILD.START,
    paint: !!PizzaPierExt.paint.pizzapier,
  }));
  t.expect(reg.ok && reg.paint, 'the park extension is registered and paints the pizzapier map');
  t.expect(reg.order, 'the park answers before the City');
  t.expect(reg.save, 'a fresh save: not seen yet, the Pizza Drop at its starting height');

  // ---- arriving on Line 2: on the platform at ARRIVE, one welcome toast
  const arr = await t.ev(() => {
    T.tp(5400, 600, 'city');
    Game.startTravel('pizzapier', 'pierline', 1);
    T.until(() => !Game.travel && Game.area === 'pizzapier', 600); T.step(2);
    const A = CFG.PIER.ARRIVE, p = Game.player;
    return { area: Game.area, d: Math.hypot(p.x - A.x, p.y - A.y), toasts: T.toasts.filter((m) => m === '🎡 Welcome to Pizza Pier!').length, seen: Game.s.pizzapier.seen, hint: T.hint() };
  });
  t.expectEq(arr.area, 'pizzapier', 'arrived at the pier');
  t.expect(arr.d < 2, `standing at the arrival spot (${arr.d})`);
  t.expectEq(arr.toasts, 1, 'the welcome toast once');
  t.expect(arr.seen, 'the pier counts as seen');
  t.expect(!!arr.hint, `a hint at the arrival (${arr.hint})`);
  await t.shot('arrive');
  const again = await t.ev(() => {
    Game.startTravel('pizzapier', 'pierline', 1); T.until(() => !Game.travel, 600); T.step(2);
    return T.toasts.filter((m) => m === '🎡 Welcome to Pizza Pier!').length;
  });
  t.expectEq(again, 1, 'no second welcome toast on the next visit');

  // ---- the arrival spot is free, and a straight walk south goes through the arch onto the boardwalk
  const gate = await t.ev(() => {
    const A = CFG.PIER.ARRIVE; T.tp(A.x, A.y, 'pizzapier'); T.steer(0, 1); T.step(40); T.unsteer();
    return { y: Game.player.y, x: Game.player.x };
  });
  t.expect(gate.y > CFG_BW_Y0(), `walked from the platform through the arch onto the boardwalk (${JSON.stringify(gate)})`);

  // ---- the boardwalk is walkable end to end, both ways, at every lane
  const walk = await t.ev(() => {
    const W = CFG.PIER.WORLD, BW = CFG.PIER.BOARDWALK, out = [];
    for (const y of [BW.y0 + 30, (BW.y0 + BW.y1) / 2, BW.y1 - 26]) {
      T.tp(W.x0 + 30, y, 'pizzapier'); T.steer(1, 0); T.until(() => Game.player.x > W.x1 - 40, 1200); T.unsteer();
      const east = Game.player.x; T.steer(-1, 0); T.until(() => Game.player.x < W.x0 + 40, 1200); T.unsteer();
      out.push({ y, east: Math.round(east), west: Math.round(Game.player.x), dy: Math.abs(Game.player.y - y) });
    }
    return out;
  });
  for (const w of walk) t.expect(w.east > 10340 && w.west < 8060 && w.dy < 1, `boardwalk lane y=${w.y} walkable end to end (${JSON.stringify(w)})`);

  // ---- the boardwalk itself has nothing solid on it
  const clear = await t.ev(() => { const BW = CFG.PIER.BOARDWALK; return Game.obstacles().filter((o) => o.y < BW.y1 - 12 && o.y + o.h > BW.y0 + 12 && o.x < 10400 && o.x + o.w > 8000).length; });
  t.expectEq(clear, 0, 'nothing solid across the boardwalk');

  // ---- the stairs lead down to the beach; the sea is not walkable
  const beach = await t.ev(() => {
    const P = CFG.PIERPARK, x = P.STAIRS[1]; T.tp(x, 5980, 'pizzapier'); T.steer(0, 1); T.step(120); T.unsteer();
    return { y: Math.round(Game.player.y), sea: CFG.PIER.SEA_Y };
  });
  t.expect(beach.y > 6100 && beach.y < beach.sea, `down the stairs onto the sand, stopping at the water (${JSON.stringify(beach)})`);

  // ---- the ways in to the other plots stay open (a lane north from the boardwalk to the coaster's south edge)
  const lanes = await t.ev(() => {
    const res = [];
    for (const x of [8422, 9800]) { T.tp(x, 5960, 'pizzapier'); T.steer(0, -1); T.step(160); T.unsteer(); res.push(Math.round(Game.player.y)); }
    return res;
  });
  t.expect(lanes.every((y) => y < 5600), `lanes from the boardwalk up to the coaster's side are open (${lanes})`);

  // ---- Ride home: at the boarding spot by the train
  await t.ev(() => { const B = CFG.PIERPARK.BOARD; T.tp(B.x, B.y + 50, 'pizzapier'); });
  t.expectEq(await t.ev(() => T.hint()), 'Ride the train home 🚇', 'train hint near the boarding spot');
  await t.ev(() => { const B = CFG.PIERPARK.BOARD; T.tp(B.x, B.y, 'pizzapier'); });
  t.expectEq(await t.ev(() => T.label()), '🚇 Ride home', 'ride-home label on the spot');
  await t.shot('terminal');
  const home = await t.ev(() => { T.act(); const tr = Game.travel; return tr && { to: tr.to, via: tr.via, from: tr.from }; });
  t.expect(home && home.to === 'subway' && home.via === 'pierline' && home.from === 'pizzapier', `the ride home starts (${JSON.stringify(home)})`);
  // (let the City side finish the arrival: the subway's own step-off walk, if it has one)
  await t.ev(() => { T.until(() => !Game.travel && !(typeof SubwayExt !== 'undefined' && SubwayExt.st && SubwayExt.st.alight), 900); T.step(2); });

  // ---- the Ferris wheel: board, all the way round, "What a view!" at the top, off at the bottom
  await t.ev(() => { const B = CFG.PIERPARK.WHEEL.BOARD; T.tp(B.x, B.y + 50, 'pizzapier'); });
  t.expectEq(await t.ev(() => T.hint()), 'Ride the Ferris wheel! 🎡', 'wheel hint near the gate');
  await t.ev(() => { const B = CFG.PIERPARK.WHEEL.BOARD; T.tp(B.x, B.y, 'pizzapier'); });
  t.expectEq(await t.ev(() => T.label()), '🎡 Ride the Ferris wheel', 'wheel label at the gate');
  const ride = await t.ev(() => {
    const Wh = CFG.PIERPARK.WHEEL, st = PizzaPierExt.st;
    T.act();
    const r = st.ride, out = { started: !!r, label: T.label(), visitorFree: r && !Wh.VISITORS.includes(r.i) };
    let minY = Infinity, maxX = -Infinity, minX = Infinity, topSaid = false, steps = 0, pinned = true, camOk = true, steer = 0;
    T.steer(1, -1);   // pushing the stick does nothing while riding
    while (st.ride && steps < 60 * 30) {
      Game.update(1 / 60); Render.updateCamera(Game, 1 / 60); steps++;
      const p = Game.player;
      if (st.ride && st.ride.phase === 'ride') {
        const s = PizzaPierExt.seat(st.ride.i, st.wheelA);
        if (Math.hypot(p.x - s.x, p.y - s.y) > 0.5) pinned = false;
        minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); minX = Math.min(minX, p.x);
        if (st.ride.t > 1) { if (p.x < Render.camX + 60 || p.x > Render.camX + Render.viewW - 60 || p.y - 70 < Render.camY + 40 || p.y > Render.camY + Render.viewH - 40) camOk = false; }
        if (T.hint() === 'What a view! 🌊') out.topHint = true;
      }
      if (Game.floats.some((f) => String(f.text).startsWith('What a view'))) topSaid = true;
      if (st.ride && st.ride.phase === 'ride' && st.ride.t > 7.4 && st.ride.t < 7.6 && !out.shotAt) out.shotAt = steps;
    }
    T.unsteer();
    const p = Game.player;
    return Object.assign(out, { secs: steps / 60, minY: Math.round(minY), spanX: Math.round(maxX - minX), topSaid, pinned, camOk, end: [Math.round(p.x), Math.round(p.y)], exit: Wh.EXIT, rides: Game.s.pizzapier.wheel, labelAfter: T.label() });
  });
  t.expect(ride.started && ride.visitorFree, `boarded an empty gondola (${JSON.stringify(ride)})`);
  t.expect(ride.secs > 14 && ride.secs < 19, `one turn takes about 15 s (${ride.secs})`);
  t.expect(ride.minY < CFG_WHEEL_TOP() + 100, `went up to the top (min y ${ride.minY})`);
  t.expect(ride.spanX > 280, `went all the way round (x span ${ride.spanX})`);
  t.expect(ride.topSaid && ride.topHint, 'What a view at the top');
  t.expect(ride.pinned, 'the chef stays in the gondola even when the stick is pushed');
  t.expect(ride.camOk, 'the camera follows the chef round');
  t.expect(Math.hypot(ride.end[0] - ride.exit.x, ride.end[1] - ride.exit.y) < 2, `off at the bottom, by the gate (${ride.end})`);
  t.expectEq(ride.rides, 1, 'the ride counted');
  t.expectEq(ride.labelAfter, '🎡 Ride the Ferris wheel', 'can ride again at once');

  // pictures: the ride at the top, on a big screen and on a phone
  const rideTo = async (k) => t.ev((kk) => {
    const B = CFG.PIERPARK.WHEEL.BOARD; T.tp(B.x, B.y, 'pizzapier'); T.act();
    T.until(() => PizzaPierExt.st.ride && PizzaPierExt.st.ride.phase === 'ride' && PizzaPierExt.st.ride.t > kk * CFG.PIERPARK.WHEEL.RIDE, 2000);
    Game.cameraSnap = true; T.step(1);
  }, k);
  await rideTo(0.5);
  await t.shot('wheel-top');
  await t.ev(() => { T.until(() => !PizzaPierExt.st.ride, 2000); });
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => Render.resize());
  await rideTo(0.32);
  await t.shot('wheel-phone');
  // Take me home in the middle of the ride
  const gh = await t.ev(() => { Game.goHome(); T.step(2); return { area: Game.area, ride: PizzaPierExt.st.ride, x: Game.player.x }; });
  t.expect(gh.area === 'town' && !gh.ride, 'Take me home mid-ride: back in town, the ride stopped');
  await t.ev(() => { const A = CFG.PIER.ARRIVE; T.tp(A.x, A.y, 'pizzapier'); });
  await t.shot('arrive-phone');
  await t.ev(() => { T.tp(9700, 5560, 'pizzapier'); });
  await t.shot('site-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => Render.resize());

  // ---- the Pizza Drop: help build, a piece is added (and saved), and at the top a test run
  await t.ev(() => { const H = CFG.PIERPARK.BUILD.HELP; T.tp(H.x, H.y + 50, 'pizzapier'); });
  t.expectEq(await t.ev(() => T.hint()), 'Help the workers build the Pizza Drop! 🔨', 'help hint by the site');
  await t.ev(() => { const H = CFG.PIERPARK.BUILD.HELP; T.tp(H.x, H.y, 'pizzapier'); });
  t.expectEq(await t.ev(() => T.label()), '🔨 Help build', 'help label');
  const help = await t.ev(() => {
    const s = Game.s.pizzapier, b0 = s.built; T.act();
    const busy = T.label(), thanks = Game.floats.some((f) => String(f.text).includes('Thank you'));
    T.step(40);
    return { b0, mid: s.built, busy, thanks };
  });
  await t.shot('site-building');
  const help2 = await t.ev(() => { T.until(() => !PizzaPierExt.st.piece, 300); T.step(2); return { built: Game.s.pizzapier.built, helps: Game.s.pizzapier.helps, label: T.label() }; });
  t.expect(help.thanks, 'a worker says thank you');
  t.expectEq(help.busy, null, 'no button while the piece is being lowered');
  t.expectEq(help2.built, help.b0 + 1, 'one more piece on the tower');
  t.expectEq(help2.label, '🔨 Help build', 'help again');
  await t.ev(() => Game.save());
  await t.reload();
  t.expectEq(await t.ev(() => Game.s.pizzapier.built), help2.built, 'the tower height is kept across a reload');
  const done = await t.ev(() => {
    const H = CFG.PIERPARK.BUILD.HELP, M = CFG.PIERPARK.BUILD.MAX; T.tp(H.x, H.y, 'pizzapier');
    let n = 0; while (Game.s.pizzapier.built < M && n < 20) { T.act(); T.until(() => !PizzaPierExt.st.piece, 300); n++; }
    const show = !!PizzaPierExt.st.show; T.step(100);
    return { built: Game.s.pizzapier.built, show, max: M };
  });
  t.expect(done.built === done.max && done.show, `built to the top, and a test run plays (${JSON.stringify(done)})`);
  await t.shot('site-done');
  const more = await t.ev(() => { T.until(() => !PizzaPierExt.st.show, 600); const lbl = T.label(); T.act(); const show = !!PizzaPierExt.st.show; T.until(() => !PizzaPierExt.st.show, 600); return { lbl, show, built: Game.s.pizzapier.built, hint: T.hint() }; });
  t.expect(more.lbl === '🔨 Help build' && more.show && more.built === done.max, `helping again gives another test run (${JSON.stringify(more)})`);

  // ---- the food stands: one button each, free, the treat is carried for a while
  const stands = await t.ev(() => {
    const out = [], P = CFG.PIERPARK;
    for (const s of P.STANDS) {
      const sp = PizzaPierExt.standSpot(s); T.tp(sp.x, sp.y + 40, 'pizzapier'); const hint = T.hint();
      T.tp(sp.x, sp.y, 'pizzapier'); const cash = Game.s.cash, label = T.label(); T.act();
      out.push({ key: s.key, hint, label, want: s.label, got: PizzaPierExt.st.treat && PizzaPierExt.st.treat.key, free: Game.s.cash === cash });
    }
    return out;
  });
  for (const s of stands) {
    t.expectEq(s.label, s.want, `${s.key} stand label`);
    t.expect(s.got === s.key && s.free, `${s.key}: got one, for free (${JSON.stringify(s)})`);
    t.expect(!!s.hint, `${s.key}: a hint by the stand`);
  }
  await t.ev(() => { const s = CFG.PIERPARK.STANDS[1], sp = PizzaPierExt.standSpot(s); T.tp(sp.x, sp.y, 'pizzapier'); T.act(); T.tp(sp.x + 40, sp.y + 30, 'pizzapier'); });
  await t.shot('candy');
  const eaten = await t.ev(() => { T.step(60 * (CFG.PIERPARK.TREAT_T + 1)); return PizzaPierExt.st.treat; });
  t.expectEq(eaten, null, 'the treat is finished after a while');

  // ---- the pizza coin by the sandcastle: on free sand, reachable from the boardwalk
  const coin = await t.ev(() => {
    const c = CFG.PIZZACOINS && CFG.PIZZACOINS.SPOTS.find((s) => s.id === 'pizzapier');
    if (!c) return { missing: true };
    const free = !Game.obstacles().some((o) => Game.hitRect(c.x, c.y, 12, o));
    // walk: down the stairs nearest to it, then along the sand
    const P = CFG.PIERPARK, sx = P.STAIRS.slice().sort((a, b) => Math.abs(a - c.x) - Math.abs(b - c.x))[0];
    T.tp(sx, 5980, 'pizzapier'); T.steer(0, 1); T.until(() => Game.player.y >= c.y + 44, 300); T.unsteer();
    T.steer(Math.sign(c.x - Game.player.x), 0); T.until(() => Math.abs(Game.player.x - c.x) < 3, 600); T.unsteer();
    T.steer(0, -1); T.until(() => Game.player.y <= c.y, 120); T.unsteer();
    const got = !!(Game.s.pizzacoins && Game.s.pizzacoins.got && Game.s.pizzacoins.got.pizzapier);
    return { free, got, at: [Math.round(Game.player.x), Math.round(Game.player.y)], c: [c.x, c.y], place: CFG.PIZZACOINS.PLACES.pizzapier };
  });
  t.expect(!coin.missing, 'a pizza coin hides at the pier');
  t.expect(coin.free, 'the coin sits on free sand');
  t.expect(coin.got, `walked to it and picked it up (${JSON.stringify(coin)})`);
  t.expect(!!coin.place, 'the pier has a name in the coins panel');

  // ---- rescues: pushed into the terminal, into the wheel, into the sea
  const rescue = await t.ev(() => {
    const out = [];
    for (const [x, y] of [[8200, 5400], [10130, 5700], [9640, 5420], [9000, 6330], [10130, 5560]]) {
      T.tp(9000, 5980, 'pizzapier'); Game.player.x = x; Game.player.y = y; T.step(3);
      out.push({ from: [x, y], free: PizzaPierExt.free(Game, Game.player.x, Game.player.y), at: [Math.round(Game.player.x), Math.round(Game.player.y)] });
    }
    return out;
  });
  for (const r of rescue) t.expect(r.free, `rescued from ${r.from} onto free ground (${r.at})`);

  // ---- a reload in the middle of a ride puts the chef by the wheel's gate, never up in the air
  await t.ev(() => { const B = CFG.PIERPARK.WHEEL.BOARD; T.tp(B.x, B.y, 'pizzapier'); T.act(); T.until(() => PizzaPierExt.st.ride.phase === 'ride' && PizzaPierExt.st.ride.t > 5, 2000); Game.save(); });
  await t.reload();
  const reloaded = await t.ev(() => { T.step(3); const p = Game.player; return { area: Game.area, free: PizzaPierExt.free(Game, p.x, p.y), at: [Math.round(p.x), Math.round(p.y)], ride: PizzaPierExt.st.ride }; });
  t.expect(reloaded.area === 'pizzapier' && reloaded.free && !reloaded.ride, `after a reload mid-ride the chef stands on free ground (${JSON.stringify(reloaded)})`);

  // ---- Take me home from the park clears everything
  const gh2 = await t.ev(() => { const s = CFG.PIERPARK.STANDS[0], sp = PizzaPierExt.standSpot(s); T.tp(sp.x, sp.y, 'pizzapier'); T.act(); Game.goHome(); T.step(2); return { area: Game.area, treat: PizzaPierExt.st.treat }; });
  t.expect(gh2.area === 'town' && !gh2.treat, 'Take me home from the pier: in town, nothing carried');

  // ---- with the other parts of the pier in: the park steps aside while the chef rides the coaster, drives a bumper
  // car or plays a midway game (no park hint or button, and no rescue yanking them off)
  const aside = await t.ev(() => {
    const out = { parts: [typeof PierCoasterExt !== 'undefined' && 'coaster', typeof PierBumperExt !== 'undefined' && 'bumper', typeof PierGamesExt !== 'undefined' && 'games'].filter(Boolean) };
    const B = CFG.PIERPARK.WHEEL.BOARD, check = (name) => {
      Game.player.x = B.x; Game.player.y = B.y;
      const h = PizzaPierExt.hint(Game), a = PizzaPierExt.action(Game);
      Game.player.x = 10130; Game.player.y = 5700; PizzaPierExt.update(Game, 1 / 60);
      out[name] = { hint: h === undefined, action: !a, stayed: Game.player.y === 5700 };
    };
    T.tp(B.x, B.y, 'pizzapier');
    if (typeof PierCoasterExt !== 'undefined') { const f = PierCoasterExt.riding; PierCoasterExt.riding = () => true; check('coaster'); PierCoasterExt.riding = f; }
    if (typeof PierGamesExt !== 'undefined' && PierGamesExt.st) { const pl = PierGamesExt.st.play; PierGamesExt.st.play = { fake: true }; check('games'); PierGamesExt.st.play = pl; }
    { const v = Game.vehicle, d = Game.driving; Game.vehicle = { kind: 'bumpercar', x: B.x, y: B.y, angle: 0, vx: 0, vy: 0 }; Game.driving = true; check('bumper'); Game.vehicle = v; Game.driving = d; }
    T.tp(B.x, B.y, 'pizzapier');
    out.back = T.label();
    return out;
  });
  console.log('   other pier parts loaded: ' + (aside.parts.join(', ') || 'none'));
  for (const k of ['coaster', 'games', 'bumper']) if (aside[k]) t.expect(aside[k].hint && aside[k].action && aside[k].stayed, `the park steps aside while busy with the ${k} (${JSON.stringify(aside[k])})`);
  t.expectEq(aside.back, '🎡 Ride the Ferris wheel', 'and is back as soon as the chef is free');
  // the general park hint gives way to the other parts' own hints at their entrances, and shows elsewhere
  const general = await t.ev(() => { T.tp(10250, 5980, 'pizzapier'); return T.hint(); });
  t.expect(!!general, `a park hint on the boardwalk by the wheel (${general})`);

  // ---- the whole park from afar, and at dusk
  for (const [x, y, name] of [[8700, 5600, 'west'], [9700, 5600, 'east'], [9200, 6100, 'beach']]) {
    await t.ev(([xx, yy]) => { Render.setZoom(0.5); T.tp(xx, yy, 'pizzapier'); Game.cameraSnap = true; T.step(2); }, [x, y, name]);
    await t.shot('park-' + name);
  }
  await t.ev(() => { if (typeof AtmosphereExt !== 'undefined' && AtmosphereExt.force) AtmosphereExt.force({ phase: 'dusk' }); T.step(60 * 10); Render.setZoom(0.6); T.tp(9900, 5800, 'pizzapier'); Game.cameraSnap = true; T.step(2); });
  await t.shot('park-dusk');
  await t.ev(() => { Render.setZoom(1); });
};
function CFG_BW_Y0() { return 5900; }
function CFG_WHEEL_TOP() { return 5629 - 155 + 84; }
