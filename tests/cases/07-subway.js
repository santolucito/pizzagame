'use strict';
// The subway: down from the City, the train comes, ride to Columbia, up to the campus, and all the way back; the street
// stairs read the right way round (the chef stands at the top of a flight going down); inside Low Library (bell, book,
// globe) and Barnard Hall (bear, cocoa, notices) with rescue and take-me-home; the stuck detector over every map; shots.
module.exports = async (t) => {
  await t.boot();

  // ---- the entrance in the City (its spot comes from CFG.CITY.SUBWAY, which the subway owns)
  await t.ev(() => { const e = SubwayExt.cityEntrance(); T.tp(e.x, e.y + 16, 'city'); });
  t.expectEq(await t.ev(() => T.label()), '🚇 Go down to the subway', 'subway entrance label in the City');
  t.expectEq(await t.ev(() => T.hint()), 'Go down to the subway! 🚇', 'hint by the City entrance');
  await t.ev(() => T.tp(5300, 700, 'city'));
  t.expect(await t.ev(() => T.label()) !== '🚇 Go down to the subway', 'no subway label away from the entrance');
  await t.ev(() => { const e = SubwayExt.cityEntrance(); T.tp(e.x, e.y + 16, 'city'); });
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
  const back = await t.ev(() => { const e = SubwayExt.cityEntrance(); return { x: Game.player.x, y: Game.player.y, e }; });
  t.expect(Math.abs(back.x - back.e.x) < 2 && Math.abs(back.y - back.e.y) < 2, 'came up at the City entrance (the top of the stairs)');

  // ---- the stairs read the right way round: the chef stands on the landing at the TOP of a flight that runs away from
  // them down into the ground (the opening is at the far end, the smaller y), and the station's flight climbs away from the foot
  const art = await t.ev(() => { const E = CFG.CITY.SUBWAY, K = CFG.SUBWAY.CAMPUS; return { city: SubwayExt.entranceArt(E.x, E.y), cityStand: SubwayExt.cityEntrance(), campus: SubwayExt.entranceArt(K.SUBWAY.x, K.SUBWAY.y), arrive: K.ARRIVE, station: CFG.SUBWAY.STATION.stairs }; });
  for (const [name, A, stand] of [['City', art.city, art.cityStand], ['campus', art.campus, art.arrive]]) {
    t.expect(stand.y >= A.top && A.top === A.stairs.y1, `${name}: the chef stands at the top step, on the near end of the flight`);
    t.expect(A.opening.y < A.stairs.y0 && A.stairs.y0 < A.top, `${name}: the opening in the ground is at the far end of the flight, away from the chef`);
    t.expect(Math.abs(stand.x - A.stand.x) < 1 && Math.abs(stand.y - A.stand.y) < 1, `${name}: the standing spot is the one the art is built around`);
  }
  t.expect(art.station.foot.y > art.station.y1, 'station: the chef stands at the foot and the stairs climb away to the street');
  await t.ev(() => { Render.setZoom(2); const e = SubwayExt.cityEntrance(); T.tp(e.x, e.y, 'city'); T.step(2); });
  await t.shot('city-entrance');
  await t.ev(() => { const a = CFG.SUBWAY.CAMPUS.ARRIVE; T.tp(a.x, a.y, 'campus'); T.step(2); });
  await t.shot('campus-entrance');
  await t.ev(() => { const f = CFG.SUBWAY.STATION.stairs.foot; T.tp(f.x, f.y, 'subway'); T.step(2); });
  await t.shot('station-stairs');
  await t.ev(() => Render.setZoom(1));

  // ---- into Low Library
  const inside = (K) => (h) => h && (h.target === null || (h.target.x > K.WORLD.x0 && h.target.x < K.WORLD.x1 && h.target.y > K.WORLD.y0 && h.target.y < K.WORLD.y1));
  await t.ev(() => { const D = CFG.SUBWAY.LOW.DOOR; T.tp(D.x - 60, D.y + 10, 'campus'); });   // along the colonnade (Alma Mater sits right below the door)
  t.expectEq(await t.ev(() => T.hint()), 'Go inside Low Library 📚', 'library hint near its door');
  await t.ev(() => { const D = CFG.SUBWAY.LOW.DOOR; T.tp(D.x, D.y, 'campus'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'library door label');
  await t.ev(() => { T.toasts.length = 0; T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'lowlibrary', 'inside Low Library');
  t.expect(await t.ev(() => T.toasts.length === 1 && Game.s.subway.seenLow), 'one important toast the first time in the library, remembered in the save');
  t.expect(await t.ev(() => { const E = CFG.SUBWAY.LOW.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - E.y) < 20; }), 'arrived on the exit mat inside');
  const lowHint = await t.ev(() => Game.hint);
  t.expect(inside(await t.ev(() => CFG.SUBWAY.LOW))(lowHint) && lowHint.text === 'Ring the little desk bell 🔔', `library hint points at the bell (${JSON.stringify(lowHint)})`);
  await t.shot('low-library');
  // ring the bell: the librarian shushes
  await t.ev(() => { const B = CFG.SUBWAY.LOW.BELL.spot; T.tp(B.x, B.y, 'lowlibrary'); });
  t.expectEq(await t.ev(() => T.label()), '🔔 Ring the bell', 'bell label at the desk');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => Game.floats.some((f) => /Ding/.test(f.text)) && SubwayExt.st.low.shush > 0 && SubwayExt.st.low.goals.bell), 'the bell dings and the librarian shushes');
  t.expectEq(await t.ev(() => T.hint()), 'Sit down and read a book 📖', 'hint moves on to the reading chair');
  // sit at the reading table: the book opens and its pages turn by themselves
  await t.ev(() => { const c = CFG.SUBWAY.LOW.TABLES[0].free; T.tp(c.x, c.y, 'lowlibrary'); });
  t.expectEq(await t.ev(() => T.label()), '📖 Sit and read', 'sit label at the free chair');
  await t.ev(() => { T.act(); T.step(5); });
  t.expect(await t.ev(() => !!SubwayExt.st.low.read), 'seated and reading');
  t.expectEq(await t.ev(() => T.label()), '🚶 Stand up', 'stand-up label while reading');
  t.expectEq(await t.ev(() => T.hint()), 'Enjoy the story! 📖', 'reading hint');
  const seated = await t.ev(() => { const c = CFG.SUBWAY.LOW.TABLES[0].free; T.steer(1, 1); T.step(200); T.unsteer(); return { d: Math.hypot(Game.player.x - c.x, Game.player.y - c.y), page: SubwayExt.st.low.read.page }; });
  t.expect(seated.d < 1, 'the chef stays on the chair while reading');
  t.expect(seated.page > 0, 'the pages turn by themselves');
  await t.shot('low-reading');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !SubwayExt.st.low.read), 'stood up again');
  // spin the globe
  await t.ev(() => { const G = CFG.SUBWAY.LOW.GLOBE; T.tp(G.x - 36, G.y, 'lowlibrary'); });
  t.expectEq(await t.ev(() => T.label()), '🌍 Spin the globe', 'globe label');
  await t.ev(() => { T.act(); T.step(30); });
  t.expect(await t.ev(() => SubwayExt.st.low.globe.v > 0 && SubwayExt.st.low.globe.a > 0), 'the globe spins');
  t.expectEq(await t.ev(() => T.hint()), 'Back out to the campus 🚪', 'all done: the hint shows the way out');
  // pushed into the desk: rescued onto the exit mat
  await t.ev(() => { const D = CFG.SUBWAY.LOW.DESK; Game.player.x = (D.x0 + D.x1) / 2; Game.player.y = (D.y0 + D.y1) / 2; T.step(3); });
  t.expect(await t.ev(() => { const E = CFG.SUBWAY.LOW.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - E.y) < 2; }), 'rescued from the desk onto the exit mat');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => { const D = CFG.SUBWAY.LOW.DOOR; return Game.area === 'campus' && Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'back outside at the library door');
  // take me home from the reading chair
  await t.ev(() => { const D = CFG.SUBWAY.LOW.DOOR; T.tp(D.x, D.y, 'campus'); T.act(); T.step(2); const c = CFG.SUBWAY.LOW.TABLES[0].free; T.tp(c.x, c.y, 'lowlibrary'); T.act(); T.step(2); Game.goHome(); T.step(2); });
  t.expect(await t.ev(() => Game.area === 'town' && !SubwayExt.st.low.read), 'take me home works from the reading chair');

  // ---- into Barnard Hall
  await t.ev(() => { const D = CFG.SUBWAY.BARNARD.DOOR; T.tp(D.x, D.y + 50, 'campus'); });
  t.expectEq(await t.ev(() => T.hint()), 'Go inside Barnard Hall 🐻', 'hall hint near its door');
  await t.ev(() => { const D = CFG.SUBWAY.BARNARD.DOOR; T.tp(D.x, D.y, 'campus'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'hall door label');
  await t.ev(() => { T.toasts.length = 0; T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'barnardhall', 'inside Barnard Hall');
  t.expect(await t.ev(() => T.toasts.length === 1 && Game.s.subway.seenBarnard), 'one important toast the first time in the hall');
  const bcHint = await t.ev(() => Game.hint);
  t.expect(inside(await t.ev(() => CFG.SUBWAY.BARNARD))(bcHint) && bcHint.text === 'High-five Millie the bear! 🐻', `hall hint points at the bear (${JSON.stringify(bcHint)})`);
  await t.shot('barnard-hall');
  // high-five the bear
  await t.ev(() => { const B = CFG.SUBWAY.BARNARD.BEAR; T.tp(B.x, B.y + 34, 'barnardhall'); });
  t.expectEq(await t.ev(() => T.label()), '🐻 High-five Millie!', 'high-five label by the bear');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => SubwayExt.st.bc.paw > 0 && Game.floats.some((f) => /High five/.test(f.text))), 'the bear high-fives back');
  // a $4 cocoa at the café corner
  const cocoa = await t.ev(() => {
    Game.s.cash = 20; const P = CFG.SUBWAY.BARNARD.CAFE.pad; T.tp(P.x, P.y, 'barnardhall');
    const n = T.until(() => SubwayExt.st.bc.cocoa > 0, 400);
    return { n, cash: Game.s.cash, cocoas: Game.s.stats.cocoas, hint: T.hint() };
  });
  t.expect(cocoa.n >= 0, 'the cocoa circle served a cocoa');
  t.expectEq(cocoa.cash, 16, 'cocoa cost $4');
  t.expectEq(cocoa.cocoas, 1, 'cocoa counted in the stats');
  t.expectEq(cocoa.hint, 'See what is on the notice board 📌', 'hint moves on to the notice board');
  // the notice board: each press shows the next notice
  await t.ev(() => { const B = CFG.SUBWAY.BARNARD.BOARD.spot; T.tp(B.x, B.y, 'barnardhall'); });
  t.expectEq(await t.ev(() => T.label()), '📌 Read the notices', 'notice board label');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => SubwayExt.st.bc.note === 0 && SubwayExt.st.bc.noteT > 0), 'the first notice pops up');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => SubwayExt.st.bc.note), 1, 'the next press shows the next notice');
  t.expectEq(await t.ev(() => T.hint()), 'Back out to the campus 🚪', 'all done in the hall: the hint shows the way out');
  await t.shot('barnard-notice');
  // pushed into the counter: rescued onto the exit mat
  await t.ev(() => { const C = CFG.SUBWAY.BARNARD.CAFE.counter; Game.player.x = (C.x0 + C.x1) / 2; Game.player.y = (C.y0 + C.y1) / 2; T.step(3); });
  t.expect(await t.ev(() => { const E = CFG.SUBWAY.BARNARD.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - E.y) < 2; }), 'rescued from the counter onto the exit mat');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'hall exit label');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => { const D = CFG.SUBWAY.BARNARD.DOOR; return Game.area === 'campus' && Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'back outside at the hall door');
  await t.ev(() => { T.act(); T.step(2); SubwayExt.readNotice(Game); Game.goHome(); T.step(2); });
  t.expect(await t.ev(() => Game.area === 'town' && SubwayExt.st.bc.note === -1), 'take me home works from inside the hall');

  // ---- 'Take me home' clears any ride state
  await t.ev(() => { T.tp(CFG.SUBWAY.STATION.stand.x, CFG.SUBWAY.STATION.stand.y, 'subway'); T.until(() => SubwayExt.st.train.state === 'stopped' && SubwayExt.st.train.doors >= 1, 1500); const d = SubwayExt.doorSpots()[0]; T.tp(d.x, d.y); T.act(); T.step(10); Game.goHome(); T.step(2); });
  t.expect(await t.ev(() => Game.area === 'town' && !Game.travel && !SubwayExt.st.boarding), 'take me home works mid-boarding');

  // ---- stuck detector over the station floor and the whole campus
  const report = await t.ev(() => {
    const out = {}, S = CFG.SUBWAY.STATION, rects = { subway: { x0: S.floor.x0, y0: S.floor.y0, x1: S.floor.x1, y1: S.floor.y1 }, campus: CFG.SUBWAY.CAMPUS.WORLD, lowlibrary: CFG.SUBWAY.LOW.ROOM, barnardhall: CFG.SUBWAY.BARNARD.ROOM };
    const hit = (x, y) => Game.obstacles().some((o) => Game.hitRect(x, y, 12, o));
    for (const [area, R] of Object.entries(rects)) {
      const stuck = [], flung = []; let sampled = 0;
      Game.area = area; SubwayExt.st.boarding = null; SubwayExt.st.alight = null; SubwayExt.st.low.read = null;
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
  await t.ev(() => { const E = CFG.SUBWAY.LOW.EXIT; T.tp(E.x, E.y - 60, 'lowlibrary'); T.step(2); });
  await t.shot('low-library-phone');
  await t.ev(() => { const E = CFG.SUBWAY.BARNARD.EXIT; T.tp(E.x, E.y - 60, 'barnardhall'); T.step(2); });
  await t.shot('barnard-hall-phone');
  await t.ev(() => { const e = SubwayExt.cityEntrance(); T.tp(e.x, e.y, 'city'); T.step(2); });
  await t.shot('city-entrance-phone');
  await t.ev(() => { const a = CFG.SUBWAY.CAMPUS.ARRIVE; T.tp(a.x, a.y, 'campus'); T.step(2); });
  await t.shot('campus-entrance-phone');
};
