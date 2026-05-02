const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifest = require('../manifest.json');

function exists(file) {
  assert.ok(fs.existsSync(path.join(root, file)), `${file} is missing`);
}

exists(manifest.action.default_popup);
exists(manifest.background.service_worker);

for (const icon of Object.values(manifest.icons || {})) exists(icon);
for (const script of manifest.content_scripts || []) {
  for (const file of script.js || []) exists(file);
}
if (manifest.options_ui && manifest.options_ui.page) exists(manifest.options_ui.page);

const htmlFiles = [manifest.action.default_popup, manifest.options_ui && manifest.options_ui.page].filter(Boolean);
for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(path.join(root, htmlFile), 'utf8');
  const scripts = Array.from(html.matchAll(/<script src="([^"]+)"/g)).map((m) => m[1]);
  for (const script of scripts) exists(script);
}

console.log('Manifest tests passed');
