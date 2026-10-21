'use strict';
// The Grand Hotel in the City: the door on Bus Street, the lobby (concierge, lift and guest, room-service trolley,
// cookie jar, armchairs, bellhop), a rescue from the walls, back out through the revolving door, Take-me-home.
module.exports = async (t) => {
  // js/city-hotel.js is wired into index.html by the coordinator; until then it is slotted in before main.js here.
  // The service worker is kept out so the page always comes through this hook.
  await t.page.addInitScript(() => { if (navigator.serviceWorker) navigator.serviceWorker.register = () => Promise.resolve(); });
  await t.page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue();
    const res = await route.fetch();
    let body = await res.text();
    if (!body.includes('js/city-hotel.js')) body = body.replace('<script src="js/main.js"></script>', '<script src="js/city-hotel.js"></script>\n  <script src="js/main.js"></script>');
    return route.fulfill({ response: res, body, headers: Object.assign({}, res.headers(), { 'content-type': 'text/html' }) });
  });
  await t.boot();
  t.expect(await t.ev(() => typeof HotelExt !== 'undefined' && Game.ext.indexOf(HotelExt) < Game.ext.indexOf(CityExt) && Render.ext.includes(HotelExt)), 'the hotel extension is loaded and registered first');

  // ---- the door on the City sidewalk: label and hint, nothing solid on the door spot
  const door = await t.ev(() => { const D = CFG.HOTEL.DOOR; T.tp(D.x, D.y + 60, 'city'); T.step(1); const far = { hint: T.hint(), target: Game.hint && Game.hint.target }; T.tp(D.x, D.y, 'city'); T.step(1); return { far, label: T.label(), hint: T.hint(), solid: Game.obstacles().some((o) => Game.hitRect(D.x, D.y, 12, o)) }; });
  t.expectEq(door.far.hint, 'Go inside the Hotel! 🏨', 'hotel hint near the door');
  t.expect(door.far.target && door.far.target.x === 5686, 'the hint points at the door');
  t.expectEq(door.label, '🚪 Go inside', 'door label on the door spot');
  t.expectEq(door.hint, 'Press the button to go inside! 🏨', 'hint on the door spot');
  t.expect(!door.solid, 'the door spot is free of obstacles');
  await t.shot('door');

  // ---- going in: on the mat inside, welcomed by the concierge, every hint points somewhere inside the room
  await t.ev(() => { T.act(); T.step(2); });
  const inside = await t.ev(() => { const p = Game.player, W = CFG.HOTEL.WORLD, h = Game.hint; return { area: Game.area, x: p.x, y: p.y, free: HotelExt.free(p.x, p.y), hint: h && h.text, targetOk: !h || !h.target || (h.target.x > W.x0 && h.target.x < W.x1 && h.target.y > W.y0 && h.target.y < W.y1), welcome: HotelExt.st.welcome > 0, bell: HotelExt.st.bell > 0, toast: T.toasts.includes('🏨 Welcome to the Grand Hotel!'), seen: Game.s.hotel.seen }; });
  t.expectEq(inside.area, 'hotel', 'inside the hotel');
  t.expect(inside.free && Math.abs(inside.x - 3500) < 1 && inside.y < 3340, `standing on the floor by the door mat (${inside.x},${inside.y})`);
  t.expectEq(inside.hint, 'Call the lift! 🛗', 'first hint: call the lift');
  t.expect(inside.targetOk, 'the hint target is inside the lobby');
  t.expect(inside.welcome && inside.bell, 'the concierge rings the bell and says Welcome!');
  t.expect(inside.toast && inside.seen, 'the welcome toast shows the first time');
  await t.shot('lobby');

  // ---- the lift: press the button, the doors open, a guest walks to the desk and rides back up
  await t.ev(() => { const B = CFG.HOTEL.LIFT.button; T.tp(B.x, B.y, 'hotel'); });
  t.expectEq(await t.ev(() => T.label()), '🛗 Call the lift', 'lift button label');
  t.expectEq(await t.ev(() => T.hint()), 'Press the button to call the lift! 🛗', 'lift hint by the button');
  const lift = await t.ev(() => {
    T.act();
    const st = HotelExt.st, out = { called: !!st.guest, labelWhileBusy: T.label(), hintBusy: T.hint() };
    out.opened = T.until(() => st.lift.open >= 1, 120);
    out.talk = T.until(() => st.guest && st.guest.phase === 'talk', 600);
    out.guestAtDesk = st.guest ? Math.hypot(st.guest.x - CFG.HOTEL.CONCIERGE.x, st.guest.y - CFG.HOTEL.DESK.y1) < 40 : false;
    return out;
  });
  t.expect(lift.called, 'a guest appears in the lift');
  t.expectEq(lift.labelWhileBusy, null, 'the button does nothing while the guest is out');
  t.expectEq(lift.hintBusy, 'A guest is coming down! 🛎️', 'hint while the guest is coming');
  t.expect(lift.opened >= 0, 'the lift doors opened');
  t.expect(lift.talk >= 0 && lift.guestAtDesk, 'the guest walked to the reception desk');
  await t.shot('guest');
  const gone = await t.ev(() => { const st = HotelExt.st; const n = T.until(() => !st.guest, 900); return { n, open: st.lift.open, label: (T.tp(CFG.HOTEL.LIFT.button.x, CFG.HOTEL.LIFT.button.y, 'hotel'), T.label()) }; });
  t.expect(gone.n >= 0 && gone.open === 0, 'the guest rode back up and the doors closed');
  t.expectEq(gone.label, '🛗 Call the lift', 'the button works again');

  // ---- the room-service trolley: lift the cloche to find a pizza
  await t.ev(() => { const R = CFG.HOTEL.TROLLEY; T.tp(R.x - 44, R.y + 6, 'hotel'); });
  t.expectEq(await t.ev(() => T.label()), '🍽️ Lift the cloche', 'cloche label by the trolley');
  t.expectEq(await t.ev(() => T.hint()), 'Lift the cloche! 🍽️', 'cloche hint by the trolley');
  const cloche = await t.ev(() => { T.act(); const st = HotelExt.st; const hold = st.cloche.hold; T.step(30); return { hold, up: st.cloche.up, float: Game.floats.some((f) => f.text === 'Room service! 🍕'), label: T.label() }; });
  t.expect(cloche.hold > 0 && cloche.up > 0.8, 'the cloche lifted');
  t.expect(cloche.float, 'Room service! float');
  t.expectEq(cloche.label, null, 'no second press while the cloche is up');
  await t.shot('cloche');
  const down = await t.ev(() => { const st = HotelExt.st; const n = T.until(() => st.cloche.up === 0, 400); return { n, label: T.label() }; });
  t.expect(down.n >= 0, 'the cloche came back down');
  t.expectEq(down.label, '🍽️ Lift the cloche', 'and can be lifted again');

  // ---- a hotel cookie from the $6 circle, carried for 30 s
  const cookie = await t.ev(() => {
    Game.s.cash = 20; const P = CFG.HOTEL.PADS.cookie; T.tp(P.x, P.y, 'hotel');
    const n = T.until(() => HotelExt.st.cookie > 0, 400);
    const t0 = HotelExt.st.cookie, cash0 = Game.s.cash, padGone = !Game.allPads().some((pd) => pd.key === 'hotelCookie'); T.step(300);
    return { n, cash0, cash: Game.s.cash, padGone, t0, later: HotelExt.st.cookie, count: Game.s.stats.cookies, hint: T.hint() };
  });
  t.expect(cookie.n >= 0, 'the cookie circle served a cookie');
  t.expectEq(cookie.cash0, 14, 'the cookie cost $6');
  t.expect(cookie.padGone && cookie.cash === 14, 'the circle rests while the cookie lasts: no second cookie bought standing there');
  t.expectEq(cookie.count, 1, 'cookie counted in the stats');
  t.expect(cookie.t0 === 30 && cookie.later > 24 && cookie.later < 26, `the cookie lasts 30 s (${cookie.later})`);
  t.expectEq(cookie.hint, 'Have a seat in an armchair 🛋️', 'seat hint after the cookie');
  await t.shot('cookie');
  const eaten = await t.ev(() => { HotelExt.st.cookie = 0.5; T.step(40); return HotelExt.st.cookie; });
  t.expectEq(eaten, 0, 'the cookie is gone after its time');

  // ---- the armchairs: sit, stay put, stand up on a free spot
  await t.ev(() => { const c = CFG.HOTEL.CHAIRS[0]; T.tp(c.x, c.y + 26, 'hotel'); });
  t.expectEq(await t.ev(() => T.label()), '🪑 Sit down', 'sit label by the armchair');
  await t.ev(() => { T.act(); T.step(3); });
  t.expect(await t.ev(() => !!HotelExt.st.seat), 'seated');
  t.expectEq(await t.ev(() => T.label()), '🚶 Stand up', 'stand-up label while seated');
  t.expectEq(await t.ev(() => T.hint()), 'Ahh, comfy! What a fancy hotel 🛋️', 'seated hint');
  const seated = await t.ev(() => { const c = CFG.HOTEL.CHAIRS[0]; T.steer(1, 1); T.step(60); T.unsteer(); return Math.hypot(Game.player.x - c.x, Game.player.y - c.y); });
  t.expect(seated < 1, 'the chef stays on the chair while seated');
  await t.shot('seated');
  const stood = await t.ev(() => { Game.s.cash = 3; T.act(); T.step(3); const p = Game.player; return { seat: !!HotelExt.st.seat, free: HotelExt.free(p.x, p.y), label: T.label(), hint: T.hint() }; });
  t.expect(!stood.seat && stood.free, 'stood up onto a free spot');
  t.expectEq(stood.hint, 'Fancy! Enjoy the Grand Hotel 🏨', 'everything seen (and no cash for a cookie): the relaxed hint');

  // ---- the bellhop keeps rolling his cart round the lobby
  const hop = await t.ev(() => { const b = HotelExt.st.hop, x0 = b.x, y0 = b.y; let moved = 0; for (let i = 0; i < 240; i++) { Game.update(1 / 60); moved = Math.max(moved, Math.hypot(b.x - x0, b.y - y0)); } const R = CFG.HOTEL.ROOM; return { moved, inRoom: b.x > R.x0 && b.x < R.x1 && b.y > R.y0 && b.y < R.y1, cartNear: Math.hypot(b.cart.x - b.x, b.cart.y - b.y) < 60 }; });
  t.expect(hop.moved > 30 && hop.inRoom && hop.cartNear, `the bellhop rolls around with his cart (${JSON.stringify(hop)})`);

  // ---- rescue: pushed into a wall (or the desk) the chef goes back to the door mat
  const rescued = await t.ev(() => { Game.player.x = 3215; Game.player.y = 3200; T.step(3); const a = { x: Game.player.x, y: Game.player.y, free: HotelExt.free(Game.player.x, Game.player.y) }; Game.player.x = 3500; Game.player.y = 3120; T.step(3); return { a, b: { free: HotelExt.free(Game.player.x, Game.player.y), x: Game.player.x, y: Game.player.y } }; });
  t.expect(rescued.a.free && Math.abs(rescued.a.x - 3500) < 1 && rescued.a.y < 3340, `rescued from the wall onto the mat (${JSON.stringify(rescued.a)})`);
  t.expect(rescued.b.free && Math.abs(rescued.b.x - 3500) < 1, 'rescued from inside the desk');

  // ---- phone-size lobby
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.tp(3500, 3240, 'hotel'); T.step(100); });   // let the rescue float fade first
  await t.shot('lobby-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- out through the revolving door: back on the door spot
  await t.ev(() => { const E = CFG.HOTEL.EXIT; T.tp(E.x, E.y, 'hotel'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back outside in the City');
  t.expect(await t.ev(() => { const D = CFG.HOTEL.DOOR; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing on the door spot');
  t.expect(await t.ev(() => { T.tp(5000, 300, 'city'); T.step(1); return HotelExt.hint(Game) === undefined; }), 'no hotel hint away from the door');

  // ---- Take me home from inside the lobby, seated
  await t.ev(() => { const D = CFG.HOTEL.DOOR; T.tp(D.x, D.y, 'city'); T.act(); const c = CFG.HOTEL.CHAIRS[1]; T.tp(c.x, c.y + 26, 'hotel'); T.act(); T.step(2); Game.goHome(); T.step(3); });
  const home = await t.ev(() => ({ area: Game.area, seat: HotelExt.st.seat, welcome: HotelExt.st.welcome, inside: Game.insideBuilding(Game.player.x, Game.player.y) }));
  t.expectEq(home.area, 'town', 'Take me home leaves the hotel');
  t.expect(!home.seat && home.welcome === 0 && home.inside, 'hotel state cleared and the chef is back in the pizzeria');
  t.expectEq(await t.ev(() => T.toasts.filter((m) => m === '🏨 Welcome to the Grand Hotel!').length), 1, 'the welcome toast showed only once');
};
