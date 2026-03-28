import { differenceInCalendarDays } from "date-fns";
import type { CachedQuoteRecord, UserMemoryStore } from "@/lib/rides/memory";
import type { PlatformIntegrationStatus, PlatformQuote, TrafficSnapshot } from "@/lib/rides/types";

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function buildRouteKey(pickup: string, destination: string) {
  return `${pickup}->${destination}`;
}

function getEntriesForRoute(memory: UserMemoryStore, pickup: string, destination: string) {
  return memory.history.filter((e) => e.pickup === pickup && e.destination === destination);
}

function estimateQuoteFromHistory(args: {
  memory: UserMemoryStore;
  pickup: string;
  destination: string;
  platform: PlatformQuote["platform"];
  rideType: PlatformQuote["rideType"];
}): PlatformQuote | null {
  const entries = args.memory.history.filter(
    (e) =>
      e.platform === args.platform &&
      e.rideType === args.rideType &&
      e.pickup === args.pickup &&
      e.destination === args.destination
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

function pickMostFrequentRideType(
  memory: UserMemoryStore,
  pickup: string,
  destination: string,
  platform: PlatformQuote["platform"]
): PlatformQuote["rideType"] | null {
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

function getRecentCachedQuote(args: {
  memory: UserMemoryStore;
  routeKey: string;
  platform: PlatformQuote["platform"];
}): PlatformQuote | null {
  const cached = args.memory.cachedQuotes.find(
    (quote) => quote.routeKey === args.routeKey && quote.platform === args.platform
  );
  if (!cached) return null;

  return {
    platform: cached.platform,
    rideType: cached.rideType,
    etaMinutes: cached.etaMinutes,
    pickupWaitMinutes: cached.pickupWaitMinutes,
    price: cached.price,
    surgeMultiplier: cached.surgeMultiplier,
    confidence: "cached",
    sourceLabel: "Recent cached quote"
  };
}

function buildFallbackStatus(args: {
  memory: UserMemoryStore;
  pickup: string;
  destination: string;
  routeKey: string;
  platform: PlatformQuote["platform"];
  rideType: PlatformQuote["rideType"];
}): {
  status: PlatformIntegrationStatus;
  cacheableQuote?: CachedQuoteRecord;
} {
  const cached = getRecentCachedQuote({
    memory: args.memory,
    routeKey: args.routeKey,
    platform: args.platform
  });
  if (cached) {
    return {
      status: {
        platform: args.platform,
        status: "partial",
        message: `${args.platform} live quote unavailable; using the most recent cached quote for this route.`,
        quote: cached,
        fallbackUsed: true
      }
    };
  }

  const estimated = estimateQuoteFromHistory({
    memory: args.memory,
    pickup: args.pickup,
    destination: args.destination,
    platform: args.platform,
    rideType: args.rideType
  });
  if (estimated) {
    return {
      status: {
        platform: args.platform,
        status: "fallback",
        message: `${args.platform} live quote unavailable; using a history-derived estimate.`,
        quote: estimated,
        fallbackUsed: true
      }
    };
  }

  return {
    status: {
      platform: args.platform,
      status: "unavailable",
      message: `No live or historical quote is available for ${args.platform} on this route.`,
      fallbackUsed: false
    }
  };
}

export async function getTrafficSnapshot(args: {
  memory: UserMemoryStore;
  pickup: string;
  destination: string;
  currentTime: Date;
}): Promise<TrafficSnapshot> {
  const entriesForRoute = getEntriesForRoute(args.memory, args.pickup, args.destination);
  const averageDurationMinutes = Math.round(average(entriesForRoute.map((e) => e.durationMins)) ?? 0);
  const recentSamples = entriesForRoute
    .filter((entry) => differenceInCalendarDays(args.currentTime, new Date(entry.pickupAt)) <= 7)
    .map((entry) => entry.durationMins);
  const recentAverage = average(recentSamples);
  const liveDurationMinutes = Math.max(
    averageDurationMinutes,
    Math.round((recentAverage ?? averageDurationMinutes) + 8)
  );
  const delayMinutes = Math.max(0, liveDurationMinutes - averageDurationMinutes);
  const status: TrafficSnapshot["status"] = delayMinutes >= 15 ? "heavy" : delayMinutes >= 7 ? "moderate" : "clear";

  return {
    routeKey: buildRouteKey(args.pickup, args.destination),
    averageDurationMinutes,
    liveDurationMinutes,
    delayMinutes,
    status,
    capturedAt: new Date().toISOString()
  };
}

export async function getPlatformData(args: {
  memory: UserMemoryStore;
  pickup: string;
  destination: string;
}): Promise<{
  quotes: PlatformQuote[];
  integrations: PlatformIntegrationStatus[];
  cacheableQuotes: CachedQuoteRecord[];
}> {
  const routeKey = buildRouteKey(args.pickup, args.destination);
  const inferredUberRideType = (pickMostFrequentRideType(args.memory, args.pickup, args.destination, "Uber") ?? "Cab") as PlatformQuote["rideType"];
  const inferredOlaRideType = (pickMostFrequentRideType(args.memory, args.pickup, args.destination, "Ola") ?? "Auto") as PlatformQuote["rideType"];
  const inferredRapidoRideType = (pickMostFrequentRideType(args.memory, args.pickup, args.destination, "Rapido") ?? "Bike") as PlatformQuote["rideType"];

  const results: Array<{ status: PlatformIntegrationStatus; cacheableQuote?: CachedQuoteRecord }> = [];

  results.push(
    buildFallbackStatus({
      memory: args.memory,
      pickup: args.pickup,
      destination: args.destination,
      routeKey,
      platform: "Uber",
      rideType: inferredUberRideType
    })
  );

  results.push(
    buildFallbackStatus({
      memory: args.memory,
      pickup: args.pickup,
      destination: args.destination,
      routeKey,
      platform: "Ola",
      rideType: inferredOlaRideType
    })
  );
  results.push(
    buildFallbackStatus({
      memory: args.memory,
      pickup: args.pickup,
      destination: args.destination,
      routeKey,
      platform: "Rapido",
      rideType: inferredRapidoRideType
    })
  );

  return {
    quotes: results.flatMap((result) => (result.status.quote ? [result.status.quote] : [])),
    integrations: results.map((result) => result.status),
    cacheableQuotes: results.flatMap((result) => (result.cacheableQuote ? [result.cacheableQuote] : []))
  };
}
