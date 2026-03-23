import { differenceInDays, getDay, getHours, getMinutes } from "date-fns";
import { rideHistory, type RideHistoryEntry, type RidePlatform, type RideType } from "@/data/rideHistory";
import type { UserMemoryStore } from "@/lib/rides/memory";
import type { LearnedPattern } from "@/lib/rides/types";

function timeBucketFor(date: Date): LearnedPattern["timeBucket"] {
  const hours = getHours(date);
  if (hours < 12) return "morning";
  if (hours < 17) return "afternoon";
  return "evening";
}

function minutesSinceMidnight(date: Date) {
  return getHours(date) * 60 + getMinutes(date);
}

function mostFrequent<T extends string>(values: T[]): T {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as T;
}

function weightedMostFrequent<T extends string>(entries: Array<{ value: T; weight: number }>): T {
  const counts = entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.value] = (acc[entry.value] ?? 0) + entry.weight;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as T;
}

function recencyWeight(pickupAt: string, now: Date) {
  const daysAgo = Math.max(0, differenceInDays(now, new Date(pickupAt)));
  return Math.exp(-daysAgo / 21);
}

export function learnRidePatterns(
  history: RideHistoryEntry[] = rideHistory,
  memory?: UserMemoryStore,
  now = new Date()
): LearnedPattern[] {
  const grouped = new Map<string, RideHistoryEntry[]>();

  for (const entry of history) {
    const pickupDate = new Date(entry.pickupAt);
    const key = [
      entry.pickup,
      entry.destination,
      getDay(pickupDate),
      timeBucketFor(pickupDate)
    ].join("|");

    const existing = grouped.get(key) ?? [];
    existing.push(entry);
    grouped.set(key, existing);
  }

  return [...grouped.entries()]
    .map(([key, entries]) => {
      const [pickup, destination, dayOfWeek, timeBucket] = key.split("|");
      const routeKey = `${pickup}->${destination}`;
      const weightedEntries = entries.map((entry) => ({
        entry,
        weight: recencyWeight(entry.pickupAt, now)
      }));
      const weightedDeparture =
        weightedEntries.reduce(
          (total, current) => total + minutesSinceMidnight(new Date(current.entry.pickupAt)) * current.weight,
          0
        ) / weightedEntries.reduce((total, current) => total + current.weight, 0);
      const recentEdits = memory?.edits.filter((edit) => edit.routeKey === routeKey).length ?? 0;
      const recentDismissals = memory?.dismissals.filter((dismissal) => dismissal.routeKey === routeKey).length ?? 0;
      const confirmationBoost =
        memory?.confirmations.filter((confirmation) => confirmation.routeKey === routeKey).length ?? 0;
      const recencyWeightedScore =
        weightedEntries.reduce((total, current) => total + current.weight, 0) +
        confirmationBoost * 0.3 -
        recentDismissals * 0.25;

      return {
        pickup,
        destination,
        dayOfWeek: Number(dayOfWeek),
        timeBucket: timeBucket as LearnedPattern["timeBucket"],
        rideCount: entries.length,
        averageDepartureMinutes: Math.round(weightedDeparture),
        preferredPlatform:
          weightedMostFrequent(
            entries.map((entry) => ({
              value: entry.platform as RidePlatform,
              weight: recencyWeight(entry.pickupAt, now)
            }))
          ) ?? mostFrequent(entries.map((entry) => entry.platform as RidePlatform)),
        preferredRideType:
          weightedMostFrequent(
            entries.map((entry) => ({
              value: entry.rideType as RideType,
              weight: recencyWeight(entry.pickupAt, now)
            }))
          ) ?? mostFrequent(entries.map((entry) => entry.rideType as RideType)),
        score: Number((entries.length + confirmationBoost * 0.5 - recentDismissals * 0.35).toFixed(2)),
        recencyWeightedScore: Number(recencyWeightedScore.toFixed(2)),
        recentEdits,
        recentDismissals
      };
    })
    .sort((a, b) => b.recencyWeightedScore - a.recencyWeightedScore);
}
