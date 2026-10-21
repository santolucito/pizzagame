'use strict';
// The post office in the City: the door's label and hint on Harbour Street, going inside (welcome toast, no stray hint),
// your PO box (open it, the "You've got mail" float, the refill a minute later), the $1 stamp machine and the album
// count, the $2 postcard and posting it into the red mailbox, the scale, the moving conveyor, a rescue from a wall,
// Take-me-home from inside, and going back out onto the door spot.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/city-post.js into index.html, load it into the booted page
  if (await t.ev(() => typeof PostExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-post.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof PostExt !== 'undefined' && !!CFG.AREAS.post), 'the post office extension and its map are registered');
  t.expect(await t.ev(() => Game.ext.indexOf(PostExt) < Game.ext.indexOf(CityExt)), 'the post office is ahead of the City in Game.ext');
  t.expect(await t.ev(() => { const W = CFG.POST.WORLD; return W.x0 === 12200 && W.y0 === 3000 && W.x1 === 12800 && W.y1 === 3400; }), 'the interior uses the rectangle reserved for City building 15');

  // ---- the door on Harbour Street
  await t.ev(() => { const D = CFG.POST.DOOR_OUT; T.tp(D.x, D.y + 55, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Visit the post office! 📮', 'post office hint near the door');
  t.expect(await t.ev(() => { const D = CFG.POST.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  t.expectEq(await t.ev(() => { const D = CFG.POST.DOOR_OUT; T.tp(D.x, D.y + 80, 'city'); T.step(2); return PostExt.hint(Game); }), undefined, 'no post office hint 80 px from the door');
  await t.ev(() => { Render.setZoom(1.2); const D = CFG.POST.DOOR_OUT; T.tp(D.x, D.y, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  await t.shot('door');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'post', 'inside the post office');
  t.expect(await t.ev(() => T.toasts.includes('📮 Welcome to the post office!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.POST.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => PostExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Open your PO box! 📬', 'PO box hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, s = CFG.POST.BOX_SPOT; return !!h.target && h.target.x === s.x && h.target.y === s.y; }), 'the hint points at the spot under your box');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('inside');

  // ---- your PO box: open it, get the letter, it refills a minute later
  await t.ev(() => { const s = CFG.POST.BOX_SPOT; T.tp(s.x, s.y, 'post'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '📬 Open your box', 'open-box label at the spot');
  t.expect(await t.ev(() => !!PostExt.st.box.mail), 'there is mail in the box the first time');
  const mail = await t.ev(() => { T.act(); T.step(3); return { mail: PostExt.st.box.mail, got: Game.s.post.mail, floats: Game.floats.map((f) => f.text), pics: PostExt.st.pics.length, open: PostExt.st.box.open }; });
  t.expectEq(mail.mail, null, 'the box is empty after opening it');
  t.expectEq(mail.got, 1, 'one piece of mail counted');
  t.expect(mail.floats.includes("You've got mail! 💌"), 'the "You\'ve got mail" float');
  t.expect(mail.pics === 1 && mail.open > 0, 'the picture floats up out of the open door');
  await t.shot('mail');
  await t.ev(() => { T.act(); T.step(3); });
  t.expect(await t.ev(() => Game.floats.some((f) => f.text === 'Nothing yet… 📭')), 'an empty box says so');
  t.expectEq(await t.ev(() => T.hint() === 'Open your PO box! 📬'), false, 'the hint moves on once the box is empty');
  t.expect(await t.ev(() => { T.step(60 * 61); return !!PostExt.st.box.mail; }), 'the box has something in it again after a minute');
  t.expectEq(await t.ev(() => T.hint()), 'Open your PO box! 📬', 'the hint comes back with the mail');
  // the refill keeps going while the chef is elsewhere, and three refills in four bring something
  const refills = await t.ev(() => {
    const b = PostExt.st.box, out = [];
    for (let i = 0; i < 4; i++) { b.mail = null; b.timer = 0.05; T.step(5); out.push(!!b.mail); }
    return out;
  });
  t.expectEq(refills.filter((x) => x).length, 3, `three refills in four bring mail: ${JSON.stringify(refills)}`);
  await t.ev(() => { PostExt.st.box.mail = null; PostExt.st.box.timer = 60; T.step(1); });

  // ---- the $1 stamp machine fills the album on the wall
  const stamp = await t.ev(() => {
    Game.s.cash = 20; const P = CFG.POST.PADS.stamp; T.tp(P.x, P.y, 'post');
    const hint = T.hint();
    const n = T.until(() => Game.s.post.stamps > 0, 400);
    return { hint, n, cash: Game.s.cash, stamps: Game.s.post.stamps, floats: Game.floats.map((f) => f.text), pic: (() => { const q = PostExt.st.pics.find((qq) => qq.kind === 'stamp'); return !!q && CFG.POST.STAMPS.includes(q.pic); })() };
  });
  t.expectEq(stamp.hint, 'Buy a pretty stamp! 💮', 'stamp hint once the box is empty');
  t.expect(stamp.n >= 0, 'the machine sold a stamp');
  t.expectEq(stamp.cash, 19, 'the stamp cost $1');
  t.expectEq(stamp.stamps, 1, 'one stamp in the album');
  t.expect(stamp.floats.includes('A pretty stamp! 💮'), 'the stamp float');
  t.expect(stamp.pic, 'a stamp picture floats up');
  await t.shot('stamp');

  // ---- the $2 postcard, carried to the big red mailbox and posted
  const card = await t.ev(() => {
    const P = CFG.POST.PADS.card; T.tp(P.x, P.y, 'post');
    const hint = T.hint();
    const n = T.until(() => PostExt.st.card, 400);
    return { hint, n, cash: Game.s.cash, after: T.hint(), maxed: Game.allPads().find((p) => p.key === 'postCard').maxed };
  });
  t.expectEq(card.hint, 'Buy a postcard! 💌', 'postcard hint after the stamp');
  t.expect(card.n >= 0, 'the rack sold a postcard');
  t.expectEq(card.cash, 17, 'the postcard cost $2');
  t.expectEq(card.after, 'Pop it in the red mailbox! 📮', 'mailbox hint while carrying the postcard');
  t.expect(card.maxed, 'the postcard pad rests while one is carried');
  t.expect(await t.ev(() => { const h = Game.hint, M = CFG.POST.MAILBOX; return !!h.target && h.target.x === M.x && h.target.y === M.y; }), 'the hint points at the mailbox');
  await t.ev(() => { const M = CFG.POST.MAILBOX; T.tp(M.x, M.y + 30, 'post'); T.step(2); });
  await t.shot('postcard');
  t.expectEq(await t.ev(() => T.label()), '📮 Post it!', 'post label by the mailbox');
  const sent = await t.ev(() => { T.act(); T.step(3); return { card: PostExt.st.card, sent: Game.s.post.sent, fly: !!PostExt.st.fly, floats: Game.floats.map((f) => f.text), sparkles: Game.fx.filter((f) => f.kind === 'sparkle').length, label: T.label() }; });
  t.expectEq(sent.card, false, 'the postcard left the chef\'s hand');
  t.expectEq(sent.sent, 1, 'one postcard sent');
  t.expect(sent.fly, 'the postcard flies into the slot');
  t.expect(sent.floats.includes('Sent! ✈️'), 'the "Sent" float');
  t.expect(sent.sparkles >= 4, 'the stamp sparkles at the slot');
  t.expect(sent.label !== '📮 Post it!', 'no post button without a postcard');
  await t.shot('sent');
  t.expect(await t.ev(() => { T.step(60); return !PostExt.st.fly; }), 'the flight is over');

  // ---- the weighing scale: step on, get weighed, step off
  t.expectEq(await t.ev(() => T.hint()), 'Stand on the scale! ⚖️', 'scale hint after the postcard');
  const scale = await t.ev(() => { const S = CFG.POST.SCALE; T.tp(S.x, S.y, 'post'); T.step(3); return { on: PostExt.st.weigh, floats: Game.floats.map((f) => f.text), free: PostExt.free(S.x, S.y) }; });
  t.expect(scale.free, 'the scale is walk-through');
  t.expect(scale.on, 'standing on the scale');
  t.expect(scale.floats.includes('You weigh one chef! ⚖️'), 'the "one chef" float');
  await t.shot('scale');
  t.expect(await t.ev(() => { const S = CFG.POST.SCALE; T.tp(S.x, S.y + 60, 'post'); T.step(2); return !PostExt.st.weigh; }), 'stepped off the scale');
  t.expectEq(await t.ev(() => T.hint()), 'Shh, the mail cat is napping 🐱', 'the cat hint once everything is done');
  t.expect(await t.ev(() => { const S = CFG.POST.SCALE; Game.floats.length = 0; T.tp(S.x, S.y, 'post'); T.step(3); return Game.floats.some((f) => f.text === 'You weigh one chef! ⚖️'); }), 'stepping back on weighs the chef again');

  // ---- the parcel conveyor keeps moving
  const belt = await t.ev(() => { const a = PostExt.beltBoxes(Game).map((b) => Math.round(b.x)); T.step(30); const b = PostExt.beltBoxes(Game).map((x) => Math.round(x.x)); return { a, b, inside: PostExt.beltBoxes(Game).every((x) => x.x > CFG.POST.BELT.x0 - 14 && x.x < CFG.POST.BELT.x1 + 14) }; });
  t.expect(belt.a.length >= 2 && belt.a.join() !== belt.b.join(), `the parcels move along the belt (${belt.a} -> ${belt.b})`);
  t.expect(belt.inside, 'the parcels stay on the belt');

  // ---- a reload or push into a wall lands back on the mat
  await t.ev(() => { const R = CFG.POST.ROOM; T.tp(R.x0 - 10, 3200, 'post'); T.step(3); });
  t.expect(await t.ev(() => PostExt.free(Game.player.x, Game.player.y)), 'pushed into the wall: rescued onto the floor');
  t.expect(await t.ev(() => { const E = CFG.POST.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'the rescue lands on the exit mat');
  await t.ev(() => { const C = CFG.POST.COUNTER; T.tp((C.x0 + C.x1) / 2, (C.y0 + C.y1) / 2, 'post'); T.step(3); });
  t.expect(await t.ev(() => PostExt.free(Game.player.x, Game.player.y)), 'dropped onto the counter: rescued');
  t.expect(await t.ev(() => { const M = CFG.POST.MAILBOX; T.tp(M.x, M.y, 'post'); T.step(3); return PostExt.free(Game.player.x, Game.player.y); }), 'dropped into the mailbox: rescued');

  // ---- phone-size hall
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const s = CFG.POST.BOX_SPOT; T.tp(s.x + 60, s.y + 60, 'post'); T.step(2); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- Take-me-home from inside, carrying a postcard
  await t.ev(() => { PostExt.st.card = true; T.tp(12500, 3220, 'post'); T.step(2); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'Take-me-home leaves the post office');
  t.expect(await t.ev(() => !PostExt.st.card && !PostExt.st.fly), 'the postcard and the flight are cleared by Take-me-home');
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');
  t.expectEq(await t.ev(() => PostExt.hint(Game)), undefined, 'no post office hint in the town');
  t.expectEq(await t.ev(() => PostExt.action(Game)), null, 'no post office button in the town');

  // ---- out through the door: back on the sidewalk at the door spot
  await t.ev(() => { const E = CFG.POST.EXIT; T.tp(E.x, E.y, 'post'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back outside in the City');
  t.expect(await t.ev(() => { const D = CFG.POST.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the door spot');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door offers going back in');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '📮 Welcome to the post office!').length === 1), 'the welcome toast shows only once');
  // the stamps are saved
  await t.ev(() => Game.save());
  await t.reload();
  if (await t.ev(() => typeof PostExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-post.js' }); await t.ev(() => T.step(2)); }
  t.expectEq(await t.ev(() => Game.s.post.stamps), 1, 'the stamp album survives a reload');

  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
