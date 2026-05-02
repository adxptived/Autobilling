// Autobilling popup — BIN, country, expiry, custom BIN, favorites, history, hotkey

// ============ CONFIG ============

var BINS = [
  { brand: 'Mastercard', prefix: '515462002112', length: 16 },
  { brand: 'Mastercard', prefix: '5154620022', length: 16 },
  { brand: 'Mastercard', prefix: '515462', length: 16 },
  { brand: 'Mastercard', prefix: '559888039', length: 16 },
  { brand: 'Mastercard', prefix: '559888', length: 16 },
  { brand: 'Mastercard', prefix: '528929', length: 16 },
  { brand: 'Mastercard', prefix: '537100', length: 16 },
  { brand: 'Visa', prefix: '409636', length: 16 },
];

var BIN_DB = {
  '515462002112': { bank: 'The Bancorp Bank', country: 'US', countryName: 'USA', type: 'DEBIT', category: 'GIFT' },
  '5154620022': { bank: 'The Bancorp Bank', country: 'US', countryName: 'USA', type: 'DEBIT', category: 'GIFT' },
  '515462': { bank: 'The Bancorp Bank', country: 'US', countryName: 'USA', type: 'DEBIT', category: 'GIFT' },
  '559888039': { bank: 'Bangkok Bank', country: 'TH', countryName: 'Thailand', type: 'DEBIT', category: 'STANDARD' },
  '559888': { bank: 'Bangkok Bank', country: 'TH', countryName: 'Thailand', type: 'DEBIT', category: 'STANDARD' },
  '528929': { bank: 'Scotiabank (Barbados)', country: 'BB', countryName: 'Barbados', type: 'DEBIT', category: 'PLATINUM' },
  '537100': { bank: 'Sutton Bank', country: 'US', countryName: 'USA', type: 'CREDIT', category: 'CORPORATE PURCHASING' },
  '409636': { bank: 'DBS Bank', country: 'SG', countryName: 'Singapore', type: 'DEBIT', category: 'BUSINESS ENHANCED' },
};

var COUNTRIES = [
  { code: 'NL', name: 'Netherlands' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IE', name: 'Ireland' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
];

var NAME_POOLS = {
  NL: {
    first: ['Lucas','Emma','Noah','Sophie','Daan','Anna','Milan','Lieke','Thomas','Sanne','Sem','Lisa','Jesse','Eva','Levi','Julia'],
    last: ['de Jong','Jansen','de Vries','van Dijk','Bakker','Visser','Smit','Meijer','de Boer','Mulder','Dekker','van Leeuwen'],
    streets: ['Kerkstraat','Schoolstraat','Molenweg','Dorpsstraat','Wilhelminastraat','Julianastraat','Prinsengracht','Keizersgracht','Herengracht','Lindelaan'],
    cities: ['Amsterdam','Rotterdam','Den Haag','Utrecht','Eindhoven','Groningen','Tilburg','Almere','Breda','Nijmegen'],
    zip: function () { var n = 1000 + Math.floor(Math.random()*9000); var l = ['AA','BB','CC','DD','EE','AB','CD','EF'][Math.floor(Math.random()*8)]; return n + ' ' + l; },
  },
  DE: {
    first: ['Lukas','Anna','Leon','Emilia','Paul','Lina','Jonas','Marie','Felix','Sophie'],
    last: ['Muller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Hoffmann','Schulz'],
    streets: ['Hauptstrasse','Schulstrasse','Bahnhofstrasse','Dorfstrasse','Ringstrasse','Birkenweg','Gartenstrasse','Bergstrasse','Lindenweg','Kirchstrasse'],
    cities: ['Berlin','Hamburg','Munchen','Koln','Frankfurt','Stuttgart','Dusseldorf','Leipzig','Dortmund','Essen'],
    zip: function () { return String(10000 + Math.floor(Math.random()*90000)); },
  },
  FR: {
    first: ['Lucas','Emma','Hugo','Lea','Louis','Chloe','Gabriel','Ines','Raphael','Camille'],
    last: ['Martin','Bernard','Dubois','Thomas','Robert','Richard','Petit','Durand','Leroy','Moreau'],
    streets: ['Rue de la Paix','Avenue de France','Boulevard Saint-Germain','Rue du Faubourg','Place de la Republique'],
    cities: ['Paris','Marseille','Lyon','Toulouse','Nice','Nantes','Strasbourg','Montpellier','Bordeaux','Lille'],
    zip: function () { return String(75000 + Math.floor(Math.random()*20000)); },
  },
  GB: {
    first: ['Oliver','Jack','Harry','George','Charlie','Amelia','Olivia','Isla','Emily','Poppy'],
    last: ['Smith','Jones','Williams','Taylor','Brown','Davies','Evans','Wilson','Thomas','Roberts'],
    streets: ['High Street','Station Road','Church Lane','Mill Lane','Victoria Road','Green Lane','Park Road','Kings Road','The Avenue'],
    cities: ['London','Manchester','Birmingham','Leeds','Glasgow','Liverpool','Edinburgh','Bristol','Cardiff','Belfast'],
    zip: function () { var l = ['SW','NW','SE','NE','WC','EC','WN','M','B','L']; var n = 1 + Math.floor(Math.random()*20); var s = ['AA','BB','CC','DD','EE'][Math.floor(Math.random()*5)]; return l[Math.floor(Math.random()*l.length)] + n + ' ' + s; },
  },
  US: {
    first: ['James','John','Robert','Michael','Mary','Jennifer','Linda','Patricia','William','David'],
    last: ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez'],
    streets: ['Main St','Oak Ave','Elm St','Maple Dr','Cedar Ln','Pine Rd','Washington Blvd','Park Ave','Lake Dr','Hill St'],
    cities: ['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','Austin'],
    zip: function () { return String(10000 + Math.floor(Math.random()*90000)); },
  },
  CA: {
    first: ['Liam','Emma','Noah','Olivia','Jackson','Sophia','Lucas','Ava','Benjamin','Mia'],
    last: ['Smith','Brown','Tremblay','Martin','Roy','Wilson','Macdonald','Johnson','Taylor','Anderson'],
    streets: ['King St','Queen St','Main St','Victoria St','Park Ave','Lake Drive','Mountain Rd','Bay Street','Church St','River Rd'],
    cities: ['Toronto','Vancouver','Montreal','Calgary','Ottawa','Edmonton','Winnipeg','Quebec','Hamilton','Halifax'],
    zip: function () { var l = ['A','B','C','E','G','H','J','K','L','M','N','P','R','S','T','V']; return l[Math.floor(Math.random()*l.length)] + Math.floor(Math.random()*10) + l[Math.floor(Math.random()*l.length)] + ' ' + Math.floor(Math.random()*10) + l[Math.floor(Math.random()*l.length)] + Math.floor(Math.random()*10); },
  },
  JP: {
    first: ['Haruto','Yuto','Sota','Yuki','Hayato','Sakura','Yuna','Akari','Miyu','Rin'],
    last: ['Sato','Suzuki','Takahashi','Tanaka','Watanabe','Ito','Yamamoto','Nakamura','Kobayashi','Kato'],
    streets: ['Chuo-dori','Meiji-dori','Showa-dori','Sakura-dori','Midori-dori'],
    cities: ['Tokyo','Osaka','Nagoya','Sapporo','Fukuoka','Kobe','Kyoto','Kawasaki','Saitama','Hiroshima'],
    zip: function () { return String(100 + Math.floor(Math.random()*900)) + '-' + String(1000 + Math.floor(Math.random()*9000)); },
  },
};

var DEFAULT_POOL = {
  first: ['Lucas','Emma','Noah','Sophie','Thomas','Anna','Milan','Lisa','Jesse','Eva'],
  last: ['Jansen','Visser','Smit','de Jong','Bakker','Meyer','Fischer','Weber','Wagner','Schneider'],
  streets: ['Hauptstrasse','Schulstrasse','Bahnhofstrasse','Dorfstrasse','Ringstrasse','Birkenweg','Gartenstrasse','Bergstrasse','Lindenweg','Kirchstrasse'],
  cities: ['Berlin','Paris','Madrid','Rome','Vienna','Bern','Stockholm','Oslo','Copenhagen','Helsinki'],
  zip: function () { return String(10000 + Math.floor(Math.random()*90000)); },
};

// ============ STATE ============

var HARD_BINS = BINS.slice(); // snapshot of built-in BINs

var state = {
  binIdx: 0,
  countryIdx: 0,
  expMonth: 'random',
  expYear: 'random',
  validateBin: true,
  compactView: false,
  favBins: [],     // prefix strings the user starred
  customBins: [],  // {brand, prefix, length} added by user
  card: null,
  person: null,
  history: [],     // [{card,person,timestamp}]
};

// ============ HELPERS ============

function binLabel(bin) {
  var br = bin.brand === 'Mastercard' ? 'MC' : bin.brand === 'Visa' ? 'VISA' : bin.brand;
  var pre = bin.prefix;
  if (pre.length <= 6) return br + ' ' + pre;
  if (pre.length <= 9) return br + ' ' + pre.slice(0, 6) + '...' + pre.slice(-3);
  return br + ' ' + pre.slice(0, 6) + '...' + pre.slice(-4);
}

function findByPrefix(prefix) {
  for (var i = 0; i < BINS.length; i++) {
    if (BINS[i].prefix === prefix) return i;
  }
  return -1;
}

// ============ GENERATION ============

function lookupLiveBin(card) {
  if (!state.validateBin || card.binInfo) return;
  chrome.runtime.sendMessage({ action: 'lookupBin', prefix: card.binPrefix }, function (resp) {
    if (resp && resp.info && state.card && state.card.number === card.number) {
      state.card.binInfo = resp.info;
      render();
      saveState();
    }
  });
}

function generateAll() {
  var card = generateCard();
  var person = generatePerson();

  state.card = card;
  state.person = person;

  lookupLiveBin(card);

  // Add to history
  addHistory(card, person);
  render();
  saveState();
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
      address1: person.address1,
      postalCode: person.postalCode,
      city: person.city,
      country: person.country,
      countryName: person.countryName,
    },
    ts: Date.now(),
  };

  // Deduplicate by card number
  state.history = state.history.filter(function (h) {
    return h.card.formatted !== entry.card.formatted;
  });

  state.history.unshift(entry);
  if (state.history.length > 10) state.history = state.history.slice(0, 10);
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
    address1: h.person.address1,
    address2: '',
    postalCode: h.person.postalCode,
    city: h.person.city,
    country: h.person.country,
    countryName: h.person.countryName,
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
  btn.textContent = show ? 'History \u25B2' : 'History';
  if (show) renderHistory();
}

function renderHistory() {
  var container = document.getElementById('historyList');
  if (!state.history.length) {
    container.innerHTML = '<div class="history-empty">No cards yet</div>';
    return;
  }
  var html = '';
  for (var i = 0; i < state.history.length; i++) {
    var h = state.history[i];
    var ago = Math.floor((Date.now() - h.ts) / 60000);
    var agoStr = ago < 1 ? 'now' : ago < 60 ? ago + 'm ago' : Math.floor(ago / 60) + 'h ago';
    html += '<div class="history-item" data-idx="' + i + '">' +
      '<div><div class="history-card">' + h.card.brand + ' ' + h.card.formatted.slice(-4) + '</div>' +
      '<div class="history-meta">' + h.person.countryName + ' &middot; ' + agoStr + '</div></div>' +
      '<div class="history-actions">' +
        '<button class="btn-sm ghost history-delete" data-idx="' + i + '">X</button>' +
      '</div>' +
    '</div>';
  }
  container.innerHTML = html;

  // Click handler for history items
  var items = container.querySelectorAll('.history-item');
  for (var j = 0; j < items.length; j++) {
    (function (idx) {
      items[j].addEventListener('click', function () { restoreHistory(idx); });
    })(parseInt(items[j].getAttribute('data-idx')));
  }

  // Delete buttons
  var dels = container.querySelectorAll('.history-delete');
  for (var k = 0; k < dels.length; k++) {
    (function (idx) {
      dels[k].addEventListener('click', function (e) { deleteHistory(idx, e); });
    })(parseInt(dels[k].getAttribute('data-idx')));
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

    var binEl = document.getElementById('binInfo');
    if (state.card.binInfo && state.validateBin) {
      var bi = state.card.binInfo;
      binEl.textContent = bi.bank + ' (' + bi.countryName + ') \u2014 ' + bi.type + ' ' + bi.category;
      binEl.className = 'bin-bar valid';
    } else if (state.validateBin) {
      binEl.textContent = 'Custom BIN \u2014 not in database';
      binEl.className = 'bin-bar warn';
    } else {
      binEl.textContent = 'BIN validation off';
      binEl.className = 'bin-bar';
    }
  }
  if (state.person) {
    document.getElementById('personName').textContent = state.person.fullName;
    document.getElementById('personAddr').textContent = state.person.address1;
    document.getElementById('personZipCity').textContent = state.person.postalCode + ' ' + state.person.city;
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

function applyCompact() {
  var card = document.getElementById('cardVisual');
  var btn = document.getElementById('btnCompactToggle');
  if (state.compactView) {
    card.classList.add('compact');
    btn.innerHTML = '&#9650;';
  } else {
    card.classList.remove('compact');
    btn.innerHTML = '&#9660;';
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
  sel.addEventListener('change', function () {
    state.binIdx = parseInt(this.value);
    updateFavStar();
    generateAll();
  });
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
  btn.innerHTML = isFav ? '&#9733;' : '&#9734;';
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
  setStatus('BIN added: ' + raw);
}

// ============ PERSISTENCE ============

function saveState() {
  chrome.storage.local.set({
    binIdx: state.binIdx,
    countryIdx: state.countryIdx,
    expMonth: state.expMonth,
    expYear: state.expYear,
    validateBin: state.validateBin,
    compactView: state.compactView,
    favBins: state.favBins,
    customBins: state.customBins,
    card: state.card,
    person: state.person,
    history: state.history,
  });
}

function loadState() {
  chrome.storage.local.get(
    ['binIdx', 'countryIdx', 'expMonth', 'expYear', 'validateBin', 'compactView', 'favBins', 'customBins', 'card', 'person', 'history'],
    function (data) {
      if (data.binIdx !== undefined) state.binIdx = data.binIdx;
      if (data.countryIdx !== undefined) state.countryIdx = data.countryIdx;
      if (data.expMonth) state.expMonth = data.expMonth;
      if (data.expYear) state.expYear = data.expYear;
      if (data.validateBin !== undefined) state.validateBin = data.validateBin;
      if (data.compactView !== undefined) state.compactView = data.compactView;
      if (data.favBins) state.favBins = data.favBins;
      if (data.customBins) state.customBins = data.customBins;
      if (data.history) state.history = data.history;

      buildBins();

      document.getElementById('selBin').value = state.binIdx;
      document.getElementById('selCountry').value = state.countryIdx;
      document.getElementById('selExpMonth').value = state.expMonth;
      document.getElementById('selExpYear').value = state.expYear;
      document.getElementById('chkValidateBin').checked = state.validateBin;

      updateFavStar();
      applyCompact();

      if (data.card) state.card = data.card;
      if (data.person) state.person = data.person;
      if (!state.card) generateAll();
      else {
        render();
      }
    }
  );
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
    chrome.storage.local.set({ card: state.card, person: state.person }, function () {
      chrome.tabs.sendMessage(tab.id, { action: 'autofill' }, function (resp) {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js'],
          }, function () {
            if (chrome.runtime.lastError) {
              setStatus('Cannot access page', true);
            } else {
              setTimeout(function () {
                chrome.tabs.sendMessage(tab.id, { action: 'autofill' }, function (r2) {
                  if (chrome.runtime.lastError) {
                    setStatus('Fill attempted (injected)', false);
                  } else if (r2 && r2.success) {
                    setStatus('Filled! ' + r2.card.formatted + ' — ' + (r2.filled || []).join(', '));
                  }
                });
              }, 400);
            }
          });
        } else if (resp && resp.success) {
          setStatus('Filled! ' + resp.card.formatted + ' — ' + (resp.filled || []).join(', '));
        } else if (resp && resp.error) {
          setStatus(resp.error, true);
        } else {
          setStatus('Fill completed', false);
        }
      });
    });
  });
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

  navigator.clipboard.writeText(text).then(function () {
    setStatus('Copied!');
  }).catch(function () {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    setStatus('Copied!');
  });
}

// ============ INIT ============

document.getElementById('btnGenerate').addEventListener('click', generateAll);
document.getElementById('btnAutofill').addEventListener('click', doAutofill);
document.getElementById('btnCopy').addEventListener('click', copyCard);
document.getElementById('btnAddBin').addEventListener('click', doAddCustomBin);
document.getElementById('btnClearHistory').addEventListener('click', clearHistory);
document.getElementById('btnToggleHistory').addEventListener('click', toggleHistory);
document.getElementById('btnToggleFav').addEventListener('click', toggleFavCurrent);
document.getElementById('btnCompactToggle').addEventListener('click', toggleCompact);

// Quick copy: delegated click on .copyable elements inside cardVisual
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

  if (!text) return;

  navigator.clipboard.writeText(text).then(function () {
    setStatus('Copied: ' + text);
  }).catch(function () {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    setStatus('Copied: ' + text);
  });
});

document.getElementById('chkValidateBin').addEventListener('change', function () {
  state.validateBin = this.checked;
  generateAll();
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
  if (tabs && tabs[0] && tabs[0].url && tabs[0].url.indexOf('stripe.com') > -1) {
    var btn = document.getElementById('btnAutofill');
    btn.style.background = '#e94560';
    btn.style.borderColor = '#e94560';
    btn.style.color = '#fff';
  }
});
