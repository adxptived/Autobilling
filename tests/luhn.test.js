const assert = require('assert');
const { validateLuhn, generateCardNumber } = require('../generator');

assert.strictEqual(validateLuhn('4242424242424242'), true);
assert.strictEqual(validateLuhn('4242424242424241'), false);

for (const prefix of ['4', '409636', '515462', '559888039']) {
  for (let i = 0; i < 100; i++) {
    const card = generateCardNumber(prefix, 16);
    assert.strictEqual(card.startsWith(prefix), true);
    assert.strictEqual(card.length, 16);
    assert.strictEqual(validateLuhn(card), true);
  }
}

console.log('Luhn tests passed');
