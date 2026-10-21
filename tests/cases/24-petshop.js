'use strict';
// The Pet Shop (City building 4): the door's label and hint on the sidewalk, going in, the puppies running to the
// fence and the pats, the parrot's button, the bag of treats (the puppies follow), the goldfish picture, the solid
// furniture, a rescue from the wall, going back out onto the door spot and Take-me-home from inside.
module.exports = async (t) => {
  // until the coordinator wires js/city-petshop.js into index.html, slip it in before main.js
  await t.page.route((u) => u.pathname === '/', async (route) => {
    const res = await route.fetch();
    let body = await res.text();
    if (!body.includes('city-petshop.js')) body = body.replace('<script src="js/main.js">', '<script src="js/city-petshop.js"></script>\n  <script src="js/main.js">');
    await route.fulfill({ response: res, body, headers: Object.assign({}, res.headers(), { 'content-type': 'text/html' }) });
  });
  await t.boot();
  t.expect(await t.ev(() => typeof PetShopExt !== 'undefined' && Game.ext.indexOf(PetShopExt) < Game.ext.indexOf(CityExt)), 'the pet shop extension is loaded and first in line');
  t.expect(await t.ev(() => !!CFG.AREAS.petshop && CFG.AREAS.petshop.WORLD.x0 === 2300 && CFG.AREAS.petshop.WORLD.y1 === 3400), 'the interior map is registered in its reserved rectangle');

  // ---- far from the door the shop keeps quiet (the City's own hints and buttons show)
  await t.ev(() => T.tp(5200, 300, 'city'));
  t.expectEq(await t.ev(() => PetShopExt.hint(Game) === undefined), true, 'no pet shop hint away from the door');
  t.expectEq(await t.ev(() => PetShopExt.action(Game)), null, 'no pet shop button away from the door');

  // ---- outside: the hint points at the door, the label at the door
  await t.ev(() => T.tp(5600, 24, 'city'));
  t.expectEq(await t.ev(() => T.hint()), 'Go inside the Pet Shop! 🐾', 'door hint near the shop');
  t.expect(await t.ev(() => Game.hint.target && Math.abs(Game.hint.target.x - 5530) < 1 && Math.abs(Game.hint.target.y - 14) < 1), 'the hint arrow points at the door spot');
  await t.ev(() => { const D = CFG.PETSHOP.DOOR; T.tp(D.x, D.y, 'city'); Render.setZoom(1.3); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  t.expect(await t.ev(() => !Game.hint.target), 'no arrow once standing at the door');
  await t.shot('city-door');

  // ---- go inside
  await t.ev(() => { Render.setZoom(1); T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'petshop', 'inside the pet shop');
  t.expect(await t.ev(() => { const E = CFG.PETSHOP.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'standing on the mat inside the door');
  t.expect(await t.ev(() => PetShopExt.free(Game.player.x, Game.player.y)), 'the mat is free floor');
  t.expect(await t.ev(() => T.toasts.includes('🐾 Welcome to the Pet Shop!')), 'welcome toast the first time');
  t.expect(await t.ev(() => Game.s.petshop.seen), 'the visit is remembered');
  const h0 = await t.ev(() => ({ text: T.hint(), target: Game.hint && Game.hint.target, W: CFG.PETSHOP.WORLD }));
  t.expect(typeof h0.text === 'string' && h0.text.length > 0, 'a hint inside the shop');
  t.expect(!h0.target || (h0.target.x > h0.W.x0 && h0.target.x < h0.W.x1 && h0.target.y > h0.W.y0 && h0.target.y < h0.W.y1), 'the inside hint does not point out of the map');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.shot('shop');

  // ---- the furniture is solid, the floor around the pads is not
  const solid = await t.ev(() => {
    const K = CFG.PETSHOP, o = Game.obstacles(), hit = (x, y) => o.some((b) => Game.hitRect(x, y, 12, b));
    return { tank: hit((K.TANK.x0 + K.TANK.x1) / 2, (K.TANK.y0 + K.TANK.y1) / 2), pen: hit((K.PEN.x0 + K.PEN.x1) / 2, (K.PEN.y0 + K.PEN.y1) / 2), tower: hit(K.TOWER.x0 + 10, K.TOWER.y0 + 10), hutch: hit(K.HUTCH.x0 + 10, K.HUTCH.y1 - 10), cage: hit(K.HAMSTER.x1 - 10, K.HAMSTER.y1 - 10), counter: hit(K.COUNTER.x0 + 20, K.COUNTER.y0 + 20), treats: hit(K.PADS.treats.x, K.PADS.treats.y), bowl: hit(K.PADS.bowl.x, K.PADS.bowl.y), exit: hit(K.EXIT.x, K.EXIT.y - 8) };
  });
  t.expect(solid.tank && solid.pen && solid.tower && solid.hutch && solid.cage && solid.counter, `the tank, pen, tower, hutch, cage and counter are solid (${JSON.stringify(solid)})`);
  t.expect(!solid.treats && !solid.bowl && !solid.exit, 'the circles and the mat are open floor');

  // ---- the puppies run to the fence and wag; pat them for hearts
  await t.ev(() => { const P = CFG.PETSHOP.PEN; T.tp(P.x1 + 26, (P.y0 + P.y1) / 2, 'petshop'); T.step(240); });
  t.expectEq(await t.ev(() => T.label()), '🐾 Pat the puppies', 'pat label by the pen');
  t.expectEq(await t.ev(() => T.hint()), 'Pat the puppies! 🐾', 'pat hint by the pen');
  const fence = await t.ev(() => { const P = CFG.PETSHOP.PEN; return PetShopExt.st.puppies.map((q) => ({ dx: Math.round(P.x1 - q.x), inPen: q.x > P.x0 && q.x < P.x1 && q.y > P.y0 && q.y < P.y1, facing: q.facing })); });
  t.expect(fence.every((q) => q.inPen && q.dx <= 20 && q.facing === 1), `both puppies came to the fence nearest the chef, looking at them (${JSON.stringify(fence)})`);
  const pat = await t.ev(() => { const n0 = Game.floats.length; T.act(); return { hearts: Game.floats.length - n0, pats: PetShopExt.st.pats, stat: Game.s.stats.puppyPats, jumping: PetShopExt.st.puppies.every((q) => q.jump > 0) }; });
  t.expect(pat.hearts >= 4 && pat.pats === 1 && pat.stat === 1 && pat.jumping, `a pat makes hearts and the puppies jump (${JSON.stringify(pat)})`);
  await t.shot('puppies');
  // away from the pen they wander back inside
  await t.ev(() => { T.tp(2640, 3300, 'petshop'); T.step(300); });
  t.expect(await t.ev(() => { const P = CFG.PETSHOP.PEN; return PetShopExt.st.puppies.every((q) => q.x > P.x0 && q.x < P.x1 && q.y > P.y0 && q.y < P.y1); }), 'the puppies stay in their pen');

  // ---- the parrot says a word when you press the button
  await t.ev(() => { const P = CFG.PETSHOP.PERCH; T.tp(P.x - 30, P.y + 20, 'petshop'); });
  t.expectEq(await t.ev(() => T.label()), '🦜 Press the button', 'parrot button label');
  t.expectEq(await t.ev(() => T.hint()), 'Press the button! 🦜', 'parrot hint');
  await t.ev(() => T.act());
  t.expectEq(await t.ev(() => PetShopExt.st.parrot.say), 'Pizza! 🍕', 'the parrot says Pizza!');
  t.expect(await t.ev(() => PetShopExt.st.parrot.sayT > 2), 'the word stays up for a while');
  t.expectEq(await t.ev(() => T.hint()), 'The parrot can talk! 🦜', 'hint while the parrot talks');
  await t.shot('parrot');
  await t.ev(() => T.step(200));
  t.expectEq(await t.ev(() => PetShopExt.st.parrot.say), null, 'the bubble goes away again');

  // ---- a bag of treats: $4, carried 30 s, the puppies hop out and follow
  const treats = await t.ev(() => {
    Game.s.cash = 20; const P = CFG.PETSHOP.PADS.treats; T.tp(P.x, P.y, 'petshop');
    const n = T.until(() => PetShopExt.st.treats > 0, 400);
    return { n, cash: Game.s.cash, left: PetShopExt.st.treats, bags: Game.s.stats.treatBags, hint: T.hint() };
  });
  t.expect(treats.n >= 0, 'the treats circle sold a bag');
  t.expectEq(treats.cash, 16, 'treats cost $4');
  t.expect(treats.left > 29 && treats.left <= 30, 'treats last 30 s');
  t.expectEq(treats.bags, 1, 'bag counted in the stats');
  t.expectEq(treats.hint, 'The puppies are following you! 🐶', 'treats hint');
  const follow = await t.ev(() => {
    T.tp(2640, 3300, 'petshop'); T.step(240);
    const P = CFG.PETSHOP.PEN, p = Game.player;
    return PetShopExt.st.puppies.map((q) => ({ d: Math.round(Math.hypot(q.x - p.x, q.y - p.y)), out: q.out, inPen: q.x > P.x0 && q.x < P.x1 && q.y > P.y0 && q.y < P.y1 }));
  });
  t.expect(follow.every((q) => q.out && !q.inPen && q.d < 80), `both puppies left the pen and follow the chef (${JSON.stringify(follow)})`);
  await t.shot('treats');
  // when the treats run out they trot home
  const home = await t.ev(() => { PetShopExt.st.treats = 0.05; T.step(6); const P = CFG.PETSHOP.PEN; const n = T.until(() => PetShopExt.st.puppies.every((q) => !q.out && q.x > P.x0 && q.x < P.x1 && q.y > P.y0 && q.y < P.y1), 900); return { n, left: PetShopExt.st.treats }; });
  t.expect(home.left === 0 && home.n >= 0, `the puppies went back to the pen after the treats (${JSON.stringify(home)})`);

  // ---- the goldfish bowl picture: $6, hangs on the wall for good
  const pic = await t.ev(() => {
    const P = CFG.PETSHOP.PADS.bowl; T.tp(P.x, P.y, 'petshop');
    const n = T.until(() => Game.s.petshop.bowlPic, 500);
    return { n, cash: Game.s.cash, pads: Game.allPads().filter((p) => p.kind === 'ext' && p.ext === PetShopExt).map((p) => p.key) };
  });
  t.expect(pic.n >= 0, 'the picture circle sold the picture');
  t.expectEq(pic.cash, 10, 'the picture cost $6');
  t.expectEq(pic.pads.join(','), 'petTreats', 'the picture circle is gone once bought; treats stay on sale');
  await t.ev(() => { T.tp(2560, 3140, 'petshop'); T.step(2); });
  await t.shot('picture');

  // ---- a push into the wall is rescued onto the mat
  await t.ev(() => { Game.player.x = 2316; Game.player.y = 3200; T.step(3); });
  t.expect(await t.ev(() => { const E = CFG.PETSHOP.EXIT, p = Game.player; return PetShopExt.free(p.x, p.y) && Math.hypot(p.x - E.x, p.y - (E.y - 8)) < 2; }), 'pushed into the wall: back on the mat');

  // ---- phone-size shop
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.tp(2600, 3250, 'petshop'); T.step(2); });
  await t.shot('shop-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); const E = CFG.PETSHOP.EXIT; T.tp(E.x, E.y, 'petshop'); });

  // ---- back out onto the door spot
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back in the City');
  t.expect(await t.ev(() => { const D = CFG.PETSHOP.DOOR; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 1; }), 'standing on the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');

  // ---- Take-me-home from inside clears the shop's state
  await t.ev(() => { T.act(); T.step(5); });
  t.expectEq(await t.ev(() => Game.area), 'petshop', 'inside again');
  t.expect(await t.ev(() => !T.toasts.filter((m) => m === '🐾 Welcome to the Pet Shop!')[1]), 'the welcome toast shows only once');
  await t.ev(() => { PetShopExt.st.treats = 10; PetShopExt.pressButton(Game); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'home at the pizza shop');
  t.expect(await t.ev(() => PetShopExt.st.treats === 0 && PetShopExt.st.parrot.say === null && PetShopExt.st.puppies.every((q) => !q.out)), 'treats, parrot and puppies reset by Take-me-home');
  t.expectEq(await t.ev(() => PetShopExt.hint(Game) === undefined), true, 'no pet shop hint back in town');
};
