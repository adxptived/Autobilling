const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const zipPath = path.join(root, 'autobilling.zip');
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
  'icons',
  'README.md',
  'PRIVACY.md',
  'CHANGELOG.md',
  'LICENSE',
];

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

const escaped = files.map((file) => `'${file.replace(/'/g, "''")}'`).join(',');
execFileSync(
  'powershell',
  [
    '-NoProfile',
    '-Command',
    `Compress-Archive -Path ${escaped} -DestinationPath 'autobilling.zip' -Force`,
  ],
  { cwd: root, stdio: 'inherit' },
);

console.log(`Created ${zipPath}`);
