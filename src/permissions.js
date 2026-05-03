var BIN_LOOKUP_ORIGIN = 'https://lookup.binlist.net/*';

function hasBinLookupPermission(done) {
  if (!chrome.permissions || !chrome.permissions.contains) {
    done(true);
    return;
  }
  chrome.permissions.contains({ origins: [BIN_LOOKUP_ORIGIN] }, done);
}

function requestBinLookupPermission(done) {
  if (!chrome.permissions || !chrome.permissions.request) {
    done(true);
    return;
  }
  chrome.permissions.request({ origins: [BIN_LOOKUP_ORIGIN] }, done);
}

function removeBinLookupPermission(done) {
  if (!chrome.permissions || !chrome.permissions.remove) {
    if (done) done(false);
    return;
  }
  chrome.permissions.remove({ origins: [BIN_LOOKUP_ORIGIN] }, function (removed) {
    if (done) done(removed);
  });
}

if (typeof module !== 'undefined') {
  module.exports = {
    BIN_LOOKUP_ORIGIN: BIN_LOOKUP_ORIGIN,
    hasBinLookupPermission: hasBinLookupPermission,
    requestBinLookupPermission: requestBinLookupPermission,
    removeBinLookupPermission: removeBinLookupPermission,
  };
}
