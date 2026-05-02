function setStatus(text) {
  var el = document.getElementById('status');
  el.textContent = text;
  setTimeout(function () { if (el.textContent === text) el.textContent = ''; }, 1800);
}

chrome.storage.local.get(['defaultCompact', 'validateBin'], function (data) {
  document.getElementById('chkDefaultCompact').checked = !!data.defaultCompact;
  document.getElementById('chkValidateBin').checked = data.validateBin !== false;
});

document.getElementById('btnSave').addEventListener('click', function () {
  var defaultCompact = document.getElementById('chkDefaultCompact').checked;
  var validateBin = document.getElementById('chkValidateBin').checked;
  chrome.storage.local.set({
    defaultCompact: defaultCompact,
    compactView: defaultCompact,
    validateBin: validateBin,
  }, function () {
    setStatus('Saved');
  });
});

document.getElementById('btnClearHistory').addEventListener('click', function () {
  chrome.storage.local.set({ history: [] }, function () {
    setStatus('History cleared');
  });
});
