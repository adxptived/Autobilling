var AUTOFILL_FIELDS = [
  { keys: ['cardNumber', 'cardNumber(single-iframe)'], label: 'card number' },
  { keys: ['expiry'], label: 'expiry' },
  { keys: ['cvv'], label: 'CVV' },
  { keys: ['cardholderName', 'name'], label: 'cardholder name' },
  { keys: ['address1'], label: 'address line 1' },
  { keys: ['postal'], label: 'postal code' },
  { keys: ['city'], label: 'city' },
  { keys: ['country'], label: 'country' },
];

function buildAutofillDiagnostics(filled) {
  filled = filled || [];
  var labels = [];
  var missing = [];
  for (var i = 0; i < AUTOFILL_FIELDS.length; i++) {
    var field = AUTOFILL_FIELDS[i];
    var found = false;
    for (var j = 0; j < field.keys.length; j++) {
      if (filled.indexOf(field.keys[j]) >= 0) found = true;
    }
    if (found) labels.push(field.label);
    else missing.push(field.label);
  }
  return { total: AUTOFILL_FIELDS.length, filled: labels, missing: missing };
}

function formatAutofillStatus(resp) {
  if (!resp || resp.error) return (resp && resp.error) || 'Fill failed';
  var diagnostics = buildAutofillDiagnostics(resp.filled || []);
  if (!diagnostics.filled.length) return 'No supported fields detected';
  var text = 'Filled ' + diagnostics.filled.length + '/' + diagnostics.total + ': ' + diagnostics.filled.join(', ');
  if (diagnostics.missing.length) text += '. Missing: ' + diagnostics.missing.join(', ');
  return text;
}

if (typeof module !== 'undefined') {
  module.exports = {
    buildAutofillDiagnostics: buildAutofillDiagnostics,
    formatAutofillStatus: formatAutofillStatus,
  };
}
