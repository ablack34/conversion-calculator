# Currency Calculator

A calculator with a built-in **live currency converter** — the feature the iPhone
Calculator has but Android's doesn't. It installs to your Android home screen as an app
(a PWA), runs full‑screen, and works **offline** using the last downloaded exchange rates.

<p align="center">
  <img src="icons/icon-512.png" width="120" alt="App icon" />
</p>

## Features

- **Full calculator** — add, subtract, multiply, divide, percent, +/−, decimals, with
  thousands separators and a clean iOS‑style dark keypad.
- **Convert mode** — pick a *from* and *to* currency and the amount you type (or calculate)
  is converted live as you go. Tap **⇄** to reverse.
- **160+ currencies** with search, flags, and proper symbols (€, £, ¥, ₹, …).
- **Works offline** — the app shell is cached and the latest rates are stored on your phone,
  so it keeps working with no signal (rates show an "offline" note with their date).
- **No accounts, no ads, no API keys.** Rates come from free, keyless public sources.

## Install on your Android phone

1. Open the live URL in **Chrome** on your phone:
   `https://ablack34.github.io/conversion-calculator/`
2. Tap the **⋮** menu (top‑right) → **Add to Home screen** (or **Install app**).
3. Confirm. A "Currency Calculator" icon appears on your home screen.
4. Launch it from that icon — it opens full‑screen like a normal app and works offline.

> Tip: to make it your go‑to, drop the icon where the old calculator lived, or add it to
> your dock/favourites.

## Exchange‑rate sources

- Primary: [open.er-api.com](https://www.exchangerate-api.com/) (free tier, 160+ currencies, keyless)
- Fallback: [frankfurter.dev](https://frankfurter.dev/) (European Central Bank rates, keyless)

Rates update roughly once a day — ideal for travel. The most recent rates are cached locally
so the app works without a connection.

## Run it locally

It's a plain static site (no build step):

```bash
# any static file server works, e.g.:
npx serve .
# then open http://localhost:3000
```

## How it's built

Vanilla HTML/CSS/JS with a service worker for offline support — no framework, no bundler.

| File | Purpose |
| --- | --- |
| `index.html` | Markup for the display, keypad, and currency picker |
| `styles.css` | iOS‑style dark theme, responsive to phone screens |
| `app.js` | Calculator engine, convert mode, rate fetching + offline cache |
| `currencies.js` | Currency names, symbols, and flag lookup |
| `sw.js` | Service worker (offline app‑shell cache) |
| `manifest.webmanifest` | PWA metadata so it installs to the home screen |

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which publishes the site to
GitHub Pages. GitHub Pages must be set to **"GitHub Actions"** as the source
(Settings → Pages). On a private repository, Pages requires a paid GitHub plan; on a public
repository it's free.