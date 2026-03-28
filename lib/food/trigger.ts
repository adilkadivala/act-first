import type { FoodMemoryStore, FoodProfile, FoodTriggerDecision } from "@/lib/food/types";
import { MOCK_SCENARIO_MODE } from "@/lib/mock-scenarios";
import { getDayKey, getMinutesOfDay, minutesBetween, parseClock } from "@/lib/food/time";

export function evaluateFoodTrigger(
  profile: FoodProfile,
  memory: FoodMemoryStore,
  now: Date,
  hasOrderToday: boolean,
  liveDelayMinutes: number
): FoodTriggerDecision {
  const day = getDayKey(now);
  const minutesNow = getMinutesOfDay(now);
  const windowStart = parseClock(profile.schedule.usualWindowStart);
  const windowEnd = parseClock(profile.schedule.usualWindowEnd);
  const withinWindow = minutesNow >= windowStart - 15 && minutesNow <= windowEnd;
  const noOrderYetInWindow = !hasOrderToday && minutesNow >= windowStart - 15;
  const cooldownActive =
    !MOCK_SCENARIO_MODE &&
    memory.lastSuggestedAt !== undefined &&
    minutesBetween(now, new Date(memory.lastSuggestedAt)) < 120 &&
    new Date(memory.lastSuggestedAt).getTime() <= now.getTime();
  const recentDismissal =
    !MOCK_SCENARIO_MODE &&
    memory.dismissals.some(
      (dismissal) =>
        new Date(dismissal.timestamp).getTime() <= now.getTime() &&
        minutesBetween(now, new Date(dismissal.timestamp)) < 180
    );

  const reasons: string[] = [];
  if (withinWindow) {
    reasons.push(`You usually order dinner between ${profile.schedule.usualWindowStart} and ${profile.schedule.usualWindowEnd}.`);
  }
  if (day === "Friday" && profile.schedule.dayPreference.Friday === "Biryani") {
    reasons.push("Fridays trend strongly toward biryani in your recent history.");
  }
  if (liveDelayMinutes >= 10) {
    reasons.push(`Current delivery ETAs are ${liveDelayMinutes} minutes slower than your baseline, so ordering earlier helps.`);
  }
  if (noOrderYetInWindow) {
    reasons.push("No dinner order has been placed yet even though the usual ordering window is opening.");
  }

  let confidence = 0;
  if (withinWindow) confidence += 0.38;
  if (day === "Friday") confidence += 0.24;
  if (liveDelayMinutes >= 10) confidence += 0.2;
  if (noOrderYetInWindow) confidence += 0.15;
  if (recentDismissal) confidence -= 0.18;
  if (cooldownActive) confidence -= 0.45;
  confidence = Math.max(0, Math.min(1, confidence));

  return {
    shouldSuggest: confidence >= 0.45 && !cooldownActive,
    confidence: Number(confidence.toFixed(2)),
    reasons,
    cooldownActive,
    noOrderYetInWindow
  };
}
