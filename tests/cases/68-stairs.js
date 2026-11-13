// Every staircase in the game, drawn by the shared js/stairs.js: small, flat, a dark frame of slats, the step to stand on
// pale with two footprints (no arrow; the pizzeria's red rug is only decoration). For each one: the step is part of the stairs, reachable on foot and free,
// the button follows the convention ('⬆️ Go upstairs' / '⬇️ Go downstairs', or 'Up to' / 'Down to' a place) and the
// stairs work both ways. Screenshots of each at 1100×720, and the pizzeria and the bedroom at 390×844 too.
module.exports = async (t) => {
  await t.boot();
  // helpers in the page: walk the chef to a spot with the stick, and is a spot free of every obstacle
  await t.ev(() => {
    window.S68 = {
      walkTo(x, y, max = 400) {
        for (let i = 0; i < max; i++) {
          const p = Game.player, dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy);
          if (d < 4) break;
          T.steer(dx / d, dy / d); Game.update(1 / 60);
        }
        T.unsteer(); T.step(1);
        return Math.hypot(Game.player.x - x, Game.player.y - y);
      },
      free(x, y) { return !Game.obstacles().some((o) => Game.hitRect(x, y, 11, o)); },
      inside(q, R) { return q.x >= R.x && q.x <= R.x + R.w && q.y >= R.y && q.y <= R.y + R.h; },
    };
  });
  const shot = async (name, fn, zoom = 1.6, arg = null) => { await t.ev(([z, f, a]) => { (0, eval)('(' + f + ')')(a); document.getElementById('toasts').innerHTML = ''; Render.setZoom(z); Game.cameraSnap = true; T.step(20); }, [zoom, String(fn), arg]); await t.shot(name); };

  // ---- the module
  const api = await t.ev(() => ({ up: Stairs.up(), down: Stairs.down(), place: Stairs.up('the lamp room'), sub: Stairs.down('the subway'), reach: Stairs.REACH }));
  t.expect(api.up === '⬆️ Go upstairs' && api.down === '⬇️ Go downstairs' && api.place === '⬆️ Up to the lamp room' && api.sub === '⬇️ Down to the subway' && api.reach === 40, `the labels and the reach ${JSON.stringify(api)}`);

  // ---- the pizzeria: a small flat flight by the HIRING desk, the bottom step (footprints) to stand on, a red rug for looks
  const shop = await t.ev(() => {
    Game.s.unlocked.dining = true;
    const C = CFG.UPSTAIRS.STAIRS, G = UpstairsExt.stairs().G, F = G.foot;
    T.tp(F.x - 20, F.y - 60, 'town'); const d = S68.walkTo(F.x, F.y);
    const out = { d, free: S68.free(F.x, F.y), label: T.label(), hint: T.hint(), onStep: S68.inside(F, G.stand), w: C.x1 - C.x0, h: C.y1 - C.y0 };
    out.inShop = Game.insideBuilding(C.x0 + 2, C.y0 + 2) && Game.insideBuilding(C.x1 - 2, C.y1 - 2);
    // no buy pad's circle reaches the stairs
    out.pads = Game.allPads().filter((pd) => { const q = pd.pos, nx = U.clamp(q.x, C.x0, C.x1), ny = U.clamp(q.y, C.y0, C.y1); return Math.hypot(q.x - nx, q.y - ny) < CFG.PAD_RADIUS; }).map((pd) => pd.key);
    // the rest of the flight is solid
    out.solid = !S68.free(G.top.x, G.top.y);
    // no rug: nothing in the town art or the config draws a mat at the foot
    out.rug = !!C.rug && /#b23a48/.test(String(UpstairsExt.paintTown)) && !('block' in C) && !('reach' in C);   // the red rug is back, just for looks
    T.act(); T.step(2);
    const W = UpstairsExt.well().G;
    out.up = { area: Game.area, d: Math.hypot(Game.player.x - W.foot.x, Game.player.y - W.foot.y), label: T.label(), onStep: S68.inside(W.foot, W.stand), free: S68.free(W.foot.x, W.foot.y) };
    // walk away and back to the top step, then down again: you land on the bottom step
    T.tp(W.foot.x - 80, W.foot.y - 50, 'upstairs'); out.up.walk = S68.walkTo(W.foot.x, W.foot.y);
    out.up.label2 = T.label(); T.act(); T.step(2);
    out.down = { area: Game.area, d: Math.hypot(Game.player.x - F.x, Game.player.y - F.y), roof: UpstairsExt.st.roofA };
    return out;
  });
  t.expect(shop.d < 5 && shop.free && shop.onStep, `pizzeria: walked onto the bottom step, which is free floor ${JSON.stringify(shop)}`);
  t.expectEq(shop.label, '⬆️ Go upstairs', 'pizzeria: the button on the bottom step');
  t.expectEq(shop.hint, 'Go upstairs to your room! 🛏️', 'pizzeria: the hint');
  t.expect(shop.w <= 90 && shop.h <= 60 && shop.inShop, `pizzeria: small and inside the shop ${JSON.stringify(shop)}`);
  t.expect(shop.pads.length === 0, `pizzeria: no buy pad on the stairs ${JSON.stringify(shop.pads)}`);
  t.expect(shop.solid && shop.rug, 'pizzeria: the flight is solid; the red rug lies at its foot just for looks');
  t.expect(shop.up.area === 'upstairs' && shop.up.d < 1 && shop.up.onStep && shop.up.free && shop.up.label === '⬇️ Go downstairs', `bedroom: up on the top step ${JSON.stringify(shop.up)}`);
  t.expect(shop.up.walk < 5 && shop.up.label2 === '⬇️ Go downstairs', `bedroom: the top step is reachable ${JSON.stringify(shop.up)}`);
  t.expect(shop.down.area === 'town' && shop.down.d < 1 && shop.down.roof === 0, `pizzeria: back down on the bottom step ${JSON.stringify(shop.down)}`);
  await shot('pizzeria', () => { const F = CFG.UPSTAIRS.STAIRS.landing; T.tp(F.x - 70, F.y - 46, 'town'); });
  await shot('bedroom', () => { const F = CFG.UPSTAIRS.top; T.tp(F.x - 60, F.y - 70, 'upstairs'); });

  // ---- the two fire stations: up the flat metal stairs step by step to the gallery, down the pole
  // (the two fire stations keep their own side-on wooden stairs along the back wall, by request)
  // ---- the lighthouse and the control tower: round the spiral step by step, up and back down
  for (const [area, ext, R, place, name] of [['lighthouse', 'IslandsInsideExt', 'ISLE_IN', 'the lamp room', 'lighthouse'], ['aftower', 'AirfieldInsideExt', 'AF_IN', 'the top', 'control tower']]) {
    const sp = await t.ev(([area, ext, cfg]) => {
      const E = (0, eval)(ext), Rm = CFG[cfg].ROOMS[area], G = E.spiral(), f = Rm.FOOT, dur = Rm.CLIMB || CFG[cfg].CLIMB;
      T.tp(f.x + 60, f.y + 50, area); const d = S68.walkTo(f.x, f.y);
      const out = { d, free: S68.free(f.x, f.y), label: T.label(), onStep: S68.inside(f, G.stand), foot: Math.hypot(G.foot.x - f.x, G.foot.y - f.y) };
      T.act(); T.step(Math.round(dur * 15));
      out.mid = { risen: Game.player.y < f.y - 20, climbing: !!E.st.climb, up: E.st.up };
      T.until(() => !E.st.climb, 400); T.step(2);
      out.top = { up: E.st.up, d: Math.hypot(Game.player.x - f.x, Game.player.y - f.y), label: T.label(), free: S68.free(f.x, f.y) };
      T.act(); T.step(Math.round(dur * 45)); out.top.mid = { below: E.st.up === false, out: Game.player.y < f.y - 5 };
      T.until(() => !E.st.climb, 400); T.step(2);
      out.down = { up: E.st.up, d: Math.hypot(Game.player.x - f.x, Game.player.y - f.y), label: T.label() };
      return out;
    }, [area, ext, R]);
    t.expect(sp.d < 5 && sp.free && sp.onStep && sp.foot < 1, `${name}: walked onto the spiral's front step ${JSON.stringify(sp)}`);
    t.expectEq(sp.label, '⬆️ Up to ' + place, `${name}: the button on the front step`);
    t.expect(sp.mid.climbing && !sp.mid.up && sp.mid.risen, `${name}: walking up the spiral ${JSON.stringify(sp.mid)}`);
    t.expect(sp.top.mid.below && sp.top.mid.out, `${name}: walking down the spiral on the floor below ${JSON.stringify(sp.top.mid)}`);
    t.expect(sp.top.up && sp.top.d < 1 && sp.top.free && sp.top.label === '⬇️ Go downstairs', `${name}: up top, on the stairwell's top step ${JSON.stringify(sp.top)}`);
    t.expect(!sp.down.up && sp.down.d < 1 && sp.down.label === '⬆️ Up to ' + place, `${name}: back down on the front step ${JSON.stringify(sp.down)}`);
    await shot(area, ([a, x]) => { const f = CFG[x].ROOMS[a].FOOT; (x === 'ISLE_IN' ? IslandsInsideExt : AirfieldInsideExt).st.up = false; T.tp(f.x + 70, f.y + 30, a); }, 1.6, [area, R]);
    await shot(area + '-top', ([a, x]) => { const f = CFG[x].ROOMS[a].FOOT; (x === 'ISLE_IN' ? IslandsInsideExt : AirfieldInsideExt).st.up = true; T.tp(f.x + 70, f.y + 30, a); }, 1.6, [area, R]);
    await t.ev(([a, x]) => { (x === 'ISLE_IN' ? IslandsInsideExt : AirfieldInsideExt).st.up = false; }, [area, R]);
  }

  // ---- the jet's rolling stairs (when it is parked away from its gate): up into the plane, out again at the stairs
  const jet = await t.ev(() => {
    const v = AirfieldExt.rt.jet; AirfieldExt.park(v, { x: 2040, y: 860, angle: -0.6 }); T.step(1);
    const d = JetInsideExt.doorSpot(v), s0 = AirfieldExt.jetDoor(v, 110); T.tp(s0.x, s0.y, 'town'); const w = S68.walkTo(d.x, d.y, 200);
    const out = { stairs: !JetInsideExt.atGate(v), w, label: T.label() };
    T.act(); T.step(2); out.area = Game.area;
    const J = CFG.JETCABIN; T.tp(J.EXIT.x, J.EXIT.y, 'jetcabin'); T.act(); T.step(1);
    out.back = { area: Game.area, d: Math.hypot(Game.player.x - d.x, Game.player.y - d.y) };
    return out;
  });
  t.expect(jet.stairs && jet.w < 34 && jet.label === '⬆️ Up to the plane' && jet.area === 'jetcabin', `jet: up the rolling stairs ${JSON.stringify(jet)}`);
  t.expect(jet.back.area === 'town' && jet.back.d < 2, `jet: back out at the stairs ${JSON.stringify(jet.back)}`);
  await shot('jet', () => { const q = AirfieldExt.jetDoor(AirfieldExt.rt.jet, 100); T.tp(q.x, q.y, 'town'); }, 1.8);
  await t.ev(() => { const v = AirfieldExt.rt.jet; AirfieldExt.park(v, v.home); T.step(1); });

  // ---- Coney Island: walk down the boardwalk steps onto the beach and back up (no button: you just walk them)
  const pier = await t.ev(() => {
    const P = CFG.PIERPARK, x = P.STAIRS[0]; T.tp(x, P.RAIL_Y - 30, 'pizzapier');
    const down = S68.walkTo(x, P.RAIL_Y + 90, 200), label = T.label(); const up = S68.walkTo(x, P.RAIL_Y - 30, 200);
    return { down, up, label };
  });
  t.expect(pier.down < 5 && pier.up < 5, `Coney Island: down the steps to the beach and back up ${JSON.stringify(pier)}`);
  await shot('pier', () => { const P = CFG.PIERPARK; T.tp(P.STAIRS[0] + 60, P.RAIL_Y + 70, 'pizzapier'); }, 1.4);

  // ---- the pizzeria and the bedroom on a phone
  await t.boot({ viewport: { width: 390, height: 844 } });
  await shot('pizzeria-phone', () => { Game.s.unlocked.dining = true; const F = CFG.UPSTAIRS.STAIRS.landing; T.tp(F.x - 70, F.y - 46, 'town'); }, 1.25);
  await shot('bedroom-phone', () => { const F = CFG.UPSTAIRS.top; T.tp(F.x - 60, F.y - 70, 'upstairs'); }, 1.25);
};
