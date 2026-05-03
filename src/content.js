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

// ============ MAIN AUTOFILL ============

async function autofill(preCard, prePerson) {
  // Validate input data
  var cardErr = validateCardData(preCard);
  if (cardErr) throw new Error('Card: ' + cardErr);
  var personErr = validatePersonData(prePerson);
  if (personErr) throw new Error('Person: ' + personErr);

  var card = preCard;
  var person = prePerson;
  var filled = [];

  console.log('[Autobilling] Card:', card.formatted, '(' + card.brand + ') |', person.fullName);

  // === STEP 1: Detect and fill Stripe iframes ===
  var allFrames = document.querySelectorAll('iframe');
  var stripeIframes = [];

  for (var i = 0; i < allFrames.length; i++) {
    var f = allFrames[i];
    var name = (f.name || '').toLowerCase();
    var src = (f.src || '').toLowerCase();
    var title = (f.title || '').toLowerCase();

    // Strict Stripe frame detection
    if (name.indexOf('__privatestripeframe') !== 0 &&
        src.indexOf('stripe.com') === -1 &&
        src.indexOf('js.stripe') === -1) continue;

    // Skip non-card frames
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

  // === STEP 2: Standard HTML inputs (non-iframe, all fields) ===
  var allInputs = queryAll('input:not([type="hidden"]), [role="textbox"][contenteditable]');
  for (var i = 0; i < allInputs.length; i++) {
    var inp = allInputs[i];
    var id = (inp.id || '').toLowerCase();
    var name = (inp.name || '').toLowerCase();
    var auto = (inp.getAttribute('autocomplete') || '').toLowerCase();
    var ph = (inp.placeholder || '').toLowerCase();
    var aria = (inp.getAttribute('aria-label') || '').toLowerCase();
    var label = '';

    try {
      if (inp.labels && inp.labels.length) label = inp.labels[0].textContent || '';
      var labelledBy = inp.getAttribute('aria-labelledby');
      if (!label && labelledBy) {
        var lbl = document.getElementById(labelledBy);
        if (lbl) label = lbl.textContent || '';
      }
      if (!label && id) {
        var lblEl = document.querySelector('label[for="' + CSS.escape(id) + '"]');
        if (lblEl) label = lblEl.textContent || '';
      }
    } catch (e) {}

    label = label.toLowerCase();
    var combined = (id + ' ' + name + ' ' + auto + ' ' + ph + ' ' + label + ' ' + aria).toLowerCase();

    if (/\bcc-number\b/.test(auto) || /\b(cardnumber|cc-number|ccnumber|card.number|card_num)\b/i.test(combined)) {
      fillInput(inp, card.number);
      if (filled.indexOf('cardNumber') === -1) filled.push('cardNumber');
    } else if (/\bcc-exp\b/.test(auto) || /\b(expir|exp.?date|expiry|cc-exp|validity|mm.*yy)\b/i.test(combined)) {
      fillInput(inp, card.expMonth + '/' + card.expYear);
      if (filled.indexOf('expiry') === -1) filled.push('expiry');
    } else if (/\bcc-csc\b/.test(auto) || /\b(cvv|cvc|cvc2|cvn|security.code|cc-csc)\b/i.test(combined)) {
      fillInput(inp, card.cvv);
      if (filled.indexOf('cvv') === -1) filled.push('cvv');
    } else if (/\bcc-name\b/.test(auto) || /\b(card.?holder|card.?name|name.?on.?card)\b/i.test(combined)) {
      fillInput(inp, person.fullName);
      if (filled.indexOf('cardholderName') === -1) filled.push('cardholderName');
    }
  }

  // === STEP 3: Billing address fields (Stripe Checkout selectors) ===

  // Full name
  var nameField = queryFirst([
    '#billingName',
    'input[name="billingName"]',
    'input[autocomplete="cc-name"]',
    'input[autocomplete="name"]',
    'input[data-elements-stable-field-name="billingName"]',
  ]);
  if (nameField) { fillInput(nameField, person.fullName); filled.push('name'); }

  // Address line 1
  var addr1 = queryFirst([
    'input[autocomplete="address-line1"]',
    'input[name="addressLine1"]',
    'input[data-elements-stable-field-name="addressLine1"]',
    '#billingAddressLine1',
    'input[autocomplete="street-address"]',
  ]);
  if (addr1) { fillInput(addr1, person.address1); filled.push('address1'); }

  // Address line 2
  var addr2 = queryFirst([
    'input[autocomplete="address-line2"]',
    'input[name="addressLine2"]',
    'input[data-elements-stable-field-name="addressLine2"]',
    '#billingAddressLine2',
  ]);
  if (addr2) fillInput(addr2, person.address2);

  // Postal code
  var postal = queryFirst([
    'input[autocomplete="postal-code"]',
    'input[autocomplete="zip-code"]',
    'input[name="postalCode"]',
    'input[data-elements-stable-field-name="postalCode"]',
    '#billingPostalCode',
  ]);
  if (postal) { fillInput(postal, person.postalCode); filled.push('postal'); }

  // City
  var cityF = queryFirst([
    'input[autocomplete="address-level2"]',
    'input[name="city"]',
    'input[data-elements-stable-field-name="city"]',
    '#billingCity',
  ]);
  if (cityF) { fillInput(cityF, person.city); filled.push('city'); }

  // Country (both select and input variants)
  var countryInput = queryFirst([
    'input[autocomplete="country"]',
    'input[autocomplete="country-name"]',
    'input[name="country"]',
    'input[data-elements-stable-field-name="country"]',
    '#billingCountry',
    'select[autocomplete="country"]',
    'select[name="country"]',
    'select[data-elements-stable-field-name="country"]',
  ]);
  if (countryInput) {
    if (countryInput.tagName === 'SELECT') {
      fillSelect(countryInput, person.country);
    } else {
      fillInput(countryInput, person.countryName);
    }
    filled.push('country');
  }

  // === STEP 4: aria-label search (multilingual fallback) ===
  var ariaInputs = queryAll('input:not([type="hidden"])');
  for (var i = 0; i < ariaInputs.length; i++) {
    var aInp = ariaInputs[i];
    var aLabel = (aInp.getAttribute('aria-label') || '').toLowerCase();
    if (!aLabel) continue;

    // Only fill fields we haven't already filled
    var aVal = aInp.value || '';
    var aAlready = aVal.length > 0;

    if (!aAlready && (aLabel.indexOf('card number') > -1 || aLabel.indexOf('номер карты') > -1)) {
      fillInput(aInp, card.number);
    } else if (!aAlready && (aLabel.indexOf('expir') > -1 || aLabel.indexOf('мм / гг') > -1 || aLabel.indexOf('mm / yy') > -1)) {
      fillInput(aInp, card.expMonth + ' / ' + card.expYear);
    } else if (!aAlready && (aLabel.indexOf('cvv') > -1 || aLabel.indexOf('cvc') > -1 || aLabel.indexOf('код') > -1)) {
      fillInput(aInp, card.cvv);
    } else if (!aAlready && (aLabel.indexOf('имя') > -1 && (aLabel.indexOf('владельц') > -1 || aLabel.indexOf('карт') > -1))) {
      fillInput(aInp, person.fullName);
    } else if (!aAlready && aLabel.indexOf('адрес') > -1 && aLabel.indexOf('строка 1') > -1) {
      fillInput(aInp, person.address1);
    } else if (!aAlready && aLabel.indexOf('адрес') > -1 && aLabel.indexOf('строка 2') > -1) {
      fillInput(aInp, person.address2);
    } else if (!aAlready && (aLabel.indexOf('почтов') > -1 || aLabel.indexOf('postal') > -1 || aLabel.indexOf('индекс') > -1)) {
      fillInput(aInp, person.postalCode);
    } else if (!aAlready && (aLabel.indexOf('город') > -1 || (aLabel.indexOf('city') > -1 && aLabel.indexOf('address') === -1))) {
      fillInput(aInp, person.city);
    } else if (!aAlready && (aLabel.indexOf('стран') > -1 || aLabel.indexOf('countr') > -1)) {
      fillInput(aInp, person.countryName);
    }
  }

  // === STEP 5: autocomplete fallback for remaining fields ===
  var autoInputs = queryAll('input[autocomplete]:not([type="hidden"])');
  for (var i = 0; i < autoInputs.length; i++) {
    var ai = autoInputs[i];
    if (ai.value && ai.value.length > 0) continue;
    var autoAttr = (ai.getAttribute('autocomplete') || '').toLowerCase();
    if (autoAttr === 'country' || autoAttr === 'country-name') {
      fillInput(ai, person.countryName);
    } else if (autoAttr === 'postal-code' || autoAttr === 'zip-code') {
      fillInput(ai, person.postalCode);
    } else if (autoAttr === 'address-line1' || autoAttr === 'street-address') {
      fillInput(ai, person.address1);
    } else if (autoAttr === 'address-level2' || autoAttr === 'city') {
      fillInput(ai, person.city);
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
