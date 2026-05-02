const assert = require('assert');
const { detectBin, resolveExpiry, addHistoryEntry } = require('../src/generator');

const bins = [
  { prefix: '400000' },
  { prefix: '515462' },
];
assert.strictEqual(detectBin('515462', bins), 1);
assert.strictEqual(detectBin('999999', bins), -1);

let expiry = resolveExpiry('03', '30', new Date('2026-01-01'));
assert.deepStrictEqual(expiry, { expMonth: '03', expYear: '30', expYearFull: '2030' });

expiry = resolveExpiry('random', 'random', new Date('2026-01-01'));
assert.match(expiry.expMonth, /^(0[1-9]|1[0-2])$/);
assert.match(expiry.expYear, /^\d{2}$/);
assert.ok(Number(expiry.expYear) >= 27);

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

console.log('Core tests passed');
