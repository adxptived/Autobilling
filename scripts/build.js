const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const dist = path.join(root, 'dist');
const firefoxDist = path.join(root, 'dist-firefox');
const popupBundle = 'popup.bundle.js';
const bundleFiles = [
  'bins.js',
  'countries.js',
  'namePools.js',
  'generator.js',
  'clipboard.js',
  'extensionStorage.js',
  'permissions.js',
  'autofillDiagnostics.js',
  'popup.js',
];
const copyFiles = [
  'manifest.json',
  'background.js',
  'content.js',
  'extensionStorage.js',
  'permissions.js',
  'autofillDiagnostics.js',
  'popup.html',
  'options.html',
  'options.js',
];
const rootFiles = ['README.md', 'PRIVACY.md', 'CHANGELOG.md', 'LICENSE'];

function build(targetDir, options) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  for (const file of copyFiles) {
    fs.copyFileSync(path.join(src, file), path.join(targetDir, file));
  }
  for (const file of rootFiles) {
    fs.copyFileSync(path.join(root, file), path.join(targetDir, file));
  }
  fs.copyFileSync(path.join(root, 'assets', 'icon.png'), path.join(targetDir, 'icon.png'));

  const bundle = bundleFiles
    .map((file) => `// ===== ${file} =====\n${fs.readFileSync(path.join(src, file), 'utf8')}`)
    .join('\n\n');
  fs.writeFileSync(path.join(targetDir, popupBundle), bundle);

  const popupPath = path.join(targetDir, 'popup.html');
  const popupHtml = fs.readFileSync(popupPath, 'utf8')
    .replace(/<script src="(?:bins|countries|namePools|generator|clipboard|extensionStorage|permissions|autofillDiagnostics|popup)\.js"><\/script>\s*/g, '')
    .replace('</body>', `<script src="${popupBundle}"></script>\n</body>`);
  fs.writeFileSync(popupPath, popupHtml);

  fs.cpSync(path.join(src, 'icons'), path.join(targetDir, 'icons'), { recursive: true });

  if (options.firefox) {
    const manifestPath = path.join(targetDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.background = { scripts: [manifest.background.service_worker] };
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }
}

build(dist, { firefox: false });
build(firefoxDist, { firefox: true });

console.log(`Built ${dist}`);
console.log(`Built ${firefoxDist}`);
