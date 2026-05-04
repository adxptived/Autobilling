// Service worker — bridge, hotkey, context menu, BIN proxy
// Handles Ctrl+Shift+F hotkey and right-click context menu for instant autofill

try { importScripts('extensionStorage.js', 'autofillDiagnostics.js'); } catch (e) {}

// ============ Context Menu ============

chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: 'autofill-card',
    title: 'Autofill card',
    contexts: ['editable', 'page'],
    documentUrlPatterns: ['https://*/*', 'http://*/*'],
  });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === 'autofill-card') {
    doAutofill(tab);
  }
});

// ============ Hotkey ============

chrome.commands.onCommand.addListener(function (command) {
  if (command === 'autofill') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || !tabs[0]) return;
      doAutofill(tabs[0]);
    });
  }
});

// ============ Shared autofill logic ============

function doAutofill(tab) {
  getAutofillData(function (data) {
    if (!data.card || !data.person) {
      console.log('[Autobilling] No card stored. Open popup and generate first.');
      return;
    }

    // Inject into all frames including dynamically-created Stripe iframes
    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ['content.js'],
    }, function () {
      chrome.tabs.sendMessage(tab.id, { action: 'autofill', card: data.card, person: data.person }, function (resp) {
        if (chrome.runtime.lastError) {
          console.log('[Autobilling] Fill attempted');
          return;
        }
        console.log('[Autobilling]', formatAutofillStatus(resp));
      });
    });
  });
}

// ============ BIN Proxy (avoid CORS from popup) ============

var binCache = {};

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.action === 'getStorage') {
    chrome.storage.local.get(msg.keys || null, function (data) {
      sendResponse(data);
    });
    return true;
  }

  if (msg.action === 'lookupBin') {
    var prefix = msg.prefix;
    // Try cache first
    if (binCache[prefix]) {
      sendResponse(binCache[prefix]);
      return false;
    }

    // Try static DB (passed from popup)
    if (msg.staticInfo) {
      binCache[prefix] = { cached: true, info: msg.staticInfo };
      sendResponse(binCache[prefix]);
      return false;
    }

    // Fetch from binlist.net
    fetch('https://lookup.binlist.net/' + prefix, {
      headers: { 'Accept-Version': '3' },
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (json) {
        var info = {
          bank: (json.bank && json.bank.name) || 'Unknown',
          country: (json.country && json.country.alpha2) || 'XX',
          countryName: (json.country && json.country.name) || 'Unknown',
          type: (json.type || '').toUpperCase() || '',
          category: (json.scheme || '').toUpperCase() || '',
        };
        binCache[prefix] = { cached: false, info: info };
        sendResponse(binCache[prefix]);
      })
      .catch(function (err) {
        console.log('[Autobilling] BIN lookup failed:', err.message);
        binCache[prefix] = { cached: false, info: null, error: err.message };
        sendResponse(binCache[prefix]);
      });
    return true; // async
  }
});
