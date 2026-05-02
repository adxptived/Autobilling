# Autobilling

Auto-fill Stripe bank card forms with Luhn-valid generated cards. Works with any Stripe Checkout / Stripe Elements form.

## Features

- **One-click Generate** — produces a valid card number (Luhn algorithm), realistic expiry date, CVV, and matching billing address from 25+ countries
- **Fill Stripe Forms** — detects Stripe iframes and standard HTML inputs; fills card number, expiry, CVV, cardholder name, and full billing address
- **Context Menu** — right-click any editable field → *Autofill card* without opening the popup
- **Hotkey** — `Ctrl+Shift+F` (macOS: `Cmd+Shift+F`) fills the active Stripe form instantly
- **Compact Card View** — toggle between full card visual and a single-line compact view
- **Quick Copy** — click any card field (number, expiry, CVV) to copy just that value
- **BIN Live Lookup** — bank/country/type info from [binlist.net](https://binlist.net) when BIN is not in the built-in database
- **BIN Database** — 8 built-in BINs (Mastercard + Visa) with bank/country/type metadata
- **Custom BIN** — add and delete your own BIN prefixes; new custom BINs are auto-favorited
- **Favorites** — star BINs to pin them at the top of the list
- **Options Page** — configure compact mode and live BIN lookup defaults
- **History** — last 10 generated cards with one-click restore

## Install

### Chrome / Edge / Brave / Opera
1. Download or clone this repo
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select the extension folder
5. Pin the extension for quick access

### Firefox
1. Download or clone this repo
2. Go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on** → select `manifest.json`

## Usage

| Action | How |
|--------|-----|
| Generate a new card | Click **Generate** |
| Autofill active Stripe form | Click **Fill Stripe Form** or press `Ctrl+Shift+F` |
| Autofill via right-click | Right-click any input → **Autofill card** |
| Copy all card details | Click **Copy** |
| Copy a single field | Click the card number, expiry, or CVV directly |
| Toggle compact card view | Click ▼ / ▲ button on the card |
| Add a custom BIN | Type digits → **Add** |
| Star a BIN | Click ☆ next to the dropdown |
| View/restore history | Click **History** |
| Toggle BIN validation | Check/uncheck *Validate BIN* |

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension manifest (MV3, Chrome + Firefox) |
| `popup.html` | Popup UI |
| `bins.js` | Built-in BIN list and metadata |
| `countries.js` | Country dropdown data |
| `namePools.js` | Billing profile pools |
| `generator.js` | Luhn card generation and shared core helpers |
| `clipboard.js` | Clipboard helper used by popup fields |
| `popup.js` | Popup UI logic: favorites, history, custom BINs, UI state |
| `options.html` / `options.js` | Extension options page |
| `content.js` | Page-injected autofill engine (Stripe iframe + HTML) |
| `background.js` | Service worker: hotkey, context menu, BIN API proxy |
| `icons/` | Extension icons (16, 48, 128px) |

## Testing

```bash
npm test
```

## Privacy

See [PRIVACY.md](PRIVACY.md). The extension stores data locally. The only external request is optional BIN prefix lookup via binlist.net.

## Credits

- [adxptived](https://github.com/adxptived) — author
- BIN logic based on [CreditsCardTools](https://github.com/NjProVk/CreditsCardTools)
- BIN data from [binlist.net](https://binlist.net)

## License

MIT
