const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const popupBundle = 'popup.bundle.js';
const bundleFiles = ['bins.js', 'countries.js', 'namePools.js', 'generator.js', 'clipboard.js', 'popup.js'];
const copyFiles = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'options.html',
  'options.js',
  'README.md',
  'PRIVACY.md',
  'CHANGELOG.md',
  'LICENSE',
  'icon.png',
];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const file of copyFiles) {
  fs.copyFileSync(path.join(root, file), path.join(dist, file));
}

const bundle = bundleFiles
  .map((file) => `// ===== ${file} =====\n${fs.readFileSync(path.join(root, file), 'utf8')}`)
  .join('\n\n');
fs.writeFileSync(path.join(dist, popupBundle), bundle);

const popupPath = path.join(dist, 'popup.html');
const popupHtml = fs.readFileSync(popupPath, 'utf8')
  .replace(/<script src="(?:bins|countries|namePools|generator|clipboard|popup)\.js"><\/script>\s*/g, '')
  .replace('</body>', `<script src="${popupBundle}"></script>\n</body>`);
fs.writeFileSync(popupPath, popupHtml);

fs.cpSync(path.join(root, 'icons'), path.join(dist, 'icons'), { recursive: true });

console.log(`Built ${dist}`);
