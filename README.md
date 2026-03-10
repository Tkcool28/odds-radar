# Odds Radar PWA

Odds Radar is a mobile-first Progressive Web App for comparing odds across Pinnacle, FanDuel, and DraftKings using The Odds API.

## What it does

- Compares three books side-by-side: `pinnacle`, `fanduel`, `draftkings`
- Highlights the best available price per displayed outcome
- Supports Moneyline (`h2h`), Spread (`spreads`), and Total (`totals`)
- Toggle between demo mode and live mode
- Auto-refreshes every 30 seconds
- Installable on Android as a PWA
- Uses a backend connector so your API key stays off the client

## The Odds API integration

This app uses the official v4 endpoints:

- `GET /v4/sports`
- `GET /v4/sports/{sport}/odds?bookmakers=draftkings,fanduel,pinnacle&markets=h2h|spreads|totals&oddsFormat=american|decimal`
- `GET /v4/sports/{sport}/scores` to help identify live games

The Odds API docs confirm support for:
- selecting specific bookmakers with the `bookmakers` parameter
- choosing markets with `markets`
- choosing `american` or `decimal` output with `oddsFormat`
- retrieving live and upcoming games from the odds endpoint, and live/recent score state from the scores endpoint.

## Android use

Because this is a standards-based PWA, it can be opened in Chrome on Android and installed to the home screen. The app includes:

- `manifest.webmanifest`
- service worker (`public/sw.js`)
- touch-friendly mobile layout
- standalone display mode
- install prompt support where the browser allows it

## Local setup

1. Copy `.env.example` to `.env`
2. Put your real The Odds API key in `THE_ODDS_API_KEY`
3. Install dependencies
4. Run the app

```bash
npm install
npm run dev
```

Client runs on:

```bash
http://localhost:5173
```

API server runs on:

```bash
http://localhost:8787
```

## Environment variables

```bash
PORT=8787
THE_ODDS_API_KEY=your_api_key_here
DEFAULT_DATA_MODE=demo
```

Set `DEFAULT_DATA_MODE=live` if you want live mode by default.

## Deploy notes

This repo is arranged so the frontend can stay a PWA while the backend protects your secret key.

Good deployment targets:

- Render
- Railway
- Fly.io
- a VPS with Node installed

### Important

Do **not** put `THE_ODDS_API_KEY` in frontend code, public config, or a public Git repo. The Odds API docs explicitly warn about unauthorized usage if a key is exposed.

## Caveats

- Live detection depends on the scores endpoint coverage for the selected sport.
- Some sports or books may not have all three featured markets available at all times.
- Best-price highlighting compares the displayed market outcomes directly. For spreads/totals, books with different point numbers are shown separately rather than pretending they are equivalent, because fake equivalence is how people end up believing nonsense.
