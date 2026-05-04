const assert = require('assert');
const { buildAutofillDiagnostics, formatAutofillStatus } = require('../src/autofillDiagnostics');

const diagnostics = buildAutofillDiagnostics(['cardNumber', 'expiry', 'cvv', 'postal']);
assert.deepStrictEqual(diagnostics.filled, ['card number', 'expiry', 'CVV', 'postal code']);
assert.deepStrictEqual(diagnostics.missing, [
  'cardholder name', 'address line 1', 'address line 2',
  'city', 'state/province', 'country', 'email', 'phone',
]);

assert.strictEqual(
  formatAutofillStatus({ success: true, filled: ['cardNumber', 'cvv'] }),
  'Filled 2/12: card number, CVV. Missing: expiry, cardholder name, address line 1, address line 2, postal code, city, state/province, country, email, phone',
);
assert.strictEqual(
  formatAutofillStatus({ success: false, error: 'Cannot access page' }),
  'Cannot access page',
);

console.log('Autofill diagnostics tests passed');
