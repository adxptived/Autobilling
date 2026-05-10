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

  // Use consistent city/state/zip triples where available (critical for US Stripe Tax).
  var cityVal, stateVal, zipVal;
  if (pool.locations && pool.locations.length) {
    var loc = pool.locations[Math.floor(Math.random() * pool.locations.length)];
    cityVal = loc.city;
    stateVal = loc.state;
    zipVal = loc.zips[Math.floor(Math.random() * loc.zips.length)];
  } else {
    cityVal = pool.cities[Math.floor(Math.random() * pool.cities.length)];
    stateVal = generateState(country.code);
    zipVal = pool.zip();
  }

  var person = {
    firstName: firstName,
    lastName: lastName,
    fullName: firstName + ' ' + lastName,
    address1: pool.streets[Math.floor(Math.random() * pool.streets.length)] + ' ' + (Math.floor(Math.random() * 200) + 1),
    address2: '',
    postalCode: zipVal,
    city: cityVal,
    state: stateVal,
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
    IT: ['RM', 'MI', 'NA', 'TO', 'FI'],
    ES: ['M', 'B', 'V', 'SE', 'BI'],
    MX: ['CMX', 'JAL', 'NLE', 'PUE', 'BCN'],
    PL: ['MZ', 'MA', 'DS', 'WP', 'PM'],
    NL: ['NH', 'ZH', 'UT', 'NB', 'GE'],
    CH: ['ZH', 'GE', 'BS', 'BE', 'VD'],
    AT: ['9', '6', '4', '5', '7'],
    BE: ['BRU', 'VAN', 'VOV', 'WHT', 'WLG'],
    NZ: ['AUK', 'WGN', 'CAN', 'WKO', 'OTA'],
    KR: ['11', '26', '28', '27', '30'],
    TR: ['34', '06', '35', '16', '07', '01', '42'],
    AE: ['DU', 'AZ', 'SH', 'AJ', 'RK', 'FU'],
    AR: ['B', 'X', 'S', 'M', 'T'],
    CL: ['RM', 'VS', 'BI', 'CO', 'AN', 'AR'],
    TH: ['10', '12', '50', '83', '20', '40', '90'],
    GR: ['I', 'B', 'G', 'M', 'E', 'L'],
    HU: ['BU', 'HB', 'CS', 'BZ', 'BA', 'GS'],
    RO: ['B', 'CJ', 'TM', 'IS', 'CT', 'BV'],
    ZA: ['WC', 'GT', 'KZN', 'EC', 'FS'],
    IL: ['TA', 'JM', 'HA', 'M', 'D'],
    ID: ['JK', 'JI', 'JB', 'SU', 'JT', 'BA'],
    PH: ['MNL', 'QZN', 'MAK', 'TAG', 'CEB', 'DAV'],
    VN: ['SG', 'HN', 'DN', 'HP', 'CT'],
    HK: ['HK'],
    TW: ['TPE', 'NWT', 'KHH', 'TXG', 'TNN', 'HSZ'],
    PT: ['11', '13', '03', '06', '08'],
    IE: ['L', 'M', 'C'],
    SE: ['AB', 'O', 'M', 'C', 'U'],
    NO: ['03', '46', '50', '11', '30'],
    DK: ['84', '82', '83', '81'],
    FI: ['18', '11', '19'],
    CZ: ['10', '64', '80', '32', '51'],
    SG: [''],
  };
  var list = states[countryCode] || [''];
  return list[Math.floor(Math.random() * list.length)];
}

function generatePhone(countryCode) {
  // Per-country phone plans: { cc, mobile: ['prefix',...], landline: ['prefix',...] }
  // Returns strings like "+447911123456" (GB mobile) or "+4930123456" (DE Berlin landline).
  // Use a mix of mobile and landline so forms that demand specific formats still pass.
  var plans = {
    US: { cc: '+1',   mobile: ['212','310','415','312','305','646','213','512','347','408'] },
    CA: { cc: '+1',   mobile: ['416','604','514','613','403','647','905'] },
    GB: { cc: '+44',  mobile: ['7700','7711','7722','7733','7744','7755','7766','7777','7788','7799'] },
    DE: { cc: '+49',  mobile: ['151','152','157','159','170','171','172','173','174','175','176','177','178','179'] },
    FR: { cc: '+33',  mobile: ['6','7'] },
    AU: { cc: '+61',  mobile: ['4'] },
    JP: { cc: '+81',  mobile: ['70','80','90'] },
    TR: { cc: '+90',  mobile: ['530','531','532','533','534','535','536','537','538','539'] },
    AE: { cc: '+971', mobile: ['50','52','54','55','56','58'] },
    AR: { cc: '+54',  mobile: ['911','9351','9341','9261','9221'] },
    CL: { cc: '+56',  mobile: ['9'] },
    TH: { cc: '+66',  mobile: ['6','8','9'] },
    GR: { cc: '+30',  mobile: ['69'] },
    HU: { cc: '+36',  mobile: ['20','30','31','50','70'] },
    RO: { cc: '+40',  mobile: ['72','73','74','75','76','77','78'] },
    ZA: { cc: '+27',  mobile: ['60','61','62','63','64','71','72','73','74','76','78','79','81','82','83','84'] },
    IL: { cc: '+972', mobile: ['50','52','53','54','55','58'] },
    ID: { cc: '+62',  mobile: ['811','812','813','814','815','816','817','818','819','821','822','831','852','853','856','857','858'] },
    PH: { cc: '+63',  mobile: ['905','906','915','916','917','918','919','920','921','922','923','925','926','927','928','929','932','935','936','937'] },
    VN: { cc: '+84',  mobile: ['32','33','34','35','36','37','38','39','70','76','77','78','79','81','82','83','84','85','86','88','89','90','91','92','93','94','96','97','98','99'] },
    HK: { cc: '+852', mobile: ['5','6','9'] },
    TW: { cc: '+886', mobile: ['90','91','92','93','95','97','98'] },
    PT: { cc: '+351', mobile: ['91','92','93','96'] },
    IE: { cc: '+353', mobile: ['83','85','86','87','89'] },
    SE: { cc: '+46',  mobile: ['70','72','73','76','79'] },
    NO: { cc: '+47',  mobile: ['4','9'] },
    DK: { cc: '+45',  mobile: ['2','3','4','5','6'] },
    FI: { cc: '+358', mobile: ['40','41','42','43','44','45','46','50'] },
    CZ: { cc: '+420', mobile: ['60','70','72','73','77','79'] },
    SG: { cc: '+65',  mobile: ['8','9'] },
    IN: { cc: '+91',  mobile: ['70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85','86','87','88','89','90','91','92','93','94','95','96','97','98','99'] },
    BR: { cc: '+55',  mobile: ['11','21','31','41','47','51','61','62','71','81','85'] },
    IT: { cc: '+39',  mobile: ['320','328','330','333','334','335','336','338','339','340','343','345','346','347','348','349'] },
    ES: { cc: '+34',  mobile: ['6','7'] },
    MX: { cc: '+52',  mobile: ['55','33','81','222','664','998','984'] },
    PL: { cc: '+48',  mobile: ['50','51','53','57','60','66','69','72','73','78','79','88'] },
    NL: { cc: '+31',  mobile: ['6'] },
    CH: { cc: '+41',  mobile: ['76','77','78','79'] },
    AT: { cc: '+43',  mobile: ['650','660','664','676','677','678','680','681','688','699'] },
    BE: { cc: '+32',  mobile: ['4'] },
    NZ: { cc: '+64',  mobile: ['21','22','27'] },
    KR: { cc: '+82',  mobile: ['10'] },
  };
  var plan = plans[countryCode] || { cc: '+1', mobile: ['555'] };
  var prefix = plan.mobile[Math.floor(Math.random() * plan.mobile.length)];
  // Country-specific total length. Most national numbers are 8-10 digits after the prefix.
  var totals = {
    US: 7, CA: 7, GB: 6, FR: 8, AU: 8, JP: 8, IT: 7, ES: 8,
    IE: 7, IN: 8, TR: 7, AE: 7, IL: 7, ZA: 7, PH: 7, VN: 7,
    SG: 7, HK: 7, KR: 8, AR: 7, CL: 8, TH: 7, GR: 8, HU: 7,
    RO: 7, CZ: 7, PL: 7, NL: 8, CH: 7, AT: 7, BE: 8, NZ: 7,
    MX: 7, BR: 8, ID: 7, TW: 7, PT: 7, SE: 7, NO: 7, DK: 7, FI: 7,
    DE: 7,
  };
  var n = totals[countryCode] || 7;
  var rest = '';
  for (var i = 0; i < n; i++) rest += String(Math.floor(Math.random() * 10));
  return plan.cc + prefix + rest;
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
    generatePhone: generatePhone,
    generateState: generateState,
    generateEmail: generateEmail,
  };
}
