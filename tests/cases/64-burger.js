'use strict';
// The burger shop west of the pizzeria, a second restaurant you buy and run: its footprint is clear of roads, trees,
// the pond, the slide's landing mat and the other town things; you can walk there from the slide; closed (peek in)
// until its pad is bought; then the grills fill the pile, the chef carries burgers to the counter, a customer takes
// them and pays at the register (only with someone behind it), the chef collects the cash pile; upgrades and staff
// on pads; the cook and the cashier keep it going without the chef; catch-up while the game was closed; eating a
// burger from the stack, a milkshake, the booths; old saves keep their counts; screenshots.
module.exports = async (t) => {
  await t.boot();
  const K = await t.ev(() => CFG.BURGER);
  t.expect(await t.ev(() => Game.ext.indexOf(BurgerExt) >= 0 && Render.ext.includes(BurgerExt)), 'registered with Game and Render');
  t.expectEq(await t.ev(() => CFG.AREAS.burger && CFG.AREAS.burger.place), 'town', 'the interior belongs to the town (world map)');
  t.expectEq(await t.ev(() => Game.s.burger.owned), false, 'not owned on a new game');

  // ---- the shop's rectangle is clear: no roads, no trees, the pond, the dog's home, the slide's mat, the pizzeria
  const clear = await t.ev((K) => {
    const S = K.SHOP, out = [];
    const inS = (x, y, m = 0) => x > S.x0 - m && x < S.x1 + m && y > S.y0 - m && y < S.y1 + m;
    for (const tr of CFG.TREES) if (inS(tr.x, tr.y, 30) || inS(tr.x, tr.y - 44 * tr.s, 0)) out.push('tree ' + tr.x + ',' + tr.y);
    const P = CFG.POND; if (inS(P.x, P.y, P.rx)) out.push('pond');
    if (inS(CFG.DOG_HOME.x, CFG.DOG_HOME.y, 20)) out.push('dog home');
    const L = CFG.PLAYROOM.TOWN.land; if (inS(L.x, L.y, 40)) out.push('slide mat');
    const B = CFG.BUILDING; if (S.x1 > B.x0 - 20 && S.y0 < B.y1) out.push('pizzeria');
    if (S.x0 < -400 + 20) out.push('West Road');
    if (S.y1 > 920 - 60) out.push('South Road');
    T.tp(K.DOOR_OUT.x, K.DOOR_OUT.y, 'town');
    for (const o of Game.obstacles()) {
      if (o.x === S.x0 && o.y === S.y0) continue;
      if (o.x < S.x1 && o.x + o.w > S.x0 && o.y < S.y1 && o.y + o.h > S.y0) out.push('obstacle ' + JSON.stringify(o));
    }
    // the buy pad: on the grass, off the road, not touching the door mat or the building
    const B2 = K.BUY_PAD;
    if (Game.obstacles().some((o) => Game.hitRect(B2.x, B2.y, 14, o))) out.push('buy pad blocked');
    if (B2.y + 20 > 920 || U.dist(B2.x, B2.y, K.DOOR_OUT.x, K.DOOR_OUT.y) < CFG.PAD_RADIUS + K.REACH + 6) out.push('buy pad placement');
    return out;
  }, K);
  t.expectEq(clear.join('; '), '', 'nothing else in the burger shop rectangle; the buy pad sits clear');
  const solid = await t.ev(() => { T.tp(-276, 760, 'town'); return [Game.obstacles().some((o) => Game.hitRect(-276, 760, 14, o)), Game.townObstacles(true).some((o) => Game.hitRect(-276, 760, 14, o))]; });
  t.expect(solid[0] && solid[1], 'the building is solid for the chef and for cars');

  // ---- walk from the slide's landing mat to the door
  const walk = await t.ev((K) => {
    const L = CFG.PLAYROOM.TOWN.land; T.tp(L.x, L.y, 'town');
    T.steer(0, 1); const a = T.until(() => Game.player.y >= K.DOOR_OUT.y, 600); T.unsteer();
    T.steer(-1, 0); const b = T.until(() => Game.player.x <= K.DOOR_OUT.x, 600); T.unsteer(); T.step(1);
    return { a, b, label: T.label() };
  }, K);
  t.expect(walk.a >= 0 && walk.b >= 0, `walked from the slide mat to the door (${JSON.stringify(walk)})`);
  t.expectEq(walk.label, '🚪 Go inside', 'the door button after walking there');

  // ---- closed: hints, a peek inside, no business
  t.expect(await t.ev((K) => { Game.s.cash = 0; T.tp(K.DOOR_OUT.x + 300, K.DOOR_OUT.y + 40, 'town'); return !/burger/i.test(T.hint() || ''); }, K), 'no burger hint far away');
  t.expectEq(await t.ev((K) => { T.tp(K.DOOR_OUT.x + 40, K.DOOR_OUT.y + 10, 'town'); return T.hint(); }, K), 'Peek inside! 🍔', 'closed and broke: peek inside');
  const rich = await t.ev((K) => { Game.s.cash = 700; T.tp(K.DOOR_OUT.x + 40, K.DOOR_OUT.y + 10, 'town'); return { text: T.hint(), target: Game.hint && Game.hint.target }; }, K);
  t.expectEq(rich.text, 'Buy the burger shop! 🍔', 'with enough money: buy it');
  t.expect(rich.target && rich.target.x === K.BUY_PAD.x, 'the hint points at the buy pad');
  t.expect(await t.ev(() => Game.allPads().some((p) => p.key === 'burgerShop' && p.price === CFG.BURGER.BUY_PRICE)), 'the buy pad is offered');
  await t.ev((K) => { Game.s.cash = 0; T.tp(K.BUY_PAD.x - 50, K.BUY_PAD.y + 10, 'town'); Render.MIN_ZOOMED_VIEW = 150; Render.setZoom(1.4); Game.cameraSnap = true; T.step(2); }, K);
  await t.shot('closed-outside');
  const peek = await t.ev((K) => { T.tp(K.DOOR_OUT.x, K.DOOR_OUT.y, 'town'); T.act(); BurgerExt.st.spawnT = 0; T.step(200); return { area: Game.area, hint: T.hint(), customers: BurgerExt.st.customers.length, pile: Game.s.burger.piles.grill, label: T.label() }; }, K);
  t.expectEq(peek.area, 'burger', 'you can peek inside the closed shop');
  t.expectEq(peek.hint, 'Closed! Buy it outside to open it 🍔', 'inside: it is closed');
  t.expectEq(peek.customers + peek.pile, 0, 'no customers, no burgers while closed');
  t.expectEq(peek.label, '🚪 Go outside', 'the way back out on the mat');
  await t.ev(() => { Render.setZoom(1); Game.cameraSnap = true; T.step(1); });
  await t.shot('closed-inside');

  // ---- buy it on the pad by the door
  const buy = await t.ev((K) => {
    T.tp(K.EXIT.x, K.EXIT.y - 8, 'burger'); T.act();
    Game.s.cash = 1000; T.tp(K.BUY_PAD.x, K.BUY_PAD.y, 'town');
    const n = T.until(() => Game.s.burger.owned, 900);
    return { n, cash: Math.round(Game.s.cash), toast: T.toasts.some((m) => /own the burger shop/.test(m)) };
  }, K);
  t.expect(buy.n >= 0, 'standing on the pad buys the shop');
  t.expectEq(buy.cash, 400, 'it cost $600');
  t.expect(buy.toast, 'a toast says you own it');
  t.expect(await t.ev(() => !Game.allPads().some((p) => p.key === 'burgerShop')), 'the buy pad is gone');
  t.expectEq(await t.ev((K) => { Game.s.cash = 0; T.tp(K.DOOR_OUT.x + 40, K.DOOR_OUT.y + 10, 'town'); return T.hint(); }, K), 'Your burger shop! Go inside 🍔', 'open: go inside');
  await t.ev(() => { Render.setZoom(1.4); Game.cameraSnap = true; T.step(2); });
  await t.shot('open-outside');
  await t.ev(() => { Render.setZoom(1); Game.cameraSnap = true; T.step(1); });

  // ---- inside: the grill makes burgers onto the pile
  const grill = await t.ev((K) => {
    T.tp(K.DOOR_OUT.x, K.DOOR_OUT.y, 'town'); T.act();
    BurgerExt.st.spawnT = 999;   // no customers yet
    const n = T.until(() => Game.s.burger.piles.grill >= 3, 60 * 20);
    return { n, area: Game.area, pile: Game.s.burger.piles.grill };
  }, K);
  t.expectEq(grill.area, 'burger', 'inside');
  t.expect(grill.n > 0, `the grill fills the pile (${JSON.stringify(grill)})`);
  t.expectEq(await t.ev(() => T.hint()), 'Grab the burgers! 🍔', 'hint: grab the burgers');
  // grab them at the pile
  const grab = await t.ev((K) => { const p0 = Game.s.burger.piles.grill; T.tp(K.PILE_STAND.x, K.PILE_STAND.y, 'burger'); T.step(30); return { carry: BurgerExt.st.carry, pile: Game.s.burger.piles.grill, p0, hint: T.hint() }; }, K);
  t.expect(grab.carry >= 3 && grab.pile <= grab.p0 - 3 + 1, `picked burgers up (${JSON.stringify(grab)})`);
  t.expectEq(grab.hint, 'Put the burgers on the counter! 🍔', 'hint: to the counter');
  await t.ev(() => { Render.MIN_ZOOMED_VIEW = 150; Render.setZoom(2); Game.cameraSnap = true; T.step(1); });
  await t.shot('carrying');
  // put them on the counter display
  const drop = await t.ev((K) => { const c0 = BurgerExt.st.carry; T.tp(K.DISPLAY_STAND.x, K.DISPLAY_STAND.y, 'burger'); T.step(30); return { c0, carry: BurgerExt.st.carry, counter: Game.s.burger.piles.counter }; }, K);
  t.expectEq(drop.carry, 0, 'all put down');
  t.expectEq(drop.counter, drop.c0, 'they are on the display');
  // the walls: the kitchen is reachable from the dining room on foot (round the left end of the counter)
  const kit = await t.ev((K) => {
    T.tp(K.EXIT.x, K.EXIT.y - 8, 'burger');
    T.steer(-1, 0); T.until(() => Game.player.x <= K.COUNTER.x0 - 40, 600); T.unsteer();
    T.steer(0, -1); const a = T.until(() => Game.player.y <= K.PILE_STAND.y, 600); T.unsteer();
    return { a, x: Game.player.x, y: Game.player.y };
  }, K);
  t.expect(kit.a >= 0, `walked round into the kitchen (${JSON.stringify(kit)})`);

  // ---- a customer comes in, takes burgers, waits at the register for someone to stand behind it, pays
  const cust = await t.ev((K) => {
    const s = Game.s.burger, st = BurgerExt.st;
    s.piles.counter = 6; s.piles.grill = 0; st.carry = 0; st.customers = []; st.spawnT = 0;
    T.tp(K.DISPLAY_STAND.x - 120, K.DISPLAY_STAND.y, 'burger');   // in the kitchen, away from the register
    const n = T.until(() => st.customers.some((c) => c.state === 'pay' && U.dist(c.x, c.y, K.PAY.x, K.PAY.y) < 2), 60 * 20);
    st.spawnT = 999;
    const c = st.customers.find((q) => q.state === 'pay');
    T.step(120);
    return { n, have: c && c.have, want: c && c.want, counter: s.piles.counter, paid: c && c.pay, cash: s.piles.cash, hint: T.hint() };
  }, K);
  t.expect(cust.n >= 0 && cust.have === cust.want, `a customer took burgers and went to pay (${JSON.stringify(cust)})`);
  t.expectEq(cust.counter, 6 - cust.want, 'burgers came off the display');
  t.expectEq(cust.paid, 0, 'nobody at the register: the customer waits');
  t.expectEq(cust.hint, 'Stand at the register to take the money! 💵', 'hint: stand at the register');
  await t.ev((K) => { T.tp(K.CASHIER_SPOT.x, K.CASHIER_SPOT.y, 'burger'); Render.setZoom(1.6); Game.cameraSnap = true; T.step(20); }, K);
  await t.shot('paying');
  const paid = await t.ev((K) => { const n = T.until(() => Game.s.burger.piles.cash > 0, 200); return { n, cash: Game.s.burger.piles.cash, served: Game.s.burger.served }; }, K);
  t.expect(paid.n >= 0, 'with the chef at the register the customer pays');
  t.expectEq(paid.cash, cust.want * K.PRICE, 'into the cash pile');
  t.expectEq(await t.ev(() => T.hint()), 'Grab the money! 💵', 'hint: grab the money');
  const col = await t.ev((K) => { const c0 = Game.s.cash; T.tp(K.CASH.x, K.CASH.y, 'burger'); T.step(2); return { got: Game.s.cash - c0, pile: Game.s.burger.piles.cash }; }, K);
  t.expectEq(col.got, paid.cash, 'walking over the pile collects it');
  t.expectEq(col.pile, 0, 'the pile is empty');
  // the customer leaves (or sits in a booth first, leaving a tip)
  const gone = await t.ev(() => { const st = BurgerExt.st; for (const c of st.customers) if (c.state === 'eating') c.eat = 99; return T.until(() => st.customers.length === 0, 60 * 30); });
  t.expect(gone >= 0, 'the customer leaves');
  // a booth customer leaves a tip, which the chef picks up
  const tip = await t.ev((K) => {
    const st = BurgerExt.st, s = Game.s.burger, q = BurgerExt.seats()[1];
    s.tips = [0, 0];
    st.customers.push({ id: 99, x: q.x + 26, y: q.y, state: 'eating', route: [], want: 1, have: 1, cd: 0, pay: 0, booth: 1, eat: CFG.BURGER.EAT_T - 0.05, facing: -1, moving: false, bob: 0, shirt: '#59a14f', skin: '#f1c27d', hair: '#2b1d14', hairStyle: 1 });
    T.tp(K.EXIT.x, K.EXIT.y - 8, 'burger'); T.step(10);
    const left = s.tips[1], c0 = Game.s.cash;
    T.tp(q.spot.x, q.spot.y, 'burger'); T.step(2);
    return { left, got: Game.s.cash - c0, after: s.tips[1] };
  }, K);
  t.expectEq(tip.left, K.TIP, 'the booth customer left a tip');
  t.expectEq(tip.got, K.TIP, 'the chef pockets the tip');

  // ---- fun: eat a burger from the stack you carry; a milkshake; sit in a booth
  const eat = await t.ev(() => {
    const st = BurgerExt.st; st.customers = [];
    T.tp(34300, 4220, 'burger'); st.carry = 2; T.step(1);
    const label = T.label(); T.act();
    const carry = st.carry;
    T.until(() => st.order && st.order.bites >= 1, 200);
    return { label, carry, chomp: Game.floats.some((f) => f.text === 'CHOMP!') };
  });
  t.expectEq(eat.label, '😋 Eat a burger', 'eat button while carrying burgers');
  t.expectEq(eat.carry, 1, 'one burger off the stack');
  t.expect(eat.chomp, 'CHOMP!');
  await t.ev(() => { BurgerExt.st.order.t = CFG.BURGER.T.bite * 0.5; BurgerExt.st.order.bites = 1; Render.setZoom(2.2); Game.cameraSnap = true; T.step(1); });
  await t.shot('chomp');
  const yum = await t.ev(() => { const e0 = Game.s.burger.eaten; T.until(() => !BurgerExt.st.order, 400); return { eaten: Game.s.burger.eaten - e0, yum: Game.floats.some((f) => f.text === 'Yum! 😋') }; });
  t.expect(yum.eaten === 1 && yum.yum, `eaten, Yum! (${JSON.stringify(yum)})`);
  const shake = await t.ev((K) => { BurgerExt.st.carry = 0; T.tp(K.SHAKE_SPOT.x, K.SHAKE_SPOT.y, 'burger'); const label = T.label(); T.act(); T.until(() => !BurgerExt.st.order, 800); return { label, n: Game.s.burger.shakes }; }, K);
  t.expectEq(shake.label, '🥤 Make a milkshake', 'milkshake button at the machine');
  t.expectEq(shake.n, 1, 'milkshake drunk');
  const sit = await t.ev(() => {
    BurgerExt.st.customers = [];
    const q = BurgerExt.seats()[0]; T.tp(q.spot.x, q.spot.y, 'burger');
    const label = T.label(); T.act();
    const at = { x: Game.player.x, y: Game.player.y, label: T.label() };
    T.steer(-1, 0); T.step(30); T.unsteer();
    const still = Game.player.x === at.x && Game.player.y === at.y;
    T.act();
    return { label, at, still, after: T.label(), free: BurgerExt.free(Game.player.x, Game.player.y) };
  });
  t.expectEq(sit.label, '🪑 Sit down', 'sit button by the booth');
  t.expectEq(sit.at.label, '🚶 Stand up', 'stand-up button while seated');
  t.expect(sit.still && sit.free && sit.after !== '🚶 Stand up', 'stays seated, then stands up onto free floor');

  // ---- every spot inside is on free floor
  const spots = await t.ev((K) => {
    const bad = [];
    for (const k of ['PILE_STAND', 'DISPLAY_STAND', 'CASHIER_SPOT', 'SHAKE_SPOT', 'CASH']) if (!BurgerExt.free(K[k].x, K[k].y)) bad.push(k);
    for (const [k, P] of Object.entries(K.PADS)) if (!BurgerExt.free(P.x, P.y)) bad.push('pad ' + k);
    for (let i = 0; i < K.QUEUE.max; i++) { if (!BurgerExt.free(K.QUEUE.x, K.QUEUE.y + i * K.QUEUE.dy)) bad.push('queue' + i); if (!BurgerExt.free(K.PAY.x, K.PAY.y + i * K.PAY.dy)) bad.push('pay' + i); }
    BurgerExt.seats().forEach((q, i) => { if (!BurgerExt.free(q.spot.x, q.spot.y)) bad.push('seat' + i); });
    if (!BurgerExt.free(K.EXIT.x, K.EXIT.y - 8)) bad.push('exit');
    // pads do not overlap each other or the standing spots
    const pads = Object.values(K.PADS);
    for (let i = 0; i < pads.length; i++) for (let j = i + 1; j < pads.length; j++) if (U.dist(pads[i].x, pads[i].y, pads[j].x, pads[j].y) < 2 * CFG.PAD_RADIUS) bad.push('pads overlap');
    for (const P of pads) for (const pt of [K.PILE_STAND, K.DISPLAY_STAND, K.CASHIER_SPOT, K.SHAKE_SPOT, K.EXIT, { x: K.QUEUE.x, y: K.QUEUE.y }]) if (U.dist(P.x, P.y, pt.x, pt.y) < CFG.PAD_RADIUS + 30) bad.push('pad near a spot');
    return bad;
  }, K);
  t.expectEq(spots.join(','), '', 'all spots on free floor, pads clear of them');

  // ---- upgrades and staff on pads
  const pads = await t.ev((K) => {
    const s = Game.s.burger, out = {};
    const buyPad = (key) => {
      const pad = BurgerExt.pads(Game).find((p) => p.key === key); if (!pad) return 'missing';
      const before = JSON.stringify([s.grillLv, s.grills, s.carryLv, s.cook, s.cashier]);
      Game.s.cash = 5000; T.tp(pad.pos.x, pad.pos.y, 'burger');
      const n = T.until(() => JSON.stringify([s.grillLv, s.grills, s.carryLv, s.cook, s.cashier]) !== before, 900);
      T.tp(K.EXIT.x, K.EXIT.y - 8, 'burger'); T.step(70);
      return n >= 0 ? pad.price : 'stuck';
    };
    const t0 = BurgerExt.grillTime(Game), cap0 = BurgerExt.carryCap(Game);
    out.grill1 = buyPad('burgerGrill'); out.grill2 = buyPad('burgerGrill');
    out.faster = BurgerExt.grillTime(Game) < t0;
    out.second = buyPad('burgerGrill2'); out.grills = s.grills;
    out.carry = buyPad('burgerCarry'); out.bigger = BurgerExt.carryCap(Game) > cap0;
    out.cook = buyPad('burgerCook'); out.cashier = buyPad('burgerCashier');
    out.staff = BurgerExt.st.staff.map((w) => w.role).sort().join(',');
    out.left = BurgerExt.pads(Game).map((p) => p.key).join(',');
    return out;
  }, K);
  t.expect(typeof pads.grill1 === 'number' && typeof pads.grill2 === 'number' && pads.grill2 > pads.grill1, `Faster Grill twice, the second one dearer (${JSON.stringify(pads)})`);
  t.expect(pads.faster, 'the grill is faster');
  t.expect(typeof pads.second === 'number' && pads.grills === 2, '2nd grill bought');
  t.expect(typeof pads.carry === 'number' && pads.bigger, 'carry more');
  t.expect(typeof pads.cook === 'number' && typeof pads.cashier === 'number', 'cook and cashier hired');
  t.expectEq(pads.staff, 'cashier,cook', 'both staff are there');
  t.expectEq(pads.left, 'burgerGrill,burgerCarry', 'only the leveled pads stay');

  // ---- staff run the shop while the chef is out in town
  const staffRun = await t.ev((K) => {
    const s = Game.s.burger, st = BurgerExt.st;
    s.piles.grill = 6; s.piles.counter = 0; s.piles.cash = 0; st.customers = []; st.spawnT = 0;
    T.tp(K.EXIT.x, K.EXIT.y - 8, 'burger'); T.act();   // out into town
    const served0 = s.served;
    T.step(60 * 40);
    return { area: Game.area, served: s.served - served0, cash: s.piles.cash, counterFed: s.piles.counter > 0 || s.served > served0 };
  }, K);
  t.expectEq(staffRun.area, 'town', 'the chef is away in town');
  t.expect(staffRun.served > 0 && staffRun.cash > 0, `the cook and the cashier keep selling (${JSON.stringify(staffRun)})`);
  await t.ev((K) => { T.tp(K.DOOR_OUT.x, K.DOOR_OUT.y, 'town'); T.act(); T.tp(K.QUEUE.x - 60, K.QUEUE.y + 60, 'burger'); BurgerExt.st.spawnT = 0; T.step(60 * 6); Render.setZoom(1); Game.cameraSnap = true; T.step(1); }, K);
  await t.shot('busy');

  // ---- the game was closed for an hour: the pile is full, some burgers got sold
  const away = await t.ev(() => {
    const s = Game.s.burger; s.piles.cash = 0; s.piles.grill = 0;
    Game.s.savedAt = Date.now() - 3600 * 1000;
    BurgerExt.build(Game);
    return { cash: s.piles.cash, pile: s.piles.grill, cap: BurgerExt.pileCap(Game), msg: BurgerExt.st.awayMsg };
  });
  t.expect(away.cash > 0 && away.pile === away.cap, `caught up after an hour away (${JSON.stringify(away)})`);
  t.expect(/while you were away/.test(away.msg || ''), 'a welcome-back message');

  // ---- saved across a reload
  const saved = await t.ev(() => { Game.save(); const s = Game.s.burger; return { owned: s.owned, cook: s.cook, grills: s.grills, eaten: s.eaten }; });
  await t.reload();
  const loaded = await t.ev(() => { const s = Game.s.burger; return { owned: s.owned, cook: s.cook, grills: s.grills, eaten: s.eaten, staff: BurgerExt.st.staff.length }; });
  t.expectEq(JSON.stringify([loaded.owned, loaded.cook, loaded.grills, loaded.eaten]), JSON.stringify([saved.owned, saved.cook, saved.grills, saved.eaten]), 'the shop survives a reload');
  t.expectEq(loaded.staff, 2, 'the staff are back after a reload');

  // ---- an old save from the snack-bar days keeps its counts and gets the new fields
  const old = await t.ev(() => {
    Game.s.burger = { seen: true, eaten: 5, fries: 2, shakes: 1, sits: 3 };
    const s = BurgerExt.state(Game);
    return { eaten: s.eaten, fries: s.fries, owned: s.owned, piles: s.piles, grills: s.grills };
  });
  t.expect(old.eaten === 5 && old.fries === 2 && old.owned === false && old.grills === 1 && old.piles && old.piles.cash === 0, `old save migrated (${JSON.stringify(old)})`);

  // ---- rescue, Take-me-home, no door while driving
  await t.boot();
  const misc = await t.ev((K) => {
    const out = {};
    T.tp(K.DOOR_OUT.x, K.DOOR_OUT.y, 'town'); T.act();
    Game.player.x = K.DISPLAY.x; Game.player.y = K.DISPLAY.y; T.step(2);
    out.rescued = Math.abs(Game.player.x - K.EXIT.x) < 2;
    BurgerExt.st.carry = 3; Game.goHome(); T.step(5);
    out.home = { area: Game.area, carry: BurgerExt.st.carry };
    T.tp(K.DOOR_OUT.x, K.DOOR_OUT.y, 'town'); const v = Game.vehicles()[0];
    Game.driving = true; Game.vehicle = v; out.label = Game.actionLabel(); out.hint = BurgerExt.hint(Game); Game.driving = false; Game.vehicle = null;
    return out;
  }, K);
  t.expect(misc.rescued, 'stuck in the counter: back on the mat');
  t.expect(misc.home.area === 'town' && misc.home.carry === 0, 'Take-me-home drops the burgers');
  t.expect(misc.label !== '🚪 Go inside' && misc.hint === undefined, 'no door button or hint while driving');

  // ---- phone screenshot: carrying burgers past the counter with customers waiting
  await t.boot({ viewport: { width: 390, height: 844 } });
  await t.ev((K) => {
    Game.s.burger.owned = true; Game.s.burger.cashier = true; BurgerExt.build(Game);
    T.tp(K.DOOR_OUT.x, K.DOOR_OUT.y, 'town'); T.act(); BurgerExt.st.spawnT = 0; T.step(60 * 5);
    T.tp(K.DISPLAY_STAND.x - 60, K.DISPLAY_STAND.y, 'burger'); BurgerExt.st.carry = 4;
    Render.MIN_ZOOMED_VIEW = 120; Render.setZoom(1.8); Game.cameraSnap = true; T.step(1);
  }, K);
  await t.shot('phone');
  t.assertNoPageErrors();
};
