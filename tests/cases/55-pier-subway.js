'use strict';
// Subway Line 2 to Pizza Pier (js/subway.js): the City station has two halls, Line 1's (red, 🎓, to Columbia) and through
// the arch in the dividing wall Line 2's (purple, 🎡, to Pizza Pier), each with its own platform, waiting spot, track and
// train. Line 1 still runs both ways; Line 2's train comes, you board it, the 'pierline' ride plays and lands on the pier;
// the ride home lands on Line 2's platform; at the Columbia end Line 2 is shut behind a gate; rescues and Take-me-home;
// the stuck detector over Line 2's hall; screenshots of the station and of the ride both ways, by day and at dusk.
const fs = require('fs');
const path = require('path');

module.exports = async (t) => {
  // until the coordinator wires the park in, serve the page with js/pizzapier.js added if that file exists yet
  const hasPier = fs.existsSync(path.join(__dirname, '..', '..', 'js', 'pizzapier.js'));
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    if (hasPier && !body.includes('js/pizzapier.js')) body = body.replace('<script src="js/main.js"></script>', '<script src="js/pizzapier.js"></script>\n  <script src="js/main.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();

  // ---- registered ahead of the City; the station's rectangle overlaps no other map
  const reg = await t.ev(() => {
    const W = CFG.AREAS.subway.WORLD, hit = [];
    for (const [k, A] of Object.entries(CFG.AREAS)) { if (k === 'subway') continue; const B = A.WORLD; if (B.x0 < W.x1 && B.x1 > W.x0 && B.y0 < W.y1 && B.y1 > W.y0) hit.push(k); }
    return { order: Game.ext.indexOf(SubwayExt) < Game.ext.indexOf(CityExt) && Render.ext.includes(SubwayExt), world: [W.x0, W.y0, W.x1, W.y1], hit, ride: !!SubwayExt.travel.pierline };
  });
  t.expect(reg.order, 'the subway answers before the City');
  t.expectEq(JSON.stringify(reg.world), JSON.stringify([6400, 2100, 8200, 2500]), 'the station reaches east for Line 2');
  t.expectEq(reg.hit.join(','), '', 'the station overlaps no other map');
  t.expect(reg.ride, 'the pierline ride is registered');

  // ---- down the same stairs in the City; the concourse hint names both lines
  await t.ev(() => { const e = SubwayExt.cityEntrance(); T.tp(e.x, e.y + 16, 'city'); });
  t.expectEq(await t.ev(() => T.label()), '🚇 Go down to the subway', 'the City entrance is unchanged');
  await t.ev(() => { T.act(); T.step(30); });
  t.expect(await t.ev(() => Game.area === 'subway' && SubwayExt.st.end === 'city'), 'down in the City station');
  await t.ev(() => T.tp(6800, 2240));
  t.expectEq(await t.ev(() => T.hint()), 'Red train 🎓 to Columbia, purple train 🎡 to Pizza Pier!', 'the concourse hint names both lines');

  // ---- walk from Line 1's concourse through the arch into Line 2's hall
  const walk = await t.ev(() => { const D = CFG.SUBWAY.STATION.divider; T.tp(D.x0 - 40, (D.arch.y0 + D.arch.y1) / 2); T.steer(1, 0); const n = T.until(() => Game.player.x > D.x1 + 60, 200); T.unsteer(); return { n, x: Game.player.x }; });
  t.expect(walk.n >= 0, `walked through the arch into Line 2's hall (x ${Math.round(walk.x)})`);
  t.expectEq(await t.ev(() => T.hint()), 'Purple train 🎡 to Pizza Pier comes here!', "Line 2's hall hint");
  t.expect(await t.ev(() => { const h = Game.hint, s = CFG.SUBWAY.STATION.L2.stand; return !!h.target && h.target.x === s.x && h.target.y === s.y; }), "the hint points at Line 2's waiting spot");
  await t.ev(() => { T.tp(7300, 2260); T.step(2); });
  await t.shot('station-both-lines');

  // ---- Line 1 still works: its train comes to its own platform, boards, rides to Columbia
  await t.ev(() => T.tp(CFG.SUBWAY.STATION.stand.x, CFG.SUBWAY.STATION.stand.y));
  t.expectEq(await t.ev(() => T.hint()), 'Red train 🎓 to Columbia comes here!', "hint on Line 1's platform");
  const a1 = await t.ev(() => T.until(() => SubwayExt.st.train.state === 'stopped' && SubwayExt.st.train.doors >= 1, 1500));
  t.expect(a1 >= 0 && a1 <= 60 * 8, `Line 1's train pulls in within 8 s (took ${a1} steps)`);
  t.expectEq(await t.ev(() => SubwayExt.st.train.x), await t.ev(() => CFG.SUBWAY.STATION.stopX), 'Line 1 stops where it always did');
  await t.ev(() => { const d = SubwayExt.doorSpots(undefined, 1)[2]; T.tp(d.x, d.y); });
  t.expectEq(await t.ev(() => T.label()), '🚇 Ride the subway', "Line 1's boarding label");
  await t.ev(() => { T.toasts.length = 0; T.act(); });
  t.expect(await t.ev(() => T.until(() => !!Game.travel && Game.travel.via === 'subway' && Game.travel.to === 'campus', 120)) >= 0, 'Line 1 rides to Columbia');
  await t.ev(() => T.until(() => Game.area === 'subway' && !Game.travel, 3000));
  t.expectEq(await t.ev(() => SubwayExt.st.end), 'campus', 'at the Columbia end');
  t.expect(await t.ev(() => T.toasts.includes('🎓 Welcome to Columbia!')), 'welcome toast at Columbia');

  // ---- at the Columbia end Line 2 is shut: a gate across the arch, a rescue out of its hall, a friendly hint by the gate
  const shut = await t.ev(() => {
    const D = CFG.SUBWAY.STATION.divider, cy = (D.arch.y0 + D.arch.y1) / 2;
    const gate = Game.obstacles().some((o) => Game.hitRect((D.x0 + D.x1) / 2, cy, 2, o));
    T.until(() => SubwayExt.st.train.state !== 'stopped', 1500); SubwayExt.st.justArrived = false; T.tp(D.x0 - 30, cy); const hint = T.hint();
    T.steer(1, 0); T.step(60); T.unsteer(); const x = Game.player.x;
    Game.player.x = 7700; Game.player.y = 2360; T.step(2);
    const f = CFG.SUBWAY.STATION.stairs.foot;
    return { gate, hint, x, rescued: Math.hypot(Game.player.x - f.x, Game.player.y - f.y) < 2, label: T.label() };
  });
  t.expect(shut.gate, 'a gate closes the arch at the Columbia end');
  t.expectEq(shut.hint, '🎡 Line 2 goes from the City 🏙️', 'the hint by the gate says Line 2 goes from the City');
  t.expect(shut.x < 7270, `the chef cannot walk through the gate (x ${Math.round(shut.x)})`);
  t.expect(shut.rescued, "a chef put in Line 2's shut hall is rescued to the stairs");
  t.expect(await t.ev(() => SubwayExt.st.train2.state === 'away' || SubwayExt.st.end === 'campus'), 'Line 2 does not run at the Columbia end');
  await t.ev(() => { const D = CFG.SUBWAY.STATION.divider; T.tp(D.x0 - 60, 2330); T.step(2); });
  await t.shot('station-campus-end');
  // and Line 1 home again
  await t.ev(() => T.tp(CFG.SUBWAY.STATION.stand.x, CFG.SUBWAY.STATION.stand.y));
  t.expect(await t.ev(() => T.until(() => SubwayExt.st.train.state === 'stopped' && SubwayExt.st.train.doors >= 1, 1500)) >= 0, 'a Line 1 train comes for the ride home');
  await t.ev(() => { const d = SubwayExt.doorSpots(undefined, 1)[1]; T.tp(d.x, d.y); });
  t.expectEq(await t.ev(() => T.label()), '🚇 Ride the subway', 'boarding label at the Columbia end');
  await t.ev(() => { T.toasts.length = 0; T.act(); T.until(() => Game.area === 'subway' && !Game.travel && SubwayExt.st.end === 'city', 3000); T.step(60); });
  t.expectEq(await t.ev(() => SubwayExt.st.end), 'city', 'Line 1 brought the chef back to the City end');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => { const D = CFG.SUBWAY.STATION.divider; return Game.hitRect((D.x0 + D.x1) / 2, (D.arch.y0 + D.arch.y1) / 2, 2, o); })), 'the arch is open again at the City end');

  // ---- Line 2: wait on its platform, the purple train comes, board, ride to Pizza Pier
  await t.ev(() => { const s = CFG.SUBWAY.STATION.L2.stand; T.tp(s.x, s.y); T.until(() => SubwayExt.st.train2.state === 'away', 2000); });
  t.expectEq(await t.ev(() => T.hint()), 'Purple train 🎡 to Pizza Pier comes here!', "hint on Line 2's platform");
  const a2 = await t.ev(() => T.until(() => SubwayExt.st.train2.state === 'stopped' && SubwayExt.st.train2.doors >= 1, 1500));
  t.expect(a2 >= 0 && a2 <= 60 * 8, `Line 2's train pulls in within 8 s (took ${a2} steps)`);
  t.expectEq(await t.ev(() => SubwayExt.st.train2.x), await t.ev(() => CFG.SUBWAY.STATION.L2.stopX), "Line 2's train stops at its own platform");
  t.expect(/Purple train leaves in \d+s/.test(await t.ev(() => T.hint())), 'countdown hint for the purple train');
  t.expectEq(await t.ev(() => T.label()), '🎡 Ride to Pizza Pier', 'the waiting spot is right by a door');
  await t.ev(() => { const d = SubwayExt.doorSpots(undefined, 2)[4]; T.tp(d.x, d.y); });
  t.expectEq(await t.ev(() => T.label()), '🎡 Ride to Pizza Pier', "Line 2's boarding label by its doors");
  await t.ev(() => { const s = CFG.SUBWAY.STATION.L2.stand; T.tp(s.x - 60, s.y - 20); T.step(2); });
  await t.shot('station-line2-train');
  await t.ev(() => { const d = SubwayExt.doorSpots(undefined, 2)[2]; T.tp(d.x, d.y); T.act(); });
  t.expectEq(await t.ev(() => T.hint()), '🎡 All aboard!', 'all aboard the purple train');
  const go = await t.ev(() => { T.until(() => !!Game.travel, 120); return Game.travel && { via: Game.travel.via, to: Game.travel.to, from: Game.travel.from }; });
  t.expectEq(JSON.stringify(go), JSON.stringify({ via: 'pierline', to: 'pizzapier', from: 'subway' }), 'boarding starts the pierline ride to Pizza Pier');
  t.expectEq(await t.ev(() => SubwayExt.st.train2.state), 'leaving', 'the purple train pulls out with the chef');
  await t.ev(() => T.until(() => !Game.travel, 400));
  t.expectEq(await t.ev(() => Game.area), 'pizzapier', 'the ride lands at Pizza Pier');

  // ---- the ride home from the pier lands on Line 2's platform
  await t.ev(() => { const A = CFG.PIER.ARRIVE; T.tp(A.x, A.y, 'pizzapier'); T.toasts.length = 0; Game.startTravel('subway', 'pierline', 1); });
  t.expectEq(await t.ev(() => Game.travel && Game.travel.from), 'pizzapier', 'the ride home starts from the pier');
  await t.ev(() => T.until(() => !Game.travel, 400));
  const home = await t.ev(() => ({ area: Game.area, end: SubwayExt.st.end, t2: SubwayExt.st.train2.state, x2: SubwayExt.st.train2.x, hall: SubwayExt.hallOf(Game.player.x), toasts: T.toasts.slice() }));
  t.expectEq(home.area, 'subway', 'back in the station');
  t.expectEq(home.end, 'city', 'at the City end');
  t.expectEq(home.t2, 'stopped', 'the purple train waits at its platform');
  t.expectEq(home.hall, 2, "the chef gets off on Line 2's platform");
  t.expect(home.toasts.includes('🏙️ Back in the City!'), 'back-in-the-City toast');
  await t.ev(() => T.step(60));
  t.expect(await t.ev(() => Game.player.y < CFG.SUBWAY.STATION.edge && !SubwayExt.st.alight), 'the chef stepped out onto the platform');
  const up = await t.ev(() => ({ text: T.hint(), target: Game.hint.target, arch: SubwayExt.archSpots().w }));
  t.expectEq(up.text, 'Up the stairs to the City 🏙️', 'the hint shows the way up');
  t.expect(up.target && up.target.x === up.arch.x, 'from Line 2 the hint points through the arch first');
  // walk all the way to the stairs and up into the City
  const out = await t.ev(() => {
    const A = SubwayExt.archSpots(), f = CFG.SUBWAY.STATION.stairs.foot;
    const walkTo = (x, y) => T.until(() => { const dx = x - Game.player.x, dy = y - Game.player.y, d = Math.hypot(dx, dy); if (d < 10) return true; T.steer(dx / d, dy / d); return false; }, 600);
    walkTo(A.e.x + 20, A.e.y); walkTo(A.w.x, A.w.y); walkTo(f.x, f.y); T.unsteer();
    const label = T.label(); T.act(); T.step(30);
    return { label, area: Game.area };
  });
  t.expectEq(out.label, '🚶 Go up the stairs', 'walked from Line 2 to the stairs');
  t.expectEq(out.area, 'city', 'up into the City');

  // ---- rescues: pushed into a Line 2 pillar or into the dividing wall, the chef lands at the foot of the stairs
  const resc = await t.ev(() => {
    const S = CFG.SUBWAY.STATION, f = S.stairs.foot, out = [];
    for (const [x, y] of [S.L2.pillars[1], [(S.divider.x0 + S.divider.x1) / 2, 2350], [(S.L2.candy.x0 + S.L2.candy.x1) / 2, 2180]]) {
      T.tp(f.x, f.y, 'subway'); Game.player.x = x; Game.player.y = y; T.step(2);
      out.push(Math.hypot(Game.player.x - f.x, Game.player.y - f.y) < 2);
    }
    return out;
  });
  t.expect(resc.every(Boolean), `rescued out of the pillar, the wall and the candy stand (${resc})`);

  // ---- Take me home mid-boarding on Line 2
  await t.ev(() => { const s = CFG.SUBWAY.STATION.L2.stand; T.tp(s.x, s.y, 'subway'); T.until(() => SubwayExt.st.train2.state === 'stopped' && SubwayExt.st.train2.doors >= 1, 1500); const d = SubwayExt.doorSpots(undefined, 2)[0]; T.tp(d.x, d.y); T.act(); T.step(10); Game.goHome(); T.step(2); });
  t.expect(await t.ev(() => Game.area === 'town' && !Game.travel && !SubwayExt.st.boarding), 'take me home works mid-boarding on Line 2');
  await t.ev(() => { T.tp(CFG.SUBWAY.STATION.L2.stand.x, 2340, 'subway'); Game.goHome(); T.step(2); });
  t.expect(await t.ev(() => Game.area === 'town' && !SubwayExt.st.alight), "take me home works from Line 2's platform");

  // ---- stuck detector over Line 2's hall and the arch
  const report = await t.ev(() => {
    const S = CFG.SUBWAY.STATION, F = S.L2.floor, R = { x0: S.divider.x0 - 40, y0: F.y0, x1: F.x1, y1: F.y1 };
    const hit = (x, y) => Game.obstacles().some((o) => Game.hitRect(x, y, 12, o));
    const stuck = [], flung = []; let sampled = 0;
    T.tp(S.stairs.foot.x, S.stairs.foot.y, 'subway'); SubwayExt.st.end = 'city';
    for (let y = R.y0 + 30; y < R.y1 - 20; y += 40) for (let x = R.x0 + 20; x < R.x1 - 20; x += 40) {
      Game.player.x = x; Game.player.y = y; Game.player.hasMoved = true; Game.player.moving = false; SubwayExt.st.boarding = null; SubwayExt.st.alight = null; Game.travel = null;
      if (hit(x, y)) continue;
      sampled++;
      let best = 0, worst = 0;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        Game.player.x = x; Game.player.y = y; T.steer(ax, ay); T.step(9); T.unsteer();
        const d = Math.hypot(Game.player.x - x, Game.player.y - y); best = Math.max(best, d); worst = Math.max(worst, d);
      }
      if (best < 2) stuck.push([x, y]);
      if (worst > 70) flung.push([x, y, Math.round(worst)]);
    }
    Game.goHome();
    return { sampled, stuck, flung };
  });
  t.expect(report.sampled > 60, `sampled enough of Line 2's hall (${report.sampled})`);
  t.expect(report.stuck.length === 0, `no stuck spots: ${JSON.stringify(report.stuck.slice(0, 8))}`);
  t.expect(report.flung.length === 0, `no flinging spots: ${JSON.stringify(report.flung.slice(0, 8))}`);

  // ---- the ride, both ways, by day and at dusk (slowed down so the pictures are mid-ride)
  const ride = async (label, to, tt) => {
    await t.ev(([to2, t2]) => {
      if (to2 === 'pizzapier') { const s = CFG.SUBWAY.STATION.L2.stand; T.tp(s.x, s.y, 'subway'); } else { const A = CFG.PIER.ARRIVE; T.tp(A.x, A.y, 'pizzapier'); }
      Game.startTravel(to2, 'pierline', 1); Game.travel.dur = 8; Game.travel.t = t2;
    }, [to, tt]);
    await t.wait(150); await t.shot(label);
    t.expect(await t.ev(() => !!Game.travel && Game.travel.via === 'pierline'), `${label}: the ride is playing`);
    await t.ev(() => { Game.travel.t = Game.travel.dur; T.step(2); Game.goHome(); T.step(1); });
  };
  await ride('ride-to-pier-tunnel', 'pizzapier', 1.4);
  await ride('ride-to-pier-sea', 'pizzapier', 5.6);
  await ride('ride-home-sea', 'subway', 1.6);
  await ride('ride-home-tunnel', 'subway', 5.8);
  await t.ev(() => AtmosphereExt.force({ phase: 'dusk' }));
  await ride('ride-to-pier-sea-dusk', 'pizzapier', 5.6);
  await ride('ride-home-tunnel-dusk', 'subway', 5.8);

  // ---- phone-sized looks
  await t.boot({ viewport: { width: 390, height: 844 } });
  await t.ev(() => { const s = CFG.SUBWAY.STATION.L2.stand; SubwayExt.st.end = 'city'; Game.s.subway.end = 'city'; T.tp(s.x, s.y, 'subway'); T.until(() => SubwayExt.st.train2.state === 'stopped', 1500); T.tp(7305, 2250); T.step(30); });
  await t.shot('station-phone');
  await t.ev(() => { T.tp(7420, 2370); T.step(2); });
  await t.shot('station-line2-phone');
  await ride('ride-to-pier-tunnel-phone', 'pizzapier', 1.4);
  await ride('ride-to-pier-sea-phone', 'pizzapier', 5.6);
  await ride('ride-home-sea-phone', 'subway', 1.6);
};
