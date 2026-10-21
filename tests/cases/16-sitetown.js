'use strict';
// The rest of Construction Town: the new streets east and south of the site block are walkable without traps, the
// concrete mixers at the factory can be driven (and pour puddles), the hardware store's door, interior, every
// interaction, rescue, Take-me-home and the way back out, the diner's picnic table and milkshake, and the slide.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/sitetown.js into index.html, load it into the booted page
  if (await t.ev(() => typeof SiteTownExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/sitetown.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof SiteTownExt !== 'undefined' && !!CFG.AREAS.hardware && !!CFG.VEHICLES.mixer), 'the extension, its map and the mixer spec are registered');
  t.expect(await t.ev(() => Game.ext.indexOf(SiteTownExt) < Game.ext.indexOf(CityExt)), 'Construction Town answers before the City');
  t.expect(await t.ev(() => { const W = CFG.SITETOWN.WORLD; return W.x0 === 4000 && W.y0 === 4000 && W.x1 === 4600 && W.y1 === 4400; }), 'the store interior sits in its reserved rectangle');
  t.expect(await t.ev(() => { const W = CFG.SITE.WORLD; return W.x1 === 4500 && W.y1 === 1300; }), 'the site map was widened');

  // ---- arrive at the site: the new strips are walkable without traps (stuck-detector style)
  const walk = await t.ev(() => {
    T.tp(4050, 300, 'site');
    const hit = (x, y) => Game.obstacles().some((o) => Game.hitRect(x, y, 12, o));
    const stuck = [], flung = []; let sampled = 0, solid = 0;
    const rects = [CFG.SITETOWN.EAST, CFG.SITETOWN.SOUTH];
    for (const R of rects) for (let y = R.y0 + 30; y < R.y1 - 30; y += 40) for (let x = R.x0 + 30; x < R.x1 - 30; x += 40) {
      if (hit(x, y)) { solid++; continue; }
      sampled++;
      let best = 0, worst = 0;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        T.tp(x, y, 'site'); SiteTownExt.st.slide = null; SiteTownExt.st.seat = null;
        T.steer(ax, ay); T.step(9); T.unsteer();
        const d = Math.hypot(Game.player.x - x, Game.player.y - y); best = Math.max(best, d); worst = Math.max(worst, d);
      }
      if (best < 2) stuck.push([x, y]);
      if (worst > 70) flung.push([x, y, Math.round(worst)]);
    }
    SiteTownExt.st.slide = null;
    return { sampled, solid, stuck, flung };
  });
  t.expect(walk.sampled > 200 && walk.solid > 20, `sampled the new streets (${walk.sampled} walkable, ${walk.solid} solid)`);
  t.expectEq(walk.stuck.length, 0, `no stuck spots in the new districts: ${JSON.stringify(walk.stuck.slice(0, 8))}`);
  t.expectEq(walk.flung.length, 0, `no spots that fling the chef: ${JSON.stringify(walk.flung.slice(0, 8))}`);
  // the old site block, the station and the train are untouched by the new obstacles
  const siteBlock = await t.ev(() => { const core = new Set(Game.siteObstacles().map((o) => JSON.stringify(o))); return Game.obstacles().filter((o) => o.x + o.w > 2600 && o.x < 3984 && o.y + o.h > -170 && o.y < 900 && !core.has(JSON.stringify(o))).length; });
  t.expectEq(siteBlock, 0, 'no new obstacle inside the site block');
  const sitePos = await t.ev(() => { const S = CFG.SITE.STATION; T.tp(S.stopX + S.boardDx, S.platform.y1 - 12, 'site'); Game.siteTrain.summon(); T.until(() => Game.siteTrain.state === 'stopped', 1500); T.step(2); return T.label(); });
  t.expectEq(sitePos, '🚂 Ride the train', 'the train still stops at the site platform');
  await t.ev(() => { Game.siteTrain.state = 'away'; Game.siteTrain.x = CFG.SITE.WORLD.x0 - 500; });
  // the hint stays quiet out on the new streets, away from the things
  t.expectEq(await t.ev(() => { T.tp(4056, 600, 'site'); return SiteTownExt.hint(Game); }), undefined, 'no hint out on Site Road');

  // ---- the concrete mixers: hop in, drive, pour, hop out
  const mix = await t.ev(() => {
    const m = SiteTownExt.mixers[0]; T.tp(m.x, m.y + 50, 'site'); T.step(2);
    const hint = SiteTownExt.hint(Game);
    Game.enterCar(); T.step(1);
    return { hint: hint && hint.text, kind: Game.vehicle && Game.vehicle.kind, driving: Game.driving, same: Game.vehicle === m, exit: CFG.VEHICLES[Game.vehicle.kind].exit, label: CFG.VEHICLES.mixer.label, n: SiteTownExt.vehicles(Game).length, inList: Game.vehicles().includes(m) };
  });
  t.expectEq(mix.hint, 'Drive the concrete mixer! 🚛', 'mixer hint by the parked mixers');
  t.expect(mix.n === 2 && mix.inList, 'two mixers listed among the vehicles');
  t.expect(mix.driving && mix.kind === 'mixer' && mix.same, 'climbed into the first mixer');
  t.expectEq(mix.exit, '🚶 Hop out', 'hop-out label from the mixer spec');
  t.expectEq(mix.label, '🚛 Drive the mixer', 'drive label from the mixer spec');
  await t.wait(150);
  t.expectEq(await t.ev(() => document.getElementById('btn-car').textContent), '🚶 Hop out', 'the vehicle button says Hop out');
  const drove = await t.ev(() => {
    const v = Game.vehicle, x0 = v.x, y0 = v.y, d0 = v.drum;
    T.steer(-1, 0); T.step(120); T.unsteer(); T.step(10);
    return { dx: x0 - v.x, dy: Math.abs(v.y - y0), drum: v.drum - d0, x: Math.round(v.x), y: Math.round(v.y), hint: SiteTownExt.hint(Game).text, label: T.label() };
  });
  t.expect(drove.dx > 150, `drove the mixer west out of the yard (${drove.dx.toFixed(0)} px to ${drove.x},${drove.y})`);
  t.expect(drove.drum > 3, 'the drum turned while driving');
  t.expectEq(drove.label, '🪣 Pour!', 'pour button while driving the mixer');
  t.expectEq(drove.hint, 'Press the big button to pour concrete! 🪣', 'pour hint while driving the mixer');
  const pour = await t.ev(() => { T.act(); T.step(5); return { puddles: SiteTownExt.st.puddles.length, floats: Game.floats.map((f) => f.text), pours: Game.s.sitetown.pours, pourT: SiteTownExt.st.pourT }; });
  t.expectEq(pour.puddles, 1, 'a puddle on the ground');
  t.expect(pour.floats.includes('Splosh!'), 'the Splosh float');
  t.expectEq(pour.pours, 1, 'pour counted');
  t.expect(pour.pourT > 0, 'the drum spins fast after a pour');
  await t.ev(() => { Render.setZoom(1.2); Game.cameraSnap = true; T.step(2); });
  await t.shot('mixer');
  const puddleLife = await t.ev(() => { T.step(60 * 21); return SiteTownExt.st.puddles.length; });
  t.expectEq(puddleLife, 0, 'the puddle is gone after 20 s');
  const out = await t.ev(() => { const v = Game.vehicle; Game.exitCar(); T.step(5); const p = Game.player; return { driving: Game.driving, d: Math.hypot(p.x - v.x, p.y - v.y), free: !Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o)), vx: v.vx, vy: v.vy }; });
  t.expect(!out.driving && out.d < 60 && out.free, `hopped out beside the mixer on free ground (${JSON.stringify(out)})`);
  t.expect(await t.ev(() => { const m = SiteTownExt.mixers[1], M = CFG.SITETOWN.MIXERS[1]; return m.x === M.x && m.y === M.y; }), 'the second mixer stays parked');
  // the site vehicles can drive the dirt track loop: nothing solid on it
  const track = await t.ev(() => { const Tk = CFG.SITETOWN.TRACK, obs = Game.townObstacles(true); let bad = 0; for (let a = 0; a < Math.PI * 2; a += 0.2) { const rr = (Tk.rx + Tk.rxi) / 2, x = Tk.x + Math.cos(a) * rr, y = Tk.y + Math.sin(a) * rr * Tk.ry / Tk.rx; if (obs.some((o) => Game.hitRect(x, y, 22, o))) bad++; } return bad; });
  t.expectEq(track, 0, 'the dirt track loop is clear for vehicles');

  // ---- the hardware store: door spot, hint, go in
  const door = await t.ev(() => {
    const D = CFG.SITETOWN.DOOR_OUT, blocked = Game.obstacles().some((o) => Game.hitRect(D.x, D.y, 12, o));
    let moved = 0; for (const [ax, ay] of [[-1, 0], [1, 0], [0, 1]]) { T.tp(D.x, D.y, 'site'); T.steer(ax, ay); T.step(8); T.unsteer(); moved = Math.max(moved, Math.hypot(Game.player.x - D.x, Game.player.y - D.y)); }
    T.tp(D.x - 50, D.y + 10, 'site'); T.step(2); const far = SiteTownExt.hint(Game);
    T.tp(D.x, D.y, 'site'); T.step(2);
    return { blocked, moved, far: far && far.text, farTarget: far && far.target && far.target.x === D.x, label: T.label(), near: SiteTownExt.hint(Game).text, nearTarget: SiteTownExt.hint(Game).target };
  });
  t.expect(!door.blocked && door.moved > 20, 'the door spot is free and the chef can walk away from it');
  t.expect(door.far === 'Go into the hardware store! 🔧' && door.farTarget, 'the door hint points at the door spot from nearby');
  t.expectEq(door.label, '🚪 Go inside', 'door label at the door spot');
  t.expect(door.near === 'Go into the hardware store! 🔧' && door.nearTarget === null, 'door hint at the spot points nowhere');
  await t.shot('store-door');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'hardware', 'inside the hardware store');
  t.expect(await t.ev(() => T.toasts.includes('🔧 Welcome to the hardware store!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.SITETOWN.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2 && SiteTownExt.free(Game.player.x, Game.player.y); }), 'arrived on the mat inside the door, on free floor');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  t.expectEq(await t.ev(() => T.hint()), 'Hammer the nail into the board! 🔨', 'the first hint inside points at the nail');
  t.expect(await t.ev(() => { const h = Game.hint, s = CFG.SITETOWN.NAIL_SPOT; return !!h.target && h.target.x === s.x && h.target.y === s.y; }), 'the hint points at the nail spot');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('store-inside');
  const spots = await t.ev(() => { const S = CFG.SITETOWN; return [S.KEY_SPOT, S.MIX_SPOT, S.NAIL_SPOT, S.PADS.toolbox, S.PADS.hardhat, S.EXIT, { x: S.EXIT.x, y: S.EXIT.y - 8 }].map((s) => SiteTownExt.free(s.x, s.y)); });
  t.expect(spots.every(Boolean), `every spot inside is free floor (${JSON.stringify(spots)})`);
  // no traps inside
  const inside = await t.ev(() => {
    const R = CFG.SITETOWN.ROOM, hit = (x, y) => Game.obstacles().some((o) => Game.hitRect(x, y, 12, o)), stuck = []; let sampled = 0;
    for (let y = R.y0 + 14; y < R.y1 - 12; y += 24) for (let x = R.x0 + 14; x < R.x1 - 12; x += 24) {
      if (hit(x, y)) continue; sampled++; let best = 0;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { T.tp(x, y, 'hardware'); T.steer(ax, ay); T.step(9); T.unsteer(); best = Math.max(best, Math.hypot(Game.player.x - x, Game.player.y - y)); }
      if (best < 2) stuck.push([x, y]);
    }
    return { sampled, stuck };
  });
  t.expect(inside.sampled > 60 && inside.stuck.length === 0, `no stuck spots in the store (${inside.sampled} sampled, stuck ${JSON.stringify(inside.stuck)})`);

  // ---- hammer the nail: three whacks
  await t.ev(() => { const s = CFG.SITETOWN.NAIL_SPOT; T.tp(s.x, s.y, 'hardware'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🔨 Whack the nail!', 'whack label at the bench');
  const nail = await t.ev(() => { const out = []; for (let i = 0; i < 3; i++) { T.act(); T.step(3); out.push({ depth: SiteTownExt.st.nail.depth, hint: T.hint() }); } return { out, floats: Game.floats.map((f) => f.text), nails: Game.s.sitetown.nails, label: T.label() }; });
  t.expect(nail.out[0].depth === 1 && nail.out[0].hint === 'Whack it again! 2 to go 🔨', 'first whack: two to go');
  t.expect(nail.out[2].depth === 3 && nail.floats.includes('Nailed it! 🔨'), 'third whack: Nailed it!');
  t.expectEq(nail.nails, 1, 'nail counted');
  await t.shot('store-nail');
  const reset = await t.ev(() => { T.step(60 * 2.5); return SiteTownExt.st.nail.depth; });
  t.expectEq(reset, 0, 'a fresh nail after a moment');

  // ---- cut a key: buzzes, the chef stays put, then a key
  await t.ev(() => { const s = CFG.SITETOWN.KEY_SPOT; T.tp(s.x, s.y, 'hardware'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🔑 Cut a key', 'key label at the machine');
  const key = await t.ev(() => { T.act(); T.step(5); const s = CFG.SITETOWN.KEY_SPOT; T.steer(1, 1); T.step(20); T.unsteer(); const during = { hint: T.hint(), d: Math.hypot(Game.player.x - s.x, Game.player.y - s.y), label: T.label(), sparks: SiteTownExt.st.sparks.length }; T.step(70); return { during, done: !SiteTownExt.st.key, floats: Game.floats.map((f) => f.text), keys: Game.s.sitetown.keys }; });
  t.expect(key.during.hint === 'Bzzzzt! Cutting your key 🔑' && key.during.d < 1 && key.during.label === null && key.during.sparks > 0, `buzzing with sparks while the key is cut (${JSON.stringify(key.during)})`);
  t.expect(key.done && key.floats.includes('A shiny new key! 🔑') && key.keys === 1, 'a new key');

  // ---- shake the paint
  await t.ev(() => { const s = CFG.SITETOWN.MIX_SPOT; T.tp(s.x, s.y, 'hardware'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🎨 Shake the paint', 'shaker label');
  const shake = await t.ev(() => { T.act(); T.step(5); const h = T.hint(); T.step(100); return { h, done: !SiteTownExt.st.mix, floats: Game.floats.map((f) => f.text), mixes: Game.s.sitetown.mixes, sparks: SiteTownExt.st.sparks.length }; });
  t.expect(shake.h === 'Shake shake shake! 🎨' && shake.done && shake.floats.includes('🌈 Splash!') && shake.mixes === 1 && shake.sparks > 0, `the paint shaker rattles and splashes (${JSON.stringify(shake)})`);

  // ---- the toolbox ($4) and the hard hat ($6)
  const buy = await t.ev(() => {
    Game.s.cash = 20; const P = CFG.SITETOWN.PADS;
    T.tp(P.toolbox.x, P.toolbox.y, 'hardware'); const a = T.until(() => SiteTownExt.st.toolbox > 0, 400); const c1 = Game.s.cash;
    T.tp(P.hardhat.x, P.hardhat.y, 'hardware'); const b = T.until(() => SiteTownExt.st.hat > 0, 400);
    return { a, b, c1, cash: Game.s.cash, hint: T.hint(), toolboxes: Game.s.sitetown.toolboxes, hats: Game.s.sitetown.hats };
  });
  t.expect(buy.a >= 0 && buy.c1 === 16, 'the toolbox cost $4');
  t.expect(buy.b >= 0 && buy.cash === 10, 'the hard hat cost $6');
  t.expect(buy.toolboxes === 1 && buy.hats === 1, 'both counted');
  t.expectEq(buy.hint, 'Looking safe! ⛑️', 'hint while wearing the hat');
  await t.shot('store-hat');
  t.expect(await t.ev(() => { T.tp(4300, 4215, 'hardware'); T.step(60 * 31); return SiteTownExt.st.hat === 0 && SiteTownExt.st.toolbox === 0; }), 'the hat and toolbox are put away after 30 s');

  // ---- the shopkeeper waves when you come close
  t.expect(await t.ev(() => { const K = CFG.SITETOWN.KEEPER_HOME; T.tp(K.x, K.y + 60, 'hardware'); T.step(10); return SiteTownExt.st.keeper.wave > 0; }), 'the shopkeeper waves');

  // ---- a push into a wall is rescued onto the mat; Take-me-home from inside
  const rescued = await t.ev(() => { Game.player.x = CFG.SITETOWN.ROOM.x0 - 10; Game.player.y = 4200; T.step(3); const E = CFG.SITETOWN.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; });
  t.expect(rescued, 'pushed into the wall: rescued onto the mat');
  // phone-size store
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.tp(4300, 4220, 'hardware'); T.step(2); });
  await t.shot('store-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(2); Game.goHome(); T.step(2); });
  t.expect(await t.ev(() => Game.area === 'town' && !SiteTownExt.st.key && !SiteTownExt.st.mix), 'Take-me-home from the store lands in town with the store state cleared');
  // back in, then out through the door: standing on the door spot outside
  await t.ev(() => { const D = CFG.SITETOWN.DOOR_OUT; T.tp(D.x, D.y, 'site'); T.act(); T.step(30); const E = CFG.SITETOWN.EXIT; T.tp(E.x, E.y, 'hardware'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => { const D = CFG.SITETOWN.DOOR_OUT; return Game.area === 'site' && Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'back outside on the door spot');

  // ---- the diner: sit at the picnic table, buy a milkshake
  const diner = await t.ev(() => { const S = CFG.SITETOWN.SEAT; T.tp(S.x, S.y - 40, 'site'); T.step(2); const far = SiteTownExt.hint(Game); T.tp(S.x, S.y, 'site'); T.step(1); return { far: far && far.text, label: T.label() }; });
  t.expect(diner.far === 'Buy a milkshake at the diner! 🥤' || diner.far === 'Sit at the picnic table! 🪑', `a diner hint near the table (${diner.far})`);
  t.expectEq(diner.label, '🪑 Sit down', 'sit label at the bench');
  const sat = await t.ev(() => { T.act(); T.step(5); const S = CFG.SITETOWN.SEAT; T.steer(1, 1); T.step(60); T.unsteer(); return { seat: !!SiteTownExt.st.seat, d: Math.hypot(Game.player.x - S.x, Game.player.y - S.y), label: T.label(), hint: SiteTownExt.hint(Game).text, sits: Game.s.sitetown.sits }; });
  t.expect(sat.seat && sat.d < 1 && sat.sits === 1, 'seated on the bench and staying there');
  t.expectEq(sat.label, '🚶 Stand up', 'stand-up label while seated');
  t.expectEq(sat.hint, 'Enjoy the sunshine! Press the button to stand up', 'seated hint');
  await t.ev(() => { Render.setZoom(1.1); Game.cameraSnap = true; T.step(2); });
  await t.shot('diner');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !SiteTownExt.st.seat), 'stood up');
  const shakeBuy = await t.ev(() => { Game.s.cash = 10; const P = CFG.SITETOWN.PADS.shake; T.tp(P.x, P.y, 'site'); const n = T.until(() => SiteTownExt.st.shake > 0, 400); return { n, cash: Game.s.cash, shakes: Game.s.sitetown.shakes }; });
  t.expect(shakeBuy.n >= 0 && shakeBuy.cash === 7 && shakeBuy.shakes === 1, 'a $3 milkshake');

  // ---- the slide: walk onto the ladder, whoosh to the bottom
  const slide = await t.ev(() => {
    const SL = CFG.SITETOWN.SLIDE, s0 = Game.s.sitetown.slides; T.tp(SL.top.x, SL.top.y - 40, 'site'); T.step(2); const far = SiteTownExt.hint(Game);
    T.steer(0, 1); const n = T.until(() => !!SiteTownExt.st.slide, 120); T.unsteer();
    const during = SiteTownExt.hint(Game); T.step(70);
    return { far: far && far.text, n, during: during && during.text, y: Game.player.y, bottom: SL.bottom.y, done: !SiteTownExt.st.slide, floats: Game.floats.map((f) => f.text), slides: Game.s.sitetown.slides - s0 };
  });
  t.expectEq(slide.far, 'Climb the slide! 🛝', 'slide hint by the ladder');
  t.expect(slide.n >= 0 && slide.during === 'Wheee! 🛝', 'walked onto the ladder and started sliding');
  t.expect(slide.done && slide.y > slide.bottom && slide.slides === 1, `landed past the bottom of the slide (y ${Math.round(slide.y)})`);
  t.expect(slide.floats.includes('Wheee!'), 'the Wheee float');

  // ---- the dog barks when you pass its garden
  const dog = await t.ev(() => { const D = CFG.SITETOWN.DOG; T.tp(D.home.x, D.y1 + 30, 'site'); T.step(20); return Game.floats.some((f) => /Woof|Arf/.test(f.text)); });
  t.expect(dog, 'the dog barks');

  // ---- screenshots of each district, desktop and phone
  await t.ev(() => { Render.setZoom(0.45); T.tp(4250, 420, 'site'); T.step(2); });
  await t.shot('east-north');
  await t.ev(() => { T.tp(4250, 850, 'site'); T.step(2); });
  await t.shot('east-park');
  await t.ev(() => { T.tp(4300, 1150, 'site'); T.step(2); });
  await t.shot('factory');
  await t.ev(() => { T.tp(3650, 1150, 'site'); T.step(2); });
  await t.shot('south-diner');
  await t.ev(() => { T.tp(2950, 1150, 'site'); T.step(2); });
  await t.shot('south-track');
  await t.ev(() => { Render.setZoom(0.22); T.tp(3550, 600, 'site'); T.step(2); });
  await t.shot('whole-town');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); Render.setZoom(1); T.tp(4300, 1180, 'site'); T.step(2); });
  await t.shot('factory-phone');
  await t.ev(() => { T.tp(4285, 430, 'site'); T.step(2); });
  await t.shot('store-door-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); Render.setZoom(1); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'home again');
};
