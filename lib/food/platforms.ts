import { orderHistory, type OrderRecord } from "@/data/orderHistory";
import type { FoodLiveSourceStatus, FoodOffer } from "@/lib/food/types";

function buildMockOffers(): FoodOffer[] {
  return [
    {
      restaurant: "Paradise Biryani",
      platform: "Swiggy",
      items: [
        { name: "Chicken Dum Biryani", cuisine: "Biryani", price: 320 },
        { name: "Double Ka Meetha", cuisine: "Dessert", price: 110 }
      ],
      etaMinutes: 38,
      deliveryFee: 35,
      available: true,
      sourceStatus: "fallback",
      sourceLabel: "Mock data",
      warnings: []
    },
    {
      restaurant: "Bowl Company",
      platform: "Swiggy",
      items: [{ name: "Peri Peri Chicken Bowl", cuisine: "Healthy", price: 290 }],
      etaMinutes: 30,
      deliveryFee: 30,
      available: true,
      sourceStatus: "fallback",
      sourceLabel: "Mock data",
      warnings: []
    },
    {
      restaurant: "Mehfil",
      platform: "Zomato",
      items: [{ name: "Chicken 65 Biryani", cuisine: "Biryani", price: 310 }],
      etaMinutes: 34,
      deliveryFee: 28,
      available: true,
      sourceStatus: "fallback",
      sourceLabel: "Mock data",
      warnings: []
    }
  ];
}

export async function fetchFoodPlatformData(): Promise<{
  history: OrderRecord[];
  offers: FoodOffer[];
  warnings: string[];
  liveDelayMinutes: number;
  liveSources: FoodLiveSourceStatus[];
}> {
  const history = orderHistory;
  const offers = buildMockOffers();
  const warnings = offers.flatMap((offer) => offer.warnings);
  const liveSources: FoodLiveSourceStatus[] = [
    {
      platform: "Swiggy",
      status: "degraded",
      accessMode: "fixture-fallback",
      purpose: "Primary food platform integration.",
      notes: "Using mock snapshot data. Browser scraping is disabled."
    },
    {
      platform: "Zomato",
      status: "degraded",
      accessMode: "fixture-fallback",
      purpose: "Optional comparison provider for alternatives.",
      notes: "Using mock snapshot data."
    }
  ];

  return {
    history,
    offers,
    warnings,
    liveDelayMinutes: 6,
    liveSources
  };
}
