var SENSITIVE_STORAGE_KEYS = ['card', 'person', 'history'];
var SETTINGS_STORAGE_KEYS = [
  'binIdx',
  'countryIdx',
  'expMonth',
  'expYear',
  'validateBin',
  'compactView',
  'defaultCompact',
  'generatePhone',
  'generateEmail',
  'selectedProfile',
  'savedProfiles',
  'favBins',
  'customBins',
  'sessionOnly',
  'historyTtlMinutes',
];

function hasSessionStorage() {
  return !!(chrome.storage && chrome.storage.session);
}

function getSensitiveStore(sessionOnly) {
  return sessionOnly && hasSessionStorage() ? chrome.storage.session : chrome.storage.local;
}

function saveExtensionSettings(state, done) {
  chrome.storage.local.set({
    binIdx: state.binIdx,
    countryIdx: state.countryIdx,
    expMonth: state.expMonth,
    expYear: state.expYear,
    validateBin: state.validateBin,
    compactView: state.compactView,
    defaultCompact: state.defaultCompact,
    generatePhone: state.generatePhone,
    generateEmail: state.generateEmail,
    selectedProfile: state.selectedProfile,
    savedProfiles: state.savedProfiles,
    favBins: state.favBins,
    customBins: state.customBins,
    sessionOnly: state.sessionOnly,
    historyTtlMinutes: state.historyTtlMinutes,
  }, done);
}

function saveSensitiveState(state, done) {
  var data = {
    card: state.card || null,
    person: state.person || null,
    history: state.history || [],
  };

  if (state.sessionOnly) {
    chrome.storage.local.remove(SENSITIVE_STORAGE_KEYS, function () {
      if (hasSessionStorage()) {
        chrome.storage.session.set(data, done);
      } else if (done) {
        done();
      }
    });
    return;
  }

  if (hasSessionStorage()) chrome.storage.session.remove(SENSITIVE_STORAGE_KEYS);
  chrome.storage.local.set(data, done);
}

function saveExtensionState(state, done) {
  saveExtensionSettings(state, function () {
    saveSensitiveState(state, done);
  });
}

function loadExtensionSettings(done) {
  chrome.storage.local.get(SETTINGS_STORAGE_KEYS, done);
}

function loadSensitiveState(sessionOnly, done) {
  getSensitiveStore(sessionOnly).get(SENSITIVE_STORAGE_KEYS, done);
}

function getAutofillData(done) {
  chrome.storage.local.get(['sessionOnly'], function (settings) {
    loadSensitiveState(!!settings.sessionOnly, done);
  });
}

function clearLocalSensitive(done) {
  chrome.storage.local.remove(SENSITIVE_STORAGE_KEYS, done);
}

function clearStoredHistory(done) {
  chrome.storage.local.set({ history: [] }, function () {
    if (hasSessionStorage()) {
      chrome.storage.session.set({ history: [] }, done);
    } else if (done) {
      done();
    }
  });
}

if (typeof module !== 'undefined') {
  module.exports = {
    SENSITIVE_STORAGE_KEYS: SENSITIVE_STORAGE_KEYS,
    SETTINGS_STORAGE_KEYS: SETTINGS_STORAGE_KEYS,
    saveExtensionSettings: saveExtensionSettings,
    saveSensitiveState: saveSensitiveState,
    saveExtensionState: saveExtensionState,
    loadExtensionSettings: loadExtensionSettings,
    loadSensitiveState: loadSensitiveState,
    getAutofillData: getAutofillData,
    clearLocalSensitive: clearLocalSensitive,
    clearStoredHistory: clearStoredHistory,
  };
}
