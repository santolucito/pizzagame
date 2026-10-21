'use strict';
// The school in the City: the door's label and hint on the sidewalk (clear of the sports car lot), going inside (welcome
// toast, no stray hint), the chalkboard (draw doodles, the sponge wipes them, a full board wipes itself), the recess
// bell (the kids run rings and go back to their desks), show-and-tell with a pizza, the reading rug (the teacher comes
// over, the pages turn, stand up), the xylophone scale, the $3 gold star on the hat, a rescue from a wall,
// Take-me-home from inside, and going back out onto the door spot.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/city-school.js into index.html, load it into the booted page
  if (await t.ev(() => typeof SchoolExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-school.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof SchoolExt !== 'undefined' && !!CFG.AREAS.school), 'the school extension and its map are registered');
  t.expect(await t.ev(() => Game.ext.indexOf(SchoolExt) < Game.ext.indexOf(CityExt)), 'the school answers before the City');
  t.expect(await t.ev(() => { const b = CFG.CITY.BUILDINGS[CFG.SCHOOL.BUILDING], D = CFG.SCHOOL.DOOR_OUT; return b.sign === 'SCHOOL' && D.x === (b.x0 + b.x1) / 2 && D.y === b.y1 + 14; }), 'the door spot is on the sidewalk below the SCHOOL building');
  t.expect(await t.ev(() => { const W = CFG.SCHOOL.WORLD; return W.x0 === 13100 && W.y0 === 3000 && W.x1 === 13700 && W.y1 === 3400; }), 'the interior uses the rectangle reserved for building 16');
  t.expect(await t.ev(() => Math.hypot(CFG.SCHOOL.DOOR_OUT.x - CFG.SPORTS.PAD.x, CFG.SCHOOL.DOOR_OUT.y - CFG.SPORTS.PAD.y) > 120), 'the door spot keeps clear of the sports car pad');

  // ---- the door on Harbour Street
  await t.ev(() => { const D = CFG.SCHOOL.DOOR_OUT; T.tp(D.x + 50, D.y, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Go to school! 🏫', 'school hint near the door');
  t.expect(await t.ev(() => { const D = CFG.SCHOOL.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  await t.ev(() => { T.tp(5600, 300, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => SchoolExt.hint(Game)), undefined, 'no school hint elsewhere in the City');
  t.expectEq(await t.ev(() => { const P = CFG.SPORTS.PAD; T.tp(P.x, P.y, 'city'); T.step(1); return SchoolExt.hint(Game); }), undefined, 'no school hint on the sports car pad');
  t.expectEq(await t.ev(() => { T.tp(540, 430, 'town'); T.step(1); return SchoolExt.hint(Game); }), undefined, 'no school hint in the town');
  await t.ev(() => { Render.setZoom(1.2); const D = CFG.SCHOOL.DOOR_OUT; T.tp(D.x, D.y, 'city'); T.step(2); });
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  t.expect(await t.ev(() => Game.hint && Game.hint.target === null), 'no arrow while standing on the door spot');
  await t.shot('door');

  // ---- go inside
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'school', 'inside the school');
  t.expect(await t.ev(() => T.toasts.some((m) => m.startsWith('🏫 Welcome to school'))), 'welcome toast the first time');
  t.expect(await t.ev(() => SchoolExt.free(Game.player.x, Game.player.y)), 'standing on the floor by the door');
  t.expectEq(await t.ev(() => T.hint()), 'Draw on the chalkboard! ✏️', 'chalkboard hint first');
  t.expect(await t.ev(() => { const h = Game.hint, W = CFG.SCHOOL.WORLD; return !!h.target && h.target.x > W.x0 && h.target.x < W.x1 && h.target.y > W.y0 && h.target.y < W.y1; }), 'the hint arrow points inside the room');
  t.expect(await t.ev(() => Game.obstacles().length >= 12), 'the room has walls and furniture');
  await t.ev(() => { Render.setZoom(1); T.tp(13400, 3240, 'school'); T.step(2); });
  await t.shot('classroom');

  // ---- the kids wave when the chef comes near
  const wave = await t.ev(() => { T.tp(13290, 3240, 'school'); T.step(40); return SchoolExt.st.kids.map((k) => k.wave); });
  t.expect(wave.some((w) => w > 0.9), `a pupil waves at the chef (${JSON.stringify(wave)})`);

  // ---- the chalkboard: doodles pile up, the sponge end wipes, a full board wipes itself
  await t.ev(() => { const B = CFG.SCHOOL.BOARD; T.tp((B.x0 + B.x1) / 2, 3126, 'school'); T.step(2); });
  t.expect(await t.ev(() => SchoolExt.free(Game.player.x, Game.player.y)), 'the strip in front of the board is free floor');
  t.expectEq(await t.ev(() => T.label()), '✏️ Draw with chalk', 'chalk label in front of the board');
  await t.ev(() => { T.act(); T.step(20); T.act(); T.step(20); T.act(); T.step(40); });
  const board = await t.ev(() => ({ n: SchoolExt.st.board.length, kinds: SchoolExt.st.board.map((d) => d.kind), drawn: Game.s.school.drawn, hint: T.hint() }));
  t.expectEq(board.n, 3, 'three doodles on the board');
  t.expectEq(board.kinds.join(','), 'sun,pizza,cat', 'the doodles cycle sun, pizza, cat');
  t.expectEq(board.drawn, 3, 'drawings counted');
  t.expectEq(board.hint, 'Ring the bell for recess! 🔔', 'bell hint after drawing');
  await t.shot('chalkboard');
  await t.ev(() => { T.tp(CFG.SCHOOL.SPONGE_X + 24, 3126, 'school'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🧽 Wipe the board', 'sponge label at the right end of the tray');
  await t.ev(() => { T.act(); T.step(5); });
  t.expectEq(await t.ev(() => SchoolExt.st.board.length), 0, 'the board is wiped');
  t.expectEq(await t.ev(() => T.label()), '✏️ Draw with chalk', 'an empty board offers chalk even at the sponge end');
  const full = await t.ev(() => { const B = CFG.SCHOOL.BOARD; T.tp(B.x0 + 40, 3126, 'school'); T.step(2); for (let i = 0; i < 8; i++) { T.act(); T.step(3); } const n = SchoolExt.st.board.length, label = T.label(); T.act(); T.step(3); return { n, label, after: SchoolExt.st.board.length, slots: new Set(SchoolExt.st.board.map((d) => d.slot)).size }; });
  t.expectEq(full.n, 8, 'eight doodles fill the board');
  t.expectEq(full.label, '🧽 Wipe the board', 'a full board offers the sponge');
  t.expectEq(full.after, 0, 'pressing again wipes the full board');

  // ---- the recess bell: the kids leave their desks, run rings and come back
  await t.ev(() => { const B = CFG.SCHOOL.BELL_SPOT; T.tp(B.x, B.y, 'school'); T.step(2); });
  t.expect(await t.ev(() => SchoolExt.free(Game.player.x, Game.player.y)), 'the bell spot is free floor');
  t.expectEq(await t.ev(() => T.label()), '🔔 Ring the bell', 'bell label at the teacher’s desk');
  await t.ev(() => { T.act(); T.step(90); });
  const recess = await t.ev(() => { const S = CFG.SCHOOL; return { on: SchoolExt.st.recess > 0, hint: T.hint(), label: T.label(), rang: Game.s.school.rang, away: SchoolExt.st.kids.map((k, i) => Math.hypot(k.x - S.DESKS[S.KIDS[i].desk].x, k.y - (S.DESKS[S.KIDS[i].desk].y - 14))) }; });
  t.expect(recess.on && recess.rang === 1, 'recess is on');
  t.expectEq(recess.hint, 'Recess! Everybody run! 🔔', 'recess hint');
  t.expect(recess.label !== '🔔 Ring the bell', 'the bell waits until recess is over');
  t.expect(recess.away.every((d) => d > 25), `every pupil left the desks (${recess.away.map((d) => Math.round(d)).join(',')})`);
  await t.shot('recess');
  const back = await t.ev(() => { const S = CFG.SCHOOL; T.step(300); return { on: SchoolExt.st.recess > 0, away: SchoolExt.st.kids.map((k, i) => Math.hypot(k.x - S.DESKS[S.KIDS[i].desk].x, k.y - (S.DESKS[S.KIDS[i].desk].y - 14))), label: T.label() }; });
  t.expect(!back.on && back.away.every((d) => d < 1), 'after 5 s the pupils are back at their desks');
  t.expectEq(back.label, '🔔 Ring the bell', 'the bell can be rung again');

  // ---- show and tell: a pizza goes on the table
  await t.ev(() => { Game.player.carry = 2; const P = CFG.SCHOOL.SHOW_SPOT; T.tp(P.x, P.y, 'school'); T.step(2); });
  t.expect(await t.ev(() => SchoolExt.free(Game.player.x, Game.player.y)), 'the show-and-tell spot is free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Sit on the rug for a story 📖', 'story hint comes before show and tell');
  t.expectEq(await t.ev(() => T.label()), '🍕 Show and tell', 'show-and-tell label with a pizza');
  await t.ev(() => { T.act(); T.step(30); });
  const show = await t.ev(() => ({ carry: Game.player.carry, shown: SchoolExt.st.shown, n: Game.s.school.shown, wow: Game.floats.some((f) => f.text === 'Wow! 🍕'), label: T.label() }));
  t.expectEq(show.carry, 1, 'one pizza went on the table');
  t.expect(show.shown && show.n === 1 && show.wow, 'the class says Wow!');
  t.expectEq(show.label, '🍕 Show and tell', 'another pizza can be shown');
  await t.ev(() => { Game.player.carry = 0; T.step(1); });
  t.expect(await t.ev(() => T.label() !== '🍕 Show and tell'), 'no show-and-tell button without a pizza');
  await t.shot('show-and-tell');

  // ---- story time on the rug: the teacher comes over, the pages turn, the chef stays put, then stands up
  await t.ev(() => { const S = CFG.SCHOOL.SIT; T.tp(S.x, S.y, 'school'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '📖 Story time', 'story label on the rug');
  await t.ev(() => { T.act(); T.step(5); });
  t.expect(await t.ev(() => !!SchoolExt.st.read), 'sitting on the rug');
  t.expectEq(await t.ev(() => T.label()), '🚶 Stand up', 'stand-up label while sitting');
  t.expectEq(await t.ev(() => T.hint()), 'Story time! 📖', 'story hint');
  const seated = await t.ev(() => { const S = CFG.SCHOOL.SIT; T.steer(1, 1); T.step(60); T.unsteer(); return Math.hypot(Game.player.x - S.x, Game.player.y - S.y); });
  t.expect(seated < 1, 'the chef stays on the rug while the story is read');
  const story = await t.ev(() => { const n = T.until(() => SchoolExt.st.read.page >= 2, 900); return { n, page: SchoolExt.st.read.page, teacherNear: Math.hypot(SchoolExt.st.teacher.x - CFG.SCHOOL.READ_SPOT.x, SchoolExt.st.teacher.y - CFG.SCHOOL.READ_SPOT.y) < 2 }; });
  t.expect(story.n >= 0 && story.teacherNear, `the teacher came over and turned the pages (${JSON.stringify(story)})`);
  await t.shot('story');
  const end = await t.ev(() => { const n = T.until(() => SchoolExt.st.read.done, 1200); return { n, page: SchoolExt.st.read.page, hint: T.hint() }; });
  t.expect(end.n >= 0 && end.page === 4, 'the story reached The End');
  t.expectEq(end.hint, 'The End! Press the button to stand up', 'end-of-story hint');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !SchoolExt.st.read && Game.s.school.reads === 1), 'stood up');
  t.expectEq(await t.ev(() => { T.step(60); return T.hint(); }), 'Walk along the xylophone 🎵', 'xylophone hint after the story');

  // ---- the xylophone: each bar you step on plays its note
  const xylo = await t.ev(() => { const X = CFG.SCHOOL.XYLO; T.tp(X.x0 - 20, X.y, 'school'); T.step(2); const before = Game.s.school.xylo; T.steer(1, 0); T.step(110); T.unsteer(); return { before, after: Game.s.school.xylo, x: Game.player.x, last: SchoolExt.st.xylo, hint: T.hint() }; });
  t.expect(xylo.before === 0 && xylo.after >= 6, `walking along the bars played the scale (${xylo.after} notes, x=${Math.round(xylo.x)})`);
  t.expect(xylo.last === -1 || xylo.last >= 5, 'reached the high end of the xylophone');

  // ---- the gold star pad: $3 sticks a star on the hat for a while
  const star = await t.ev(() => { Game.s.cash = 10; const P = CFG.SCHOOL.PADS.star; T.tp(P.x, P.y, 'school'); const n = T.until(() => SchoolExt.st.star > 0, 400); return { n, cash: Game.s.cash, star: SchoolExt.st.star, stars: Game.s.school.stars, hint: T.hint() }; });
  t.expect(star.n >= 0, 'the star pad stuck a star on the hat');
  t.expectEq(star.cash, 7, 'the gold star cost $3');
  t.expect(star.star > 25 && star.stars === 1, 'the star lasts about 30 s and is counted');
  t.expectEq(star.hint, 'A gold star on your hat! ⭐', 'star hint');
  await t.ev(() => { T.tp(13400, 3250, 'school'); T.step(2); });
  await t.shot('gold-star');

  // ---- phone-size classroom
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.tp(13380, 3240, 'school'); T.step(2); });
  await t.shot('classroom-phone');
  await t.ev(() => { const S = CFG.SCHOOL.SIT; T.tp(S.x, S.y, 'school'); T.act(); T.until(() => !SchoolExt.st.teacher.moving && SchoolExt.st.read.page >= 1, 600); });
  await t.shot('story-phone');
  await t.ev(() => { T.act(); T.step(2); });
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- a push into a wall or the furniture is rescued onto the door mat
  await t.ev(() => { const S = CFG.SCHOOL; Game.player.x = S.ROOM.x0 - 10; Game.player.y = 3200; T.step(3); });
  t.expect(await t.ev(() => SchoolExt.free(Game.player.x, Game.player.y) && Game.area === 'school'), 'pushed into the wall: rescued onto the floor');
  t.expect(await t.ev(() => { const E = CFG.SCHOOL.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'the rescue lands on the exit mat');
  await t.ev(() => { const D = CFG.SCHOOL.DESKS[1]; Game.player.x = D.x; Game.player.y = D.y; T.step(3); });
  t.expect(await t.ev(() => SchoolExt.free(Game.player.x, Game.player.y)), 'pushed into a desk: rescued');

  // ---- Take-me-home from inside clears everything
  await t.ev(() => { const B = CFG.SCHOOL.BELL_SPOT; T.tp(B.x, B.y, 'school'); T.act(); T.step(10); Game.goHome(); T.step(2); });
  const home = await t.ev(() => ({ area: Game.area, recess: SchoolExt.st.recess, read: SchoolExt.st.read, hint: SchoolExt.hint(Game), label: T.label() }));
  t.expectEq(home.area, 'town', 'home at the pizzeria');
  t.expect(home.recess === 0 && home.read === null, 'recess and the story are cleared');
  t.expectEq(home.hint, undefined, 'no school hint at home');
  t.expect(home.label !== '🚪 Go outside', 'no school button at home');

  // ---- back in, then out through the door onto the door spot
  await t.ev(() => { const D = CFG.SCHOOL.DOOR_OUT; T.tp(D.x, D.y, 'city'); T.step(2); T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'school', 'inside again');
  t.expectEq(await t.ev(() => T.toasts.filter((m) => m.startsWith('🏫 Welcome to school')).length), 1, 'the welcome toast shows only once');
  await t.ev(() => { const E = CFG.SCHOOL.EXIT; T.tp(E.x, E.y, 'school'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back outside');
  t.expect(await t.ev(() => { const D = CFG.SCHOOL.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing on the door spot');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door button is back');
  // the star sticker travels with the chef
  t.expect(await t.ev(() => SchoolExt.st.star > 0 && Render.ext.includes(SchoolExt)), 'the gold star is still on the hat outside');
  await t.shot('door-after');
  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
