'use strict';
// The game loads and runs in every map without errors; screenshots of each map.
module.exports = async (t) => {
  await t.boot();
  await t.ev(() => T.step(600));   // ten seconds of the town simulating
  const areas = await t.ev(() => Object.keys(CFG.AREAS));
  t.expect(areas.length >= 6, `at least six maps registered (got ${areas.join(', ')})`);
  for (const area of areas) {
    await t.ev((a) => { const W = CFG.AREAS[a].WORLD; T.tp((W.x0 + W.x1) / 2, (W.y0 + W.y1) / 2, a); T.step(120); }, area);
    await t.shot(area);
  }
  await t.ev(() => T.tp(540, 430, 'town'));
  const hud = await t.ev(() => ({ cash: document.getElementById('hud-cash').textContent, version: document.getElementById('version').textContent }));
  t.expect(/^\$/.test(hud.cash), 'cash shows in the HUD');
  t.expect(/^Version \d+$/.test(hud.version), 'version shows in the help panel');
};
