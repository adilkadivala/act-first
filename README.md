# Act First Ride Assistant  - [live](https://ride-assistant.vercel.app/) - [video](https://www.loom.com/share/4c6f2faace2d46cd83d94dada4608349)

A proactive ride assistant built with TypeScript, Express, Next.js, Tailwind, and shadcn-style UI primitives.

## What it does

- Learns frequent ride destinations, departure windows, and ride preferences from seeded Uber, Ola, and Rapido history.
- Detects when a ride is likely needed based on weekday morning commute behavior and an upcoming departure window.
- Adjusts the recommendation using live traffic and an Uber quote.
- Shows a one-tap confirm state without performing a real booking.
- Persists dismissals, confirmations, edits, cooldowns, and cached provider quotes in `data/userMemory.json`.

## Implemented platform

- Uber:
  Implemented as the primary provider for the surfaced quote, fare estimate, surge multiplier, and ETA through browser automation.
- Ola and Rapido:
  Left optional and displayed as not enabled, which still satisfies the assignment requirement to integrate at least one platform.
- Uber and Ola do not expose a simple free public API for this assignment flow.

## Uber automation setup

1. Install Playwright locally:

```bash
npm install -D playwright
npx playwright install
```

2. Use one of these modes:

- JSON handoff mode:
  Set `UBER_SCRAPER_JSON_PATH` to a JSON file containing the latest scraped Uber quote.
- Script mode:
  Set `UBER_SCRAPER_SCRIPT` to your automation script path, or use the included `scripts/uber-playwright.example.mjs` starter.

3. Start the app with:

```bash
UBER_SCRAPER_SCRIPT=./scripts/uber-playwright.example.mjs npm run dev
```

The backend will attempt browser automation first and fall back to sample data if the scraper is unavailable or fails.

## Assignment architecture

- Trigger logic:
  Watches weekday and time-of-day patterns, current departure window, live traffic, whether today already has a booked ride, and prior dismissals.
- Anti-annoyance:
  Uses a confidence threshold plus a 90-minute route cooldown after a dismissal.
- Memory:
  Stores trips, confirmations, edits, dismissals, cooldowns, and cached live quotes. Suggestions use recency decay and feedback penalties/boosts.
- Failure handling:
  Uber automation exposes live or fallback states, and optional providers are marked unavailable until implemented.

## Stack

- Next.js UI hosted by Express
- Tailwind CSS
- Reusable shadcn-style components
- Shared TypeScript logic for behavior learning and proactive triggers

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## API endpoints

- `GET /api/ride-assistant`
- `POST /api/ride-assistant/confirm`
- `POST /api/ride-assistant/dismiss`
- `GET /api/health`

## Notes

- The current implementation uses seeded ride history and seeded live quote/traffic data for the assignment scenario.
- Uber live quote fetching is isolated in `lib/rides/uber.ts`, so you can replace sample data with a Playwright scraper without changing the rest of the app.
