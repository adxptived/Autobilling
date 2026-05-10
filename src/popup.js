// Autobilling popup — BIN, country, expiry, custom BIN, favorites, history, hotkey

// Data is loaded from bins.js, countries.js, and namePools.js

// ============ STATE ============

var HARD_BINS = BINS.slice(); // snapshot of built-in BINs

var state = {
  binIdx: 0,
  countryIdx: 0,
  expMonth: 'random',
  expYear: 'random',
  validateBin: true,
  compactView: false,
  defaultCompact: false,
  generatePhone: false,
  generateEmail: false,
  sessionOnly: false,
  historyTtlMinutes: 0,
  autoDetectCountry: false,
  selectedProfile: 'generated',
  savedProfiles: {
    custom: null,
  },
  favBins: [],     // prefix strings the user starred
  favCountries: [],// country codes the user starred
  customBins: [],  // {brand, prefix, length} added by user
  card: null,
  person: null,
  history: [],     // [{card,person,timestamp}]
};

// ============ HELPERS ============

function binLabel(bin) {
  var br = bin.brand === 'Mastercard' ? 'MC' : bin.brand === 'Visa' ? 'VISA' : bin.brand;
  return br + ' ' + bin.prefix;
}

function findByPrefix(prefix) {
  return detectBin(prefix, BINS);
}

function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function appendHiddenText(el, text) {
  var span = document.createElement('span');
  span.setAttribute('aria-hidden', 'true');
  span.textContent = text;
  el.appendChild(span);
}

// ============ GENERATION ============

function lookupLiveBin(card, requestPermission) {
  if (!state.validateBin || card.binInfo) return;

  function runLookup() {
    chrome.runtime.sendMessage({ action: 'lookupBin', prefix: card.binPrefix }, function (resp) {
      if (resp && resp.info && state.card && state.card.number === card.number) {
        state.card.binInfo = resp.info;
        render();
        saveState();
      }
      if (resp && resp.error && requestPermission) setStatus('Live BIN lookup failed: ' + resp.error, true);
    });
  }

  hasBinLookupPermission(function (hasAccess) {
    if (hasAccess) {
      runLookup();
      return;
    }
    if (!requestPermission) return;
    requestBinLookupPermission(function (granted) {
      state.validateBin = !!granted;
      document.getElementById('chkValidateBin').checked = state.validateBin;
      if (granted) runLookup();
      else {
        render();
        saveState();
        setStatus('Live BIN lookup permission denied', true);
      }
    });
  });
}

function generateAll(options) {
  options = options || {};
  var card = generateCard();
  var person = profilePerson(state.selectedProfile);

  state.card = card;
  state.person = person;

  lookupLiveBin(card, !!options.requestBinPermission);

  addHistory(card, person);
  render();
  saveState();

  // Subtle shimmer animation on card to acknowledge generation
  var visual = document.getElementById('cardVisual');
  if (visual && !visual.classList.contains('compact')) {
    visual.classList.remove('shimmer');
    void visual.offsetWidth;
    visual.classList.add('shimmer');
    setTimeout(function () { visual.classList.remove('shimmer'); }, 700);
  }
}

function profilePerson(profile) {
  if (profile === 'US') {
    return {
      firstName: 'Alex',
      lastName: 'Morgan',
      fullName: 'Alex Morgan',
      address1: '125 Main St',
      address2: '',
      postalCode: '10001',
      city: 'New York',
      state: 'NY',
      country: 'US',
      countryName: 'United States',
      phone: '+12125551234',
      email: 'alex.morgan@gmail.com',
    };
  }
  if (profile === 'NL') {
    return {
      firstName: 'Daan',
      lastName: 'de Jong',
      fullName: 'Daan de Jong',
      address1: 'Kerkstraat 12',
      address2: '',
      postalCode: '1012 AB',
      city: 'Amsterdam',
      state: 'NH',
      country: 'NL',
      countryName: 'Netherlands',
      phone: '+31201234567',
      email: 'daan.dejong@outlook.com',
    };
  }
  if (profile === 'custom' && state.savedProfiles.custom) {
    return Object.assign({}, state.savedProfiles.custom);
  }
  return generatePerson();
}

// ============ HISTORY ============

function addHistory(card, person) {
  var entry = {
    card: {
      formatted: card.formatted,
      brand: card.brand,
      binPrefix: card.binPrefix,
      expMonth: card.expMonth,
      expYear: card.expYear,
      cvv: card.cvv,
    },
    person: {
      fullName: person.fullName,
      firstName: person.firstName,
      lastName: person.lastName,
      address1: person.address1,
      address2: person.address2 || '',
      postalCode: person.postalCode,
      city: person.city,
      state: person.state || '',
      country: person.country,
      countryName: person.countryName,
      phone: person.phone || '',
      email: person.email || '',
    },
    ts: Date.now(),
  };

  state.history = pruneHistory(addHistoryEntry(state.history, entry, 10), state.historyTtlMinutes);
}

function restoreHistory(idx) {
  var h = state.history[idx];
  if (!h) return;

  state.card = {
    number: h.card.formatted.replace(/\s/g, ''),
    formatted: h.card.formatted,
    brand: h.card.brand,
    binPrefix: h.card.binPrefix,
    binInfo: BIN_DB[h.card.binPrefix] || null,
    expMonth: h.card.expMonth,
    expYear: h.card.expYear,
    expYearFull: '20' + h.card.expYear,
    cvv: h.card.cvv,
  };
  state.person = {
    fullName: h.person.fullName,
    firstName: h.person.firstName || h.person.fullName.split(' ')[0] || '',
    lastName: h.person.lastName || h.person.fullName.split(' ').slice(1).join(' ') || '',
    address1: h.person.address1,
    address2: h.person.address2 || '',
    postalCode: h.person.postalCode,
    city: h.person.city,
    state: h.person.state || '',
    country: h.person.country,
    countryName: h.person.countryName,
    phone: h.person.phone || '',
    email: h.person.email || '',
  };

  // Find matching BIN selector
  var bi = findByPrefix(h.card.binPrefix);
  if (bi >= 0) {
    state.binIdx = bi;
    document.getElementById('selBin').value = bi;
  }

  // Find matching country selector
  for (var i = 0; i < COUNTRIES.length; i++) {
    if (COUNTRIES[i].code === h.person.country) {
      state.countryIdx = i;
      document.getElementById('selCountry').value = i;
      break;
    }
  }

  render();
  updateFavStar();
  updateCountryFavStar();
  saveState();
  setStatus('Restored card');
}

function deleteHistory(idx, e) {
  e.stopPropagation();
  state.history.splice(idx, 1);
  renderHistory();
  saveState();
}

function clearHistory() {
  state.history = [];
  renderHistory();
  saveState();
}

function toggleHistory() {
  var panel = document.getElementById('historyPanel');
  var btn = document.getElementById('btnToggleHistory');
  var show = panel.style.display === 'none';
  panel.style.display = show ? 'block' : 'none';
  btn.setAttribute('aria-expanded', show ? 'true' : 'false');
  clearElement(btn);
  appendHiddenText(btn, '\uD83D\uDD52');
  btn.appendChild(document.createTextNode(' History '));
  appendHiddenText(btn, show ? '\u25B2' : '\u25BC');
  if (show) renderHistory();
}

function renderHistory() {
  var container = document.getElementById('historyList');
  container.textContent = '';
  if (!state.history.length) {
    var empty = document.createElement('div');
    empty.className = 'history-empty';
    var emoji = document.createElement('span');
    emoji.className = 'emoji';
    emoji.textContent = '\uD83D\uDCB3';
    empty.appendChild(emoji);
    empty.appendChild(document.createTextNode('No cards yet'));
    container.appendChild(empty);
    return;
  }
  for (var i = 0; i < state.history.length; i++) {
    var h = state.history[i];
    var ago = Math.floor((Date.now() - h.ts) / 60000);
    var agoStr = ago < 1 ? 'now' : ago < 60 ? ago + 'm ago' : Math.floor(ago / 60) + 'h ago';

    var item = document.createElement('div');
    item.className = 'history-item';

    var content = document.createElement('div');
    content.className = 'history-content';

    var brand = document.createElement('span');
    var brandKey = String(h.card.brand || '').toLowerCase();
    brand.className = 'history-brand ' + brandKey;
    brand.textContent = brandShort(h.card.brand);

    var text = document.createElement('div');
    text.className = 'history-text';
    var cardText = document.createElement('div');
    cardText.className = 'history-card';
    cardText.textContent = '\u2022\u2022\u2022\u2022 ' + h.card.formatted.slice(-4) + ' \u00B7 ' + h.card.expMonth + '/' + h.card.expYear;
    var meta = document.createElement('div');
    meta.className = 'history-meta';
    meta.textContent = h.person.countryName + ' \u00B7 ' + agoStr;
    text.appendChild(cardText);
    text.appendChild(meta);

    content.appendChild(brand);
    content.appendChild(text);

    var actions = document.createElement('div');
    actions.className = 'history-actions';
    var copyBtn = document.createElement('button');
    copyBtn.className = 'btn-sm ghost history-copy';
    copyBtn.title = 'Copy this entry';
    copyBtn.setAttribute('aria-label', 'Copy this entry');
    copyBtn.textContent = '\uD83D\uDCCB';
    var del = document.createElement('button');
    del.className = 'btn-sm ghost history-delete';
    del.title = 'Delete';
    del.setAttribute('aria-label', 'Delete entry');
    del.textContent = 'X';
    actions.appendChild(copyBtn);
    actions.appendChild(del);

    // Click handlers (closure captures current i / h)
    (function (idx, entry, itemEl, delEl, copyEl) {
      itemEl.addEventListener('click', function () { restoreHistory(idx); });
      delEl.addEventListener('click', function (e) { deleteHistory(idx, e); });
      copyEl.addEventListener('click', function (e) {
        e.stopPropagation();
        copyHistoryEntry(entry);
      });
    })(i, h, item, del, copyBtn);

    item.appendChild(content);
    item.appendChild(actions);
    container.appendChild(item);
  }
}

function copyHistoryEntry(h) {
  if (!h) return;
  var lines = [
    'Card: ' + h.card.formatted,
    'Exp: ' + h.card.expMonth + '/' + h.card.expYear,
    'CVV: ' + h.card.cvv,
    'Name: ' + h.person.fullName,
    'Addr: ' + h.person.address1,
    'City: ' + h.person.city,
    'ZIP: ' + h.person.postalCode,
    'Country: ' + h.person.countryName,
  ];
  copyToClipboard(lines.join('\n'), function () { setStatus('Copied entry'); });
}

// ============ RENDER ============

var BRAND_CLASS_MAP = {
  'Visa': 'brand-visa',
  'Mastercard': 'brand-mastercard',
  'Amex': 'brand-amex',
  'Discover': 'brand-discover',
  'UnionPay': 'brand-unionpay',
  'JCB': 'brand-jcb',
  'Diners': 'brand-diners',
};
var ALL_BRAND_CLASSES = ['brand-visa','brand-mastercard','brand-amex','brand-discover','brand-unionpay','brand-jcb','brand-diners'];

function brandShort(brand) {
  if (brand === 'Mastercard') return 'MC';
  if (brand === 'Visa') return 'VISA';
  return String(brand || '').toUpperCase();
}

function updateBinBar() {
  var bar = document.getElementById('binBar');
  var txt = document.getElementById('binBarText');
  var visual = document.getElementById('cardVisual');
  if (!bar || !txt) return;
  if (!state.card) {
    bar.style.display = 'none';
    if (visual) visual.classList.remove('is-test');
    return;
  }
  var bi = state.card.binInfo;
  if (bi) {
    bar.style.display = 'flex';
    var isTest = bi.category === 'TEST';
    if (visual) visual.classList.toggle('is-test', !!isTest);
    bar.className = 'bin-bar ' + (isTest ? 'test' : 'valid');
    var pieces = [bi.bank, bi.countryName, bi.type];
    if (bi.category) pieces.push(bi.category);
    var full = pieces.filter(Boolean).join(' · ');
    txt.textContent = full;
    bar.title = full;
    return;
  }
  if (visual) visual.classList.remove('is-test');
  if (state.validateBin) {
    bar.style.display = 'flex';
    bar.className = 'bin-bar warn';
    txt.textContent = 'Custom BIN · no live info';
    bar.title = 'No BIN metadata found in live database';
    return;
  }
  bar.style.display = 'none';
  bar.title = '';
}

function render() {
  if (state.card) {
    document.getElementById('cardNum').textContent = state.card.formatted;
    document.getElementById('expiry').textContent = state.card.expMonth + '/' + state.card.expYear;
    document.getElementById('cvv').textContent = state.card.cvv;
    document.getElementById('cardNetwork').textContent = brandShort(state.card.brand);

    var cardVisual = document.getElementById('cardVisual');
    // Apply brand-specific gradient
    for (var b = 0; b < ALL_BRAND_CLASSES.length; b++) cardVisual.classList.remove(ALL_BRAND_CLASSES[b]);
    var brandClass = BRAND_CLASS_MAP[state.card.brand];
    if (brandClass) cardVisual.classList.add(brandClass);

    if (state.card.binInfo && state.validateBin) {
      var bi = state.card.binInfo;
      cardVisual.title = bi.bank + ' (' + bi.countryName + ') \u2014 ' + bi.type + ' ' + bi.category;
    } else if (state.validateBin) {
      cardVisual.title = 'Custom BIN \u2014 not in database';
    } else {
      cardVisual.title = '';
    }
  }
  if (state.person) {
    document.getElementById('personName').textContent = state.person.fullName;
    document.getElementById('personAddr').textContent = state.person.address1;
    document.getElementById('personCity').textContent = state.person.city;
    document.getElementById('personZip').textContent = state.person.postalCode;
    document.getElementById('personCountry').textContent = state.person.countryName;
  }

  // Compact card elements
  if (state.card) {
    document.getElementById('compactBrand').textContent = brandShort(state.card.brand);
    document.getElementById('compactNum').textContent = '...' + state.card.number.slice(-4);
    document.getElementById('compactExp').textContent = state.card.expMonth + '/' + state.card.expYear;
    document.getElementById('compactCvv').textContent = state.card.cvv;
  }

  updateBinBar();
}

function applyCompact(skipAnimation) {
  var card = document.getElementById('cardVisual');
  var btn = document.getElementById('btnCompactToggle');
  card.classList.add('no-animate');
  if (state.compactView) {
    card.classList.add('compact');
    btn.textContent = '\u25B4';
    btn.title = 'Expand card view';
  } else {
    card.classList.remove('compact');
    btn.textContent = '\u25BE';
    btn.title = 'Compact card view';
  }
  if (skipAnimation) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        card.classList.remove('no-animate');
      });
    });
  } else {
    card.classList.remove('no-animate');
  }
}

function toggleCompact() {
  state.compactView = !state.compactView;
  applyCompact();
  saveState();
}

// ============ UI SETUP ============

function buildBins() {
  var sel = document.getElementById('selBin');
  clearElement(sel);

  // Merge custom BINs
  BINS = HARD_BINS.slice();
  for (var c = 0; c < state.customBins.length; c++) {
    BINS.push(state.customBins[c]);
  }

  // Sort: favorites first, then built-in order
  var ordered = [];
  var seen = {};

  // Favorite BINs first
  for (var f = 0; f < state.favBins.length; f++) {
    var idx = findByPrefix(state.favBins[f]);
    if (idx >= 0 && !seen[state.favBins[f]]) {
      ordered.push(idx);
      seen[state.favBins[f]] = true;
    }
  }
  // Then remaining in order
  for (var i = 0; i < BINS.length; i++) {
    if (!seen[BINS[i].prefix]) {
      ordered.push(i);
      seen[BINS[i].prefix] = true;
    }
  }

  for (var o = 0; o < ordered.length; o++) {
    var bi = ordered[o];
    var opt = document.createElement('option');
    opt.value = bi;
    var star = state.favBins.indexOf(BINS[bi].prefix) >= 0 ? '\u2605 ' : '';
    opt.textContent = star + binLabel(BINS[bi]);
    sel.appendChild(opt);
  }

  sel.value = state.binIdx;
  sel.onchange = function () {
    state.binIdx = parseInt(this.value);
    updateFavStar();
    updateDeleteBinButton();
    generateAll();
  };
}

function toggleFavCurrent() {
  var bin = BINS[state.binIdx];
  if (!bin) return;
  var prefix = bin.prefix;
  var idx = state.favBins.indexOf(prefix);
  if (idx >= 0) {
    state.favBins.splice(idx, 1);
  } else {
    state.favBins.push(prefix);
  }
  buildBins();
  saveState();
  updateFavStar();
  updateDeleteBinButton();
}

function updateFavStar() {
  var btn = document.getElementById('btnToggleFav');
  var bin = BINS[state.binIdx];
  var isFav = bin && state.favBins.indexOf(bin.prefix) >= 0;
  btn.textContent = isFav ? '★' : '☆';
  btn.style.color = isFav ? '#e94560' : '#8b949e';
}

function buildCountries() {
  var sel = document.getElementById('selCountry');
  clearElement(sel);

  // Sort: favorites first (in the order the user starred them), then the rest by their COUNTRIES index.
  var ordered = [];
  var seen = {};
  for (var f = 0; f < state.favCountries.length; f++) {
    for (var i = 0; i < COUNTRIES.length; i++) {
      if (COUNTRIES[i].code === state.favCountries[f] && !seen[COUNTRIES[i].code]) {
        ordered.push(i);
        seen[COUNTRIES[i].code] = true;
        break;
      }
    }
  }
  for (var j = 0; j < COUNTRIES.length; j++) {
    if (!seen[COUNTRIES[j].code]) {
      ordered.push(j);
      seen[COUNTRIES[j].code] = true;
    }
  }

  for (var o = 0; o < ordered.length; o++) {
    var ci = ordered[o];
    var opt = document.createElement('option');
    opt.value = ci;
    var star = state.favCountries.indexOf(COUNTRIES[ci].code) >= 0 ? '\u2605 ' : '';
    opt.textContent = star + COUNTRIES[ci].name + ' (' + COUNTRIES[ci].code + ')';
    sel.appendChild(opt);
  }

  sel.value = state.countryIdx || 0;
  sel.onchange = function () {
    state.countryIdx = parseInt(this.value);
    updateCountryFavStar();
    generateAll();
  };
}

function toggleFavCountry() {
  var country = COUNTRIES[state.countryIdx];
  if (!country) return;
  var code = country.code;
  var idx = state.favCountries.indexOf(code);
  if (idx >= 0) {
    state.favCountries.splice(idx, 1);
  } else {
    state.favCountries.push(code);
  }
  buildCountries();
  // After rebuilding, the selected country index may shift (fav moved to top).
  // Find the country's new option index and sync the selector without regenerating.
  var sel = document.getElementById('selCountry');
  for (var i = 0; i < sel.options.length; i++) {
    if (parseInt(sel.options[i].value) === state.countryIdx) {
      sel.selectedIndex = i;
      break;
    }
  }
  updateCountryFavStar();
  saveState();
}

function updateCountryFavStar() {
  var btn = document.getElementById('btnToggleFavCountry');
  if (!btn) return;
  var country = COUNTRIES[state.countryIdx];
  var isFav = country && state.favCountries.indexOf(country.code) >= 0;
  btn.textContent = isFav ? '\u2605' : '\u2606';
  btn.style.color = isFav ? '#e94560' : '#8b949e';
}

function buildExpiry() {
  var mSel = document.getElementById('selExpMonth');
  var randOpt = document.createElement('option');
  randOpt.value = 'random';
  randOpt.textContent = 'Random';
  mSel.appendChild(randOpt);
  for (var m = 1; m <= 12; m++) {
    var opt = document.createElement('option');
    var val = String(m).padStart(2, '0');
    opt.value = val;
    opt.textContent = val;
    mSel.appendChild(opt);
  }
  mSel.value = state.expMonth;
  mSel.addEventListener('change', function () {
    state.expMonth = this.value;
    generateAll();
  });

  var ySel = document.getElementById('selExpYear');
  var randY = document.createElement('option');
  randY.value = 'random';
  randY.textContent = 'Random';
  ySel.appendChild(randY);
  var nowYear = new Date().getFullYear() % 100;
  for (var y = nowYear; y <= nowYear + 10; y++) {
    var opt = document.createElement('option');
    var val = String(y).padStart(2, '0');
    opt.value = val;
    opt.textContent = '20' + val;
    ySel.appendChild(opt);
  }
  ySel.value = state.expYear;
  ySel.addEventListener('change', function () {
    state.expYear = this.value;
    generateAll();
  });
}

function isCustomBin(prefix) {
  for (var i = 0; i < state.customBins.length; i++) {
    if (state.customBins[i].prefix === prefix) return true;
  }
  return false;
}

function updateDeleteBinButton() {
  var btn = document.getElementById('btnDeleteBin');
  var bin = BINS[state.binIdx];
  var canDelete = bin && isCustomBin(bin.prefix);
  btn.disabled = !canDelete;
  btn.style.opacity = canDelete ? '1' : '0.35';
}

function doAddCustomBin() {
  var input = document.getElementById('customBin');
  var raw = input.value.replace(/\s/g, '');
  if (!raw || raw.length < 5) {
    setStatus('BIN too short (min 5 digits)', true);
    return;
  }
  if (!/^\d+$/.test(raw)) {
    setStatus('BIN must be digits only', true);
    return;
  }
  if (raw.length > 14) {
    setStatus('BIN too long (max 14 digits)', true);
    return;
  }

  // Check duplicate
  if (findByPrefix(raw) >= 0) {
    setStatus('BIN already in list', true);
    return;
  }

  var firstDigit = raw.charAt(0);
  var brand = firstDigit === '4' ? 'Visa' : firstDigit === '5' ? 'Mastercard' : firstDigit === '3' ? 'Amex' : firstDigit === '6' ? 'Discover' : 'Card';

  state.customBins.push({ brand: brand, prefix: raw, length: 16 });
  // Auto-favorite custom BINs
  if (state.favBins.indexOf(raw) === -1) state.favBins.push(raw);
  input.value = '';
  buildBins();

  // Select it
  var newIdx = findByPrefix(raw);
  if (newIdx >= 0) {
    state.binIdx = newIdx;
    document.getElementById('selBin').value = newIdx;
    updateFavStar();
  }
  generateAll();
  updateDeleteBinButton();
  setStatus('BIN added: ' + raw);
}

function doDeleteCustomBin() {
  var bin = BINS[state.binIdx];
  if (!bin || !isCustomBin(bin.prefix)) {
    setStatus('Select a custom BIN first', true);
    return;
  }

  var prefix = bin.prefix;
  state.customBins = state.customBins.filter(function (b) { return b.prefix !== prefix; });
  state.favBins = state.favBins.filter(function (p) { return p !== prefix; });
  state.binIdx = 0;
  buildBins();
  document.getElementById('selBin').value = state.binIdx;
  updateFavStar();
  updateDeleteBinButton();
  generateAll();
  setStatus('BIN deleted: ' + prefix);
}

// ============ PERSISTENCE ============

function saveState() {
  saveExtensionState(state);
}

function loadState() {
  loadExtensionSettings(function (data) {
    if (data.binIdx !== undefined) state.binIdx = data.binIdx;
    if (data.countryIdx !== undefined) state.countryIdx = data.countryIdx;
    if (data.expMonth) state.expMonth = data.expMonth;
    if (data.expYear) state.expYear = data.expYear;
    if (data.validateBin !== undefined) state.validateBin = data.validateBin;
    if (data.defaultCompact !== undefined) state.defaultCompact = data.defaultCompact;
    if (data.compactView !== undefined) state.compactView = data.compactView;
    else state.compactView = state.defaultCompact;
    if (data.generatePhone !== undefined) state.generatePhone = data.generatePhone;
    if (data.generateEmail !== undefined) state.generateEmail = data.generateEmail;
    if (data.sessionOnly !== undefined) state.sessionOnly = data.sessionOnly;
    if (data.historyTtlMinutes !== undefined) state.historyTtlMinutes = data.historyTtlMinutes;
    if (data.autoDetectCountry !== undefined) state.autoDetectCountry = data.autoDetectCountry;
    if (data.selectedProfile) state.selectedProfile = data.selectedProfile;
    if (data.savedProfiles) state.savedProfiles = data.savedProfiles;
    if (data.favBins) state.favBins = data.favBins;
    if (data.favCountries) state.favCountries = data.favCountries;
    if (data.customBins) state.customBins = data.customBins;

    loadSensitiveState(state.sessionOnly, function (sensitiveData) {
      if (sensitiveData.history) state.history = pruneHistory(sensitiveData.history, state.historyTtlMinutes);

      buildBins();
      buildCountries();

      document.getElementById('selBin').value = state.binIdx;
      document.getElementById('selCountry').value = state.countryIdx;
      document.getElementById('selExpMonth').value = state.expMonth;
      document.getElementById('selExpYear').value = state.expYear;
      document.getElementById('chkValidateBin').checked = state.validateBin;
      document.getElementById('chkDefaultCompact').checked = state.defaultCompact;
      document.getElementById('chkGenPhone').checked = state.generatePhone;
      document.getElementById('chkGenEmail').checked = state.generateEmail;
      document.getElementById('selProfile').value = state.selectedProfile;

      updateFavStar();
      updateCountryFavStar();
      updateDeleteBinButton();
      applyCompact(true);

      if (sensitiveData.card) state.card = sensitiveData.card;
      if (sensitiveData.person) state.person = sensitiveData.person;
      if (!state.card) generateAll();
      else {
        render();
        saveState();
      }
    });
  });
}

// ============ ACTIONS ============

var STATUS_TIMER = null;

function setStatus(text, isError) {
  var el = document.getElementById('status');
  el.textContent = text;
  el.className = 'status' + (isError ? ' error' : '');
  if (STATUS_TIMER) { clearTimeout(STATUS_TIMER); STATUS_TIMER = null; }
  if (text) {
    // Restart slide-in animation
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    STATUS_TIMER = setTimeout(function () {
      if (el.textContent === text) el.textContent = '';
    }, isError ? 3600 : 2400);
  }
}

function flashCopied(el) {
  if (!el) return;
  el.classList.remove('copied');
  void el.offsetWidth;
  el.classList.add('copied');
  setTimeout(function () { el.classList.remove('copied'); }, 600);
}

function doAutofill() {
  var btn = document.getElementById('btnAutofill');
  btn.classList.add('loading');
  setStatus('Filling...', false);
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    function done() { btn.classList.remove('loading'); }
    if (!tabs || !tabs[0]) { done(); setStatus('No active tab', true); return; }
    var tab = tabs[0];
    saveSensitiveState(state, function () {
      // Inject into all frames including dynamically-created Stripe iframes
      chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ['content.js'],
      }, function () {
        // Ignore injection errors — content.js may already be loaded via content_scripts
        chrome.tabs.sendMessage(tab.id, { action: 'autofill', card: state.card, person: state.person }, function (resp) {
          done();
          if (chrome.runtime.lastError) {
            setStatus('Fill attempted', false);
          } else if (resp) {
            setStatus(formatAutofillStatus(resp), !resp.success);
          } else {
            setStatus('Fill completed', false);
          }
        });
      });
    });
  });
}

function saveCustomProfile() {
  if (!state.person) return;
  state.savedProfiles.custom = Object.assign({}, state.person);
  state.selectedProfile = 'custom';
  document.getElementById('selProfile').value = 'custom';
  saveState();
  setStatus('Custom profile saved');
}

// ============ INLINE SETTINGS VIEW ============

function openOptions() {
  var main = document.getElementById('mainView');
  var settings = document.getElementById('settingsView');
  if (!main || !settings) {
    // Fallback: if markup is missing, fall back to external page.
    if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
    return;
  }
  main.classList.remove('slide-in', 'slide-in-left');
  settings.classList.remove('slide-in', 'slide-in-left');
  populateSettingsView();
  main.hidden = true;
  settings.hidden = false;
  settings.classList.add('slide-in');
  // Scroll the shell to top so the Back button is always visible first.
  var shell = document.querySelector('.app-shell');
  if (shell) shell.scrollTop = 0;
}

function closeOptions() {
  var main = document.getElementById('mainView');
  var settings = document.getElementById('settingsView');
  if (!main || !settings) return;
  settings.hidden = true;
  settings.classList.remove('slide-in', 'slide-in-left');
  main.hidden = false;
  main.classList.remove('slide-in');
  main.classList.add('slide-in-left');
  var shell = document.querySelector('.app-shell');
  if (shell) shell.scrollTop = 0;
}

function populateSettingsView() {
  // Version in sub-title + kbd line
  try {
    var m = chrome.runtime.getManifest();
    var v = (m && m.version) || '';
    var sub = document.getElementById('sSubVersion');
    var kbd = document.getElementById('sTxtVersion');
    if (sub) sub.textContent = 'Preferences · v' + v;
    if (kbd) kbd.textContent = 'v' + v;
  } catch (e) {}

  // Checkboxes / selects (mirror current state)
  document.getElementById('sChkSessionOnly').checked = !!state.sessionOnly;
  document.getElementById('sChkAutoDetectCountry').checked = !!state.autoDetectCountry;
  document.getElementById('sSelHistoryTtl').value = String(state.historyTtlMinutes || 0);

  // Custom profile
  var profile = (state.savedProfiles && state.savedProfiles.custom) || {};
  document.getElementById('sProfileName').value = profile.fullName || '';
  document.getElementById('sProfileAddr').value = profile.address1 || '';
  document.getElementById('sProfileZip').value = profile.postalCode || '';
  document.getElementById('sProfileCity').value = profile.city || '';
  document.getElementById('sProfileState').value = profile.state || '';
  document.getElementById('sProfilePhone').value = profile.phone || '';
  document.getElementById('sProfileEmail').value = profile.email || '';
  document.getElementById('sProfileCountry').value = profile.country || '';
  document.getElementById('sProfileCountryName').value = profile.countryName || '';

  renderSettingsBinList();
}

function renderSettingsBinList() {
  var list = document.getElementById('sBinList');
  var empty = document.getElementById('sBinListEmpty');
  list.textContent = '';
  var bins = state.customBins || [];
  if (!bins.length) {
    empty.style.display = '';
    list.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  list.style.display = '';
  for (var i = 0; i < bins.length; i++) {
    (function (bin) {
      var row = document.createElement('div');
      row.className = 'bin-list-item';
      var info = document.createElement('div');
      var prefix = document.createElement('div');
      prefix.className = 'prefix';
      prefix.textContent = bin.prefix;
      var brand = document.createElement('div');
      brand.className = 'brand';
      brand.textContent = bin.brand || 'Card';
      info.appendChild(prefix);
      info.appendChild(brand);

      var del = document.createElement('button');
      del.className = 'btn-sm danger';
      del.textContent = 'Delete';
      del.addEventListener('click', function () {
        state.customBins = state.customBins.filter(function (b) { return b.prefix !== bin.prefix; });
        state.favBins = state.favBins.filter(function (p) { return p !== bin.prefix; });
        if (state.binIdx >= BINS.length) state.binIdx = 0;
        buildBins();
        document.getElementById('selBin').value = state.binIdx;
        updateFavStar();
        updateDeleteBinButton();
        renderSettingsBinList();
        saveState();
        setStatus('Deleted BIN: ' + bin.prefix);
      });
      row.appendChild(info);
      row.appendChild(del);
      list.appendChild(row);
    })(bins[i]);
  }
}

function saveSettingsCustomProfile() {
  var fullName = document.getElementById('sProfileName').value.trim();
  if (!fullName) { setStatus('Full name is required', true); return; }
  var parts = fullName.split(/\s+/);
  var custom = {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
    fullName: fullName,
    address1: document.getElementById('sProfileAddr').value.trim(),
    address2: '',
    postalCode: document.getElementById('sProfileZip').value.trim(),
    city: document.getElementById('sProfileCity').value.trim(),
    state: document.getElementById('sProfileState').value.trim(),
    phone: document.getElementById('sProfilePhone').value.trim(),
    email: document.getElementById('sProfileEmail').value.trim(),
    country: document.getElementById('sProfileCountry').value.trim().toUpperCase(),
    countryName: document.getElementById('sProfileCountryName').value.trim(),
  };
  if (!custom.address1 || !custom.postalCode || !custom.city || !custom.country || !custom.countryName) {
    setStatus('Fill address, ZIP, city, country code and country name', true);
    return;
  }
  state.savedProfiles = state.savedProfiles || {};
  state.savedProfiles.custom = custom;
  state.selectedProfile = 'custom';
  document.getElementById('selProfile').value = 'custom';
  saveState();
  setStatus('Custom profile saved');
}

function bindInlineSettingsHandlers() {
  var back = document.getElementById('btnSettingsBack');
  if (back) back.addEventListener('click', closeOptions);

  // Session only
  var sess = document.getElementById('sChkSessionOnly');
  if (sess) sess.addEventListener('change', function () {
    state.sessionOnly = this.checked;
    // saveState() will migrate sensitive data to the correct storage backend.
    saveState();
    setStatus('Session-only ' + (this.checked ? 'enabled' : 'disabled'));
  });

  // Auto-detect country
  var auto = document.getElementById('sChkAutoDetectCountry');
  if (auto) auto.addEventListener('change', function () {
    state.autoDetectCountry = this.checked;
    saveState();
  });

  // History TTL
  var ttl = document.getElementById('sSelHistoryTtl');
  if (ttl) ttl.addEventListener('change', function () {
    state.historyTtlMinutes = parseInt(this.value, 10) || 0;
    state.history = pruneHistory(state.history, state.historyTtlMinutes);
    saveState();
    renderHistory();
  });

  // Save profile
  var saveProf = document.getElementById('sBtnSaveProfile');
  if (saveProf) saveProf.addEventListener('click', saveSettingsCustomProfile);

  // Clear history
  var clearH = document.getElementById('sBtnClearHistory');
  if (clearH) clearH.addEventListener('click', function () {
    clearStoredHistory(function () {
      state.history = [];
      renderHistory();
      setStatus('History cleared');
    });
  });

  // Export
  var exp = document.getElementById('sBtnExport');
  if (exp) exp.addEventListener('click', function () {
    chrome.storage.local.get(null, function (data) {
      var clean = Object.assign({}, data);
      delete clean.card; delete clean.person; delete clean.history;
      var version = '';
      try { version = (chrome.runtime.getManifest() || {}).version || ''; } catch (e) {}
      var payload = { _format: 'autobilling', _version: version, data: clean };
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'autobilling-settings.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('Exported');
    });
  });

  // Import
  var imp = document.getElementById('sBtnImport');
  var file = document.getElementById('sFileImport');
  if (imp && file) {
    imp.addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        try {
          var parsed = JSON.parse(ev.target.result);
          var data = parsed && parsed._format === 'autobilling' ? parsed.data : parsed;
          if (!data || typeof data !== 'object') throw new Error('Invalid file');
          delete data.card; delete data.person; delete data.history;
          chrome.storage.local.set(data, function () {
            setStatus('Imported — reloading');
            setTimeout(function () { window.location.reload(); }, 700);
          });
        } catch (err) {
          setStatus('Import failed: ' + (err.message || 'invalid JSON'), true);
        }
      };
      reader.readAsText(f);
      e.target.value = '';
    });
  }

  // Reset all
  var reset = document.getElementById('sBtnResetAll');
  if (reset) reset.addEventListener('click', function () {
    if (!window.confirm('Reset all Autobilling settings, custom BINs, favorites, profile and history? This cannot be undone.')) return;
    chrome.storage.local.clear(function () {
      if (chrome.storage.session && chrome.storage.session.clear) {
        chrome.storage.session.clear(function () { window.location.reload(); });
      } else {
        window.location.reload();
      }
    });
  });
}

bindInlineSettingsHandlers();

function copyCard() {
  if (!state.card) return;
  var lines = [
    'Card: ' + state.card.formatted,
    'Exp: ' + state.card.expMonth + '/' + state.card.expYear,
    'CVV: ' + state.card.cvv,
    'Name: ' + state.person.fullName,
    'Addr: ' + state.person.address1,
    'City: ' + state.person.city,
    'ZIP: ' + state.person.postalCode,
    'Country: ' + state.person.countryName,
  ];
  if (state.card.binInfo && state.validateBin) {
    lines.unshift('BIN: ' + state.card.binInfo.bank + ' (' + state.card.binInfo.type + ' ' + state.card.binInfo.category + ')');
  }
  var text = lines.join('\n');

  copyToClipboard(text, function () { setStatus('Copied!'); });
}

// ============ INIT ============

document.getElementById('btnGenerate').addEventListener('click', function () {
  generateAll({ requestBinPermission: true });
});
document.getElementById('btnOptions').addEventListener('click', openOptions);
document.getElementById('btnSaveProfile').addEventListener('click', saveCustomProfile);
document.getElementById('btnAutofill').addEventListener('click', doAutofill);
document.getElementById('btnCopy').addEventListener('click', copyCard);
document.getElementById('btnAddBin').addEventListener('click', doAddCustomBin);
document.getElementById('btnDeleteBin').addEventListener('click', doDeleteCustomBin);
document.getElementById('btnClearHistory').addEventListener('click', clearHistory);
document.getElementById('btnToggleHistory').addEventListener('click', toggleHistory);
document.getElementById('btnToggleFav').addEventListener('click', toggleFavCurrent);
document.getElementById('btnToggleFavCountry').addEventListener('click', toggleFavCountry);
document.getElementById('btnCompactToggle').addEventListener('click', toggleCompact);

// Quick copy: delegated click on .copyable elements inside cardVisual
function copyText(text, el) {
  copyToClipboard(text, function (copied) {
    setStatus('Copied: ' + copied);
    if (el) flashCopied(el);
  });
}

document.getElementById('cardVisual').addEventListener('click', function (e) {
  var el = e.target;
  if (!el.classList.contains('copyable')) return;

  var text = '';
  if (el.id === 'cardNum') {
    text = state.card ? state.card.number : '';
  } else if (el.id === 'expiry') {
    text = state.card ? state.card.expMonth + '/' + state.card.expYear : '';
  } else if (el.id === 'cvv') {
    text = state.card ? state.card.cvv : '';
  } else if (el.id === 'compactNum') {
    text = state.card ? state.card.number : '';
  } else if (el.id === 'compactExp') {
    text = state.card ? state.card.expMonth + '/' + state.card.expYear : '';
  } else if (el.id === 'compactCvv') {
    text = state.card ? state.card.cvv : '';
  }

  copyText(text, el);
});

document.querySelector('.person-compact').addEventListener('click', function (e) {
  var el = e.target;
  if (!el.classList.contains('copyable')) return;

  var text = '';
  if (el.id === 'personName') {
    text = state.person ? state.person.fullName : '';
  } else if (el.id === 'personAddr') {
    text = state.person ? state.person.address1 : '';
  } else if (el.id === 'personCity') {
    text = state.person ? state.person.city : '';
  } else if (el.id === 'personZip') {
    text = state.person ? state.person.postalCode : '';
  } else if (el.id === 'personCountry') {
    text = state.person ? state.person.countryName : '';
  }

  copyText(text, el);
});

// Quick-copy buttons
function bindCopyBtn(id, getter) {
  document.getElementById(id).addEventListener('click', function () {
    if (!state.person) return;
    copyText(getter(state.person), this);
  });
}
bindCopyBtn('btnCopyName', function (p) { return p.fullName; });
bindCopyBtn('btnCopyAddr', function (p) { return p.address1; });
bindCopyBtn('btnCopyCity', function (p) { return p.city; });
bindCopyBtn('btnCopyZip', function (p) { return p.postalCode; });
bindCopyBtn('btnCopyCountry', function (p) { return p.countryName; });

document.getElementById('selProfile').addEventListener('change', function () {
  state.selectedProfile = this.value;
  generateAll();
});

document.getElementById('chkValidateBin').addEventListener('change', function () {
  var checkbox = this;
  if (checkbox.checked) {
    requestBinLookupPermission(function (granted) {
      state.validateBin = !!granted;
      checkbox.checked = state.validateBin;
      generateAll({ requestBinPermission: false });
      if (!granted) setStatus('Live BIN lookup permission denied', true);
    });
  } else {
    state.validateBin = false;
    removeBinLookupPermission();
    generateAll();
  }
});

document.getElementById('chkDefaultCompact').addEventListener('change', function () {
  state.defaultCompact = this.checked;
  state.compactView = this.checked;
  applyCompact();
  saveState();
});

document.getElementById('chkGenPhone').addEventListener('change', function () {
  state.generatePhone = this.checked;
  saveState();
});

document.getElementById('chkGenEmail').addEventListener('change', function () {
  state.generateEmail = this.checked;
  saveState();
});

// Custom BIN: Enter key
document.getElementById('customBin').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') doAddCustomBin();
});

// Keyboard support for .copyable elements (Enter / Space)
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  var el = document.activeElement;
  if (!el || !el.classList || !el.classList.contains('copyable')) return;
  e.preventDefault();
  // Delegate to click — handlers on cardVisual / person-compact pick up the element.
  el.click();
});

buildBins();
buildCountries();
buildExpiry();
loadState();

// ===== Checkout detection + TLD auto-country =====
var TLD_TO_COUNTRY = {
  'us': 'US', 'com': null, 'uk': 'GB', 'co.uk': 'GB', 'de': 'DE', 'fr': 'FR',
  'it': 'IT', 'es': 'ES', 'nl': 'NL', 'be': 'BE', 'pl': 'PL', 'at': 'AT',
  'ch': 'CH', 'cz': 'CZ', 'dk': 'DK', 'fi': 'FI', 'ie': 'IE', 'gr': 'GR',
  'hu': 'HU', 'no': 'NO', 'pt': 'PT', 'ro': 'RO', 'se': 'SE', 'au': 'AU',
  'com.au': 'AU', 'nz': 'NZ', 'co.nz': 'NZ', 'jp': 'JP', 'co.jp': 'JP',
  'kr': 'KR', 'co.kr': 'KR', 'cn': 'CN', 'hk': 'HK', 'com.hk': 'HK',
  'sg': 'SG', 'com.sg': 'SG', 'tw': 'TW', 'com.tw': 'TW', 'th': 'TH',
  'co.th': 'TH', 'vn': 'VN', 'com.vn': 'VN', 'id': 'ID', 'co.id': 'ID',
  'ph': 'PH', 'com.ph': 'PH', 'in': 'IN', 'co.in': 'IN', 'il': 'IL',
  'co.il': 'IL', 'tr': 'TR', 'com.tr': 'TR', 'ae': 'AE', 'com.ae': 'AE',
  'za': 'ZA', 'co.za': 'ZA', 'br': 'BR', 'com.br': 'BR', 'mx': 'MX',
  'com.mx': 'MX', 'ar': 'AR', 'com.ar': 'AR', 'cl': 'CL', 'ca': 'CA',
};
function tldToCountry(hostname) {
  if (!hostname) return null;
  var parts = hostname.toLowerCase().split('.');
  if (parts.length < 2) return null;
  var last = parts.slice(-1).join('.');
  var last2 = parts.slice(-2).join('.');
  return TLD_TO_COUNTRY[last2] || TLD_TO_COUNTRY[last] || null;
}

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  if (!tabs || !tabs[0] || !tabs[0].url) return;
  var url = tabs[0].url;
  var btn = document.getElementById('btnAutofill');
  if (/checkout|payment|subscribe|billing|order|cart|pay\./i.test(url)) {
    btn.classList.add('checkout-detected');
  }

  // Auto-detect country by TLD (only if user opted in and has not picked a country this session).
  chrome.storage.local.get(['autoDetectCountry'], function (data) {
    if (!data.autoDetectCountry) return;
    try {
      var host = new URL(url).hostname;
      var code = tldToCountry(host);
      if (!code) return;
      for (var i = 0; i < COUNTRIES.length; i++) {
        if (COUNTRIES[i].code === code && state.countryIdx !== i) {
          state.countryIdx = i;
          document.getElementById('selCountry').value = i;
          updateCountryFavStar();
          generateAll();
          break;
        }
      }
    } catch (e) {}
  });
});
