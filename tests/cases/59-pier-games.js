'use strict';
// Pizza Pier MIDWAY (js/pier-games.js): three game booths and a prize counter in CFG.PIER.PLOTS.games. The hint only near
// the booths; the booths are solid and their spots reachable from the boardwalk; ring toss (button and tap), whack-a-mole
// (real taps on the moles), the duck pond (a tap on a duck) each end in a win with 10 tickets; the prize counter swaps
// tickets for a stuffed animal the chef carries and that sits on the shelf (saved); the ✖ and the card close the game;
// the chef is held at the booth while playing; a rescue from inside a booth; Take-me-home mid-game; desktop and phone.
const fs = require('fs');
const path = require('path');

module.exports = async (t) => {
  // until the coordinator wires the pier files into index.html, serve the page with them added
  const extra = ['js/pizzapier.js', 'js/pier-games.js'].filter((f) => fs.existsSync(path.join(__dirname, '..', '..', f)));
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    const add = extra.filter((f) => !body.includes(f)).map((f) => `<script src="${f}"></script>\n  `).join('');
    if (add) body = body.replace('<script src="js/main.js"></script>', add + '<script src="js/main.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();

  // ---- registered, ahead of the City; the booths sit inside the games plot
  const reg = await t.ev(() => {
    const K = CFG.PIERGAMES, P = CFG.PIER.PLOTS.games;
    return {
      ok: Game.ext.includes(PierGamesExt) && Render.ext.includes(PierGamesExt),
      order: Game.ext.indexOf(PierGamesExt) < Game.ext.indexOf(CityExt),
      inside: K.BOOTHS.every((b) => b.x0 >= P.x0 && b.x1 <= P.x1 && b.spot.y < P.y1 && b.spot.y > K.FRONT_Y + 20),
      save: Game.s.piergames && Game.s.piergames.tickets === 0 && Game.s.piergames.prize === null,
      spots: K.BOOTHS.map((b) => [b.key, b.spot.x, b.spot.y]),
    };
  });
  t.expect(reg.ok, 'the midway extension is registered');
  t.expect(reg.order, 'the midway comes before the City in Game.ext');
  t.expect(reg.inside, 'every booth and spot is inside the games plot');
  t.expect(reg.save, 'a fresh save has no tickets and no prize');

  // ---- the hint: near the booths only
  const far = await t.ev(() => { T.tp(8600, 5980, 'pizzapier'); T.step(2); return T.hint(); });
  t.expect(far !== 'Play a game and win a prize! 🧸', `no midway hint far from the booths (${far})`);
  const near = await t.ev(() => { const b = CFG.PIERGAMES.BOOTHS[1]; T.tp(b.spot.x, b.spot.y + 50, 'pizzapier'); T.step(2); return { hint: T.hint(), label: T.label(), toast: T.toasts.filter((m) => m.includes('Midway')).length }; });
  t.expectEq(near.hint, 'Play a game and win a prize! 🧸', 'midway hint near the booths');
  t.expectEq(near.toast, 1, 'one welcome toast the first time');

  // ---- the booths are solid; each spot is free and reachable by walking up from the boardwalk
  const solid = await t.ev(() => {
    const K = CFG.PIERGAMES, obs = Game.obstacles(), out = [];
    for (const b of K.BOOTHS) {
      const inBooth = obs.some((o) => Game.hitRect(b.cx, K.COUNTER_Y, 4, o));
      const spotFree = !obs.some((o) => Game.hitRect(b.spot.x, b.spot.y, 12, o));
      T.tp(b.spot.x, 5980, 'pizzapier'); T.steer(0, -1); T.step(120); T.unsteer();
      out.push({ key: b.key, inBooth, spotFree, y: Math.round(Game.player.y), x: Math.round(Game.player.x) });
    }
    return out;
  });
  for (const s of solid) {
    t.expect(s.inBooth, `${s.key} booth is solid`);
    t.expect(s.spotFree, `${s.key} spot is free`);
    t.expect(s.y < 5838 && s.y > 5806, `${s.key}: walking up from the boardwalk stops at the counter, past the spot (y ${s.y})`);
  }
  const labels = await t.ev(() => CFG.PIERGAMES.BOOTHS.map((b) => { T.tp(b.spot.x, b.spot.y, 'pizzapier'); T.step(1); return T.label(); }));
  t.expectEq(labels.slice(0, 3).join('|'), '🎯 Play ring toss|🔨 Play whack-a-mole|🦆 Pick a duck', 'game booth labels');
  t.expect(labels[3] !== '🧸 Pick a prize', 'no prize button without tickets');

  // the booths, close up
  await t.ev(() => { T.tp(9330, 5840, 'pizzapier'); Render.setZoom(1.3); T.step(2); });
  await t.shot('booths');
  await t.ev(() => { AtmosphereExt.force && AtmosphereExt.force({ phase: 'dusk' }); T.step(600); });
  await t.shot('booths-dusk');
  await t.ev(() => { AtmosphereExt.force && AtmosphereExt.force({ phase: 'day' }); T.step(2); Render.setZoom(1); });

  // ---- RING TOSS: a tap throws, the button throws; misses get help; three ringers win
  await t.ev(() => { const b = PierGamesExt.booth('ring'); T.tp(b.spot.x, b.spot.y, 'pizzapier'); T.act(); });
  t.expectEq(await t.ev(() => PierGamesExt.st.play && PierGamesExt.st.play.key), 'ring', 'ring toss opened');
  t.expectEq(await t.ev(() => T.label()), '🎯 Throw!', 'throw label');
  t.expect(await t.ev(() => Game.hint === null || Game.hint === undefined || !Game.hint.text), 'no hint text over the game');
  await t.shot('ring');
  const held = await t.ev(() => { const x = Game.player.x, y = Game.player.y; T.steer(1, 1); T.step(30); T.unsteer(); return Math.hypot(Game.player.x - x, Game.player.y - y); });
  t.expect(held < 1, 'the chef stays at the booth while playing');
  {
    const p = await t.ev(() => PierGamesExt.toClient(180, 300));
    await t.page.mouse.click(p.x, p.y);
    t.expectEq(await t.ev(() => PierGamesExt.st.play.G.throws), 1, 'a tap on the game throws the ring');
    t.expect(await t.ev(() => !Input.joy.active), 'the tap did not grab the joystick');
  }
  await t.ev(() => T.step(3));
  await t.shot('ring-throw');
  const ring = await t.ev(() => {
    const pl = PierGamesExt.st.play; let n = 0;
    while (pl.over <= 0 && n < 20) { T.until(() => !pl.G.fly, 200); if (pl.over > 0) break; T.act(); n++; T.until(() => !pl.G.fly || pl.over > 0, 200); }
    return { won: pl.over > 0, hits: pl.G.hits, throws: pl.G.throws, tickets: Game.s.piergames.tickets, label: T.label() };
  });
  t.expect(ring.won, `ring toss won (${ring.hits} ringers in ${ring.throws} throws)`);
  t.expect(ring.throws <= 10, `ring toss is quick (${ring.throws} throws)`);
  t.expectEq(ring.tickets, 10, '10 tickets for the ring toss');
  t.expectEq(ring.label, '🎉 Yay!', 'the card button');
  await t.ev(() => T.step(20));
  await t.shot('ring-win');
  const closed = await t.ev(() => { const n = T.until(() => !PierGamesExt.st.play, 400); return { n, cheer: PierGamesExt.st.cheer.ring > 0 }; });
  t.expect(closed.n >= 0, 'the card closes by itself');
  t.expect(closed.cheer, 'the ring toss worker is still cheering after the card');

  // ---- WHACK-A-MOLE: tap the moles where they pop up
  await t.ev(() => { const b = PierGamesExt.booth('mole'); T.tp(b.spot.x, b.spot.y, 'pizzapier'); T.act(); });
  t.expectEq(await t.ev(() => T.label()), '🔨 Bonk!', 'bonk label');
  let shotMole = false;
  for (let k = 0; k < 12; k++) {
    const m = await t.ev(() => {
      T.step(1); const pl = PierGamesExt.st.play; if (!pl || pl.over > 0) return null;
      T.until(() => pl.G.holes.some((h) => h.s === 'up' && h.up > 0.9) || pl.over > 0, 300);
      const i = pl.G.holes.findIndex((h) => h.s === 'up' && h.up > 0.9); if (i < 0) return { i, dbg: JSON.stringify(pl.G.holes) + ' cd ' + pl.G.cd + ' area ' + Game.area + ' play ' + (PierGamesExt.st.play === pl) };
      const [hx, hy] = PierGames.mole.HOLES[i];
      return { i, hits: pl.G.hits, p: PierGamesExt.toClient(hx, hy - 50) };
    });
    if (!m) break;
    if (m.i < 0) throw new Error('no mole: ' + m.dbg);
    if (!shotMole) { await t.shot('mole'); shotMole = true; }
    await t.page.mouse.click(m.p.x, m.p.y);
    const after = await t.ev(() => PierGamesExt.st.play.G.hits);
    t.expectEq(after, m.hits + 1, `tap ${k + 1} bonked the mole`);
  }
  const mole = await t.ev(() => ({ won: PierGamesExt.st.play && PierGamesExt.st.play.over > 0, tickets: Game.s.piergames.tickets }));
  t.expect(mole.won, 'whack-a-mole won by tapping');
  t.expectEq(mole.tickets, 20, '10 more tickets for whack-a-mole');
  await t.ev(() => T.step(20));
  await t.shot('mole-win');
  // the card closes on a tap too
  await t.ev(() => T.step(40));
  { const p = await t.ev(() => PierGamesExt.toClient(180, 200)); await t.page.mouse.click(p.x, p.y); }
  t.expect(await t.ev(() => !PierGamesExt.st.play), 'a tap on the card closes it');

  // ---- DUCK POND: tap a duck; every duck wins
  await t.ev(() => { const b = PierGamesExt.booth('duck'); T.tp(b.spot.x, b.spot.y, 'pizzapier'); T.act(); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🦆 Pick a duck!', 'pick-a-duck label');
  await t.shot('duck');
  {
    const p = await t.ev(() => { const G = PierGamesExt.st.play.G, d = PierGames.duck.pos(G, 3); return PierGamesExt.toClient(d.x, d.y); });
    await t.page.mouse.click(p.x, p.y);
    t.expect(await t.ev(() => !!PierGamesExt.st.play.G.pick), 'a tap picked a duck');
  }
  await t.ev(() => T.step(65));
  await t.shot('duck-pick');
  const duck = await t.ev(() => { T.until(() => PierGamesExt.st.play.over > 0, 300); return { won: PierGamesExt.st.play.over > 0, tickets: Game.s.piergames.tickets, wins: Game.s.piergames.wins }; });
  t.expect(duck.won, 'the duck pond always wins');
  t.expectEq(duck.tickets, 30, '10 more tickets for the duck');
  t.expectEq(JSON.stringify(duck.wins), JSON.stringify({ ring: 1, mole: 1, duck: 1 }), 'wins counted per game');
  await t.ev(() => { T.act(); });
  t.expect(await t.ev(() => !PierGamesExt.st.play), 'the Yay! button closes the card');

  // ---- the prize counter: the ticket board, then pick a prize
  await t.ev(() => { const b = PierGamesExt.booth('prize'); T.tp(b.spot.x, b.spot.y, 'pizzapier'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🧸 Pick a prize', 'prize label with tickets');
  t.expectEq(await t.ev(() => T.hint()), '🎟️ Pick a prize! 🧸', 'prize hint with tickets');
  await t.ev(() => { T.act(); T.step(2); });
  await t.shot('prize');
  {
    const p = await t.ev(() => { const [x, y] = PierGames.prize.SPOTS[1]; return PierGamesExt.toClient(x, y - 30); });
    await t.page.mouse.click(p.x, p.y);
  }
  const prize = await t.ev(() => { T.until(() => PierGamesExt.st.play.over > 0, 300); T.step(20); return { prize: Game.s.piergames.prize, prizes: Game.s.piergames.prizes, tickets: Game.s.piergames.tickets, carry: PierGamesExt.st.carry && PierGamesExt.st.carry.kind }; });
  t.expectEq(prize.prize, 'unicorn', 'the tapped prize (the unicorn) is saved');
  t.expectEq(prize.prizes, 1, 'prize counted');
  t.expectEq(prize.tickets, 20, 'the prize cost 10 tickets');
  t.expectEq(prize.carry, 'unicorn', 'the chef carries the prize');
  await t.shot('prize-win');
  await t.ev(() => { T.until(() => !PierGamesExt.st.play, 400); const b = PierGamesExt.booth('prize'); T.tp(b.spot.x - 20, b.spot.y + 20, 'pizzapier'); Render.setZoom(2.2); T.step(2); });
  await t.shot('carry-shelf');
  // the button picks the lit prize too
  const second = await t.ev(() => { const b = PierGamesExt.booth('prize'); T.tp(b.spot.x, b.spot.y, 'pizzapier'); T.act(); const hi = PierGamesExt.st.play.G.hi; T.act(); T.until(() => PierGamesExt.st.play.over > 0, 300); const k = PierGames.prize.kind(hi); T.until(() => !PierGamesExt.st.play, 400); return { want: k, got: Game.s.piergames.prize, tickets: Game.s.piergames.tickets }; });
  t.expectEq(second.got, second.want, 'the button takes the lit prize');
  t.expectEq(second.tickets, 10, 'tickets counted down');
  await t.ev(() => Render.setZoom(1));

  // ---- the ✖ closes a game without a win
  await t.ev(() => { const b = PierGamesExt.booth('ring'); T.tp(b.spot.x, b.spot.y, 'pizzapier'); T.act(); });
  { const p = await t.ev(() => PierGamesExt.toClient(CFG.PIERGAMES.PF.w + 40 - 26 - 20, 26 - 64)); await t.page.mouse.click(p.x, p.y); }
  const x = await t.ev(() => ({ open: !!PierGamesExt.st.play, tickets: Game.s.piergames.tickets, label: T.label() }));
  t.expect(!x.open, 'the ✖ closes the game');
  t.expectEq(x.tickets, 10, 'no tickets lost or gained by closing');
  t.expectEq(x.label, '🎯 Play ring toss', 'the booth offers the game again');

  // ---- a rescue from inside a booth puts the chef on a booth spot
  const resc = await t.ev(() => { const b = PierGamesExt.booth('duck'); Game.player.x = b.cx + 10; Game.player.y = 5700; T.step(2); return { x: Game.player.x, y: Game.player.y, b: b.spot }; });
  t.expect(resc.x === resc.b.x && resc.y === resc.b.y, `rescued onto the duck spot (${resc.x},${resc.y})`);

  // ---- the prize is saved across a reload
  await t.ev(() => Game.save());
  await t.reload();
  const saved = await t.ev(() => ({ prize: Game.s.piergames.prize, tickets: Game.s.piergames.tickets }));
  t.expect(!!saved.prize && saved.tickets === 10, `prize and tickets kept after a reload (${JSON.stringify(saved)})`);

  // ---- Take-me-home in the middle of a game
  const home = await t.ev(() => { const b = PierGamesExt.booth('mole'); T.tp(b.spot.x, b.spot.y, 'pizzapier'); T.act(); const open = !!PierGamesExt.st.play; Game.goHome(); T.step(3); return { open, play: PierGamesExt.st.play, area: Game.area, label: T.label() }; });
  t.expect(home.open, 'a game was open');
  t.expectEq(home.play, null, 'Take-me-home closes the game');
  t.expectEq(home.area, 'town', 'back in town');
  t.expect(home.label !== '🔨 Bonk!', 'no game button at home');
  await t.shot('home');

  // ---- phone: the booths and each game fit; taps land on the moles
  await t.boot({ viewport: { width: 390, height: 844 } });
  await t.ev(() => { Game.s.piergames.tickets = 10; Game.s.piergames.prize = 'bear'; Game.s.piergames.seen = true; T.tp(9250, 5870, 'pizzapier'); T.step(2); });
  await t.shot('phone-booths');
  await t.ev(() => { const b = PierGamesExt.booth('ring'); T.tp(b.spot.x, b.spot.y, 'pizzapier'); T.act(); T.step(10); });
  await t.shot('phone-ring');
  await t.ev(() => { PierGamesExt.st.play = null; const b = PierGamesExt.booth('mole'); T.tp(b.spot.x, b.spot.y, 'pizzapier'); T.act(); });
  const pm = await t.ev(() => { const pl = PierGamesExt.st.play; T.until(() => pl.G.holes.some((h) => h.s === 'up' && h.up > 0.9), 300); const i = pl.G.holes.findIndex((h) => h.s === 'up' && h.up > 0.9); const [hx, hy] = PierGames.mole.HOLES[i]; return { hits: pl.G.hits, p: PierGamesExt.toClient(hx, hy - 50) }; });
  await t.shot('phone-mole');
  await t.page.mouse.click(pm.p.x, pm.p.y);
  t.expectEq(await t.ev(() => PierGamesExt.st.play.G.hits), pm.hits + 1, 'a tap bonks a mole on the phone');
  await t.ev(() => { PierGamesExt.st.play = null; const b = PierGamesExt.booth('duck'); T.tp(b.spot.x, b.spot.y, 'pizzapier'); T.act(); T.step(10); });
  await t.shot('phone-duck');
  await t.ev(() => { PierGamesExt.st.play = null; const b = PierGamesExt.booth('prize'); T.tp(b.spot.x, b.spot.y, 'pizzapier'); T.act(); T.step(10); });
  await t.shot('phone-prize');
  await t.ev(() => { PierGamesExt.st.play.G.pick = { i: 2, t: 0 }; T.until(() => PierGamesExt.st.play.over > 0, 300); T.step(30); });
  await t.shot('phone-prize-win');
  t.expectEq(await t.ev(() => Game.s.piergames.prize), 'pizza', 'pizza plush won on the phone');
};
