'use strict';
// Copies the game into www/ for the Android app (Capacitor). The game has no build step,
// so this is a plain copy of the files the page loads. The service worker is left out:
// inside the app every file is already on the device.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
const ENTRIES = ['index.html', 'manifest.webmanifest', 'css', 'js', 'icons'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const e of ENTRIES) fs.cpSync(path.join(root, e), path.join(out, e), { recursive: true });
console.log('www/ ready:', ENTRIES.join(', '));
