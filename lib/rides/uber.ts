import { promisify } from "node:util";
import { execFile as execFileCallback } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CachedQuoteRecord } from "@/lib/rides/memory";
import { getKnownLocation } from "@/lib/rides/locations";
import type { PlatformIntegrationStatus, PlatformQuote } from "@/lib/rides/types";

const execFile = promisify(execFileCallback);

interface ScrapedUberQuote {
  etaMinutes: number;
  pickupWaitMinutes: number;
  price: number;
  surgeMultiplier: number;
  rideType?: PlatformQuote["rideType"];
  sourceLabel?: string;
}

function normalizeScrapedQuote(scraped: ScrapedUberQuote): PlatformQuote {
  return {
    platform: "Uber",
    rideType: scraped.rideType ?? "Cab",
    etaMinutes: scraped.etaMinutes,
    pickupWaitMinutes: scraped.pickupWaitMinutes,
    price: scraped.price,
    surgeMultiplier: scraped.surgeMultiplier,
    confidence: "live",
    sourceLabel: scraped.sourceLabel ?? "Browser automation"
  };
}

async function readManualScrapeFile(filePath: string): Promise<ScrapedUberQuote> {
  const contents = await readFile(path.resolve(filePath), "utf8");
  return JSON.parse(contents) as ScrapedUberQuote;
}

async function runScraperScript(input: {
  pickup: string;
  destination: string;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
}): Promise<ScrapedUberQuote> {
  if (!process.env.UBER_SCRAPER_ALLOW_EXEC) {
    throw new Error(
      "Uber scraper execution is disabled by default. Provide UBER_SCRAPER_JSON_PATH (JSON handoff) or set UBER_SCRAPER_ALLOW_EXEC to run the example automation."
    );
  }
  const scriptPath = process.env.UBER_SCRAPER_SCRIPT ?? path.join(process.cwd(), "scripts", "uber-playwright.example.mjs");
  const { stdout } = await execFile("node", [
    scriptPath,
    "--pickup",
    input.pickup,
    "--destination",
    input.destination,
    "--pickup-lat",
    String(input.pickupLatitude),
    "--pickup-lng",
    String(input.pickupLongitude),
    "--destination-lat",
    String(input.destinationLatitude),
    "--destination-lng",
    String(input.destinationLongitude)
  ]);

  return JSON.parse(stdout) as ScrapedUberQuote;
}

export async function fetchUberQuote(input: {
  pickup: string;
  destination: string;
  routeKey: string;
}): Promise<{
  integration: PlatformIntegrationStatus;
  quote?: PlatformQuote;
  cacheableQuote?: CachedQuoteRecord;
}> {
  const pickup = getKnownLocation(input.pickup);
  const destination = getKnownLocation(input.destination);
  if (!pickup || !destination) {
    return {
      integration: {
        platform: "Uber",
        status: "unavailable",
        message: "Uber route is missing mapped coordinates, so live quote cannot be fetched.",
        fallbackUsed: false
      }
    };
  }

  try {
    const manualPath = process.env.UBER_SCRAPER_JSON_PATH;
    const scraped = manualPath
      ? await readManualScrapeFile(manualPath)
      : await runScraperScript({
          pickup: input.pickup,
          destination: input.destination,
          pickupLatitude: pickup.latitude,
          pickupLongitude: pickup.longitude,
          destinationLatitude: destination.latitude,
          destinationLongitude: destination.longitude
        });
    const quote = normalizeScrapedQuote(scraped);

    // #region debug uber adapter
    fetch("http://127.0.0.1:7881/ingest/7c94cf26-d1ea-490f-ba6d-e6280f224d2b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "471295" },
      body: JSON.stringify({
        sessionId: "471295",
        runId: "pre-fix",
        hypothesisId: "H2_uber_live_source",
        location: "rideassistant/lib/rides/uber.ts:fetchUberQuote",
        message: "Uber adapter returned quote",
        data: {
          manualJsonProvided: !!manualPath,
          allowExecEnabled: !!process.env.UBER_SCRAPER_ALLOW_EXEC,
          integrationStatus: "live",
          hasQuote: !!quote
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion

    return {
      integration: {
        platform: "Uber",
        status: "live",
        message: manualPath
          ? "Live Uber quote loaded from scraper output JSON."
          : "Live Uber quote fetched through browser automation.",
        quote,
        fallbackUsed: false
      },
      quote,
      cacheableQuote: {
        routeKey: input.routeKey,
        platform: quote.platform,
        rideType: quote.rideType,
        etaMinutes: quote.etaMinutes,
        pickupWaitMinutes: quote.pickupWaitMinutes,
        price: quote.price,
        surgeMultiplier: quote.surgeMultiplier,
        cachedAt: new Date().toISOString()
      }
    };
  } catch {
    // #region debug uber adapter
    fetch("http://127.0.0.1:7881/ingest/7c94cf26-d1ea-490f-ba6d-e6280f224d2b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "471295" },
      body: JSON.stringify({
        sessionId: "471295",
        runId: "pre-fix",
        hypothesisId: "H2_uber_live_source",
        location: "rideassistant/lib/rides/uber.ts:fetchUberQuote",
        message: "Uber adapter failed to return quote",
        data: {
          manualJsonProvided: !!process.env.UBER_SCRAPER_JSON_PATH,
          allowExecEnabled: !!process.env.UBER_SCRAPER_ALLOW_EXEC
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion
    return {
      integration: {
        platform: "Uber",
        status: "unavailable",
        message: "Uber live quote unavailable (scraper failed or not configured).",
        fallbackUsed: false
      }
    };
  }
}
