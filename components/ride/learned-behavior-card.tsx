import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPatternTime } from "@/lib/rides/date-time";
import type { LearnedPattern } from "@/lib/rides/types";

export function LearnedBehaviorCard({
  learnedPatterns,
  currentTimeIso
}: {
  learnedPatterns: LearnedPattern[];
  currentTimeIso: string;
}) {
  return (
    <Card className="border-white/30 bg-white/90 text-slate-900">
      <CardHeader>
        <CardTitle>Learned behavior</CardTitle>
        <CardDescription>Frequent destinations, usual departure windows, and preferred ride modes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {learnedPatterns.slice(0, 4).map((pattern) => (
          <div
            key={`${pattern.pickup}-${pattern.destination}-${pattern.dayOfWeek}`}
            className="rounded-[1.25rem] bg-amber-50 p-4"
          >
            <p className="font-semibold">{pattern.destination}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {pattern.rideCount} rides • departs around {formatPatternTime(currentTimeIso, pattern.averageDepartureMinutes)}
            </p>
            <p className="mt-2 text-sm">
              Prefers {pattern.preferredPlatform} {pattern.preferredRideType}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
