// Autobilling generator — Luhn cards and billing profiles

function rd() { return Math.floor(Math.random() * 10); }

function luhnChecksum(digits) {
  var sum = digits.slice().reverse().reduce(function (acc, d, i) {
    if (i % 2 === 0) {
      var doubled = d * 2;
      return acc + (doubled > 9 ? doubled - 9 : doubled);
    }
    return acc + d;
  }, 0);
  return (10 - (sum % 10)) % 10;
}

function validateLuhn(number) {
  var digits = String(number).replace(/\D/g, '').split('').map(Number);
  if (digits.length < 2) return false;
  var check = digits.pop();
  return luhnChecksum(digits) === check;
}

function generateCardNumber(prefix, length) {
  length = length || 16;
  var prefixDigits = String(prefix).replace(/\D/g, '').split('').map(Number);
  var remaining = length - prefixDigits.length - 1;
  var mid = Array.from({ length: remaining }, function () { return rd(); });
  var partial = prefixDigits.concat(mid);
  var check = luhnChecksum(partial);
  return partial.concat([check]).join('');
}

function detectBin(prefix, bins) {
  bins = bins || BINS;
  for (var i = 0; i < bins.length; i++) {
    if (bins[i].prefix === prefix) return i;
  }
  return -1;
}

function resolveExpiry(expMonth, expYear, nowDate) {
  var nowYear = (nowDate || new Date()).getFullYear() % 100;

  if (expMonth === 'random') {
    expMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  }
  if (expYear === 'random') {
    var r = nowYear + 1 + Math.floor(Math.random() * 7);
    expYear = String(r).padStart(2, '0');
  }

  return { expMonth: expMonth, expYear: expYear, expYearFull: '20' + expYear };
}

function addHistoryEntry(history, entry, max) {
  max = max || 10;
  history = history.filter(function (h) {
    return h.card.formatted !== entry.card.formatted;
  });
  history.unshift(entry);
  return history.length > max ? history.slice(0, max) : history;
}

function pruneHistory(history, ttlMinutes, nowTs) {
  if (!ttlMinutes) return history || [];
  var cutoff = (nowTs || Date.now()) - (ttlMinutes * 60000);
  return (history || []).filter(function (entry) {
    return entry.ts >= cutoff;
  });
}

function generateCard() {
  var bin = BINS[state.binIdx] || BINS[0];
  var number = generateCardNumber(bin.prefix, bin.length);

  var expiry = resolveExpiry(state.expMonth, state.expYear);
  var expMonth = expiry.expMonth;
  var expYear = expiry.expYear;

  var binInfo = state.validateBin ? (BIN_DB[bin.prefix] || null) : null;

  return {
    number: number,
    formatted: number.replace(/(\d{4})(?=\d)/g, '$1 '),
    brand: bin.brand,
    binPrefix: bin.prefix,
    binInfo: binInfo,
    expMonth: expMonth,
    expYear: expYear,
    expYearFull: expiry.expYearFull,
    cvv: String(Math.floor(Math.random() * 900) + 100),
  };
}

function generatePerson() {
  var country = COUNTRIES[state.countryIdx] || COUNTRIES[0];
  var pool = NAME_POOLS[country.code] || DEFAULT_POOL;
  var firstName = pool.first[Math.floor(Math.random() * pool.first.length)];
  var lastName = pool.last[Math.floor(Math.random() * pool.last.length)];
  var person = {
    firstName: firstName,
    lastName: lastName,
    fullName: firstName + ' ' + lastName,
    address1: pool.streets[Math.floor(Math.random() * pool.streets.length)] + ' ' + (Math.floor(Math.random() * 200) + 1),
    address2: '',
    postalCode: pool.zip(),
    city: pool.cities[Math.floor(Math.random() * pool.cities.length)],
    state: generateState(country.code),
    country: country.code,
    countryName: country.name,
    phone: state.generatePhone ? generatePhone(country.code) : '',
    email: state.generateEmail ? generateEmail(firstName, lastName) : '',
  };
  return person;
}

function generateState(countryCode) {
  var states = {
    US: ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'],
    CA: ['ON', 'QC', 'BC', 'AB', 'MB', 'SK'],
    AU: ['NSW', 'VIC', 'QLD', 'WA', 'SA'],
    GB: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    DE: ['BY', 'NW', 'BW', 'HE', 'NI'],
    FR: ['IDF', 'ARA', 'PDL', 'OCC', 'NAQ'],
    JP: ['Tokyo', 'Osaka', 'Kanagawa', 'Aichi', 'Saitama'],
    IN: ['MH', 'KA', 'TN', 'DL', 'GJ'],
    BR: ['SP', 'RJ', 'MG', 'RS', 'PR'],
  };
  var list = states[countryCode] || ['N/A'];
  return list[Math.floor(Math.random() * list.length)];
}

function generatePhone(countryCode) {
  var areaCodes = {
    US: ['212', '310', '415', '312', '305', '646', '213', '512'],
    CA: ['416', '604', '514', '613', '403'],
    GB: ['20', '121', '161', '131', '141'],
    DE: ['30', '89', '40', '221', '211'],
    FR: ['1', '4', '5', '6'],
    AU: ['2', '3', '7', '8'],
    JP: ['3', '6', '52', '45'],
  };
  var prefix = areaCodes[countryCode] || ['1'];
  var ac = prefix[Math.floor(Math.random() * prefix.length)];
  var mid = String(Math.floor(Math.random() * 900) + 100);
  var end = String(Math.floor(Math.random() * 9000) + 1000);
  if (countryCode === 'US' || countryCode === 'CA') return '+1' + ac + mid + end.slice(0, 4);
  if (countryCode === 'GB') return '+44' + ac + mid + end.slice(0, 4);
  if (countryCode === 'DE') return '+49' + ac + mid + end.slice(0, 4);
  if (countryCode === 'FR') return '+33' + ac + mid + end.slice(0, 4);
  if (countryCode === 'AU') return '+61' + ac + mid + end.slice(0, 4);
  if (countryCode === 'JP') return '+81' + ac + mid + end.slice(0, 4);
  return '+' + ac + mid + end.slice(0, 4);
}

function generateEmail(firstName, lastName) {
  var domains = ['gmail.com', 'outlook.com', 'proton.me', 'yahoo.com', 'icloud.com'];
  var sep = ['.', '_', ''];
  var s = sep[Math.floor(Math.random() * sep.length)];
  var num = Math.random() > 0.5 ? String(Math.floor(Math.random() * 999)) : '';
  var local = (firstName + s + lastName + num).toLowerCase().replace(/[^a-z0-9._]/g, '');
  var domain = domains[Math.floor(Math.random() * domains.length)];
  return local + '@' + domain;
}

if (typeof module !== 'undefined') {
  module.exports = {
    luhnChecksum: luhnChecksum,
    validateLuhn: validateLuhn,
    generateCardNumber: generateCardNumber,
    detectBin: detectBin,
    resolveExpiry: resolveExpiry,
    addHistoryEntry: addHistoryEntry,
    pruneHistory: pruneHistory,
  };
}
