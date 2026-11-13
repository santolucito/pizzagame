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
    const L = PlayroomExt.townLand(); if (inS(L.x, L.y, 40)) out.push('slide mat');
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
    const L = PlayroomExt.townLand(); T.tp(L.x, L.y, 'town');
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
    st.spawnT = 999; st.groupLeft = 0;   // just the one who came in (no friends behind them)
    const n = T.until(() => st.customers.some((c) => c.state === 'paying' && U.dist(c.x, c.y, K.PAY.x, K.PAY.y) < 2), 60 * 20);
    const c = st.customers.find((q) => q.state === 'paying');
    T.step(120);
    return { n, have: c && c.have, want: c && c.want, counter: s.piles.counter, paid: c && c.payProg, cash: s.piles.cash, hint: T.hint(), shared: c instanceof ShopCustomer };
  }, K);
  t.expect(cust.n >= 0 && cust.have === cust.want, `a customer took burgers and went to pay (${JSON.stringify(cust)})`);
  t.expectEq(cust.counter, 6 - cust.want, 'burgers came off the display');
  t.expect(cust.shared, 'a burger customer is the shared shop customer (js/shop.js), like the pizzeria\'s');
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
  const gone = await t.ev(() => { const st = BurgerExt.st; for (const c of st.customers) if (c.state === 'eating') c.timer = 0; return T.until(() => st.customers.length === 0, 60 * 30); });
  t.expect(gone >= 0, 'the customer leaves');
  // a booth customer leaves a tip, which the chef picks up
  const tip = await t.ev((K) => {
    const st = BurgerExt.st, s = Game.s.burger, q = BurgerExt.seats()[1];
    s.tips = [0, 0];
    const c = new ShopCustomer(BurgerShop, 99, 1), tb = st.tables[1];
    c.x = q.x + 26; c.y = q.y; c.have = 1; c.state = 'eating'; c.table = tb; tb.occupied = c; c.eatDur = CFG.BURGER.EAT_T; c.timer = 0.05;
    st.customers.push(c);
    T.tp(K.EXIT.x, K.EXIT.y - 8, 'burger'); T.step(10);
    const left = s.tips[1], c0 = Game.s.cash;
    T.tp(q.spot.x, q.spot.y, 'burger'); T.step(2);
    return { left, got: Game.s.cash - c0, after: s.tips[1] };
  }, K);
  const tipWant = Math.round(K.PRICE * K.TIP_RATE);
  t.expectEq(tip.left, tipWant, 'the booth customer left a tip (the shared rule: a share of the bill)');
  t.expectEq(tip.got, tipWant, 'the chef pockets the tip');

  // ---- the pizzeria's patience rule: the bar runs down, the face turns grumpy, then "Too slow!" and out
  const mad = await t.ev((K) => {
    const st = BurgerExt.st, s = Game.s.burger;
    st.customers = []; st.spawnT = 999; st.groupLeft = 0; s.piles.counter = 0; s.piles.grill = 0; st.grills.forEach((gr) => { gr.t = -1e9; });
    T.tp(K.EXIT.x, K.EXIT.y - 8, 'burger');
    const c = new ShopCustomer(BurgerShop, 98, 2); st.customers.push(c);
    const lost0 = s.lost, out = { full: c.patience === c.patienceMax };
    out.reach = T.until(() => c.state === 'queue', 60 * 10);
    c.patience = c.patienceMax * 0.2; T.step(1);
    out.grumpy = c.angry && c.state === 'queue';
    c.patience = 0.01; T.step(2);
    out.left = c.state === 'route' && c.after === 'gone' && c.angry;
    out.lost = s.lost - lost0;
    out.slow = Game.floats.some((f) => f.text === 'Too slow!');
    out.gone = T.until(() => !st.customers.includes(c), 60 * 15) >= 0;
    st.grills.forEach((gr) => { gr.t = 0; });
    return out;
  }, K);
  t.expect(mad.full && mad.reach >= 0, `a fresh customer has full patience and lines up (${JSON.stringify(mad)})`);
  t.expect(mad.grumpy, 'low on patience: a grumpy face');
  t.expect(mad.left && mad.lost === 1 && mad.slow, `out of patience: "Too slow!" and away (${JSON.stringify(mad)})`);
  t.expect(mad.gone, 'the angry customer walks out of the door');

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
    // pads (the shop's and the decorations') do not overlap each other or the standing spots
    const pads = Object.values(K.PADS).concat(K.DECOR.map((it) => it.pad));
    for (const P of pads) if (!BurgerExt.free(P.x, P.y)) bad.push('pad ' + P.x + ',' + P.y);
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
    out.left = BurgerExt.pads(Game).filter((p) => !p.item).map((p) => p.key).join(',');
    return out;
  }, K);
  t.expect(typeof pads.grill1 === 'number' && typeof pads.grill2 === 'number' && pads.grill2 > pads.grill1, `Faster Grill twice, the second one dearer (${JSON.stringify(pads)})`);
  t.expect(pads.faster, 'the grill is faster');
  t.expect(typeof pads.second === 'number' && pads.grills === 2, '2nd grill bought');
  t.expect(typeof pads.carry === 'number' && pads.bigger, 'carry more');
  t.expect(typeof pads.cook === 'number' && typeof pads.cashier === 'number', 'cook and cashier hired');
  t.expectEq(pads.staff, 'cashier,cook', 'both staff are there');
  t.expect(await t.ev(() => BurgerExt.st.staff.every((w) => w instanceof ShopStaff)), 'the burger staff are the shared shop staff, like the pizzeria\'s');
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

  // ---- decorations, like the pizzeria's: a ghost where each goes, a pad to buy it, then it is drawn for real,
  // customers wait longer and come more often, it is saved, and nothing ends up in anybody's way
  await t.boot();
  // every ghost() call records its key and how faded it was drawn
  const ghostSpy = () => {
    window.decorLog = {};
    if (!BurgerExt._ghost0) { BurgerExt._ghost0 = BurgerExt.ghost; BurgerExt.ghost = function (r, g, key, fn) { return BurgerExt._ghost0.call(this, r, g, key, () => { window.decorLog[key] = r.ctx.globalAlpha < 0.5 ? 'ghost' : 'full'; fn(); }); }; }
    Render.invalidateBackgrounds(); Render.draw(Game);
    return window.decorLog;
  };
  const dec0 = await t.ev((a) => {
    const K = a.K;
    Game.s.burger.owned = true; BurgerExt.build(Game);
    T.tp(K.DOOR_OUT.x, K.DOOR_OUT.y, 'town'); T.act();
    BurgerExt.st.spawnT = 999; BurgerExt.st.customers = [];
    T.tp(K.EXIT.x, K.EXIT.y - 8, 'burger'); Render.setZoom(1); Game.cameraSnap = true; T.step(1);
    const log = (0, eval)('(' + a.spy + ')')();
    return {
      area: Game.area, decor: JSON.stringify(Game.s.burger.decor), count: BurgerExt.decorCount(Game), log: JSON.stringify(log),
      pads: BurgerExt.pads(Game).filter((p) => p.item).map((p) => p.item + ':' + p.price).join(','),
      patience: BurgerShop.patience(), spawn: BurgerExt.spawnTime(Game), obs: BurgerExt.st.obs.length,
    };
  }, { K, spy: ghostSpy.toString() });
  t.expectEq(dec0.area, 'burger', 'inside the open shop');
  t.expectEq(dec0.decor, '{}', 'a new game has no decorations');
  t.expectEq(dec0.count, 0, 'none counted');
  t.expectEq(dec0.pads, K.DECOR.map((it) => it.key + ':' + it.price).join(','), 'a pad for each decoration, at its price');
  t.expect(K.DECOR.length >= 4 && K.DECOR.every((it) => it.price >= 50 && it.price <= 260), 'four or five decorations at $50-$260');
  t.expect(K.DECOR.every((it) => JSON.parse(dec0.log)[it.key] === 'ghost'), `every decoration is drawn as a faded ghost before it is bought (${dec0.log})`);
  await t.shot('decor-ghosts');
  await t.ev(() => { Render.MIN_ZOOMED_VIEW = 150; Render.setZoom(1.8); T.tp(34300, 4420, 'burger'); Game.cameraSnap = true; T.step(1); });
  await t.shot('decor-pads');
  await t.ev(() => { Render.setZoom(1); Game.cameraSnap = true; T.step(1); });

  // buy each one on its pad: money goes, the toast, a sparkle where it appears, it counts, and it draws for real
  const bought = await t.ev((a) => {
    const K = a.K, out = [];
    let pat = BurgerShop.patience(), sp = BurgerExt.spawnTime(Game);
    for (const it of K.DECOR) {
      const pad = BurgerExt.pads(Game).find((p) => p.item === it.key);
      Game.s.cash = it.price + 7;
      T.tp(K.EXIT.x, K.EXIT.y - 8, 'burger'); T.tp(pad.pos.x, pad.pos.y, 'burger');
      const n = T.until(() => Game.s.burger.decor[it.key], 900);
      const sparks = BurgerExt.st.sparks.filter((q) => it.spots.some((s) => s.x === q.x && s.y === q.y)).length;
      const p2 = BurgerShop.patience(), s2 = BurgerExt.spawnTime(Game);
      out.push({ key: it.key, n, cash: Math.round(Game.s.cash), toast: Game.floats.some((f) => String(f.text).includes(it.label)), sparks, padGone: !BurgerExt.pads(Game).some((p) => p.item === it.key),
        patienceUp: p2 > pat, spawnDown: s2 < sp, count: BurgerExt.decorCount(Game), free: BurgerExt.free(Game.player.x, Game.player.y) });
      pat = p2; sp = s2;
      T.step(60);
    }
    return out;
  }, { K });
  bought.forEach((b, i) => {
    t.expect(b.n >= 0 && b.cash === 7, `standing on the pad buys ${b.key} for its price (${JSON.stringify(b)})`);
    t.expect(b.toast && b.sparks > 0 && b.padGone, `${b.key}: a toast, a sparkle where it appears, the pad is gone (${JSON.stringify(b)})`);
    t.expect(b.patienceUp && b.spawnDown && b.count === i + 1, `${b.key}: customers more patient and coming faster (${JSON.stringify(b)})`);
    t.expect(b.free, `${b.key}: the chef is not stuck after buying`);
  });
  const dec1 = await t.ev((a) => {
    const K = a.K, s = Game.s.burger;
    const log = (0, eval)('(' + a.spy + ')')();
    // the same rule and numbers as the pizzeria: Shop.patience / Shop.spawnInterval with the shop's own count
    const lv = BurgerExt.busy(Game);
    return { log: JSON.stringify(log), busy: lv, grillLv: s.grillLv, count: BurgerExt.decorCount(Game),
      patience: BurgerShop.patience(), patienceWant: Shop.patience(K.PATIENCE, lv), spawn: BurgerExt.spawnTime(Game), spawnWant: Shop.spawnInterval(K.SPAWN, lv),
      fresh: new ShopCustomer(BurgerShop, 77, 1).patienceMax, pizzeria: Game.decorCount(), bg: Render.bgs.burger.key };
  }, { K, spy: ghostSpy.toString() });
  t.expect(K.DECOR.every((it) => JSON.parse(dec1.log)[it.key] === 'full'), `every decoration is drawn for real once bought (${dec1.log})`);
  t.expectEq(dec1.count, K.DECOR.length, 'all of them counted');
  t.expectEq(dec1.busy, dec1.count + dec1.grillLv, 'the busyness level counts the decorations');
  t.expect(Math.abs(dec1.patience - dec1.patienceWant) < 1e-9 && Math.abs(dec1.spawn - dec1.spawnWant) < 1e-9, 'patience and arrivals use the shared Shop helpers');
  t.expect(dec1.fresh > K.PATIENCE && dec1.spawn < K.SPAWN, `a new customer is more patient, and they come more often (${dec1.fresh}, ${dec1.spawn})`);
  t.expectEq(dec1.pizzeria, 0, 'the pizzeria has none of them');
  t.expect(dec1.bg.includes('burger3-1-1-' + '1'.repeat(K.DECOR.length)), `the cached room repaints with them (${dec1.bg})`);
  await t.ev(() => { T.tp(CFG.BURGER.EXIT.x, CFG.BURGER.EXIT.y - 8, 'burger'); Game.cameraSnap = true; T.step(1); });
  await t.shot('decor-bought');
  await t.ev(() => { Render.MIN_ZOOMED_VIEW = 150; Render.setZoom(2.2); T.tp(34800, 4400, 'burger'); Game.cameraSnap = true; T.step(30); });
  await t.shot('decor-jukebox');
  await t.ev(() => { Render.setZoom(1.5); T.tp(34420, 4215, 'burger'); Game.cameraSnap = true; T.step(30); });
  await t.shot('decor-neon');
  await t.ev(() => { Render.setZoom(1); Game.cameraSnap = true; T.step(1); });

  // nothing in the way: a grid walk (the chef's size) from the door reaches every pad, the counter, the register,
  // the pile, the milkshake machine, both booths and every place in both lines
  const reach = await t.ev((a) => {
    const K = a.K, R = K.ROOM, obs = Game.obstacles(), step = 8, r = 12;
    const ok = (x, y) => x >= R.x0 + r && x <= R.x1 - r && y >= R.y0 + r && y <= R.y1 - r && !obs.some((o) => Game.hitRect(x, y, r, o));
    const cols = Math.floor((R.x1 - R.x0) / step), rows = Math.floor((R.y1 - R.y0) / step), seen = new Uint8Array(cols * rows);
    const cell = (x, y) => [Math.round((x - R.x0) / step), Math.round((y - R.y0) / step)];
    const [sx, sy] = cell(K.EXIT.x, K.EXIT.y - 8), q = [[sx, sy]]; seen[sy * cols + sx] = 1;
    while (q.length) {
      const [cx, cy] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || seen[ny * cols + nx]) continue;
        if (!ok(R.x0 + nx * step, R.y0 + ny * step)) continue;
        seen[ny * cols + nx] = 1; q.push([nx, ny]);
      }
    }
    // a target counts as reached when a walkable cell within a few px of it was reached
    const reached = (pt) => { const [cx, cy] = cell(pt.x, pt.y); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && seen[ny * cols + nx]) return true; } return false; };
    const targets = { exit: { x: K.EXIT.x, y: K.EXIT.y - 8 }, pile: K.PILE_STAND, counter: K.DISPLAY_STAND, register: K.CASHIER_SPOT, cash: K.CASH, shake: K.SHAKE_SPOT };
    Object.entries(K.PADS).forEach(([k, P]) => { targets['pad ' + k] = P; });
    K.DECOR.forEach((it) => { targets['decor pad ' + it.key] = it.pad; });
    BurgerExt.seats().forEach((q2, i) => { targets['booth ' + i] = q2.spot; });
    for (let i = 0; i < K.QUEUE.max; i++) { targets['queue ' + i] = { x: K.QUEUE.x, y: K.QUEUE.y + i * K.QUEUE.dy }; targets['pay ' + i] = { x: K.PAY.x, y: K.PAY.y + i * K.PAY.dy }; }
    const miss = Object.keys(targets).filter((k) => !reached(targets[k]));
    // and no decoration stands on a pad, a line or a booth seat: the jukebox is the only solid one
    const J = { x: K.JUKEBOX.x - 20, y: K.JUKEBOX.y - 16, w: 40, h: 18 }, near = [];
    for (const [k, pt] of Object.entries(targets)) if (Game.hitRect(pt.x, pt.y, CFG.PAD_RADIUS, J)) near.push(k);
    return { miss, near, jukeboxSolid: obs.some((o) => Game.hitRect(K.JUKEBOX.x, K.JUKEBOX.y - 6, 4, o)) };
  }, { K });
  t.expectEq(reach.miss.join(','), '', 'a grid walk from the door reaches every pad, the counter, the booths and the lines');
  t.expect(reach.jukeboxSolid, 'the jukebox is solid');
  t.expectEq(reach.near.join(','), '', 'the jukebox is well clear of every pad, seat and line spot');

  // a customer comes in, buys and leaves with everything bought (the entry and exit routes are clear)
  const run = await t.ev((K) => {
    const s = Game.s.burger, st = BurgerExt.st;
    s.piles.counter = 8; st.customers = []; st.groupLeft = 0; st.spawnT = 0;
    T.tp(K.CASHIER_SPOT.x, K.CASHIER_SPOT.y, 'burger');
    T.step(2); st.spawnT = 999; st.groupLeft = 0;
    const served0 = s.served;
    const n = T.until(() => s.served > served0, 60 * 30);
    for (const c of st.customers) if (c.state === 'eating') c.timer = 0;
    const m = T.until(() => st.customers.length === 0, 60 * 30);
    return { n, m };
  }, K);
  t.expect(run.n >= 0 && run.m >= 0, `a customer still gets in, pays and out with everything bought (${JSON.stringify(run)})`);

  // saved across a reload, and an old save (no decor) gets an empty set
  await t.ev(() => Game.save());
  await t.reload();
  const decLoad = await t.ev((a) => {
    const K = a.K;
    const out = { decor: Object.keys(Game.s.burger.decor).sort().join(','), count: BurgerExt.decorCount(Game) };
    T.tp(K.EXIT.x, K.EXIT.y - 8, 'burger'); Game.cameraSnap = true; T.step(1);
    out.log = JSON.stringify((0, eval)('(' + a.spy + ')')());
    out.solid = BurgerExt.st.obs.some((o) => Game.hitRect(K.JUKEBOX.x, K.JUKEBOX.y - 6, 4, o));
    Game.s.burger = { seen: true, eaten: 2, owned: true };
    const s = BurgerExt.state(Game);
    out.old = JSON.stringify(s.decor); out.oldCount = BurgerExt.decorCount(Game);
    return out;
  }, { K, spy: ghostSpy.toString() });
  t.expectEq(decLoad.decor, K.DECOR.map((it) => it.key).sort().join(','), 'the decorations survive a reload');
  t.expectEq(decLoad.count, K.DECOR.length, 'still counted after a reload');
  t.expect(K.DECOR.every((it) => JSON.parse(decLoad.log)[it.key] === 'full'), `still drawn for real after a reload (${decLoad.log})`);
  t.expect(decLoad.solid, 'the jukebox is still solid after a reload');
  t.expectEq(decLoad.old, '{}', 'an old save without decorations gets an empty set');
  t.expectEq(decLoad.oldCount, 0, '...and counts none');

  // phone, before and after
  await t.boot({ viewport: { width: 390, height: 844 } });
  await t.ev((K) => { Game.s.burger.owned = true; BurgerExt.build(Game); T.tp(K.DOOR_OUT.x, K.DOOR_OUT.y, 'town'); T.act(); BurgerExt.st.spawnT = 999; T.tp(34300, 4400, 'burger'); Render.setZoom(1); Game.cameraSnap = true; T.step(2); }, K);
  await t.shot('decor-phone-before');
  await t.ev((K) => { for (const it of K.DECOR) Game.s.burger.decor[it.key] = true; BurgerExt.st.obs = BurgerExt.makeObstacles(Game); T.tp(34640, 4300, 'burger'); Game.cameraSnap = true; T.step(30); }, K);
  await t.shot('decor-phone-after');
  await t.ev(() => { T.tp(34800, 4250, 'burger'); Game.cameraSnap = true; T.step(30); });
  await t.shot('decor-phone-booths');

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
