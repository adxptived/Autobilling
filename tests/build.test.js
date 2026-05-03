const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const firefoxDist = path.join(root, 'dist-firefox');

execFileSync('node', ['scripts/build.js'], { cwd: root, stdio: 'pipe' });

assert.ok(fs.existsSync(path.join(dist, 'manifest.json')), 'dist manifest is missing');
assert.ok(fs.existsSync(path.join(firefoxDist, 'manifest.json')), 'Firefox dist manifest is missing');
assert.ok(fs.existsSync(path.join(dist, 'popup.bundle.js')), 'popup bundle is missing');
assert.ok(fs.existsSync(path.join(dist, 'content.js')), 'content.js is missing for on-demand injection');
assert.ok(fs.existsSync(path.join(dist, 'icon.png')), 'README icon source is missing in dist');

const popupHtml = fs.readFileSync(path.join(dist, 'popup.html'), 'utf8');
assert.ok(popupHtml.includes('popup.bundle.js'), 'popup.html must load popup.bundle.js');
assert.ok(!popupHtml.includes('bins.js'), 'popup.html should not load split popup scripts in dist');
assert.ok(!popupHtml.includes('popup.js'), 'popup.html should not load popup.js in dist');

const manifest = require(path.join(dist, 'manifest.json'));
const firefoxManifest = require(path.join(firefoxDist, 'manifest.json'));
assert.ok(!manifest.content_scripts, 'content_scripts should be omitted; content.js injects on demand');
assert.ok(!manifest.host_permissions, 'Chromium BIN lookup host access must be optional');
assert.deepStrictEqual(manifest.optional_host_permissions, ['https://lookup.binlist.net/*']);
assert.deepStrictEqual(firefoxManifest.background, { scripts: ['background.js'] });
assert.ok(!firefoxManifest.background.service_worker, 'Firefox manifest must not use background.service_worker');
assert.ok(!firefoxManifest.host_permissions, 'Firefox BIN lookup host access must be optional');
assert.deepStrictEqual(firefoxManifest.optional_host_permissions, ['https://lookup.binlist.net/*']);

console.log('Build tests passed');
