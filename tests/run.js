'use strict';
// Test runner: serves the repo, drives the real game in headless Chromium, runs every case in tests/cases,
// saves screenshots to tests/out and exits non-zero if anything failed. `npm test` (CI) or `node tests/run.js`.
//
// Each case exports `async function (t)` and uses the helpers in tests/lib.js. Most checks step the game's
// fixed-step simulation synchronously inside the page (no real-time waits), so the whole suite runs in well
// under a minute.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out');
const PORT = Number(process.env.PORT) || 8799;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.md': 'text/plain' };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      let file = path.join(ROOT, url === '/' ? 'index.html' : url);
      if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(data);
      });
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  let playwright;
  try { playwright = require('playwright'); } catch (e) {
    console.error('playwright is not installed: run `npm install` (and `npx playwright install chromium`) or set NODE_PATH to a copy.');
    process.exit(2);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const server = await serve();
  const browser = await playwright.chromium.launch({
    executablePath: process.env.PW_CHROMIUM || undefined,
    args: ['--no-sandbox', '--headless=new', '--autoplay-policy=no-user-gesture-required'],
  });
  const lib = require('./lib');
  const only = process.argv.slice(2);
  const files = fs.readdirSync(path.join(__dirname, 'cases')).filter((f) => f.endsWith('.js')).sort()
    .filter((f) => !only.length || only.some((o) => f.includes(o)));
  const results = [];
  for (const file of files) {
    const name = file.replace(/\.js$/, '');
    const started = Date.now();
    const context = await browser.newContext({ viewport: { width: 1100, height: 720 } });
    const page = await context.newPage();
    const t = lib.makeT(page, { baseUrl: `http://127.0.0.1:${PORT}/`, outDir: OUT, name });
    let error = null;
    try {
      await require(path.join(__dirname, 'cases', file))(t);
      t.assertNoPageErrors();
    } catch (e) { error = e; }
    await context.close();
    const ms = Date.now() - started;
    results.push({ name, ok: !error, ms, error, checks: t.checks });
    console.log(`${error ? '✗' : '✓'} ${name} (${(ms / 1000).toFixed(1)}s, ${t.checks} checks)`);
    if (error) console.log('   ' + String(error.stack || error).split('\n').slice(0, 6).join('\n   '));
  }
  await browser.close();
  server.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} cases passed, screenshots in ${path.relative(ROOT, OUT)}/`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
