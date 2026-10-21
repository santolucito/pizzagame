'use strict';
// The subway: down from the City, the train comes, ride to Columbia, up to the campus, and all the way back.
// Plus the stuck detector over the station floor and the campus, and screenshots of both new maps and the ride.
module.exports = async (t) => {
  await t.boot();

  // ---- the entrance in the City
  await t.ev(() => T.tp(5090, 622, 'city'));
  t.expectEq(await t.ev(() => T.label()), '🚇 Go down to the subway', 'subway entrance label in the City');
  t.expectEq(await t.ev(() => T.hint()), 'Go down to the subway! 🚇', 'hint by the City entrance');
  await t.ev(() => T.tp(5300, 700, 'city'));
  t.expect(await t.ev(() => T.label()) !== '🚇 Go down to the subway', 'no subway label away from the entrance');
  await t.ev(() => T.tp(5090, 622, 'city'));
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'subway', 'down in the station');
  t.expectEq(await t.ev(() => SubwayExt.st.end), 'city', 'the station is the City end');
  t.expect(await t.ev(() => Game.player.y > 2220 && Game.player.y < 2250), 'the chef stands at the foot of the stairs');
  t.expectEq(await t.ev(() => T.label()), '🚶 Go up the stairs', 'stairs label at the foot of the stairs');
  await t.shot('station-concourse');

  // ---- the train arrives soon after you reach the platform
  await t.ev(() => T.tp(CFG.SUBWAY.STATION.stand.x, CFG.SUBWAY.STATION.stand.y));
  t.expectEq(await t.ev(() => T.hint()), 'Wait on the platform for the subway', 'hint on the platform');
  const arrived = await t.ev(() => T.until(() => SubwayExt.st.train.state === 'stopped' && SubwayExt.st.train.doors >= 1, 1500));
  t.expect(arrived >= 0 && arrived <= 60 * 8, `the subway pulls in within 8 s of reaching the platform (took ${arrived} steps)`);
  t.expect(/Subway leaves in \d+s/.test(await t.ev(() => T.hint())), 'countdown hint while the train waits');
  await t.ev(() => { const d = SubwayExt.doorSpots()[2]; T.tp(d.x, d.y); });
  t.expectEq(await t.ev(() => T.label()), '🚇 Ride the subway', 'boarding label by an open door');
  await t.shot('station-train');

  // ---- ride to Columbia
  await t.ev(() => { T.toasts.length = 0; T.act(); });
  t.expect(await t.ev(() => T.until(() => !!Game.travel && Game.travel.via === 'subway', 120)) >= 0, 'boarding starts the subway ride');
  await t.wait(300); await t.shot('ride');
  await t.ev(() => T.until(() => Game.area === 'subway' && !Game.travel && SubwayExt.st.end === 'campus', 3000));
  t.expectEq(await t.ev(() => SubwayExt.st.end), 'campus', 'arrived at the Columbia end');
  t.expect(await t.ev(() => T.toasts.includes('🎓 Welcome to Columbia!')), 'welcome toast at Columbia');
  t.expectEq(await t.ev(() => SubwayExt.st.train.state), 'stopped', 'the train that brought you waits at the platform');
  await t.ev(() => T.step(60));
  t.expect(await t.ev(() => Game.player.y < CFG.SUBWAY.STATION.edge), 'the chef stepped out onto the platform');
  t.expectEq(await t.ev(() => T.hint()), 'Up the stairs to the campus 🎓', 'hint points up the stairs after arriving');

  // ---- up the stairs onto the campus
  await t.ev(() => { const f = CFG.SUBWAY.STATION.stairs.foot; T.tp(f.x, f.y); });
  t.expectEq(await t.ev(() => T.label()), '🚶 Go up the stairs', 'stairs label at the campus end');
  await t.ev(() => { T.toasts.length = 0; T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'campus', 'on the campus');
  t.expect(await t.ev(() => T.toasts.length === 1), 'one important toast the first time on campus');
  t.expectEq(await t.ev(() => Game.s.subway.seenCampus), true, 'first campus visit remembered in the save');
  const spot = await t.ev(() => ({ x: Game.player.x, y: Game.player.y, A: CFG.SUBWAY.CAMPUS.ARRIVE }));
  t.expect(Math.abs(spot.x - spot.A.x) < 2 && Math.abs(spot.y - spot.A.y) < 2, 'the chef comes up at the campus entrance');
  t.expectEq(await t.ev(() => T.hint()), 'Subway home 🚇', 'hint right by the campus entrance');
  await t.ev(() => T.tp(10300, 500));
  t.expectEq(await t.ev(() => T.hint()), 'Explore the campus! 🎓', 'explore hint on the campus');
  await t.shot('campus-columbia');
  await t.ev(() => T.tp(9330, 500));
  await t.shot('campus-barnard');
  // the giant slice: stand still by the stand for a moment
  await t.ev(() => { const S = CFG.SUBWAY.CAMPUS.CU.slice; T.tp(S.x, S.y + 40); T.step(100); });
  t.expect(await t.ev(() => Game.floats.some((f) => /Giant slice/.test(f.text))), 'standing by the stand gets you a giant slice');

  // ---- walk to the campus entrance (from the south, up the median) and go back down
  await t.ev(() => { T.tp(9775, 700); T.steer(0, -1); T.until(() => T.label() === '🚇 Go down to the subway', 400); T.unsteer(); });
  t.expectEq(await t.ev(() => T.label()), '🚇 Go down to the subway', 'walked up to the campus entrance');
  await t.ev(() => { T.act(); T.step(30); });
  t.expect(await t.ev(() => Game.area === 'subway' && SubwayExt.st.end === 'campus'), 'back down in the campus station');
  await t.ev(() => T.tp(CFG.SUBWAY.STATION.stand.x, CFG.SUBWAY.STATION.stand.y));
  t.expect(await t.ev(() => T.until(() => SubwayExt.st.train.state === 'stopped' && SubwayExt.st.train.doors >= 1, 1500)) >= 0, 'a train comes for the ride home');
  await t.ev(() => { const d = SubwayExt.doorSpots()[1]; T.tp(d.x, d.y); });
  t.expectEq(await t.ev(() => T.label()), '🚇 Ride the subway', 'boarding label for the ride home');
  await t.ev(() => { T.toasts.length = 0; T.act(); T.until(() => Game.area === 'subway' && !Game.travel && SubwayExt.st.end === 'city', 3000); T.step(60); });
  t.expectEq(await t.ev(() => SubwayExt.st.end), 'city', 'back at the City end');
  t.expect(await t.ev(() => T.toasts.includes('🏙️ Back in the City!')), 'back-in-the-City toast');
  await t.ev(() => { const f = CFG.SUBWAY.STATION.stairs.foot; T.tp(f.x, f.y); T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'up the stairs into the City');
  const back = await t.ev(() => ({ x: Game.player.x, y: Game.player.y }));
  t.expect(Math.abs(back.x - 5090) < 2 && Math.abs(back.y - 606) < 2, 'came up at the City entrance');

  // ---- 'Take me home' clears any ride state
  await t.ev(() => { T.tp(CFG.SUBWAY.STATION.stand.x, CFG.SUBWAY.STATION.stand.y, 'subway'); T.until(() => SubwayExt.st.train.state === 'stopped' && SubwayExt.st.train.doors >= 1, 1500); const d = SubwayExt.doorSpots()[0]; T.tp(d.x, d.y); T.act(); T.step(10); Game.goHome(); T.step(2); });
  t.expect(await t.ev(() => Game.area === 'town' && !Game.travel && !SubwayExt.st.boarding), 'take me home works mid-boarding');

  // ---- stuck detector over the station floor and the whole campus
  const report = await t.ev(() => {
    const out = {}, S = CFG.SUBWAY.STATION, rects = { subway: { x0: S.floor.x0, y0: S.floor.y0, x1: S.floor.x1, y1: S.floor.y1 }, campus: CFG.SUBWAY.CAMPUS.WORLD };
    const hit = (x, y) => Game.obstacles().some((o) => Game.hitRect(x, y, 12, o));
    for (const [area, R] of Object.entries(rects)) {
      const stuck = [], flung = []; let sampled = 0;
      Game.area = area; SubwayExt.st.boarding = null; SubwayExt.st.alight = null;
      for (let y = R.y0 + 30; y < R.y1 - 30; y += 48) for (let x = R.x0 + 30; x < R.x1 - 30; x += 48) {
        Game.player.x = x; Game.player.y = y; Game.player.hasMoved = true; Game.player.moving = false; Game.onTrain = false; Game.ride = null; Game.fishing = null; Game.travel = null;
        if (hit(x, y)) continue;
        sampled++;
        let best = 0, worst = 0;
        for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          Game.player.x = x; Game.player.y = y; T.steer(ax, ay); T.step(9); T.unsteer();
          const d = Math.hypot(Game.player.x - x, Game.player.y - y);
          best = Math.max(best, d); worst = Math.max(worst, d);
        }
        if (best < 2) stuck.push([x, y]);
        if (worst > 70) flung.push([x, y, Math.round(worst)]);
      }
      out[area] = { sampled, stuck, flung };
    }
    Game.area = 'town'; Game.player.x = 540; Game.player.y = 430; Game.cameraSnap = true;
    return out;
  });
  for (const [area, r] of Object.entries(report)) {
    t.expect(r.sampled > 20, `${area}: sampled enough walkable spots (${r.sampled})`);
    t.expect(r.stuck.length === 0, `${area}: no stuck spots, found ${r.stuck.length}: ${JSON.stringify(r.stuck.slice(0, 8))}`);
    t.expect(r.flung.length === 0, `${area}: no spots that fling the chef, found ${r.flung.length}: ${JSON.stringify(r.flung.slice(0, 8))}`);
  }

  // ---- phone-sized looks
  await t.boot({ viewport: { width: 390, height: 844 } });
  await t.ev(() => { T.tp(CFG.SUBWAY.STATION.stand.x, CFG.SUBWAY.STATION.stand.y, 'subway'); T.until(() => SubwayExt.st.train.state === 'stopped', 1500); T.step(40); });
  await t.shot('station-phone');
  await t.ev(() => { T.tp(10300, 500, 'campus'); T.step(30); });
  await t.shot('campus-phone');
};
