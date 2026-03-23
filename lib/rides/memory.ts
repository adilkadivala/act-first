import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { rideHistory, type RidePlatform, type RideType } from "@/data/rideHistory";

const memoryDir = path.join(process.cwd(), "data");
const memoryFile = path.join(memoryDir, "userMemory.json");

export interface RideDismissalRecord {
  id: string;
  routeKey: string;
  dismissedAt: string;
  reason?: string;
}

export interface RideConfirmationRecord {
  id: string;
  routeKey: string;
  confirmedAt: string;
  platform: RidePlatform;
  rideType: RideType;
  pickup: string;
  destination: string;
  suggestedLeaveAt: string;
}

export interface RideEditRecord {
  id: string;
  routeKey: string;
  field: "pickup" | "destination" | "suggestedLeaveAt";
  previousValue: string;
  nextValue: string;
  editedAt: string;
}

export interface CachedQuoteRecord {
  routeKey: string;
  platform: RidePlatform;
  rideType: RideType;
  etaMinutes: number;
  pickupWaitMinutes: number;
  price: number;
  surgeMultiplier: number;
  cachedAt: string;
}

export interface UserMemoryStore {
  history: typeof rideHistory;
  dismissals: RideDismissalRecord[];
  confirmations: RideConfirmationRecord[];
  edits: RideEditRecord[];
  cooldowns: Record<string, string>;
  cachedQuotes: CachedQuoteRecord[];
}

const defaultMemory: UserMemoryStore = {
  history: rideHistory,
  dismissals: [
    {
      id: "d1",
      routeKey: "Home - Koramangala 6th Block->ActFirst HQ - HSR Layout",
      dismissedAt: "2026-03-12T09:04:00+05:30",
      reason: "Working from home"
    }
  ],
  confirmations: [
    {
      id: "c1",
      routeKey: "Home - Koramangala 6th Block->ActFirst HQ - HSR Layout",
      confirmedAt: "2026-03-20T09:08:00+05:30",
      platform: "Rapido",
      rideType: "Bike",
      pickup: "Home - Koramangala 6th Block",
      destination: "ActFirst HQ - HSR Layout",
      suggestedLeaveAt: "2026-03-20T08:55:00+05:30"
    }
  ],
  edits: [
    {
      id: "e1",
      routeKey: "Home - Koramangala 6th Block->ActFirst HQ - HSR Layout",
      field: "suggestedLeaveAt",
      previousValue: "2026-03-18T08:56:00+05:30",
      nextValue: "2026-03-18T09:00:00+05:30",
      editedAt: "2026-03-18T08:50:00+05:30"
    }
  ],
  cooldowns: {},
  cachedQuotes: [
    {
      routeKey: "Home - Koramangala 6th Block->ActFirst HQ - HSR Layout",
      platform: "Rapido",
      rideType: "Bike",
      etaMinutes: 39,
      pickupWaitMinutes: 4,
      price: 175,
      surgeMultiplier: 1.1,
      cachedAt: "2026-03-21T09:03:00+05:30"
    }
  ]
};

function buildRouteKey(pickup: string, destination: string) {
  return `${pickup}->${destination}`;
}

async function ensureMemoryFile() {
  await mkdir(memoryDir, { recursive: true });
  try {
    await readFile(memoryFile, "utf8");
  } catch {
    await writeFile(memoryFile, JSON.stringify(defaultMemory, null, 2), "utf8");
  }
}

export async function readMemory(): Promise<UserMemoryStore> {
  await ensureMemoryFile();
  const raw = await readFile(memoryFile, "utf8");
  return JSON.parse(raw) as UserMemoryStore;
}

async function writeMemory(memory: UserMemoryStore) {
  await ensureMemoryFile();
  await writeFile(memoryFile, JSON.stringify(memory, null, 2), "utf8");
}

export async function recordDismissal(input: {
  pickup: string;
  destination: string;
  suggestedLeaveAt: string;
  reason?: string;
  dismissedAt?: string;
}) {
  const memory = await readMemory();
  const routeKey = buildRouteKey(input.pickup, input.destination);
  const dismissedAt = input.dismissedAt ?? new Date().toISOString();

  memory.dismissals.unshift({
    id: `d-${Date.now()}`,
    routeKey,
    dismissedAt,
    reason: input.reason
  });
  memory.cooldowns[routeKey] = new Date(new Date(dismissedAt).getTime() + 90 * 60 * 1000).toISOString();
  await writeMemory(memory);
  return memory;
}

export async function recordConfirmation(input: {
  platform: RidePlatform;
  rideType: RideType;
  pickup: string;
  destination: string;
  suggestedLeaveAt: string;
  confirmedAt?: string;
}) {
  const memory = await readMemory();
  const routeKey = buildRouteKey(input.pickup, input.destination);
  const confirmedAt = input.confirmedAt ?? new Date().toISOString();

  memory.confirmations.unshift({
    id: `c-${Date.now()}`,
    routeKey,
    confirmedAt,
    platform: input.platform,
    rideType: input.rideType,
    pickup: input.pickup,
    destination: input.destination,
    suggestedLeaveAt: input.suggestedLeaveAt
  });
  delete memory.cooldowns[routeKey];
  await writeMemory(memory);
  return memory;
}

export async function recordEdits(input: {
  pickup: string;
  destination: string;
  suggestedLeaveAt: string;
  previousPickup: string;
  previousDestination: string;
  previousSuggestedLeaveAt: string;
  editedAt?: string;
}) {
  const memory = await readMemory();
  const routeKey = buildRouteKey(input.previousPickup, input.previousDestination);
  const editedAt = input.editedAt ?? new Date().toISOString();

  const changes: RideEditRecord[] = [];
  if (input.pickup !== input.previousPickup) {
    changes.push({
      id: `e-${Date.now()}-pickup`,
      routeKey,
      field: "pickup",
      previousValue: input.previousPickup,
      nextValue: input.pickup,
      editedAt
    });
  }
  if (input.destination !== input.previousDestination) {
    changes.push({
      id: `e-${Date.now()}-destination`,
      routeKey,
      field: "destination",
      previousValue: input.previousDestination,
      nextValue: input.destination,
      editedAt
    });
  }
  if (input.suggestedLeaveAt !== input.previousSuggestedLeaveAt) {
    changes.push({
      id: `e-${Date.now()}-time`,
      routeKey,
      field: "suggestedLeaveAt",
      previousValue: input.previousSuggestedLeaveAt,
      nextValue: input.suggestedLeaveAt,
      editedAt
    });
  }

  memory.edits.unshift(...changes);
  await writeMemory(memory);
  return memory;
}

export async function updateCachedQuotes(quotes: CachedQuoteRecord[]) {
  const memory = await readMemory();
  const kept = memory.cachedQuotes.filter(
    (cached) =>
      !quotes.some(
        (quote) => quote.routeKey === cached.routeKey && quote.platform === cached.platform && quote.rideType === cached.rideType
      )
  );
  memory.cachedQuotes = [...quotes, ...kept].slice(0, 12);
  await writeMemory(memory);
  return memory;
}
