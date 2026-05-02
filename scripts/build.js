const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const files = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.js',
  'generator.js',
  'clipboard.js',
  'bins.js',
  'countries.js',
  'namePools.js',
  'options.html',
  'options.js',
  'README.md',
  'PRIVACY.md',
  'CHANGELOG.md',
  'LICENSE',
];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(dist, file));
}

fs.cpSync(path.join(root, 'icons'), path.join(dist, 'icons'), { recursive: true });

console.log(`Built ${dist}`);
