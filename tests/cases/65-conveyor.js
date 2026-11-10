'use strict';
// The pizza conveyor: buy it on its kitchen pad, pizzas leave the oven pile, ride through both X-ray arches (each
// arch counts a scan and flashes) and land on the dock table outside; the dock never holds more than DOCK_CAP; the
// bike fleet's interface (owned / dockCount / takeFromDock); the turbo button; the chef can still reach the ovens,
// the oven pile, the prep table, the counter, the office stairs and the door, and the dock spot is reachable from
// South Road; the state survives a reload.
module.exports = async (t) => {
  await t.boot();
  const K = await t.ev(() => CFG.CONVEYOR);
  t.expect(await t.ev(() => Game.ext.includes(ConveyorExt) && Render.ext.includes(ConveyorExt)), 'registered with Game and Render');
  t.expect(K.DOCK && typeof K.DOCK.x === 'number' && typeof K.DOCK.y === 'number', 'CFG.CONVEYOR.DOCK exists');
  t.expectEq(K.DOCK_CAP, 8, 'DOCK_CAP');

  // ---- before buying: the pad shows, nothing is solid, nothing moves
  const pre = await t.ev(() => {
    const pad = Game.allPads().find((p) => p.key === 'conveyor');
    const solid = ConveyorExt.obstacles(Game).length;
    Game.s.piles.oven = 5; T.tp(700, 400, 'town'); T.step(600);
    return { pad: !!pad, label: pad && pad.label, price: pad && pad.price, solid, owned: ConveyorExt.owned(Game), dock: ConveyorExt.dockCount(Game), belt: Game.s.conveyor.belt.length, take: ConveyorExt.takeFromDock(Game, 3) };
  });
  t.expect(pre.pad, 'the conveyor pad is offered');
  t.expectEq(pre.price, 300, 'it costs $300');
  t.expectEq(pre.solid, 0, 'no obstacles before buying');
  t.expect(!pre.owned && pre.dock === 0 && pre.belt === 0 && pre.take === 0, `nothing runs before buying (${JSON.stringify(pre)})`);
  await t.ev((P) => { T.tp(P.x, P.y + 60, 'town'); Render.setZoom(1.4); Game.cameraSnap = true; T.step(2); }, K.PAD);
  await t.shot('before');

  // ---- buy it on the pad
  const buy = await t.ev((P) => {
    Game.s.cash = 1000; T.tp(P.x, P.y, 'town');
    const n = T.until(() => ConveyorExt.owned(Game), 900);
    return { n, cash: Game.s.cash, owned: ConveyorExt.owned(Game), stuck: Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o)), pad: !!Game.allPads().find((p) => p.key === 'conveyor') };
  }, K.PAD);
  t.expect(buy.n >= 0 && buy.owned, `bought on the pad (${JSON.stringify(buy)})`);
  t.expectEq(buy.cash, 700, 'paid $300');
  t.expect(!buy.stuck, 'the chef is not inside the belt after buying');
  t.expect(!buy.pad, 'the pad goes away once bought');

  // ---- the shared interface the bike fleet uses
  const api = await t.ev(() => ['owned', 'dockCount', 'takeFromDock'].every((k) => typeof ConveyorExt[k] === 'function') && ConveyorExt.name === 'conveyor');
  t.expect(api, 'owned / dockCount / takeFromDock exist');

  // ---- pizzas leave the oven pile, ride through both arches and land on the dock
  const run = await t.ev(() => {
    T.tp(700, 400, 'town');                         // away from the oven pile so the chef takes none
    Game.s.piles.oven = 3; Game.s.conveyor.dock = 0; Game.s.conveyor.belt = [];
    const scans0 = ConveyorExt.st.arches.map((a) => a.scans);
    T.step(60 * 3);
    const onBelt = Game.s.conveyor.belt.length, pile = Game.s.piles.oven;
    let maxTotal = 0;
    const n = T.until(() => { maxTotal = Math.max(maxTotal, Game.s.conveyor.dock + Game.s.conveyor.belt.length); return Game.s.conveyor.dock >= 1; }, 60 * 30);
    const scans = ConveyorExt.st.arches.map((a, i) => a.scans - scans0[i]);
    const arrived = Game.s.conveyor.belt.length === 0 ? null : Game.s.conveyor.belt.map((it) => it.scanned);
    return { onBelt, pile, n, dock: Game.s.conveyor.dock, scans, arches: ConveyorExt.st.arches.length, len: ConveyorExt.len, arrived };
  });
  t.expect(run.onBelt >= 1, `a pizza rides the belt after a few seconds (${JSON.stringify(run)})`);
  t.expect(run.pile < 3 + 10, 'the oven pile gave pizzas to the belt');
  t.expect(run.n >= 0 && run.dock >= 1, `a pizza arrives on the dock (${JSON.stringify(run)})`);
  t.expect(run.arches >= 2, 'at least two X-ray arches');
  t.expect(run.scans.every((s) => s >= 1), `every arch scanned a pizza (${JSON.stringify(run.scans)})`);
  // scan flash and archState
  const flash = await t.ev(() => {
    const a = ConveyorExt.st.arches[0]; const before = a.scans;
    Game.s.conveyor.belt = [{ d: a.d - 2, k: 0 }]; Game.s.conveyor.dock = 0;
    T.step(3);
    return { scans: a.scans - before, flash: ConveyorExt.archState(0).flash, total: Game.s.conveyor.scans, tick: Game.floats.some((f) => f.text === '✓') };
  });
  t.expectEq(flash.scans, 1, 'a pizza crossing an arch counts one scan');
  t.expect(flash.flash > 0, 'the arch flashes');
  t.expect(flash.tick, 'a ✓ pops up');

  // ---- the dock never holds more than DOCK_CAP, and the belt stops feeding when it is full
  const cap = await t.ev(() => {
    T.tp(700, 400, 'town');
    Game.s.conveyor.dock = 0; Game.s.conveyor.belt = []; Game.s.piles.oven = 40;
    let maxTotal = 0, maxDock = 0;
    for (let i = 0; i < 60 * 90; i++) { T.step(1); Game.s.piles.oven = Math.max(Game.s.piles.oven, 10); const c = Game.s.conveyor; maxTotal = Math.max(maxTotal, c.dock + c.belt.length); maxDock = Math.max(maxDock, c.dock); }
    const pile = Game.s.piles.oven;
    T.step(60 * 10);
    return { dock: Game.s.conveyor.dock, belt: Game.s.conveyor.belt.length, maxTotal, maxDock, pileSteady: Game.s.piles.oven >= pile };
  });
  t.expectEq(cap.dock, K.DOCK_CAP, 'the dock fills up to DOCK_CAP');
  t.expect(cap.maxDock <= K.DOCK_CAP && cap.maxTotal <= K.DOCK_CAP, `never more than DOCK_CAP on dock + belt (${JSON.stringify(cap)})`);
  t.expectEq(cap.belt, 0, 'nothing left riding once the dock is full');
  t.expect(cap.pileSteady, 'a full dock takes no more pizzas from the oven pile');
  await t.ev((T2) => { T.tp(T2.x + 70, T2.y + 70, 'town'); Render.setZoom(2.2); Game.cameraSnap = true; T.step(2); }, K.DOCK_TABLE);
  await t.shot('dock-full');

  // ---- takeFromDock
  const take = await t.ev(() => {
    const a = ConveyorExt.takeFromDock(Game, 3), d1 = ConveyorExt.dockCount(Game);
    const b = ConveyorExt.takeFromDock(Game, 99), d2 = ConveyorExt.dockCount(Game);
    const c = ConveyorExt.takeFromDock(Game, 1);
    Game.s.piles.oven = 4; T.tp(700, 400, 'town'); T.step(60 * 4);
    return { a, d1, b, d2, c, refill: Game.s.conveyor.belt.length };
  });
  t.expect(take.a === 3 && take.d1 === 5, `takeFromDock(3) took 3 (${JSON.stringify(take)})`);
  t.expect(take.b === 5 && take.d2 === 0, 'takeFromDock(99) takes what is there');
  t.expectEq(take.c, 0, 'nothing to take from an empty dock');
  t.expect(take.refill >= 1, 'the belt starts feeding again once there is room');

  // ---- the turbo button at the control panel, and the hints
  const turbo = await t.ev((C) => {
    T.tp(C.x, C.y, 'town');
    const label = T.label(), hint = T.hint();
    const v0 = ConveyorExt.speed(); T.act();
    return { label, hint, v0, v1: ConveyorExt.speed(), turbo: ConveyorExt.st.turbo, whoosh: Game.floats.some((f) => f.text === 'Whoosh! ⚡'), label2: T.label() };
  }, K.CONTROL);
  t.expectEq(turbo.label, '⚡ Turbo belt!', 'turbo button at the control panel');
  t.expect(/turbo/i.test(turbo.hint || ''), `a hint at the control panel (${turbo.hint})`);
  t.expect(turbo.turbo > 0 && turbo.v1 === turbo.v0 * 3, `turbo speeds the belt up (${JSON.stringify(turbo)})`);
  t.expect(turbo.whoosh, 'Whoosh! float');
  const turboOff = await t.ev(() => { T.step(60 * 7); return { turbo: ConveyorExt.st.turbo, label: T.label() }; });
  t.expect(turboOff.turbo === 0 && turboOff.label === '⚡ Turbo belt!', 'turbo wears off and the button comes back');
  const hints = await t.ev((D) => { T.tp(D.x + 20, D.y + 44, "town"); const dock = T.hint(); T.tp(1000, 300, 'town'); return { dock, far: T.hint() }; }, K.DOCK_TABLE);
  t.expect(/dock|bike/i.test(hints.dock || ''), `a hint by the dock (${hints.dock})`);
  t.expect(!/dock|X-ray|turbo/i.test(hints.far || ''), `no conveyor hint far away (${hints.far})`);

  // ---- the chef can still get everywhere in the kitchen and out of the door; the dock spot is reachable from South Road
  const reach = await t.ev(() => {
    Game.s.unlocked.oven2 = true; Game.s.unlocked.dining = true; Game.s.unlocked.tables2 = true; Game.s.unlocked.driveThru = true;
    const obs = Game.obstacles();
    const free = (x, y) => !obs.some((o) => Game.hitRect(x, y, 12, o));
    const S = 6, X0 = -40, Y0 = 100, X1 = 1120, Y1 = 1000, W = Math.ceil((X1 - X0) / S), Hh = Math.ceil((Y1 - Y0) / S);
    const seen = new Uint8Array(W * Hh), q = [];
    const idx = (x, y) => Math.round((y - Y0) / S) * W + Math.round((x - X0) / S);
    const start = CFG.ENTRANCE; q.push([start.x, start.y]); seen[idx(start.x, start.y)] = 1;
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[S, 0], [-S, 0], [0, S], [0, -S]]) {
        const nx = x + dx, ny = y + dy; if (nx < X0 || nx >= X1 || ny < Y0 || ny >= Y1) continue;
        const k = idx(nx, ny); if (seen[k] || !free(nx, ny)) continue; seen[k] = 1; q.push([nx, ny]);
      }
    }
    const can = (x, y, r = 14) => { for (let yy = y - r; yy <= y + r; yy += S) for (let xx = x - r; xx <= x + r; xx += S) if (seen[idx(xx, yy)] && free(xx, yy)) return true; return false; };
    const pt = CFG.PREP_TABLE, C = CFG.CONVEYOR;
    return {
      ovenPile: can(CFG.OVEN_PILE_STAND.x, CFG.OVEN_PILE_STAND.y), pile: can(CFG.OVEN_PILE.x, CFG.OVEN_PILE.y - 40),
      oven1: can(CFG.OVENS[0].x + 50, CFG.OVENS[0].y), oven2: can(CFG.OVENS[1].x + 50, CFG.OVENS[1].y),
      prep: can(pt.x, pt.y + 40), display: can(CFG.DISPLAY_STAND.x, CFG.DISPLAY_STAND.y), cashier: can(CFG.CASHIER_SPOT.x, CFG.CASHIER_SPOT.y),
      doorOut: can(CFG.DOOR_OUT.x, CFG.DOOR_OUT.y), stairs: can(266, 620), office: can(170, 540), control: can(C.CONTROL.x, C.CONTROL.y),
      pads: CFG.SHOP_PADS.every((p) => can(p.pos.x, p.pos.y)),
      dockSpotFree: free(C.DOCK.x, C.DOCK.y), dockFromRoad: can(C.DOCK.x, C.DOCK.y) && can(C.DOCK.x, 950), dockTable: can(C.DOCK_TABLE.x, C.DOCK_TABLE.y + 40),
    };
  });
  for (const [k, v] of Object.entries(reach)) t.expect(v, `reachable / clear: ${k} (${JSON.stringify(reach)})`);
  // and a real walk out of the kitchen: from the control panel up and out through the kitchen opening
  const walk = await t.ev((C) => {
    T.tp(C.x, C.y, 'town'); T.steer(-1, 0); T.step(30); T.steer(0, -1); T.step(30); T.steer(1, 0); T.step(120); T.unsteer();
    return { x: Game.player.x, y: Game.player.y };
  }, K.CONTROL);
  t.expect(walk.x > 400, `walked from the panel around the belt into the shop (${JSON.stringify(walk)})`);

  // ---- the propeller hat: walking into a belt piece flies the chef over it
  await t.ev(() => {
    window.flyTry = (x, y, dx, dy) => {
      Game.s.cash = 0; T.tp(x, y, 'town'); T.steer(dx, dy);
      const n = T.until(() => ConveyorExt.flying(), 60);
      let peak = 0, land = null, fly = ConveyorExt.st.fly && Object.assign({}, ConveyorExt.st.fly);
      const floats = Game.floats.map((f) => f.text);
      if (n >= 0) T.until(() => { const q = ConveyorExt.flightPose(Game); if (q) peak = Math.max(peak, q.z); if (!ConveyorExt.flying()) { land = { x: Game.player.x, y: Game.player.y }; return true; } return false; }, 120);
      T.unsteer(); T.step(1);
      const p = land || { x: Game.player.x, y: Game.player.y };
      return { n, peak, land, x: p.x, y: p.y, target: fly && { x: fly.x1, y: fly.y1 }, clear: !Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o)), floats };
    };
  });
  const cases = [
    { name: 'kitchen run, from above', at: [300, 425], dir: [0, 1], ok: (r) => r.y > 464 + 12 },
    { name: 'kitchen run, from below', at: [300, 490], dir: [0, -1], ok: (r) => r.y < 440 - 12 },
    { name: 'south run indoors, from the west', at: [350, 560], dir: [1, 0], ok: (r) => r.x > 402 + 12 },
    { name: 'south run indoors, from the east', at: [430, 560], dir: [-1, 0], ok: (r) => r.x < 378 - 12 },
    { name: 'south run outdoors, from the west', at: [360, 675], dir: [1, 0], ok: (r) => r.x > 402 + 12 },
    { name: 'outside run, from the south', at: [280, 750], dir: [0, -1], ok: (r) => r.y < 696 - 12 },
    { name: 'outside run, from the north', at: [280, 672], dir: [0, 1], ok: (r) => r.y > 720 + 12 },
  ];
  let first = true;
  for (const c of cases) {
    const r = await t.ev(([x, y, dx, dy]) => flyTry(x, y, dx, dy), [...c.at, ...c.dir]);
    t.expect(r.n >= 0 && r.land, `${c.name}: walking into the belt starts a flight (${JSON.stringify(r)})`);
    t.expect(c.ok(r) && r.clear, `${c.name}: lands clear on the far side (${JSON.stringify(r)})`);
    t.expect(r.peak > 25 && r.peak < 45, `${c.name}: lifts off about 30-40 px (${r.peak})`);
    if (first) { t.expect(r.floats.some((f) => /Propeller hat/.test(f)), 'the first flight says Propeller hat!'); first = false; }
  }
  // no flight where an arch is in the way, or where the far side is blocked (the control panel), or by walking along the belt
  const blocked = await t.ev(() => ({
    arch: flyTry(CFG.CONVEYOR.ARCHES[1].x, 750, 0, -1),
    panel: flyTry(CFG.CONVEYOR.PANEL.x, 490, 0, -1),
    along: flyTry(300, 425, 1, 0),
  }));
  t.expect(blocked.arch.n < 0 && blocked.arch.y > 720, `no flying over an X-ray arch (${JSON.stringify(blocked.arch)})`);
  t.expect(blocked.panel.n < 0 && blocked.panel.y > 464, `no flight when the far side is blocked (${JSON.stringify(blocked.panel)})`);
  t.expect(blocked.along.n < 0, 'walking along the belt never flies');
  // no flight while driving: drive the delivery car into the outside run
  const drive = await t.ev(() => {
    Game.s.vehicles.car = true; Game.s.cash = 0;
    T.tp(Game.car.x - 30, Game.car.y, 'town'); T.step(2);
    const label = Game.car.kind; Game.enterCar();
    if (!Game.driving) return { label, driving: false };
    Game.vehicle.x = 280; Game.vehicle.y = 790; Game.vehicle.angle = -Math.PI / 2; Game.vehicle.vx = 0; Game.vehicle.vy = 0;
    T.steer(0, -1); let flew = false; for (let i = 0; i < 120; i++) { T.step(1); if (ConveyorExt.flying()) flew = true; } T.unsteer();
    const out = { label, driving: true, flew, y: Game.vehicle.y };
    Game.exitCar(); T.step(2);
    return out;
  });
  t.expect(drive.driving, `got into the car (${drive.label})`);
  t.expect(!drive.flew && drive.y > 720, `no flight while driving (${JSON.stringify(drive)})`);
  // mid-flight screenshot (slow the flight right down so the picture holds still)
  await t.ev(() => {
    document.getElementById('toasts').style.display = 'none';
    Game.s.conveyor.belt = [{ d: 160, k: 0 }, { d: 220, k: 1 }];
    Game.s.cash = 0; T.tp(300, 425, 'town'); Game.player.carry = 0; T.steer(0, 1); T.until(() => ConveyorExt.flying(), 60); T.unsteer();
    const f = ConveyorExt.st.fly; CFG.CONVEYOR.FLY.dur = 1000; f.t = 480;
    Render.setZoom(2.6); Game.cameraSnap = true; T.step(1);
  });
  await t.shot('flying');
  await t.ev(() => { CFG.CONVEYOR.FLY.dur = 0.8; ConveyorExt.st.fly = null; ConveyorExt.st.land = 0; T.tp(700, 400, 'town'); });

  // ---- stuck check around the belt (like 03-stuck, but with the conveyor owned)
  const stuck = await t.ev(() => {
    const out = [], hit = (x, y) => Game.obstacles().some((o) => Game.hitRect(x, y, 12, o));
    let sampled = 0;
    for (let y = 270; y < 800; y += 16) for (let x = 120; x < 470; x += 16) {
      if (hit(x, y)) continue;
      sampled++;
      let best = 0, worst = 0;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        Game.player.x = x; Game.player.y = y; Game.player.moving = false; Game.player.hasMoved = true;
        T.steer(ax, ay); T.step(9); T.unsteer();
        const d = Math.hypot(Game.player.x - x, Game.player.y - y); best = Math.max(best, d); worst = Math.max(worst, d);
      }
      if (best < 2 || worst > 70) out.push([x, y, Math.round(best), Math.round(worst)]);
    }
    return { sampled, out };
  });
  t.expect(stuck.sampled > 200 && stuck.out.length === 0, `no stuck or flinging spots around the belt (${stuck.sampled} sampled, ${JSON.stringify(stuck.out.slice(0, 8))})`);

  // ---- screenshots: the belt inside with pizzas riding and an arch flashing; the dock outside
  await t.ev(() => {
    Game.s.unlocked.oven2 = false;
    const c = Game.s.conveyor; c.dock = 3; c.belt = [];
    const A = ConveyorExt.st.arches;
    for (const d of [20, 70, 125, 175, A[0].d - 60, A[0].d + 1, A[0].d + 50]) c.belt.push({ d, k: c.belt.length % 3 });
    A[0].flash = CFG.CONVEYOR.FLASH; A[0].k = 0;
    document.getElementById('toasts').style.display = 'none';
    T.tp(300, 470, 'town'); Game.player.carry = 0; Render.setZoom(1.8); Game.cameraSnap = true; T.step(1);
    A[0].flash = CFG.CONVEYOR.FLASH;
  });
  await t.shot('inside');
  await t.ev((C) => {
    const c = Game.s.conveyor; c.belt = [{ d: 30, k: 0 }, { d: 80, k: 1 }, { d: 130, k: 2 }]; Game.s.piles.oven = 3;
    T.tp(C.x, C.y, 'town'); Game.player.carry = 0; Render.setZoom(2.2); Game.cameraSnap = true; T.step(1);
  }, K.CONTROL);
  await t.shot('start');
  await t.ev(() => {
    const c = Game.s.conveyor, A = ConveyorExt.st.arches;
    c.belt = [{ d: A[1].d - 30, k: 1 }, { d: A[1].d + 1, k: 2 }, { d: ConveyorExt.len - 20, k: 0 }];
    T.tp(150, 790, 'town'); Game.player.carry = 0; Render.setZoom(2); Game.cameraSnap = true; T.step(1); A[1].flash = CFG.CONVEYOR.FLASH;
  });
  await t.shot('outside');

  // ---- saved: owned and the dock survive a reload
  await t.ev(() => { Game.s.conveyor.dock = 4; Game.s.conveyor.belt = []; Game.save(); });
  await t.reload();
  const after = await t.ev(() => ({ owned: ConveyorExt.owned(Game), dock: ConveyorExt.dockCount(Game), solid: ConveyorExt.obstacles(Game).length }));
  t.expect(after.owned && after.dock === 4 && after.solid > 0, `owned and dock count saved (${JSON.stringify(after)})`);
  t.assertNoPageErrors();
};
