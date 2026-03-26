# Proactive Assistant  [live](https://act-first.vercel.app/)  --  [Video](https://www.loom.com/share/c861290c6b8c4e719b03b6131646e938)

A single Next.js + Express product that includes both assignment domains:

- Ride assistant
- Food assistant

This repo now matches the hiring-manager feedback:

- It is one unified codebase, not two separate submissions.
- Both domains use the same architecture: behavior memory, trigger logic, provider adapters, and graceful fallback handling.
- Platform integrations are designed for real data through browser automation or JSON handoff first, with fallback data only when live fetches fail.

## What the product does

### Ride assistant

- Learns frequent destinations, departure windows, and preferred ride types from Uber, Ola, and Rapido history.
- Detects when the weekday commute window is approaching and traffic is abnormally high.
- Fetches an Uber quote through browser automation or JSON handoff.
- Surfaces a prefilled suggestion with editable origin, destination, and departure time.

### Food assistant

- Learns favorite cuisines, items, restaurants, and dinner windows from Swiggy and Zomato order history.
- Detects when the user is nearing the usual dinner window and delivery ETAs are slower than usual.
- Fetches Swiggy history plus live offers through browser automation or JSON handoff.
- Surfaces a prefilled order suggestion with editable restaurant, items, and time.

## Unified architecture

Both assistants follow the same loop:

1. Persist remembered behavior.
2. Learn weighted patterns using frequency, recency, edits, confirmations, and dismissals.
3. Evaluate whether the current moment crosses a confidence threshold.
4. Ask provider adapters for live data.
5. Fall back cleanly if providers are unavailable or partial.
6. Show one-tap confirm UI with transparent reasoning and provider health.

## Real-data integration

There are no simple free public APIs for Uber or Swiggy for this flow, so this project uses automation-friendly adapters instead of pretending those APIs exist.

### Ride

- `lib/rides/uber.ts`
- Accepts `UBER_SCRAPER_JSON_PATH` for JSON handoff from a browser session, or `UBER_SCRAPER_SCRIPT` for direct automation.
- Included starter: `scripts/uber-playwright.example.mjs`

### Food

- `lib/food/swiggy.ts`
- Accepts `SWIGGY_SCRAPER_JSON_PATH` for JSON handoff from a browser session, or `SWIGGY_SCRAPER_SCRIPT` for direct automation.
- Included starter: `scripts/swiggy-playwright.example.mjs`

Fallback data exists only so the UI remains runnable and so failure handling can be demonstrated. When the scrapers are configured, the adapters switch to live provider mode without changing the trigger or UI code.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Optional automation setup

Install Playwright if you want to run the example browser adapters:

```bash
npm install -D playwright
npx playwright install
```

### Ride example

```bash
UBER_SCRAPER_SCRIPT=./scripts/uber-playwright.example.mjs npm run dev
```

### Food example

```bash
SWIGGY_SCRAPER_SCRIPT=./scripts/swiggy-playwright.example.mjs npm run dev
```

You can also hand off fresh scraped JSON instead:

```bash
UBER_SCRAPER_JSON_PATH=/absolute/path/uber.json SWIGGY_SCRAPER_JSON_PATH=/absolute/path/swiggy.json npm run dev
```

## API endpoints

- `GET /api/ride-assistant`
- `POST /api/ride-assistant/confirm`
- `POST /api/ride-assistant/dismiss`
- `GET /api/food-assistant`
- `POST /api/food-assistant/confirm`
- `POST /api/food-assistant/dismiss`
- `POST /api/food-assistant/edit`
- `GET /api/health`

## Memory files

- `data/userMemory.json` for ride memory
- `data/foodMemory.json` for food memory

Both persist dismissals, confirmations, edits, and learned behavior inputs.
