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
  document.getElementById('profileCountry').value = profile.country || '';
  document.getElementById('profileCountryName').value = profile.countryName || '';
}

chrome.storage.local.get(['defaultCompact', 'validateBin', 'selectedProfile', 'savedProfiles'], function (data) {
  document.getElementById('chkDefaultCompact').checked = !!data.defaultCompact;
  document.getElementById('chkValidateBin').checked = data.validateBin !== false;
  document.getElementById('selProfile').value = data.selectedProfile || 'generated';
  fillCustomProfile(data.savedProfiles && data.savedProfiles.custom);
});

document.getElementById('btnSave').addEventListener('click', function () {
  var defaultCompact = document.getElementById('chkDefaultCompact').checked;
  var validateBin = document.getElementById('chkValidateBin').checked;
  var selectedProfile = document.getElementById('selProfile').value;
  chrome.storage.local.set({
    defaultCompact: defaultCompact,
    compactView: defaultCompact,
    validateBin: validateBin,
    selectedProfile: selectedProfile,
  }, function () {
    setStatus('Saved');
  });
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
  chrome.storage.local.set({ history: [] }, function () {
    setStatus('History cleared');
  });
});
