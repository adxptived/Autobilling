const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = require('../package.json');
const ci = fs.readFileSync(path.join(root, '.github', 'workflows', 'ci.yml'), 'utf8');

assert.ok(pkg.scripts['validate:extensions'], 'validate:extensions script is missing');
assert.ok(pkg.scripts['lint:firefox'], 'lint:firefox script is missing');
assert.ok(pkg.scripts['validate:extensions'].includes('web-ext lint'), 'validate:extensions should run web-ext lint');
assert.ok(pkg.scripts['zip:chromium'], 'zip:chromium script is missing');
assert.ok(pkg.scripts['zip:firefox'], 'zip:firefox script is missing');
assert.ok(pkg.scripts.zip.includes('all'), 'zip script should package all browser targets');

assert.ok(ci.includes('npm run validate:extensions'), 'CI should validate extension manifests');
assert.ok(ci.includes('autobilling-*.zip'), 'CI should upload browser-specific zip artifacts');

console.log('Tooling tests passed');
