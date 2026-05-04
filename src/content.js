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
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    return true;
  } catch (e) {
    try { input.value = value; } catch (e2) {}
    return false;
  }
}

function fillSelect(select, value) {
  if (!select || !value) return;
  try {
    // Try by value first
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value.toLowerCase() === value.toLowerCase()) {
        select.value = select.options[i].value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    // Try by text
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].textContent.toLowerCase().indexOf(value.toLowerCase()) > -1) {
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

function fillCrossOriginIframe(iframe, value) {
  try {
    iframe.focus();
    // execCommand fallback for cross-origin iframes
    var doc = iframe.contentDocument || iframe.contentWindow.document;
    if (doc && doc.activeElement) {
      var el = doc.activeElement;
      if (el.tagName === 'INPUT') {
        doc.execCommand('selectAll', false, null);
        doc.execCommand('insertText', false, value);
        return true;
      }
    }
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

  // Try same-origin access
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

function fieldScore(inp, patterns, prefixes, suffixes) {
  var id = (inp.id || '').toLowerCase();
  var name = (inp.name || '').toLowerCase();
  var attr = (inp.getAttribute('autocomplete') || '').toLowerCase();
  var ph = (inp.placeholder || '').toLowerCase();
  var aria = (inp.getAttribute('aria-label') || '').toLowerCase();
  var dataRole = (inp.getAttribute('data-role') || '').toLowerCase();
  var label = '';

  try {
    if (inp.labels && inp.labels.length) label = inp.labels[0].textContent || '';
    var labelledBy = inp.getAttribute('aria-labelledby');
    if (!label && labelledBy) {
      var lbl = document.getElementById(labelledBy);
      if (lbl) label = (lbl.textContent || '').toLowerCase();
    }
    if (!label && id) {
      var lblEl = document.querySelector('label[for="' + CSS.escape(id) + '"]');
      if (lblEl) label = (lblEl.textContent || '').toLowerCase();
    }
  } catch (e) {}

  var combined = id + ' ' + name + ' ' + attr + ' ' + ph + ' ' + label + ' ' + aria + ' ' + dataRole;

  for (var i = 0; i < patterns.length; i++) {
    if (patterns[i].test(combined)) return 1;
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

  // === STEP 1: Stripe iframes ===
  var allFrames = document.querySelectorAll('iframe');
  var stripeIframes = [];

  for (var i = 0; i < allFrames.length; i++) {
    var f = allFrames[i];
    var frameName = (f.name || '').toLowerCase();
    var src = (f.src || '').toLowerCase();
    var title = (f.title || '').toLowerCase();

    if (frameName.indexOf('__privatestripeframe') !== 0 &&
        src.indexOf('stripe.com') === -1 &&
        src.indexOf('js.stripe') === -1) continue;

    if (src.indexOf('controller') > -1) continue;
    if (src.indexOf('m-outer') > -1 || src.indexOf('metrics') > -1) continue;
    if (src.indexOf('address-autocomplete') > -1) continue;
    if (title.indexOf('hcaptcha') > -1 || title.indexOf('human') > -1) continue;
    if (title.indexOf('express') > -1) continue;

    stripeIframes.push(f);
  }

  if (stripeIframes.length >= 3) {
    fillIframeInput(stripeIframes[0], card.number);
    filled.push('cardNumber');
    await sleep(120);
    fillIframeInput(stripeIframes[1], card.expMonth + card.expYear);
    filled.push('expiry');
    await sleep(120);
    fillIframeInput(stripeIframes[2], card.cvv);
    filled.push('cvv');
    await sleep(120);
  } else if (stripeIframes.length === 1) {
    fillIframeInput(stripeIframes[0], card.number);
    filled.push('cardNumber(single-iframe)');
    await sleep(120);
  } else if (stripeIframes.length === 2) {
    fillIframeInput(stripeIframes[0], card.number);
    filled.push('cardNumber');
    await sleep(120);
    fillIframeInput(stripeIframes[1], card.expMonth + card.expYear);
    filled.push('expiry');
    await sleep(120);
  }

  // === Unified field map: patterns / prefixes + suffixes ===
  var fields = [
    {
      key: 'cardNumber',
      patterns: [
        /\bcc-number\b/, /\bcard.?number\b/, /\bcc_number\b/, /\bnumber\b.*\bcard\b/, /\bcardnum\b/,
      ],
      prefixes: ['card', 'cc', 'credit'],
      suffixes: ['number', 'num', 'nubmer'],
      value: card.number,
    },
    {
      key: 'expiry',
      patterns: [
        /\bcc-exp\b/, /\bexpir\b/, /\bexp.?date\b/, /\bvalidity\b/, /\bmm\b.*\byy\b/, /\bcd_expirymo\b/,
      ],
      prefixes: ['exp', 'expiry', 'cc_exp', 'card_'],
      suffixes: ['expiry', 'exp', 'date', 'month_year'],
      value: card.expMonth + card.expYear,
    },
    {
      key: 'cvv',
      patterns: [
        /\bcc-csc\b/, /\bcsc\b/, /\bcvv\b/, /\bcvc\b/, /\bsecurity.?code\b/,
      ],
      prefixes: ['card', 'cc', 'cvv', 'cvc', 'security', 'csc'],
      suffixes: ['cvv', 'cvc', 'cvc2', 'cvn', 'code', 'csc'],
      value: card.cvv,
    },
    {
      key: 'cardholderName',
      patterns: [
        /\bcc-name\b/, /\bcard.?holder\b/, /\bcard.?name\b/, /\bname.?on.?card\b/, /\bnamenam\b/,
      ],
      prefixes: ['card', 'cc', 'credit', 'cardholder', 'holder'],
      suffixes: ['holder', 'name', 'holdername', 'nam'],
      value: person.fullName,
    },
    {
      key: 'name',
      patterns: [
        /\bname\b/, /\bfull.?name\b/, /\bfirst_name\b/, /\blast_name\b/,
      ],
      prefixes: ['billing', 'account', 'shipping', 'contact'],
      suffixes: ['name', 'fullname'],
      value: person.fullName,
    },
    {
      key: 'address1',
      patterns: [
        /\baddress-line1\b/, /\bstreet.?address\b/, /\baddress1\b/, /\baddress_1\b/, /\baddr1\b/, /\bline1\b/,
      ],
      prefixes: ['address', 'addr', 'billing', 'shipping', 'street'],
      suffixes: ['address1', 'address_1', 'addr1', 'line1', 'street', 'line_one'],
      value: person.address1,
    },
    {
      key: 'address2',
      patterns: [
        /\baddress-line2\b/, /\baddress2\b/, /\baddress_2\b/, /\baddr2\b/, /\bline2\b/,
      ],
      prefixes: ['address', 'addr', 'billing', 'shipping'],
      suffixes: ['address2', 'address_2', 'addr2', 'line2', 'street2', 'line_two'],
      value: person.address2,
    },
    {
      key: 'postal',
      patterns: [
        /\bpostal-code\b/, /\bzip.?code\b/, /\bpostcode\b/, /\bzipcode\b/, /\bbe_postal\b/, /\bpc\b/,
      ],
      prefixes: ['postal', 'zip', 'be_postal', 'postcode', 'pin'],
      suffixes: ['code', 'zip', 'postal', 'pincode', 'postalcode', 'index'],
      value: person.postalCode,
    },
    {
      key: 'city',
      patterns: [
        /\baddress-level2\b/, /\bcity\b/, /\btown\b/,
      ],
      prefixes: ['city', 'town', 'billing', 'shipping'],
      suffixes: ['city', 'town'],
      value: person.city,
    },
    {
      key: 'country',
      patterns: [
        /\bcountry\b/, /\bcountry-name\b/, /\bcountry_code\b/,
      ],
      prefixes: ['country', 'nation', 'billing', 'shipping'],
      suffixes: ['country', 'countrycode', 'country_code', 'countryname'],
      value: person.country,
    },
    {
      key: 'state',
      patterns: [
        /\baddress-level1\b/, /\bstate\b/, /\bprovince\b/, /\bregion\b/, /\bcounty\b/,
      ],
      prefixes: ['state', 'province', 'region', 'county', 'billing', 'shipping'],
      suffixes: ['state', 'province', 'region', 'county'],
      value: person.state || '',
    },
    {
      key: 'phone',
      patterns: [
        /\btel\b/, /\bphone\b/, /\bmobile\b/, /\bcell\b/,
      ],
      prefixes: ['phone', 'mobile', 'cell', 'telephone'],
      suffixes: ['phone', 'mobile', 'cell', 'tel', 'cellphone', 'telephone'],
      value: person.phone || '',
    },
    {
      key: 'email',
      patterns: [
        /\bemail\b/, /\bemailaddress\b/, /\be-mail\b/,
      ],
      prefixes: ['email', 'e_mail', 'mail'],
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
      if (field.key === 'country' && r.el.tagName === 'SELECT') {
        fillSelect(r.el, person.country);
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
      fillInput(ai, card.expMonth); used.add(ai);
    } else if (attr === 'cc-exp-year') {
      fillInput(ai, '20' + card.expYear); used.add(ai);
    } else if (attr === 'cc-csc') {
      fillInput(ai, card.cvv); filled.push('cvv'); used.add(ai);
    } else if (attr === 'cc-name') {
      fillInput(ai, person.fullName); filled.push('cardholderName'); used.add(ai);
    } else if (attr === 'name') {
      fillInput(ai, person.fullName); filled.push('name'); used.add(ai);
    } else if (attr === 'address-line1' || attr === 'street-address') {
      fillInput(ai, person.address1); filled.push('address1'); used.add(ai);
    } else if (attr === 'address-line2') {
      fillInput(ai, person.address2); used.add(ai);
    } else if (attr === 'postal-code' || attr === 'zip-code') {
      fillInput(ai, person.postalCode); filled.push('postal'); used.add(ai);
    } else if (attr === 'address-level2' || attr === 'city') {
      fillInput(ai, person.city); filled.push('city'); used.add(ai);
    } else if (attr === 'address-level1' || attr === 'state' || attr === 'region') {
      fillInput(ai, person.state || ''); filled.push('state'); used.add(ai);
    } else if (attr === 'country' || attr === 'country-name') {
      if (ai.tagName === 'SELECT') fillSelect(ai, person.country);
      else fillInput(ai, person.countryName);
      filled.push('country'); used.add(ai);
    } else if (attr === 'email') {
      fillInput(ai, person.email || ''); filled.push('email'); used.add(ai);
    } else if (attr === 'tel') {
      fillInput(ai, person.phone || ''); filled.push('phone'); used.add(ai);
    }
  }

  // === STEP 4: aria-label + multilingual fallback ===
  var ariaInputs = queryAll('input:not([type="hidden"])');
  for (var i = 0; i < ariaInputs.length; i++) {
    var ai = ariaInputs[i];
    if (used.has(ai)) continue;
    var aLabel = (ai.getAttribute('aria-label') || '').toLowerCase();
    if (!aLabel) continue;
    var aVal = ai.value || '';
    if (aVal.length > 0) continue;

    if (aLabel.indexOf('card number') > -1 || aLabel.indexOf('номер карты') > -1) {
      fillInput(ai, card.number); used.add(ai);
    } else if (aLabel.indexOf('expir') > -1 ||aLabel.indexOf('мм / гг') > -1 || aLabel.indexOf('mm / yy') > -1 || aLabel.indexOf('valid') > -1) {
      fillInput(ai, card.expMonth + ' / ' + card.expYear); used.add(ai);
    } else if (aLabel.indexOf('cvv') > -1 || aLabel.indexOf('cvc') > -1 || aLabel.indexOf('код') > -1 || aLabel.indexOf('security code') > -1) {
      fillInput(ai, card.cvv); used.add(ai);
    } else if ((aLabel.indexOf('имя') > -1 && (aLabel.indexOf('владельц') > -1 || aLabel.indexOf('карт') > -1)) || aLabel.indexOf('name on card') > -1) {
      fillInput(ai, person.fullName); used.add(ai);
    } else if (aLabel.indexOf('email') > -1) {
      fillInput(ai, person.email || ''); used.add(ai);
    } else if (aLabel.indexOf('phone') > -1) {
      fillInput(ai, person.phone || ''); used.add(ai);
    } else if (aLabel.indexOf('адрес') > -1 && aLabel.indexOf('строка 1') > -1) {
      fillInput(ai, person.address1); used.add(ai);
    } else if (aLabel.indexOf('адрес') > -1 && aLabel.indexOf('строка 2') > -1) {
      fillInput(ai, person.address2); used.add(ai);
    } else if (aLabel.indexOf('почтов') > -1 || aLabel.indexOf('postal') > -1 || aLabel.indexOf('zip') > -1) {
      fillInput(ai, person.postalCode); used.add(ai);
    } else if (aLabel.indexOf('город') > -1 || (aLabel.indexOf('city') > -1 && aLabel.indexOf('address') === -1)) {
      fillInput(ai, person.city); used.add(ai);
    } else if (aLabel.indexOf('област') > -1 || aLabel.indexOf('state') > -1 || aLabel.indexOf('province') > -1) {
      fillInput(ai, person.state || ''); used.add(ai);
    } else if (aLabel.indexOf('стран') > -1 || aLabel.indexOf('countr') > -1) {
      fillInput(ai, person.countryName); used.add(ai);
    }
  }

  console.log('[Autobilling] Fill complete. Fields filled:', filled.length > 0 ? filled.join(', ') : 'none detected');
  return { card: card, person: person, filled: filled };
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
