import type { RideHistoryEntry, RidePlatform, RideType } from "@/data/rideHistory";

export interface LearnedPattern {
  pickup: string;
  destination: string;
  dayOfWeek: number;
  timeBucket: "morning" | "afternoon" | "evening";
  rideCount: number;
  averageDepartureMinutes: number;
  preferredPlatform: RidePlatform;
  preferredRideType: RideType;
  score: number;
  recencyWeightedScore: number;
  recentEdits: number;
  recentDismissals: number;
}

export interface PlatformQuote {
  platform: RidePlatform;
  rideType: RideType;
  etaMinutes: number;
  pickupWaitMinutes: number;
  price: number;
  surgeMultiplier: number;
  confidence: "live" | "estimated" | "cached";
  sourceLabel: string;
}

export interface TrafficSnapshot {
  routeKey: string;
  averageDurationMinutes: number;
  liveDurationMinutes: number;
  delayMinutes: number;
  status: "clear" | "moderate" | "heavy";
  capturedAt: string;
}

export interface PlatformIntegrationStatus {
  platform: RidePlatform;
  status: "live" | "partial" | "fallback" | "unavailable";
  message: string;
  quote?: PlatformQuote;
  fallbackUsed: boolean;
}

export interface TriggerDiagnostics {
  watchedSignals: string[];
  cooldownActive: boolean;
  cooldownUntil?: string;
  confidenceThreshold: number;
  confidenceScore: number;
  matchedPatternScore: number;
  dismissalPenalty: number;
  reasons: string[];
}

export interface RideSuggestion {
  reason: string;
  confidence: number;
  shouldTrigger: boolean;
  suggestedLeaveAt: string;
  targetDepartureWindowStart: string;
  targetDepartureWindowEnd: string;
  pickup: string;
  destination: string;
  preferredPlatform: RidePlatform;
  preferredRideType: RideType;
  traffic: TrafficSnapshot;
  quotes: PlatformQuote[];
  integrations: PlatformIntegrationStatus[];
  incompleteData: boolean;
  fallbackMessage?: string;
  editableFields: Array<"pickup" | "destination" | "suggestedLeaveAt">;
  triggerDiagnostics: TriggerDiagnostics;
}

export interface MemorySummary {
  storedTrips: number;
  storedDismissals: number;
  storedConfirmations: number;
  storedEdits: number;
  lastDismissedAt?: string;
  lastConfirmedAt?: string;
  learningNotes: string[];
}

export interface ArchitectureSummary {
  triggerLogic: string[];
  memoryModel: string[];
  failureHandling: string[];
}

export interface RideAssistantResponse {
  generatedAt: string;
  currentTime: string;
  history: RideHistoryEntry[];
  learnedPatterns: LearnedPattern[];
  suggestion: RideSuggestion;
  memory: MemorySummary;
  architecture: ArchitectureSummary;
}

export interface RideConfirmationPayload {
  platform: RidePlatform;
  rideType: RideType;
  pickup: string;
  destination: string;
  suggestedLeaveAt: string;
}

export interface RideDismissalPayload {
  pickup: string;
  destination: string;
  suggestedLeaveAt: string;
  reason?: string;
}
