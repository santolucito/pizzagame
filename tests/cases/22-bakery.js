'use strict';
// The Bakery (City building 2): the door on Bus Street, the room inside, the bell, the three treats, the sleeping cat,
// a rescue from the walls, Take-me-home from inside, and the way back out onto the sidewalk.
module.exports = async (t) => {
  // the extension may not be wired into index.html yet: load it into the page when it is missing
  const load = async () => { if (!(await t.ev(() => typeof BakeryExt !== 'undefined'))) { await t.page.addScriptTag({ url: '/js/city-bakery.js' }); await t.ev(() => T.step(1)); } };
  await t.boot();
  await load();
  const K = await t.ev(() => CFG.BAKERY);

  // ---- outside: the hint near the door, the button on the door spot
  await t.ev((D) => { T.tp(D.x, D.y + 70, 'city'); T.step(1); }, K.DOOR_OUT);
  t.expectEq(await t.ev(() => T.hint()), 'Go inside the bakery 🥐', 'bakery hint near the door');
  const hintTarget = await t.ev(() => Game.hint && Game.hint.target);
  t.expect(hintTarget && Math.abs(hintTarget.x - K.DOOR_OUT.x) < 1, 'the hint points at the door');
  await t.ev((D) => { T.tp(D.x, D.y, 'city'); }, K.DOOR_OUT);
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label on the door spot');
  await t.ev(() => { Render.setZoom(1.2); T.step(2); });
  await t.shot('door');

  // ---- going in
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'bakery', 'inside the bakery');
  const at = await t.ev(() => [Game.player.x, Game.player.y]);
  t.expect(Math.abs(at[0] - K.EXIT.x) < 1 && Math.abs(at[1] - (K.EXIT.y - 8)) < 1, `arrived just above the exit mat (${at})`);
  t.expect(await t.ev(() => T.toasts.includes('🥐 Welcome to the Bakery!')), 'welcome toast the first time');
  t.expect(await t.ev(() => BakeryExt.free(Game.player.x, Game.player.y)), 'standing on free floor');
  const h0 = await t.ev(() => ({ text: T.hint(), target: Game.hint && Game.hint.target }));
  t.expect(typeof h0.text === 'string' && h0.text.length > 0, 'a hint inside');
  t.expect(!h0.target || (h0.target.x > K.ROOM.x0 && h0.target.x < K.ROOM.x1 && h0.target.y > K.ROOM.y0 && h0.target.y < K.ROOM.y1), `the hint points inside the room (${JSON.stringify(h0)})`);
  t.expectEq(h0.text, 'Ring the bell on the counter 🔔', 'first hint: ring the bell');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('inside');

  // ---- the bell: ding, the baker waves
  await t.ev((B) => { T.tp(B.spot.x, B.spot.y, 'bakery'); }, K.BELL);
  t.expectEq(await t.ev(() => T.label()), '🔔 Ring the bell', 'bell label at the counter');
  t.expectEq(await t.ev(() => T.hint()), 'Press the button to ring the bell 🔔', 'bell hint');
  await t.ev(() => { T.act(); T.step(3); });
  t.expect(await t.ev(() => BakeryExt.st.wave > 0 && BakeryExt.st.rang), 'the baker is waving');
  t.expectEq(await t.ev(() => T.hint()), 'The baker says hello! 👋', 'hello hint while waving');
  t.expect(await t.ev(() => Game.floats.some((f) => f.text === 'Ding!')), 'the bell went ding');
  await t.shot('bell');
  await t.ev(() => T.step(200));
  t.expect(await t.ev(() => BakeryExt.st.wave === 0), 'the wave ends');
  t.expectEq(await t.ev(() => { Game.s.cash = 50; T.tp(760, 3250, 'bakery'); T.step(1); return T.hint(); }), 'Try a warm croissant 🥐', 'croissant hint once the bell was rung');

  // ---- croissant: stand still on the pad
  const cro = await t.ev((P) => { T.tp(P.x, P.y, 'bakery'); const n = T.until(() => Game.s.bakery.treats === 1, 400); return { n, cash: Game.s.cash, yum: Game.floats.some((f) => f.text === 'Mmm, buttery!') }; }, K.PADS.croissant);
  t.expect(cro.n >= 0, 'the croissant pad served a croissant');
  t.expectEq(cro.cash, 47, 'croissant cost $3');
  t.expect(cro.yum, 'Mmm, buttery!');

  // ---- cupcake: the chef carries it for a while
  const cup = await t.ev((P) => { T.tp(P.x, P.y, 'bakery'); const n = T.until(() => BakeryExt.st.cupcake > 0, 400); const c0 = BakeryExt.st.cupcake; T.step(60); return { n, cash: Game.s.cash, c0, c1: BakeryExt.st.cupcake, hint: T.hint() }; }, K.PADS.cupcake);
  t.expect(cup.n >= 0, 'the cupcake pad served a cupcake');
  t.expectEq(cup.cash, 42, 'cupcake cost $5');
  t.expect(cup.c0 > 29 && cup.c1 < cup.c0 && cup.c1 > 27, `the cupcake is carried and counts down (${cup.c0} -> ${cup.c1})`);
  t.expectEq(cup.hint, 'Yum! A cupcake just for you 🧁', 'cupcake hint');
  await t.shot('cupcake');

  // ---- birthday cake: candles, confetti, a happy float
  const cake = await t.ev((P) => { T.tp(P.x, P.y, 'bakery'); const n = T.until(() => BakeryExt.st.candles > 0, 400); T.step(2); return { n, cash: Game.s.cash, confetti: BakeryExt.st.confetti.length, happy: Game.floats.some((f) => f.text === 'Happy day! 🎉'), hint: T.hint(), treats: Game.s.bakery.treats }; }, K.PADS.cake);
  t.expect(cake.n >= 0, 'the cake pad served a birthday cake');
  t.expectEq(cake.cash, 30, 'cake cost $12');
  t.expect(cake.confetti > 20, `confetti burst (${cake.confetti})`);
  t.expect(cake.happy, 'Happy day! float');
  t.expectEq(cake.hint, 'Happy day! Make a wish 🎂', 'candle hint');
  t.expectEq(cake.treats, 3, 'three treats counted');
  await t.shot('cake');
  await t.ev(() => { T.tp(920, 3250, 'bakery'); T.step(700); });   // step off the pad first: standing on it would buy another cake
  t.expect(await t.ev(() => BakeryExt.st.candles === 0 && BakeryExt.st.confetti.length === 0), 'candles out, confetti gone');

  // ---- the cat by the oven
  await t.ev((C) => { T.tp(C.x + 48, C.y + 6, 'bakery'); }, K.CAT);
  t.expectEq(await t.ev(() => T.hint()), 'Shh… the cat is sleeping by the warm oven 🐱', 'cat hint');
  t.expect(await t.ev((C) => { const x = Game.player.x; T.steer(-1, 0); T.step(60); T.unsteer(); return Game.player.x < x && Game.player.x > C.x + 18; }, K.CAT), 'the cat is in the way: you cannot walk onto its mat');

  // ---- pushed into a wall: rescued onto the exit mat
  const resc = await t.ev(() => { Game.player.x = CFG.BAKERY.ROOM.x0 - 10; Game.player.y = 3200; T.step(3); return { free: BakeryExt.free(Game.player.x, Game.player.y), x: Game.player.x, y: Game.player.y, oops: Game.floats.some((f) => f.text === 'Oops! Back inside') }; });
  t.expect(resc.free && Math.abs(resc.x - K.EXIT.x) < 1 && resc.oops, `rescued onto the exit mat (${JSON.stringify(resc)})`);

  // ---- every spot the chef must reach is free floor
  const spots = await t.ev(() => { const K = CFG.BAKERY; return [K.EXIT, K.BELL.spot, K.PADS.croissant, K.PADS.cupcake, K.PADS.cake, { x: K.CAT.x + 48, y: K.CAT.y + 6 }].filter((s) => !BakeryExt.free(s.x, s.y)); });
  t.expectEq(spots.length, 0, `all stand spots are free: ${JSON.stringify(spots)}`);

  // ---- phone-size view
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev((P) => { Render.resize(); T.tp(P.x, P.y - 40, 'bakery'); T.step(90); }, K.PADS.cupcake);   // let the old floats fade
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- out again: back on the door spot
  await t.ev((E) => { T.tp(E.x, E.y, 'bakery'); }, K.EXIT);
  t.expectEq(await t.ev(() => T.hint()), 'Press the button to go outside', 'exit hint on the mat');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back in the City');
  t.expect(await t.ev((D) => Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 1, K.DOOR_OUT), 'standing on the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  // the hint right outside the door is still the bakery's, and no second welcome toast
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'bakery', 'inside again');
  t.expectEq(await t.ev(() => T.toasts.filter((m) => m === '🥐 Welcome to the Bakery!').length), 1, 'the welcome toast shows once');

  // ---- Take me home from inside
  await t.ev(() => { Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'home in town');
  t.expect(await t.ev(() => { const st = BakeryExt.st; return st.cupcake === 0 && st.wave === 0 && st.candles === 0 && st.confetti.length === 0 && st.fade === 0; }), 'bakery state cleared');
  t.expect(await t.ev(() => T.hint() !== 'Go inside the bakery 🥐'), 'no bakery hint in town');
  t.expectEq(await t.ev(() => Game.allPads().filter((p) => p.key.startsWith('bakery')).length), 0, 'no bakery pads outside');

  // ---- a save inside the bakery reloads onto the floor
  await t.ev((E) => { T.tp(E.x, E.y - 8, 'bakery'); Game.save(); }, K.EXIT);
  await t.reload();
  const wired = await t.ev(() => typeof BakeryExt !== 'undefined');   // only a wired-in script knows the map at load time
  await load();
  await t.ev(() => T.step(3));
  if (wired) {
    t.expectEq(await t.ev(() => Game.area), 'bakery', 'reloaded inside the bakery');
    t.expect(await t.ev(() => BakeryExt.free(Game.player.x, Game.player.y)), 'reloaded onto free floor');
  } else t.expectEq(await t.ev(() => Game.area), 'town', 'not wired in yet: the save falls back to town');
  await t.ev(() => { Game.goHome(); T.step(1); });
};
