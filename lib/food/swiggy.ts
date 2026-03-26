import { promisify } from "node:util";
import { execFile as execFileCallback } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { OrderRecord } from "@/data/orderHistory";
import type { FoodLiveSourceStatus, FoodOffer } from "@/lib/food/types";

const execFile = promisify(execFileCallback);

interface ScrapedSwiggySnapshot {
  history: OrderRecord[];
  offers: FoodOffer[];
  averageEtaMinutes?: number;
  currentDelayMinutes?: number;
  sourceLabel?: string;
}

async function readSnapshotFile(filePath: string) {
  const contents = await readFile(path.resolve(filePath), "utf8");
  return JSON.parse(contents) as ScrapedSwiggySnapshot;
}

async function runScraperScript() {
  if (!process.env.SWIGGY_SCRAPER_ALLOW_EXEC) {
    throw new Error(
      "Swiggy scraper execution is disabled by default. Provide SWIGGY_SCRAPER_JSON_PATH (JSON handoff) or set SWIGGY_SCRAPER_ALLOW_EXEC to run the example automation."
    );
  }
  const scriptPath =
    process.env.SWIGGY_SCRAPER_SCRIPT ?? path.join(process.cwd(), "scripts", "swiggy-playwright.example.mjs");
  const { stdout } = await execFile("node", [scriptPath]);
  return JSON.parse(stdout) as ScrapedSwiggySnapshot;
}

export async function fetchSwiggySnapshot(): Promise<{
  history?: OrderRecord[];
  offers?: FoodOffer[];
  averageEtaMinutes?: number;
  currentDelayMinutes?: number;
  source?: FoodLiveSourceStatus;
}> {
  try {
    const manualPath = process.env.SWIGGY_SCRAPER_JSON_PATH;
    const snapshot = manualPath ? await readSnapshotFile(manualPath) : await runScraperScript();
    const historyCount = snapshot.history?.length ?? 0;
    const offersCount = snapshot.offers?.length ?? 0;

    // #region debug swiggy snapshot loaded
    fetch("http://127.0.0.1:7881/ingest/7c94cf26-d1ea-490f-ba6d-e6280f224d2b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "471295" },
      body: JSON.stringify({
        sessionId: "471295",
        runId: "pre-fix",
        hypothesisId: "H2_food_live_source_enabled",
        location: "rideassistant/lib/food/swiggy.ts:fetchSwiggySnapshot",
        message: "Swiggy snapshot loaded",
        data: {
          manualJsonProvided: !!manualPath,
          allowExecEnabled: !!process.env.SWIGGY_SCRAPER_ALLOW_EXEC,
          historyCount,
          offersCount,
          currentDelayMinutes: snapshot.currentDelayMinutes ?? null
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion

    return {
      history: snapshot.history,
      offers: snapshot.offers.map((offer) => ({
        ...offer,
        platform: "Swiggy",
        sourceStatus: offer.sourceStatus ?? "live",
        sourceLabel: snapshot.sourceLabel ?? offer.sourceLabel ?? "Browser automation"
      })),
      averageEtaMinutes: snapshot.averageEtaMinutes,
      currentDelayMinutes: snapshot.currentDelayMinutes,
      source: {
        platform: "Swiggy",
        status: "connected",
        accessMode: "browser-automation",
        purpose: "Fetches order history plus current restaurant ETAs and prices from the user's logged-in Swiggy session.",
        notes: manualPath
          ? "Loaded the most recent browser-captured Swiggy snapshot from JSON handoff."
          : "Live Swiggy data came from browser automation."
      }
    };
  } catch {
    // #region debug swiggy snapshot unavailable
    fetch("http://127.0.0.1:7881/ingest/7c94cf26-d1ea-490f-ba6d-e6280f224d2b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "471295" },
      body: JSON.stringify({
        sessionId: "471295",
        runId: "pre-fix",
        hypothesisId: "H2_food_live_source_enabled",
        location: "rideassistant/lib/food/swiggy.ts:fetchSwiggySnapshot",
        message: "Swiggy snapshot unavailable (no live offers/history)",
        data: {
          manualJsonProvided: !!process.env.SWIGGY_SCRAPER_JSON_PATH,
          allowExecEnabled: !!process.env.SWIGGY_SCRAPER_ALLOW_EXEC
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion
    return {
      source: {
        platform: "Swiggy",
        status: "down",
        accessMode: "fixture-fallback",
        purpose: "Swiggy integration via JSON handoff or automation.",
        notes: "Swiggy live snapshot unavailable (JSON handoff not provided, and automation disabled by default)."
      }
    };
  }
}
