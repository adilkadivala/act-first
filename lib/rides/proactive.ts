import { addMinutes, formatISO, getDay, getHours, getMinutes, isAfter, isSameDay, subMinutes } from "date-fns";
import { getRideScenarioTime, MOCK_SCENARIO_MODE } from "@/lib/mock-scenarios";
import { learnRidePatterns } from "@/lib/rides/behavior";
import { getPlatformData, getTrafficSnapshot } from "@/lib/rides/liveData";
import { readMemory, updateCachedQuotes, type UserMemoryStore } from "@/lib/rides/memory";
import type { RideAssistantResponse, RideSuggestion } from "@/lib/rides/types";

function minutesSinceMidnight(date: Date) {
  return getHours(date) * 60 + getMinutes(date);
}

function hasConfirmedRouteToday(memory: UserMemoryStore, routeKey: string, currentTime: Date) {
  if (MOCK_SCENARIO_MODE) {
    return false;
  }
  return memory.confirmations.some(
    (confirmation) => confirmation.routeKey === routeKey && isSameDay(new Date(confirmation.confirmedAt), currentTime)
  );
}

function isWithinDepartureWindow(currentMinutes: number, averageDepartureMinutes: number) {
  return Math.abs(averageDepartureMinutes - currentMinutes) <= 30;
}

async function buildSuggestion(currentTime: Date, memory: UserMemoryStore): Promise<RideSuggestion> {
  const patterns = learnRidePatterns(memory.history, memory, currentTime);
  const todayDay = getDay(currentTime);
  const currentMinutes = minutesSinceMidnight(currentTime);

  const rankedPattern =
    patterns.find(
      (pattern) =>
        pattern.dayOfWeek === todayDay &&
        isWithinDepartureWindow(currentMinutes, pattern.averageDepartureMinutes)
    ) ?? patterns[0];

  const traffic = await getTrafficSnapshot({
    memory,
    pickup: rankedPattern.pickup,
    destination: rankedPattern.destination,
    currentTime
  });
  const { quotes, integrations, cacheableQuotes } = await getPlatformData({
    memory,
    pickup: rankedPattern.pickup,
    destination: rankedPattern.destination
  });
  if (cacheableQuotes.length > 0) {
    await updateCachedQuotes(cacheableQuotes);
  }

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
  const cooldownActive = MOCK_SCENARIO_MODE ? false : cooldownUntil ? isAfter(new Date(cooldownUntil), currentTime) : false;
  const recentDismissalCount = memory.dismissals.filter((dismissal) => dismissal.routeKey === routeKey).length;
  const dismissalPenalty = Math.min(0.35, recentDismissalCount * 0.12);
  const withinWindow = isWithinDepartureWindow(currentMinutes, rankedPattern.averageDepartureMinutes);
  const hasRideBookedToday = hasConfirmedRouteToday(memory, routeKey, currentTime);
  const baseConfidence =
    0.2 +
    Math.min(0.22, rankedPattern.recencyWeightedScore / 10) +
    (withinWindow ? 0.28 : 0) +
    (traffic.delayMinutes >= 15 ? 0.12 : traffic.delayMinutes >= 7 ? 0.06 : 0);
  const confidence = Math.max(0, Math.min(0.98, baseConfidence - dismissalPenalty - (hasRideBookedToday ? 0.4 : 0)));
  const confidenceThreshold = 0.7;
  const shouldTrigger = confidence >= confidenceThreshold && !cooldownActive && !hasRideBookedToday && withinWindow;
  const incompleteData = integrations.some((integration) => integration.status !== "live");
  const fallbackMessage = incompleteData
    ? "Some provider data is unavailable, so this suggestion mixes live, cached, and historical estimates."
    : undefined;
  const preferredQuote =
    quotes.find((quote) => quote.platform === rankedPattern.preferredPlatform && quote.rideType === rankedPattern.preferredRideType) ??
    [...quotes].sort((a, b) => a.price - b.price)[0];

  const reasons: string[] = [];
  if (withinWindow) {
    reasons.push("The current time is inside your usual departure window for this route.");
  } else {
    reasons.push("This route is your strongest learned pattern for the current day, even though the window is not exact.");
  }
  if (traffic.delayMinutes >= 7) {
    reasons.push("Traffic is slower than your baseline, so the system recommends leaving earlier.");
  }
  if (cooldownActive) {
    reasons.push("A recent dismissal is still cooling down this route.");
  }
  if (hasRideBookedToday) {
    reasons.push("You already confirmed a ride for this route today, so another nudge is suppressed.");
  }
  if (!shouldTrigger && !cooldownActive && !hasRideBookedToday && !withinWindow) {
    reasons.push("The assistant is holding back because the departure window is not close enough yet.");
  }

  return {
    reason: shouldTrigger
      ? `You usually leave for ${rankedPattern.destination} around now${traffic.delayMinutes > 0 ? `, and traffic is ${traffic.delayMinutes} minutes above normal` : ""}.`
      : "The assistant learned your routine but is holding this suggestion until the timing and confidence are strong enough.",
    confidence: Number(confidence.toFixed(2)),
    shouldTrigger,
    suggestedLeaveAt: formatISO(recommendedLeaveAt),
    targetDepartureWindowStart: formatISO(departureWindowStart),
    targetDepartureWindowEnd: formatISO(departureWindowEnd),
    pickup: rankedPattern.pickup,
    destination: rankedPattern.destination,
    preferredPlatform: preferredQuote?.platform ?? rankedPattern.preferredPlatform,
    preferredRideType: preferredQuote?.rideType ?? rankedPattern.preferredRideType,
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
        "traffic delay versus route baseline",
        "whether a ride is already confirmed today",
        "recent dismissals and cooldown"
      ],
      cooldownActive,
      cooldownUntil,
      confidenceThreshold,
      confidenceScore: Number(confidence.toFixed(2)),
      matchedPatternScore: rankedPattern.recencyWeightedScore,
      dismissalPenalty: Number(dismissalPenalty.toFixed(2)),
      reasons
    }
  };
}

export async function getRideAssistantState(currentTime = MOCK_SCENARIO_MODE ? getRideScenarioTime() : new Date()): Promise<RideAssistantResponse> {
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
        "User edits and confirmations are stored so preferred pickup, destination, and timing can adapt."
      ]
    },
    architecture: {
      triggerLogic: [
        "Watch time-of-day, day-of-week routines, departure windows, traffic delay, and confirmed rides for today.",
        "Only trigger when confidence clears the threshold and the cooldown is not active.",
        "Suppress repeated nudges after a dismissal for 90 minutes on the same route."
      ],
      memoryModel: [
        "Persist trips, dismissals, confirmations, edits, cooldowns, and cached provider quotes.",
        "Use recency decay plus confirmation and dismissal feedback to rank likely destinations.",
        "Keep edited pickup, destination, and time changes to improve later defaults."
      ],
      failureHandling: [
        "This submission intentionally uses mock, cached, and history-derived provider data rather than scraping live platforms.",
        "If mock provider data is partial, the UI still falls back to recent cached quotes or historical estimates without breaking the flow.",
        "Each surfaced quote carries a confidence label so the user can see whether it is cached or estimated."
      ]
    }
  };
}
