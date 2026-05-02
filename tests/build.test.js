const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

execFileSync('node', ['scripts/build.js'], { cwd: root, stdio: 'pipe' });

assert.ok(fs.existsSync(path.join(dist, 'manifest.json')), 'dist manifest is missing');
assert.ok(fs.existsSync(path.join(dist, 'popup.bundle.js')), 'popup bundle is missing');
assert.ok(fs.existsSync(path.join(dist, 'content.js')), 'content.js is missing for on-demand injection');

const popupHtml = fs.readFileSync(path.join(dist, 'popup.html'), 'utf8');
assert.ok(popupHtml.includes('popup.bundle.js'), 'popup.html must load popup.bundle.js');
assert.ok(!popupHtml.includes('bins.js'), 'popup.html should not load split popup scripts in dist');
assert.ok(!popupHtml.includes('popup.js'), 'popup.html should not load popup.js in dist');

const manifest = require(path.join(dist, 'manifest.json'));
assert.ok(!manifest.content_scripts, 'content_scripts should be omitted; content.js injects on demand');
assert.deepStrictEqual(manifest.host_permissions, ['https://lookup.binlist.net/*']);

console.log('Build tests passed');
