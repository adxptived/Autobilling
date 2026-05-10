// Autobilling settings page

var STATUS_TIMER = null;

function setStatus(text, isError) {
  var el = document.getElementById('status');
  el.textContent = text;
  el.className = 'status' + (isError ? ' error' : '');
  if (STATUS_TIMER) { clearTimeout(STATUS_TIMER); STATUS_TIMER = null; }
  if (text) {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    STATUS_TIMER = setTimeout(function () {
      if (el.textContent === text) el.textContent = '';
    }, isError ? 3600 : 2000);
  }
}

// ============ VERSION ============

(function () {
  try {
    var info = chrome.runtime.getManifest();
    var v = (info && info.version) || '—';
    var txt = document.getElementById('txtVersion');
    var sub = document.getElementById('subVersion');
    if (txt) txt.textContent = 'v' + v;
    if (sub) sub.textContent = 'Autobilling preferences and profiles · v' + v;
  } catch (e) {}
})();

// ============ CUSTOM PROFILE ============

function readCustomProfile() {
  var fullName = document.getElementById('profileName').value.trim();
  var parts = fullName.split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
    fullName: fullName,
    address1: document.getElementById('profileAddr').value.trim(),
    address2: '',
    postalCode: document.getElementById('profileZip').value.trim(),
    city: document.getElementById('profileCity').value.trim(),
    state: document.getElementById('profileState').value.trim(),
    phone: document.getElementById('profilePhone').value.trim(),
    email: document.getElementById('profileEmail').value.trim(),
    country: document.getElementById('profileCountry').value.trim().toUpperCase(),
    countryName: document.getElementById('profileCountryName').value.trim(),
  };
}

function fillCustomProfile(profile) {
  if (!profile) return;
  document.getElementById('profileName').value = profile.fullName || '';
  document.getElementById('profileAddr').value = profile.address1 || '';
  document.getElementById('profileZip').value = profile.postalCode || '';
  document.getElementById('profileCity').value = profile.city || '';
  document.getElementById('profileState').value = profile.state || '';
  document.getElementById('profilePhone').value = profile.phone || '';
  document.getElementById('profileEmail').value = profile.email || '';
  document.getElementById('profileCountry').value = profile.country || '';
  document.getElementById('profileCountryName').value = profile.countryName || '';
}

// ============ CUSTOM BIN MANAGER ============

function renderCustomBins(bins) {
  var list = document.getElementById('binList');
  var empty = document.getElementById('binListEmpty');
  bins = bins || [];
  list.textContent = '';
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
      var brand = document.createElement('div');
      brand.className = 'brand';
      brand.textContent = bin.brand || 'Card';
      var prefix = document.createElement('div');
      prefix.className = 'prefix';
      prefix.textContent = bin.prefix;
      info.appendChild(prefix);
      info.appendChild(brand);

      var del = document.createElement('button');
      del.className = 'btn-sm danger';
      del.textContent = 'Delete';
      del.addEventListener('click', function () {
        chrome.storage.local.get(['customBins', 'favBins'], function (data) {
          var customBins = (data.customBins || []).filter(function (b) { return b.prefix !== bin.prefix; });
          var favBins = (data.favBins || []).filter(function (p) { return p !== bin.prefix; });
          chrome.storage.local.set({ customBins: customBins, favBins: favBins }, function () {
            renderCustomBins(customBins);
            setStatus('Deleted BIN: ' + bin.prefix);
          });
        });
      });

      row.appendChild(info);
      row.appendChild(del);
      list.appendChild(row);
    })(bins[i]);
  }
}

// ============ LOAD ============

var SETTINGS_KEYS = [
  'defaultCompact', 'validateBin', 'generatePhone', 'generateEmail',
  'selectedProfile', 'savedProfiles', 'sessionOnly', 'historyTtlMinutes',
  'autoDetectCountry', 'customBins', 'favBins', 'favCountries',
  'binIdx', 'countryIdx', 'expMonth', 'expYear', 'compactView',
];

chrome.storage.local.get(SETTINGS_KEYS, function (data) {
  document.getElementById('chkDefaultCompact').checked = !!data.defaultCompact;
  document.getElementById('chkValidateBin').checked = data.validateBin !== false;
  document.getElementById('chkGenPhone').checked = !!data.generatePhone;
  document.getElementById('chkGenEmail').checked = !!data.generateEmail;
  document.getElementById('chkAutoDetectCountry').checked = !!data.autoDetectCountry;
  document.getElementById('selProfile').value = data.selectedProfile || 'generated';
  document.getElementById('chkSessionOnly').checked = !!data.sessionOnly;
  document.getElementById('selHistoryTtl').value = String(data.historyTtlMinutes || 0);
  fillCustomProfile(data.savedProfiles && data.savedProfiles.custom);
  renderCustomBins(data.customBins || []);
});

// ============ SAVE ============

document.getElementById('btnSave').addEventListener('click', function () {
  var defaultCompact = document.getElementById('chkDefaultCompact').checked;
  var validateBin = document.getElementById('chkValidateBin').checked;
  var generatePhone = document.getElementById('chkGenPhone').checked;
  var generateEmail = document.getElementById('chkGenEmail').checked;
  var autoDetectCountry = document.getElementById('chkAutoDetectCountry').checked;
  var selectedProfile = document.getElementById('selProfile').value;
  var sessionOnly = document.getElementById('chkSessionOnly').checked;
  var historyTtlMinutes = parseInt(document.getElementById('selHistoryTtl').value, 10) || 0;

  function save(granted) {
    chrome.storage.local.set({
      defaultCompact: defaultCompact,
      compactView: defaultCompact,
      validateBin: granted,
      generatePhone: generatePhone,
      generateEmail: generateEmail,
      autoDetectCountry: autoDetectCountry,
      selectedProfile: selectedProfile,
      sessionOnly: sessionOnly,
      historyTtlMinutes: historyTtlMinutes,
    }, function () {
      if (sessionOnly) {
        clearLocalSensitive(function () { setStatus(granted ? 'Saved' : 'Saved without live BIN lookup'); });
      } else {
        setStatus(granted ? 'Saved' : 'Saved without live BIN lookup');
      }
    });
  }

  if (validateBin) {
    requestBinLookupPermission(save);
  } else {
    removeBinLookupPermission(function () { save(false); });
  }
});

document.getElementById('btnSaveProfile').addEventListener('click', function () {
  var custom = readCustomProfile();
  if (!custom.fullName || !custom.address1 || !custom.postalCode || !custom.city || !custom.country || !custom.countryName) {
    setStatus('Fill all custom profile fields', true);
    return;
  }
  chrome.storage.local.get(['savedProfiles'], function (data) {
    var savedProfiles = data.savedProfiles || {};
    savedProfiles.custom = custom;
    chrome.storage.local.set({ savedProfiles: savedProfiles, selectedProfile: 'custom' }, function () {
      document.getElementById('selProfile').value = 'custom';
      setStatus('Custom profile saved');
    });
  });
});

document.getElementById('btnClearHistory').addEventListener('click', function () {
  clearStoredHistory(function () { setStatus('History cleared'); });
});

// ============ RESET TO DEFAULTS ============

document.getElementById('btnResetAll').addEventListener('click', function () {
  if (!window.confirm('Reset all Autobilling settings, custom BINs, favorites, custom profile and history? This cannot be undone.')) return;
  chrome.storage.local.clear(function () {
    if (chrome.storage.session && chrome.storage.session.clear) {
      chrome.storage.session.clear(function () { finishReset(); });
    } else {
      finishReset();
    }
  });
  function finishReset() {
    setStatus('All settings cleared — reload the popup');
    // Reload the options page after a short delay so UI reflects cleared state.
    setTimeout(function () { window.location.reload(); }, 900);
  }
});

// ============ EXPORT / IMPORT ============

document.getElementById('btnExport').addEventListener('click', function () {
  chrome.storage.local.get(null, function (data) {
    // Strip sensitive data from exports — users export settings, not generated cards.
    var clean = Object.assign({}, data);
    delete clean.card;
    delete clean.person;
    delete clean.history;
    var payload = { _format: 'autobilling', _version: (chrome.runtime.getManifest && chrome.runtime.getManifest().version) || '', data: clean };
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

document.getElementById('btnImport').addEventListener('click', function () {
  document.getElementById('fileImport').click();
});

document.getElementById('fileImport').addEventListener('change', function (e) {
  var file = e.target.files && e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (ev) {
    try {
      var parsed = JSON.parse(ev.target.result);
      var data = parsed && parsed._format === 'autobilling' ? parsed.data : parsed;
      if (!data || typeof data !== 'object') throw new Error('Invalid file');
      // Never import sensitive fields.
      delete data.card;
      delete data.person;
      delete data.history;
      chrome.storage.local.set(data, function () {
        setStatus('Imported — reload popup to see changes');
        setTimeout(function () { window.location.reload(); }, 900);
      });
    } catch (err) {
      setStatus('Import failed: ' + (err.message || 'invalid JSON'), true);
    }
  };
  reader.readAsText(file);
  // Allow selecting the same file twice in a row.
  e.target.value = '';
});
