'use strict';
// The music shop in the City: the door's label and hint on the sidewalk, going inside (welcome toast, no stray hint),
// the drum kit (sit, bash: Boom!/Tish! floats and the bounce, walk away to stand up), the piano (one lit key and one note
// per key crossed), the trumpet, the guitar wall, the jukebox button (changes the tune), the $4 kazoo (hums while
// walking) and the $6 maraca, a rescue from a wall, Take-me-home from inside, and going back out onto the door spot.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/city-music.js into index.html, load it into the booted page
  if (await t.ev(() => typeof MusicExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-music.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof MusicExt !== 'undefined' && !!CFG.AREAS.music), 'the music extension and its map are registered');
  t.expect(await t.ev(() => Game.ext.indexOf(MusicExt) < Game.ext.indexOf(CityExt)), 'the music shop answers before the City');
  t.expect(await t.ev(() => { const b = CFG.CITY.BUILDINGS[CFG.MUSIC.BUILDING], D = CFG.MUSIC.DOOR_OUT; return b.sign === 'MUSIC' && D.x === (b.x0 + b.x1) / 2 && D.y === b.y1 + 14; }), 'the door spot is on the sidewalk below the MUSIC building');

  // ---- the door on Market Street
  await t.ev(() => { const D = CFG.MUSIC.DOOR_OUT; T.tp(D.x, D.y + 60, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Make some music at the shop! 🎵', 'music hint near the door');
  t.expect(await t.ev(() => { const D = CFG.MUSIC.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  await t.ev(() => { T.tp(5600, 300, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => MusicExt.hint(Game)), undefined, 'no music hint elsewhere in the City');
  t.expectEq(await t.ev(() => { T.tp(540, 430, 'town'); T.step(1); return MusicExt.hint(Game); }), undefined, 'no music hint in the town');
  await t.ev(() => { Render.setZoom(1.2); const D = CFG.MUSIC.DOOR_OUT; T.tp(D.x, D.y, 'city'); T.step(2); });
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  await t.shot('door');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'music', 'inside the music shop');
  t.expect(await t.ev(() => T.toasts.includes('🎵 Welcome to the music shop!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.MUSIC.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => MusicExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Sit at the drums! 🥁', 'drum hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, S = CFG.MUSIC.STOOL; return !!h.target && h.target.x === S.x && h.target.y === S.y; }), 'the hint points at the drum stool');
  t.expect(await t.ev(() => MusicExt.free(CFG.MUSIC.STOOL.x, CFG.MUSIC.STOOL.y) && MusicExt.free(CFG.MUSIC.PIANO_FRONT.x, CFG.MUSIC.PIANO_FRONT.y) && MusicExt.free(CFG.MUSIC.JUKE_SPOT.x, CFG.MUSIC.JUKE_SPOT.y) && MusicExt.free(CFG.MUSIC.STRUM.x, CFG.MUSIC.STRUM.y) && MusicExt.free(CFG.MUSIC.PADS.kazoo.x, CFG.MUSIC.PADS.kazoo.y) && MusicExt.free(CFG.MUSIC.PADS.maraca.x, CFG.MUSIC.PADS.maraca.y)), 'every spot you stand on is free floor');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('inside');

  // ---- the jukebox plays the shop's tune: the beat ticks over and the shopkeeper bops
  const beat = await t.ev(() => { const b0 = MusicExt.st.beat; T.step(60); return { beats: MusicExt.st.beat - b0, nod: MusicExt.st.nod }; });
  t.expect(beat.beats >= 2 && beat.beats <= 3, `the jukebox beat ticks (${beat.beats} beats in a second)`);

  // ---- the drum kit: sit, bash, stay put, walk away to stand up
  await t.ev(() => { const S = CFG.MUSIC.STOOL; T.tp(S.x - 20, S.y, 'music'); });
  t.expectEq(await t.ev(() => T.label()), '🥁 Sit at the drums', 'sit label by the stool');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => { const S = CFG.MUSIC.STOOL; return MusicExt.st.drum && Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 1; }), 'seated on the drum stool');
  t.expectEq(await t.ev(() => T.label()), '🥁 Bash!', 'bash label while seated');
  t.expectEq(await t.ev(() => T.hint()), 'Press the button to bash the drums! 🥁', 'seated hint');
  const bash = await t.ev(() => { T.act(); const b = MusicExt.st.bounce; T.step(1); T.act(); return { b, bashes: Game.s.music.bashes, floats: Game.floats.map((f) => f.text), bounce: MusicExt.st.bounce }; });
  t.expect(bash.b > 0.9, 'the drums bounce on a bash');
  t.expectEq(bash.bashes, 2, 'two bashes counted');
  t.expect(bash.floats.includes('Boom!') && bash.floats.includes('Tish!'), `Boom! and Tish! floats (${bash.floats.join(', ')})`);
  await t.shot('drums');
  t.expect(await t.ev(() => { T.step(90); return MusicExt.st.bounce === 0; }), 'the bounce settles');
  await t.ev(() => { T.steer(1, 0); T.step(30); T.unsteer(); T.step(1); });
  t.expect(await t.ev(() => !MusicExt.st.drum && Game.player.x > CFG.MUSIC.STOOL.x + 10), 'walking away stands up from the drums');
  t.expectEq(await t.ev(() => T.hint()), 'Walk along the piano keys! 🎹', 'piano hint after the drums');

  // ---- the piano: walk along the keys, one note and one lit key per key crossed
  const piano = await t.ev(() => {
    const P = CFG.MUSIC.PIANO, F = CFG.MUSIC.PIANO_FRONT;
    T.tp(P.x0 + 4, F.y, 'music'); T.step(1);
    const k0 = Game.s.music.keys, lit0 = MusicExt.st.lit.filter((v) => v > 0).length;
    T.steer(1, 0); T.step(50); T.unsteer(); T.step(1);
    return { keys: Game.s.music.keys - k0, lit0, lit: MusicExt.st.lit.filter((v) => v > 0).length, x: Game.player.x, onKeys: MusicExt.onKeys(Game), hint: T.hint() };
  });
  t.expect(piano.keys >= 4, `walked across several keys (${piano.keys})`);
  t.expect(piano.lit >= 2, `recent keys are still lit (${piano.lit})`);
  t.expect(piano.onKeys, 'still in front of the keyboard');
  t.expectEq(piano.hint, 'Toot the trumpet! 🎺', 'trumpet hint after the piano');
  await t.shot('piano');
  t.expect(await t.ev(() => { T.tp(7150, 3250, 'music'); T.step(1); return !MusicExt.onKeys(Game) && MusicExt.st.lastKey === -1; }), 'off the keys away from the piano');

  // ---- the trumpet on its stand
  await t.ev(() => { Game.s.cash = 20; const Tr = CFG.MUSIC.TRUMPET; T.tp(Tr.x - 24, Tr.y + 4, 'music'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🎺 Toot!', 'toot label by the trumpet');
  const toot = await t.ev(() => { T.act(); return { toot: MusicExt.st.toot, toots: Game.s.music.toots, floats: Game.floats.map((f) => f.text), hint: T.hint() }; });
  t.expect(toot.toot > 0.5 && toot.toots === 1, 'one toot');
  t.expect(toot.floats.includes('Toot! 🎺'), 'the Toot! float');
  t.expectEq(toot.hint, 'Buy a kazoo! 🎶', 'kazoo hint after the trumpet');

  // ---- the guitar wall and the jukebox button
  await t.ev(() => { const S = CFG.MUSIC.STRUM; T.tp(S.x, S.y, 'music'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🎸 Strum!', 'strum label by the guitars');
  t.expect(await t.ev(() => { T.act(); return MusicExt.st.strum > 0.5 && Game.s.music.strums === 1 && Game.floats.some((f) => f.text === 'Strum! 🎸'); }), 'strummed the guitars');
  await t.ev(() => { const J = CFG.MUSIC.JUKE_SPOT; T.tp(J.x, J.y, 'music'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🎵 Change the tune', 'jukebox label at the button');
  const tune = await t.ev(() => { const t0 = Game.s.music.tune; T.act(); return { t0, t1: Game.s.music.tune, n: CFG.MUSIC.TUNES.length, pressed: MusicExt.st.pressed, floats: Game.floats.map((f) => f.text) }; });
  t.expect(tune.t1 === (tune.t0 + 1) % tune.n, 'the tune changed to the next one');
  t.expect(tune.pressed > 0 && tune.floats.includes('New tune! 🎵'), 'the button pressed in with a float');
  await t.shot('jukebox');

  // ---- a $4 kazoo from the circle at the counter: hums while walking, comes along to the town, runs out
  const kazoo = await t.ev(() => {
    Game.s.cash = 20; const P = CFG.MUSIC.PADS.kazoo; T.tp(P.x, P.y, 'music');
    const n = T.until(() => MusicExt.st.kazoo > 0, 400);
    return { n, cash: Game.s.cash, kazoo: MusicExt.st.kazoo, kazoos: Game.s.music.kazoos, after: T.hint(), pads: MusicExt.pads(Game).map((p) => p.key) };
  });
  t.expect(kazoo.n >= 0, 'the circle sold a kazoo');
  t.expectEq(kazoo.cash, 16, 'the kazoo cost $4');
  t.expectEq(kazoo.kazoos, 1, 'kazoo counted');
  t.expect(kazoo.kazoo > 25, 'the kazoo lasts half a minute');
  t.expectEq(kazoo.after, 'Hmmm hmmm! Walk around and hum 🎶', 'kazoo hint while carrying it');
  t.expect(!kazoo.pads.includes('musicKazoo') && kazoo.pads.includes('musicMaraca'), 'the kazoo circle hides while the kazoo is held');
  const hum = await t.ev(() => { T.tp(7000, 3250, 'music'); T.steer(1, 0); T.step(45); T.unsteer(); return MusicExt.st.hum; });
  t.expect(hum > 0, 'the kazoo hums while walking');
  await t.shot('kazoo');
  // the $6 maraca
  const maraca = await t.ev(() => {
    const P = CFG.MUSIC.PADS.maraca; T.tp(P.x, P.y, 'music');
    const n = T.until(() => MusicExt.st.maraca > 0, 400);
    return { n, cash: Game.s.cash, maracas: Game.s.music.maracas, pads: MusicExt.pads(Game).length };
  });
  t.expect(maraca.n >= 0, 'the circle sold a maraca');
  t.expectEq(maraca.cash, 10, 'the maraca cost $6');
  t.expectEq(maraca.maracas, 1, 'maraca counted');
  t.expectEq(maraca.pads, 0, 'both circles hide while both instruments are held');
  await t.ev(() => { T.tp(7000, 3250, 'music'); T.steer(-1, 0); T.step(20); T.unsteer(); T.step(1); });
  await t.shot('maraca');
  t.expect(await t.ev(() => { T.tp(540, 430, 'town'); T.step(2); return MusicExt.st.kazoo > 20 && MusicExt.st.maraca > 20; }), 'the instruments come along to the town');
  t.expect(await t.ev(() => { T.step(60 * 31); return MusicExt.st.kazoo === 0 && MusicExt.st.maraca === 0; }), 'both are put away after 30 s');

  // ---- a reload or push into a wall lands back on the mat
  await t.ev(() => { const R = CFG.MUSIC.ROOM; T.tp(R.x0 - 10, 3200, 'music'); T.step(3); });
  t.expect(await t.ev(() => MusicExt.free(Game.player.x, Game.player.y)), 'pushed into the wall: rescued onto the floor');
  t.expect(await t.ev(() => { const E = CFG.MUSIC.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'the rescue lands on the exit mat');
  await t.ev(() => { const C = CFG.MUSIC.COUNTER; T.tp((C.x0 + C.x1) / 2, (C.y0 + C.y1) / 2, 'music'); T.step(3); });
  t.expect(await t.ev(() => MusicExt.free(Game.player.x, Game.player.y)), 'dropped onto the counter: rescued');
  await t.ev(() => { const D = CFG.MUSIC.DRUM_RECT; T.tp(D.x + D.w / 2, D.y + D.h / 2, 'music'); T.step(3); });
  t.expect(await t.ev(() => MusicExt.free(Game.player.x, Game.player.y)), 'dropped into the drum kit: rescued');

  // ---- phone-size shop
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const S = CFG.MUSIC.STOOL; T.tp(S.x + 50, S.y + 30, 'music'); T.step(100); });
  t.expect(await t.ev(() => MusicExt.free(Game.player.x, Game.player.y) && Game.area === 'music'), 'standing on free floor by the drums');
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- Take-me-home from the drum stool
  await t.ev(() => { const S = CFG.MUSIC.STOOL; T.tp(S.x, S.y, 'music'); T.act(); T.step(2); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'Take-me-home leaves the shop');
  t.expect(await t.ev(() => !MusicExt.st.drum), 'the drum seat is cleared by Take-me-home');
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');
  t.expectEq(await t.ev(() => MusicExt.hint(Game)), undefined, 'no music hint in the town');
  t.expectEq(await t.ev(() => MusicExt.pads(Game).length), 0, 'no music circles in the town');

  // ---- out through the door: back on the sidewalk at the door spot
  await t.ev(() => { const E = CFG.MUSIC.EXIT; T.tp(E.x, E.y, 'music'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back outside in the City');
  t.expect(await t.ev(() => { const D = CFG.MUSIC.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the door spot');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door offers going back in');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '🎵 Welcome to the music shop!').length === 1), 'the welcome toast shows only once');

  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
