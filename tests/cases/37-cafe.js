'use strict';
// The café in the City: the door's label and hint on Harbour Street, going inside (welcome toast, no stray hint), the
// three treats on the pads (cocoa carried with steam, the croissant, the cake slice and its confetti), the barista's latte
// heart, the tip jar, the window seat with the bus passing, the open-mic song and the applause, the sleeping cat, a
// rescue from a wall, Take-me-home from a chair, and going back out onto the door spot.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/city-cafe.js into index.html, load it into the booted page
  if (await t.ev(() => typeof CafeExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-cafe.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof CafeExt !== 'undefined' && !!CFG.AREAS.cafe), 'the café extension and its map are registered');
  t.expect(await t.ev(() => Game.ext.indexOf(CafeExt) < Game.ext.indexOf(CityExt)), 'the café is ahead of the City in Game.ext');
  t.expect(await t.ev(() => { const W = CFG.CAFE.WORLD; return W.x0 === 14000 && W.y0 === 3000 && W.x1 === 14600 && W.y1 === 3400; }), 'the café uses building 17\'s reserved rectangle');

  // ---- the door on Harbour Street
  await t.ev(() => { const D = CFG.CAFE.DOOR_OUT; T.tp(D.x, D.y + 60, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Go inside the café ☕', 'café hint near the door');
  t.expect(await t.ev(() => { const D = CFG.CAFE.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  t.expectEq(await t.ev(() => { const D = CFG.CAFE.DOOR_OUT; T.tp(D.x, D.y + 90, 'city'); T.step(2); return CafeExt.hint(Game); }), undefined, 'no café hint further than 70 px from the door');
  await t.ev(() => { Render.setZoom(1.2); const D = CFG.CAFE.DOOR_OUT; T.tp(D.x, D.y, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  await t.shot('door');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'cafe', 'inside the café');
  t.expect(await t.ev(() => T.toasts.includes('☕ Welcome to the café!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.CAFE.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => CafeExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expectEq(await t.ev(() => { Game.s.cash = 30; T.step(1); return T.hint(); }), 'Order a hot cocoa at the counter! ☕', 'cocoa hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, P = CFG.CAFE.PADS.cocoa; return !!h.target && h.target.x === P.x && h.target.y === P.y; }), 'the hint points at the cocoa pad');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('inside');

  // ---- the espresso machine hisses now and then
  t.expect(await t.ev(() => { const n = T.until(() => CafeExt.st.hiss > 0, 600); return n >= 0 && CafeExt.st.puffs.length >= 0; }), 'the espresso machine hisses');
  t.expect(await t.ev(() => { T.step(20); return CafeExt.st.puffs.length > 0; }), 'steam puffs rise from the machine');

  // ---- a $4 cocoa: the barista pours a heart, the mug is carried with steam
  const cocoa = await t.ev(() => {
    const P = CFG.CAFE.PADS.cocoa; T.tp(P.x, P.y, 'cafe');
    const n = T.until(() => CafeExt.st.cocoa > 0, 400);
    return { n, cash: Game.s.cash, cocoa: CafeExt.st.cocoa, orders: Game.s.cafe.orders, pour: CafeExt.st.pour, hint: T.hint() };
  });
  t.expect(cocoa.n >= 0, 'the circle served a cocoa');
  t.expectEq(cocoa.cash, 26, 'the cocoa cost $4');
  t.expectEq(cocoa.orders, 1, 'order counted');
  t.expect(cocoa.cocoa > 25, 'the cocoa lasts half a minute');
  t.expect(cocoa.pour > 0, 'the barista is pouring');
  t.expectEq(cocoa.hint, 'Watch the barista pour a heart ♥', 'pouring hint');
  await t.ev(() => { T.tp(14380, 3290, 'cafe'); T.step(1); });
  await t.shot('pour');
  const heart = await t.ev(() => { const n = T.until(() => CafeExt.st.heart, 400); return { n, floats: Game.floats.map((f) => f.text), hint: T.hint() }; });
  t.expect(heart.n >= 0, 'a heart appeared in the cup');
  t.expect(heart.floats.includes('♥'), 'the heart float');
  t.expectEq(heart.hint, 'Have a seat by the window 🪑', 'seat hint while carrying the cocoa');
  t.expect(await t.ev(() => { const h = Game.hint, c = CFG.CAFE.TABLES[0].chairs[0]; return !!h.target && h.target.x === c.x && h.target.y === c.y; }), 'the hint points at the window chair');
  await t.shot('cocoa');

  // ---- the window seat: sit, see the bus pass, stay put, stand up
  await t.ev(() => { const c = CFG.CAFE.TABLES[0].chairs[0]; T.tp(c.x + 4, c.y + 2, 'cafe'); });
  t.expectEq(await t.ev(() => T.label()), '🪑 Sit down', 'sit label at the window chair');
  await t.ev(() => { T.act(); T.step(5); });
  t.expect(await t.ev(() => !!CafeExt.st.seat && CafeExt.st.seat.ti === 0 && CafeExt.st.seat.ci === 0), 'seated at the window');
  t.expectEq(await t.ev(() => T.label()), '🚶 Stand up', 'stand-up label while seated');
  t.expectEq(await t.ev(() => Game.s.cafe.sits), 1, 'sit counted');
  const bus = await t.ev(() => { const n = T.until(() => CafeExt.st.bus && CafeExt.st.bus.k > 0.3 && CafeExt.st.bus.k < 0.7, 600); return { n, hint: T.hint() }; });
  t.expect(bus.n >= 0, 'the bus rolls past the window');
  t.expectEq(bus.hint, 'Look, the bus! 🚌', 'bus hint at the window seat');
  await t.shot('window');
  const stayed = await t.ev(() => { const c = CFG.CAFE.TABLES[0].chairs[0]; T.steer(1, 1); T.step(40); T.unsteer(); return Math.hypot(Game.player.x - c.x, Game.player.y - c.y); });
  t.expect(stayed < 1, 'the chef stays in the chair while seated');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !CafeExt.st.seat), 'stood up');
  t.expectEq(await t.ev(() => T.label()), '🪑 Sit down', 'can sit again');
  // the cat's chair is taken, and the guest's
  t.expect(await t.ev(() => { const c = CFG.CAFE.TABLES[0].chairs[1]; T.tp(c.x, c.y + 2, 'cafe'); return T.label() !== '🪑 Sit down'; }), 'no sitting on the sleeping cat');
  t.expectEq(await t.ev(() => T.hint()), 'Shh… the cat is napping 🐱', 'cat hint next to the cat');
  t.expect(await t.ev(() => { const c = CFG.CAFE.TABLES[1].chairs[0]; T.tp(c.x, c.y + 2, 'cafe'); return T.label() !== '🪑 Sit down'; }), 'no sitting on the reading guest');

  // ---- the tip jar: $1 in, the barista waves thank you
  const tip = await t.ev(() => {
    const J = CFG.CAFE.JAR.spot; T.tp(J.x, J.y, 'cafe'); T.step(1);
    const hint = T.hint(), label = T.label(); T.act(); T.step(3);
    return { hint, label, cash: Game.s.cash, tips: Game.s.cafe.tips, thank: CafeExt.st.thank, floats: Game.floats.map((f) => f.text), after: T.hint() };
  });
  t.expectEq(tip.hint, 'Drop a coin in the tip jar 🪙', 'tip hint by the jar');
  t.expectEq(tip.label, '🪙 Tip $1', 'tip label by the jar');
  t.expectEq(tip.cash, 25, 'the tip cost $1');
  t.expectEq(tip.tips, 1, 'tip counted');
  t.expect(tip.thank > 0 && tip.floats.includes('Thank you! 👋'), 'the barista says thank you');
  t.expectEq(tip.after, 'The barista says thank you! 👋', 'thank-you hint');
  await t.shot('tip');
  t.expect(await t.ev(() => { Game.s.cash = 0; T.step(1); const l = T.label(); Game.s.cash = 25; return l !== '🪙 Tip $1'; }), 'no tip button without a coin');

  // ---- the croissant and the cake slice (confetti when the cake is finished)
  const treats = await t.ev(() => {
    const P = CFG.CAFE.PADS; T.tp(P.croissant.x, P.croissant.y, 'cafe');
    const n1 = T.until(() => CafeExt.st.croissant > 0, 400);
    T.tp(P.cake.x, P.cake.y, 'cafe');
    const n2 = T.until(() => CafeExt.st.cake > 0, 400);
    return { n1, n2, cash: Game.s.cash, orders: Game.s.cafe.orders, hint: T.hint() };
  });
  t.expect(treats.n1 >= 0 && treats.n2 >= 0, 'the croissant and the cake were served');
  t.expectEq(treats.cash, 16, 'the croissant cost $3 and the cake $6');
  t.expectEq(treats.orders, 3, 'three orders counted');
  await t.ev(() => { T.tp(14360, 3270, 'cafe'); T.step(2); });
  await t.shot('treats');
  const cake = await t.ev(() => { const n = T.until(() => CafeExt.st.cake === 0, 60 * 25); T.step(12); return { n, croissant: CafeExt.st.croissant, confetti: CafeExt.st.confetti.length, floats: Game.floats.map((f) => f.text) }; });
  t.expect(cake.n > 60 * 18 && cake.n < 60 * 21, `the cake is finished after 20 s (${cake.n} steps)`);
  t.expectEq(cake.croissant, 0, 'the croissant is finished after 20 s');
  t.expect(cake.confetti > 0 && cake.floats.includes('All gone! 🎉'), 'confetti when the cake is finished');
  await t.shot('confetti');
  t.expect(await t.ev(() => { T.step(60 * 11); return CafeExt.st.cocoa === 0 && CafeExt.st.confetti.length === 0; }), 'the cocoa is finished after 30 s and the confetti settles');

  // ---- the open-mic song: press the button by the stage, then the room claps
  await t.ev(() => { const B = CFG.CAFE.BUTTON; T.tp(B.x - 26, B.y + 10, 'cafe'); T.step(1); });
  t.expectEq(await t.ev(() => T.hint()), 'Press the button for a song! 🎸', 'song hint by the button');
  t.expectEq(await t.ev(() => T.label()), '🎸 Play a song!', 'song label by the button');
  await t.ev(() => { T.act(); T.step(10); });
  t.expect(await t.ev(() => CafeExt.st.song > 0 && Game.s.cafe.songs === 1), 'the guitarist is playing');
  t.expectEq(await t.ev(() => T.hint()), 'La la la! 🎸', 'song hint');
  t.expect(await t.ev(() => T.label() !== '🎸 Play a song!'), 'the button waits while the song plays');
  await t.ev(() => T.until(() => CafeExt.st.notes.length > 0, 60));
  await t.shot('song');
  const clap = await t.ev(() => { const n = T.until(() => CafeExt.st.clap > 0, 400); return { n, floats: Game.floats.filter((f) => f.text === '👏').length, hint: T.hint() }; });
  t.expect(clap.n >= 0, 'the song ended and the room claps');
  t.expect(clap.floats >= 2, 'the barista and the guest clap');
  t.expectEq(clap.hint, 'Clap clap! 👏', 'clapping hint');
  await t.shot('clap');
  t.expect(await t.ev(() => { T.step(60 * 3); return CafeExt.st.clap === 0 && T.label() === '🎸 Play a song!'; }), 'the button is ready again after the applause');

  // ---- a reload or push into a wall lands back on the mat
  await t.ev(() => { const R = CFG.CAFE.ROOM; T.tp(R.x0 - 10, 3200, 'cafe'); T.step(3); });
  t.expect(await t.ev(() => CafeExt.free(Game.player.x, Game.player.y)), 'pushed into the wall: rescued onto the floor');
  t.expect(await t.ev(() => { const E = CFG.CAFE.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'the rescue lands on the exit mat');
  await t.ev(() => { const C = CFG.CAFE.COUNTER; T.tp((C.x0 + C.x1) / 2, (C.y0 + C.y1) / 2, 'cafe'); T.step(3); });
  t.expect(await t.ev(() => CafeExt.free(Game.player.x, Game.player.y)), 'dropped onto the counter: rescued');
  await t.ev(() => { const S = CFG.CAFE.STAGE; T.tp((S.x0 + S.x1) / 2, (S.y0 + S.y1) / 2, 'cafe'); T.step(3); });
  t.expect(await t.ev(() => CafeExt.free(Game.player.x, Game.player.y)), 'dropped onto the stage: rescued');
  // every chair, pad and spot is reachable floor
  const spots = await t.ev(() => {
    const K = CFG.CAFE, bad = [];
    const all = [K.JAR.spot, { x: K.BUTTON.x - 26, y: K.BUTTON.y + 10 }, K.EXIT].concat(Object.values(K.PADS));
    for (const t of K.TABLES) for (const c of t.chairs) all.push(c);
    for (const s of all) if (!CafeExt.free(s.x, s.y)) bad.push([s.x, s.y]);
    return bad;
  });
  t.expectEq(spots.length, 0, `chairs, pads and spots are free floor: ${JSON.stringify(spots)}`);

  // ---- phone-size café
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.tp(14240, 3312, 'cafe'); T.step(100); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- Take-me-home from a chair
  await t.ev(() => { const c = CFG.CAFE.TABLES[2].chairs[1]; T.tp(c.x, c.y, 'cafe'); T.act(); T.step(5); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'Take-me-home leaves the café');
  t.expect(await t.ev(() => !CafeExt.st.seat), 'the seat is cleared by Take-me-home');
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');
  t.expectEq(await t.ev(() => CafeExt.hint(Game)), undefined, 'no café hint in the town');
  t.expectEq(await t.ev(() => CafeExt.pads(Game).length), 0, 'no café pads in the town');

  // ---- out through the door: back on the sidewalk at the door spot
  await t.ev(() => { const E = CFG.CAFE.EXIT; T.tp(E.x, E.y, 'cafe'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back outside in the City');
  t.expect(await t.ev(() => { const D = CFG.CAFE.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the door spot');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door offers going back in');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '☕ Welcome to the café!').length === 1), 'the welcome toast shows only once');

  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
