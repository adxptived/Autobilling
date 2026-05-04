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
  selectedProfile: 'generated',
  savedProfiles: {
    custom: null,
  },
  favBins: [],     // prefix strings the user starred
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
  btn.textContent = show ? 'History \u25B2' : 'History \u25BC';
  if (show) renderHistory();
}

function renderHistory() {
  var container = document.getElementById('historyList');
  container.textContent = '';
  if (!state.history.length) {
    var empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = 'No cards yet';
    container.appendChild(empty);
    return;
  }
  for (var i = 0; i < state.history.length; i++) {
    var h = state.history[i];
    var ago = Math.floor((Date.now() - h.ts) / 60000);
    var agoStr = ago < 1 ? 'now' : ago < 60 ? ago + 'm ago' : Math.floor(ago / 60) + 'h ago';
    var item = document.createElement('div');
    item.className = 'history-item';
    var text = document.createElement('div');
    var cardText = document.createElement('div');
    cardText.className = 'history-card';
    cardText.textContent = h.card.brand + ' ' + h.card.formatted.slice(-4);
    var meta = document.createElement('div');
    meta.className = 'history-meta';
    meta.textContent = h.person.countryName + ' · ' + agoStr;
    var actions = document.createElement('div');
    actions.className = 'history-actions';
    var del = document.createElement('button');
    del.className = 'btn-sm ghost history-delete';
    del.textContent = 'X';

    // Click handler for history items
    (function (idx, itemEl, delEl) {
      itemEl.addEventListener('click', function () { restoreHistory(idx); });

      // Delete buttons
      delEl.addEventListener('click', function (e) { deleteHistory(idx, e); });
    })(i, item, del);

    text.appendChild(cardText);
    text.appendChild(meta);
    actions.appendChild(del);
    item.appendChild(text);
    item.appendChild(actions);
    container.appendChild(item);
  }
}

// ============ RENDER ============

function render() {
  if (state.card) {
    document.getElementById('cardNum').textContent = state.card.formatted;
    document.getElementById('expiry').textContent = state.card.expMonth + '/' + state.card.expYear;
    document.getElementById('cvv').textContent = state.card.cvv;
    document.getElementById('cardNetwork').textContent =
      state.card.brand === 'Mastercard' ? 'MC' : state.card.brand === 'Visa' ? 'VISA' : state.card.brand.toUpperCase();

    var cardVisual = document.getElementById('cardVisual');
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
    document.getElementById('compactBrand').textContent =
      state.card.brand === 'Mastercard' ? 'MC' : state.card.brand === 'Visa' ? 'VISA' : state.card.brand.toUpperCase();
    document.getElementById('compactNum').textContent = '...' + state.card.number.slice(-4);
    document.getElementById('compactExp').textContent = state.card.expMonth + '/' + state.card.expYear;
    document.getElementById('compactCvv').textContent = state.card.cvv;
  }
}

function applyCompact(skipAnimation) {
  var card = document.getElementById('cardVisual');
  var btn = document.getElementById('btnCompactToggle');
  card.classList.add('no-animate');
  if (state.compactView) {
    card.classList.add('compact');
    btn.textContent = '▲';
  } else {
    card.classList.remove('compact');
    btn.textContent = '▼';
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
  sel.innerHTML = '';

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
  sel.innerHTML = '';
  for (var i = 0; i < COUNTRIES.length; i++) {
    var opt = document.createElement('option');
    opt.value = i;
    opt.textContent = COUNTRIES[i].name + ' (' + COUNTRIES[i].code + ')';
    sel.appendChild(opt);
  }
  sel.value = state.countryIdx || 0;
  sel.addEventListener('change', function () {
    state.countryIdx = parseInt(this.value);
    generateAll();
  });
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
    if (data.selectedProfile) state.selectedProfile = data.selectedProfile;
    if (data.savedProfiles) state.savedProfiles = data.savedProfiles;
    if (data.favBins) state.favBins = data.favBins;
    if (data.customBins) state.customBins = data.customBins;

    loadSensitiveState(state.sessionOnly, function (sensitiveData) {
      if (sensitiveData.history) state.history = pruneHistory(sensitiveData.history, state.historyTtlMinutes);

      buildBins();

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

function setStatus(text, isError) {
  var el = document.getElementById('status');
  el.textContent = text;
  el.className = 'status' + (isError ? ' error' : '');
  if (text && !isError) {
    setTimeout(function () { if (el.textContent === text) el.textContent = ''; }, 2500);
  }
}

function doAutofill() {
  setStatus('Filling...', false);
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs || !tabs[0]) { setStatus('No active tab', true); return; }
    var tab = tabs[0];
    saveSensitiveState(state, function () {
      chrome.tabs.sendMessage(tab.id, { action: 'autofill', card: state.card, person: state.person }, function (resp) {
        if (chrome.runtime.lastError) {
          setStatus('Content script not ready. Reload the page.', true);
        } else if (resp) {
          setStatus(formatAutofillStatus(resp), !resp.success);
        } else {
          setStatus('Fill completed', false);
        }
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

function openOptions() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  }
}

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
document.getElementById('btnCompactToggle').addEventListener('click', toggleCompact);

// Quick copy: delegated click on .copyable elements inside cardVisual
function copyText(text) {
  copyToClipboard(text, function (copied) { setStatus('Copied: ' + copied); });
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

  copyText(text);
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

  copyText(text);
});

// Quick-copy buttons
function bindCopyBtn(id, getter) {
  document.getElementById(id).addEventListener('click', function () {
    if (!state.person) return;
    copyText(getter(state.person));
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

buildBins();
buildCountries();
buildExpiry();
loadState();

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  if (tabs && tabs[0] && tabs[0].url) {
    var url = tabs[0].url.toLowerCase();
    var isCheckout = /checkout|payment|subscribe|billing|order|cart|pay\./i.test(url);
    if (isCheckout) {
      var btn = document.getElementById('btnAutofill');
      btn.style.background = '#e94560';
      btn.style.borderColor = '#e94560';
      btn.style.color = '#fff';
    }
  }
});
