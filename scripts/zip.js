const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const targets = {
  chromium: { dist: path.join(root, 'dist'), zip: path.join(root, 'autobilling-chromium.zip') },
  firefox: { dist: path.join(root, 'dist-firefox'), zip: path.join(root, 'autobilling-firefox.zip') },
};
const targetName = process.argv[2] || 'chromium';

function zipTarget(target) {
  if (!fs.existsSync(path.join(target.dist, 'manifest.json'))) {
    throw new Error(`${target.dist}/manifest.json is missing. Run npm run build first.`);
  }
  if (fs.existsSync(target.zip)) fs.unlinkSync(target.zip);

  execFileSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `Compress-Archive -Path '${path.relative(root, target.dist)}/*' -DestinationPath '${path.basename(target.zip)}' -Force`,
    ],
    { cwd: root, stdio: 'inherit' },
  );

  console.log(`Created ${target.zip}`);
}

if (targetName === 'all') {
  zipTarget(targets.chromium);
  zipTarget(targets.firefox);
} else if (targets[targetName]) {
  zipTarget(targets[targetName]);
} else {
  throw new Error(`Unknown zip target: ${targetName}`);
}
