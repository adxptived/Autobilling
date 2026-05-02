const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const zipPath = path.join(root, 'autobilling.zip');

if (!fs.existsSync(path.join(dist, 'manifest.json'))) {
  throw new Error('dist/manifest.json is missing. Run npm run build first.');
}
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

execFileSync(
  'powershell',
  [
    '-NoProfile',
    '-Command',
    "Compress-Archive -Path 'dist/*' -DestinationPath 'autobilling.zip' -Force",
  ],
  { cwd: root, stdio: 'inherit' },
);

console.log(`Created ${zipPath}`);
