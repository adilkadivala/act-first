import type { CachedQuoteRecord, UserMemoryStore } from "@/lib/rides/memory";
import type { PlatformIntegrationStatus, PlatformQuote, TrafficSnapshot } from "@/lib/rides/types";

const routeKey = "Home - Koramangala 6th Block->ActFirst HQ - HSR Layout";
const pickup = "Home - Koramangala 6th Block";
const destination = "ActFirst HQ - HSR Layout";

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function estimateQuoteFromHistory(args: {
  memory: UserMemoryStore;
  platform: PlatformQuote["platform"];
  rideType: PlatformQuote["rideType"];
}): PlatformQuote | null {
  const entries = args.memory.history.filter(
    (e) =>
      e.platform === args.platform &&
      e.rideType === args.rideType &&
      e.pickup === pickup &&
      e.destination === destination
  );
  const etaMinutes = average(entries.map((e) => e.durationMins));
  const price = average(entries.map((e) => e.fare));
  if (etaMinutes === null || price === null) return null;

  return {
    platform: args.platform,
    rideType: args.rideType,
    etaMinutes: Math.max(1, Math.round(etaMinutes)),
    pickupWaitMinutes: 4,
    price: Math.max(0, Math.round(price)),
    surgeMultiplier: 1.0,
    confidence: "estimated",
    sourceLabel: "History-derived estimate"
  };
}

function pickMostFrequentRideType(memory: UserMemoryStore, platform: PlatformQuote["platform"]): PlatformQuote["rideType"] | null {
  const counts = new Map<string, number>();
  for (const entry of memory.history) {
    if (entry.platform !== platform) continue;
    if (entry.pickup !== pickup || entry.destination !== destination) continue;
    counts.set(entry.rideType, (counts.get(entry.rideType) ?? 0) + 1);
  }
  let best: { rideType: PlatformQuote["rideType"]; count: number } | null = null;
  for (const [rideType, count] of counts.entries()) {
    if (!best || count > best.count) best = { rideType: rideType as PlatformQuote["rideType"], count };
  }
  return best?.rideType ?? null;
}

export async function getTrafficSnapshot(memory: UserMemoryStore): Promise<TrafficSnapshot> {
  const entriesForRoute = memory.history.filter((e) => e.pickup === pickup && e.destination === destination);
  const averageDurationMinutes = Math.round(average(entriesForRoute.map((e) => e.durationMins)) ?? 0);
  const liveDurationMinutes = averageDurationMinutes + 8;
  const delayMinutes = Math.max(0, liveDurationMinutes - averageDurationMinutes);

  const status: TrafficSnapshot["status"] = delayMinutes >= 15 ? "heavy" : delayMinutes >= 7 ? "moderate" : "clear";

  // #region debug rides traffic snapshot
  fetch("http://127.0.0.1:7881/ingest/7c94cf26-d1ea-490f-ba6d-e6280f224d2b", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "471295" },
    body: JSON.stringify({
      sessionId: "471295",
      runId: "pre-fix",
      hypothesisId: "H3_rides_traffic_mock_removed",
      location: "rideassistant/lib/rides/liveData.ts:getTrafficSnapshot",
      message: "Computed traffic snapshot",
      data: {
        averageDurationMinutes,
        liveDurationMinutes,
        delayMinutes,
        status
      },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion

  return {
    routeKey,
    averageDurationMinutes,
    liveDurationMinutes,
    delayMinutes,
    status,
    capturedAt: new Date().toISOString()
  };
}

type AdapterResult = {
  status: PlatformIntegrationStatus;
  cacheableQuote?: CachedQuoteRecord;
};

function unavailableAdapter(platform: PlatformQuote["platform"]): AdapterResult {
  return {
    status: {
      platform,
      status: "unavailable",
      message: `No live integration configured for ${platform}.`,
      fallbackUsed: false
    }
  };
}

function cachedOrEstimatedAdapter(args: {
  memory: UserMemoryStore;
  platform: PlatformQuote["platform"];
  rideType: PlatformQuote["rideType"];
}): AdapterResult {
  const estimated = estimateQuoteFromHistory({ memory: args.memory, platform: args.platform, rideType: args.rideType });
  if (!estimated) return unavailableAdapter(args.platform);

  return {
    status: {
      platform: args.platform,
      status: "fallback",
      message: `${args.platform} live quote unavailable; using history-derived estimate.`,
      quote: estimated,
      fallbackUsed: true
    }
  };
}

export async function getPlatformData(memory: UserMemoryStore): Promise<{
  quotes: PlatformQuote[];
  integrations: PlatformIntegrationStatus[];
  cacheableQuotes: CachedQuoteRecord[];
}> {
  const inferredUberRideType = (pickMostFrequentRideType(memory, "Uber") ?? "Cab") as PlatformQuote["rideType"];
  const inferredOlaRideType = (pickMostFrequentRideType(memory, "Ola") ?? "Auto") as PlatformQuote["rideType"];
  const inferredRapidoRideType = (pickMostFrequentRideType(memory, "Rapido") ?? "Bike") as PlatformQuote["rideType"];

  const results: AdapterResult[] = [];
  results.push(cachedOrEstimatedAdapter({ memory, platform: "Uber", rideType: inferredUberRideType }));
  results.push(cachedOrEstimatedAdapter({ memory, platform: "Ola", rideType: inferredOlaRideType }));
  results.push(cachedOrEstimatedAdapter({ memory, platform: "Rapido", rideType: inferredRapidoRideType }));

  const platformSummary = results.map((r) => ({
    platform: r.status.platform,
    status: r.status.status,
    fallbackUsed: r.status.fallbackUsed,
    hasQuote: !!r.status.quote,
    quoteConfidence: r.status.quote?.confidence,
    quoteEta: r.status.quote?.etaMinutes
  }));

  // #region debug rides platform quote source
  fetch("http://127.0.0.1:7881/ingest/7c94cf26-d1ea-490f-ba6d-e6280f224d2b", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "471295" },
    body: JSON.stringify({
      sessionId: "471295",
      runId: "pre-fix",
      hypothesisId: "H1_rides_mock_fallback_removed",
      location: "rideassistant/lib/rides/liveData.ts:getPlatformData",
      message: "Platform quote source summary",
      data: { mockMode: true, platformSummary },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion

  return {
    quotes: results.flatMap((result) => (result.status.quote ? [result.status.quote] : [])),
    integrations: results.map((result) => result.status),
    cacheableQuotes: results.flatMap((result) => (result.cacheableQuote ? [result.cacheableQuote] : []))
  };
}
