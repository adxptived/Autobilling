const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const manifest = require('../src/manifest.json');

function exists(file) {
  assert.ok(fs.existsSync(path.join(src, file)), `${file} is missing`);
}

exists(manifest.action.default_popup);
exists(manifest.background.service_worker);
exists('content.js');

assert.ok(!manifest.content_scripts, 'content.js should be injected on demand, not auto-loaded');
assert.ok(!manifest.host_permissions, 'BIN lookup host access must be optional');
assert.deepStrictEqual(manifest.optional_host_permissions, ['https://lookup.binlist.net/*']);
assert.strictEqual(manifest.browser_specific_settings.gecko.strict_min_version, '142.0');
assert.deepStrictEqual(
  manifest.browser_specific_settings.gecko.data_collection_permissions,
  { required: ['none'] },
);

for (const icon of Object.values(manifest.icons || {})) exists(icon);
for (const icon of Object.values((manifest.action && manifest.action.default_icon) || {})) exists(icon);
for (const script of manifest.content_scripts || []) {
  for (const file of script.js || []) exists(file);
}
if (manifest.options_ui && manifest.options_ui.page) exists(manifest.options_ui.page);

const htmlFiles = [manifest.action.default_popup, manifest.options_ui && manifest.options_ui.page].filter(Boolean);
for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(path.join(src, htmlFile), 'utf8');
  const scripts = Array.from(html.matchAll(/<script src="([^"]+)"/g)).map((m) => m[1]);
  for (const script of scripts) exists(script);
}

console.log('Manifest tests passed');
