// Autobilling content script — fills Stripe card forms
// Receives card + person data from popup via chrome.storage.local

// ============ DATA VALIDATION ============

function validateLuhn(number) {
  var digits = String(number).replace(/\D/g, '').split('').map(Number);
  if (digits.length < 2) return false;
  var check = digits.pop();
  var sum = digits.reverse().reduce(function (acc, d, i) {
    if (i % 2 === 0) {
      var doubled = d * 2;
      return acc + (doubled > 9 ? doubled - 9 : doubled);
    }
    return acc + d;
  }, 0);
  return (sum + check) % 10 === 0;
}

function validateCardData(card) {
  if (!card) return 'No card data';
  if (!card.number || !/^\d{13,19}$/.test(card.number)) return 'Invalid card number format';
  if (!validateLuhn(card.number)) return 'Card number fails Luhn check';
  if (!card.expMonth || !/^(0[1-9]|1[0-2])$/.test(card.expMonth)) return 'Invalid expiry month: ' + card.expMonth;
  if (!card.expYear || !/^\d{2}$/.test(card.expYear)) return 'Invalid expiry year: ' + card.expYear;

  var now = new Date();
  var expFull = 2000 + parseInt(card.expYear, 10);
  var expMon = parseInt(card.expMonth, 10);
  if (expFull < now.getFullYear() || (expFull === now.getFullYear() && expMon < (now.getMonth() + 1))) {
    return 'Card expired: ' + card.expMonth + '/' + card.expYear;
  }

  if (!card.cvv || !/^\d{3,4}$/.test(card.cvv)) return 'Invalid CVV: ' + card.cvv;
  return null; // OK
}

function validatePersonData(person) {
  if (!person) return 'No person data';
  if (!person.fullName || person.fullName.length < 3) return 'Invalid name';
  if (!person.address1 || person.address1.length < 3) return 'Invalid address';
  if (!person.country) return 'No country code';
  return null; // OK
}

// ============ DOM HELPERS ============

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

// Polyfill CSS.escape
if (typeof CSS === 'undefined' || !CSS.escape) {
  (window.CSS || (window.CSS = {})).escape = function (value) {
    return String(value).replace(/([^\w-])/g, '\\$1');
  };
}

function queryAll(selector) {
  try { return document.querySelectorAll(selector); } catch (e) { return []; }
}

function queryFirst(selectors) {
  for (var i = 0; i < selectors.length; i++) {
    try {
      var el = document.querySelector(selectors[i]);
      if (el) return el;
    } catch (e) {}
  }
  return null;
}

function fillInput(input, value) {
  if (!input || value === undefined || value === null) return;
  try {
    input.focus();
    var nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    );
    if (nativeSetter && nativeSetter.set) {
      nativeSetter.set.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    // Check if value stuck (React/Vue may reset on re-render)
    if (input.value !== value) {
      // Try execCommand — selects only THIS input's text, not the whole page
      input.focus();
      input.select();
      document.execCommand('insertText', false, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  } catch (e) {
    try {
      input.focus();
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e2) {}
    return false;
  }
}

function fillTextarea(textarea, value) {
  if (!textarea || value === undefined || value === null) return;
  try {
    textarea.focus();
    var nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    );
    if (nativeSetter && nativeSetter.set) {
      nativeSetter.set.call(textarea, value);
    } else {
      textarea.value = value;
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  } catch (e) {
    try { textarea.value = value; } catch (e2) {}
    return false;
  }
}

function fillSelect(select, value, valueName) {
  if (!select || !value) return;
  try {
    var vLower = value.toLowerCase();
    var nameLower = (valueName || '').toLowerCase();
    // Try by value first (exact match)
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value.toLowerCase() === vLower) {
        select.value = select.options[i].value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    // Try by option text (exact)
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].textContent.trim().toLowerCase() === vLower ||
          select.options[i].textContent.trim().toLowerCase() === nameLower) {
        select.value = select.options[i].value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    // Try by option text (partial — value is substring)
    for (var i = 0; i < select.options.length; i++) {
      var optText = select.options[i].textContent.trim().toLowerCase();
      if (optText.indexOf(vLower) > -1 || (nameLower && optText.indexOf(nameLower) > -1)) {
        select.value = select.options[i].value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    // Try by option value containing country code
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value.indexOf(vLower) > -1) {
        select.value = select.options[i].value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

function typeChar(el, ch) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: ch, code: 'Key' + ch.toUpperCase(), bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keypress', { key: ch, code: 'Key' + ch.toUpperCase(), bubbles: true }));
  el.dispatchEvent(new InputEvent('input', { data: ch, inputType: 'insertText', bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keyup', { key: ch, code: 'Key' + ch.toUpperCase(), bubbles: true }));
}

function typeInIframe(iframe, value) {
  // Simulate typing character by character into a cross-origin iframe
  // by dispatching keyboard events on the iframe element
  iframe.focus();
  iframe.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  iframe.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  iframe.dispatchEvent(new MouseEvent('click', { bubbles: true }));

  for (var i = 0; i < value.length; i++) {
    var ch = value[i];
    if (ch === '\t') {
      iframe.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true }));
      iframe.dispatchEvent(new KeyboardEvent('keyup', { key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true }));
    } else {
      typeChar(iframe, ch);
    }
  }
  return true;
}

function fillCrossOriginIframe(iframe, value) {
  try {
    // Click the iframe to activate the input inside it
    iframe.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    iframe.focus();
    // Try accessing contentDocument (same-origin)
    try {
      var doc = iframe.contentDocument || iframe.contentWindow.document;
      if (doc) {
        var el = doc.activeElement;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
          el.focus();
          el.select();
          doc.execCommand('insertText', false, value);
          return true;
        }
        // If no active element, try first input
        var inputs = doc.querySelectorAll('input:not([type="hidden"])');
        if (inputs.length > 0) {
          inputs[0].focus();
          inputs[0].select();
          doc.execCommand('insertText', false, value);
          return true;
        }
      }
    } catch (e) {}
    // Cross-origin: simulate typing via keyboard events
    return typeInIframe(iframe, value);
  } catch (e) {}
  return false;
}

function findInputsInIframe(iframe) {
  try {
    var doc = iframe.contentDocument || iframe.contentWindow.document;
    return doc ? doc.querySelectorAll('input:not([type="hidden"])') : [];
  } catch (e) {
    return [];
  }
}

function fillIframeInput(iframe, value) {
  if (!iframe || value === undefined || value === null) return false;

  // Try same-origin access first
  var inputs = findInputsInIframe(iframe);
  if (inputs.length > 0) {
    var first = inputs[0];
    if (first.tagName === 'INPUT') {
      return fillInput(first, value) ? true : fillCrossOriginIframe(iframe, value);
    }
  }

  // Cross-origin fallback
  return fillCrossOriginIframe(iframe, value);
}

// ============ SCORE HELPERS ============

function getFieldLabel(inp) {
  var id = (inp.id || '').toLowerCase();
  var label = '';
  try {
    // 1. label[for] attribute
    if (id) {
      var lblEl = document.querySelector('label[for="' + CSS.escape(inp.id || '') + '"]');
      if (lblEl) label = lblEl.textContent || '';
    }
    // 2. labels property
    if (!label && inp.labels && inp.labels.length) label = inp.labels[0].textContent || '';
    // 3. aria-labelledby
    if (!label) {
      var labelledBy = inp.getAttribute('aria-labelledby');
      if (labelledBy) {
        var lbl = document.getElementById(labelledBy);
        if (lbl) label = lbl.textContent || '';
      }
    }
    // 4. parent label wrapping
    if (!label && inp.parentElement && inp.parentElement.tagName === 'LABEL') {
      label = inp.parentElement.textContent || '';
    }
    // 5. preceding sibling text node
    if (!label && inp.parentElement) {
      var prev = inp.previousElementSibling;
      if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'SPAN' || prev.tagName === 'DIV')) {
        label = (prev.textContent || '').substring(0, 60);
      }
    }
    // 6. parent container's first child text (common in modern UI frameworks)
    if (!label && inp.parentElement && inp.parentElement.parentElement) {
      var container = inp.parentElement;
      var firstChild = container.firstElementChild;
      if (firstChild && firstChild !== inp && firstChild.tagName !== 'INPUT' && firstChild.tagName !== 'SELECT') {
        label = (firstChild.textContent || '').substring(0, 60);
      }
    }
  } catch (e) {}
  return label.toLowerCase().trim();
}

function fieldScore(inp, patterns, prefixes, suffixes) {
  var id = (inp.id || '').toLowerCase();
  var name = (inp.name || '').toLowerCase();
  var attr = (inp.getAttribute('autocomplete') || '').toLowerCase();
  var ph = (inp.placeholder || '').toLowerCase();
  var aria = (inp.getAttribute('aria-label') || '').toLowerCase();
  var title = (inp.getAttribute('title') || '').toLowerCase();
  // Collect common data-* attributes used for field identification
  var dataAttrs = [
    'data-role', 'data-tid', 'data-qa', 'data-testid', 'data-cy',
    'data-field', 'data-field-name', 'data-elements-stable-field-name', 'data-placeholder',
    'data-el-id', 'data-automation-id', 'data-testing-id', 'data-name', 'data-label',
  ].map(function (a) { return (inp.getAttribute(a) || '').toLowerCase(); }).filter(Boolean).join(' ');

  var label = getFieldLabel(inp);

  // Normalize: replace _ with space so \bzip\b matches shipping_address_zip
  var combined = (id + ' ' + name + ' ' + attr + ' ' + ph + ' ' + label + ' ' + aria + ' ' + title + ' ' + dataAttrs)
    .replace(/_/g, ' ').replace(/\[/g, ' ').replace(/\]/g, ' ');

  for (var i = 0; i < patterns.length; i++) {
    if (patterns[i].test(combined)) return 2;
  }

  for (var i = 0; i < prefixes.length; i++) {
    for (var j = 0; j < suffixes.length; j++) {
      var full = prefixes[i] + suffixes[j];
      if (combined.indexOf(full) > -1) return 1;
    }
  }

  return 0;
}

function bestInput(selectors, patterns, prefixes, suffixes, excludeSet) {
  var all = queryAll(selectors);
  var best = null;
  var bestScore = 0;
  for (var i = 0; i < all.length; i++) {
    var inp = all[i];
    if (inp.type === 'hidden' || (excludeSet && excludeSet.has(inp))) continue;
    var score = fieldScore(inp, patterns, prefixes, suffixes);
    if (score > bestScore) {
      bestScore = score;
      best = inp;
    }
  }
  return { el: best, score: bestScore };
}

// ============ MAIN AUTOFILL ============

async function autofill(preCard, prePerson) {
  var cardErr = validateCardData(preCard);
  if (cardErr) throw new Error('Card: ' + cardErr);
  var personErr = validatePersonData(prePerson);
  if (personErr) throw new Error('Person: ' + personErr);

  var card = preCard;
  var person = prePerson;
  var filled = [];
  var used = new Set();

  console.log('[Autobilling] Card:', card.formatted, '(' + card.brand + ') |', person.fullName);

  // === Unified field map: patterns / prefixes + suffixes ===
  var fields = [
    {
      key: 'cardNumber',
      patterns: [
        /\bcc-number\b/, /\bcard.?number\b/, /\bcc_number\b/, /\bnumber\b.*\bcard\b/, /\bcardnum\b/,
        /\bccnum\b/, /\bccno\b/, /\bcard_no\b/, /\bcardno\b/, /\bpan\b/,
        /\bcredit.?card.?num\b/, /\bdebit.?card.?num\b/,
      ],
      prefixes: ['card', 'cc', 'credit', 'debit', 'pan'],
      suffixes: ['number', 'num', 'nubmer', 'no', 'nbr', 'numero', 'pan'],
      value: card.number,
      isCard: true,
    },
    {
      key: 'expMonth',
      patterns: [
        /\bcc-exp-month\b/, /\bexp.?month\b/, /\bexp.?mo\b/, /\bexpiry.?month\b/,
        /\bcc_expirymo\b/, /\bcard.?exp.?month\b/,
      ],
      prefixes: ['exp', 'expiry', 'cc_exp', 'card_exp'],
      suffixes: ['month', 'mo', 'mm', 'mon'],
      value: card.expMonth,
      isCard: true,
    },
    {
      key: 'expYear',
      patterns: [
        /\bcc-exp-year\b/, /\bexp.?year\b/, /\bexpiry.?year\b/,
        /\bcc_expiryyr\b/, /\bcard.?exp.?year\b/,
      ],
      prefixes: ['exp', 'expiry', 'cc_exp', 'card_exp'],
      suffixes: ['year', 'yr', 'yy', 'yyyy'],
      value: card.expYear,
      isCard: true,
    },
    {
      key: 'expiry',
      patterns: [
        /\bcc-exp\b/, /\bexpir\b/, /\bexp.?date\b/, /\bvalidity\b/, /\bmm\b.*\byy\b/,
        /\bcard.?exp\b/, /\bexpirasyon\b/, /\bvalidade\b/,
      ],
      prefixes: ['exp', 'expiry', 'cc_exp', 'card_'],
      suffixes: ['expiry', 'exp', 'date', 'month_year', 'expdate'],
      value: card.expMonth + card.expYear,
      isCard: true,
    },
    {
      key: 'cvv',
      patterns: [
        /\bcc-csc\b/, /\bcsc\b/, /\bcvv\b/, /\bcvc\b/, /\bsecurity.?code\b/,
        /\bcid\b/, /\bcard.?verif\b/, /\bcvv2\b/, /\bcvc2\b/,
      ],
      prefixes: ['card', 'cc', 'cvv', 'cvc', 'security', 'csc', 'cid'],
      suffixes: ['cvv', 'cvc', 'cvc2', 'cvn', 'code', 'csc', 'cid', 'verif'],
      value: card.cvv,
      isCard: true,
    },
    {
      key: 'cardholderName',
      patterns: [
        /\bcc-name\b/, /\bcard.?holder\b/, /\bcard.?name\b/, /\bname.?on.?card\b/, /\bnamenam\b/,
        /\bccowner\b/, /\bcard.?owner\b/, /\bcardholder\b/,
      ],
      prefixes: ['card', 'cc', 'credit', 'cardholder', 'holder', 'ccowner'],
      suffixes: ['holder', 'name', 'holdername', 'nam', 'owner'],
      value: person.fullName,
    },
    {
      key: 'firstName',
      patterns: [
        /\bfirst.?name\b/, /\bfname\b/, /\bgiven.?name\b/, /\bprenom\b/, /\bvorname\b/,
        /\bимя\b/, /\bnombre\b/,
      ],
      prefixes: ['first', 'fname', 'given', 'billing', 'shipping'],
      suffixes: ['name', 'fname', 'first'],
      value: person.firstName || person.fullName.split(' ')[0] || '',
    },
    {
      key: 'lastName',
      patterns: [
        /\blast.?name\b/, /\blname\b/, /\bfamily.?name\b/, /\bnom\b/, /\bnachname\b/,
        /\bфамилия\b/, /\bapellido\b/,
      ],
      prefixes: ['last', 'lname', 'family', 'surname', 'billing', 'shipping'],
      suffixes: ['name', 'lname', 'last', 'surname'],
      value: person.lastName || person.fullName.split(' ').slice(1).join(' ') || '',
    },
    {
      key: 'name',
      patterns: [
        /\bfull.?name\b/, /\bcontact.?name\b/, /\byour.?name\b/,
      ],
      prefixes: ['billing', 'account', 'shipping', 'contact', 'customer', 'payer'],
      suffixes: ['name', 'fullname', 'full_name'],
      value: person.fullName,
    },
    {
      key: 'address1',
      patterns: [
        /\baddress-line1\b/, /\bstreet.?address\b/, /\baddress1\b/, /\baddress_1\b/, /\baddr1\b/, /\bline1\b/,
        /\bstreetaddress\b/, /\baddr_line1\b/, /\baddressline1\b/,
      ],
      prefixes: ['address', 'addr', 'billing', 'shipping', 'street'],
      suffixes: ['address1', 'address_1', 'addr1', 'line1', 'street', 'line_one', 'address'],
      value: person.address1,
    },
    {
      key: 'address2',
      patterns: [
        /\baddress-line2\b/, /\baddress2\b/, /\baddress_2\b/, /\baddr2\b/, /\bline2\b/,
        /\baddr_line2\b/, /\baddressline2\b/,
      ],
      prefixes: ['address', 'addr', 'billing', 'shipping'],
      suffixes: ['address2', 'address_2', 'addr2', 'line2', 'street2', 'line_two'],
      value: person.address2,
    },
    {
      key: 'postal',
      patterns: [
        /\bpostal-code\b/, /\bzip.?code\b/, /\bpostcode\b/, /\bzipcode\b/, /\bbe_postal\b/,
        /\bpost.?code\b/, /\bpincode\b/, /\bindex\b/, /\bpostalcode\b/, /\bzip\b/,
      ],
      prefixes: ['postal', 'zip', 'be_postal', 'postcode', 'pin', 'post'],
      suffixes: ['code', 'zip', 'postal', 'pincode', 'postalcode', 'index', 'number'],
      value: person.postalCode,
    },
    {
      key: 'city',
      patterns: [
        /\baddress-level2\b/, /\bcity\b/, /\btown\b/, /\blocality\b/, /\bville\b/, /\bstadt\b/,
        /\bгород\b/, /\bciudad\b/,
      ],
      prefixes: ['city', 'town', 'billing', 'shipping', 'locality'],
      suffixes: ['city', 'town', 'ville', 'locality'],
      value: person.city,
    },
    {
      key: 'country',
      patterns: [
        /\bcountry\b/, /\bcountry-name\b/, /\bcountry_code\b/, /\bpays\b/, /\bland\b/,
        /\bстрана\b/, /\bpais\b/,
      ],
      prefixes: ['country', 'nation', 'billing', 'shipping'],
      suffixes: ['country', 'countrycode', 'country_code', 'countryname', 'code'],
      value: person.country,
      valueName: person.countryName,
      isSelect: true,
    },
    {
      key: 'state',
      patterns: [
        /\baddress-level1\b/, /\bstate\b/, /\bprovince\b/, /\bregion\b/, /\bcounty\b/,
        /\badministrative\b/, /\betat\b/, /\bbundesland\b/, /\bобласт\b/, /\bprov\b/,
      ],
      prefixes: ['state', 'province', 'region', 'county', 'billing', 'shipping', 'administrative'],
      suffixes: ['state', 'province', 'region', 'county', 'prov', 'area'],
      value: person.state || '',
      isSelect: true,
    },
    {
      key: 'phone',
      patterns: [
        /\btel\b/, /\bphone\b/, /\bmobile\b/, /\bcell\b/, /\btelephone\b/,
        /\btelefone\b/, /\bтелефон\b/, /\btelefono\b/,
      ],
      prefixes: ['phone', 'mobile', 'cell', 'telephone', 'tel', 'contact'],
      suffixes: ['phone', 'mobile', 'cell', 'tel', 'cellphone', 'telephone', 'number'],
      value: person.phone || '',
    },
    {
      key: 'email',
      patterns: [
        /\bemail\b/, /\bemailaddress\b/, /\be-mail\b/, /\bcourriel\b/,
        /\bэлектронная\b/, /\bcorreo\b/,
      ],
      prefixes: ['email', 'e_mail', 'mail', 'contact'],
      suffixes: ['email', 'mail', 'address'],
      value: person.email || '',
    },
  ];

  // === STEP 2: Universal field matching ===
  for (var f = 0; f < fields.length; f++) {
    var field = fields[f];
    if (filled.indexOf(field.key) > -1) continue;
    var r = bestInput('input:not([type="hidden"]), select, textarea', field.patterns, field.prefixes, field.suffixes, used);
    if (r.el && r.score > 0) {
      if (field.isSelect && r.el.tagName === 'SELECT') {
        fillSelect(r.el, field.value, field.valueName);
      } else if (r.el.tagName === 'TEXTAREA') {
        fillTextarea(r.el, field.value);
      } else {
        fillInput(r.el, field.value);
      }
      filled.push(field.key);
      used.add(r.el);
    }
  }

  // === STEP 3: Fallback by autocomplete ===
  var autoInputs = queryAll('input[autocomplete]:not([type="hidden"]), select[autocomplete], textarea[autocomplete]');
  for (var i = 0; i < autoInputs.length; i++) {
    var ai = autoInputs[i];
    if (used.has(ai) || (ai.value && ai.value.length > 0)) continue;
    var attr = (ai.getAttribute('autocomplete') || '').toLowerCase();
    if (attr === 'cc-number') {
      fillInput(ai, card.number); filled.push('cardNumber'); used.add(ai);
    } else if (attr === 'cc-exp') {
      fillInput(ai, card.expMonth + card.expYear); filled.push('expiry'); used.add(ai);
    } else if (attr === 'cc-exp-month') {
      fillInput(ai, card.expMonth); filled.push('expMonth'); used.add(ai);
    } else if (attr === 'cc-exp-year') {
      fillInput(ai, '20' + card.expYear); filled.push('expYear'); used.add(ai);
    } else if (attr === 'cc-csc') {
      fillInput(ai, card.cvv); filled.push('cvv'); used.add(ai);
    } else if (attr === 'cc-name' || attr === 'cc-given-name') {
      fillInput(ai, person.fullName); filled.push('cardholderName'); used.add(ai);
    } else if (attr === 'cc-family-name') {
      fillInput(ai, person.lastName || person.fullName.split(' ').slice(1).join(' ') || ''); used.add(ai);
    } else if (attr === 'name') {
      fillInput(ai, person.fullName); filled.push('name'); used.add(ai);
    } else if (attr === 'given-name' || attr === 'first-name') {
      fillInput(ai, person.firstName || person.fullName.split(' ')[0] || ''); used.add(ai);
    } else if (attr === 'family-name' || attr === 'last-name') {
      fillInput(ai, person.lastName || person.fullName.split(' ').slice(1).join(' ') || ''); used.add(ai);
    } else if (attr === 'address-line1' || attr === 'street-address') {
      fillInput(ai, person.address1); filled.push('address1'); used.add(ai);
    } else if (attr === 'address-line2') {
      fillInput(ai, person.address2 || ''); used.add(ai);
    } else if (attr === 'address-line3') {
      // skip
    } else if (attr === 'postal-code' || attr === 'zip-code') {
      fillInput(ai, person.postalCode); filled.push('postal'); used.add(ai);
    } else if (attr === 'address-level2' || attr === 'city') {
      fillInput(ai, person.city); filled.push('city'); used.add(ai);
    } else if (attr === 'address-level1' || attr === 'state' || attr === 'region' || attr === 'province') {
      if (ai.tagName === 'SELECT') fillSelect(ai, person.state || '', '');
      else fillInput(ai, person.state || '');
      filled.push('state'); used.add(ai);
    } else if (attr === 'country' || attr === 'country-name' || attr === 'country-code') {
      if (ai.tagName === 'SELECT') fillSelect(ai, person.country, person.countryName);
      else fillInput(ai, person.countryName || person.country);
      filled.push('country'); used.add(ai);
    } else if (attr === 'email') {
      fillInput(ai, person.email || ''); filled.push('email'); used.add(ai);
    } else if (attr === 'tel' || attr === 'tel-national') {
      fillInput(ai, person.phone || ''); filled.push('phone'); used.add(ai);
    }
  }

  // === STEP 4: aria-label + multilingual fallback ===
  var ariaInputs = queryAll('input:not([type="hidden"]), select:not([type="hidden"]), textarea');
  for (var i = 0; i < ariaInputs.length; i++) {
    var ai = ariaInputs[i];
    if (used.has(ai)) continue;
    var aLabel = (ai.getAttribute('aria-label') || '').toLowerCase();
    if (!aLabel) continue;
    var aVal = ai.value || '';
    if (aVal.length > 0) continue;

    if (aLabel.indexOf('card number') > -1 || aLabel.indexOf('номер карты') > -1 || aLabel.indexOf('numero de carte') > -1 || aLabel.indexOf('kartennummer') > -1) {
      fillInput(ai, card.number); filled.push('cardNumber'); used.add(ai);
    } else if (aLabel.indexOf('expir') > -1 || aLabel.indexOf('мм / гг') > -1 || aLabel.indexOf('mm / yy') > -1 || aLabel.indexOf('valid') > -1 || aLabel.indexOf('gültig') > -1 || aLabel.indexOf('validade') > -1) {
      fillInput(ai, card.expMonth + ' / ' + card.expYear); filled.push('expiry'); used.add(ai);
    } else if (aLabel.indexOf('cvv') > -1 || aLabel.indexOf('cvc') > -1 || aLabel.indexOf('код') > -1 || aLabel.indexOf('security code') > -1 || aLabel.indexOf('cryptogramme') > -1 || aLabel.indexOf('sicherheitscode') > -1) {
      fillInput(ai, card.cvv); filled.push('cvv'); used.add(ai);
    } else if ((aLabel.indexOf('имя') > -1 && (aLabel.indexOf('владельц') > -1 || aLabel.indexOf('карт') > -1)) || aLabel.indexOf('name on card') > -1 || aLabel.indexOf('titulaire') > -1 || aLabel.indexOf('karteninhaber') > -1) {
      fillInput(ai, person.fullName); filled.push('cardholderName'); used.add(ai);
    } else if (aLabel.indexOf('email') > -1 || aLabel.indexOf('courriel') > -1 || aLabel.indexOf('эл. почта') > -1) {
      fillInput(ai, person.email || ''); filled.push('email'); used.add(ai);
    } else if (aLabel.indexOf('phone') > -1 || aLabel.indexOf('téléphone') > -1 || aLabel.indexOf('телефон') > -1 || aLabel.indexOf('telefono') > -1) {
      fillInput(ai, person.phone || ''); filled.push('phone'); used.add(ai);
    } else if (aLabel.indexOf('адрес') > -1 && aLabel.indexOf('строка 1') > -1 || aLabel.indexOf('address line 1') > -1 || aLabel.indexOf('adresse ligne 1') > -1) {
      fillInput(ai, person.address1); filled.push('address1'); used.add(ai);
    } else if (aLabel.indexOf('адрес') > -1 && aLabel.indexOf('строка 2') > -1 || aLabel.indexOf('address line 2') > -1 || aLabel.indexOf('adresse ligne 2') > -1) {
      fillInput(ai, person.address2 || ''); filled.push('address2'); used.add(ai);
    } else if (aLabel.indexOf('почтов') > -1 || aLabel.indexOf('postal') > -1 || aLabel.indexOf('zip') > -1 || aLabel.indexOf('code postal') > -1 || aLabel.indexOf('plz') > -1 || aLabel.indexOf('индекс') > -1) {
      fillInput(ai, person.postalCode); filled.push('postal'); used.add(ai);
    } else if (aLabel.indexOf('город') > -1 || (aLabel.indexOf('city') > -1 && aLabel.indexOf('address') === -1) || aLabel.indexOf('ville') > -1 || aLabel.indexOf('stadt') > -1) {
      fillInput(ai, person.city); filled.push('city'); used.add(ai);
    } else if (aLabel.indexOf('област') > -1 || aLabel.indexOf('state') > -1 || aLabel.indexOf('province') > -1 || aLabel.indexOf('etat') > -1 || aLabel.indexOf('bundesland') > -1) {
      if (ai.tagName === 'SELECT') fillSelect(ai, person.state || '', '');
      else fillInput(ai, person.state || '');
      filled.push('state'); used.add(ai);
    } else if (aLabel.indexOf('стран') > -1 || aLabel.indexOf('countr') > -1 || aLabel.indexOf('pays') > -1 || aLabel.indexOf('land') > -1) {
      if (ai.tagName === 'SELECT') fillSelect(ai, person.country, person.countryName);
      else fillInput(ai, person.countryName || person.country);
      filled.push('country'); used.add(ai);
    }
  }

  // === STEP 5: Aggressive placeholder/label text matching ===
  var allFillable = queryAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), select, textarea');
  for (var i = 0; i < allFillable.length; i++) {
    var el = allFillable[i];
    if (used.has(el)) continue;
    if (el.value && el.value.length > 0 && el.tagName !== 'SELECT') continue;

    var ph = (el.placeholder || '').toLowerCase().trim();
    var lbl = getFieldLabel(el);
    var combined = (ph + ' ' + lbl).trim();

    var match = null;
    // Card fields — prioritize matching by input type / maxlength hints
    var isNumericInput = el.type === 'tel' || el.type === 'number' || el.getAttribute('inputmode') === 'numeric';
    var maxLen = parseInt(el.maxLength, 10) || 999;

    if (!filledMap(filled, 'cardNumber') && (
      combined.indexOf('card number') > -1 || combined.indexOf('card num') > -1 ||
      combined.indexOf('номер карты') > -1 || combined.indexOf('numero de carte') > -1 ||
      combined.indexOf('kartennummer') > -1 || combined.indexOf('credit card') > -1 ||
      combined.indexOf('debit card') > -1 ||
      (isNumericInput && maxLen >= 13 && maxLen <= 19 && !filledMap(filled, 'cardNumber'))
    )) {
      match = { key: 'cardNumber', value: card.number };
    } else if (!filledMap(filled, 'expiry') && (
      combined.indexOf('expir') > -1 || combined.indexOf('mm / yy') > -1 ||
      combined.indexOf('мм / гг') > -1 || combined.indexOf('valid') > -1 ||
      combined.indexOf('gültig') > -1 || combined.indexOf('validade') > -1 ||
      (isNumericInput && maxLen >= 4 && maxLen <= 7 && ph.indexOf('/') > -1)
    )) {
      match = { key: 'expiry', value: card.expMonth + ' / ' + card.expYear };
    } else if (!filledMap(filled, 'expMonth') && (
      combined.indexOf('month') > -1 && combined.indexOf('exp') > -1
    )) {
      match = { key: 'expMonth', value: card.expMonth };
    } else if (!filledMap(filled, 'expYear') && (
      combined.indexOf('year') > -1 && combined.indexOf('exp') > -1
    )) {
      match = { key: 'expYear', value: '20' + card.expYear };
    } else if (!filledMap(filled, 'cvv') && (
      combined.indexOf('cvv') > -1 || combined.indexOf('cvc') > -1 ||
      combined.indexOf('security code') > -1 || combined.indexOf('код') > -1 ||
      combined.indexOf('cryptogramme') > -1 || combined.indexOf('cid') > -1 ||
      (isNumericInput && maxLen >= 3 && maxLen <= 4 && (combined.indexOf('code') > -1 || combined.indexOf('код') > -1))
    )) {
      match = { key: 'cvv', value: card.cvv };
    } else if (!filledMap(filled, 'cardholderName') && (
      combined.indexOf('name on card') > -1 || combined.indexOf('card holder') > -1 ||
      combined.indexOf('cardholder') > -1 || combined.indexOf('titulaire') > -1 ||
      combined.indexOf('karteninhaber') > -1 || combined.indexOf('имя владельца') > -1 ||
      combined.indexOf('имя на карте') > -1
    )) {
      match = { key: 'cardholderName', value: person.fullName };
    } else if (!filledMap(filled, 'firstName') && (
      combined.indexOf('first name') > -1 || combined.indexOf('prénom') > -1 ||
      combined.indexOf('vorname') > -1 || combined.indexOf('имя') > -1
    )) {
      match = { key: 'firstName', value: person.firstName || person.fullName.split(' ')[0] || '' };
    } else if (!filledMap(filled, 'lastName') && (
      combined.indexOf('last name') > -1 || combined.indexOf('surname') > -1 ||
      combined.indexOf('nom') > -1 || combined.indexOf('nachname') > -1 ||
      combined.indexOf('фамилия') > -1 || combined.indexOf('apellido') > -1
    )) {
      match = { key: 'lastName', value: person.lastName || person.fullName.split(' ').slice(1).join(' ') || '' };
    } else if (!filledMap(filled, 'name') && (
      combined.indexOf('full name') > -1 || combined.indexOf('your name') > -1 ||
      combined.indexOf('contact name') > -1 || combined.indexOf('имя') > -1 ||
      combined.indexOf('nombre') > -1 ||
      (combined.indexOf('name') > -1 && combined.indexOf('card') === -1 && combined.indexOf('user') === -1 &&
       combined.indexOf('last') === -1 && combined.indexOf('first') === -1 &&
       combined.indexOf('file') === -1 && combined.indexOf('domain') === -1)
    )) {
      match = { key: 'name', value: person.fullName };
    } else if (!filledMap(filled, 'address1') && (
      combined.indexOf('street') > -1 || combined.indexOf('address 1') > -1 ||
      combined.indexOf('address1') > -1 || combined.indexOf('адрес') > -1 ||
      combined.indexOf('adresse') > -1 || combined.indexOf('straß') > -1 ||
      combined.indexOf('calle') > -1 ||
      (combined.indexOf('address') > -1 && combined.indexOf('email') === -1 &&
       combined.indexOf('ip') === -1 && combined.indexOf('mac') === -1)
    )) {
      match = { key: 'address1', value: person.address1 };
    } else if (!filledMap(filled, 'postal') && (
      combined.indexOf('postal') > -1 || combined.indexOf('zip') > -1 ||
      combined.indexOf('postcode') > -1 || combined.indexOf('почтов') > -1 ||
      combined.indexOf('индекс') > -1 || combined.indexOf('code postal') > -1 ||
      combined.indexOf('plz') > -1
    )) {
      match = { key: 'postal', value: person.postalCode };
    } else if (!filledMap(filled, 'city') && (
      combined.indexOf('city') > -1 || combined.indexOf('locality') > -1 ||
      combined.indexOf('town') > -1 || combined.indexOf('город') > -1 ||
      combined.indexOf('ville') > -1 || combined.indexOf('stadt') > -1 ||
      combined.indexOf('ciudad') > -1
    )) {
      match = { key: 'city', value: person.city };
    } else if (!filledMap(filled, 'country') && (
      combined.indexOf('country') > -1 || combined.indexOf('стран') > -1 ||
      combined.indexOf('pays') > -1 || combined.indexOf('land') > -1 ||
      combined.indexOf('país') > -1
    )) {
      match = { key: 'country', value: person.country, valueName: person.countryName, isSelect: true };
    } else if (!filledMap(filled, 'state') && (
      combined.indexOf('state') > -1 || combined.indexOf('province') > -1 ||
      combined.indexOf('region') > -1 || combined.indexOf('област') > -1 ||
      combined.indexOf('bundesland') > -1 || combined.indexOf('etat') > -1 ||
      combined.indexOf('provincia') > -1
    )) {
      match = { key: 'state', value: person.state || '', isSelect: true };
    } else if (!filledMap(filled, 'email') && (
      combined.indexOf('email') > -1 || combined.indexOf('e-mail') > -1 ||
      combined.indexOf('courriel') > -1 || combined.indexOf('эл') > -1 ||
      combined.indexOf('correo') > -1
    )) {
      match = { key: 'email', value: person.email || '' };
    } else if (!filledMap(filled, 'phone') && (
      combined.indexOf('phone') > -1 || combined.indexOf('mobile') > -1 ||
      combined.indexOf('telephone') > -1 || combined.indexOf('телефон') > -1 ||
      combined.indexOf('telefono') > -1 || combined.indexOf('téléphone') > -1
    )) {
      match = { key: 'phone', value: person.phone || '' };
    }

    if (match) {
      if (match.isSelect && el.tagName === 'SELECT') {
        fillSelect(el, match.value, match.valueName || '');
      } else if (el.tagName === 'TEXTAREA') {
        fillTextarea(el, match.value);
      } else {
        fillInput(el, match.value);
      }
      filled.push(match.key);
      used.add(el);
    }
  }

  console.log('[Autobilling] Fill complete. Fields filled:', filled.length > 0 ? filled.join(', ') : 'none detected');
  return { card: card, person: person, filled: filled };
}

function filledMap(filled, key) {
  for (var i = 0; i < filled.length; i++) {
    if (filled[i] === key) return true;
    if (filled[i].indexOf(key) === 0) return true;
  }
  return false;
}

// ============ MESSAGING ============

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.action === 'autofill') {
    // Use pre-generated card from storage
    chrome.storage.local.get(['card', 'person'], function (data) {
      var card = msg.card || data.card;
      var person = msg.person || data.person;
      if (!card || !person) {
        sendResponse({ success: false, error: 'No card stored. Click Generate first.' });
        return;
      }
      autofill(card, person).then(function (result) {
        sendResponse({ success: true, card: result.card, person: result.person, filled: result.filled });
      }).catch(function (err) {
        sendResponse({ success: false, error: err.message });
      });
    });
    return true; // async response
  }
  if (msg.action === 'ping') {
    sendResponse({ ready: true, stripePage: window.location.hostname.indexOf('stripe.com') > -1 });
  }
});

// ============ INIT ============

(function () {
  var isStripe = window.location.hostname.indexOf('stripe.com') > -1 ||
                 window.location.hostname.indexOf('checkout.stripe.com') > -1;
  console.log('[Autobilling] Content script ready. Stripe page:', isStripe);
})();
