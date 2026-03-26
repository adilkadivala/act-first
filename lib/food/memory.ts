import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { orderHistory } from "@/data/orderHistory";
import type { FoodMemoryStore } from "@/lib/food/types";

const memoryDir = process.env.VERCEL ? path.join("/tmp", "actfirst-data") : path.join(process.cwd(), "data");
const memoryFile = path.join(memoryDir, "foodMemory.json");

const defaultMemory: FoodMemoryStore = {
  history: orderHistory,
  lastSuggestedAt: "2026-03-21T20:12:00+05:30",
  lastConfirmedAt: "2026-03-20T20:29:00+05:30",
  dismissals: [
    {
      suggestionId: "food-dismissal-1",
      timestamp: "2026-03-18T20:19:00+05:30",
      reason: "Ate out with friends"
    }
  ],
  edits: [
    {
      suggestionId: "food-edit-1",
      timestamp: "2026-03-20T20:24:00+05:30",
      field: "items",
      from: "Chicken Dum Biryani",
      to: "Chicken Dum Biryani, Double Ka Meetha"
    }
  ],
  feedback: {
    preferredCuisines: {
      Biryani: 0.6,
      Healthy: 0.3
    },
    restaurantAffinity: {
      "Paradise Biryani": 0.8,
      "Bowl Company": 0.35
    }
  }
};

async function ensureMemoryFile() {
  await mkdir(memoryDir, { recursive: true });
  try {
    await readFile(memoryFile, "utf8");
  } catch {
    await writeFile(memoryFile, JSON.stringify(defaultMemory, null, 2), "utf8");
  }
}

export async function readFoodMemory(): Promise<FoodMemoryStore> {
  await ensureMemoryFile();
  const raw = await readFile(memoryFile, "utf8");
  return JSON.parse(raw) as FoodMemoryStore;
}

export async function writeFoodMemory(memory: FoodMemoryStore) {
  await ensureMemoryFile();
  await writeFile(memoryFile, JSON.stringify(memory, null, 2), "utf8");
}

export async function recordFoodDismissal(suggestionId: string, reason: string) {
  const memory = await readFoodMemory();
  memory.dismissals.unshift({
    suggestionId,
    timestamp: new Date().toISOString(),
    reason
  });
  await writeFoodMemory(memory);
}

export async function recordFoodEdit(input: {
  suggestionId: string;
  field: "restaurant" | "items" | "scheduledFor";
  from: string;
  to: string;
}) {
  const memory = await readFoodMemory();
  memory.edits.unshift({
    suggestionId: input.suggestionId,
    timestamp: new Date().toISOString(),
    field: input.field,
    from: input.from,
    to: input.to
  });
  await writeFoodMemory(memory);
}

export async function recordFoodConfirmation(suggestionId: string) {
  const memory = await readFoodMemory();
  memory.lastConfirmedAt = new Date().toISOString();
  delete memory.lastSuggestedAt;
  memory.feedback.restaurantAffinity["Paradise Biryani"] =
    (memory.feedback.restaurantAffinity["Paradise Biryani"] ?? 0) + 0.15;
  await writeFoodMemory(memory);
  return {
    suggestionId,
    confirmedAt: memory.lastConfirmedAt
  };
}
