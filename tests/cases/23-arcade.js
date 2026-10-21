'use strict';
// The Arcade (City building 3): the door on Bus Street, the games room inside (claw machine, the three playable
// cabinets, the playable pinball table, dance pad, photo booth, token bag), the way back out, a rescue from a wall,
// and Take-me-home from inside (also mid-game). Each big-screen game is driven with the stick and the button.
const fs = require('fs');
const path = require('path');

module.exports = async (t) => {
  // js/city-arcade.js is wired into index.html by the coordinator; until then, load it just before main.js
  const root = path.resolve(__dirname, '..', '..');
  if (!fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('city-arcade.js')) {
    const src = fs.readFileSync(path.join(root, 'js', 'city-arcade.js'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');
    await t.page.route('**/js/main.js*', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'Cache-Control': 'no-store' }, body: src }));
    // the service worker fetches outside the page's routes and would serve the real main.js on reload: keep it off
    await t.page.addInitScript(() => { try { ServiceWorkerContainer.prototype.register = () => Promise.reject(new Error('no service worker in this test')); } catch (e) { /* ignore */ } });
  }
  await t.boot();
  t.expect(await t.ev(() => typeof ArcadeExt !== 'undefined' && Game.ext.indexOf(ArcadeExt) < Game.ext.indexOf(CityExt) && !!CFG.AREAS.arcade), 'the arcade extension is loaded first');
  t.expect(await t.ev(() => Game.s.arcade && Game.s.arcade.best && Game.s.arcade.best.invaders === 0 && Game.s.arcade.best.pinball === 0), 'best scores start at zero via defaults');

  // ---- outside: far from the door the hint is not ours; near it, the door hint and the button
  await t.ev(() => T.tp(5000, 300, 'city'));
  t.expectEq(await t.ev(() => ArcadeExt.hint(Game)), undefined, 'no arcade hint away from the door');
  t.expectEq(await t.ev(() => ArcadeExt.action(Game)), null, 'no arcade button away from the door');
  await t.ev(() => { const D = CFG.ARCADE.DOOR; T.tp(D.x, D.y + 46, 'city'); });
  t.expectEq(await t.ev(() => T.hint()), 'Go inside the Arcade! 🕹️', 'door hint near the door');
  await t.ev(() => { const D = CFG.ARCADE.DOOR; T.tp(D.x, D.y, 'city'); Render.setZoom(1.6); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'go-inside label at the door');
  await t.shot('door');

  // ---- go inside
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'arcade', 'inside the arcade');
  t.expect(await t.ev(() => T.toasts.includes('🕹️ Welcome to the Arcade!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.ARCADE.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2 && ArcadeExt.free(Game, Game.player.x, Game.player.y); }), 'arrived on the mat, on free floor');
  const h0 = await t.ev(() => Game.hint && { text: Game.hint.text, target: Game.hint.target });
  t.expect(h0 && h0.text === 'Try the claw machine! 🧸', `first hint points at the claw (${JSON.stringify(h0)})`);
  t.expect(await t.ev(() => { const W = CFG.ARCADE.WORLD, h = Game.hint; return !!h.target && h.target.x > W.x0 && h.target.x < W.x1 && h.target.y > W.y0 && h.target.y < W.y1; }), 'the hint target is inside the arcade');
  await t.ev(() => Render.setZoom(1));
  await t.shot('inside');

  // ---- the claw machine: the claw sweeps on its own; one press drops it where it is and it always brings a prize
  await t.ev(() => { const S = CFG.ARCADE.CLAW.spot; T.tp(S.x, S.y, 'arcade'); });
  t.expectEq(await t.ev(() => T.hint()), 'Press the button to grab a prize! 🧸', 'claw hint');
  t.expectEq(await t.ev(() => T.label()), '🧸 Grab a prize', 'claw label');
  const sweep = await t.ev(() => { const C = CFG.ARCADE.CLAW, xs = []; for (let i = 0; i < 6; i++) { xs.push(ArcadeExt.clawPose(null, Game.time).x); T.step(10); } return { moved: Math.max(...xs) - Math.min(...xs) > 3, inside: xs.every((x) => x > C.x && x < C.x + C.w) }; });   // sampled, so a turning point of the sweep cannot fool it
  t.expect(sweep.moved && sweep.inside, `the idle claw sweeps left and right over the plushies (${JSON.stringify(sweep)})`);
  await t.ev(() => { T.act(); T.step(5); });
  t.expectEq(await t.ev(() => ArcadeExt.st.play && ArcadeExt.st.play.kind), 'claw', 'the claw is grabbing');
  t.expect(await t.ev(() => { const pl = ArcadeExt.st.play; return pl.plush === ArcadeExt.nearestSlot(pl.x0); }), 'it grabs the plush under it');
  t.expectEq(await t.ev(() => T.label()), '🧸 Grabbing…', 'button waits while the claw works');
  t.expectEq(await t.ev(() => T.hint()), 'Grabbing a prize… 🧸', 'claw hint while grabbing');
  const held = await t.ev(() => { const S = CFG.ARCADE.CLAW.spot; T.steer(-1, 1); T.step(40); T.unsteer(); return Math.hypot(Game.player.x - S.x, Game.player.y - S.y); });
  t.expect(held < 1, 'the chef stays at the machine during the grab');
  await t.ev(() => T.step(30));
  await t.shot('claw');
  const claw = await t.ev(() => { const n = T.until(() => !ArcadeExt.st.play, 400); return { n, prizes: Game.s.arcade.prizes, float: Game.floats.some((f) => f.text === 'You got a prize! 🧸'), plays: Game.s.arcade.plays }; });
  t.expect(claw.n >= 0 && claw.n < 120, `the grab finished after about 2.4 s (${claw.n} more steps)`);
  t.expectEq(claw.prizes, 1, 'one prize won');
  t.expect(claw.float, 'the prize float showed');
  t.expectEq(claw.plays, 1, 'one play counted');

  // ---- helpers for the big-screen games (run inside the page)
  await t.ev(() => {
    window.TG = {
      pl: () => ArcadeExt.st.play, G: () => ArcadeExt.st.play && ArcadeExt.st.play.game,
      // the game is open big on the screen: the chef held at the spot, no hint, a game state
      open(spot) { const pl = TG.pl(); return { game: !!(pl && pl.game), held: Math.hypot(Game.player.x - spot.x, Game.player.y - spot.y) < 1, hint: T.hint(), label: T.label(), over: pl && pl.over, t: pl && pl.t }; },
      // step while an "autopilot" steers, until the condition holds
      run(fn, pilot, max) { const n = T.until(() => { if (pilot) pilot(); return fn(); }, max); T.unsteer(); return n; },
      finish(key) {   // the round ends with the card, then the chef is free and the best score is kept
        const pl = TG.pl(), before = pl.score;
        const nCard = T.until(() => !TG.pl() || TG.pl().over > 0, 2400), card = TG.pl() ? { label: T.label(), over: TG.pl().over, score: TG.pl().score, newBest: TG.pl().newBest, sparks: TG.pl().sparks.length } : null;
        const nEnd = T.until(() => !TG.pl(), 200);
        return { before, nCard, card, nEnd, best: Game.s.arcade.best[key], float: Game.floats.some((f) => f.text === `⭐ Score ${card && card.score}`), free: !ArcadeExt.st.play };
      },
    };
  });
  const expectGame = (name, o, spot) => { t.expect(o.game && o.held && o.hint === null && o.over === 0, `${name} opened big on screen with the chef held and no hint (${JSON.stringify(o)})`); };
  const expectFinish = (name, f) => {
    t.expect(f.nCard >= 0 && f.card && f.card.over > 0 && f.card.label === '⭐ Great game!' && f.card.sparks > 0, `${name}: the Great game! card with sparkles (${JSON.stringify(f)})`);
    t.expect(f.nEnd >= 0 && f.nEnd <= 125 && f.free, `${name}: the card lasts 2 s and then the chef is free (${f.nEnd})`);
    t.expect(f.card.score > 0 && f.best === f.card.score && f.card.newBest && f.float, `${name}: best score saved and the score float showed (${JSON.stringify(f)})`);
  };

  // ---- PIZZA INVADERS: the stick steers the ship, slices fly on their own, a vegetable bursts for points
  await t.ev(() => { const S = CFG.ARCADE.CABINETS[0].spot; T.tp(S.x, S.y, 'arcade'); });
  t.expectEq(await t.ev(() => T.hint()), 'Press the button to play! 👾', 'cabinet hint');
  t.expectEq(await t.ev(() => T.label()), '👾 Play', 'cabinet label');
  await t.ev(() => { T.act(); T.step(2); });
  expectGame('invaders', await t.ev(() => TG.open(CFG.ARCADE.CABINETS[0].spot)));
  t.expectEq(await t.ev(() => T.label()), '🚪 Stop playing', 'the button stops the game');
  const inv = await t.ev(() => { const G = TG.G(), x0 = G.ship; T.steer(-1, 0); T.step(20); const x1 = G.ship; T.steer(1, 0); T.step(40); T.unsteer(); return { x0, x1, x2: G.ship, bullets: G.bullets.length, veg: G.veg.length }; });
  t.expect(inv.x1 < inv.x0 - 20 && inv.x2 > inv.x1 + 20 && inv.bullets > 0 && inv.veg > 0, `the ship steers and auto-fires at vegetables (${JSON.stringify(inv)})`);
  const invScore = await t.ev(() => TG.run(() => TG.pl().score > 0, () => { const G = TG.G(), v = G.veg[0]; if (v) T.steer(Math.sign(v.x - G.ship), 0); }, 900));
  t.expect(invScore >= 0, `a vegetable was hit for points (${invScore} steps)`);
  t.expect(await t.ev(() => TG.G().sparks.length > 0 || TG.pl().score >= 10), 'the hit burst into sparkles and scored');
  await t.ev(() => T.step(2));
  await t.shot('invaders');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.step(2); });
  await t.shot('invaders-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => Render.resize());
  const stop = await t.ev(() => { T.act(); T.step(12); return { over: TG.pl().over, label: T.label() }; });   // Stop playing: straight to the card
  t.expect(stop.over > 1.7 && stop.over < 1.85 && stop.label === '⭐ Great game!', `Stop playing goes straight to the 2 s card and the button rests (${JSON.stringify(stop)})`);
  await t.shot('card');
  const invEnd = await t.ev(() => TG.finish('invaders'));
  expectFinish('invaders', invEnd);
  // play again and stop at once: a worse round (score 0) never lowers the best
  const again = await t.ev(() => { const best = Game.s.arcade.best.invaders; T.act(); T.step(2); T.act(); const n = T.until(() => !TG.pl(), 200); return { n, kept: Game.s.arcade.best.invaders === best, plays: Game.s.arcade.plays }; });
  t.expect(again.n >= 0 && again.kept && again.plays === 3, `a worse round never lowers the best (${JSON.stringify(again)})`);

  // ---- ROAD RACER: lanes with the stick, a bump just goes Boing!, pizza boxes score
  await t.ev(() => { const S = CFG.ARCADE.CABINETS[1].spot; T.tp(S.x, S.y, 'arcade'); });
  t.expectEq(await t.ev(() => T.label()), '🏎️ Play', 'racer label');
  await t.ev(() => { T.act(); T.step(2); });
  expectGame('racer', await t.ev(() => TG.open(CFG.ARCADE.CABINETS[1].spot)));
  const race = await t.ev(() => { const G = TG.G(); T.steer(-1, 0); T.step(30); const l0 = G.lane, x0 = G.x; T.steer(1, 0); T.step(70); T.unsteer(); return { l0, x0, l1: G.lane, x1: G.x, sp0: G.speed }; });
  t.expect(race.l0 === 0 && race.x0 < 100 && race.l1 === 2 && race.x1 > 220, `the car changes lanes with the stick (${JSON.stringify(race)})`);
  const bump = await t.ev(() => { const G = TG.G(), L = ArcadeGames.racer.LANES; G.cars.push({ lane: G.lane, x: L[G.lane], y: CFG.ARCADE.PF.h - 70 - 50, color: '#3b7dd8', boost: 0 }); T.step(8); return { bumps: G.bumps, boing: G.texts.some((x) => x.text === 'Boing!'), slow: G.slow > 0, score: TG.pl().score, over: TG.pl().over }; });
  t.expect(bump.bumps === 1 && bump.boing && bump.slow && bump.over === 0, `bumping a car just goes Boing! and slows, no crash (${JSON.stringify(bump)})`);
  const raceScore = await t.ev(() => TG.run(() => TG.pl().score > 0, () => { const G = TG.G(), py = CFG.ARCADE.PF.h - 70, b = G.boxes.filter((o) => o.y < py - 20).sort((p, q) => q.y - p.y)[0]; T.steer(b ? Math.sign(b.lane - G.lane) : 0, 0); }, 900));
  t.expect(raceScore >= 0, `a pizza box was collected (${raceScore} steps)`);
  const sp1 = await t.ev(() => TG.G().speed);
  t.expect(sp1 > race.sp0, `the speed creeps up (${race.sp0} -> ${sp1})`);
  await t.shot('racer');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.step(2); });
  await t.shot('racer-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => Render.resize());
  // let the round run out: 30 s (or the goal), then the card
  const raceEnd = await t.ev(() => TG.finish('racer'));
  expectFinish('racer', raceEnd);
  t.expect(raceEnd.nCard > 600, `the round ran on for a while before the card (${raceEnd.nCard} steps)`);

  // ---- PIZZA PONG: the paddle follows the stick, a return scores 1, a goal against the robot 5, a miss just comes back
  await t.ev(() => { const S = CFG.ARCADE.CABINETS[2].spot; T.tp(S.x, S.y, 'arcade'); });
  t.expectEq(await t.ev(() => T.label()), '🏓 Play', 'pong label');
  await t.ev(() => { T.act(); T.step(2); });
  expectGame('pong', await t.ev(() => TG.open(CFG.ARCADE.CABINETS[2].spot)));
  const pong = await t.ev(() => { const G = TG.G(), y0 = G.py; T.steer(0, -1); T.step(20); const y1 = G.py; T.steer(0, 1); T.step(40); T.unsteer(); return { y0, y1, y2: G.py }; });
  t.expect(pong.y1 < pong.y0 - 20 && pong.y2 > pong.y1 + 20, `the paddle moves up and down with the stick (${JSON.stringify(pong)})`);
  const pongScore = await t.ev(() => TG.run(() => TG.pl().score > 0, () => { const G = TG.G(); T.steer(0, Math.abs(G.ball.y - G.py) > 6 ? Math.sign(G.ball.y - G.py) : 0); }, 900));
  t.expect(pongScore >= 0 && await t.ev(() => TG.G().rally >= 1), `a return scored (${pongScore} steps)`);
  const miss = await t.ev(() => { const G = TG.G(), s = TG.pl().score; G.ball.x = 10; G.ball.y = 395; G.ball.vx = -300; G.py = 40; T.step(10); return { back: G.ball.x > 100 && G.serveCd > 0, score: TG.pl().score === s, over: TG.pl().over }; });
  t.expect(miss.back && miss.score && miss.over === 0, `a missed ball just comes back, nothing lost (${JSON.stringify(miss)})`);
  const goal = await t.ev(() => { const G = TG.G(), s = TG.pl().score, g0 = G.goals; G.serveCd = 0; G.ball.x = 310; G.ball.y = 200; G.ball.vx = 300; G.ry = 380; T.step(10); return { goals: G.goals - g0, plus: TG.pl().score - s, text: G.texts.some((x) => x.text === 'GOAL!') }; });
  t.expect(goal.goals === 1 && goal.plus === 5 && goal.text, `a goal against the robot counts 5 (${JSON.stringify(goal)})`);
  await t.shot('pong');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.step(2); });
  await t.shot('pong-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => Render.resize());
  await t.ev(() => T.act());
  expectFinish('pong', await t.ev(() => TG.finish('pong')));

  // ---- PINBALL: the button launches, the stick flips, the ball never drains for good
  await t.ev(() => { const S = CFG.ARCADE.PINBALL.spot; T.tp(S.x, S.y, 'arcade'); });
  t.expectEq(await t.ev(() => T.hint()), 'Press the button to play pinball! 🪩', 'pinball hint');
  t.expectEq(await t.ev(() => T.label()), '🪩 Play pinball', 'pinball label');
  await t.ev(() => { T.act(); T.step(2); });
  expectGame('pinball', await t.ev(() => TG.open(CFG.ARCADE.PINBALL.spot)));
  t.expect(await t.ev(() => TG.G().at === 'plunger' && T.label() === '🪩 Launch!'), 'the ball waits at the plunger and the button launches');
  const launch = await t.ev(() => { T.act(); T.step(5); const G = TG.G(); return { at: G.at, launches: G.launches, up: G.ball.vy < 0, label: T.label() }; });
  t.expect(launch.at === 'play' && launch.launches === 1 && launch.up && launch.label === '⚡ Flip!', `launched (${JSON.stringify(launch)})`);
  const flip = await t.ev(() => { const G = TG.G(); T.steer(-1, 0); T.step(10); const l = [G.fl[0].ang, G.fl[1].ang]; T.steer(1, 0); T.step(10); const r = [G.fl[0].ang, G.fl[1].ang]; T.unsteer(); T.step(10); const rest = [G.fl[0].ang, G.fl[1].ang]; T.act(); T.step(4); const both = [G.fl[0].ang, G.fl[1].ang]; return { l, r, rest, both }; });
  t.expect(flip.l[0] < 0 && flip.l[1] > 0.4 && flip.r[1] < 0 && flip.r[0] > 0.4 && flip.rest[0] > 0.4 && flip.rest[1] > 0.4 && flip.both[0] < 0.4 && flip.both[1] < 0.4, `stick left/right flips one flipper, the button both (${JSON.stringify(flip)})`);
  const pinScore = await t.ev(() => TG.run(() => TG.pl().score > 0, () => { const G = TG.G(); if (G.at === 'plunger') T.act(); T.steer(G.ball.x < 160 ? -1 : 1, 0); }, 1200));
  t.expect(pinScore >= 0, `pinball scored (bumper, lamp or ramp) (${pinScore} steps)`);
  await t.shot('pinball');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.step(2); });
  await t.shot('pinball-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => Render.resize());
  const drain = await t.ev(() => { const G = TG.G(); G.ball.x = 160; G.ball.y = 395; G.ball.vx = 0; G.ball.vy = 300; G.ball.lane = false; G.ball.ramp = false; T.step(6); const at = G.at; const n = T.until(() => G.at === 'plunger', 120); return { at, n, label: T.label(), over: TG.pl().over }; });
  t.expect(drain.at === 'return' && drain.n >= 0 && drain.label === '🪩 Launch!' && drain.over === 0, `a drained ball rolls back to the plunger, no game over (${JSON.stringify(drain)})`);
  const pinEnd = await t.ev(() => {
    // play the round out: relaunch whenever the ball is back at the plunger, flip when it comes down low
    let launches = 0, drains = 0, last = 'plunger';
    const nCard0 = T.until(() => { const G = TG.G(); if (!G || TG.pl().over > 0) return true; if (G.at === 'plunger') { T.act(); launches++; } if (G.at === 'return' && last !== 'return') drains++; last = G.at; T.steer(G.ball.y > 300 ? (G.ball.x < 160 ? -1 : 1) : 0, 0); return false; }, 2400);
    T.unsteer();
    return Object.assign(TG.finish('pinball'), { launches, drains, nCard0, games: Game.s.arcade.pinball });
  });
  expectFinish('pinball', pinEnd);
  t.expect(pinEnd.nCard0 > 600 && pinEnd.games === 1 && pinEnd.launches >= 1, `the 30 s pinball round ran with relaunches (${JSON.stringify({ nCard0: pinEnd.nCard0, launches: pinEnd.launches, drains: pinEnd.drains, games: pinEnd.games })})`);
  await t.shot('card-after');

  // ---- the backglass shows the best scores (via the saved state the live art reads)
  t.expect(await t.ev(() => { const b = Game.s.arcade.best; return b.invaders > 0 && b.racer > 0 && b.pong > 0 && b.pinball > 0; }), `a best score per game (${JSON.stringify(await t.ev(() => Game.s.arcade.best))})`);

  // ---- the dance pad: arrows light up and the chef bobs while standing on it
  const dance = await t.ev(() => { const D = CFG.ARCADE.DANCE; T.tp(D.x, D.y, 'arcade'); T.step(40); return { on: ArcadeExt.st.dance.on, beat: ArcadeExt.st.dance.beat, moving: Game.player.moving, hint: T.hint(), notes: ArcadeExt.st.notes.length, danced: Game.s.arcade.danced }; });
  t.expect(dance.on && dance.beat >= 0 && dance.moving && dance.notes > 0 && dance.danced, `dancing on the pad (${JSON.stringify(dance)})`);
  t.expectEq(dance.hint, 'Dance to the beat! 💃', 'dance hint');
  await t.shot('dance');
  const off = await t.ev(() => { T.tp(1640, 3300, 'arcade'); T.step(2); return ArcadeExt.st.dance.on; });
  t.expect(!off, 'stepping off the pad stops the dance');

  // ---- the photo booth: three flashes and a photo strip
  await t.ev(() => { const S = CFG.ARCADE.BOOTH.spot; T.tp(S.x, S.y, 'arcade'); });
  t.expectEq(await t.ev(() => T.label()), '📸 Take a photo', 'booth label');
  const booth = await t.ev(() => { T.act(); let flashes = 0, maxFlash = 0; T.until(() => { maxFlash = Math.max(maxFlash, ArcadeExt.st.flash); flashes = ArcadeExt.st.play ? ArcadeExt.st.play.flashes : flashes; return !ArcadeExt.st.play; }, 400); return { flashes, maxFlash, photos: Game.s.arcade.photos, strip: !!ArcadeExt.st.photo, float: Game.floats.some((f) => f.text === '📸 Say cheese!') }; });
  t.expect(booth.flashes === 3 && booth.maxFlash > 0 && booth.photos === 1 && booth.strip && booth.float, `photo taken (${JSON.stringify(booth)})`);
  await t.shot('photo');

  // ---- the token bag: $2 on the circle by the counter
  const tokens = await t.ev(() => { Game.s.cash = 20; const P = CFG.ARCADE.TOKEN_PAD; T.tp(P.x, P.y, 'arcade'); const n = T.until(() => Game.s.arcade.tokens > 0, 400); return { n, cash: Game.s.cash, tokens: Game.s.arcade.tokens, hint: T.hint() }; });
  t.expect(tokens.n >= 0, 'the token circle paid out');
  t.expectEq(tokens.cash, 18, 'the token bag cost $2');
  t.expectEq(tokens.tokens, 10, 'ten tokens in the bag');
  // a game drops a token in
  const spent = await t.ev(() => { const S = CFG.ARCADE.CLAW.spot; T.tp(S.x, S.y, 'arcade'); T.act(); return Game.s.arcade.tokens; });
  t.expectEq(spent, 9, 'playing used one token');
  await t.ev(() => T.until(() => !ArcadeExt.st.play, 400));
  t.expectEq(await t.ev(() => Game.s.arcade.prizes), 2, 'second prize won');

  // ---- rescue: pushed into the wall, the chef is put back on the mat
  const rescued = await t.ev(() => { Game.player.x = 1410; Game.player.y = 3200; T.step(3); const E = CFG.ARCADE.EXIT; return { d: Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)), free: ArcadeExt.free(Game, Game.player.x, Game.player.y) }; });
  t.expect(rescued.d < 1 && rescued.free, `rescued onto the mat (${JSON.stringify(rescued)})`);
  // the walls hold: walking into the top row of machines stops the chef
  const wall = await t.ev(() => { T.tp(1620, 3140, 'arcade'); T.steer(0, -1); T.step(60); T.unsteer(); return Game.player.y; });
  t.expect(wall >= 3112 - 0.5, `the machines are solid (y ${wall})`);

  // ---- phone-size
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const S = CFG.ARCADE.CLAW.spot; T.tp(S.x - 40, S.y + 30, 'arcade'); T.step(2); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => Render.resize());

  // ---- back outside, at the door
  await t.ev(() => { const E = CFG.ARCADE.EXIT; T.tp(E.x, E.y, 'arcade'); });
  t.expectEq(await t.ev(() => T.hint()), 'Press the button to go outside 🚪', 'exit hint on the mat');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back in the City');
  t.expect(await t.ev(() => { const D = CFG.ARCADE.DOOR; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 1; }), 'standing at the arcade door');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door button is right there again');

  // ---- Take-me-home from inside, mid-game (a launched pinball ball in play)
  await t.ev(() => { T.act(); T.step(2); const S = CFG.ARCADE.PINBALL.spot; T.tp(S.x, S.y, 'arcade'); T.act(); T.step(2); T.act(); T.step(10); });
  t.expect(await t.ev(() => TG.G() && TG.G().at === 'play'), 'a pinball game is on before Take-me-home');
  await t.ev(() => { Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'home after Take-me-home');
  t.expect(await t.ev(() => !ArcadeExt.st.play && ArcadeExt.st.fade === 0 && !ArcadeExt.st.dance.on && T.label() !== '⚡ Flip!'), 'Take-me-home ended the game and cleared the arcade state');
  t.expectEq(await t.ev(() => T.toasts.filter((m) => m === '🕹️ Welcome to the Arcade!').length), 1, 'the welcome toast showed only once');

  // ---- a save inside the arcade loads back inside, on the floor, with the best scores kept
  await t.ev(() => { const S = CFG.ARCADE.BOOTH.spot; T.tp(S.x, S.y, 'arcade'); Game.save(); });
  await t.reload();
  const back = await t.ev(() => ({ area: Game.area, free: ArcadeExt.free(Game, Game.player.x, Game.player.y), prizes: Game.s.arcade.prizes, tokens: Game.s.arcade.tokens, best: Game.s.arcade.best }));
  t.expect(back.area === 'arcade' && back.free, `reloaded inside the arcade on the floor (${JSON.stringify(back)})`);
  t.expectEq(back.prizes, 2, 'prizes survived the reload');
  t.expectEq(back.tokens, 8, 'tokens survived the reload (the pinball game before Take-me-home used one)');
  t.expect(back.best && back.best.pinball > 0 && back.best.invaders > 0, 'best scores survived the reload');
};
