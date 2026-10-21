'use strict';
// The bookshop in the City: the door's label and hint on the sidewalk, going inside (welcome toast, hint to the ladder),
// the rolling ladder ride (climb, slide along the bookcase, climb down, staying put meanwhile), the beanbag and the
// three-page picture book with the catalog buttons, the spinning globe, the storyteller cat, the smiling librarian,
// the $4 bookmark (the book remembers your page) and the $7 comic, a rescue from a wall, Take-me-home from the ladder,
// and going back out onto the door spot.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/city-books.js into index.html, load it into the booted page
  if (await t.ev(() => typeof BooksExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-books.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof BooksExt !== 'undefined' && !!CFG.AREAS.books), 'the bookshop extension and its map are registered');
  t.expect(await t.ev(() => { const b = CFG.CITY.BUILDINGS[CFG.BOOKS.BUILDING], D = CFG.BOOKS.DOOR_OUT; return b.sign === 'BOOKS' && D.x === (b.x0 + b.x1) / 2 && D.y === b.y1 + 14; }), 'the door spot sits below the BOOKS building door');

  // ---- the door on Bus Street
  await t.ev(() => { const D = CFG.BOOKS.DOOR_OUT; T.tp(D.x, D.y + 70, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Visit the bookshop! 📚', 'bookshop hint near the door');
  t.expect(await t.ev(() => { const D = CFG.BOOKS.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  await t.ev(() => { Render.setZoom(1.2); const D = CFG.BOOKS.DOOR_OUT; T.tp(D.x, D.y, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  await t.shot('door');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'books', 'inside the bookshop');
  t.expect(await t.ev(() => T.toasts.includes('📚 Welcome to the bookshop!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.BOOKS.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => BooksExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Ride the rolling ladder! 🪜', 'ladder hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, f = BooksExt.ladderFoot(); return !!h.target && h.target.x === f.x && h.target.y === f.y; }), 'the hint points at the ladder');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('inside');

  // ---- the rolling ladder: climb on, ride along the bookcase, climb down at the other end
  await t.ev(() => { const f = BooksExt.ladderFoot(); T.tp(f.x + 10, f.y + 4, 'books'); });
  t.expectEq(await t.ev(() => T.label()), '🪜 Ride the ladder', 'ladder label by the ladder');
  const x0 = await t.ev(() => BooksExt.st.ladder.x);
  await t.ev(() => { T.act(); T.step(30); });
  t.expect(await t.ev(() => !!BooksExt.st.ride), 'riding the ladder');
  t.expectEq(await t.ev(() => T.hint()), 'Wheee! Riding the ladder 🪜', 'riding hint');
  t.expectEq(await t.ev(() => T.label()), null, 'no button while riding');
  t.expect(await t.ev(() => Game.player.y < CFG.BOOKS.ROOM.y0), 'the chef climbed up onto the ladder');
  await t.ev(() => T.until(() => BooksExt.st.ride && BooksExt.st.ride.phase === 'slide' && BooksExt.st.ladder.x > CFG.BOOKS.LADDER.x0 + 60, 400));
  const mid = await t.ev(() => { const l = BooksExt.st.ladder.x; T.steer(0, 1); T.step(30); T.unsteer(); return { onLadder: Math.abs(Game.player.x - BooksExt.st.ladder.x) < 1 && Game.player.y === CFG.BOOKS.LADDER.ride, moved: BooksExt.st.ladder.x - l, floats: Game.floats.map((f) => f.text) }; });
  t.expect(mid.onLadder, 'the chef stays on the ladder while it slides, even when steering');
  t.expect(mid.moved > 20, 'the ladder is sliding along the shelf');
  t.expect(mid.floats.includes('Wheee! 🪜'), 'the "Wheee" float');
  await t.shot('ladder');
  const done = await t.ev(() => { const n = T.until(() => !BooksExt.st.ride, 900); return { n, x: BooksExt.st.ladder.x, px: Game.player.x, py: Game.player.y, rides: Game.s.books.rides, free: BooksExt.free(Game.player.x, Game.player.y) }; });
  t.expect(done.n >= 0, 'the ride finished');
  t.expectEq(done.x, CFG_LADDER_END(x0), 'the ladder reached the other end of the bookcase');
  t.expect(Math.abs(done.px - done.x) < 1 && done.py === 3124 && done.free, `the chef climbed down onto free floor below the ladder (${done.px},${done.py})`);
  t.expectEq(done.rides, 1, 'one ride counted');
  t.expectEq(await t.ev(() => T.label()), '🪜 Ride the ladder', 'can ride back the other way');
  t.expectEq(await t.ev(() => T.hint()), 'Sit in the beanbag for a story 📖', 'beanbag hint after the ride');

  // ---- the reading nook: sit in the beanbag, the picture book opens, three pages with the catalog buttons
  await t.ev(() => { const b = CFG.BOOKS.NOOK.bean; T.tp(b.x - 10, b.y + 12, 'books'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '📖 Sit and read', 'sit label at the beanbag');
  await t.ev(() => { T.act(); T.step(5); });
  const open = await t.ev(() => ({ read: !!BooksExt.st.read, page: BooksExt.st.read && BooksExt.st.read.page, ui: !!UI.catalog, shown: !document.getElementById('catalog-ctl').classList.contains('hidden'), label: T.label(), hint: T.hint(), reads: Game.s.books.reads }));
  t.expect(open.read && open.ui && open.shown, 'the picture book is open with the catalog buttons showing');
  t.expectEq(open.page, 0, 'the book opens on the first page');
  t.expectEq(open.label, '🚶 Stand up', 'stand-up label while reading');
  t.expectEq(open.hint, 'Turn the pages with ◀ ▶ 📖', 'reading hint');
  t.expectEq(open.reads, 1, 'one read counted');
  const seated = await t.ev(() => { const b = CFG.BOOKS.NOOK.bean; T.steer(1, 1); T.step(40); T.unsteer(); return Math.hypot(Game.player.x - b.x, Game.player.y - (b.y - 6)); });
  t.expect(seated < 1, 'the chef stays in the beanbag while reading');
  await t.wait(300);
  await t.shot('book-1');
  await t.ev(() => { UI.catalog.next(); T.step(30); });
  t.expectEq(await t.ev(() => BooksExt.st.read.page), 1, 'the ▶ button turns to page 2');
  await t.ev(() => { UI.catalog.next(); T.step(30); });
  t.expectEq(await t.ev(() => BooksExt.st.read.page), 2, 'page 3');
  await t.wait(300);
  t.expect(await t.ev(() => document.getElementById('cat-next').disabled && !document.getElementById('cat-prev').disabled), 'on the last page only ◀ is enabled');
  await t.shot('book-3');
  await t.ev(() => { UI.catalog.next(); T.step(30); });
  t.expectEq(await t.ev(() => BooksExt.st.read.page), 2, 'no page after the last one');
  await t.ev(() => { UI.catalog.prev(); T.step(30); });
  t.expectEq(await t.ev(() => BooksExt.st.read.page), 1, 'the ◀ button turns back');
  // phone-size book
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.step(2); });
  await t.wait(300);
  await t.shot('book-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });
  await t.ev(() => { UI.catalog.close(); T.step(2); });
  t.expect(await t.ev(() => !BooksExt.st.read && !UI.catalog && document.getElementById('catalog-ctl').classList.contains('hidden')), 'the ✕ closes the book and the chef stands up');
  t.expect(await t.ev(() => BooksExt.free(Game.player.x, Game.player.y)), 'standing on free floor by the beanbag');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚶 Stand up', 'sat down again');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !BooksExt.st.read), 'the big button stands up too');

  // ---- the globe spins when touched
  await t.ev(() => { const G = CFG.BOOKS.GLOBE; T.tp(G.x + 28, G.y + 2, 'books'); T.step(5); });
  const globe = await t.ev(() => ({ v: BooksExt.st.globe.v, spins: Game.s.books.spins, floats: Game.floats.map((f) => f.text) }));
  t.expect(globe.v > 5, 'the globe is spinning');
  t.expectEq(globe.spins, 1, 'one spin counted');
  t.expect(globe.floats.includes('Whirrr! 🌍'), 'the "Whirrr" float');
  t.expect(await t.ev(() => { T.step(300); return BooksExt.st.globe.v < 1.5; }), 'the globe slows down again');

  // ---- the storyteller cat tells a picture story while you are near
  await t.ev(() => { const C = CFG.BOOKS.CAT; T.tp(C.x, C.y + 40, 'books'); T.step(30); });
  t.expect(await t.ev(() => BooksExt.st.cat.tell > 0.3), 'the cat is telling a story');
  await t.shot('cat');
  t.expect(await t.ev(() => { T.tp(4480, 3200, 'books'); T.step(2); return BooksExt.st.cat.tell === 0; }), 'the story pauses when you walk away');

  // ---- the librarian: shh when you are away, a smile when you walk by
  const lib = await t.ev(() => {
    T.tp(4480, 3200, 'books'); T.step(60 * 8);
    const shushed = BooksExt.st.lib.shhT < 7 && BooksExt.st.lib.smile === 0;
    const L = CFG.BOOKS.LIBRARIAN; T.tp(L.x, L.y + 70, 'books'); T.step(30);
    return { shushed, smile: BooksExt.st.lib.smile };
  });
  t.expect(lib.shushed, 'the librarian keeps quiet while you are away');
  t.expectEq(lib.smile, 1, 'the librarian smiles when you walk by');
  await t.shot('librarian');

  // ---- a $4 bookmark from the circle by the desk: the book then remembers your page
  const mark = await t.ev(() => {
    Game.s.cash = 20; const P = CFG.BOOKS.PADS.bookmark; T.tp(P.x, P.y, 'books');
    const hint = T.hint();
    const n = T.until(() => Game.s.books.bookmark, 400);
    return { hint, n, cash: Game.s.cash, maxed: Game.allPads().find((p) => p.key === 'booksBookmark').maxed, after: T.hint() };
  });
  t.expectEq(mark.hint, 'Buy a bookmark! 🔖', 'bookmark hint');
  t.expect(mark.n >= 0, 'the circle sold a bookmark');
  t.expectEq(mark.cash, 16, 'the bookmark cost $4');
  t.expect(mark.maxed, 'the bookmark circle is done after one');
  t.expectEq(mark.after, 'Buy a comic! 💥', 'comic hint after the bookmark');
  const remembered = await t.ev(() => {
    const b = CFG.BOOKS.NOOK.bean; T.tp(b.x, b.y + 10, 'books'); T.act(); T.step(2);
    UI.catalog.next(); T.step(30); UI.catalog.next(); T.step(30);
    const p1 = BooksExt.st.read.page; T.act(); T.step(2);
    T.tp(b.x, b.y + 10, 'books'); T.act(); T.step(2);
    const p2 = BooksExt.st.read.page; T.act(); T.step(2);
    return { p1, p2, saved: Game.s.books.page };
  });
  t.expectEq(remembered.p1, 2, 'read to the last page');
  t.expectEq(remembered.p2, 2, 'the bookmark keeps the page for next time');
  t.expectEq(remembered.saved, 2, 'the page is saved');

  // ---- a $7 comic the chef carries for half a minute
  const comic = await t.ev(() => {
    const P = CFG.BOOKS.PADS.comic; T.tp(P.x, P.y, 'books');
    const n = T.until(() => BooksExt.st.comic > 0, 400);
    return { n, cash: Game.s.cash, comic: BooksExt.st.comic, comics: Game.s.books.comics, hint: T.hint() };
  });
  t.expect(comic.n >= 0, 'the circle sold a comic');
  t.expectEq(comic.cash, 9, 'the comic cost $7');
  t.expectEq(comic.comics, 1, 'comic counted');
  t.expect(comic.comic > 25, 'the comic lasts half a minute');
  t.expectEq(comic.hint, 'Zap! Pow! A comic! 💥', 'comic hint while carrying it');
  await t.ev(() => { T.tp(4400, 3240, 'books'); T.step(2); });
  await t.shot('comic');
  t.expect(await t.ev(() => { T.tp(540, 430, 'town'); T.step(2); return BooksExt.st.comic > 20; }), 'the comic comes along to the town');
  t.expect(await t.ev(() => { T.step(60 * 31); return BooksExt.st.comic === 0; }), 'the comic is finished after 30 s');
  t.expectEq(await t.ev(() => BooksExt.hint(Game)), undefined, 'no bookshop hint in the town');

  // ---- a reload or push into a wall lands back on the mat
  await t.ev(() => { const R = CFG.BOOKS.ROOM; T.tp(R.x0 - 10, 3200, 'books'); T.step(3); });
  t.expect(await t.ev(() => BooksExt.free(Game.player.x, Game.player.y)), 'pushed into the wall: rescued onto the floor');
  t.expect(await t.ev(() => { const E = CFG.BOOKS.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'the rescue lands on the exit mat');
  await t.ev(() => { const D = CFG.BOOKS.DESK; T.tp((D.x0 + D.x1) / 2, (D.y0 + D.y1) / 2, 'books'); T.step(3); });
  t.expect(await t.ev(() => BooksExt.free(Game.player.x, Game.player.y)), 'dropped onto the desk: rescued');

  // ---- phone-size shop
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.tp(4400, 3230, 'books'); T.step(2); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- Take-me-home from the middle of a ladder ride
  await t.ev(() => { const f = BooksExt.ladderFoot(); T.tp(f.x, f.y, 'books'); T.act(); T.step(50); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'Take-me-home leaves the shop');
  t.expect(await t.ev(() => !BooksExt.st.ride && !BooksExt.st.read && !UI.catalog), 'the ride and the book are cleared by Take-me-home');
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');
  // leaving the map while reading closes the book too
  await t.ev(() => { const b = CFG.BOOKS.NOOK.bean; T.tp(b.x, b.y + 10, 'books'); T.act(); T.step(2); T.tp(540, 430, 'town'); T.step(2); });
  t.expect(await t.ev(() => !BooksExt.st.read && !UI.catalog), 'the book closes when the chef is whisked away');

  // ---- out through the door: back on the sidewalk at the door spot
  await t.ev(() => { const E = CFG.BOOKS.EXIT; T.tp(E.x, E.y, 'books'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back outside in the City');
  t.expect(await t.ev(() => { const D = CFG.BOOKS.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the door spot');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door offers going back in');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '📚 Welcome to the bookshop!').length === 1), 'the welcome toast shows only once');

  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};

// the ladder rides from whichever end it is at to the other
function CFG_LADDER_END(x0) { return x0 === 4188 ? 4436 : 4188; }
