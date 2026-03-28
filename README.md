# Proactive Assistant  [live](https://act-first.vercel.app/)  --  [Video](https://www.loom.com/share/c861290c6b8c4e719b03b6131646e938)

A single Next.js + Express product that includes both assignment domains:

- Ride assistant
- Food assistant

This submission intentionally uses mock provider data.

Reason:

- Uber, Ola, Rapido, Swiggy, and Zomato do not provide simple free public APIs for this workflow
- The founder explicitly asked that this submission should not scrape live platforms
- So the product focuses on proactive behavior, memory, trigger logic, editability, confirmation flow, and graceful fallback using realistic mock snapshots
- To keep the demo stable, the runtime defaults to assignment-aligned mock scenario times for ride and food suggestions

## What the product does

### Ride assistant

- Learns frequent destinations, usual departure windows, and preferred ride types from stored Uber, Ola, and Rapido ride history
- Detects when the current time is close to the learned departure window
- Adjusts the recommended leave time using a route-specific traffic snapshot derived from remembered history
- Suppresses nudges when cooldown is active or a ride was already confirmed for that route today
- Shows cross-platform mock price and ETA comparisons
- Lets the user edit origin, destination, and departure time before one-tap confirmation

### Food assistant

- Learns cuisines, items, restaurants, and dinner timing from stored Swiggy and Zomato order history
- Detects when the dinner window is approaching, no order has been placed yet, and the mock delay suggests ordering earlier
- Shows mock restaurant options, ETA, and pricing
- Tracks dismissals, edits, and confirmations so future suggestions adapt
- Lets the user edit restaurant, items, and time before one-tap confirmation

## Architecture

Both assistants follow the same loop:

1. Persist remembered behavior.
2. Learn weighted patterns using frequency, recency, edits, confirmations, and dismissals.
3. Evaluate whether the current moment clears the confidence threshold.
4. Read provider snapshots from mock data sources.
5. Fall back cleanly if data is partial or missing.
6. Show transparent reasoning, editable suggestions, and one-tap confirmation.

## Trigger Logic

- Watches time-of-day and day-of-week routines
- Uses confidence thresholds before surfacing a suggestion
- Applies cooldown after dismissal
- Checks whether a matching ride was already confirmed today
- Uses delay signals to suggest earlier departure or ordering

## Memory

- Ride memory is stored in `data/userMemory.json`
- Food memory is stored in `data/foodMemory.json`
- Memory includes history, dismissals, confirmations, edits, cooldowns, and feedback weights
- Suggestions improve over time using recency weighting, frequency, and user feedback

## Real-world Constraint Handling

This project does not scrape live platforms in the submitted runtime.

Instead it demonstrates graceful handling of missing provider access by:

- using mock provider snapshots
- labeling degraded provider states in the UI
- falling back to cached or history-derived estimates when needed
- keeping the proactive flow usable even when provider data is incomplete

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
- `GET /api/food-assistant`
- `POST /api/food-assistant/confirm`
- `POST /api/food-assistant/dismiss`
- `POST /api/food-assistant/edit`
- `GET /api/health`

## Assumptions

- Provider data in this submission is mock-backed by design
- Uber, Ola, and Rapido are represented in ride history and comparison cards
- Swiggy is the primary mock provider for food, with Zomato as an optional comparison source
- No actual booking or order placement is performed; confirmation only updates product state and memory
