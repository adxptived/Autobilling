# Changelog

## 1.6.1

- Settings now open **inline inside the popup** — no more jumping to a separate window or tab. A slide-in Settings panel appears with a Back button that animates back to the card view.
- Inline settings cover: Session-only toggle, Auto-detect country by URL toggle, History retention selector, Custom profile editor (7 inputs), Custom BIN manager with per-row delete, Export/Import JSON, Clear history, Reset all settings, and a version stamp.
- External `options.html` (still available via `chrome://extensions`) now shows a friendly tip pointing users to the popup-inline settings for a faster experience.
- Added `state.autoDetectCountry` to the persisted settings state; can be toggled from the inline Settings without leaving the popup.
- Session-only toggle in inline Settings correctly migrates sensitive data (card/person/history) to the appropriate storage backend via `saveState()`.
- Reset-all in inline Settings clears both local and session storage then reloads the popup.
- Import/Export flows inside the popup strip sensitive fields (card/person/history) from the exported payload and ignore them on import.
- `common.css` extended with `.view` slide-in/out keyframes, a polished `.back-btn`, and the reusable `.bin-list` + `.version-line` blocks that both the popup-inline settings and the external options page now share.

## 1.6.0

- Favorite countries: starred countries float to the top of the selector, mirroring favorite BINs; persisted to settings
- BIN proxy hardening: 10-minute TTL + 200-entry LRU cache in the service worker; `fetch` wrapped in `AbortController` with a 5s timeout so the popup never hangs on a stalled endpoint
- Postal-code validation extended to all 27 supported locales (TR, AR, CL, TH, GR, HU, RO, ZA, IL, ID, PH, VN, TW, AT, BE, CH, CZ, DK, FI, IE, IN, KR, MX, NO, NZ, PL, PT, SE, SG, BR) with AE/HK explicitly treated as "no postal code"
- `generatePhone` rewritten with realistic mobile prefixes per country (GB `+447…`, UAE `+9715…`, IL `+9725…`, ZA `+2782…`, etc.) and deterministic digit counts
- Shared CSS extracted into `common.css` (links from popup.html/options.html, copied by build); popup.html shrunk ~35%, options.html ~55%
- Accessibility pass: `aria-label` on all icon-only buttons, `aria-hidden` on decorative emoji, `role="button"` + `tabindex="0"` on copyable values, Enter/Space trigger copy, `aria-expanded`/`aria-controls` on the History toggle, `role="status"` on BIN bar and toast
- BIN bar: full info now also in `title` tooltip; TEST-category cards render a `TEST` badge on the card visual
- Checkout detection now uses a `.checkout-detected` CSS class with a subtle pulse animation instead of writing inline styles
- Auto-detect country by active tab TLD (opt-in in Settings) covering 45+ country-code TLDs
- History items now show a dedicated 📋 copy button (copies without restoring)
- `toggleFavCurrent` refreshes the Delete-BIN button; `restoreHistory` refreshes the country favorite star
- Settings page upgrades: version display, auto-detect-country toggle, custom BIN manager (inline list with delete), Export/Import JSON, Reset all settings to defaults
- Tests: expanded `core.test.js` to cover `generatePhone` formats, `BIN_DB` coverage of `BINS`, `COUNTRIES` ↔ `NAME_POOLS` consistency, and `NAME_POOLS` location shape

## 1.5.0

- Polished popup UI: gradient brand logo, emoji-icon section titles (Billing, Configuration, History), brand-specific card gradients (Visa, Mastercard, Amex, Discover, UnionPay, JCB, Diners) and polished chip design
- Added animated copy feedback — clicked values briefly flash green when copied
- Added toast-style status message with slide-in animation pinned to the bottom of the popup
- Added loading spinner to the Autofill button while a fill is in-flight
- Added live BIN info bar below the card (valid / warn / test coloring)
- Added keyboard-shortcut hint (`Ctrl+Shift+F`) beneath the Autofill button and subtle shimmer animation on Generate
- Redesigned history items with colored brand chips, masked last-4, expiry, and timing metadata; improved empty state
- Matched options page to popup styling (brand logo, emoji section titles, toast-style status)
- Added 15 new countries with city/state/ZIP triples: Turkey, UAE, Argentina, Chile, Thailand, Greece, Hungary, Romania, South Africa, Israel, Indonesia, Philippines, Vietnam, Hong Kong, Taiwan
- Expanded existing country pools with more cities (US: +22 incl. Anchorage/Omaha/Tulsa/Colorado Springs/Virginia Beach/Madison/Boise/Fresno/Long Beach/Oakland/El Paso/Fort Worth/Arlington/Mesa/Scottsdale/Charleston/Columbia/Des Moines/Birmingham; GB: +11 incl. Nottingham/Sheffield/Newcastle/Brighton/Oxford/Cambridge/York/Bath/Aberdeen/Swansea; FR: +9 incl. Grenoble/Saint-Etienne/Reims/Le Havre/Dijon/Toulon; IT: +8 incl. Bari/Catania/Verona/Pisa; ES: +8 incl. Alicante/Las Palmas/Santander; DE: +9 incl. Nurnberg/Duisburg/Bonn/Mannheim; JP: +6 incl. Yokohama/Chiba/Sendai; CA: +6 incl. Victoria/London ON/Kitchener)
- Rewrote `generatePhone` country-code routing to cover all supported locales via a lookup table
- Added 8 well-known public Stripe test BINs (Visa 424242, MC 555555/222300, Amex 378282, Discover 601111, Diners 305693, JCB 353011, UnionPay 620000) with clearly-labeled TEST category entries

## 1.4.0

- Auto-load content script via `content_scripts` with `all_frames: true` for reliable Stripe iframe detection
- Added optional phone & email generation (toggle in popup/options)
- Added phone & email autofill for Stripe Elements and HTML forms
- Added Stripe Elements field names: locality, postalCode, administrative
- Normalized underscores in field scoring for more accurate autofill matching
- ExecuteScript `allFrames` for dynamically-created Stripe iframes

## 1.3.0

- Added responsibility notice to README
- Added `install.bat` for guided Windows setup
- Added `npm run setup`, `npm run open:extensions`, and `npm run open:chrome` alias
- Optimized loading by removing automatic content script injection; content script is injected on demand
- Optimized dist popup loading by bundling popup scripts into one `popup.bundle.js`
- Added build test to verify dist bundle and on-demand content script setup
- Added `npm run build` for clean `dist/` extension folder
- Added `npm run zip` build script
- Added manifest file existence test
- Added GitHub Actions CI for test, lint, and zip build
- Installed ESLint and Prettier dev dependencies with lockfile
- Added popup settings button to open options page
- Added billing profiles: Generated, US, NL, and saved Custom profile
- Expanded options page with default profile and custom profile editing

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
