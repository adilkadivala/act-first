import { readFoodMemory, recordFoodConfirmation, recordFoodDismissal, recordFoodEdit, writeFoodMemory } from "@/lib/food/memory";
import { getFoodScenarioTime, MOCK_SCENARIO_MODE } from "@/lib/mock-scenarios";
import { fetchFoodPlatformData } from "@/lib/food/platforms";
import { buildFoodProfile } from "@/lib/food/profile";
import { evaluateFoodTrigger } from "@/lib/food/trigger";
import { formatLocalDate, getMinutesOfDay, minutesToClock } from "@/lib/food/time";
import type { FoodAssistantResponse, FoodOffer, FoodMemoryStore } from "@/lib/food/types";

export async function getFoodAssistantState(currentTime = MOCK_SCENARIO_MODE ? getFoodScenarioTime() : new Date()): Promise<FoodAssistantResponse> {
  const memory = await readFoodMemory();
  const platformData = await fetchFoodPlatformData();

  if (platformData.history.length > 0) {
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

  const preferred = ranked[0]?.offer ?? buildFallbackOffer(profile, memory);
  const preferredEta = preferred?.etaMinutes ?? Number.POSITIVE_INFINITY;
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

  const suggestion =
    preferred && triggerEval.shouldSuggest
      ? {
          restaurant: preferred.restaurant,
          platform: preferred.platform,
          items: preferred.items.map((item) => ({ name: item.name, price: item.price, quantity: 1 })),
          etaMinutes: preferred.etaMinutes,
          scheduledFor: minutesToClock(getMinutesOfDay(currentTime) + preferred.etaMinutes),
          subtotal: preferred.items.reduce((sum, item) => sum + item.price, 0),
          deliveryFee: preferred.deliveryFee,
          total: preferred.items.reduce((sum, item) => sum + item.price, 0) + preferred.deliveryFee,
          why: [
            ...triggerEval.reasons,
            `${preferred.restaurant} best matches your recent restaurant and cuisine preferences.`,
            preferred.sourceStatus === "fallback"
              ? "Current ETA and pricing are coming from the mock provider snapshot used in this submission."
              : "Current ETA and pricing are coming from a non-live fallback source."
          ],
          sourceStatus: preferred.sourceStatus,
          status: "ready" as const
        }
      : null;

  if (suggestion && !MOCK_SCENARIO_MODE) {
    memory.lastSuggestedAt = currentTime.toISOString();
    await writeFoodMemory(memory);
  }

  return {
    suggestionId: `food-${currentTime.toISOString()}`,
    generatedAt: new Date().toISOString(),
    currentTime: currentTime.toISOString(),
    decision: triggerEval,
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

export async function confirmFoodSuggestion(input: {
  suggestionId: string;
  restaurant: string;
  items: string[];
  scheduledFor: string;
}) {
  return recordFoodConfirmation(input);
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

function buildFallbackOffer(profile: FoodAssistantResponse["profile"], memory: FoodMemoryStore): FoodOffer | null {
  const restaurant = profile.restaurants[0]?.restaurant;
  const itemName = profile.frequentItems[0]?.name;
  if (!restaurant || !itemName) return null;

  const rememberedOrders = memory.history.filter((o) => o.restaurant === restaurant);
  if (rememberedOrders.length === 0) return null;

  const avgEta = average(rememberedOrders.map((o) => o.deliveredInMinutes));
  const deliveryFees = rememberedOrders.map((o) => o.total - o.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const avgDeliveryFee = average(deliveryFees) ?? 0;
  const matchingItemPrices = rememberedOrders.flatMap((o) => o.items.filter((i) => i.name === itemName).map((i) => i.price));
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
    warnings: ["Live menu, ETA, or price data is unavailable; this suggestion is reconstructed from remembered behavior."]
  };
}
