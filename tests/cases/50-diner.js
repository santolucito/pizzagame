'use strict';
// The diner in Construction Town: the door spot on the forecourt (free ground, label, hint), going inside (mat, welcome
// toast once), the spinning counter stool, the booth, the jukebox tune with notes and lights, the three pads (pancakes
// and a burger eaten at the counter with noms, the waitress skating a plate over to a booth, a carried milkshake), the
// cook flipping pancakes, the waitress gliding, a rescue from a wall, Take-me-home, and going back out to the door.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/diner.js into index.html, load it into the booted page
  if (await t.ev(() => typeof DinerExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/diner.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof DinerExt !== 'undefined' && !!CFG.AREAS.diner), 'the diner extension and its map are registered');
  t.expect(await t.ev(() => Game.ext.indexOf(DinerExt) < Game.ext.indexOf(SiteTownExt)), 'the diner is ahead of Construction Town in Game.ext');
  t.expect(await t.ev(() => { const W = CFG.DINER.WORLD; return W.x0 === 17000 && W.y0 === 4000 && W.x1 === 17600 && W.y1 === 4400; }), 'the diner uses its reserved rectangle');

  // ---- the door on the forecourt
  const spot = await t.ev(() => {
    const D = CFG.DINER.DOOR_OUT, S = CFG.SITETOWN;
    return { dx: D.x - S.DINER.door.x, below: D.y - S.DINER.y1, seat: Math.hypot(D.x - S.SEAT.x, D.y - S.SEAT.y), pad: Math.hypot(D.x - S.PADS.shake.x, D.y - S.PADS.shake.y) };
  });
  t.expect(spot.dx === 0 && spot.below > 12 && spot.below < 30, `the door spot is right below the diner's door (${JSON.stringify(spot)})`);
  t.expect(spot.seat > 26 + 12 && spot.pad > CFG_PAD(), `the door spot is off the picnic seat and the milkshake pad (${JSON.stringify(spot)})`);
  await t.ev(() => { const D = CFG.DINER.DOOR_OUT; T.tp(D.x - 45, D.y + 10, 'site'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Go inside the diner! 🍔', 'diner hint near the door');
  t.expect(await t.ev(() => { const D = CFG.DINER.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  await t.ev(() => { Render.setZoom(1.3); T.step(2); });
  await t.shot('door');
  t.expectEq(await t.ev(() => { const D = CFG.DINER.DOOR_OUT; T.tp(D.x - 70, D.y + 4, 'site'); T.step(2); return DinerExt.hint(Game); }), undefined, 'no diner hint further than 60 px from the door');
  await t.ev(() => { Render.setZoom(1.3); const D = CFG.DINER.DOOR_OUT; T.tp(D.x, D.y, 'site'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free ground');
  t.expect(await t.ev(() => { const D = CFG.DINER.DOOR_OUT, p = Game.player; T.steer(0, -1); T.step(20); T.unsteer(); const moved = Math.hypot(p.x - D.x, p.y - D.y); T.tp(D.x, D.y, 'site'); return moved < 20; }), 'the diner wall stops the chef just above the door spot');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.step(2); });
  await t.shot('door-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'diner', 'inside the diner');
  t.expect(await t.ev(() => T.toasts.includes('🍔 Welcome to the diner!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.DINER.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => DinerExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expectEq(await t.ev(() => { Game.s.cash = 40; T.step(1); return T.hint(); }), 'Order some pancakes! 🥞', 'pancake hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, P = CFG.DINER.PADS.pancakes; return !!h.target && h.target.x === P.x && h.target.y === P.y; }), 'the hint points at the pancake pad');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('inside');

  // every pad, stool, booth spot and the jukebox spot is reachable floor
  const spots = await t.ev(() => {
    const K = CFG.DINER, bad = [];
    const all = [K.EXIT, K.JUKE.spot, DinerExt.boothSpot(0), DinerExt.boothSpot(1)].concat(Object.values(K.PADS)).concat(K.STOOLS.map((x) => ({ x, y: K.STOOL_Y })));
    for (const s of all) if (!DinerExt.free(s.x, s.y)) bad.push([s.x, s.y]);
    return bad;
  });
  t.expectEq(spots.length, 0, `pads, stools and spots are free floor: ${JSON.stringify(spots)}`);
  // nowhere on the floor traps the chef
  const stuck = await t.ev(() => {
    const R = CFG.DINER.ROOM, out = [];
    for (let y = R.y0 + 14; y < R.y1 - 12; y += 24) for (let x = R.x0 + 14; x < R.x1 - 12; x += 24) {
      if (!DinerExt.free(x, y)) continue;
      let best = 0;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { Game.player.x = x; Game.player.y = y; T.steer(ax, ay); T.step(9); T.unsteer(); best = Math.max(best, Math.hypot(Game.player.x - x, Game.player.y - y)); }
      if (best < 2) out.push([x, y]);
    }
    const E = CFG.DINER.EXIT; T.tp(E.x, E.y - 8, 'diner');
    return out;
  });
  t.expectEq(stuck.length, 0, `no stuck spots on the diner floor: ${JSON.stringify(stuck)}`);

  // ---- the cook flips pancakes, the waitress glides about on her skates
  const life = await t.ev(() => {
    const w = DinerExt.st.wait, x0 = w.x, y0 = w.y, f0 = DinerExt.st.flip;
    let flipped = false; for (let i = 0; i < 160; i++) { T.step(1); if (DinerExt.st.flip < f0) flipped = true; }
    return { moved: Math.hypot(w.x - x0, w.y - y0), flipped };
  });
  t.expect(life.moved > 40, `the waitress skates around (${life.moved})`);
  t.expect(life.flipped, 'the cook keeps flipping pancakes');

  // ---- the jukebox
  await t.ev(() => { const J = CFG.DINER.JUKE.spot; T.tp(J.x, J.y, 'diner'); T.step(1); });
  t.expectEq(await t.ev(() => T.hint()), 'Play the jukebox! 🎵', 'jukebox hint by the jukebox');
  t.expectEq(await t.ev(() => T.label()), '🎵 Play the jukebox', 'jukebox label');
  await t.ev(() => { T.act(); T.step(20); });
  t.expect(await t.ev(() => DinerExt.st.juke > 0 && Game.s.diner.songs === 1 && DinerExt.st.notes.length > 0), 'the jukebox plays with notes floating up');
  t.expectEq(await t.ev(() => T.hint()), 'Rock and roll! 🎵', 'song hint');
  t.expect(await t.ev(() => T.label() !== '🎵 Play the jukebox'), 'the jukebox waits while it plays');
  await t.ev(() => { Render.setZoom(1.4); T.step(1); });
  await t.shot('jukebox');
  t.expect(await t.ev(() => { T.step(60 * 3); return DinerExt.st.juke === 0 && T.label() === '🎵 Play the jukebox'; }), 'the jukebox is ready again after the tune');
  await t.ev(() => { Render.setZoom(1); T.step(1); });

  // ---- a counter stool: sit down and it spins you round once
  await t.ev(() => { const K = CFG.DINER; T.tp(K.STOOLS[2] + 6, K.STOOL_Y + 4, 'diner'); });
  t.expectEq(await t.ev(() => T.label()), '🪑 Sit at the counter', 'stool label');
  const spin = await t.ev(() => {
    T.act(); const facings = new Set(); for (let i = 0; i < 40; i++) { facings.add(Game.player.facing); if (i === 10) window._h = T.hint(); T.step(1); }
    return { seat: DinerExt.st.seat && DinerExt.st.seat.kind, facings: facings.size, hint: window._h, spins: Game.s.diner.spins };
  });
  t.expectEq(spin.seat, 'stool', 'seated on a stool');
  t.expect(spin.facings === 2, 'the stool spins the chef round');
  t.expectEq(spin.hint, 'Wheee! Spinny stool! 🌀', 'spin hint');
  t.expectEq(spin.spins, 1, 'spin counted');
  t.expect(await t.ev(() => { T.step(30); const K = CFG.DINER; T.steer(1, 1); T.step(40); T.unsteer(); return Math.hypot(Game.player.x - K.STOOLS[2], Game.player.y - K.STOOL_Y) < 1; }), 'the chef stays on the stool while seated');
  t.expectEq(await t.ev(() => T.label()), '🚶 Stand up', 'stand-up label on the stool');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !DinerExt.st.seat), 'stood up from the stool');

  // ---- pancakes ($3): the plate lands at the nearest free counter spot; sit there and the chef eats it
  const pan = await t.ev(() => {
    const P = CFG.DINER.PADS.pancakes; T.tp(P.x, P.y, 'diner');
    const n = T.until(() => DinerExt.st.plates.length > 0, 400);
    const pl = DinerExt.st.plates[0];
    return { n, cash: Game.s.cash, kind: pl && pl.kind, at: pl && pl.at, floats: Game.floats.map((f) => f.text), ring: DinerExt.st.ring };
  });
  t.expect(pan.n >= 0, 'the pad served pancakes');
  t.expectEq(pan.cash, 37, 'pancakes cost $3');
  t.expect(pan.kind === 'pancakes' && pan.at.kind === 'stool' && pan.at.i === 0, `the plate waits at the nearest counter spot (${JSON.stringify(pan.at)})`);
  t.expect(pan.floats.includes('🔔 Order up!') && pan.ring > 0, 'the cook rings the order bell');
  await t.ev(() => { T.tp(17240, 4240, 'diner'); T.step(1); });
  t.expectEq(await t.ev(() => T.hint()), 'Your food is ready! Sit down to eat 🍽️', 'food-ready hint');
  t.expect(await t.ev(() => { const h = Game.hint, K = CFG.DINER; return !!h.target && h.target.x === K.STOOLS[0] && h.target.y === K.STOOL_Y; }), 'the hint points at the stool with the plate');
  await t.ev(() => { Render.setZoom(1.4); T.step(1); });
  await t.shot('pancakes');
  await t.ev(() => { const K = CFG.DINER; T.tp(K.STOOLS[0], K.STOOL_Y + 6, 'diner'); T.act(); });
  const eat = await t.ev(() => {
    T.step(60); const mid = { hint: T.hint(), noms: Game.floats.filter((f) => f.text === 'nom!').length, eat: DinerExt.st.plates[0] && DinerExt.st.plates[0].eat };
    const n = T.until(() => DinerExt.st.plates.length === 0, 300);
    return { mid, n, eats: Game.s.diner.eats, floats: Game.floats.map((f) => f.text) };
  });
  t.expect(eat.mid.eat > 0 && eat.mid.noms > 0, `the chef eats with noms (${JSON.stringify(eat.mid)})`);
  t.expectEq(eat.mid.hint, 'Nom nom nom! 🥞', 'eating hint');
  t.expect(eat.n > 30 && eat.n < 150, `the pancakes are gone after about 2 s (${eat.n})`);
  t.expectEq(eat.eats, 1, 'meal counted');
  t.expect(eat.floats.includes('Yum! 🥞'), 'Yum! when the pancakes are finished');
  await t.ev(() => { T.act(); T.step(2); });

  // ---- a burger ($4) bought standing, then sitting in a booth: the waitress skates it over
  const bur = await t.ev(() => {
    const P = CFG.DINER.PADS.burger; T.tp(P.x, P.y, 'diner');
    const n = T.until(() => DinerExt.st.plates.length > 0, 400);
    return { n, cash: Game.s.cash, kind: DinerExt.st.plates[0] && DinerExt.st.plates[0].kind };
  });
  t.expect(bur.n >= 0 && bur.kind === 'burger', 'the pad served a burger');
  t.expectEq(bur.cash, 33, 'the burger cost $4');
  await t.ev(() => { const s = DinerExt.boothSpot(0); T.tp(s.x + 4, s.y + 2, 'diner'); });
  t.expectEq(await t.ev(() => T.label()), '🪑 Sit in the booth', 'booth label');
  await t.ev(() => { T.act(); T.step(3); });
  t.expect(await t.ev(() => !!DinerExt.st.seat && DinerExt.st.seat.kind === 'booth' && DinerExt.st.seat.i === 0 && Game.s.diner.booths === 1), 'seated in the booth');
  t.expect(await t.ev(() => !!DinerExt.st.job), 'the waitress is called to bring the burger');
  const deliver = await t.ev(() => {
    const n1 = T.until(() => DinerExt.st.job && DinerExt.st.job.phase === 'bring', 400); const hint = T.hint();
    return { n1, hint };
  });
  t.expect(deliver.n1 >= 0, 'the waitress picks the plate up');
  t.expectEq(deliver.hint, 'Here comes your food! 🛼', 'delivery hint');
  await t.ev(() => T.step(20));
  await t.shot('waitress');
  const served = await t.ev(() => {
    const n = T.until(() => !DinerExt.st.job, 400); const pl = DinerExt.st.plates[0];
    return { n, at: pl && pl.at, floats: Game.floats.map((f) => f.text) };
  });
  t.expect(served.n >= 0 && served.at && served.at.kind === 'booth' && served.at.i === 0, `the burger arrives at the booth (${JSON.stringify(served)})`);
  t.expect(served.floats.includes('Enjoy! 😊'), 'the waitress says enjoy');
  await t.ev(() => { Render.setZoom(1.5); T.step(30); });
  await t.shot('booth');
  const ate = await t.ev(() => { const n = T.until(() => DinerExt.st.plates.length === 0, 300); return { n, eats: Game.s.diner.eats, floats: Game.floats.map((f) => f.text) }; });
  t.expect(ate.n >= 0 && ate.eats === 2 && ate.floats.includes('Yum! 🍔'), 'the chef eats the burger in the booth');
  t.expect(await t.ev(() => { const B = DinerExt.seatPos({ kind: 'booth', i: 0 }); return Math.hypot(Game.player.x - B.x, Game.player.y - B.y) < 1; }), 'the chef stays seated in the booth');
  await t.ev(() => { T.act(); T.step(2); Render.setZoom(1); });
  t.expect(await t.ev(() => { const s = DinerExt.boothSpot(0); return !DinerExt.st.seat && Math.hypot(Game.player.x - s.x, Game.player.y - s.y) < 1 && DinerExt.free(Game.player.x, Game.player.y); }), 'standing up from the booth steps back out onto the floor');

  // ---- a milkshake ($3): carried with a straw for 30 s, the machine whirs
  const shake = await t.ev(() => {
    const P = CFG.DINER.PADS.shake; T.tp(P.x, P.y, 'diner');
    const n = T.until(() => DinerExt.st.shake > 0, 400);
    return { n, cash: Game.s.cash, shake: DinerExt.st.shake, whir: DinerExt.st.whir, shakes: Game.s.diner.shakes, maxed: DinerExt.pads(Game)[2].maxed };
  });
  t.expect(shake.n >= 0 && shake.shake > 28 && shake.whir > 0 && shake.shakes === 1, `a milkshake (${JSON.stringify(shake)})`);
  t.expectEq(shake.cash, 30, 'the milkshake cost $3');
  t.expect(shake.maxed, 'no second milkshake right away');
  await t.ev(() => { T.tp(17250, 4235, 'diner'); Render.setZoom(1.4); T.step(2); });
  await t.shot('milkshake');
  t.expect(await t.ev(() => { T.step(60 * 31); return DinerExt.st.shake === 0; }), 'the milkshake is finished after 30 s');
  await t.ev(() => { Render.setZoom(1); T.step(1); });

  // ---- three plates fill the order pads up
  t.expect(await t.ev(() => {
    DinerExt.st.plates.push({ kind: 'pancakes', at: { kind: 'stool', i: 1 }, held: false, eat: 0 }, { kind: 'burger', at: { kind: 'stool', i: 2 }, held: false, eat: 0 }, { kind: 'burger', at: { kind: 'stool', i: 3 }, held: false, eat: 0 });
    const m = DinerExt.pads(Game).slice(0, 2).every((p) => p.maxed); DinerExt.st.plates = []; return m;
  }), 'the food pads show MAX with three plates waiting');

  // ---- a reload or push into a wall lands back on the mat
  await t.ev(() => { const R = CFG.DINER.ROOM; T.tp(R.x0 - 10, 4220, 'diner'); T.step(3); });
  t.expect(await t.ev(() => DinerExt.free(Game.player.x, Game.player.y)), 'pushed into the wall: rescued onto the floor');
  t.expect(await t.ev(() => { const E = CFG.DINER.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'the rescue lands on the exit mat');
  await t.ev(() => { const C = CFG.DINER.COUNTER; T.tp((C.x0 + C.x1) / 2, (C.y0 + C.y1) / 2, 'diner'); T.step(3); });
  t.expect(await t.ev(() => DinerExt.free(Game.player.x, Game.player.y)), 'dropped onto the counter: rescued');

  // ---- phone-size diner
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.tp(17300, 4220, 'diner'); T.step(60); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- Take-me-home from a stool
  await t.ev(() => { const K = CFG.DINER; T.tp(K.STOOLS[4], K.STOOL_Y, 'diner'); T.act(); T.step(5); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'Take-me-home leaves the diner');
  t.expect(await t.ev(() => !DinerExt.st.seat && !DinerExt.st.job), 'the seat is cleared by Take-me-home');
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');
  t.expectEq(await t.ev(() => DinerExt.hint(Game)), undefined, 'no diner hint in the town');
  t.expectEq(await t.ev(() => DinerExt.pads(Game).length), 0, 'no diner pads in the town');

  // ---- out through the door: back on the forecourt at the door spot
  await t.ev(() => { const E = CFG.DINER.EXIT; T.tp(E.x, E.y, 'diner'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'site', 'back outside in Construction Town');
  t.expect(await t.ev(() => { const D = CFG.DINER.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the door spot');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door offers going back in');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '🍔 Welcome to the diner!').length === 1), 'the welcome toast shows only once');

  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
function CFG_PAD() { return 40 + 6 + 12; }   // a pad's reach (CFG.PAD_RADIUS + 6) plus the chef
