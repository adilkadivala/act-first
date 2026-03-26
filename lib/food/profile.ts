import type { FoodMemoryStore, FoodProfile } from "@/lib/food/types";
import { getDayKey, getMinutesOfDay, minutesToClock } from "@/lib/food/time";

function decayWeight(index: number) {
  return Math.max(0.45, 1 - index * 0.08);
}

export function buildFoodProfile(memory: FoodMemoryStore): FoodProfile {
  const sorted = [...memory.history].sort((a, b) => b.orderedAt.localeCompare(a.orderedAt));
  const itemScores = new Map<string, number>();
  const cuisineScores = new Map<string, number>();
  const restaurantScores = new Map<string, number>();
  const totals = sorted.map((order) => order.total);

  sorted.forEach((order, index) => {
    const baseWeight = decayWeight(index);
    const restaurantBoost = memory.feedback.restaurantAffinity[order.restaurant] ?? 0;

    restaurantScores.set(order.restaurant, (restaurantScores.get(order.restaurant) ?? 0) + baseWeight + restaurantBoost);

    order.items.forEach((item) => {
      const cuisineBoost = memory.feedback.preferredCuisines[item.cuisine] ?? 0;
      itemScores.set(item.name, (itemScores.get(item.name) ?? 0) + baseWeight * item.quantity);
      cuisineScores.set(item.cuisine, (cuisineScores.get(item.cuisine) ?? 0) + baseWeight + cuisineBoost);
    });
  });

  memory.edits.forEach((edit) => {
    if (edit.field === "restaurant") {
      restaurantScores.set(edit.to, (restaurantScores.get(edit.to) ?? 0) + 0.75);
    }

    if (edit.field === "items") {
      edit.to
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((value) => {
          itemScores.set(value, (itemScores.get(value) ?? 0) + 0.5);
        });
    }
  });

  const orderTimes = sorted.map((order) => getMinutesOfDay(new Date(order.orderedAt)));
  const averageTime = Math.round(orderTimes.reduce((sum, value) => sum + value, 0) / orderTimes.length);

  const cuisinesByDay = new Map<string, Map<string, number>>();
  const dayPreference: Record<string, string> = {};

  sorted.forEach((order) => {
    const day = getDayKey(new Date(order.orderedAt));
    const map = cuisinesByDay.get(day) ?? new Map<string, number>();
    order.items.forEach((item) => {
      map.set(item.cuisine, (map.get(item.cuisine) ?? 0) + item.quantity);
    });
    cuisinesByDay.set(day, map);
  });

  cuisinesByDay.forEach((map, day) => {
    const topCuisine = [...map.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topCuisine) {
      dayPreference[day] = topCuisine[0];
    }
  });

  return {
    frequentItems: toSortedArray(itemScores, "name"),
    favoriteCuisines: toSortedArray(cuisineScores, "cuisine"),
    restaurants: toSortedArray(restaurantScores, "restaurant"),
    preferredPriceRange: {
      min: Math.min(...totals),
      max: Math.max(...totals),
      average: Math.round(totals.reduce((sum, value) => sum + value, 0) / totals.length)
    },
    schedule: {
      usualWindowStart: minutesToClock(averageTime - 20),
      usualWindowEnd: minutesToClock(averageTime + 20),
      dayPreference
    }
  };
}

function toSortedArray(map: Map<string, number>, key: "name" | "cuisine" | "restaurant") {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([value, score]) => ({ [key]: value, score: Number(score.toFixed(2)) })) as Array<{
      [K in typeof key]: string;
    } & { score: number }>;
}
