'use strict';
// Inside the big jet at GATE 1: the door spot (label + hint) while it is parked, none while it is driven or away at Cloud
// Harbor; flying it from outside still works; boarding onto the mat; a passenger seat (pinned, the window view, the
// seatbelt sign, the snack cart bringing pretzels, carried for 20 s), standing up; the lavatory peek; the cockpit
// (the captain's seat: no panel, the co-pilot's thumbs-up, the big button says Take off, standing up with the stick)
// and taking off from it (the real take-off, Cloud Harbor, the flight home); leaving at the door spot that
// follows the jet; rolling stairs when it is parked away from its gate; rescues (a wall, a save in a seat) and
// Take-me-home from the cockpit. Screenshots desktop + phone.
module.exports = async (t) => {
  // until the coordinator wires js/jetinside.js into index.html, serve the page with it added before js/main.js
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    if (!body.includes('js/jetinside.js')) body = body.replace('<script src="js/main.js"></script>', '<script src="js/jetinside.js"></script>\n  <script src="js/main.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();

  const reg = await t.ev(() => ({
    ok: typeof JetInsideExt !== 'undefined' && Render.ext.includes(JetInsideExt),
    order: Game.ext.indexOf(JetInsideExt) < Game.ext.indexOf(AirfieldExt) && Game.ext.indexOf(JetInsideExt) < Game.ext.indexOf(CityExt),
    world: CFG.AREAS.jetcabin && CFG.AREAS.jetcabin.WORLD,
  }));
  t.expect(reg.ok, 'jet interior registered');
  t.expect(reg.order, 'the jet door answers before the airfield and the City');
  t.expectEq(JSON.stringify(reg.world), JSON.stringify({ x0: 11000, y0: 4000, x1: 12200, y1: 4400 }), 'the cabin sits in its free rectangle');

  // ---- the door spot at the gate: hint a little way off, the board button on it
  const gate = await t.ev(() => {
    const v = AirfieldExt.rt.jet, d = JetInsideExt.doorSpot(v), out = {};
    out.atGate = JetInsideExt.atGate(v); out.d = d;
    out.solid = Game.obstacles().some((o) => Game.hitRect(d.x, d.y, 12, o));
    T.tp(d.x, d.y + 50, 'town'); T.step(1); out.farHint = T.hint(); out.farLabel = T.label();
    T.tp(d.x, d.y, 'town'); T.step(1); out.hint = T.hint(); out.label = T.label(); out.target = Game.hint && Game.hint.target;
    return out;
  });
  t.expect(gate.atGate, 'the jet starts at its gate');
  t.expect(!gate.solid, `the door spot is open ground (${JSON.stringify(gate.d)})`);
  t.expectEq(gate.farHint, 'Go inside the big plane! 🛫', 'door hint near the jet');
  t.expectEq(gate.hint, 'Go inside the big plane! 🛫', 'door hint at the door');
  t.expectEq(gate.target, null, 'no arrow once standing at the door');
  t.expectEq(gate.label, '🚪 Board the plane', 'board label at the door');
  await t.ev(() => { const d = JetInsideExt.doorSpot(AirfieldExt.rt.jet); T.tp(d.x - 40, d.y + 20, 'town'); Render.setZoom(1.6); Game.cameraSnap = true; T.step(2); });
  await t.shot('jet-gate');

  // ---- the vehicle button beside the jet still flies it, exactly as before; no door while it is driven or away
  const fly = await t.ev(() => {
    const v = AirfieldExt.rt.jet; T.tp(v.x, v.y + 46, 'town'); T.step(2);
    const near = Game.findNearVehicle() === v; Game.enterCar(); T.step(1);
    const d = JetInsideExt.doorSpot(v);
    return { near, kind: Game.vehicle && Game.vehicle.kind, label: T.label(), mine: JetInsideExt.action(Game), hint: JetInsideExt.hint(Game), dd: JetInsideExt.doorDist(Game), carLabel: CFG.VEHICLES.jet.label, d };
  });
  t.expect(fly.near, 'the jet is the vehicle beside it');
  t.expectEq(fly.kind, 'jet', 'hopped in the jet from outside');
  t.expectEq(fly.label, '🛫 Take off!', 'take-off offered in the jet');
  t.expect(fly.mine === null && fly.hint === undefined && fly.dd === Infinity, 'no door spot while the jet is driven');
  const away = await t.ev(() => {
    T.act(); T.step(30);
    const during = { runup: !!AirfieldExt.rt.runup, door: JetInsideExt.jetParked(Game) };
    T.until(() => Game.area === 'cloud' && !Game.travel && !Game.driving, 4000); T.step(2);
    const v = AirfieldExt.rt.jet, d = JetInsideExt.doorSpot(v), p = Game.player;
    const out = { during, area: Game.area, away: v.away, parked: JetInsideExt.jetParked(Game), cloudKind: AirfieldExt.rt.cloudPlane.kind };
    // peek at the airfield as it stands now: nothing at the empty gate
    const was = { area: Game.area, x: p.x, y: p.y }; Game.area = 'town'; p.x = d.x; p.y = d.y;
    out.action = JetInsideExt.action(Game); out.hint = JetInsideExt.hint(Game);
    Game.area = was.area; p.x = was.x; p.y = was.y;
    return out;
  });
  t.expect(away.during.runup && !away.during.door, 'no door spot while it rolls out to take off');
  t.expectEq(away.area, 'cloud', 'flew the jet to Cloud Harbor from outside');
  t.expectEq(away.cloudKind, 'jet', 'the jet waits on the cloud runway');
  t.expect(away.away && !away.parked && away.action === null && away.hint === undefined, 'no door spot while the jet is away');
  const back = await t.ev(() => {
    const v = AirfieldExt.rt.cloudPlane; T.tp(v.x, v.y + 46, 'cloud'); T.step(2); Game.enterCar(); T.act();
    T.until(() => Game.area === 'town' && !Game.travel && !Game.driving, 4000); T.step(2);
    const j = AirfieldExt.rt.jet; return { area: Game.area, home: JetInsideExt.atGate(j), parked: JetInsideExt.jetParked(Game) };
  });
  t.expect(back.area === 'town' && back.home && back.parked, `flew home; the jet is back at its gate with its door (${JSON.stringify(back)})`);

  // ---- board
  const board = await t.ev(() => {
    const d = JetInsideExt.doorSpot(AirfieldExt.rt.jet); T.tp(d.x, d.y, 'town'); T.act(); T.step(30);
    const J = CFG.JETCABIN, p = Game.player;
    return { area: Game.area, mat: Math.hypot(p.x - J.EXIT.x, p.y - J.EXIT.y), free: JetInsideExt.free(p.x, p.y), toast: T.toasts.includes('✈️ Welcome aboard the big plane!'), hint: T.hint(), target: Game.hint && Game.hint.target, label: T.label(), seen: Game.s.jetcabin.seen };
  });
  t.expectEq(board.area, 'jetcabin', 'inside the jet');
  t.expect(board.mat < 2 && board.free, 'standing on the door mat');
  t.expect(board.toast && board.seen, 'welcome toast the first time aboard');
  t.expectEq(board.label, '🚪 Leave the plane', 'leave label on the mat');
  t.expect(board.hint && board.target && board.target.x > 11000 && board.target.y > 4000, `the hint points at something in the cabin (${board.hint})`);
  await t.ev(() => { Render.setZoom(1); Game.cameraSnap = true; T.step(2); });
  await t.shot('cabin');
  const toasts = await t.ev(() => { const n = T.toasts.filter((m) => m === '✈️ Welcome aboard the big plane!').length; const J = CFG.JETCABIN; T.tp(J.EXIT.x, J.EXIT.y, 'jetcabin'); T.act(); const d = JetInsideExt.doorSpot(AirfieldExt.rt.jet); T.tp(d.x, d.y, 'town'); T.act(); T.step(2); return { n, m: T.toasts.filter((m) => m === '✈️ Welcome aboard the big plane!').length, area: Game.area }; });
  t.expect(toasts.n === 1 && toasts.m === 1 && toasts.area === 'jetcabin', 'the welcome toast shows only once');

  // ---- a passenger seat by the window: the sign dings on, the view opens, the cart brings pretzels
  const sit = await t.ev(() => {
    const J = CFG.JETCABIN, x = J.ROWS[0];
    T.tp(x, J.AISLE.y - 6, 'jetcabin');
    const label = T.label(); T.act(); T.step(30);
    const st = JetInsideExt.st, s = st.seat && st.seat.s, p = Game.player;
    const out = { label, seated: !!s, win: s && s.win, side: s && s.side, onSeat: s && Math.hypot(p.x - s.x, p.y - s.y), sign: st.signOn, belt: st.buckled, view: st.view, sat: Game.s.jetcabin.sat, standLabel: T.label() };
    T.steer(1, 1); T.step(60); T.unsteer(); out.pinned = Math.hypot(p.x - s.x, p.y - s.y);
    out.cart = T.until(() => st.fa.state === 'offer', 1200); out.offer = st.fa.offer; out.cartAt = st.fa.x + 32 - s.x; out.cartHint = T.hint();
    return out;
  });
  t.expectEq(sit.label, '💺 Sit down', 'sit label in the aisle by a row');
  t.expect(sit.seated && sit.win && sit.side === 'top' && sit.onSeat < 1, `sat in the window seat on the near side (${JSON.stringify(sit)})`);
  t.expect(sit.sign && sit.belt, 'the seatbelt sign is on and everyone is buckled');
  t.expect(sit.view > 0.9, 'the window next to the seat opens into a view');
  t.expectEq(sit.standLabel, '🚶 Stand up', 'stand-up label while seated');
  t.expect(sit.pinned < 1, 'the chef stays in the seat');
  t.expect(sit.cart >= 0 && sit.offer === 'pretzels', 'the snack cart comes over offering pretzels');
  t.expect(Math.abs(sit.cartAt) < 12, `the cart stops by the chef's row (${sit.cartAt})`);
  t.expectEq(sit.cartHint, 'Here comes the snack cart! 🥨', 'snack cart hint');
  await t.shot('seat-offer');
  const snack = await t.ev(() => { const st = JetInsideExt.st; T.until(() => !!st.snack, 300); return { kind: st.snack && st.snack.kind, t: st.snack && st.snack.t, n: Game.s.jetcabin.snacks }; });
  t.expect(snack.kind === 'pretzels' && snack.t > 19 && snack.n === 1, `pretzels in hand for 20 s (${JSON.stringify(snack)})`);
  await t.ev(() => T.step(40));
  await t.shot('seat-window');
  const stand = await t.ev(() => {
    const st = JetInsideExt.st, J = CFG.JETCABIN; T.act(); T.step(2);
    const p = Game.player; const out = { seat: st.seat, inAisle: Math.abs(p.y - J.AISLE.y) < 2, free: JetInsideExt.free(p.x, p.y), snack: !!st.snack };
    T.steer(1, 0); T.step(20); T.unsteer(); out.walked = p.x - J.ROWS[0];
    out.back = T.until(() => st.fa.state === 'home', 1200);
    return out;
  });
  t.expect(stand.seat === null && stand.inAisle && stand.free && stand.walked > 30, 'stood up into the aisle and walked off');
  t.expect(stand.snack, 'still carrying the pretzels');
  t.expect(stand.back >= 0, 'the attendant took the cart back to the galley');
  const later = await t.ev(() => { T.step(60 * 21); return JetInsideExt.st.snack; });
  t.expectEq(later, null, 'the pretzels are eaten after 20 s');
  // the far side of the aisle, the seats taken by passengers are never offered
  const other = await t.ev(() => {
    const J = CFG.JETCABIN, st = JetInsideExt.st;
    const kidSeat = st.seats.find((s) => s.folk && s.folk.kind === 'kid');
    T.tp(kidSeat.x, J.AISLE.y + 6, 'jetcabin'); const s = JetInsideExt.seatFor(Game);
    return { s: s && { side: s.side, win: s.win, folk: !!s.folk }, folks: st.seats.filter((q) => q.folk).length };
  });
  t.expect(other.s && !other.s.folk && other.s.side === 'bot', `a free seat beside the kid's (${JSON.stringify(other)})`);
  t.expect(other.folks >= 5, 'a few passengers aboard');

  // ---- the lavatory
  const lav = await t.ev(() => {
    const J = CFG.JETCABIN, st = JetInsideExt.st; T.tp(J.LAV.door.x, J.LAV.door.y, 'jetcabin');
    const label = T.label(); T.act(); T.step(10);
    const first = st.peek && st.peek.occupied; T.until(() => !st.peek, 400); T.act(); T.step(10);
    return { label, first, second: st.peek && st.peek.occupied, free: JetInsideExt.free(J.LAV.door.x, J.LAV.door.y) };
  });
  t.expectEq(lav.label, '🚽 Peek in', 'peek label at the lavatory');
  t.expect(lav.free, 'the lavatory door spot is open floor');
  t.expect(lav.first === false && lav.second === true, 'a peek at the tiny bathroom, then "Occupied!"');
  await t.shot('lavatory');

  // ---- the cockpit: walk through its door, sit in the captain's seat
  const walk = await t.ev(() => {
    const J = CFG.JETCABIN; T.tp(11320, J.AISLE.y, 'jetcabin'); T.steer(-1, 0); T.step(70); T.unsteer();
    return { x: Game.player.x, inCockpit: Game.player.x < J.BULKHEAD.x0 };
  });
  t.expect(walk.inCockpit, `walked forward through the cockpit door (${Math.round(walk.x)})`);
  const capt = await t.ev(() => {
    const J = CFG.JETCABIN, st = JetInsideExt.st; T.tp(J.CAPT_STAND.x, J.CAPT_STAND.y, 'jetcabin');
    Game.s.jetcabin.captain = false; st.signOn = false; st.buckled = false; T.step(1);
    const out = { hint: T.hint(), label: T.label() }; const nf = Game.floats.length; T.act(); T.step(2);
    const p = Game.player; out.seated = !!st.captain; out.on = Math.hypot(p.x - J.CAPT.x, p.y - J.CAPT.y); out.thumb = Game.floats.slice(nf - 1).some((f) => f.text === '👍');
    out.next = T.label(); out.hint2 = T.hint(); out.area = Game.area;
    out.noPanel = !('btns' in st) && !('talk' in st) && typeof JetInsideExt.drawPanel !== 'function' && typeof JetInsideExt.press !== 'function' && typeof JetInsideExt.nextButton !== 'function';
    // watch what the real frames draw while seated
    const ctx = Render.ctx, fill = ctx.fillText; window.__drawn = []; ctx.fillText = function (txt, ...a) { window.__drawn.push(String(txt)); return fill.call(this, txt, ...a); };
    return out;
  });
  await t.wait(250);   // a few real frames draw the cockpit with the chef in the seat
  Object.assign(capt, await t.ev(() => {
    const ctx = Render.ctx; delete ctx.fillText; const drawn = window.__drawn; delete window.__drawn;
    const dom = [...document.querySelectorAll('button, [role=button]')].filter((b) => b.id !== 'btn-make').map((b) => b.textContent).filter((x) => /Seatbelt|Talk|Stand up|Take off/.test(x));
    return { frames: drawn.length, panelText: drawn.filter((x) => /Seatbelt|Talk|Stand up|SPEED|HIGH|Take off/.test(x)), dom, bigBtn: document.getElementById('btn-make').textContent, still: !!JetInsideExt.st.captain };
  }));
  t.expectEq(capt.label, "👨‍✈️ Sit in the captain's seat", 'captain seat label');
  t.expect(capt.seated && capt.on < 1 && capt.still && capt.area === 'jetcabin', 'sitting at the controls');
  t.expect(capt.thumb, 'the co-pilot gives a thumbs-up');
  t.expectEq(capt.next, '🛫 Take off!', 'the big button says Take off right away');
  t.expectEq(capt.bigBtn, '🛫 Take off!', 'the big button on screen says Take off');
  t.expectEq(capt.hint2, 'Press the button to take off! 🛫', 'captain hint');
  t.expect(capt.noPanel && capt.frames > 0 && capt.panelText.length === 0 && capt.dom.length === 0, `no cockpit panel: no buttons, nothing drawn (${JSON.stringify(capt)})`);
  await t.ev(() => T.step(10));
  await t.shot('cockpit-seated');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); Game.cameraSnap = true; T.step(2); });
  await t.shot('cockpit-phone');
  t.expect(await t.ev(() => !!JetInsideExt.st.captain && T.label() === '🛫 Take off!'), 'seated in the cockpit on a phone, Take off on the big button');
  await t.ev(() => { JetInsideExt.standUp(Game); const J = CFG.JETCABIN; T.tp(J.ROWS[3], J.AISLE.y - 6, 'jetcabin'); T.act(); T.step(40); });
  t.expect(await t.ev(() => Game.area === 'jetcabin' && !!JetInsideExt.st.seat), 'seated on a phone');
  await t.shot('seat-phone');
  await t.ev(() => { T.act(); const J = CFG.JETCABIN; T.tp(J.EXIT.x + 60, J.EXIT.y - 30, 'jetcabin'); T.step(2); });
  await t.shot('cabin-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); Game.cameraSnap = true; T.step(2); });
  // pushing the stick gets you up again
  const up = await t.ev(() => {
    const J = CFG.JETCABIN, st = JetInsideExt.st; T.tp(J.CAPT_STAND.x, J.CAPT_STAND.y, 'jetcabin'); T.act();
    const sat = !!st.captain; T.steer(1, 0); T.step(40); T.unsteer();
    return { sat, stick: !st.captain && JetInsideExt.free(Game.player.x, Game.player.y), label: T.label(), area: Game.area };
  });
  t.expect(up.sat && up.stick && up.area === 'jetcabin' && up.label !== '🛫 Take off!', `stood up with the stick (${JSON.stringify(up)})`);

  // ---- take off from the cockpit: the real take-off, Cloud Harbor, home again
  const off = await t.ev(() => {
    const J = CFG.JETCABIN, st = JetInsideExt.st, v = AirfieldExt.rt.jet; T.tp(J.CAPT_STAND.x, J.CAPT_STAND.y, 'jetcabin'); T.act();
    const label = T.label(); T.act();
    const out = { label, area: Game.area, driving: Game.driving && Game.vehicle === v, runup: !!AirfieldExt.rt.runup && AirfieldExt.rt.runup.plane === v, captain: st.captain, flights: Game.s.jetcabin.flights };
    T.step(5); out.hint = T.hint();
    return out;
  });
  t.expectEq(off.label, '🛫 Take off!', 'take-off button in the cockpit');
  t.expect(off.area === 'town' && off.driving && off.runup && off.captain === null, `out on the airfield driving the jet, the take-off running (${JSON.stringify(off)})`);
  t.expectEq(off.hint, '🛫 Here we go!', "the airfield's take-off hint");
  await t.ev(() => T.step(50));
  await t.shot('cockpit-takeoff');
  const cloud = await t.ev(() => { T.until(() => Game.area === 'cloud' && !Game.travel && !Game.driving, 4000); T.step(2); return { area: Game.area, kind: AirfieldExt.rt.cloudPlane.kind, away: AirfieldExt.rt.jet.away }; });
  t.expect(cloud.area === 'cloud' && cloud.kind === 'jet' && cloud.away, 'arrived at Cloud Harbor in the jet');
  const home = await t.ev(() => {
    const v = AirfieldExt.rt.cloudPlane; T.tp(v.x, v.y + 46, 'cloud'); T.step(2); Game.enterCar(); T.act();
    T.until(() => Game.area === 'town' && !Game.travel && !Game.driving, 4000); T.step(2);
    return { area: Game.area, gate: JetInsideExt.atGate(AirfieldExt.rt.jet), door: JetInsideExt.jetParked(Game) };
  });
  t.expect(home.area === 'town' && home.gate && home.door, 'flew home: the jet is back at its gate, door open');

  // ---- leave the plane: back at the door spot, which follows the jet (rolling stairs away from the gate)
  const leave = await t.ev(() => {
    const J = CFG.JETCABIN, v = AirfieldExt.rt.jet, d0 = JetInsideExt.doorSpot(v);
    T.tp(d0.x, d0.y, 'town'); T.act(); T.tp(J.EXIT.x, J.EXIT.y, 'jetcabin');
    const label = T.label(); T.act(); T.step(1);
    const p = Game.player, out = { label, area: Game.area, d: Math.hypot(p.x - d0.x, p.y - d0.y) };
    // board, the jet gets moved while the chef is inside, step out at its new door
    T.tp(d0.x, d0.y, 'town'); T.act();
    AirfieldExt.park(v, { x: 2040, y: 860, angle: -0.6 });
    T.tp(J.EXIT.x, J.EXIT.y, 'jetcabin'); T.act(); T.step(1);
    const d1 = JetInsideExt.doorSpot(v); out.area2 = Game.area; out.d2 = Math.hypot(p.x - d1.x, p.y - d1.y); out.stairs = !JetInsideExt.atGate(v);
    out.label2 = T.label(); out.hint2 = T.hint();
    out.solid = Game.obstacles().some((o) => Game.hitRect(d1.x, d1.y, 12, o));
    return out;
  });
  t.expectEq(leave.label, '🚪 Leave the plane', 'leave label on the mat');
  t.expect(leave.area === 'town' && leave.d < 2, 'back outside at the door spot');
  t.expect(leave.area2 === 'town' && leave.d2 < 2 && leave.stairs && !leave.solid, `the door spot followed the moved jet (${JSON.stringify(leave)})`);
  t.expectEq(leave.label2, '🚪 Board the plane', 'board label at the stairs');
  t.expectEq(leave.hint2, 'Go inside the big plane! 🛫', 'door hint at the stairs');
  await t.ev(() => { const d = JetInsideExt.doorSpot(AirfieldExt.rt.jet); T.tp(d.x + 30, d.y + 30, 'town'); Render.setZoom(1.6); Game.cameraSnap = true; T.step(2); });
  await t.shot('jet-stairs');
  await t.ev(() => { Render.setZoom(1); const v = AirfieldExt.rt.jet; AirfieldExt.park(v, v.home); T.step(1); });

  // ---- rescues: a push into a wall, a save made in a seat
  const rescue = await t.ev(() => {
    const J = CFG.JETCABIN, p = Game.player, d = JetInsideExt.doorSpot(AirfieldExt.rt.jet);
    T.tp(d.x, d.y, 'town'); T.act();
    p.x = 11600; p.y = 4060; T.step(2); const wall = Math.hypot(p.x - J.EXIT.x, p.y - J.EXIT.y);
    p.x = 11700; p.y = 4150; T.step(2); const seat = Math.hypot(p.x - J.EXIT.x, p.y - J.EXIT.y);
    // sit, save, and reload: the chef wakes up on the mat
    T.tp(J.ROWS[5], J.AISLE.y - 6, 'jetcabin'); T.act(); T.step(2); Game.save();
    return { wall, seat, saved: Game.s.pos };
  });
  t.expect(rescue.wall < 2 && rescue.seat < 2, 'pushed into a wall or the seats: back on the mat');
  t.expect(rescue.saved && rescue.saved.area === 'jetcabin', 'saved inside the cabin');
  await t.boot({ fresh: false });
  const reloaded = await t.ev(() => { T.step(3); const J = CFG.JETCABIN, p = Game.player; return { area: Game.area, mat: Math.hypot(p.x - J.EXIT.x, p.y - J.EXIT.y), seat: JetInsideExt.st.seat }; });
  t.expect(reloaded.area === 'jetcabin' && reloaded.mat < 2 && reloaded.seat === null, `a reload from a seat lands on the mat (${JSON.stringify(reloaded)})`);

  // ---- Take me home from the cockpit
  const gohome = await t.ev(() => {
    const J = CFG.JETCABIN, st = JetInsideExt.st; T.tp(J.CAPT_STAND.x, J.CAPT_STAND.y, 'jetcabin'); T.act(); st.signOn = true;
    const sat = !!st.captain; Game.goHome(); T.step(2);
    return { sat, area: Game.area, captain: st.captain, seat: st.seat, sign: st.signOn, hint: JetInsideExt.hint(Game), action: JetInsideExt.action(Game) };
  });
  t.expect(gohome.sat, 'was in the captain seat');
  t.expect(gohome.area === 'town' && gohome.captain === null && gohome.seat === null && !gohome.sign, 'Take me home clears the cockpit');
  t.expect(gohome.hint === undefined && gohome.action === null, 'no jet hint or button at the pizza shop');
};
