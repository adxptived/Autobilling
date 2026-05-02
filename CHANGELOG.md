# Changelog

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
