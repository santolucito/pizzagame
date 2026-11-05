'use strict';
// Snow you can plow (js/snowplow.js): during a snow shower Construction Town gets a light snow cover (never on the
// half-built house, the store or the pond), it melts in 2-3 minutes after; riding the bulldozer clears the cells in front
// of its blade and leaves a snow pile when it stops; the hint by the bulldozer; the snow plow on Snowy Peak parked on
// free snow by the valley lift, its hint, getting in, clearing a road through the powder (banks beside it), the road
// filling back in, getting out, a rescue, Take-me-home, a reload; the frame cost of the cover. Screenshots desktop + phone.
module.exports = async (t) => {
  // until the coordinator wires js/snowplow.js into index.html, serve the page with it added
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    if (!body.includes('js/snowplow.js')) body = body.replace('<script src="js/main.js"></script>', '<script src="js/snowplow.js"></script>\n  <script src="js/main.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();

  // ---- registered: ahead of Snowy Peak and the City, a drivable vehicle kind
  const reg = await t.ev(() => ({
    ok: typeof SnowPlowExt !== 'undefined' && Render.ext.includes(SnowPlowExt) && Game.ext.includes(SnowPlowExt),
    order: Game.ext.indexOf(SnowPlowExt) < Game.ext.indexOf(SnowExt) && Game.ext.indexOf(SnowPlowExt) < Game.ext.indexOf(CityExt),
    spec: CFG.VEHICLES.snowplow,
  }));
  t.expect(reg.ok, 'the snow plow extension is registered');
  t.expect(reg.order, 'it answers before Snowy Peak and the City');
  t.expect(reg.spec && reg.spec.label === '🚜 Drive the snow plow' && reg.spec.exit === '🚶 Hop out' && reg.spec.speed >= 150 && reg.spec.speed <= 260, `vehicle spec ${JSON.stringify(reg.spec)}`);
  await t.ev(() => { AtmosphereExt.force({ phase: 'day', weather: 'none' }); T.step(1); });

  // ================= Construction Town =================
  const P = { dirt: [3600, 400], road: [3300, 956], grass: [4470, 300], house: [2870, 450], store: [4285, 300], pond: [4230, 830], diner: [3530, 1100] };
  const dry = await t.ev((P) => { T.tp(3600, 420, 'site'); return { level: SnowPlowExt.st.level, d: SnowPlowExt.depthAt('site', ...P.dirt), hint: T.hint() }; }, P);
  t.expect(dry.level === 0 && dry.d === 0, `no snow before it snows ${JSON.stringify(dry)}`);

  // ---- a forced shower: the cover builds up over a shower to a full white cover
  const fall = await t.ev((P) => {
    AtmosphereExt.force({ weather: 'snow' }); const w = AtmosphereExt.weather.site, dur = w.dur;
    T.step(60 * 10); const at10 = SnowPlowExt.st.level;
    T.until(() => AtmosphereExt.weather.site.t < 0, 60 * 90);
    const d = {}; for (const k in P) d[k] = Math.round(SnowPlowExt.depthAt('site', ...P[k]) * 100) / 100;
    return { dur: Math.round(dur), at10, level: SnowPlowExt.st.level, d };
  }, P);
  t.expect(fall.at10 > 0.1 && fall.at10 < 0.5, `snow builds up gradually (${fall.at10.toFixed(2)} after 10 s)`);
  t.expect(fall.level > 0.95, `a full cover by the end of a ${fall.dur} s shower (${fall.level.toFixed(2)})`);
  t.expect(fall.d.dirt > 0.9 && fall.d.road > 0.9 && fall.d.grass > 0.9, `snow on the dirt, the street and the grass ${JSON.stringify(fall.d)}`);
  t.expect(fall.d.house === 0 && fall.d.store === 0 && fall.d.pond === 0 && fall.d.diner === 0, `no snow inside the house, on the store, the diner or the pond ${JSON.stringify(fall.d)}`);

  // ---- the hint by the bulldozer (on foot, within 120 px, no arrow), and not far away
  const hint = await t.ev(() => {
    const dz = Game.bulldozer; T.tp(dz.x + 90, dz.y + 30, 'site'); T.step(2); const near = Game.hint;
    T.tp(dz.x + 260, dz.y - 200, 'site'); T.step(2); const far = T.hint();
    return { near: near && { text: near.text, target: near.target }, far };
  });
  t.expect(hint.near && hint.near.text === 'Plow the snow with the bulldozer! ❄️' && !hint.near.target, `hint by the bulldozer ${JSON.stringify(hint.near)}`);
  t.expect(hint.far !== 'Plow the snow with the bulldozer! ❄️', 'no bulldozer hint far from it');
  await t.ev(() => { const dz = Game.bulldozer; T.tp(dz.x + 70, dz.y + 30, 'site'); Render.setZoom(1.2); Game.cameraSnap = true; T.step(2); Game.floats.length = 0; });
  await t.shot('site-snow');

  // ---- the bulldozer pushes the snow: the cells in front of the blade are cleared, a pile builds up and is left behind
  const plow = await t.ev(() => {
    const dz = Game.bulldozer, y = dz.y; T.tp(dz.x, dz.y + 40, 'site'); Game.enterCar(); const kind = Game.vehicle && Game.vehicle.kind;
    dz.angle = 0; T.step(1);
    const x0 = dz.x, before = [SnowPlowExt.depthAt('site', x0 + 120, y), SnowPlowExt.depthAt('site', x0 + 160, y)], side = SnowPlowExt.depthAt('site', x0 + 140, y + 110);
    T.steer(1, 0); T.step(66); const carry = SnowPlowExt.st.carry, cleared = SnowPlowExt.st.cleared;
    const after = [SnowPlowExt.depthAt('site', x0 + 120, y), SnowPlowExt.depthAt('site', x0 + 160, y)];
    const hintRide = T.hint();
    T.unsteer(); T.step(60);
    return { kind, x0, x1: dz.x, before, after, side: [side, SnowPlowExt.depthAt('site', x0 + 140, y + 110)], carry, cleared, piles: SnowPlowExt.st.piles.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y), s: p.size })), carryAfter: SnowPlowExt.st.carry, hintRide };
  });
  t.expectEq(plow.kind, 'bulldozer', 'riding the bulldozer');
  t.expect(plow.before.every((d) => d > 0.9) && plow.after.every((d) => d < 0.05), `the blade clears the snow it drives over ${JSON.stringify(plow)}`);
  t.expect(plow.side[0] > 0.9 && plow.side[1] > 0.9, 'snow beside the path stays');
  t.expect(plow.carry > 2 && plow.cleared >= 10, `snow piles up in front of the blade (${plow.carry.toFixed(1)}, ${plow.cleared} cells)`);
  t.expect(plow.piles.length === 1 && plow.piles[0].x > plow.x0 + 150 && plow.carryAfter === 0, `stopping leaves a snow pile ahead of the blade ${JSON.stringify(plow)}`);
  t.expectEq(plow.hintRide, 'Push the snow into big piles! ❄️', 'hint while plowing with the bulldozer');
  // turning hard also leaves the pile behind; the dump truck leaves tyre tracks
  const turn = await t.ev(() => {
    let said = 0; const watch = (k) => { for (let i = 0; i < k; i++) { T.step(1); said += Game.floats.filter((f) => f.text === 'Plowed! ❄️' && f.t === 0).length; } };
    T.steer(1, 0); watch(40); const c0 = SnowPlowExt.st.carry; T.steer(0, 1); watch(24); const n = SnowPlowExt.st.piles.length; T.unsteer(); watch(30);
    return { c0, n, said, cleared: SnowPlowExt.st.cleared };
  });
  t.expect(turn.c0 > 1 && turn.n === 2, `a sharp turn drops the pile too ${JSON.stringify(turn)}`);
  t.expect(turn.said <= 1 && plow.cleared + turn.cleared > 0, `at most one "Plowed!" float in a few seconds ${JSON.stringify(turn)}`);
  await t.ev(() => { Game.floats.length = 0; Game.cameraSnap = true; T.step(2); });
  await t.shot('site-plowed');
  const tracks = await t.ev(() => {
    const d = Game.dumptruck; T.tp(d.x, d.y + 50, 'site'); Game.enterCar(); const kind = Game.vehicle.kind; d.x = 3600; d.y = 360; d.angle = Math.PI / 2;
    T.steer(0, 1); T.step(40); T.unsteer(); T.step(5);
    return { kind, stamps: SnowPlowExt.st.stamps.filter((s) => s.area === 'site').length, hint: T.hint() };
  });
  t.expect(tracks.kind === 'dumptruck' && tracks.stamps >= 6, `the dump truck leaves tyre tracks ${JSON.stringify(tracks)}`);
  t.expect(tracks.hint !== 'Plow the snow with the bulldozer! ❄️' && tracks.hint !== 'Push the snow into big piles! ❄️', 'no plow hint while driving another vehicle');
  await t.ev(() => { Game.exitCar(); T.step(1); });

  // ---- frame cost of the cover: 120 frames with it drawn vs. without (and the one-off paint)
  const perf = await t.ev(() => {
    const dz = Game.bulldozer; T.tp(dz.x + 60, dz.y + 40, 'site'); Render.setZoom(1); Game.cameraSnap = true; T.step(2);
    const L = SnowPlowExt.layers.site; L.painted = false; L.paintRow = 0; const p0 = performance.now(); SnowPlowExt.paintBand(L, 8); const band = performance.now() - p0; SnowPlowExt.paintAll(L); const paint = performance.now() - p0;
    const run = (off) => { SnowPlowExt.off = off; Render.draw(Game); const a = performance.now(); for (let i = 0; i < 120; i++) Render.draw(Game); return (performance.now() - a) / 120; };
    const res = [];
    for (let k = 0; k < 5; k++) res.push([run(true), run(false)]);
    SnowPlowExt.off = false;
    // the CPU time of the extension's own drawing hooks (what the game's code spends; the browser then rasterises the one
    // drawImage, which is free on a GPU canvas and about one full-screen image blend on a software one)
    Render.draw(Game); const items = [], h0 = performance.now();
    for (let i = 0; i < 120; i++) { SnowPlowExt.dynamic(Render, Game); SnowPlowExt.entities(Render, Game, items); SnowPlowExt.overlay(Render, Game); }
    const hooks = (performance.now() - h0) / 120;
    // a redraw of a few plowed cells
    const r0 = performance.now(); for (let i = 0; i < 60; i++) SnowPlowExt.redrawCell(L, 2000 + i); const cell = (performance.now() - r0) / 60;
    const off = Math.min(...res.map((r) => r[0])), on = Math.min(...res.map((r) => r[1]));
    return { off, on, extra: on - off, hooks, paint, band, cell, canvas: [L.canvas.width, L.canvas.height], cells: L.n };
  });
  console.log('   frame cost', JSON.stringify(perf));
  t.expect(perf.hooks < 0.25 && perf.extra < Math.max(2.5, perf.off * 0.45), `the snow cover costs little per frame ${JSON.stringify(perf)}`);
  t.expect(perf.paint < 60 && perf.band < 6 && perf.cell < 0.3, `painting the whole layer once and a cell redraw are quick ${JSON.stringify(perf)}`);

  // ---- melting: after the shower the cover melts away in 2-3 minutes, piles too
  const melt = await t.ev(() => {
    SnowPlowExt.st.level = 1; AtmosphereExt.force({ weather: 'none' }); T.tp(3600, 420, 'site');
    T.step(60 * 60); const at60 = SnowPlowExt.st.level, piles60 = SnowPlowExt.st.piles.length;
    const n = T.until(() => SnowPlowExt.st.level <= 0, 60 * 200);
    return { at60, piles60, secs: Math.round(60 + n / 60), piles: SnowPlowExt.st.piles.length, d: SnowPlowExt.depthAt('site', 3600, 400), plowed: SnowPlowExt.layers.site.active.length };
  });
  t.expect(melt.at60 > 0.4 && melt.at60 < 0.8 && melt.piles60 >= 1, `melting slowly ${JSON.stringify(melt)}`);
  t.expect(melt.secs >= 120 && melt.secs <= 185 && melt.piles === 0 && melt.d === 0 && melt.plowed === 0, `all melted in 2-3 minutes ${JSON.stringify(melt)}`);

  // ================= Snowy Peak: the snow plow =================
  const park = await t.ev(() => {
    const v = SnowPlowExt.v, S = CFG.SNOW, V = S.VALLEY;
    T.tp(V.OFF.x, V.OFF.y, 'snow'); T.step(2);
    const obs = Game.obstacles(), body = obs.filter((o) => Game.hitRect(v.x, v.y, 40, o)).length;
    const box = (R, m) => v.x + 30 > R.x0 - m && v.x - 30 < R.x1 + m && v.y + 60 > R.y0 - m && v.y - 60 < R.y1 + m;
    const near = (p) => Math.round(U.dist(v.x, v.y, p.x, p.y));
    // the tree canopies (pines are drawn ~1.8x their size) must not cover it
    const canopy = S.TREES.filter(([x, y, s]) => Math.abs(x - v.x) < 30 * 1.8 * s + 30 && v.y - 60 < y && v.y + 60 > y - 90 * s).length;
    return {
      x: v.x, y: v.y, body, canopy, deck: box(V.DECK, 30), hut: box(V.HUT, 30), bottom: box(S.BOTTOM, 30),
      board: near(V.BOARD), off: near(V.OFF), bspot: near(S.BOTTOM_SPOT), down: near(S.DOWN_ARRIVE),
      listed: Game.vehicles().includes(v), powder: SnowPlowExt.depthAt('snow', v.x + 60, v.y),
      sled: SnowExt.mine(v),
    };
  });
  t.expect(park.body === 0 && park.canopy === 0, `the plow is parked on free snow ${JSON.stringify(park)}`);
  t.expect(!park.deck && !park.hut && !park.bottom && park.board > 120 && park.off > 110 && park.bspot > 300 && park.down > 200, `it blocks no deck, hut, station or mat ${JSON.stringify(park)}`);
  t.expect(park.listed && !park.sled, 'listed as a vehicle on Snowy Peak, and not a sled or skis to SnowExt');
  t.expect(park.powder === 1, 'fresh powder around it');
  t.expect(await t.ev(() => { T.tp(3600, 420, 'site'); return !Game.vehicles().includes(SnowPlowExt.v); }), 'not listed in Construction Town');
  // the way from the valley lift up to the mountain lift is open (the chef walks round it)
  const walk = await t.ev(() => {
    const S = CFG.SNOW; T.tp(S.VALLEY.OFF.x, S.VALLEY.OFF.y, 'snow');
    T.steer(-0.6, -1); const n = T.until(() => U.dist(Game.player.x, Game.player.y, S.DOWN_ARRIVE.x, S.DOWN_ARRIVE.y) < 60 || Game.player.y < S.DOWN_ARRIVE.y, 400); T.unsteer();
    return n;
  });
  t.expect(walk >= 0, 'the chef walks from the valley lift to the mountain lift');

  // ---- on foot by the plow: the hint and the vehicle button
  const foot = await t.ev(() => {
    const v = SnowPlowExt.v; T.tp(v.x + 55, v.y + 20, 'snow'); T.step(2);
    const h = T.hint(), near = Game.nearVehicle === v, label = T.label();
    T.tp(v.x + 150, v.y + 30, 'snow'); T.step(2); const far = T.hint();
    return { h, near, label, far };
  });
  t.expectEq(foot.h, 'Drive the snow plow! 🚜', 'hint next to the plow');
  t.expect(foot.near, 'the vehicle button offers the plow');
  t.expect(foot.far !== 'Drive the snow plow! 🚜', 'no plow hint farther away');
  await t.ev(() => { const v = SnowPlowExt.v; T.tp(v.x + 55, v.y + 20, 'snow'); Render.setZoom(1.3); Game.cameraSnap = true; T.step(2); Game.floats.length = 0; });
  await t.shot('plow-parked');

  // ---- get in and plow a road east through the powder: cleared track, banks beside it, spray, no sliding
  const drive = await t.ev(() => {
    const v = SnowPlowExt.v, L = SnowPlowExt.layers.snow; T.tp(v.x + 55, v.y + 20, 'snow'); Game.enterCar(); T.step(1);
    const kind = Game.vehicle && Game.vehicle.kind, y = v.y, h0 = T.hint();
    T.steer(1, 0); T.step(30); const spray = SnowPlowExt.st.spray.length; T.step(50); T.unsteer(); T.step(20);
    const bankAt = (x) => Math.max(L.b[SnowPlowExt.cellAt(L, x, y + 56)], L.b[SnowPlowExt.cellAt(L, x, y + 52)], L.b[SnowPlowExt.cellAt(L, x, y + 64)]);
    return {
      kind, h0, x: Math.round(v.x), y: Math.round(v.y), dy: Math.round(v.y - y), spray, snowSled: SnowExt.riding(Game),
      road: [SnowPlowExt.depthAt('snow', 6240, y), SnowPlowExt.depthAt('snow', 6300, y + 20), SnowPlowExt.depthAt('snow', 6330, y - 20)],
      bank: bankAt(6270), off: SnowPlowExt.depthAt('snow', 6260, y + 110), cleared: SnowPlowExt.st.peakCleared, hint: T.hint(), label: T.label(),
    };
  });
  t.expect(drive.kind === 'snowplow' && !drive.snowSled, `driving the plow (not a sled) ${JSON.stringify(drive)}`);
  t.expectEq(drive.h0, 'Plow snowy roads! 🚜❄️', 'hint in the plow');
  t.expect(drive.x > 6350 && Math.abs(drive.dy) < 4, `it drives normally across the flat ${JSON.stringify(drive)}`);
  t.expect(drive.road.every((d) => d < 0.05) && drive.cleared >= 20, `a road is plowed through the powder ${JSON.stringify(drive)}`);
  t.expect(drive.bank > 0.3 && drive.off === 1, `snowbanks pushed up beside it, fresh powder further away ${JSON.stringify(drive)}`);
  t.expect(drive.spray > 0, 'snow sprays off the blade');
  t.expectEq(drive.label, null, 'no other button while plowing');
  await t.ev(() => { T.steer(-1, 0.25); T.step(40); T.steer(-1, 0); T.step(30); T.steer(0, -1); T.step(14); Game.floats.length = 0; Game.cameraSnap = true; T.step(2); });
  await t.shot('plowing');
  await t.ev(() => { T.unsteer(); T.step(2); });

  // ---- the road stays clear while the chef is on Snowy Peak (the Cocoa Cabin counts), and fills in once they leave
  const refill = await t.ev(() => {
    const y = CFG.SNOWPLOW.SPOT.y, d = () => SnowPlowExt.depthAt('snow', 6240, y), p = Game.player;
    const at0 = d(); T.step(60 * 130); const at130 = d();
    const x = p.x, yy = p.y; Game.area = 'cocoacabin'; T.step(30); Game.area = 'snow'; T.step(30); const cabin = d();
    Game.startTravel('site', 'skilift', 1); T.until(() => !Game.travel, 600); T.step(5);
    Game.startTravel('snow', 'skilift', 1); T.until(() => !Game.travel, 600); T.until(() => !SnowExt.st.lift, 600); T.step(5);
    return { at0, at130, cabin, back: d(), active: SnowPlowExt.layers.snow.active.length, area: Game.area, x, yy };
  });
  t.expect(refill.at0 < 0.2 && refill.at130 < 0.2 && refill.cabin < 0.2, `the road stays plowed while the chef is on Snowy Peak ${JSON.stringify(refill)}`);
  t.expect(refill.area === 'snow' && refill.back === 1 && refill.active === 0, `after a trip to town the road is fresh powder again ${JSON.stringify(refill)}`);

  // ---- hop out on free snow; the plow stays where it was left
  const out = await t.ev(() => {
    const v = SnowPlowExt.v; Game.exitCar(); T.step(2); const p = Game.player;
    return { driving: Game.driving, solid: Game.obstacles().filter((o) => Game.hitRect(p.x, p.y, 12, o)).length, d: Math.round(U.dist(p.x, p.y, v.x, v.y)), still: Math.hypot(v.vx, v.vy), hint: T.hint(), moved: v.x !== CFG.SNOWPLOW.SPOT.x || v.y !== CFG.SNOWPLOW.SPOT.y };
  });
  t.expect(!out.driving && out.solid === 0 && out.d < 80 && out.still === 0 && out.moved, `hopped out beside it ${JSON.stringify(out)}`);
  t.expectEq(out.hint, 'Drive the snow plow! 🚜', 'hint again on foot beside it');

  // ---- rescue: a plow stuck in a pine goes back to its spot (with the chef in it too)
  const rescue = await t.ev(() => {
    const v = SnowPlowExt.v, S = CFG.SNOWPLOW.SPOT; v.x = 6300; v.y = 6522; T.step(2); const a = [v.x, v.y];
    T.tp(S.x + 55, S.y + 20, 'snow'); Game.enterCar(); const C = CFG.SNOW.CABIN; v.x = (C.x0 + C.x1) / 2; v.y = (C.y0 + C.y1) / 2; T.step(2); const b = [v.x, v.y, Game.player.x, Game.player.y, Game.driving, SnowExt.st.obs.filter((o) => Game.hitRect(v.x, v.y, 10, o)).length];
    return { a, b, S: [S.x, S.y] };
  });
  t.expect(rescue.a[0] === rescue.S[0] && rescue.a[1] === rescue.S[1], `a stuck plow goes back to its spot ${JSON.stringify(rescue)}`);
  t.expect(rescue.b[5] === 0 && rescue.b[0] === rescue.b[2] && rescue.b[1] === rescue.b[3] && rescue.b[4], `driven into the cabin, the plow and the chef end up outside it ${JSON.stringify(rescue)}`);

  // ---- Take-me-home from the plow: back in the pizzeria, the plow parked at its spot
  const home = await t.ev(() => {
    const v = SnowPlowExt.v; T.steer(1, 0); T.step(40); T.unsteer();
    const moved = v.x !== CFG.SNOWPLOW.SPOT.x;
    Game.goHome(); T.step(2);
    return { moved, area: Game.area, driving: Game.driving, x: v.x, y: v.y, a: v.angle, spot: CFG.SNOWPLOW.SPOT, hint: T.hint() };
  });
  t.expect(home.moved && home.area === 'town' && !home.driving && home.x === home.spot.x && home.y === home.spot.y && home.a === home.spot.angle, `Take-me-home parks the plow back ${JSON.stringify(home)}`);

  // ---- a reload: the plow is at its spot, nothing about the snow was saved
  await t.ev(() => { const v = SnowPlowExt.v; v.x = 6400; v.y = 6700; Game.save(); });
  await t.reload();
  const re = await t.ev(() => ({ x: SnowPlowExt.v.x, y: SnowPlowExt.v.y, saved: Object.keys(Game.s).filter((k) => /plow/i.test(k)) }));
  t.expect(re.x === 6110 && re.y === 6575 && re.saved.length === 0, `after a reload the plow is parked at its spot ${JSON.stringify(re)}`);

  // ---- phone screenshots: both maps with snow
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => {
    Render.resize(); AtmosphereExt.force({ phase: 'day', weather: 'snow' }); SnowPlowExt.st.level = 1;
    const dz = Game.bulldozer; T.tp(dz.x, dz.y + 40, 'site'); Game.enterCar(); dz.angle = 0; T.steer(1, 0); T.step(60); T.unsteer(); T.step(30);
    Render.setZoom(1.3); Game.cameraSnap = true; Game.floats.length = 0; T.step(2);
  });
  await t.shot('phone-site');
  await t.ev(() => {
    const v = SnowPlowExt.v; T.tp(v.x + 55, v.y + 20, 'snow'); Game.enterCar(); T.steer(1, 0); T.step(50); T.steer(0.3, 1); T.step(25); T.unsteer();
    Render.setZoom(1.3); Game.cameraSnap = true; Game.floats.length = 0; T.step(2);
  });
  await t.shot('phone-plow');
};
