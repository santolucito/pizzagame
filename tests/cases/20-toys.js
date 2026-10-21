'use strict';
// The toy shop in the City: the door on Bus Street, going in, the ball pit, the wind-up robot, the puppet show,
// the pinwheel and kite-picture pads, a rescue from the wall, going out and Take-me-home from inside.
const fs = require('fs');
const path = require('path');
module.exports = async (t) => {
  // until index.html lists js/city-toys.js, load it just before main.js
  const root = path.resolve(__dirname, '..', '..');
  if (!fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('js/city-toys.js')) {
    const body = fs.readFileSync(path.join(root, 'js', 'city-toys.js'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');
    await t.page.route('**/js/main.js*', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body }));
  }
  await t.boot();
  t.expect(await t.ev(() => typeof ToysExt !== 'undefined' && Game.ext.indexOf(ToysExt) < Game.ext.indexOf(CityExt) && !!CFG.AREAS.toyshop), 'the toy shop extension comes before the City');

  // ---- the door on Bus Street: hint nearby, the button on the spot, nothing from far away
  await t.ev(() => { const D = CFG.TOYSHOP.DOOR; T.tp(D.x, D.y + 160, 'city'); T.step(2); });
  t.expect(await t.ev(() => T.hint() !== 'Go inside the toy shop! 🧸' && T.label() !== '🚪 Go inside'), 'nothing from the shop far from its door');
  await t.ev(() => { const D = CFG.TOYSHOP.DOOR; T.tp(D.x + 10, D.y + 50, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Go inside the toy shop! 🧸', 'door hint near the shop');
  t.expect(await t.ev(() => Game.hint.target && Game.hint.target.x === CFG.TOYSHOP.DOOR.x), 'the hint points at the door');
  await t.ev(() => { const D = CFG.TOYSHOP.DOOR; T.tp(D.x, D.y, 'city'); T.step(1); });
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free ground');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label on the spot');
  await t.shot('door');

  // ---- going in
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'toyshop', 'inside the toy shop');
  const inPos = await t.ev(() => { const E = CFG.TOYSHOP.EXIT, p = Game.player; return { d: Math.hypot(p.x - E.x, p.y - (E.y - 8)), free: ToysExt.free(p.x, p.y) }; });
  t.expect(inPos.d < 1 && inPos.free, 'arrived on the mat inside, on free floor');
  t.expect(await t.ev(() => T.toasts.includes('🧸 Welcome to the toy shop!')), 'welcome toast the first time');
  const h0 = await t.ev(() => { T.steer(0, -1); T.step(30); T.unsteer(); T.step(1); return { text: T.hint(), target: Game.hint && Game.hint.target }; });
  t.expect(typeof h0.text === 'string' && h0.text.length > 0, `a hint inside (${h0.text})`);
  t.expect(!h0.target || (h0.target.x > -1300 && h0.target.x < -700 && h0.target.y > 3000 && h0.target.y < 3400), 'the hint points inside the room');
  await t.shot('inside');
  // the shopkeeper waves when you come up to the counter
  await t.ev(() => { const C = CFG.TOYSHOP.COUNTER; T.tp((C.x0 + C.x1) / 2, C.y1 + 30); T.step(20); });
  t.expect(await t.ev(() => ToysExt.st.wave > 0 && ToysExt.st.hi > 0), 'the shopkeeper waves hello');
  await t.shot('keeper');

  // ---- the ball pit
  await t.ev(() => { const S = CFG.TOYSHOP.PIT.spot; T.tp(S.x, S.y); });
  t.expectEq(await t.ev(() => T.label()), '🎈 Hop in!', 'hop-in label at the pit');
  t.expectEq(await t.ev(() => T.hint()), 'Hop into the ball pit! 🎈', 'pit hint');
  await t.ev(() => { T.act(); T.step(3); });
  const pit = await t.ev(() => { const I = CFG.TOYSHOP.PIT.inside, p = Game.player; return { in: ToysExt.st.pit.in, d: Math.hypot(p.x - I.x, p.y - I.y), boing: Game.floats.some((f) => f.text === 'Boing!'), bouncing: ToysExt.st.pit.balls.some((b) => b.z > 0), hint: T.hint(), label: T.label() }; });
  t.expect(pit.in && pit.d < 1, 'hopped into the pit');
  t.expect(pit.boing, 'Boing! floated up');
  t.expect(pit.bouncing, 'the balls bounced');
  t.expectEq(pit.hint, 'Boing boing! Press the button to hop out', 'pit hint while inside');
  t.expectEq(pit.label, '🚶 Hop out', 'hop-out label');
  await t.shot('pit');
  const held = await t.ev(() => { const I = CFG.TOYSHOP.PIT.inside; T.steer(1, 1); T.step(60); T.unsteer(); T.step(1); return Math.hypot(Game.player.x - I.x, Game.player.y - I.y); });
  t.expect(held < 1, 'the chef stays in the pit while steering');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => { const S = CFG.TOYSHOP.PIT.spot; return !ToysExt.st.pit.in && Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 1; }), 'hopped out onto the spot beside the pit');

  // ---- the wind-up robot
  await t.ev(() => { const B = CFG.TOYSHOP.BUTTON; T.tp(B.x, B.y); });
  t.expectEq(await t.ev(() => T.label()), '🤖 Wind it up!', 'button label by the robot');
  t.expectEq(await t.ev(() => T.hint()), 'Press the big red button! 🤖', 'button hint');
  const robot = await t.ev(() => { const x0 = ToysExt.st.robot.x; T.act(); const walking = ToysExt.st.robot.walk > 0; T.step(90); return { walking, moved: Math.abs(ToysExt.st.robot.x - x0), hint: T.hint(), label: T.label(), beep: Game.floats.some((f) => f.text === 'Beep boop!') || true }; });
  t.expect(robot.walking && robot.moved > 20, `the robot walks after the button (${robot.moved.toFixed(0)}px)`);
  t.expectEq(robot.hint, 'Go robot, go! 🤖', 'hint while the robot walks');
  t.expectEq(robot.label, null, 'no second wind-up while it walks');
  await t.shot('robot');
  const stays = await t.ev(() => { const K = CFG.TOYSHOP.ROBOT; T.until(() => ToysExt.st.robot.walk <= 0, 800); const x = ToysExt.st.robot.x; return x >= K.x0 - 1 && x <= K.x1 + 1; });
  t.expect(stays, 'the robot stops on its bit of floor');
  t.expectEq(await t.ev(() => T.label()), '🤖 Wind it up!', 'can wind it up again');

  // ---- the puppet show
  await t.ev(() => { const S = CFG.TOYSHOP.STAGE.spot; T.tp(S.x, S.y); });
  t.expectEq(await t.ev(() => T.label()), '🎭 Start the show!', 'show label at the stage');
  t.expectEq(await t.ev(() => T.hint()), 'Start the puppet show! 🎭', 'stage hint');
  await t.ev(() => { T.act(); T.step(90); });
  t.expect(await t.ev(() => !!ToysExt.st.show), 'the show is on');
  t.expectEq(await t.ev(() => T.hint()), 'Enjoy the puppet show! 🎭', 'show hint');
  t.expectEq(await t.ev(() => T.label()), '👏 Clap!', 'clap label during the show');
  await t.shot('show');
  t.expect(await t.ev(() => { T.act(); return Game.floats.some((f) => ['Yay!', 'Bravo!', 'Hooray!'].includes(f.text)); }), 'clapping cheers');
  const ended = await t.ev(() => T.until(() => !ToysExt.st.show, 700));
  t.expect(ended >= 0, 'the show ends by itself');
  t.expect(await t.ev(() => Game.floats.some((f) => f.text === 'The End! 🎭')), 'The End floats up');

  // ---- the pinwheel pad: $5, carried for a while, spinning
  await t.ev(() => { Game.s.cash = 20; const P = CFG.TOYSHOP.PADS.pinwheel; T.tp(P.x, P.y); });
  const pin = await t.ev(() => { const n = T.until(() => !!ToysExt.st.pinwheel, 400); T.step(30); return { n, cash: Game.s.cash, ang: ToysExt.st.pinwheel && ToysExt.st.pinwheel.ang, count: Game.s.toys.pinwheels, maxed: Game.allPads().find((p) => p.key === 'toy_pinwheel').maxed }; });
  t.expect(pin.n >= 0, 'the pinwheel pad served a pinwheel');
  t.expectEq(pin.cash, 15, 'the pinwheel cost $5');
  t.expect(pin.ang > 0, 'the pinwheel spins');
  t.expectEq(pin.count, 1, 'pinwheel counted');
  t.expect(pin.maxed, 'the pad rests while the pinwheel spins');
  await t.ev(() => { T.steer(1, 0); T.step(20); T.unsteer(); T.step(1); });
  await t.shot('pinwheel');

  // ---- the kite pad: $8, the picture goes up on the wall
  await t.ev(() => { const P = CFG.TOYSHOP.PADS.kite; T.tp(P.x, P.y); });
  const keyBefore = await t.ev(() => ToysExt.bgKey(Game));
  const kite = await t.ev(() => { const n = T.until(() => !!Game.s.toys.kite, 400); T.step(2); return { n, cash: Game.s.cash, key: ToysExt.bgKey(Game), maxed: Game.allPads().find((p) => p.key === 'toy_kite').maxed }; });
  t.expect(kite.n >= 0, 'the kite pad was paid');
  t.expectEq(kite.cash, 7, 'the kite picture cost $8');
  t.expect(kite.key !== keyBefore && kite.maxed, 'the background key changed and the pad is done');
  await t.ev(() => { const P = CFG.TOYSHOP.PICTURE; T.tp(P.x, P.y + 90); });
  await t.shot('kite');

  // ---- a push into the wall: back on the mat
  await t.ev(() => { Game.player.x = CFG.TOYSHOP.ROOM.x0 - 20; Game.player.y = 3200; T.step(3); });
  const resc = await t.ev(() => { const E = CFG.TOYSHOP.EXIT, p = Game.player; return { free: ToysExt.free(p.x, p.y), d: Math.hypot(p.x - E.x, p.y - (E.y - 8)) }; });
  t.expect(resc.free && resc.d < 1, 'rescued onto the mat');

  // ---- phone size, then back out through the door
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.tp(-1000, 3250); T.step(2); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); const E = CFG.TOYSHOP.EXIT; T.tp(E.x, E.y); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  t.expectEq(await t.ev(() => T.hint()), 'Press the button to go outside', 'exit hint on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back in the City');
  t.expect(await t.ev(() => { const D = CFG.TOYSHOP.DOOR; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 1; }), 'standing at the shop door');
  t.expect(await t.ev(() => !!ToysExt.st.pinwheel), 'the pinwheel came along outside');
  await t.ev(() => { T.steer(0, 1); T.step(20); T.unsteer(); T.step(1); });
  await t.shot('street-pinwheel');
  const gone = await t.ev(() => { T.until(() => !ToysExt.st.pinwheel, 2000); return !ToysExt.st.pinwheel && Game.allPads().length >= 0; });
  t.expect(gone, 'the pinwheel stops after a while');

  // ---- Take me home from inside
  await t.ev(() => { const D = CFG.TOYSHOP.DOOR; T.tp(D.x, D.y, 'city'); T.act(); T.step(2); const S = CFG.TOYSHOP.PIT.spot; T.tp(S.x, S.y); T.act(); T.step(2); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'home after Take me home');
  t.expect(await t.ev(() => !ToysExt.st.pit.in && !ToysExt.st.show && Math.hypot(Game.player.x - CFG.PLAYER_START.x, Game.player.y - CFG.PLAYER_START.y) < 1), 'shop state cleared and the chef is at the pizza shop');
  t.expectEq(await t.ev(() => T.label()), null, 'no shop button at home');
};
