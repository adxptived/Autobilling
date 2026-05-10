const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const {
  detectBin,
  resolveExpiry,
  addHistoryEntry,
  pruneHistory,
  generatePhone,
  generateEmail,
} = require('../src/generator');

// ===== detectBin =====
const bins = [
  { prefix: '400000' },
  { prefix: '515462' },
];
assert.strictEqual(detectBin('515462', bins), 1);
assert.strictEqual(detectBin('999999', bins), -1);

// ===== resolveExpiry =====
let expiry = resolveExpiry('03', '30', new Date('2026-01-01'));
assert.deepStrictEqual(expiry, { expMonth: '03', expYear: '30', expYearFull: '2030' });

expiry = resolveExpiry('random', 'random', new Date('2026-01-01'));
assert.match(expiry.expMonth, /^(0[1-9]|1[0-2])$/);
assert.match(expiry.expYear, /^\d{2}$/);
assert.ok(Number(expiry.expYear) >= 27);

// ===== History dedup + TTL =====
const entryA = { card: { formatted: '4000 0000 0000 0002' }, ts: 1 };
const entryB = { card: { formatted: '5154 6200 0000 0008' }, ts: 2 };
const entryA2 = { card: { formatted: '4000 0000 0000 0002' }, ts: 3 };
let history = [];
history = addHistoryEntry(history, entryA, 10);
history = addHistoryEntry(history, entryB, 10);
history = addHistoryEntry(history, entryA2, 10);
assert.strictEqual(history.length, 2);
assert.strictEqual(history[0].ts, 3);
assert.strictEqual(history[1].ts, 2);

history = pruneHistory([
  { card: { formatted: '4000 0000 0000 0002' }, ts: Date.parse('2026-01-01T00:00:00Z') },
  { card: { formatted: '5154 6200 0000 0008' }, ts: Date.parse('2026-01-01T00:20:00Z') },
], 15, Date.parse('2026-01-01T00:30:00Z'));
assert.strictEqual(history.length, 1);
assert.strictEqual(history[0].card.formatted, '5154 6200 0000 0008');

// ===== generatePhone =====
// Every result must start with '+' and contain only +digits.
const phoneCountries = ['US','GB','DE','JP','TR','AE','IL','HK','SG','ZA','PH','ID','VN','AR','CL','KR','NL'];
for (const cc of phoneCountries) {
  for (let i = 0; i < 5; i++) {
    const phone = generatePhone(cc);
    assert.match(phone, /^\+\d{6,}$/, `generatePhone('${cc}') must return +digits, got ${phone}`);
  }
}

// Unknown country falls back gracefully.
assert.match(generatePhone('ZZ'), /^\+\d+$/);

// ===== generateEmail =====
const email = generateEmail('Test', 'User');
assert.match(email, /^[a-z0-9._]+@[a-z.]+$/, 'email format');

// ===== NAME_POOLS / BIN / BIN_DB / COUNTRIES coverage =====
// Run src files in a sandbox so we can inspect the globals they set.
const ctx = {};
vm.createContext(ctx);
for (const rel of ['src/bins.js', 'src/countries.js', 'src/namePools.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', rel), 'utf8'), ctx);
}

// Every BIN has a BIN_DB entry (so live-BIN fallback always resolves).
assert.ok(Array.isArray(ctx.BINS) && ctx.BINS.length > 0, 'BINS is non-empty array');
for (const bin of ctx.BINS) {
  assert.ok(bin.prefix && /^\d+$/.test(bin.prefix), 'BIN has numeric prefix: ' + JSON.stringify(bin));
  assert.ok(bin.brand, 'BIN has brand: ' + JSON.stringify(bin));
  assert.ok(ctx.BIN_DB[bin.prefix], 'BIN_DB has entry for ' + bin.prefix);
  assert.ok(typeof bin.length === 'number' && bin.length >= 13 && bin.length <= 19, 'BIN length valid: ' + bin.prefix);
}

// COUNTRIES is alphabetized and each entry has ISO code + name.
assert.ok(Array.isArray(ctx.COUNTRIES) && ctx.COUNTRIES.length > 20, 'COUNTRIES populated');
for (const c of ctx.COUNTRIES) {
  assert.match(c.code, /^[A-Z]{2}$/, 'ISO-2 code: ' + JSON.stringify(c));
  assert.ok(c.name && c.name.length > 0, 'name set: ' + JSON.stringify(c));
}

// NAME_POOLS shape: each locale has first, last, streets, locations.
assert.ok(ctx.NAME_POOLS && typeof ctx.NAME_POOLS === 'object', 'NAME_POOLS is an object');
for (const code of Object.keys(ctx.NAME_POOLS)) {
  const pool = ctx.NAME_POOLS[code];
  assert.ok(Array.isArray(pool.first) && pool.first.length > 0, `${code}: first names`);
  assert.ok(Array.isArray(pool.last) && pool.last.length > 0, `${code}: last names`);
  assert.ok(Array.isArray(pool.streets) && pool.streets.length > 0, `${code}: streets`);
  assert.ok(typeof pool.zip === 'function', `${code}: zip is a function`);
  assert.ok(Array.isArray(pool.locations), `${code}: locations array`);
  for (const loc of pool.locations) {
    assert.ok(loc.city, `${code} location missing city`);
    assert.ok(typeof loc.state === 'string', `${code} location state must be string`);
    assert.ok(Array.isArray(loc.zips), `${code} location zips must be array`);
  }
}

// Every COUNTRIES entry has a matching NAME_POOLS entry.
for (const c of ctx.COUNTRIES) {
  assert.ok(ctx.NAME_POOLS[c.code], 'COUNTRIES entry without NAME_POOLS: ' + c.code);
}

// DEFAULT_POOL fallback is still defined.
assert.ok(ctx.DEFAULT_POOL && Array.isArray(ctx.DEFAULT_POOL.first), 'DEFAULT_POOL is present');

console.log('Core tests passed');
