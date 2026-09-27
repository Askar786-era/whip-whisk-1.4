const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const wwwDir = path.join(rootDir, 'www');

// Ensure www exists
if (!fs.existsSync(wwwDir)) {
  fs.mkdirSync(wwwDir, { recursive: true });
}

// Files to copy
const filesToCopy = [
  'index.html',
  'admin.html',
  'style.css',
  'admin.css',
  'script.js',
  'admin.js'
];

filesToCopy.forEach(file => {
  const src = path.join(rootDir, file);
  const dest = path.join(wwwDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
});

// Copy assets folder recursively
function copyDirRecursive(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const assetsSrc = path.join(rootDir, 'assets');
const assetsDest = path.join(wwwDir, 'assets');
if (fs.existsSync(assetsSrc)) {
  copyDirRecursive(assetsSrc, assetsDest);
}

console.log('✅ Web assets synchronized to www directory.');
