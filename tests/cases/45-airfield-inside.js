'use strict';
// Inside the airfield's buildings: each door spot (free ground, reachable, its label and hint, no hint further away),
// going in (the room, the mat, a welcome toast once, a hint that points at something in the room), every interactive
// thing (the big terminal's whole flow: check-in, security with the X-ray belt and the scanner arch, picking the bag up,
// the lounge's seats and $3 toy plane, on to Gate 1, baggage claim; the hangar's mechanic and the tug that drives you
// out; the tower's stairs, binoculars and microphone; the workshop's propeller, vice, mechanic and $4 toolbox), nothing
// stuck anywhere, a rescue from a wall, Take-me-home from inside, and going back out onto the door spot.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/airfield-inside.js into index.html, load it into the booted page
  if (await t.ev(() => typeof AirfieldInsideExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/airfield-inside.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof AirfieldInsideExt !== 'undefined'), 'the extension is loaded');
  t.expect(await t.ev(() => Game.ext.indexOf(AirfieldInsideExt) < Game.ext.indexOf(CityExt) && Game.ext.indexOf(AirfieldInsideExt) < Game.ext.indexOf(AirfieldExt)), 'it answers before the City and the airfield');
  const rects = await t.ev(() => Object.entries(CFG.AF_IN.ROOMS).map(([k, R]) => [k, CFG.AREAS[k] && CFG.AREAS[k].WORLD === R.WORLD, R.WORLD.x0, R.WORLD.y0, R.WORLD.x1 - R.WORLD.x0, R.WORLD.y1 - R.WORLD.y0]));
  t.expectEq(JSON.stringify(rects), JSON.stringify([['afterminal', true, 27000, 4000, 1040, 740], ['afhangar', true, 14000, 4000, 600, 400], ['aftower', true, 15000, 4000, 600, 400], ['afworkshop', true, 16000, 4000, 600, 400], ['affuel', true, 19000, 4000, 600, 400], ['afgate', true, 23000, 4000, 600, 400]]), 'the interiors in their reserved rectangles (the fuel farm and gate 1: tests/cases/60-airport-buildings.js)');
  // the big terminal sits in a free rectangle of its own: nothing else overlaps it
  t.expectEq(await t.ev(() => { const a = CFG.AREAS.afterminal.WORLD; return Object.entries(CFG.AREAS).filter(([k, A]) => k !== 'afterminal' && a.x0 < A.WORLD.x1 && a.x1 > A.WORLD.x0 && a.y0 < A.WORLD.y1 && a.y1 > A.WORLD.y0).map(([k]) => k).join(','); }), '', 'no other map overlaps the terminal');
  t.expectEq(await t.ev(() => WorldMapExt.placeOf('afterminal')), 'town', 'the terminal is on the world map, in town');

  const ROOMS = ['afterminal', 'afhangar', 'aftower', 'afworkshop'];
  const HINTS = { afterminal: 'Go inside the terminal! 🧳', afhangar: 'Go inside the hangar! ✈️', aftower: 'Go inside the control tower! 🗼', afworkshop: 'Go inside the workshop! 🔧' };
  const TOASTS = { afterminal: '🧳 Welcome to the terminal!', afhangar: '✈️ Welcome to the Pizza Air hangar!', aftower: '🗼 Welcome to the control tower!', afworkshop: '🔧 Welcome to the workshop!' };

  // ---- the door spots on the airfield: free ground, the chef can walk away in some direction, nothing solid added
  for (const k of ROOMS) {
    const spot = await t.ev((k) => {
      const D = AirfieldInsideExt.doorSpot(k);
      T.tp(D.x, D.y, 'town');
      const blocked = Game.obstacles().some((o) => Game.hitRect(D.x, D.y, 12, o));
      let moved = 0;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1]]) { T.tp(D.x, D.y, 'town'); T.steer(ax, ay); T.step(10); T.unsteer(); moved = Math.max(moved, Math.hypot(Game.player.x - D.x, Game.player.y - D.y)); }
      // walking up to it from 50 px below gets there
      T.tp(D.x, D.y + 50, 'town'); T.steer(0, -1); T.step(14); T.unsteer();
      const reached = Math.hypot(Game.player.x - D.x, Game.player.y - D.y);
      return { D, blocked, moved, reached };
    }, k);
    t.expect(!spot.blocked, `${k}: the door spot ${JSON.stringify(spot.D)} is clear of obstacles`);
    t.expect(spot.moved > 20, `${k}: the chef can walk away from the door spot`);
    t.expect(spot.reached < 14, `${k}: walking up to the door spot from below gets there (${spot.reached.toFixed(1)} px short)`);
    // the hint 45 px away points at the door; at the door the button and the hint; 100 px away nothing of ours
    const near = await t.ev((k) => { const D = AirfieldInsideExt.doorSpot(k); T.tp(D.x + 32, D.y + 32, 'town'); T.step(2); const h = Game.hint; return { text: h && h.text, at: !!(h && h.target && h.target.x === D.x && h.target.y === D.y), label: T.label() }; }, k);
    t.expectEq(near.text, HINTS[k], `${k}: door hint nearby`);
    t.expect(near.at, `${k}: the hint arrow points at the door spot`);
    t.expect(near.label !== '🚪 Go inside', `${k}: no door button 45 px away`);
    const at = await t.ev((k) => { const D = AirfieldInsideExt.doorSpot(k); T.tp(D.x, D.y, 'town'); T.step(2); return { label: T.label(), hint: T.hint(), target: Game.hint && Game.hint.target }; }, k);
    t.expectEq(at.label, '🚪 Go inside', `${k}: door label at the door spot`);
    t.expectEq(at.hint, HINTS[k], `${k}: door hint at the door spot`);
    t.expect(!at.target, `${k}: no arrow while standing on the door spot`);
    t.expectEq(await t.ev((k) => { const D = AirfieldInsideExt.doorSpot(k); T.tp(D.x - 90, D.y + 60, 'town'); T.step(1); return AirfieldInsideExt.hint(Game); }, k), undefined, `${k}: no door hint further away`);
  }
  // driving past a door: no door button or hint
  t.expect(await t.ev(() => { const D = AirfieldInsideExt.doorSpot('aftower'); T.tp(D.x, D.y, 'town'); Game.driving = true; Game.vehicle = AirfieldExt.rt.heli; const r = AirfieldInsideExt.action(Game) === null && AirfieldInsideExt.hint(Game) === undefined; Game.driving = false; Game.vehicle = null; return r; }), 'no door while driving');
  await t.ev(() => { Render.setZoom(1.1); const D = AirfieldInsideExt.doorSpot('afhangar'); T.tp(D.x, D.y, 'town'); T.step(2); });
  await t.shot('door-hangar');
  await t.ev(() => { const D = AirfieldInsideExt.doorSpot('afterminal'); T.tp(D.x, D.y, 'town'); T.step(2); });
  await t.shot('door-terminal');
  await t.ev(() => { const D = AirfieldInsideExt.doorSpot('afworkshop'); T.tp(D.x, D.y, 'town'); T.step(2); Render.setZoom(1); });
  await t.shot('door-workshop');

  // ---- in and out of each building: on the mat, a toast the first time only, a hint that points at something inside
  for (const k of ROOMS) {
    const inside = await t.ev((k) => {
      const D = AirfieldInsideExt.doorSpot(k); T.tp(D.x, D.y, 'town'); T.act(); T.step(30);
      const R = CFG.AF_IN.ROOMS[k], W = R.WORLD, h = Game.hint;
      return { area: Game.area, d: Math.hypot(Game.player.x - R.EXIT.x, Game.player.y - (R.EXIT.y - 8)), free: AirfieldInsideExt.free(Game, Game.player.x, Game.player.y), label: T.label(), hint: h && h.text, inRoom: !!(h && (!h.target || (h.target.x > W.x0 && h.target.x < W.x1 && h.target.y > W.y0 && h.target.y < W.y1))), hasTarget: !!(h && h.target), toasts: T.toasts.filter((m) => m === CFG.AF_IN.ROOMS[k].toast).length };
    }, k);
    t.expectEq(inside.area, k, `${k}: inside`);
    t.expect(inside.d < 2 && inside.free, `${k}: on the mat inside the door, on free floor`);
    t.expectEq(inside.label, '🚪 Go outside', `${k}: exit label on the mat`);
    t.expect(inside.hint && inside.hasTarget && inside.inRoom, `${k}: the hint points at something in the room (${inside.hint})`);
    t.expectEq(inside.toasts, 1, `${k}: welcome toast`);
    t.expect(TOASTS[k] === (await t.ev((k) => CFG.AF_IN.ROOMS[k].toast, k)), `${k}: its toast text`);
    // every spot you press the button on, and the exit mat, is free floor; nobody is stuck anywhere in the room
    const spots = await t.ev((k) => {
      const R = CFG.AF_IN.ROOMS[k], E = AirfieldInsideExt, names = ['EXIT', 'CHECKIN', 'BAG_SPOT', 'TOY_PAD', 'TRAY_SPOT', 'PICK_SPOT', 'ARCH_SPOT', 'ARCH_BACK', 'GATE_DOOR', 'MECH_SPOT', 'TUG_SPOT', 'FOOT', 'VICE_SPOT', 'PROP_SPOT', 'HI_SPOT', 'TOOL_PAD'];
      const pts = names.filter((n) => R[n]).map((n) => [n, R[n]]);
      if (k === 'afterminal') for (const y of R.SEAT_YS) for (const x of R.SEAT_XS) pts.push(['seat', { x, y }]);
      return pts.filter(([n, q]) => !E.free(Game, q.x, q.y) || Game.obstacles().some((o) => Game.hitRect(q.x, q.y, 11.5, o))).map(([n]) => n);
    }, k);
    t.expectEq(spots.length, 0, `${k}: every interaction spot is free floor (${JSON.stringify(spots)})`);
    const stuck = await t.ev((k) => {
      const R = CFG.AF_IN.ROOMS[k], A = R.ROOM, out = [];
      for (let y = A.y0 + 14; y < A.y1 - 12; y += 24) for (let x = A.x0 + 14; x < A.x1 - 12; x += 24) {
        if (Game.obstacles().some((o) => Game.hitRect(x, y, 12, o))) continue;
        let best = 0;
        for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { T.tp(x, y, k); T.steer(ax, ay); T.step(8); T.unsteer(); best = Math.max(best, Math.hypot(Game.player.x - x, Game.player.y - y)); }
        AirfieldInsideExt.resetRoom();
        if (best < 2) out.push([x, y]);
      }
      return out;
    }, k);
    t.expectEq(stuck.length, 0, `${k}: no stuck spots (${JSON.stringify(stuck.slice(0, 6))})`);
    const out = await t.ev((k) => {
      const R = CFG.AF_IN.ROOMS[k]; T.tp(R.EXIT.x, R.EXIT.y, k); const label = T.label(); T.act(); T.step(2);
      const D = AirfieldInsideExt.doorSpot(k);
      return { label, area: Game.area, d: Math.hypot(Game.player.x - D.x, Game.player.y - D.y), again: T.label() };
    }, k);
    t.expectEq(out.label, '🚪 Go outside', `${k}: exit label`);
    t.expect(out.area === 'town' && out.d < 2, `${k}: back outside on the door spot`);
    t.expectEq(out.again, '🚪 Go inside', `${k}: the door button is back`);
    // a second visit: no second toast
    const again = await t.ev((k) => { T.act(); T.step(5); const n = T.toasts.filter((m) => m === CFG.AF_IN.ROOMS[k].toast).length; return { area: Game.area, n }; }, k);
    t.expect(again.area === k && again.n === 1, `${k}: in again, the toast only once`);
  }

  // ======== the terminal: check-in, security, the lounge ========
  // (the walk-everywhere checks above tried things on the way: start the counting afresh)
  await t.ev(() => { for (const k of Object.keys(Game.s.afIn)) if (typeof Game.s.afIn[k] === 'number') Game.s.afIn[k] = 0; AirfieldInsideExt.home(Game); });
  await t.ev(() => { Game.s.cash = 0; const R = CFG.AF_IN.ROOMS.afterminal; T.tp(R.EXIT.x, R.EXIT.y - 8, 'afterminal'); T.step(2); });
  const size = await t.ev(() => { const A = CFG.AF_IN.ROOMS.afterminal.ROOM; return [A.x1 - A.x0, A.y1 - A.y0]; });
  t.expect(size[0] >= 900 && size[1] >= 560, `terminal: about twice the old room (${size})`);
  t.expectEq(await t.ev(() => T.hint()), 'Check in at the desk! 🎫', 'terminal: check-in hint first');
  await t.shot('terminal');
  // check in: a boarding pass, and the big suitcase rides off along the belt behind the desk
  await t.ev(() => { const R = CFG.AF_IN.ROOMS.afterminal; T.tp(R.CHECKIN.x, R.CHECKIN.y, 'afterminal'); });
  t.expectEq(await t.ev(() => T.label()), '🎫 Check in', 'terminal: check-in label at the desk');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => Game.s.afIn.checkins === 1 && AirfieldInsideExt.st.agent > 0 && Game.floats.some((f) => f.text === '🎫 Boarding pass!')), 'terminal: checked in, a boarding pass');
  const ride = await t.ev(() => { const E = AirfieldInsideExt, R = CFG.AF_IN.ROOMS.afterminal, a = E.checkBagPos(); T.step(90); const b = E.checkBagPos(); T.step(140); return { a, b, gone: !E.st.checkBag || E.checkBagPos().gone, scale: R.SCALE, beltY: R.BELT_Y }; });
  t.expect(ride.a && ride.b && Math.abs(ride.a.x - ride.scale.x) < 2 && ride.b.x < ride.a.x - 20 && ride.b.y === ride.beltY && ride.gone, `terminal: the checked suitcase rides off along the belt (${JSON.stringify(ride)})`);
  await t.ev(() => { const R = CFG.AF_IN.ROOMS.afterminal; T.tp(R.CHECKIN.x, R.CHECKIN.y, 'afterminal'); T.act(); T.step(50); });
  await t.shot('terminal-checkin');
  // security: the bag on the belt, through the X-ray (the screen shows a pizza and a teddy), out the far end
  t.expectEq(await t.ev(() => T.hint()), 'Put your bag on the belt! 🧳', 'terminal: the X-ray belt next');
  t.expect(await t.ev(() => { const R = CFG.AF_IN.ROOMS.afterminal, h = Game.hint.target; return !!h && h.x === R.TRAY_SPOT.x && h.y === R.TRAY_SPOT.y; }), 'terminal: the hint points at the grey tray');
  await t.ev(() => { const R = CFG.AF_IN.ROOMS.afterminal; T.tp(R.TRAY_SPOT.x, R.TRAY_SPOT.y, 'afterminal'); });
  t.expectEq(await t.ev(() => T.label()), '🧳 Put your bag on the belt', 'terminal: tray label');
  const xr = await t.ev(() => {
    const E = AirfieldInsideExt; E.st.bag = 12; T.act(); T.step(2);
    const r = { ph0: E.xrayPhase(), carried: E.st.bag, n: Game.s.afIn.xrays, floats: Game.floats.map((f) => f.text), label: T.label() };
    const p0 = E.xbagPos(); T.step(30); const p1 = E.xbagPos(); r.rides = !!(p0 && p1 && p1.y < p0.y - 20);
    T.until(() => E.xrayPhase() === 'scan', 200); T.step(30);
    r.ph1 = E.xrayPhase(); r.hidden = E.xbagPos() === null; r.items = E.st.xray.items.map((i) => i[0]); r.hint = T.hint();
    return r;
  });
  t.expect(xr.ph0 === 'in' && xr.carried === 0 && xr.n === 1 && xr.floats.includes('On the belt! 🧳') && xr.label !== '🧳 Put your bag on the belt', `terminal: the bag goes on the belt (${JSON.stringify(xr)})`);
  t.expect(xr.rides, 'terminal: the bag rides along the belt towards the X-ray');
  t.expect(xr.ph1 === 'scan' && xr.hidden, 'terminal: inside the X-ray tunnel');
  t.expectEq(xr.items.join(','), 'pizza,teddy', 'terminal: the X-ray finds a pizza and a teddy');
  t.expectEq(xr.hint, 'Look! The X-ray sees inside your bag 👀', 'terminal: X-ray hint');
  await t.shot('terminal-xray');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.step(2); });
  await t.shot('terminal-xray-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });
  // the scanner arch: '🚶 Walk through' walks the chef through it: green lights, "Beep! All clear", the guard waves
  t.expectEq(await t.ev(() => { T.until(() => AirfieldInsideExt.xrayPhase() !== 'scan', 300); T.step(1); return T.hint(); }), 'Walk through the scanner! 🚶', 'terminal: the scanner arch next');
  await t.ev(() => { const R = CFG.AF_IN.ROOMS.afterminal; T.tp(R.ARCH_SPOT.x, R.ARCH_SPOT.y, 'afterminal'); });
  t.expectEq(await t.ev(() => T.label()), '🚶 Walk through', 'terminal: walk-through label at the arch');
  const thru = await t.ev(() => {
    const E = AirfieldInsideExt, R = CFG.AF_IN.ROOMS.afterminal; T.act();
    const walking = !!E.st.walk, l = T.label(); let crossed = null;
    const n = T.until(() => { if (crossed === null && Game.player.y < R.PART_Y) crossed = { beeps: Game.s.afIn.beeps }; return !E.st.walk; }, 300);
    return { walking, l, n, crossed, y: Game.player.y, x: Game.player.x, beeps: Game.s.afIn.beeps, beep: E.st.beep, hint: T.hint(), walkThrus: Game.s.afIn.walkThrus, partY: R.PART_Y };
  });
  t.expect(thru.walking && thru.l === null && thru.n > 20, `terminal: walking through the arch, no button meanwhile (${JSON.stringify(thru)})`);
  t.expect(thru.y < thru.partY - 30 && thru.beeps === 1 && thru.beep > 0 && thru.walkThrus === 1, `terminal: through to the lounge, all clear (${JSON.stringify(thru)})`);
  t.expectEq(thru.hint, 'Beep! All clear ✅', 'terminal: all-clear hint');
  await t.ev(() => { T.step(4); });
  await t.shot('terminal-allclear');
  // the bag comes out the far end: pick it up
  const pick = await t.ev(() => {
    const E = AirfieldInsideExt, R = CFG.AF_IN.ROOMS.afterminal; T.until(() => E.st.bagReady, 400); T.step(120);
    const hint = T.hint(), tgt = Game.hint && Game.hint.target, at = E.xbagPos();
    T.tp(R.PICK_SPOT.x, R.PICK_SPOT.y, 'afterminal'); const label = T.label(); T.act(); T.step(2);
    return { hint, toPick: !!tgt && tgt.x === R.PICK_SPOT.x, at, belt: R.XBELT, label, bag: E.st.bag, ready: E.st.bagReady, n: Game.s.afIn.pickups, floats: Game.floats.map((f) => f.text) };
  });
  t.expectEq(pick.hint, 'Pick up your bag! 🧳', 'terminal: pick-up hint');
  t.expect(pick.toPick && pick.at && pick.at.y < pick.belt.y0 + 30, `terminal: the bag waits at the lounge end of the belt (${JSON.stringify(pick)})`);
  t.expectEq(pick.label, '🧳 Pick up your bag', 'terminal: pick-up label');
  t.expect(pick.bag > 29 && !pick.ready && pick.n === 1 && pick.floats.includes('Got my bag! 🧳'), `terminal: carrying the bag (${JSON.stringify(pick)})`);
  await t.ev(() => { const R = CFG.AF_IN.ROOMS.afterminal; T.tp(R.PICK_SPOT.x + 30, R.PICK_SPOT.y + 30, 'afterminal'); T.step(2); });
  await t.shot('terminal-pickup');
  // the glass wall: no way between the hall and the lounge except through the arch; walking through by hand beeps too
  const glass = await t.ev(() => {
    const R = CFG.AF_IN.ROOMS.afterminal, out = [];
    for (const x of [27100, 27300, 27470, 27650, 27800, 27950]) { T.tp(x, R.PART_Y - 40, 'afterminal'); T.steer(0, 1); T.step(60); T.unsteer(); if (Game.player.y > R.PART_Y) out.push(x); AirfieldInsideExt.resetRoom(); }
    T.step(120);
    const b0 = Game.s.afIn.beeps; T.tp(R.ARCH_BACK.x, R.ARCH_BACK.y, 'afterminal'); T.steer(0, 1); const n = T.until(() => Game.player.y > R.PART_Y + 30, 200); T.unsteer();
    return { through: out, n, beeped: Game.s.afIn.beeps - b0 };
  });
  t.expectEq(glass.through.join(','), '', 'terminal: the glass wall keeps the lounge apart');
  t.expect(glass.n > 0 && glass.beeped === 1, `terminal: walking back through the arch by hand beeps all clear (${JSON.stringify(glass)})`);
  t.expectEq(await t.ev(() => { T.step(140); const R = CFG.AF_IN.ROOMS.afterminal; T.tp(R.ARCH_SPOT.x, R.ARCH_SPOT.y, 'afterminal'); return T.label(); }), '🚶 Walk through', 'terminal: the button walks you through from the hall side again');
  // the lounge: the seats facing the big window
  t.expectEq(await t.ev(() => { const R = CFG.AF_IN.ROOMS.afterminal; T.tp(R.ARCH_BACK.x, R.ARCH_BACK.y - 30, 'afterminal'); T.step(2); return T.hint(); }), 'Have a seat and wait for your plane 💺', 'terminal: seat hint in the lounge');
  const seat = await t.ev(() => {
    const R = CFG.AF_IN.ROOMS.afterminal, x = R.SEAT_XS[1], y = R.SEAT_YS[0]; T.tp(x, y + 4, 'afterminal');
    const label = T.label(); T.act(); T.step(2);
    const sat = !!AirfieldInsideExt.st.seat, l2 = T.label(), hint = T.hint();
    T.steer(0, 1); T.step(10); T.unsteer();   // a little nudge does not get you up
    const stay = !!AirfieldInsideExt.st.seat && Math.hypot(Game.player.x - x, Game.player.y - y) < 1;
    return { label, sat, l2, hint, stay, sits: Game.s.afIn.sits };
  });
  t.expectEq(seat.label, '💺 Sit down', 'terminal: sit label on a seat');
  t.expect(seat.sat && seat.stay && seat.sits === 1, `terminal: sitting, and staying put (${JSON.stringify(seat)})`);
  t.expectEq(seat.l2, '🚶 Stand up', 'terminal: stand-up label');
  t.expectEq(seat.hint, 'Ding-dong! Your plane is boarding soon 🔔', 'terminal: seated hint');
  await t.shot('terminal-seat');
  t.expect(await t.ev(() => { T.act(); T.step(2); return !AirfieldInsideExt.st.seat && AirfieldInsideExt.free(Game, Game.player.x, Game.player.y); }), 'terminal: stood up on free floor');
  t.expect(await t.ev(() => { const R = CFG.AF_IN.ROOMS.afterminal; T.tp(R.SEAT_XS[0], R.SEAT_YS[1], 'afterminal'); T.act(); T.steer(1, 0); T.step(40); T.unsteer(); return !AirfieldInsideExt.st.seat; }), 'terminal: pushing the stick for a moment gets you up');
  // the gift shop's toy plane, $3
  await t.ev(() => { Game.s.cash = 10; T.step(1); });
  t.expectEq(await t.ev(() => { const R = CFG.AF_IN.ROOMS.afterminal; T.tp(R.ARCH_BACK.x - 60, R.ARCH_BACK.y - 30, 'afterminal'); T.step(1); return T.hint(); }), 'Buy a toy plane at the gift shop! ✈️', 'terminal: toy plane hint with cash in hand');
  const toy = await t.ev(() => { const P = CFG.AF_IN.ROOMS.afterminal.TOY_PAD; T.tp(P.x, P.y, 'afterminal'); const n = T.until(() => Game.s.afIn.toys > 0, 600); return { n, cash: Game.s.cash, toy: AirfieldInsideExt.st.toy, floats: Game.floats.map((f) => f.text) }; });
  t.expect(toy.n >= 0 && toy.toy > 0 && toy.floats.includes('Zoom! A toy plane! ✈️'), `terminal: a toy plane (${JSON.stringify(toy)})`);
  t.expectEq(toy.cash, 7, 'terminal: the toy plane cost $3');
  await t.ev(() => { const P = CFG.AF_IN.ROOMS.afterminal.TOY_PAD; T.tp(P.x + 60, P.y - 20, 'afterminal'); T.step(4); });
  await t.shot('terminal-toy');
  // on to Gate 1 through the doorway in the east wall
  t.expectEq(await t.ev(() => T.hint()), 'Walk on to Gate 1 and the big jet! 🛫', 'terminal: Gate 1 hint');
  const gate = await t.ev(() => { const R = CFG.AF_IN.ROOMS.afterminal; T.tp(R.GATE_DOOR.x, R.GATE_DOOR.y, 'afterminal'); const label = T.label(); T.act(); T.step(3); const G = CFG.AF_IN.ROOMS.afgate; return { label, area: Game.area, d: Math.hypot(Game.player.x - G.EXIT.x, Game.player.y - (G.EXIT.y - 8)), n: Game.s.afIn.toGates }; });
  t.expect(gate.label === '🛫 Go to Gate 1' && gate.area === 'afgate' && gate.d < 2 && gate.n === 1, `terminal: through to Gate 1 (${JSON.stringify(gate)})`);
  // back in the terminal's lounge: the way out is back through security; then baggage claim in the hall
  t.expectEq(await t.ev(() => { const R = CFG.AF_IN.ROOMS.afterminal; T.tp(R.TOY_PAD.x + 80, R.TOY_PAD.y, 'afterminal'); T.step(2); return T.hint(); }), 'Back through security to the way out 🚪', 'terminal: lounge all done: back through security');
  t.expectEq(await t.ev(() => { const R = CFG.AF_IN.ROOMS.afterminal; AirfieldInsideExt.st.bag = 0; T.tp(R.ARCH_BACK.x, R.ARCH_BACK.y, 'afterminal'); T.act(); T.until(() => !AirfieldInsideExt.st.walk, 300); T.step(150); return T.hint(); }), 'Grab a bag from the baggage carousel! 🧳', 'terminal: baggage claim hint in the hall (once the bag from security is put away)');
  await t.ev(() => { AirfieldInsideExt.st.bag = 0; const S = CFG.AF_IN.ROOMS.afterminal.BAG_SPOT; T.tp(S.x, S.y, 'afterminal'); });
  t.expectEq(await t.ev(() => T.label()), '🧳 Grab your bag', 'terminal: grab label by the carousel');
  const bag = await t.ev(() => { T.act(); T.step(2); return { bag: AirfieldInsideExt.st.bag, bags: Game.s.afIn.bags, label: T.label(), floats: Game.floats.map((f) => f.text) }; });
  t.expect(bag.bag > 29 && bag.bags === 1 && bag.floats.includes('Got my bag! 🧳') && bag.label !== '🧳 Grab your bag', `terminal: a bag off the carousel (${JSON.stringify(bag)})`);
  t.expectEq(await t.ev(() => T.hint()), 'Back outside through the door 🚪', 'terminal: the exit hint once everything is done');
  // the bag and the toy are gone after half a minute; the board flipped meanwhile
  const later = await t.ev(() => { const n0 = AirfieldInsideExt.st.flipN; T.step(60 * 31); return { bag: AirfieldInsideExt.st.bag, toy: AirfieldInsideExt.st.toy, flips: AirfieldInsideExt.st.flipN - n0 }; });
  t.expect(later.bag === 0 && later.toy === 0, 'terminal: bag and toy last half a minute');
  t.expect(later.flips >= 5, `terminal: the departures board keeps flipping (${later.flips})`);
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const R = CFG.AF_IN.ROOMS.afterminal; T.tp(R.ARCH_SPOT.x + 20, R.ARCH_SPOT.y + 40, 'afterminal'); T.step(2); });
  await t.shot('terminal-phone');
  await t.ev(() => { const R = CFG.AF_IN.ROOMS.afterminal; T.tp(R.SEAT_XS[0] - 60, R.SEAT_YS[1] + 30, 'afterminal'); T.step(2); });
  await t.shot('terminal-lounge-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ======== the hangar ========
  await t.ev(() => { const R = CFG.AF_IN.ROOMS.afhangar; T.tp(R.EXIT.x, R.EXIT.y - 8, 'afhangar'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Say hi to the mechanic under the plane 🔧', 'hangar: mechanic hint first');
  await t.shot('hangar');
  await t.ev(() => { const S = CFG.AF_IN.ROOMS.afhangar.MECH_SPOT; T.tp(S.x, S.y, 'afhangar'); });
  t.expectEq(await t.ev(() => T.label()), '👋 Say hi', 'hangar: say-hi label by the mechanic');
  await t.ev(() => { T.act(); T.step(3); });
  t.expect(await t.ev(() => AirfieldInsideExt.st.mech > 0 && Game.s.afIn.mechs === 1 && AirfieldInsideExt.st.sparks.length > 3), 'hangar: the mechanic says hi, sparks fly');
  await t.shot('hangar-mechanic');
  t.expectEq(await t.ev(() => T.hint()), 'Drive the tug out to the planes! 🚜', 'hangar: the tug next');
  await t.ev(() => { const S = CFG.AF_IN.ROOMS.afhangar.TUG_SPOT; T.tp(S.x, S.y, 'afhangar'); });
  t.expectEq(await t.ev(() => T.label()), '🚜 Drive the tug', 'hangar: tug label');
  await t.ev(() => { T.act(); T.step(3); });
  const tug = await t.ev(() => { const T0 = CFG.AF_IN.ROOMS.afhangar.TUG; return { tug: !!AirfieldInsideExt.st.tug, tugs: Game.s.afIn.tugs, label: T.label(), hint: T.hint(), floats: Game.floats.map((f) => f.text), d: Math.hypot(Game.player.x - (T0.x - 10), Game.player.y - (T0.y + 2)) }; });
  t.expect(tug.tug && tug.tugs === 1 && tug.d < 1 && tug.floats.includes('Toot toot! 🚜'), `hangar: at the wheel of the tug, toot toot (${JSON.stringify(tug)})`);
  t.expectEq(tug.label, null, 'hangar: no button while the tug starts off');
  t.expectEq(tug.hint, 'Toot toot! Off we go! 🚜', 'hangar: tug hint');
  await t.shot('hangar-tug');
  const out = await t.ev(() => { T.step(60); const v = Game.vehicle, H = CFG.AIRFIELD.GSE.tug; return { area: Game.area, driving: Game.driving, kind: v && v.kind, d: v ? Math.hypot(v.x - H.x, v.y - H.y) : -1, busy: AirfieldInsideExt.busy() }; });
  t.expect(out.area === 'town' && out.driving && out.kind === 'bagtug' && out.d < 1 && !out.busy, `hangar: drove out at the wheel of the bag train on the apron (${JSON.stringify(out)})`);
  await t.ev(() => { Game.exitCar(); const R = CFG.AF_IN.ROOMS.afhangar; T.tp(R.EXIT.x, R.EXIT.y - 8, 'afhangar'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Back outside through the door 🚪', 'hangar: the exit hint once everything is done');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const R = CFG.AF_IN.ROOMS.afhangar; T.tp(R.TUG_SPOT.x - 60, R.TUG_SPOT.y, 'afhangar'); T.step(2); });
  await t.shot('hangar-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ======== the control tower ========
  await t.ev(() => { const R = CFG.AF_IN.ROOMS.aftower; T.tp(R.EXIT.x, R.EXIT.y - 8, 'aftower'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Go up to the top of the tower! ⬆️', 'tower: climb hint first');
  await t.shot('tower');
  await t.ev(() => { const F = CFG.AF_IN.ROOMS.aftower.FOOT; T.tp(F.x, F.y, 'aftower'); });
  t.expectEq(await t.ev(() => T.label()), '⬆️ Up to the top', 'tower: climb label at the stairs');
  await t.ev(() => { T.act(); T.step(3); });
  t.expectEq(await t.ev(() => T.hint()), 'Up, up, up the stairs! ⬆️', 'tower: climbing hint');
  const up = await t.ev(() => { const n = T.until(() => !AirfieldInsideExt.st.climb, 200); const F = CFG.AF_IN.ROOMS.aftower.FOOT; T.step(2); return { n, up: AirfieldInsideExt.st.up, d: Math.hypot(Game.player.x - F.x, Game.player.y - F.y), climbs: Game.s.afIn.climbs, label: T.label(), hint: T.hint(), key: AirfieldInsideExt.bgKey(Game), exit: Game.obstacles().length }; });
  t.expect(up.n >= 0 && up.up && up.d < 1 && up.climbs === 1, `tower: up in the cab at the top of the stairs (${JSON.stringify(up)})`);
  t.expectEq(up.label, '⬇️ Go downstairs', 'tower: go-down label at the top of the stairs');
  t.expectEq(up.hint, 'Look out with the binoculars! 🔭', 'tower: binoculars hint up top');
  t.expectEq(up.key, 'afTwrUp', 'tower: the cab has its own picture');
  t.expect(await t.ev(() => { const R = CFG.AF_IN.ROOMS.aftower; T.tp(R.EXIT.x, R.EXIT.y - 8, 'aftower'); T.step(1); return T.label() !== '🚪 Go outside'; }), 'tower: no way outside from the cab');
  await t.shot('tower-cab');
  // the binoculars: the runway with the planes, live
  await t.ev(() => { const B = CFG.AF_IN.ROOMS.aftower.BINO_SPOT; T.tp(B.x, B.y, 'aftower'); });
  t.expectEq(await t.ev(() => T.label()), '🔭 Look out', 'tower: look-out label by the binoculars');
  await t.ev(() => { T.act(); T.step(30); });
  const look = await t.ev(() => ({ viewing: !!AirfieldInsideExt.st.viewing, looks: Game.s.afIn.looks, label: T.label(), hint: T.hint() }));
  t.expect(look.viewing && look.looks === 1, 'tower: looking out');
  t.expectEq(look.label, '🚶 Done looking', 'tower: done-looking label');
  t.expectEq(look.hint, 'Look at the planes! 🔭', 'tower: looking hint');
  await t.shot('tower-lookout');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.step(2); });
  await t.shot('tower-lookout-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });
  // a plane taking off shows up in the look-out: the view follows it
  const follow = await t.ev(() => {
    const rt = AirfieldExt.rt; let drawn = 0; const orig = AirfieldExt.drawPlaneTop; AirfieldExt.drawPlaneTop = function (...a) { drawn++; return orig.apply(this, a); };
    Render.draw(Game); AirfieldExt.drawPlaneTop = orig;
    return { drawn, planes: rt.planes.filter((v) => !v.away).length };
  });
  t.expectEq(follow.drawn, follow.planes, 'tower: every plane on the airfield is drawn in the look-out');
  t.expect(await t.ev(() => { T.act(); T.step(2); return !AirfieldInsideExt.st.viewing; }), 'tower: done looking');
  t.expect(await t.ev(() => { T.act(); T.step(60 * 8); return !AirfieldInsideExt.st.viewing; }), 'tower: the look-out ends by itself after a while');
  // the microphone
  t.expectEq(await t.ev(() => T.hint()), 'Clear a plane for take-off! 🎙️', 'tower: microphone hint next');
  await t.ev(() => { const M = CFG.AF_IN.ROOMS.aftower.MIC_SPOT; T.tp(M.x, M.y, 'aftower'); });
  t.expectEq(await t.ev(() => T.label()), '🎙️ Clear for take-off!', 'tower: microphone label');
  await t.ev(() => { T.act(); T.step(40); });
  const clear = await t.ev(() => ({ clear: AirfieldInsideExt.st.clear, clears: Game.s.afIn.clears, hint: T.hint() }));
  t.expect(clear.clear > 0 && clear.clears === 1, 'tower: cleared for take-off');
  t.expectEq(clear.hint, 'Pizza Air is cleared for take-off! ✈️', 'tower: radio-call hint');
  await t.shot('tower-clear');
  t.expectEq(await t.ev(() => { T.step(60 * 4); return T.hint(); }), 'Go back down the stairs ⬇️', 'tower: then back down');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const R = CFG.AF_IN.ROOMS.aftower; T.tp(R.CTRL.x + 40, R.CTRL.y + 60, 'aftower'); T.step(2); });
  await t.shot('tower-cab-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });
  const down = await t.ev(() => { const F = CFG.AF_IN.ROOMS.aftower.FOOT; T.tp(F.x, F.y, 'aftower'); T.act(); const n = T.until(() => !AirfieldInsideExt.st.climb, 200); T.step(2); return { n, up: AirfieldInsideExt.st.up, label: T.label(), free: AirfieldInsideExt.free(Game, Game.player.x, Game.player.y) }; });
  t.expect(down.n >= 0 && !down.up && down.free, 'tower: back down on the ground floor');
  t.expectEq(down.label, '⬆️ Up to the top', 'tower: climb label again downstairs');
  // a push into the console up top lands at the top of the stairs
  const cabRescue = await t.ev(() => { const F = CFG.AF_IN.ROOMS.aftower.FOOT; T.tp(F.x, F.y, 'aftower'); T.act(); T.until(() => !AirfieldInsideExt.st.climb, 200); const D = CFG.AF_IN.ROOMS.aftower.DESK; T.tp((D.x0 + D.x1) / 2, D.y0 + 10, 'aftower'); T.step(2); return Math.hypot(Game.player.x - F.x, Game.player.y - F.y); });
  t.expect(cabRescue < 1, 'tower: pushed into the console up top: back at the top of the stairs');
  await t.ev(() => { const F = CFG.AF_IN.ROOMS.aftower.FOOT; T.tp(F.x, F.y, 'aftower'); T.act(); T.until(() => !AirfieldInsideExt.st.climb, 200); T.step(2); });
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const R = CFG.AF_IN.ROOMS.aftower; T.tp(R.EXIT.x, R.EXIT.y - 30, 'aftower'); T.step(2); });
  await t.shot('tower-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ======== the workshop ========
  await t.ev(() => { Game.s.cash = 10; const R = CFG.AF_IN.ROOMS.afworkshop; T.tp(R.EXIT.x, R.EXIT.y - 8, 'afworkshop'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Spin the propeller! 🌀', 'workshop: propeller hint first');
  await t.shot('workshop');
  await t.ev(() => { const S = CFG.AF_IN.ROOMS.afworkshop.PROP_SPOT; T.tp(S.x, S.y, 'afworkshop'); });
  t.expectEq(await t.ev(() => T.label()), '🌀 Spin the propeller', 'workshop: propeller label');
  const spin = await t.ev(() => { const a0 = AirfieldInsideExt.st.propA; T.act(); T.step(20); return { v: AirfieldInsideExt.st.propV, turned: AirfieldInsideExt.st.propA - a0, spins: Game.s.afIn.spins, floats: Game.floats.map((f) => f.text) }; });
  t.expect(spin.v > 0 && spin.turned > 5 && spin.spins === 1 && spin.floats.includes('Whirrr! 🌀'), `workshop: the propeller whirrs round (${JSON.stringify(spin)})`);
  await t.shot('workshop-propeller');
  t.expect(await t.ev(() => { T.step(60 * 5); return AirfieldInsideExt.st.propV === 0; }), 'workshop: the propeller slows down again');
  t.expectEq(await t.ev(() => T.hint()), 'Squeeze the vice on the workbench! 🗜️', 'workshop: vice hint next');
  await t.ev(() => { const S = CFG.AF_IN.ROOMS.afworkshop.VICE_SPOT; T.tp(S.x, S.y, 'afworkshop'); });
  t.expectEq(await t.ev(() => T.label()), '🗜️ Squeeze the vice', 'workshop: vice label');
  await t.ev(() => { T.act(); T.step(20); });
  t.expect(await t.ev(() => AirfieldInsideExt.st.vice > 0 && Game.s.afIn.vices === 1 && Game.floats.some((f) => f.text === 'Squeeze! 🗜️')), 'workshop: squeezing the vice');
  t.expectEq(await t.ev(() => T.hint()), 'Say hi to the mechanic! 👋', 'workshop: mechanic hint next');
  await t.ev(() => { const S = CFG.AF_IN.ROOMS.afworkshop.HI_SPOT; T.tp(S.x, S.y, 'afworkshop'); });
  t.expectEq(await t.ev(() => T.label()), '👋 Say hi', 'workshop: say-hi label');
  await t.ev(() => { T.act(); T.step(10); });
  t.expect(await t.ev(() => !!AirfieldInsideExt.st.hello && AirfieldInsideExt.st.hello.t > 0 && Game.s.afIn.hellos === 1), 'workshop: the mechanic hops and waves');
  await t.shot('workshop-hello');
  t.expectEq(await t.ev(() => { T.step(1); return T.hint(); }), 'Get your own toolbox! 🧰', 'workshop: toolbox hint with cash in hand');
  const box = await t.ev(() => { const P = CFG.AF_IN.ROOMS.afworkshop.TOOL_PAD; T.tp(P.x, P.y, 'afworkshop'); const n = T.until(() => Game.s.afIn.toolboxes > 0, 600); return { n, cash: Game.s.cash, toolbox: AirfieldInsideExt.st.toolbox, floats: Game.floats.map((f) => f.text) }; });
  t.expect(box.n >= 0 && box.toolbox > 0 && box.floats.includes('My own toolbox! 🧰'), `workshop: a toolbox (${JSON.stringify(box)})`);
  t.expectEq(box.cash, 6, 'workshop: the toolbox cost $4');
  t.expectEq(await t.ev(() => T.hint()), 'Back outside through the door 🚪', 'workshop: the exit hint once everything is done');
  await t.ev(() => { const P = CFG.AF_IN.ROOMS.afworkshop.TOOL_PAD; T.tp(P.x - 70, P.y - 30, 'afworkshop'); T.step(2); });
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.step(2); });
  await t.shot('workshop-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- a reload or a push into a wall lands back on the mat, in every building
  for (const k of ROOMS) {
    const res = await t.ev((k) => { const R = CFG.AF_IN.ROOMS[k], A = R.ROOM; T.tp(A.x0 - 8, (A.y0 + A.y1) / 2, k); T.step(3); return { d: Math.hypot(Game.player.x - R.EXIT.x, Game.player.y - (R.EXIT.y - 8)), oops: Game.floats.some((f) => f.text === 'Oops! Back inside') }; }, k);
    t.expect(res.d < 1 && res.oops, `${k}: pushed into the wall: back on the mat (${JSON.stringify(res)})`);
  }
  // a saved spot inside the furniture after a reload: back on the mat (once index.html loads the file; until then the
  // same restore is played in place: the saved map and spot put back, then a step)
  await t.ev(() => { const C = CFG.AF_IN.ROOMS.afterminal.CAROUSEL; Game.area = 'afterminal'; Game.player.x = C.x; Game.player.y = C.y; Game.save(); });
  const wired = await t.ev(async () => (await (await fetch('index.html')).text()).includes('js/airfield-inside.js'));
  if (wired) await t.reload();
  else await t.ev(() => { const pos = Game.s.pos; Game.area = 'town'; Game.player.x = 540; Game.player.y = 430; T.step(1); Game.area = pos.area; Game.player.x = pos.x; Game.player.y = pos.y; Game.cameraSnap = true; });
  const reloaded = await t.ev(() => { T.step(3); const R = CFG.AF_IN.ROOMS.afterminal; return { area: Game.area, d: Math.hypot(Game.player.x - R.EXIT.x, Game.player.y - (R.EXIT.y - 8)), seen: Game.s.afIn.seen.afterminal }; });
  t.expect(reloaded.area === 'afterminal' && reloaded.d < 1 && reloaded.seen, `after a reload inside the carousel: on the mat (${JSON.stringify(reloaded)})`);

  // ---- Take-me-home from inside: sitting in the terminal, in the tug, up the tower looking out
  for (const [k, setup] of [['afterminal', 'seat'], ['afhangar', 'tug'], ['aftower', 'look']]) {
    const home = await t.ev(([k, setup]) => {
      const R = CFG.AF_IN.ROOMS[k], E = AirfieldInsideExt;
      if (setup === 'seat') { T.tp(R.SEAT_XS[2], R.SEAT_YS[0], k); T.act(); }
      if (setup === 'tug') { T.tp(R.TUG_SPOT.x, R.TUG_SPOT.y, k); T.act(); E.st.bag = 20; }
      if (setup === 'look') { T.tp(R.FOOT.x, R.FOOT.y, k); T.act(); T.until(() => !E.st.climb, 200); T.tp(R.BINO_SPOT.x, R.BINO_SPOT.y, k); T.act(); }
      const busy = E.busy() || E.st.up;
      Game.goHome(); T.step(3);
      const S = CFG.PLAYER_START, st = E.st;
      return { busy, area: Game.area, d: Math.hypot(Game.player.x - S.x, Game.player.y - S.y), clear: !st.seat && !st.tug && !st.up && !st.viewing && !st.climb && st.bag === 0, hint: E.hint(Game) };
    }, [k, setup]);
    t.expect(home.busy, `${k}: ${setup} before Take-me-home`);
    t.expect(home.area === 'town' && home.d < 2, `${k}: Take-me-home goes back to the pizzeria`);
    t.expect(home.clear, `${k}: Take-me-home clears the ${setup}`);
    t.expectEq(home.hint, undefined, `${k}: no airfield-inside hint in the pizzeria`);
  }
  await t.ev(() => { T.tp(540, 430, 'town'); T.step(1); });
};
