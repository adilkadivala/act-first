import type { CachedQuoteRecord, UserMemoryStore } from "@/lib/rides/memory";
import { fetchUberQuote } from "@/lib/rides/uber";
import type { PlatformIntegrationStatus, PlatformQuote, TrafficSnapshot } from "@/lib/rides/types";

const routeKey = "Home - Koramangala 6th Block->ActFirst HQ - HSR Layout";

export function getTrafficSnapshot(): TrafficSnapshot {
  return {
    routeKey,
    averageDurationMinutes: 28,
    liveDurationMinutes: 48,
    delayMinutes: 20,
    status: "heavy",
    capturedAt: new Date().toISOString()
  };
}

function toQuote(
  platform: PlatformQuote["platform"],
  rideType: PlatformQuote["rideType"],
  etaMinutes: number,
  pickupWaitMinutes: number,
  price: number,
  surgeMultiplier: number,
  confidence: PlatformQuote["confidence"],
  sourceLabel: string
): PlatformQuote {
  return {
    platform,
    rideType,
    etaMinutes,
    pickupWaitMinutes,
    price,
    surgeMultiplier,
    confidence,
    sourceLabel
  };
}

type AdapterResult = {
  status: PlatformIntegrationStatus;
  cacheableQuote?: CachedQuoteRecord;
};

function fallbackUberAdapter(): AdapterResult {
  const quote = toQuote("Uber", "Cab", 43, 4, 338, 1.4, "estimated", "Fallback sample");
  return {
    status: {
      platform: "Uber",
      status: "fallback",
      message: "Using fallback Uber quote because browser automation is not configured or the scraper failed.",
      quote,
      fallbackUsed: true
    },
    cacheableQuote: {
      routeKey,
      platform: quote.platform,
      rideType: quote.rideType,
      etaMinutes: quote.etaMinutes,
      pickupWaitMinutes: quote.pickupWaitMinutes,
      price: quote.price,
      surgeMultiplier: quote.surgeMultiplier,
      cachedAt: new Date().toISOString()
    }
  };
}

function olaAdapter(): AdapterResult {
  return {
    status: {
      platform: "Ola",
      status: "unavailable",
      message:
        "Optional provider not enabled in this submission. Uber is the implemented platform integration.",
      fallbackUsed: false
    }
  };
}

function rapidoAdapter(_memory: UserMemoryStore): AdapterResult {
  return {
    status: {
      platform: "Rapido",
      status: "unavailable",
      message:
        "Optional provider not enabled in this submission. Uber is the implemented platform integration.",
      fallbackUsed: false
    }
  };
}

export async function getPlatformData(memory: UserMemoryStore): Promise<{
  quotes: PlatformQuote[];
  integrations: PlatformIntegrationStatus[];
  cacheableQuotes: CachedQuoteRecord[];
}> {
  const uberResult = await fetchUberQuote({
    pickup: "Home - Koramangala 6th Block",
    destination: "ActFirst HQ - HSR Layout",
    routeKey
  });

  const results = [
    uberResult.quote
      ? {
          status: uberResult.integration,
          cacheableQuote: uberResult.cacheableQuote
        }
      : fallbackUberAdapter(),
    olaAdapter(),
    rapidoAdapter(memory)
  ];
  return {
    quotes: results.flatMap((result) => (result.status.quote ? [result.status.quote] : [])),
    integrations: results.map((result) => result.status),
    cacheableQuotes: results.flatMap((result) => (result.cacheableQuote ? [result.cacheableQuote] : []))
  };
}
