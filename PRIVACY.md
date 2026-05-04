# Privacy Policy

Autobilling is a local browser extension. It does not collect analytics, does not track browsing activity, and does not sell or share user data.

## Stored by the extension

The extension stores the following data in browser extension storage:

- current generated card
- generated billing profile
- custom BIN prefixes
- favorite BIN prefixes
- recent generation history
- UI preferences, such as compact view, session-only mode, history expiry, and BIN validation toggle

Generated card, billing profile, and history data are stored locally by default. If session-only mode is enabled, Autobilling avoids writing those generated values to local extension storage and uses session storage where the browser supports it. This data stays on your device and is not sent to the author.

## Network requests

The only external request is optional BIN lookup. Access to this host is an optional permission requested only when live BIN lookup is enabled:

- Service: `https://lookup.binlist.net/`
- Sent value: BIN prefix only, for example `515462`
- Purpose: display bank/country/type metadata for a BIN that is not in the built-in database

Full generated card numbers, CVV, names, addresses, history, and custom settings are not sent to binlist.net.

## Page access

Autobilling auto-loads `content.js` into all pages (all frames) via `content_scripts` to reliably detect and fill Stripe payment forms. The extension does not read unrelated page content for analytics or tracking.

## Contact

Author: [adxptived](https://github.com/adxptived)
