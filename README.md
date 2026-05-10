# Autobilling

<p align="center">
  <img src="assets/icon.png" alt="Autobilling icon" width="128" height="128">
</p>

<p align="center">
  <b>Generate valid test cards and autofill any checkout form in one click.</b>
</p>

<p align="center">
  <a href="LICENSE">MIT License</a> ·
  <a href="PRIVACY.md">Privacy</a> ·
  <a href="CHANGELOG.md">Changelog</a> ·
  <a href="README.ru.md">Русский</a>
</p>

## What is Autobilling?

Autobilling is a browser extension that generates **Luhn-valid card numbers** with matching billing details (name, address, city, ZIP, country, phone, email) and **autofills them into payment forms** — Stripe, Stripe Elements, and standard HTML checkout fields.

Use it for testing payment flows, QA, or development — not for real transactions.

## What it generates

- Card number (passes Luhn check)
- Expiry date (MM/YY)
- CVV (3 or 4 digits depending on card network)
- Full name
- Street address
- City, state/province, ZIP/postal code
- Country (27+ countries supported)
- Phone number with realistic country prefixes
- Email address

## Quick install

### Chrome / Edge / Brave / Opera

1. Download or clone this repository
2. Run in terminal:
   ```bash
   npm install
   npm run build
   ```
3. Open your browser's extensions page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
   - Opera: `opera://extensions`
4. Enable **Developer mode** (toggle in top-right)
5. Click **Load unpacked** and select the `dist` folder
6. Pin the extension to your toolbar

### Firefox

Requires Firefox 142 or newer.

1. Download or clone this repository
2. Run in terminal:
   ```bash
   npm install
   npm run build
   ```
3. Open `about:debugging#/runtime/this-firefox`
4. Click **Load Temporary Add-on**
5. Select `dist-firefox/manifest.json`

### Windows one-click

Run `install.bat` — it installs dependencies, builds the extension, and opens the extensions page.

## How to use

| Action | How |
| --- | --- |
| Generate new card & profile | Click **Generate** |
| Fill a checkout form | Click **Autofill Form** or press `Ctrl+Shift+F` |
| Right-click autofill | Right-click on any page → **Autofill card** |
| Copy all data at once | Click **Copy all** |
| Copy a single field | Click any value (card number, expiry, CVV, name, etc.) |
| Change card network | Select a **BIN** (bank prefix) from the dropdown |
| Change country | Select a **Country** from the dropdown |
| Add your own BIN prefix | Type it in **Custom BIN** → **Add** |
| Favorite a BIN or country | Click the ☆ star next to the selector |
| Switch billing profile | Choose **Generated**, **US**, **NL**, or **Custom** in the Billing section |
| Open settings | Click **⚙ Settings** in the popup header |

## Settings

Click **Settings** in the popup to configure:

- **Session only** — card and profile data are not saved between sessions
- **Auto country by URL** — detects country from the current tab's domain (.de, .fr, .jp, etc.)
- **History retention** — auto-clear after 15 min, 1 hour, 24 hours, or keep until manually cleared
- **Compact card** — smaller card view by default
- **Live BIN lookup** — shows bank/country info for unknown BINs (optional, uses binlist.net)
- **Phone & Email** — toggle generation of phone and email fields
- **Custom profile** — save your own name, address, city, ZIP, state, phone, email, and country
- **Custom BINs** — manage saved BIN prefixes (view, delete individually)
- **Export / Import** — backup and restore your settings as JSON
- **Reset** — clear history or reset all settings to defaults

## Billing profiles

| Profile | Description |
| --- | --- |
| **Generated** | Random name + address + city from the selected country's pool |
| **US** | Fixed US address: 221B Baker Street, New York, NY 10001 |
| **NL** | Fixed NL address: Damrak 1, Amsterdam, 1012 LG |
| **Custom** | Your own saved profile (edit in Settings) |

## Supported card networks

Visa, Mastercard, American Express, Discover, UnionPay, JCB, Diners Club — via built-in and custom BINs, plus live lookup.

## Supported countries (27+)

US, GB, DE, FR, IT, ES, JP, CA, AU, NL, BR, MX, IN, KR, TR, AE, AR, CL, TH, GR, HU, RO, ZA, IL, ID, PH, VN, TW, HK, AT, BE, CH, CZ, DK, FI, IE, NO, NZ, PL, PT, SE, SG — each with realistic cities, states, ZIP formats, and phone prefixes.

## Privacy

Everything stays on your device. The only external request is an **optional** BIN lookup to `lookup.binlist.net` (sends only the first 6–8 digits of the card number — the bank prefix). Full card numbers, CVVs, names, and addresses are never sent anywhere.

See [PRIVACY.md](PRIVACY.md) for details.

## Responsibility notice

Autobilling is for **development, QA, and legitimate testing only**. Do not use it for fraud, unauthorized transactions, bypassing payment systems, or violating any laws or platform terms. You are responsible for how you use it.

## Development

```bash
npm install          # install dependencies
npm test             # run all tests
npm run lint         # lint source files
npm run build        # build dist/ and dist-firefox/
npm run zip          # create both .zip archives
npm run setup        # one-shot: install → build → open extensions page
```

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Credits

- [adxptived](https://github.com/adxptived) — author
- BIN logic based on [CreditsCardTools](https://github.com/NjProVk/CreditsCardTools)
- BIN metadata from [binlist.net](https://binlist.net)

## License

MIT — see [LICENSE](LICENSE).
