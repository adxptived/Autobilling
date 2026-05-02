# Autobilling

<p align="center">
  <img src="assets/icon.png" alt="Autobilling icon" width="128" height="128">
</p>

<p align="center">
  <b>Browser extension for generating Luhn-valid card data and autofilling Stripe payment forms.</b>
</p>

<p align="center">
  <a href="LICENSE">MIT License</a> · <a href="PRIVACY.md">Privacy</a> · <a href="CHANGELOG.md">Changelog</a>
</p>

## What it does

Autobilling helps you quickly generate test-style card data and fill Stripe card forms during development or QA.

It generates:

- card number with valid Luhn checksum
- expiry date
- CVV
- billing name
- billing address
- postal code / city / country

It can then copy the data or autofill supported payment forms.

## Responsibility notice

Autobilling is provided for development, QA, and legitimate testing workflows only.

You are responsible for how you use this extension. Do not use it for fraud, unauthorized transactions, bypassing payment systems, abusing services, or any activity that violates laws, platform rules, or third-party terms. The author is not responsible for misuse, damages, account restrictions, or legal consequences caused by improper use.

## Main features

- **Generate card data** — one click creates card + billing details.
- **Stripe autofill** — fills Stripe Checkout / Stripe Elements forms.
- **Right-click autofill** — context menu action: `Autofill card`.
- **Hotkey autofill** — `Ctrl+Shift+F` / `Cmd+Shift+F`.
- **Quick copy** — click card number, expiry, CVV, or billing fields to copy only that value.
- **Copy all** — copies card and billing data together.
- **Custom BINs** — add/delete custom BIN prefixes.
- **Favorites** — star BINs to keep them at the top.
- **Live BIN lookup** — optional BIN metadata lookup via binlist.net.
- **History** — restore recently generated cards.
- **Billing profiles** — generated profile, built-in US/NL profiles, or custom saved profile.
- **Options page** — configure defaults and custom profile.
- **Optimized build** — load the lightweight `dist/` folder, not the repo root.

## Install from source

### Quick install

Windows users can run:

```bat
install.bat
```

Or use npm:

```bash
npm run setup
```

This installs dependencies, builds `dist/`, and opens the extensions page in your default browser.

If it does not open automatically, use your browser page:

- Chrome: `chrome://extensions`
- Edge: `edge://extensions`
- Brave: `brave://extensions`
- Opera: `opera://extensions`
- Firefox: `about:debugging#/runtime/this-firefox`

Then:

1. Enable **Developer mode** if needed.
2. Click **Load unpacked** / **Load Temporary Add-on**.
3. Select the `dist/` folder (`dist/manifest.json` for Firefox temporary install).
4. Pin Autobilling in the browser toolbar.

### Manual install — Chrome / Edge / Brave / Opera

1. Clone or download this repository.
2. Install dependencies and build the extension:

   ```bash
   npm install
   npm run build
   ```

3. Open `chrome://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the `dist/` folder.
7. Pin Autobilling in the browser toolbar.

Important: load `dist/`, not the repository root. The root contains development files like `node_modules/`, which can slow extension startup.

### Firefox temporary install

1. Run:

   ```bash
   npm install
   npm run build
   ```

2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on**.
4. Select `dist/manifest.json`.

## How to use

| Action | How |
| --- | --- |
| Generate new data | Click **Generate** |
| Autofill form | Click **Fill Stripe Form** |
| Autofill with hotkey | Press `Ctrl+Shift+F` / `Cmd+Shift+F` |
| Autofill with right click | Right-click page/input → **Autofill card** |
| Copy all data | Click **Copy all** |
| Copy one field | Click card number, expiry, CVV, name, address, city, or country |
| Add custom BIN | Enter prefix → **Add** |
| Delete custom BIN | Select custom BIN → **Delete** |
| Favorite BIN | Click the star next to BIN select |
| Use billing profile | Select profile in the Billing section |
| Open settings | Click **Settings** in the popup header |

## Settings

Open **Settings** from the popup to configure:

- compact card view by default
- live BIN lookup on/off
- default billing profile
- custom billing profile fields
- history clearing

## Privacy

Autobilling stores generated data and settings locally in browser extension storage.

The only external request is optional BIN lookup:

- service: `lookup.binlist.net`
- sent value: BIN prefix only, for example `515462`

Full card numbers, CVV, billing names, addresses, and history are not sent to the author.

See [PRIVACY.md](PRIVACY.md) for details.

## Development

```bash
npm install
npm test
npm run lint
npm run build
npm run open:extensions
npm run open:chrome
npm run setup
npm run zip
```

Commands:

- `npm test` — runs Luhn/core/manifest/build tests
- `npm run lint` — runs ESLint
- `npm run build` — creates optimized `dist/`
- `npm run open:extensions` — opens the default browser extension page and prints the `dist/` path
- `npm run open:chrome` — backwards-compatible alias for `open:extensions`
- `npm run setup` — installs dependencies, builds `dist/`, and opens the browser extensions page
- `npm run zip` — creates `autobilling.zip` from `dist/`

## Project structure

| Path | Purpose |
| --- | --- |
| `src/` | Extension source files loaded into `dist/` |
| `src/manifest.json` | Extension manifest |
| `src/popup.html` / `src/popup.js` | Popup UI and interactions |
| `src/options.html` / `src/options.js` | Settings page |
| `src/background.js` | Service worker: context menu, hotkey, BIN proxy |
| `src/content.js` | On-demand autofill script injected into pages |
| `assets/icon.png` | Source icon used in README and build |
| `scripts/` | Build/zip scripts |
| `tests/` | Node tests |

## Credits

- [adxptived](https://github.com/adxptived) — author
- BIN logic based on [CreditsCardTools](https://github.com/NjProVk/CreditsCardTools)
- BIN metadata from [binlist.net](https://binlist.net)

## License

MIT — see [LICENSE](LICENSE).
