const assert = require('assert');
const { buildAutofillDiagnostics, formatAutofillStatus } = require('../src/autofillDiagnostics');

const diagnostics = buildAutofillDiagnostics(['cardNumber', 'expiry', 'cvv', 'postal']);
assert.deepStrictEqual(diagnostics.filled, ['card number', 'expiry', 'CVV', 'postal code']);
assert.deepStrictEqual(diagnostics.missing, ['cardholder name', 'address line 1', 'city', 'country']);

assert.strictEqual(
  formatAutofillStatus({ success: true, filled: ['cardNumber', 'cvv'] }),
  'Filled 2/8: card number, CVV. Missing: expiry, cardholder name, address line 1, postal code, city, country',
);
assert.strictEqual(
  formatAutofillStatus({ success: false, error: 'Cannot access page' }),
  'Cannot access page',
);

console.log('Autofill diagnostics tests passed');
