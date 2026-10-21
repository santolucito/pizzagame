'use strict';
// The cinema in the City: the door's label and hint on Market Street, going inside (welcome toast, no stray hint), the
// $3 ticket and the $4 popcorn, the curtain through to the screening room, a seat (the movie rolls, the lights dim, the
// usher checks the ticket, the chef munches popcorn and stays put), a rescue from a wall, Take-me-home from the seat, and
// going back out onto the door spot.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/city-cinema.js into index.html, load it into the booted page
  if (await t.ev(() => typeof CinemaExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-cinema.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof CinemaExt !== 'undefined' && !!CFG.AREAS.cinema), 'the cinema extension and its map are registered');
  t.expect(await t.ev(() => Game.ext.indexOf(CinemaExt) < Game.ext.indexOf(CityExt)), 'the cinema answers before the City');
  t.expect(await t.ev(() => { const C = CFG.CINEMA, W = C.WORLD; return W.x0 === -1300 + C.BUILDING * 900 && W.x1 === W.x0 + 600 && W.y0 === 3000 && W.y1 === 3400; }), 'the interior sits in the rectangle reserved for building 12');

  // ---- the door on Market Street
  await t.ev(() => { const D = CFG.CINEMA.DOOR_OUT; T.tp(D.x, D.y + 60, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Watch a movie at the cinema! 🎬', 'cinema hint near the door');
  t.expect(await t.ev(() => { const D = CFG.CINEMA.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  t.expectEq(await t.ev(() => { const D = CFG.CINEMA.DOOR_OUT; T.tp(D.x, D.y + 90, 'city'); T.step(2); return CinemaExt.hint(Game); }), undefined, 'no cinema hint beyond 70 px of the door');
  await t.ev(() => { Render.setZoom(1.2); Game.s.cash = 20; const D = CFG.CINEMA.DOOR_OUT; T.tp(D.x, D.y, 'city'); T.step(2); });
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  await t.shot('door');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'cinema', 'inside the cinema');
  t.expect(await t.ev(() => T.toasts.includes('🎬 Welcome to the cinema!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.CINEMA.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => CinemaExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Buy a ticket at the booth! 🎟️', 'ticket hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, P = CFG.CINEMA.PADS.ticket; return !!h.target && h.target.x === P.x && h.target.y === P.y; }), 'the hint points at the ticket circle');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('lobby');

  // ---- a $3 ticket from the booth
  const ticket = await t.ev(() => {
    const P = CFG.CINEMA.PADS.ticket; T.tp(P.x, P.y, 'cinema');
    const n = T.until(() => CinemaExt.st.ticket, 400);
    return { n, cash: Game.s.cash, tickets: Game.s.cinema.tickets, hint: T.hint() };
  });
  t.expect(ticket.n >= 0, 'the circle sold a ticket');
  t.expectEq(ticket.cash, 17, 'the ticket cost $3');
  t.expectEq(ticket.tickets, 1, 'ticket counted');
  t.expectEq(ticket.hint, 'Get some popcorn! 🍿', 'popcorn hint after the ticket');

  // ---- a $4 popcorn bucket from the machine
  const corn = await t.ev(() => {
    const P = CFG.CINEMA.PADS.popcorn; T.tp(P.x, P.y, 'cinema');
    const n = T.until(() => CinemaExt.st.popcorn > 0, 400);
    return { n, cash: Game.s.cash, popcorn: CinemaExt.st.popcorn, popcorns: Game.s.cinema.popcorns, hint: T.hint(), popping: CinemaExt.st.kernels.some((k) => k.vy !== 0) };
  });
  t.expect(corn.n >= 0, 'the circle sold a popcorn bucket');
  t.expectEq(corn.cash, 13, 'the popcorn cost $4');
  t.expectEq(corn.popcorns, 1, 'popcorn counted');
  t.expect(corn.popcorn > 25, 'the bucket lasts half a minute');
  t.expect(corn.popping, 'kernels are popping in the machine');
  t.expectEq(corn.hint, 'Go through the curtain to the movie 🎬', 'curtain hint with ticket and popcorn in hand');
  await t.shot('popcorn');

  // ---- the curtain parts and the chef walks through into the screening room
  const walk = await t.ev(() => {
    const C = CFG.CINEMA.CURTAIN; T.tp(C.x - 60, (C.y0 + C.y1) / 2, 'cinema'); T.step(2);
    const before = CinemaExt.st.curtain;
    T.steer(1, 0); const n = T.until(() => Game.player.x > CFG.CINEMA.HALL.x0 + 20, 300); T.unsteer();
    return { n, before, open: CinemaExt.st.curtain, x: Game.player.x, hint: T.hint() };
  });
  t.expect(walk.n >= 0, `walked through the curtain into the hall (x=${Math.round(walk.x)})`);
  t.expect(walk.open > 0.5, 'the curtain parted for the chef');
  t.expectEq(walk.hint, 'Sit down and watch the movie 🪑', 'seat hint in the hall');
  t.expect(await t.ev(() => { const h = Game.hint; return !!h.target && CinemaExt.st.seats.some((s) => !s.taken && s.x === h.target.x && s.y === h.target.y); }), 'the hint points at a free seat');
  // the walls and the furniture are solid: the partition wall above the curtain stops the chef
  const wall = await t.ev(() => { const C = CFG.CINEMA; T.tp(C.CURTAIN.x - 60, C.CURTAIN.y0 - 40, 'cinema'); T.steer(1, 0); T.step(90); T.unsteer(); return Game.player.x; });
  t.expect(wall < (await t.ev(() => CFG.CINEMA.LOBBY.x1)), 'the wall beside the curtain is solid');

  // ---- sit down: the movie rolls, the lights dim, the usher checks the ticket, popcorn gets munched
  const seat = await t.ev(() => { const s = CinemaExt.st.seats.find((q) => !q.taken && q.r === 1); T.tp(s.x, s.y + 4, 'cinema'); return s; });
  t.expectEq(await t.ev(() => T.label()), '🪑 Sit down', 'sit label at a seat');
  await t.ev(() => { T.act(); T.step(5); });
  t.expect(await t.ev(() => !!CinemaExt.st.seat), 'seated');
  t.expectEq(await t.ev(() => T.label()), '🚶 Stand up', 'stand-up label while seated');
  t.expectEq(await t.ev(() => T.hint()), 'Munch munch… enjoy the show! 🍿', 'seated hint with popcorn');
  const stayed = await t.ev((s) => { T.steer(1, 1); T.step(40); T.unsteer(); return Math.hypot(Game.player.x - s.x, Game.player.y - s.y); }, seat);
  t.expect(stayed < 1, 'the chef stays in the seat while seated');
  t.expect(await t.ev(() => CinemaExt.st.dim > 0.9 && CinemaExt.st.movieT > 0.5), 'the lights are down and the movie is playing');
  await t.ev(() => T.until(() => CinemaExt.st.usher.shine > 0, 600));
  t.expect(await t.ev(() => CinemaExt.st.usher.shine > 0), 'the usher came over with the torch');
  await t.shot('usher');
  const greeted = await t.ev(() => { const n = T.until(() => CinemaExt.st.seat.greeted, 300); return { n, ticket: CinemaExt.st.ticket, floats: Game.floats.map((f) => f.text) }; });
  t.expect(greeted.n >= 0 && !greeted.ticket, 'the usher took the ticket');
  t.expect(greeted.floats.includes('Enjoy the show! 🎟️'), 'the "Enjoy the show" float');
  await t.ev(() => T.until(() => CinemaExt.st.movieT > 5.5 && CinemaExt.st.movieT < 7, 600));
  await t.shot('movie');
  const ended = await t.ev(() => { const n = T.until(() => CinemaExt.st.seat.ended, 1400); return { n, movies: Game.s.cinema.movies, t: CinemaExt.st.movieT, floats: Game.floats.map((f) => f.text) }; });
  t.expect(ended.n >= 0, 'the movie reached the end card');
  t.expectEq(ended.movies, 1, 'one movie counted');
  t.expect(ended.floats.includes('The End! 🎬'), 'the "The End" float');
  await t.shot('the-end');
  t.expect(await t.ev(() => { T.step(60 * 5); return CinemaExt.st.movieT < 16 && CinemaExt.st.seat; }), 'the movie loops around while seated');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !CinemaExt.st.seat), 'stood up');
  t.expectEq(await t.ev(() => T.label()), '🪑 Sit down', 'can sit again');
  t.expect(await t.ev(() => { T.step(60); return CinemaExt.st.dim === 0; }), 'the lights come back up');
  t.expectEq(await t.ev(() => T.hint()), 'Sit down and watch the movie 🪑', 'seat hint again after standing');
  // the taken seats belong to the moviegoers
  t.expect(await t.ev(() => { const s = CinemaExt.st.seats.find((q) => q.taken); T.tp(s.x, s.y + 4, 'cinema'); return T.label() !== '🪑 Sit down'; }), 'no sitting on a moviegoer');
  // the popcorn is carried along outside too, then runs out
  t.expect(await t.ev(() => { T.tp(540, 430, 'town'); T.step(2); return CinemaExt.st.popcorn > 0; }), 'the popcorn comes along to the town');
  t.expect(await t.ev(() => { T.step(60 * 31); return CinemaExt.st.popcorn === 0; }), 'the popcorn is finished after 30 s');
  t.expectEq(await t.ev(() => CinemaExt.hint(Game)), undefined, 'no cinema hint in the town');

  // ---- a reload or push into a wall lands back on the mat
  await t.ev(() => { const L = CFG.CINEMA.LOBBY; T.tp(L.x0 - 10, 3200, 'cinema'); T.step(3); });
  t.expect(await t.ev(() => CinemaExt.free(Game.player.x, Game.player.y)), 'pushed into the wall: rescued onto the floor');
  t.expect(await t.ev(() => { const E = CFG.CINEMA.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'the rescue lands on the exit mat');
  await t.ev(() => { const B = CFG.CINEMA.BOOTH; T.tp((B.x0 + B.x1) / 2, B.y1 - 6, 'cinema'); T.step(3); });
  t.expect(await t.ev(() => CinemaExt.free(Game.player.x, Game.player.y)), 'dropped into the ticket booth: rescued');
  await t.ev(() => { T.tp(9812, 3180, 'cinema'); T.step(3); });
  t.expect(await t.ev(() => CinemaExt.free(Game.player.x, Game.player.y)), 'dropped into the partition wall: rescued');
  t.expect(await t.ev(() => { const C = CFG.CINEMA.CURTAIN; T.tp(C.x, (C.y0 + C.y1) / 2, 'cinema'); T.step(3); return Game.player.x === C.x; }), 'standing in the curtain gap is fine');

  // ---- phone-size cinema
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const s = CinemaExt.st.seats.find((q) => !q.taken && q.r === 2 && q.c === 3); T.tp(s.x, s.y + 4, 'cinema'); T.act(); T.step(120); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- Take-me-home from the seat
  t.expect(await t.ev(() => !!CinemaExt.st.seat), 'seated before Take-me-home');
  await t.ev(() => { Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'Take-me-home leaves the cinema');
  t.expect(await t.ev(() => !CinemaExt.st.seat && CinemaExt.st.dim === 0), 'the seat and the dimmed lights are cleared by Take-me-home');
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');

  // ---- out through the door: back on the sidewalk at the door spot
  await t.ev(() => { const E = CFG.CINEMA.EXIT; T.tp(E.x, E.y, 'cinema'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back outside in the City');
  t.expect(await t.ev(() => { const D = CFG.CINEMA.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the door spot');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door offers going back in');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '🎬 Welcome to the cinema!').length === 1), 'the welcome toast shows only once');
  // no cinema button or hint while riding a taxi
  t.expect(await t.ev(() => { const D = CFG.CINEMA.DOOR_OUT; T.tp(D.x, D.y, 'city'); CityExt.st.cab = { fake: true }; const r = [CinemaExt.action(Game), CinemaExt.hint(Game)]; CityExt.st.cab = null; return r[0] === null && r[1] === undefined; }), 'no door button or hint from a taxi');

  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
