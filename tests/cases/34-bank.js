'use strict';
// The bank in the City: the door's label and hint on Harbour Street, going inside (welcome toast, no stray hint),
// the vault (opens with the button, "Ooooh! ✨", closes again), the coin-counting machine (a coin in, the jackpot gives
// it back), the piggy bank (Save $10 keeps the money in g.s.bank.saved; "Take it back" returns every cent), the free
// lollipop (one per visit, carried along outside), the pen on a chain, a rescue from a wall, Take-me-home from inside,
// and going back out onto the door spot.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/city-bank.js into index.html, load it into the booted page
  if (await t.ev(() => typeof BankExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-bank.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof BankExt !== 'undefined' && !!CFG.AREAS.bank), 'the bank extension and its map are registered');
  t.expect(await t.ev(() => Game.ext.indexOf(BankExt) < Game.ext.indexOf(CityExt) && Render.ext.includes(BankExt)), 'registered before the City in Game.ext and in Render.ext');
  t.expect(await t.ev(() => { const b = CFG.CITY.BUILDINGS[CFG.BANK.BUILDING]; return b.x0 === 4610 && b.y0 === 600 && !b.sign; }), 'owns the unsigned building 14');
  t.expect(await t.ev(() => { const W = CFG.AREAS.bank.WORLD; return W.x0 === 11300 && W.y0 === 3000 && W.x1 === 11900 && W.y1 === 3400; }), 'the interior sits in the reserved rectangle');

  // ---- the door on Harbour Street
  await t.ev(() => { const D = CFG.BANK.DOOR_OUT; T.tp(D.x, D.y + 55, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Visit the bank! 🏦', 'bank hint near the door');
  t.expect(await t.ev(() => { const D = CFG.BANK.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  t.expectEq(await t.ev(() => { const D = CFG.BANK.DOOR_OUT; T.tp(D.x + 120, D.y, 'city'); T.step(1); return BankExt.hint(Game); }), undefined, 'no bank hint further down the street');
  await t.ev(() => { Render.setZoom(1.2); const D = CFG.BANK.DOOR_OUT; T.tp(D.x, D.y, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  await t.shot('door');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'bank', 'inside the bank');
  t.expect(await t.ev(() => T.toasts.includes('🏦 Welcome to the bank! Your money is safe here')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.BANK.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => BankExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Open the big vault! 🔐', 'vault hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, c = CFG.BANK.VAULT_SPOT; return !!h.target && h.target.x === c.x && h.target.y === c.y; }), 'the hint points at the vault');
  t.expect(await t.ev(() => BankExt.free(CFG.BANK.VAULT_SPOT.x, CFG.BANK.VAULT_SPOT.y) && BankExt.free(CFG.BANK.MACHINE_SPOT.x, CFG.BANK.MACHINE_SPOT.y) && BankExt.free(CFG.BANK.PEN_SPOT.x, CFG.BANK.PEN_SPOT.y) && BankExt.free(CFG.BANK.LOLLY_SPOT.x, CFG.BANK.LOLLY_SPOT.y) && BankExt.free(CFG.BANK.PADS.save.x, CFG.BANK.PADS.save.y)), 'every spot you stand on is free floor');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('inside');

  // ---- the vault: open with the button, the treasure sparkles, close again
  await t.ev(() => { const V = CFG.BANK.VAULT_SPOT; T.tp(V.x, V.y, 'bank'); });
  t.expectEq(await t.ev(() => T.label()), '🔐 Open the vault', 'open label at the vault');
  await t.ev(() => { T.act(); T.step(10); });
  t.expect(await t.ev(() => BankExt.st.vault.open && BankExt.st.vault.k > 0 && BankExt.st.vault.k < 1), 'the vault door is swinging open');
  t.expectEq(await t.ev(() => T.hint()), 'The vault is opening… 🔐', 'opening hint');
  t.expectEq(await t.ev(() => T.label()), '🔒 Close the vault', 'close label while open');
  const opened = await t.ev(() => { const n = T.until(() => BankExt.st.vault.revealed, 300); return { n, k: BankExt.st.vault.k, floats: Game.floats.map((f) => f.text), opened: Game.s.bank.vaultOpened }; });
  t.expect(opened.n >= 0 && opened.k === 1, 'the vault stands wide open');
  t.expect(opened.floats.includes('Ooooh! ✨'), 'the "Ooooh" float');
  t.expectEq(opened.opened, 1, 'one vault opening counted');
  await t.shot('vault');
  await t.ev(() => { T.act(); T.until(() => BankExt.st.vault.k === 0, 300); });
  t.expect(await t.ev(() => !BankExt.st.vault.open && BankExt.st.vault.k === 0), 'the vault is shut again');
  t.expectEq(await t.ev(() => T.hint()), 'Put a coin in the machine! 🪙', 'machine hint after the vault');

  // ---- the coin-counting machine: a coin in, a rattle, a jackpot that gives it back
  const coin = await t.ev(() => {
    Game.s.cash = 20; const M = CFG.BANK.MACHINE_SPOT; T.tp(M.x, M.y, 'bank');
    const label = T.label(); T.act(); T.step(5);
    const during = { cash: Game.s.cash, hint: T.hint(), label: T.label(), t: BankExt.st.machine.t };
    const n = T.until(() => BankExt.st.machine.t < 0, 400);
    return { label, during, n, cash: Game.s.cash, coins: Game.s.bank.coins, floats: Game.floats.map((f) => f.text), hint: T.hint() };
  });
  t.expectEq(coin.label, '🪙 Put a coin in', 'coin label at the machine');
  t.expectEq(coin.during.cash, 19, 'the coin went in');
  t.expectEq(coin.during.hint, 'Rattle rattle… 🪙', 'rattling hint');
  t.expect(coin.during.label !== '🪙 Put a coin in' && coin.during.t > 0, 'no second coin while one rattles');
  t.expect(coin.n >= 0, 'the coin finished its ride');
  t.expectEq(coin.cash, 20, 'the jackpot gave the coin back');
  t.expectEq(coin.coins, 1, 'one coin counted');
  t.expect(coin.floats.includes('JACKPOT! ✨ +$1'), 'the jackpot float');
  t.expectEq(coin.hint, 'Save $10 in the piggy bank! 🐷', 'piggy hint after the machine');
  await t.ev(() => { const M = CFG.BANK.MACHINE_SPOT; T.tp(M.x, M.y, 'bank'); T.act(); T.step(60); });
  await t.shot('coin');
  t.expect(await t.ev(() => { Game.s.cash = 0; const M = CFG.BANK.MACHINE_SPOT; T.tp(M.x, M.y, 'bank'); T.until(() => BankExt.st.machine.t < 0, 400); T.act(); T.until(() => BankExt.st.machine.t < 0, 400); return Game.s.cash === 1; }), 'with an empty purse the machine still pays out a coin');

  // ---- the piggy bank: Save $10 goes into g.s.bank.saved; Take it back returns it all
  const save = await t.ev(() => {
    Game.s.cash = 25; const P = CFG.BANK.PADS.save; T.tp(P.x, P.y, 'bank');
    const n = T.until(() => Game.s.bank.saved >= 10, 600);
    return { n, cash: Game.s.cash, saved: Game.s.bank.saved, floats: Game.floats.map((f) => f.text), label: T.label() };
  });
  t.expect(save.n >= 0, 'the piggy bank took a saving');
  t.expectEq(save.saved, 10, '$10 saved');
  t.expectEq(Math.round(save.cash), 15, 'the saving came out of the purse');
  t.expect(save.floats.includes('Saved! $10 🐷'), 'the saved float');
  t.expectEq(save.label, '🐷 Take it back', 'take-it-back button on the pad');
  await t.shot('piggy');
  t.expect(await t.ev(() => { T.step(3 * 60); return Game.s.bank.saved === 20 || Game.s.cash + Game.s.bank.saved + (Game.s.padPaid.bankSave || 0) > 24.9; }), 'standing on the pad keeps saving, never losing a cent');
  const back = await t.ev(() => { T.act(); T.step(2); return { cash: Game.s.cash, saved: Game.s.bank.saved, paid: Game.s.padPaid.bankSave, floats: Game.floats.map((f) => f.text) }; });
  t.expectEq(back.saved, 0, 'nothing left in the piggy bank');
  t.expect(Math.abs(back.cash - 25) < 0.01, 'every cent came back');
  t.expectEq(back.paid, undefined, 'no partial saving left on the pad');
  t.expect(back.floats.some((f) => f.startsWith("Here's your $") && f.endsWith('back! 🐷')), 'the take-it-back float');
  t.expect(await t.ev(() => { const W = CFG.BANK.WORLD; T.tp(W.x0 + 20, 3200, 'bank'); T.step(2); return T.label() !== '🐷 Take it back'; }), 'no take-it-back button away from the piggy bank');

  // ---- the free lollipop: one per visit, carried for a while
  const lolly = await t.ev(() => {
    Game.s.cash = 5; const L = CFG.BANK.LOLLY_SPOT; T.tp(L.x, L.y, 'bank'); T.step(1);   // too poor to save: the hint moves on to the lollipop
    const hint = T.hint(), label = T.label(); T.act(); T.step(2);
    return { hint, label, lolly: BankExt.st.lolly, lollies: Game.s.bank.lollies, cash: Game.s.cash, after: T.label(), hintAfter: T.hint() };
  });
  t.expectEq(lolly.hint, 'Take a free lollipop! 🍭', 'lollipop hint');
  t.expectEq(lolly.label, '🍭 Take a lollipop', 'lollipop label at the bowl');
  t.expect(lolly.lolly > 19, 'the lollipop lasts twenty seconds');
  t.expectEq(lolly.lollies, 1, 'lollipop counted');
  t.expectEq(lolly.cash, 5, 'the lollipop is free');
  t.expect(lolly.after !== '🍭 Take a lollipop', 'only one lollipop per visit');
  t.expectEq(lolly.hintAfter, 'Mmm, lollipop! 🍭', 'lollipop hint while carrying it');
  await t.shot('lolly');
  t.expect(await t.ev(() => { T.tp(540, 430, 'town'); T.step(2); return BankExt.st.lolly > 15; }), 'the lollipop comes along to the town');
  t.expect(await t.ev(() => { T.step(60 * 21); return BankExt.st.lolly === 0; }), 'the lollipop is finished after 20 s');

  // ---- the pen on a chain: sign your name
  const sign = await t.ev(() => {
    const P = CFG.BANK.PEN_SPOT; T.tp(P.x, P.y, 'bank'); T.step(1);
    const hint = T.hint(), label = T.label(); T.act(); T.step(5);
    const during = T.hint();
    const n = T.until(() => BankExt.st.signed, 300);
    return { hint, label, during, n, floats: Game.floats.map((f) => f.text), hintAfter: T.hint() };
  });
  t.expectEq(sign.hint, 'Sign your name with the pen! ✒️', 'pen hint once the rest is done');
  t.expectEq(sign.label, '✒️ Sign here', 'sign label at the pen');
  t.expectEq(sign.during, 'Signing… ✒️', 'signing hint');
  t.expect(sign.n >= 0, 'the signature got written');
  t.expect(sign.floats.includes('Nice signature! ✒️'), 'the signature float');
  t.expectEq(sign.hintAfter, 'Your money is safe here! 🏦', 'all done: the bank is proud of you');
  await t.ev(() => { const Tl = CFG.BANK.TELLER; T.tp(Tl.x + 10, Tl.y + 40, 'bank'); T.step(40); });
  t.expect(await t.ev(() => BankExt.st.teller.wave === 1), 'the teller waves at the window');
  await t.shot('teller');

  // ---- a reload or push into a wall lands back on the mat
  await t.ev(() => { const R = CFG.BANK.ROOM; T.tp(R.x0 - 10, 3200, 'bank'); T.step(3); });
  t.expect(await t.ev(() => BankExt.free(Game.player.x, Game.player.y)), 'pushed into the wall: rescued onto the floor');
  t.expect(await t.ev(() => { const E = CFG.BANK.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'the rescue lands on the exit mat');
  await t.ev(() => { const C = CFG.BANK.COUNTER; T.tp((C.x0 + C.x1) / 2, (C.y0 + C.y1) / 2, 'bank'); T.step(3); });
  t.expect(await t.ev(() => BankExt.free(Game.player.x, Game.player.y)), 'dropped onto the counter: rescued');

  // ---- the savings survive a reload
  await t.ev(() => { Game.s.cash = 30; const P = CFG.BANK.PADS.save; T.tp(P.x, P.y, 'bank'); T.until(() => Game.s.bank.saved >= 10, 600); T.tp(540, 430, 'town'); Game.save(); });
  await t.reload();
  if (await t.ev(() => typeof BankExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-bank.js' }); await t.ev(() => T.step(2)); }
  t.expectEq(await t.ev(() => Game.s.bank.saved), 10, 'the saving is still in the piggy bank after a reload');
  t.expectEq(await t.ev(() => Game.s.bank.seen), true, 'the bank remembers the first visit');

  // ---- phone-size hall
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const V = CFG.BANK.VAULT_SPOT; T.tp(V.x - 40, V.y + 30, 'bank'); T.act(); T.step(2); T.tp(V.x, V.y, 'bank'); T.act(); T.until(() => BankExt.st.vault.revealed, 300); T.step(2); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- Take-me-home from the open vault
  await t.ev(() => { Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'Take-me-home leaves the bank');
  t.expect(await t.ev(() => !BankExt.st.vault.open && BankExt.st.vault.k === 0 && BankExt.st.machine.t < 0), 'the vault and machine are cleared by Take-me-home');
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');
  t.expectEq(await t.ev(() => BankExt.hint(Game)), undefined, 'no bank hint in the town');
  t.expectEq(await t.ev(() => Game.s.bank.saved), 10, 'going home keeps the savings');

  // ---- out through the door: back on the sidewalk at the door spot
  await t.ev(() => { const E = CFG.BANK.EXIT; T.tp(E.x, E.y, 'bank'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back outside in the City');
  t.expect(await t.ev(() => { const D = CFG.BANK.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door offers going back in');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '🏦 Welcome to the bank! Your money is safe here').length === 0), 'no second welcome toast after a reload that remembers the visit');
  await t.ev(() => { T.act(); T.step(2); const L = CFG.BANK.LOLLY_SPOT; T.tp(L.x, L.y, 'bank'); });
  t.expectEq(await t.ev(() => T.label()), '🍭 Take a lollipop', 'a fresh visit offers a lollipop again');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '🏦 Welcome to the bank! Your money is safe here').length === 0), 'the welcome toast shows only the first time');

  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
