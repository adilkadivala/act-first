import { orderHistory, type OrderRecord } from "@/data/orderHistory";
import type { FoodLiveSourceStatus, FoodOffer } from "@/lib/food/types";

function buildFallbackOffers(): FoodOffer[] {
  return [
    {
      restaurant: "Paradise Biryani",
      platform: "Swiggy",
      items: [
        { name: "Chicken Dum Biryani", cuisine: "Biryani", price: 320 },
        { name: "Double Ka Meetha", cuisine: "Dessert", price: 110 }
      ],
      etaMinutes: 45,
      deliveryFee: 35,
      available: true,
      sourceStatus: "fallback",
      sourceLabel: "Fixture fallback",
      warnings: ["Live Swiggy data is unavailable, so this offer comes from a saved fixture."]
    },
    {
      restaurant: "Bowl Company",
      platform: "Swiggy",
      items: [{ name: "Peri Peri Chicken Bowl", cuisine: "Healthy", price: 290 }],
      etaMinutes: 32,
      deliveryFee: 30,
      available: true,
      sourceStatus: "fallback",
      sourceLabel: "Fixture fallback",
      warnings: ["Live Swiggy data is unavailable, so this offer comes from a saved fixture."]
    },
    {
      restaurant: "Mehfil",
      platform: "Zomato",
      items: [{ name: "Chicken 65 Biryani", cuisine: "Biryani", price: 310 }],
      etaMinutes: 36,
      deliveryFee: 28,
      available: true,
      sourceStatus: "fallback",
      sourceLabel: "Fixture fallback",
      warnings: ["Zomato is only used as an optional comparison fixture in this build."]
    }
  ];
}

function dedupeWarnings(offers: FoodOffer[], extra: string[]) {
  return [...new Set([...extra, ...offers.flatMap((offer) => offer.warnings)])];
}

export async function fetchFoodPlatformData(): Promise<{
  history: OrderRecord[];
  offers: FoodOffer[];
  warnings: string[];
  liveDelayMinutes: number;
  liveSources: FoodLiveSourceStatus[];
}> {
  const fallbackOffers = buildFallbackOffers();
  const history = orderHistory;
  const swiggyOffers = fallbackOffers.filter((offer) => offer.platform === "Swiggy");
  const zomatoOffers = fallbackOffers.filter((offer) => offer.platform === "Zomato");
  const offers = [...swiggyOffers, ...zomatoOffers];
  const warnings = dedupeWarnings(offers, [
    "Founder instruction applied: this submission intentionally uses mock provider data instead of scraping live platforms."
  ]);
  const liveSources: FoodLiveSourceStatus[] = [
    {
      platform: "Swiggy",
      status: "degraded",
      accessMode: "fixture-fallback",
      purpose: "Primary food platform integration for mock history, ETA, and pricing.",
      notes: "Live scraping is intentionally disabled for this submission."
    },
    {
      platform: "Zomato",
      status: "degraded",
      accessMode: "fixture-fallback",
      purpose: "Optional comparison provider for alternatives.",
      notes: "Zomato remains a fixture-backed comparison source in this build."
    }
  ];

  return {
    history,
    offers,
    warnings,
    liveDelayMinutes: 15,
    liveSources
  };
}
