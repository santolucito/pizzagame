'use strict';
// The Aquarium in the City, the big one: the door on Harbour Street (label, hint, in and out), a much larger map of its
// own (every gallery reachable on foot from the door, through wide archways), the physical feeding flow on two tanks
// (take a tub of food from a station, carry it, drop it in at the glowing ring, the flakes fall, the fish rush over and
// gobble them up), swimming in the lagoon (goggles on, swim about, the fish swirl away, no leaving the water except at
// the steps, climb out and drip), the penguin habitat (in through the gate, penguins follow, nuzzle and slide, feed one
// a fish, out again), the octopus, the touch pool, the gift circles, the Pizza Coin in the tunnel, rescues and
// Take-me-home from every state, a reload, and screenshots of each part at 1100×720 and 390×844.
// page helpers: T.walkTo walks towards a spot with the joystick (sliding along walls), up to n steps, and returns the
// distance left; T.shotAt puts the chef somewhere for a screenshot
const addHelpers = (t) => t.ev(() => {
  T.walkTo = (x, y, n = 600, near = 6) => {
    for (let i = 0; i < n; i++) {
      const p = Game.player, dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy);
      if (d < near) break;
      T.steer(dx / d, dy / d); T.step(1);
    }
    T.unsteer(); T.step(1);
    return Math.hypot(x - Game.player.x, y - Game.player.y);
  };
  T.shotAt = (x, y) => { T.tp(x, y, 'aquarium'); T.step(2); };
});
module.exports = async (t) => {
  await t.boot();
  if (await t.ev(() => typeof AquariumExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-aquarium.js' }); await t.ev(() => T.step(2)); }
  await addHelpers(t);
  t.expect(await t.ev(() => typeof AquariumExt !== 'undefined' && !!CFG.AREAS.aquarium), 'the aquarium extension and its map are registered');
  t.expect(await t.ev(() => Game.ext.indexOf(AquariumExt) < Game.ext.indexOf(CityExt)), 'the aquarium answers before the City');

  // ---- the map: much bigger, in the free region, clear of every other map
  const map = await t.ev(() => {
    const W = CFG.AQUARIUM.WORLD, area = (W.x1 - W.x0) * (W.y1 - W.y0);
    const inRegion = W.x0 >= 20000 && W.x1 <= 23000 && W.y0 >= 5000 && W.y1 <= 7000;
    const clash = Object.entries(CFG.AREAS).filter(([k, a]) => k !== 'aquarium' && a.WORLD && a.WORLD.x0 < W.x1 + 500 && W.x0 < a.WORLD.x1 + 500 && a.WORLD.y0 < W.y1 + 500 && W.y0 < a.WORLD.y1 + 500).map(([k]) => k);
    return { area, inRegion, clash, W };
  });
  t.expect(map.inRegion, `the map sits in the free region x 20000..23000 × y 5000..7000 (${JSON.stringify(map.W)})`);
  t.expect(map.area >= 4 * 600 * 400, `the map is at least four times the old one (${map.area} px²)`);
  t.expectEq(map.clash.join(','), '', 'no other map within 500 px');
  t.expectEq(await t.ev(() => CFG.AQUARIUM.BUILDING === 18 && CFG.AQUARIUM.DOOR_OUT.x === 5701 && CFG.AQUARIUM.DOOR_OUT.y === 890), true, 'the City door stays where it was');

  // ---- the door on Harbour Street
  await t.ev(() => { const D = CFG.AQUARIUM.DOOR_OUT; T.tp(D.x + 50, D.y, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Visit the aquarium! 🐠', 'aquarium hint near the door');
  t.expect(await t.ev(() => { const D = CFG.AQUARIUM.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  t.expectEq(await t.ev(() => { const D = CFG.AQUARIUM.DOOR_OUT; T.tp(D.x, D.y + 90, 'city'); T.step(2); return AquariumExt.hint(Game); }), undefined, 'no aquarium hint further than 70 px from the door');
  await t.ev(() => { Render.setZoom(1.2); const D = CFG.AQUARIUM.DOOR_OUT; T.tp(D.x, D.y, 'city'); T.step(2); });
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  await t.shot('door');
  await t.ev(() => { T.act(); T.step(30); Render.setZoom(1); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'aquarium', 'inside the aquarium');
  t.expect(await t.ev(() => T.toasts.includes('🐠 Welcome to the Aquarium!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.AQUARIUM.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 16)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => AquariumExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Feed the fish, swim, or visit the penguins! 🐟🐧', 'the welcome hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, S = CFG.AQUARIUM.STATIONS[0]; return !!h.target && h.target.x === S.x && Math.abs(h.target.y - S.y) < 40; }), 'the hint points at the nearest fish-food station');
  await t.shot('inside');

  // ---- every part can be reached on foot from the door (a grid walk with the chef's size)
  const reach = await t.ev(() => {
    const A = CFG.AQUARIUM, R = A.ROOM, obs = Game.obstacles(), step = 12, r = 12;
    const ok = (x, y) => x > R.x0 + r && x < R.x1 - r && y > R.y0 + r && y < R.y1 - r && !obs.some((o) => Game.hitRect(x, y, r, o));
    const key = (i, j) => i + ',' + j, seen = new Set(), q = [];
    const i0 = Math.round((A.EXIT.x - R.x0) / step), j0 = Math.round((A.EXIT.y - 16 - R.y0) / step);
    seen.add(key(i0, j0)); q.push([i0, j0]);
    while (q.length) { const [i, j] = q.shift(); for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj, k = key(a, b); if (seen.has(k)) continue; if (!ok(R.x0 + a * step, R.y0 + b * step)) continue; seen.add(k); q.push([a, b]); } }
    const can = (x, y) => { for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const i = Math.round((x - R.x0) / step) + a, j = Math.round((y - R.y0) / step) + b; if (seen.has(key(i, j)) && Math.hypot(R.x0 + i * step - x, R.y0 + j * step - y) < 26) return true; } return false; };
    const spots = {
      exit: A.EXIT, reefStation: { x: A.STATIONS[0].x, y: A.STATIONS[0].y + 26 }, oceanStation: { x: A.STATIONS[1].x, y: A.STATIONS[1].y + 26 },
      reefFeed: A.TANKS[1].feed, sharkFeed: A.TANKS[2].feed, octo: { x: 20317, y: 5440 }, horse: { x: 21470, y: 5440 }, tunnel: { x: 20920, y: 5620 }, coin: A.COIN,
      touchPool: { x: A.POOL.x, y: A.POOL.y + A.POOL.ry + 16 }, plush: A.PADS.plush, shell: A.PADS.shell, steps: A.STEP_OUT, gate: A.GATE_OUT,
      swimHallNE: { x: 22000, y: 5940 }, lobbyNW: { x: 20300, y: 5860 }, reefNE: { x: 20760, y: 5760 }, oceanSW: { x: 21080, y: 5760 },
    };
    const missing = Object.entries(spots).filter(([, s]) => !can(s.x, s.y)).map(([k]) => k);
    return { cells: seen.size, missing };
  });
  t.expectEq(reach.missing.join(','), '', `every part reachable on foot from the door (${reach.cells} cells)`);
  t.expect(reach.cells > 3000, `lots of room to walk (${reach.cells} cells of 12 px)`);
  t.expect(await t.ev(() => { const A = CFG.AQUARIUM; return A.PART_H.gaps.every(([a, b]) => b - a >= 200) && A.PART_V.gap[1] - A.PART_V.gap[0] >= 200 && A.TUNNEL.y1 - A.TUNNEL.y0 >= 100; }), 'the archways and the tunnel are wide');

  // ---- the fish tunnel: walk in from the reef hall, fish swim overhead, and the Pizza Coin is in there
  const tunnel = await t.ev(() => {
    const T2 = CFG.AQUARIUM.TUNNEL; T.tp(T2.x0 - 60, (T2.y0 + T2.y1) / 2, 'aquarium'); T.steer(1, 0); T.step(30); T.unsteer();
    return { inside: AquariumExt.inTunnel(Game.player.x, Game.player.y), flag: Game.s.aquarium.tunnel, hint: T.hint(), fish: AquariumExt.st.life.filter((f) => f.tank === CFG.AQUARIUM.TUNNEL_TANK).length, floats: Game.floats.map((f) => f.text) };
  });
  t.expect(tunnel.inside, 'walked into the tunnel');
  t.expect(tunnel.flag, 'the tunnel counts as seen');
  t.expectEq(tunnel.hint, 'Look up! Fish are swimming over you 🐟', 'tunnel hint while inside it');
  t.expect(tunnel.fish >= 8, 'fish swim in the tunnel tank');
  t.expect(tunnel.floats.includes('Fish overhead! 🐟'), 'the tunnel float');
  await t.shot('tunnel');
  t.expect(await t.ev(() => { T.steer(0, -1); T.step(40); T.steer(0, 1); T.step(80); T.unsteer(); return AquariumExt.inTunnel(Game.player.x, Game.player.y); }), 'the tunnel glass keeps the chef on the walkway');
  if (await t.ev(() => typeof PizzaCoinsExt !== 'undefined')) {
    t.expect(await t.ev(() => { const C = CFG.AQUARIUM.COIN; T.walkTo(C.x, C.y, 200, 4); T.step(3); return !!Game.s.pizzacoins.got.aquarium; }), 'the Pizza Coin in the tunnel is picked up on foot');
  }

  // ---- feeding, take 1: the reef tank
  const feed = async (station, tankId) => t.ev(([si, id]) => {
    const A = CFG.AQUARIUM, S = A.STATIONS[si], Tk = A.TANKS.find((k) => k.id === id), out = {};
    T.tp(S.x, S.y + 30, 'aquarium'); T.step(2);
    out.takeLabel = T.label(); out.hintBefore = T.hint(); T.act(); T.step(2);
    out.carry = AquariumExt.st.carry; out.hintCarry = T.hint(); out.hintTarget = Game.hint.target;
    out.takeAgain = T.label();
    // carry it over to the tank: walk (round the station table) to the feeding ring
    T.walkTo(S.x + (si ? -50 : 50), S.y + 30, 80); out.left = T.walkTo(Tk.feed.x, Tk.feed.y + 4, 900, 5);
    out.stillCarry = AquariumExt.st.carry;
    out.dropLabel = T.label();
    const fish = AquariumExt.st.life.filter((f) => f.tank === Tk), near = () => fish.filter((f) => Math.abs(f.x - Tk.feed.x) < 60).length;
    out.total = fish.length;
    out.nearBefore = near();
    T.act(); out.floats = Game.floats.map((f) => f.text); out.carryAfter = AquariumExt.st.carry; out.pours = AquariumExt.st.pours.length; out.fed = Game.s.aquarium.fed;
    T.step(50); out.flakes = AquariumExt.st.flakes.filter((f) => f.tank === Tk).length;
    out.hearts = 0; let maxNear = 0;
    for (let k = 0; k < 120; k++) { T.step(1); maxNear = Math.max(maxNear, near()); out.hearts = Math.max(out.hearts, AquariumExt.st.parts.filter((q) => q.k === 'heart').length); }
    out.nearMax = maxNear;
    return out;
  }, [station, tankId]);
  const reef = await feed(0, 'reef');
  t.expectEq(reef.takeLabel, '🐟 Take fish food', 'take-food label at the station');
  t.expectEq(reef.carry, 'food', 'the chef carries the food tub');
  t.expectEq(reef.hintCarry, 'Drop the food in the tank! 🫳', 'the hint says where to drop it');
  t.expect(reef.hintTarget && reef.hintTarget.x === CFG_REEF_X, `the hint arrow points at the reef's feeding ring (${JSON.stringify(reef.hintTarget)})`);
  t.expect(reef.takeAgain !== '🐟 Take fish food', 'no second tub while carrying one');
  t.expect(reef.left < 8 && reef.stillCarry === 'food', `walked over to the feeding ring with the food (${reef.left.toFixed(1)} px left)`);
  t.expectEq(reef.dropLabel, '🫳 Drop the food in', 'drop label at the feeding ring');
  t.expect(reef.carryAfter === null && reef.pours === 1 && reef.fed === 1, 'dropped in: the tub flies into the hatch and the food is gone from the hands');
  t.expect(reef.flakes >= 8, `the flakes are falling into the water (${reef.flakes})`);
  t.expect(reef.nearMax > reef.nearBefore && reef.nearMax >= reef.total - 1, `the fish rush over (${reef.nearBefore} → ${reef.nearMax} of ${reef.total} near the food)`);
  t.expect(reef.hearts > 0, 'little hearts as they gobble');
  t.expect(reef.floats.includes('Nom nom! 🐟'), 'the Nom nom float');
  await t.shot('feeding');
  t.expect(await t.ev(() => T.until(() => AquariumExt.st.flakes.length === 0, 900) >= 0 && Game.s.aquarium.fedTanks.reef), 'every flake gets eaten: the food is used up');
  t.expectEq(await t.ev(() => T.hint()), 'Feed the fish, swim, or visit the penguins! 🐟🐧', 'back to the general hint');
  t.expect(await t.ev(() => { const h = Game.hint; return !!h.target && h.target.x === CFG.AQUARIUM.STEP_OUT.x; }), 'now the hint points at the swimming steps');
  t.expect(await t.ev(() => { const F = CFG.AQUARIUM.TANKS[1].feed; T.tp(F.x, F.y, 'aquarium'); T.step(1); return T.label() !== '🫳 Drop the food in'; }), 'no drop button without food');

  // ---- feeding, take 2: the shark & ray tank, from the ocean hall's station
  const shark = await feed(1, 'shark');
  console.log(`   fish near the food: reef ${reef.nearBefore} → ${reef.nearMax}, sharks ${shark.nearBefore} → ${shark.nearMax}`);
  t.expectEq(shark.takeLabel, '🐟 Take fish food', 'take-food label at the ocean station');
  t.expect(shark.left < 8 && shark.dropLabel === '🫳 Drop the food in', 'carried to the shark tank ring');
  t.expect(shark.carryAfter === null && shark.fed === 2 && shark.flakes >= 8, 'dropped into the shark tank');
  t.expect(shark.nearMax > shark.nearBefore && shark.nearMax >= shark.total - 1, `sharks, the ray and fish rush over (${shark.nearBefore} → ${shark.nearMax} of ${shark.total})`);
  await t.shot('feeding-sharks');
  t.expect(await t.ev(() => T.until(() => AquariumExt.st.flakes.length === 0, 900) >= 0 && Game.s.aquarium.fedTanks.shark), 'the shark tank food is used up too');
  // two tubs in a row: carrying food beats the station; the plush goes to the other hand
  t.expect(await t.ev(() => { const S = CFG.AQUARIUM.STATIONS[1]; T.tp(S.x, S.y + 30, 'aquarium'); T.act(); T.step(1); return AquariumExt.st.carry === 'food' && T.label() !== '🐟 Take fish food'; }), 'carrying food: the station offers nothing more');

  // ---- the shy octopus
  const octo = await t.ev(() => {
    AquariumExt.st.carry = null;
    const T2 = AquariumExt.tank('octo'), cx = (T2.x0 + T2.x1) / 2; T.tp(cx + 200, 5700, 'aquarium'); T.step(1); const far = AquariumExt.octoNear(Game);
    T.tp(cx, T2.y1 + 50, 'aquarium'); T.step(1); const near = AquariumExt.octoNear(Game);
    return { far, near, free: AquariumExt.free(Game.player.x, Game.player.y) };
  });
  t.expect(octo.far === 0 && octo.near > 0.9 && octo.free, `the octopus hides when you stand close (far ${octo.far}, near ${octo.near.toFixed(2)})`);
  await t.shot('octopus');

  // ---- the touch pool: pet the starfish
  const pet = await t.ev(() => {
    const P = CFG.AQUARIUM.POOL; T.tp(P.x, P.y + P.ry + 16, 'aquarium'); T.step(2);
    const label = T.label(); T.act(); T.step(3);
    return { label, star: AquariumExt.st.star, pets: Game.s.aquarium.pets, floats: Game.floats.map((f) => f.text) };
  });
  t.expectEq(pet.label, '⭐ Pet the starfish', 'pet label at the pool');
  t.expect(pet.star > 0.5 && pet.pets === 1 && pet.floats.includes('Squishy! ⭐'), 'the starfish wiggles: Squishy!');
  await t.shot('lobby');

  // ---- swimming in the lagoon
  const swim = await t.ev(() => {
    const A = CFG.AQUARIUM, S = A.SWIM, out = {};
    AquariumExt.st.carry = 'food';   // food is put down before getting in
    T.tp(A.STEP_OUT.x, A.STEP_OUT.y, 'aquarium'); T.step(1);
    out.label = T.label(); T.act(); T.step(2);
    out.mode = AquariumExt.st.mode; out.carry = AquariumExt.st.carry; out.at = [Math.round(Game.player.x), Math.round(Game.player.y)]; out.hint = T.hint();
    out.floats = Game.floats.map((f) => f.text); out.swims = Game.s.aquarium.swims;
    out.climbHere = T.label();
    // swim off to the right: it works, and it glides on a little after letting go
    const x0 = Game.player.x; T.steer(1, 0.2); T.step(90); T.unsteer(); const x1 = Game.player.x; T.step(10); out.glide = Game.player.x - x1; out.swam = x1 - x0;
    out.noButton = T.label();
    // the fish swirl away from the swimmer: put the chef right in a school and watch
    const sc = AquariumExt.st.lag.schools[0], f0 = sc.fish[0]; T.tp(f0.x, f0.y + 12, 'aquarium'); const d0 = Math.hypot(f0.x - Game.player.x, f0.y - Game.player.y + 12);
    T.step(40); out.flee = [d0, Math.hypot(f0.x - Game.player.x, f0.y - Game.player.y + 12)];
    // push against every edge of the water: the chef never leaves it
    out.escaped = [];
    for (const [ax, ay] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1]]) {
      T.steer(ax, ay); T.step(400); T.unsteer();
      const p = Game.player; if (AquariumExt.st.mode !== 'swim' || p.x < S.x0 || p.x > S.x1 || p.y < S.y0 || p.y > S.y1) out.escaped.push([ax, ay, Math.round(p.x), Math.round(p.y)]);
    }
    return out;
  });
  t.expectEq(swim.label, '🤿 Put on goggles and swim', 'swim label at the steps');
  t.expect(swim.mode === 'swim' && swim.carry === null && swim.swims === 1, 'in the water (the food tub is put down)');
  t.expectEq(swim.hint, 'Swim with the fishes! 🐠', 'swimming hint');
  t.expect(swim.floats.includes('Splash! 🌊'), 'the splash float');
  t.expectEq(swim.climbHere, '🚶 Climb out', 'climb-out label at the steps');
  t.expect(swim.swam > 80 && swim.glide > 1, `swims about and glides (${swim.swam.toFixed(0)} px, glide ${swim.glide.toFixed(1)})`);
  t.expect(swim.noButton === null || swim.noButton === undefined || swim.noButton === '' || !/Climb/.test(swim.noButton), 'no climb-out away from the steps');
  t.expect(swim.flee[1] > swim.flee[0] + 20, `the fish swirl away from the swimmer (${swim.flee.map((d) => d.toFixed(0)).join(' → ')})`);
  t.expectEq(JSON.stringify(swim.escaped), '[]', 'the swimmer stays in the water on every side');
  await t.ev(() => { const A = CFG.AQUARIUM; T.tp(21560, 6150, 'aquarium'); T.steer(1, 0); T.step(25); T.unsteer(); T.step(2); });
  t.expect(await t.ev(() => !!AquariumExt.st.lag.schools.length), 'schools of fish in the lagoon');
  t.expect(await t.ev(() => { AquariumExt.st.swimT = 41; T.step(1); const h = Game.hint; AquariumExt.st.swimT = 0; T.step(1); return h.text === 'Swim with the fishes! 🐠' && h.target === CFG.AQUARIUM.STEP_IN && Game.hint.target === null; }), 'after a long swim the arrow shows the way back to the steps');
  await t.shot('swim');
  const out = await t.ev(() => {
    const A = CFG.AQUARIUM; T.walkTo(A.STEP_IN.x, A.STEP_IN.y, 500, 10);
    const label = T.label(); T.act(); T.step(5);
    return { label, mode: AquariumExt.st.mode, at: Math.hypot(Game.player.x - A.STEP_OUT.x, Game.player.y - A.STEP_OUT.y), drip: AquariumExt.st.drip, floats: Game.floats.map((f) => f.text), free: AquariumExt.free(Game.player.x, Game.player.y) };
  });
  t.expectEq(out.label, '🚶 Climb out', 'swam back to the steps: climb out');
  t.expect(out.mode === 'walk' && out.at < 2 && out.free, 'standing on the pool deck by the steps');
  t.expect(out.drip > 2 && out.floats.includes('Drip drip! 💧'), 'dripping wet for a bit');
  await t.ev(() => T.step(20));
  await t.shot('drip');
  t.expect(await t.ev(() => { T.step(60 * 4); return AquariumExt.st.drip === 0; }), 'dry again after a few seconds');
  t.expect(await t.ev(() => { T.steer(1, 0); T.step(60); T.unsteer(); const A = CFG.AQUARIUM; return !AquariumExt.inRect(Game.player.x, Game.player.y, A.LAGOON); }), 'walking, the lagoon is solid water');

  // ---- the penguins
  const peng = await t.ev(() => {
    const A = CFG.AQUARIUM, st = AquariumExt.st, out = {};
    T.tp(A.GATE_OUT.x, A.GATE_OUT.y, 'aquarium'); T.step(1);
    out.hintOut = T.hint(); out.label = T.label(); T.act(); T.step(2);
    out.mode = st.mode; out.at = Math.hypot(Game.player.x - A.GATE_IN.x, Game.player.y - A.GATE_IN.y); out.hint = T.hint(); out.leave = T.label();
    out.floats = Game.floats.map((f) => f.text);
    // walk into the middle of the snow: the penguins follow
    const avg = () => st.pengs.reduce((s, pg) => s + Math.hypot(pg.x - Game.player.x, pg.y - Game.player.y), 0) / st.pengs.length;
    for (const pg of st.pengs) pg.cool = 99;   // no sliding off for now
    T.until(() => st.pengs.every((pg) => pg.mode === 'walk'), 900);
    T.walkTo(21700, 5700, 300); T.step(2); out.d0 = avg(); T.step(360); out.d1 = avg();
    out.close = st.pengs.filter((pg) => Math.hypot(pg.x - Game.player.x, pg.y - Game.player.y) < 130).length;
    out.dbg = st.pengs.map((pg) => [pg.mode, Math.round(pg.x), Math.round(pg.y), pg.belly, +pg.stuck.toFixed(1), +pg.nuzzle.toFixed(1)]); out.chef = [Math.round(Game.player.x), Math.round(Game.player.y)];
    out.nuzzles = Game.s.aquarium.nuzzles; out.hearts = 0;
    for (let k = 0; k < 600 && !Game.s.aquarium.nuzzles; k++) T.step(1);
    out.nuzzles = Game.s.aquarium.nuzzles;
    out.inside = st.pengs.every((pg) => AquariumExt.inRect(pg.x, pg.y, A.HAB));
    return out;
  });
  t.expectEq(peng.hintOut, 'Feed the fish, swim, or visit the penguins! 🐟🐧', 'general hint at the gate');
  t.expectEq(peng.label, '🐧 Visit the penguins', 'visit label at the gate');
  t.expect(peng.mode === 'peng' && peng.at < 2, 'in through the gate');
  t.expectEq(peng.hint, 'Take a fish for the penguins! 🐟', 'fish hint inside the habitat');
  t.expectEq(peng.leave, '🚪 Leave the penguins', 'leave label just inside the gate');
  t.expect(peng.floats.includes('Hello penguins! 🐧'), 'hello float');
  if (!(peng.d1 < 120 && peng.close >= 5)) console.log(JSON.stringify([peng.chef, peng.dbg]));
  t.expect(peng.d1 < 120 && peng.close >= 5, `the penguins follow the chef (avg ${peng.d0.toFixed(0)} → ${peng.d1.toFixed(0)} px, ${peng.close} close)`);
  t.expect(peng.nuzzles > 0, 'a penguin waddles up and nuzzles');
  t.expect(peng.inside, 'the penguins stay in their habitat');
  await t.shot('penguins');
  const fishy = await t.ev(() => {
    const A = CFG.AQUARIUM, st = AquariumExt.st, out = {};
    T.walkTo(A.PBUCKET.x + 40, A.PBUCKET.y, 300, 8); out.label = T.label(); T.act(); T.step(1);
    out.carry = st.carry; out.hint = T.hint();
    T.walkTo(21720, 5700, 300); T.step(200);
    out.close = st.pengs.filter((pg) => Math.hypot(pg.x - Game.player.x, pg.y - Game.player.y) < 80).length;
    out.give = T.label(); T.act(); T.step(2);
    out.carryAfter = st.carry; out.fed = Game.s.aquarium.penguinFed; out.eating = st.pengs.filter((pg) => pg.eat > 0).length;
    out.floats = Game.floats.map((f) => f.text); out.hintAfter = T.hint();
    return out;
  });
  t.expectEq(fishy.label, '🐟 Take a fish', 'take-a-fish label at the bucket');
  t.expect(fishy.carry === 'fish' && fishy.hint === 'Give the fish to a penguin! 🐧', 'carrying a fish');
  t.expect(fishy.close >= 5, `the penguins gather round the fish (${fishy.close})`);
  t.expectEq(fishy.give, '🐟 Give the fish', 'give label with penguins near');
  t.expect(fishy.carryAfter === null && fishy.fed === 1 && fishy.eating === 1, 'one penguin gobbles the fish');
  t.expect(fishy.floats.includes('Gulp! 🐧💕'), 'the gulp float');
  t.expectEq(fishy.hintAfter, 'The penguins love you! 🐧', 'happy hint after feeding');
  await t.ev(() => T.step(12));
  await t.shot('penguin-fed');
  const slide = await t.ev(() => {
    const st = AquariumExt.st; T.until(() => st.pengs.every((q) => q.mode === 'walk'), 900); for (const q of st.pengs) q.cool = 99; const pg = st.pengs[0]; pg.cool = 0; pg.eat = 0; pg.nuzzle = 0; const seen = {};
    for (let k = 0; k < 1500; k++) { T.step(1); seen[pg.mode] = true; if (seen.swim && pg.mode === 'walk') break; }
    return { seen: Object.keys(seen), mode: pg.mode };
  });
  t.expect(['toSlide', 'climb', 'slide', 'swim', 'hop'].every((m) => slide.seen.includes(m)), `a penguin climbs, slides down the ice slide, swims and hops out (${slide.seen.join(',')})`);
  await t.ev(() => { const st = AquariumExt.st, pg = st.pengs[1]; pg.cool = 0; T.until(() => pg.mode === 'slide', 600); T.step(20); });
  await t.shot('penguin-slide');
  const leaveP = await t.ev(() => {
    const A = CFG.AQUARIUM, st = AquariumExt.st;
    for (const [ax, ay] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { T.steer(ax, ay); T.step(300); T.unsteer(); if (!AquariumExt.inRect(Game.player.x, Game.player.y, A.HAB)) return { escaped: true }; }
    st.carry = 'fish';
    T.walkTo(A.GATE_IN.x, A.GATE_IN.y, 600, 4); const label = T.label(); T.act(); T.step(2);
    return { escaped: false, label, mode: st.mode, carry: st.carry, at: Math.hypot(Game.player.x - A.GATE_OUT.x, Game.player.y - A.GATE_OUT.y) };
  });
  t.expect(!leaveP.escaped, 'the habitat walls keep the chef in (only the gate leads out)');
  t.expectEq(leaveP.label, '🚪 Leave the penguins', 'leave label at the gate');
  t.expect(leaveP.mode === 'walk' && leaveP.carry === null && leaveP.at < 2, 'out through the gate (the fish stays behind)');

  // ---- the $5 fish plush and the $3 shells
  const gifts = await t.ev(() => {
    Game.s.cash = 20; const P = CFG.AQUARIUM.PADS; T.tp(P.plush.x, P.plush.y, 'aquarium'); T.step(1);
    const n1 = T.until(() => AquariumExt.st.plush > 0, 400);
    T.tp(P.shell.x, P.shell.y, 'aquarium'); T.step(1);
    const n2 = T.until(() => Game.s.aquarium.shells > 0, 400);
    return { n1, n2, cash: Game.s.cash, plushes: Game.s.aquarium.plushes, shells: Game.s.aquarium.shells };
  });
  t.expect(gifts.n1 >= 0 && gifts.n2 >= 0 && gifts.cash === 12 && gifts.plushes === 1 && gifts.shells === 1, `bought a plush ($5) and a shell ($3): ${JSON.stringify(gifts)}`);
  await t.ev(() => { T.tp(20700, 6200, 'aquarium'); T.step(2); });
  await t.shot('gifts');

  // ---- rescues: from a wall, the lagoon, the habitat, the swim edge and a rock inside the habitat
  const rescues = await t.ev(() => {
    const A = CFG.AQUARIUM, st = AquariumExt.st, out = {}, d = (q) => Math.hypot(Game.player.x - q.x, Game.player.y - q.y);
    st.mode = 'walk'; T.tp(A.PART_H.x0 + 60, A.PART_H.y0 + 10, 'aquarium'); T.step(2); out.wall = [d({ x: A.EXIT.x, y: A.EXIT.y - 16 }), AquariumExt.free(Game.player.x, Game.player.y)];
    T.tp(21700, 6150, 'aquarium'); T.step(2); out.lagoon = [d(A.STEP_OUT), AquariumExt.free(Game.player.x, Game.player.y)];
    T.tp(21800, 5600, 'aquarium'); T.step(2); out.hab = [d(A.GATE_OUT), AquariumExt.free(Game.player.x, Game.player.y)];
    T.tp(A.STEP_OUT.x, A.STEP_OUT.y, 'aquarium'); T.act(); T.tp(21000, 6000, 'aquarium'); T.step(2); out.swim = [st.mode, AquariumExt.inRect(Game.player.x, Game.player.y, A.SWIM), AquariumExt.free(Game.player.x, Game.player.y)];
    T.tp(A.STEP_IN.x, A.STEP_IN.y, 'aquarium'); T.act();
    T.tp(A.GATE_OUT.x, A.GATE_OUT.y, 'aquarium'); T.act(); const R0 = A.ROCKS[1]; T.tp((R0.x0 + R0.x1) / 2, (R0.y0 + R0.y1) / 2, 'aquarium'); T.step(2); out.rock = [st.mode, d(A.GATE_IN), AquariumExt.free(Game.player.x, Game.player.y)];
    return out;
  });
  t.expect(rescues.wall[0] < 2 && rescues.wall[1], 'pushed into a wall: back on the exit mat');
  t.expect(rescues.lagoon[0] < 2 && rescues.lagoon[1], 'standing in the lagoon without goggles: onto the deck by the steps');
  t.expect(rescues.hab[0] < 2 && rescues.hab[1], 'inside the habitat without a visit: out at the gate');
  t.expect(rescues.swim[0] === 'swim' && rescues.swim[1] && rescues.swim[2], 'a swimmer pushed out of the water: back in the water');
  t.expect(rescues.rock[0] === 'peng' && rescues.rock[1] < 2 && rescues.rock[2], 'a visitor stuck in an ice rock: back by the gate');

  // ---- Take-me-home from every state: carrying food, swimming, visiting the penguins
  const homes = await t.ev(() => {
    const A = CFG.AQUARIUM, st = AquariumExt.st, out = [];
    const check = (name) => { Game.goHome(); T.step(2); out.push([name, Game.area, st.mode, st.carry, st.drip, st.flakes.length, st.pengs.every((pg) => pg.mode === 'walk')]); };
    check('peng');   // (still visiting from the rescue above)
    T.tp(A.STEP_OUT.x, A.STEP_OUT.y, 'aquarium'); T.act(); T.step(5); check('swim');
    const S = A.STATIONS[0]; T.tp(S.x, S.y + 30, 'aquarium'); T.act(); const F = A.TANKS[1].feed; T.tp(F.x, F.y, 'aquarium'); T.act(); T.step(40); T.tp(S.x, S.y + 30, 'aquarium'); T.act(); check('food');
    T.tp(A.STEP_OUT.x, A.STEP_OUT.y, 'aquarium'); T.act(); T.act(); T.step(2); check('drip');
    return out;
  });
  for (const [name, area, mode, carry, drip, flakes, pengs] of homes) t.expect(area === 'town' && mode === 'walk' && carry === null && drip === 0 && flakes === 0 && pengs, `Take-me-home while ${name}: ${JSON.stringify([area, mode, carry, drip, flakes, pengs])}`);
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');

  // ---- a save while swimming, then a reload: standing safely on the deck
  await t.ev(() => { const A = CFG.AQUARIUM; T.tp(A.STEP_OUT.x, A.STEP_OUT.y, 'aquarium'); T.act(); T.steer(1, 0); T.step(60); T.unsteer(); Game.save(); });
  await t.reload();
  if (await t.ev(() => typeof AquariumExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-aquarium.js' }); await t.ev(() => T.step(2)); }
  await addHelpers(t);
  const reload = await t.ev(() => { T.step(3); const A = CFG.AQUARIUM; return { area: Game.area, mode: AquariumExt.st.mode, free: AquariumExt.free(Game.player.x, Game.player.y), deck: Math.hypot(Game.player.x - A.STEP_OUT.x, Game.player.y - A.STEP_OUT.y), shells: Game.s.aquarium.shells, fed: Game.s.aquarium.fed }; });
  t.expect(reload.area === 'aquarium' && reload.mode === 'walk' && reload.free && reload.deck < 2, `after a reload mid-swim: on the deck by the steps (${JSON.stringify(reload)})`);
  t.expect(reload.shells === 1 && reload.fed >= 2, 'the shells and feeds are saved');

  // ---- phone-size screenshots of each part
  await t.page.setViewportSize({ width: 390, height: 844 });
  const phone = [
    ['phone-lobby', () => { T.shotAt(20620, 6200); }],
    ['phone-feed', () => { const A = CFG.AQUARIUM, S = A.STATIONS[0]; T.tp(S.x, S.y + 30, 'aquarium'); T.act(); const F = A.TANKS[1].feed; T.tp(F.x, F.y, 'aquarium'); T.act(); T.step(70); }],
    ['phone-tunnel', () => { T.shotAt(20920, 5640); T.step(20); }],
    ['phone-sharks', () => { const A = CFG.AQUARIUM, S = A.STATIONS[1]; T.tp(S.x, S.y + 30, 'aquarium'); T.act(); T.walkTo(A.TANKS[2].feed.x + 70, A.TANKS[2].feed.y + 60, 300); }],
    ['phone-swim', () => { const A = CFG.AQUARIUM; AquariumExt.st.carry = null; T.tp(A.STEP_OUT.x, A.STEP_OUT.y, 'aquarium'); T.act(); T.steer(1, 0.1); T.step(70); T.unsteer(); T.step(5); }],
    ['phone-penguins', () => { const A = CFG.AQUARIUM; T.tp(A.STEP_IN.x, A.STEP_IN.y, 'aquarium'); T.act(); T.tp(A.GATE_OUT.x, A.GATE_OUT.y, 'aquarium'); T.act(); T.walkTo(21720, 5720, 300); T.step(200); }],
  ];
  for (const [name, fn] of phone) {
    await t.ev(() => { Render.resize(); T.step(1); });
    await t.ev(fn);
    await t.shot(name);
  }
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); const A = CFG.AQUARIUM; T.tp(A.GATE_IN.x, A.GATE_IN.y, 'aquarium'); T.act(); T.step(2); });

  // ---- out through the door: back on the sidewalk at the door spot
  await t.ev(() => { const E = CFG.AQUARIUM.EXIT; T.tp(E.x, E.y, 'aquarium'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back outside in the City');
  t.expect(await t.ev(() => { const D = CFG.AQUARIUM.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the door spot');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door offers going back in');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '🐠 Welcome to the Aquarium!').length === 0), 'no second welcome toast after the reload (already seen)');
  t.expectEq(await t.ev(() => AquariumExt.hint(Game) === undefined || T.hint() === 'Visit the aquarium! 🐠'), true, 'only the door hint outside');
  await t.ev(() => { T.tp(540, 430, 'town'); T.step(2); });
  t.expectEq(await t.ev(() => AquariumExt.hint(Game)), undefined, 'no aquarium hint in the town');
};
const CFG_REEF_X = 20588;
