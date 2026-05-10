const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const targets = [
  { name: 'chromium', dir: path.join(root, 'dist'), background: 'service_worker' },
  { name: 'firefox', dir: path.join(root, 'dist-firefox'), background: 'scripts' },
];
const optionalBinPermission = 'https://lookup.binlist.net/*';

function exists(dir, file) {
  assert.ok(fs.existsSync(path.join(dir, file)), `${file} is missing in ${dir}`);
}

function readManifest(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
}

function validateTarget(target) {
  const manifest = readManifest(target.dir);

  assert.strictEqual(manifest.manifest_version, 3, `${target.name} manifest must use MV3`);
  assert.ok(manifest.action && manifest.action.default_popup, `${target.name} action popup is missing`);
  exists(target.dir, manifest.action.default_popup);
  exists(target.dir, 'background.js');
  exists(target.dir, 'content.js');
  exists(target.dir, 'popup.bundle.js');

  const hostPermissions = manifest.host_permissions || [];
  assert.ok(!hostPermissions.includes(optionalBinPermission), `${target.name} must not request BIN host access at install time`);
  assert.deepStrictEqual(manifest.optional_host_permissions, [optionalBinPermission]);
  assert.deepStrictEqual(manifest.browser_specific_settings.gecko.data_collection_permissions, { required: ['none'] });

  if (target.background === 'service_worker') {
    assert.strictEqual(manifest.background.service_worker, 'background.js');
    assert.ok(!manifest.background.scripts, 'Chromium manifest must not use background.scripts');
  } else {
    assert.deepStrictEqual(manifest.background.scripts, ['background.js']);
    assert.ok(!manifest.background.service_worker, 'Firefox manifest must not use background.service_worker');
  }

  for (const icon of Object.values(manifest.icons || {})) exists(target.dir, icon);
  for (const icon of Object.values((manifest.action && manifest.action.default_icon) || {})) exists(target.dir, icon);
}

for (const target of targets) validateTarget(target);

console.log('Extension validation passed');
