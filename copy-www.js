/**
 * copy-www.js
 * Copies all static web assets into the www/ folder
 * so Capacitor can bundle them into the Android APK.
 *
 * Run:  node copy-www.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT   = __dirname;
const WWW    = path.join(ROOT, 'www');

// Ensure www/ exists
if (!fs.existsSync(WWW)) fs.mkdirSync(WWW, { recursive: true });

// ── Files to copy flat into www/ ─────────────────────────────────────────────
const FILES = [
  'index.html',
  'admin.html',
  'style.css',
  'admin.css',
  'script.js',
  'admin.js',
  'manifest.json',
  'sw.js'
];

FILES.forEach(file => {
  const src  = path.join(ROOT, file);
  const dest = path.join(WWW, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✔ ${file}`);
  } else {
    console.warn(`  ⚠  ${file} not found — skipped`);
  }
});

// ── Recursively copy a directory ─────────────────────────────────────────────
function copyDir (src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src, { withFileTypes: true }).forEach(entry => {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  });
}

// ── Copy assets/ folder ───────────────────────────────────────────────────────
const assetsSrc  = path.join(ROOT, 'assets');
const assetsDest = path.join(WWW,  'assets');
if (fs.existsSync(assetsSrc)) {
  copyDir(assetsSrc, assetsDest);
  console.log('  ✔ assets/');
} else {
  console.warn('  ⚠  assets/ folder not found — skipped');
}

console.log('\n✅  Web assets ready in www/\n');
