import type { FoodPlatform, OrderRecord } from "@/data/orderHistory";

export interface FoodMemoryStore {
  history: OrderRecord[];
  lastSuggestedAt?: string;
  lastConfirmedAt?: string;
  dismissals: Array<{
    suggestionId: string;
    timestamp: string;
    reason: string;
  }>;
  edits: Array<{
    suggestionId: string;
    timestamp: string;
    field: "restaurant" | "items" | "scheduledFor";
    from: string;
    to: string;
  }>;
  feedback: {
    preferredCuisines: Record<string, number>;
    restaurantAffinity: Record<string, number>;
  };
}

export interface FoodOffer {
  restaurant: string;
  platform: FoodPlatform;
  items: Array<{ name: string; cuisine?: string; price: number }>;
  etaMinutes: number;
  deliveryFee: number;
  available: boolean;
  sourceStatus: "live" | "partial" | "fallback";
  sourceLabel: string;
  warnings: string[];
}

export interface FoodProfile {
  frequentItems: Array<{ name: string; score: number }>;
  favoriteCuisines: Array<{ cuisine: string; score: number }>;
  restaurants: Array<{ restaurant: string; score: number }>;
  preferredPriceRange: {
    min: number;
    max: number;
    average: number;
  };
  schedule: {
    usualWindowStart: string;
    usualWindowEnd: string;
    dayPreference: Record<string, string>;
  };
}

export interface FoodTriggerDecision {
  shouldSuggest: boolean;
  confidence: number;
  reasons: string[];
  cooldownActive: boolean;
  noOrderYetInWindow: boolean;
}

export interface FoodLiveSourceStatus {
  platform: FoodPlatform;
  status: "connected" | "degraded" | "down";
  accessMode: "browser-automation" | "fixture-fallback" | "not-enabled";
  purpose: string;
  notes: string;
}

export interface FoodSuggestion {
  restaurant: string;
  platform: FoodPlatform;
  items: Array<{ name: string; price: number; quantity: number }>;
  etaMinutes: number;
  scheduledFor: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  why: string[];
  sourceStatus: "live" | "partial" | "fallback";
  status: "ready" | "confirmed";
}

export interface FoodAssistantResponse {
  suggestionId: string;
  generatedAt: string;
  currentTime: string;
  decision: FoodTriggerDecision;
  profile: FoodProfile;
  suggestion: FoodSuggestion | null;
  alternatives: Array<{
    restaurant: string;
    platform: FoodPlatform;
    etaMinutes: number;
    total: number;
    reason: string;
  }>;
  liveDataHealth: {
    complete: boolean;
    warnings: string[];
  };
  integrations: {
    primary: FoodPlatform;
    optional: FoodPlatform[];
    liveSources: FoodLiveSourceStatus[];
  };
}
