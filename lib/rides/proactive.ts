import { addMinutes, formatISO, getDay, getHours, getMinutes, isAfter, isWithinInterval, subMinutes } from "date-fns";
import { learnRidePatterns } from "@/lib/rides/behavior";
import { getPlatformData, getTrafficSnapshot } from "@/lib/rides/liveData";
import { readMemory, updateCachedQuotes, type UserMemoryStore } from "@/lib/rides/memory";
import type { RideAssistantResponse, RideSuggestion } from "@/lib/rides/types";

function minutesSinceMidnight(date: Date) {
  return getHours(date) * 60 + getMinutes(date);
}

async function buildSuggestion(currentTime: Date, memory: UserMemoryStore): Promise<RideSuggestion> {
  const patterns = learnRidePatterns(memory.history, memory, currentTime);
  const traffic = getTrafficSnapshot();
  const { quotes, integrations, cacheableQuotes } = await getPlatformData(memory);
  if (cacheableQuotes.length > 0) {
    await updateCachedQuotes(cacheableQuotes);
  }
  const todayDay = getDay(currentTime);
  const currentMinutes = minutesSinceMidnight(currentTime);

  const rankedPattern =
    patterns.find(
      (pattern) =>
        pattern.dayOfWeek === todayDay &&
        pattern.timeBucket === "morning" &&
        Math.abs(pattern.averageDepartureMinutes - currentMinutes) <= 30
    ) ?? patterns[0];

  const targetDeparture = new Date(currentTime);
  targetDeparture.setHours(
    Math.floor(rankedPattern.averageDepartureMinutes / 60),
    rankedPattern.averageDepartureMinutes % 60,
    0,
    0
  );

  const recommendedLeaveAt = subMinutes(targetDeparture, traffic.delayMinutes);
  const departureWindowStart = subMinutes(targetDeparture, 10);
  const departureWindowEnd = addMinutes(targetDeparture, 10);
  const routeKey = `${rankedPattern.pickup}->${rankedPattern.destination}`;
  const cooldownUntil = memory.cooldowns[routeKey];
  const cooldownActive = cooldownUntil ? isAfter(new Date(cooldownUntil), currentTime) : false;
  const recentDismissalCount = memory.dismissals.filter((dismissal) => dismissal.routeKey === routeKey).length;
  const dismissalPenalty = Math.min(0.35, recentDismissalCount * 0.12);
  const baseConfidence = 0.62 + Math.min(0.22, rankedPattern.recencyWeightedScore / 10) + (traffic.delayMinutes >= 15 ? 0.12 : 0);
  const confidence = Math.max(0, Math.min(0.98, baseConfidence - dismissalPenalty));
  const confidenceThreshold = 0.7;
  const shouldTrigger =
    isWithinInterval(currentTime, {
      start: subMinutes(targetDeparture, 15),
      end: departureWindowEnd
    }) &&
    !cooldownActive &&
    confidence >= confidenceThreshold &&
    !memory.history.some((entry) => {
      const pickup = new Date(entry.pickupAt);
      return pickup.toDateString() === currentTime.toDateString();
    });
  const incompleteData = integrations.some((integration) => integration.status !== "live");
  const fallbackMessage = incompleteData
    ? "Some platform data is partial or cached. The assistant still recommends the best available option and labels confidence per provider."
    : undefined;

  return {
    reason:
      "Weekday morning commute detected. Traffic is 20 minutes above the usual route average and no ride has been booked yet.",
    confidence: Number(confidence.toFixed(2)),
    shouldTrigger,
    suggestedLeaveAt: formatISO(recommendedLeaveAt),
    targetDepartureWindowStart: formatISO(departureWindowStart),
    targetDepartureWindowEnd: formatISO(departureWindowEnd),
    pickup: rankedPattern.pickup,
    destination: rankedPattern.destination,
    preferredPlatform: rankedPattern.preferredPlatform,
    preferredRideType: rankedPattern.preferredRideType,
    traffic,
    quotes,
    integrations,
    incompleteData,
    fallbackMessage,
    editableFields: ["pickup", "destination", "suggestedLeaveAt"],
    triggerDiagnostics: {
      watchedSignals: [
        "weekday and time-of-day commute pattern",
        "departure window approaching",
        "live traffic delay",
        "whether a ride is already booked today",
        "recent dismissals and cooldown"
      ],
      cooldownActive,
      cooldownUntil,
      confidenceThreshold,
      confidenceScore: Number(confidence.toFixed(2)),
      matchedPatternScore: rankedPattern.recencyWeightedScore,
      dismissalPenalty: Number(dismissalPenalty.toFixed(2)),
      reasons: [
        "The top morning route has the highest recency-weighted score.",
        "Traffic is significantly above average, so the leave time is adjusted earlier.",
        cooldownActive
          ? "A recent dismissal is suppressing this suggestion until the cooldown expires."
          : "No active cooldown is suppressing the suggestion."
      ]
    }
  };
}

export async function getRideAssistantState(
  currentTime = new Date()
): Promise<RideAssistantResponse> {
  const memory = await readMemory();
  const learnedPatterns = learnRidePatterns(memory.history, memory, currentTime);
  const suggestion = await buildSuggestion(currentTime, memory);
  return {
    generatedAt: new Date().toISOString(),
    currentTime: currentTime.toISOString(),
    history: memory.history,
    learnedPatterns,
    suggestion,
    memory: {
      storedTrips: memory.history.length,
      storedDismissals: memory.dismissals.length,
      storedConfirmations: memory.confirmations.length,
      storedEdits: memory.edits.length,
      lastDismissedAt: memory.dismissals[0]?.dismissedAt,
      lastConfirmedAt: memory.confirmations[0]?.confirmedAt,
      learningNotes: [
        "Trip patterns are frequency-weighted and recency-decayed so newer routines matter more.",
        "Dismissals create temporary cooldowns and reduce route confidence.",
        "User edits are stored and can be replayed into future suggestions."
      ]
    },
    architecture: {
      triggerLogic: [
        "Watch time-of-day, weekday routines, departure windows, traffic, and existing bookings.",
        "Only trigger when confidence clears the threshold and the cooldown is not active.",
        "Suppress repeated nudges after a dismissal for 90 minutes on the same route."
      ],
      memoryModel: [
        "Persist trips, dismissals, confirmations, edits, cooldowns, and cached provider quotes.",
        "Use recency decay plus confirmation and dismissal feedback to rank likely destinations.",
        "Keep edited pickup, destination, and time changes to improve later defaults."
      ],
      failureHandling: [
        "Uber is integrated through an automation adapter that can read browser-scraped fare, ETA, and surge data.",
        "If the scraper fails, changes structure, or is not configured, the UI falls back to cached or sample data without breaking the suggestion flow.",
        "Every surfaced quote carries a confidence label so the user can see whether it is live, estimated, or cached."
      ]
    }
  };
}
