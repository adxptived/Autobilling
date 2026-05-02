# Changelog

## 1.2.0

- Added delete custom BIN button in popup
- Added compact-by-default setting in popup and options page
- Added `LICENSE` file
- Extracted static data into `bins.js`, `countries.js`, and `namePools.js`
- Added `clipboard.js` helper module
- Added options page for global settings
- Added tests for BIN detection, expiry generation, and history deduplication
- Added ESLint and Prettier config/scripts

## 1.1.0

- Reduced content script scope: removed `<all_urls>` from static injection matches
- Added `PRIVACY.md` with local storage and BIN lookup disclosure
- Added `generator.js` for card/person generation logic
- Added Luhn tests in `tests/luhn.test.js`
- Improved popup UI hint for quick-copy fields

## 1.0.0

- Initial release
- Luhn-valid card generation
- Stripe iframe and HTML input autofill
- Context menu autofill
- Hotkey autofill
- Compact card view
- Quick copy for card number, expiry, and CVV
- Live BIN lookup via binlist.net
- Custom BINs, favorites, and history
