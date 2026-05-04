function setStatus(text) {
  var el = document.getElementById('status');
  el.textContent = text;
  setTimeout(function () { if (el.textContent === text) el.textContent = ''; }, 1800);
}

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

chrome.storage.local.get(['defaultCompact', 'validateBin', 'selectedProfile', 'savedProfiles', 'sessionOnly', 'historyTtlMinutes'], function (data) {
  document.getElementById('chkDefaultCompact').checked = !!data.defaultCompact;
  document.getElementById('chkValidateBin').checked = data.validateBin !== false;
  document.getElementById('selProfile').value = data.selectedProfile || 'generated';
  document.getElementById('chkSessionOnly').checked = !!data.sessionOnly;
  document.getElementById('selHistoryTtl').value = String(data.historyTtlMinutes || 0);
  fillCustomProfile(data.savedProfiles && data.savedProfiles.custom);
});

document.getElementById('btnSave').addEventListener('click', function () {
  var defaultCompact = document.getElementById('chkDefaultCompact').checked;
  var validateBin = document.getElementById('chkValidateBin').checked;
  var selectedProfile = document.getElementById('selProfile').value;
  var sessionOnly = document.getElementById('chkSessionOnly').checked;
  var historyTtlMinutes = parseInt(document.getElementById('selHistoryTtl').value, 10) || 0;

  function save(granted) {
    chrome.storage.local.set({
      defaultCompact: defaultCompact,
      compactView: defaultCompact,
      validateBin: granted,
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
    setStatus('Fill all custom profile fields');
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
  clearStoredHistory(function () {
    setStatus('History cleared');
  });
});
