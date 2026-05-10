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

// TTL/LRU cache: entries older than BIN_TTL_MS are evicted, and at most BIN_CACHE_MAX are kept.
var BIN_TTL_MS = 10 * 60 * 1000;
var BIN_CACHE_MAX = 200;
var BIN_FETCH_TIMEOUT_MS = 5000;
var binCache = {}; // prefix -> { ts, payload }

function binCacheGet(prefix) {
  var entry = binCache[prefix];
  if (!entry) return null;
  if (Date.now() - entry.ts > BIN_TTL_MS) {
    delete binCache[prefix];
    return null;
  }
  // Bump recency for LRU
  entry.ts = Date.now();
  return entry.payload;
}

function binCacheSet(prefix, payload) {
  binCache[prefix] = { ts: Date.now(), payload: payload };
  var keys = Object.keys(binCache);
  if (keys.length > BIN_CACHE_MAX) {
    // Evict oldest entries until within cap
    keys.sort(function (a, b) { return binCache[a].ts - binCache[b].ts; });
    var toRemove = keys.length - BIN_CACHE_MAX;
    for (var i = 0; i < toRemove; i++) delete binCache[keys[i]];
  }
}

function fetchWithTimeout(url, options, timeoutMs) {
  if (typeof AbortController === 'undefined') return fetch(url, options);
  var ctrl = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, timeoutMs);
  var opts = Object.assign({}, options || {}, { signal: ctrl.signal });
  return fetch(url, opts).finally(function () { clearTimeout(timer); });
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.action === 'getStorage') {
    chrome.storage.local.get(msg.keys || null, function (data) {
      sendResponse(data);
    });
    return true;
  }

  if (msg.action === 'lookupBin') {
    var prefix = msg.prefix;
    var cached = binCacheGet(prefix);
    if (cached) {
      sendResponse(cached);
      return false;
    }

    // Fetch from binlist.net with a hard timeout so the popup never spins forever.
    fetchWithTimeout('https://lookup.binlist.net/' + prefix, {
      headers: { 'Accept-Version': '3' },
    }, BIN_FETCH_TIMEOUT_MS)
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
        var payload = { cached: false, info: info };
        binCacheSet(prefix, payload);
        sendResponse(payload);
      })
      .catch(function (err) {
        var msgText = (err && err.name === 'AbortError') ? 'timeout' : (err && err.message) || 'unknown';
        console.log('[Autobilling] BIN lookup failed:', msgText);
        var payload = { cached: false, info: null, error: msgText };
        // Cache the negative result briefly so we do not hammer the API.
        binCacheSet(prefix, payload);
        sendResponse(payload);
      });
    return true; // async
  }
});
