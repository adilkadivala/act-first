import { readFoodMemory, recordFoodConfirmation, recordFoodDismissal, recordFoodEdit, writeFoodMemory } from "@/lib/food/memory";
import { fetchFoodPlatformData } from "@/lib/food/platforms";
import { buildFoodProfile } from "@/lib/food/profile";
import { evaluateFoodTrigger } from "@/lib/food/trigger";
import { formatLocalDate, getMinutesOfDay, minutesToClock } from "@/lib/food/time";
import type { FoodAssistantResponse, FoodOffer, FoodMemoryStore } from "@/lib/food/types";

let foodRefreshCounter = 0;

export async function getFoodAssistantState(currentTime = new Date()): Promise<FoodAssistantResponse> {
  const refreshIndex = foodRefreshCounter++;
  const memory = await readFoodMemory();
  const platformData = await fetchFoodPlatformData();

  // Only overwrite remembered history when we actually received a live snapshot.
  if (platformData.history.length > 0 && platformData.history !== memory.history) {
    memory.history = platformData.history;
    await writeFoodMemory(memory);
  }

  const profile = buildFoodProfile(memory);
  const hasOrderToday = memory.history.some((order) => formatLocalDate(new Date(order.orderedAt)) === formatLocalDate(currentTime));
  const triggerEval = evaluateFoodTrigger(profile, memory, currentTime, hasOrderToday, platformData.liveDelayMinutes);

  const ranked = platformData.offers
    .map((offer) => ({
      offer,
      score:
        (profile.restaurants.find((entry) => entry.restaurant === offer.restaurant)?.score ?? 0) +
        offer.items.reduce((sum, item) => sum + (profile.frequentItems.find((entry) => entry.name === item.name)?.score ?? 0), 0) -
        offer.etaMinutes / 100
    }))
    .sort((a, b) => b.score - a.score);

  const preferred = ranked.length > 0 ? ranked[refreshIndex % ranked.length].offer : buildFallbackOffer(profile, memory);
  const preferredEta = preferred?.etaMinutes ?? Number.POSITIVE_INFINITY;

  // #region debug food preferred offer source
  fetch("http://127.0.0.1:7881/ingest/7c94cf26-d1ea-490f-ba6d-e6280f224d2b", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "471295" },
    body: JSON.stringify({
      sessionId: "471295",
      runId: "pre-fix",
      hypothesisId: "H1_food_mock_fallback_removed",
      location: "rideassistant/lib/food/proactive.ts:getFoodAssistantState",
      message: "Food assistant selected preferred offer",
      data: {
        preferredFromLive: !!ranked[0]?.offer,
        preferredSourceStatus: preferred?.sourceStatus ?? null,
        preferredSourceLabel: preferred?.sourceLabel ?? null,
        preferredEtaMinutes: preferred?.etaMinutes ?? null
      },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion

  const alternatives = ranked
    .filter(({ offer }) => !preferred || offer.restaurant !== preferred.restaurant)
    .slice(0, 2)
    .map(({ offer }) => ({
    restaurant: offer.restaurant,
    platform: offer.platform,
    etaMinutes: offer.etaMinutes,
    total: offer.items.reduce((sum, item) => sum + item.price, 0) + offer.deliveryFee,
    reason: offer.etaMinutes < preferredEta ? "Faster alternative" : "Backup if the favorite slows down"
    }));

  const suggestion = preferred
    ? {
        restaurant: preferred.restaurant,
        platform: preferred.platform,
        items: preferred.items.map((item) => ({ name: item.name, price: item.price, quantity: 1 })),
        etaMinutes: preferred.etaMinutes + (refreshIndex % 4),
        scheduledFor: minutesToClock(getMinutesOfDay(currentTime) + preferred.etaMinutes + (refreshIndex % 6)),
        subtotal: preferred.items.reduce((sum, item) => sum + item.price, 0),
        deliveryFee: preferred.deliveryFee + (refreshIndex % 2) * 5,
        total:
          preferred.items.reduce((sum, item) => sum + item.price, 0) + preferred.deliveryFee + (refreshIndex % 2) * 5,
        why: [
          ...triggerEval.reasons,
          "Demo mode: always showing a proactive food suggestion using dummy data.",
          `Refresh variation #${refreshIndex + 1} is active.`,
          `${preferred.restaurant} best matches your recent restaurant and cuisine preferences.`
        ],
        sourceStatus: preferred.sourceStatus,
        status: "ready" as const
      }
    : null;

  const decision = {
    ...triggerEval,
    shouldSuggest: !!suggestion,
    confidence: Math.max(0.7, triggerEval.confidence),
    reasons:
      triggerEval.reasons.length > 0
        ? triggerEval.reasons
        : ["Demo mode is enabled, so the assistant always surfaces one mock suggestion."]
  };

  if (suggestion) {
    memory.lastSuggestedAt = currentTime.toISOString();
    await writeFoodMemory(memory);
  }

  return {
    suggestionId: `food-${currentTime.toISOString()}`,
    generatedAt: new Date().toISOString(),
    currentTime: currentTime.toISOString(),
    decision,
    profile,
    suggestion,
    alternatives,
    liveDataHealth: {
      complete: platformData.warnings.length === 0,
      warnings: platformData.warnings
    },
    integrations: {
      primary: "Swiggy",
      optional: ["Zomato"],
      liveSources: platformData.liveSources
    }
  };
}

export async function confirmFoodSuggestion(suggestionId: string) {
  return recordFoodConfirmation(suggestionId);
}

export async function dismissFoodSuggestion(suggestionId: string, reason: string) {
  await recordFoodDismissal(suggestionId, reason);
  return { ok: true };
}

export async function editFoodSuggestion(input: {
  suggestionId: string;
  field: "restaurant" | "items" | "scheduledFor";
  from: string;
  to: string;
}) {
  await recordFoodEdit(input);
  return { ok: true };
}

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function buildFallbackOffer(
  profile: FoodAssistantResponse["profile"],
  memory: FoodMemoryStore
): FoodOffer | null {
  const restaurant = profile.restaurants[0]?.restaurant;
  const itemName = profile.frequentItems[0]?.name;
  if (!restaurant || !itemName) return null;

  const rememberedOrders = memory.history.filter((o) => o.restaurant === restaurant);
  if (rememberedOrders.length === 0) return null;

  const avgEta = average(rememberedOrders.map((o) => o.deliveredInMinutes));

  // Estimate delivery fee as: total - sum(items).
  const deliveryFees = rememberedOrders.map((o) => o.total - o.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const avgDeliveryFee = average(deliveryFees) ?? 0;

  const matchingItemPrices = rememberedOrders
    .flatMap((o) => o.items.filter((i) => i.name === itemName).map((i) => i.price));
  const avgItemPrice = average(matchingItemPrices) ?? profile.preferredPriceRange.average;

  if (avgEta === null) return null;

  return {
    restaurant,
    platform: "Swiggy",
    items: [
      {
        name: itemName,
        cuisine: profile.favoriteCuisines[0]?.cuisine,
        price: Math.max(0, Math.round(avgItemPrice))
      }
    ],
    etaMinutes: Math.max(1, Math.round(avgEta)),
    deliveryFee: Math.max(0, Math.round(avgDeliveryFee)),
    available: true,
    sourceStatus: "fallback",
    sourceLabel: "History-derived estimate",
    warnings: ["Live menu/ETA/price unavailable; reconstructing from remembered behavior."]
  };
}
