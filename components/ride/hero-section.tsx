import { format } from "date-fns";
import { Sparkles } from "lucide-react";
import { StatPill } from "@/components/ride/stat-pill";
import type { LearnedPattern, RideSuggestion } from "@/lib/rides/types";

export function HeroSection({
  currentTime,
  suggestion,
  learnedPatterns
}: {
  currentTime: Date;
  suggestion: RideSuggestion;
  learnedPatterns: LearnedPattern[];
}) {
  return (
    <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-glow backdrop-blur sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-orange-100">
            <Sparkles className="h-4 w-4" />
            Proactive Ride Assistant
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Your ride is about to be late. We already did the thinking.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-orange-50/90 sm:text-lg">
            The system learned your weekday commute from Uber, Ola, and Rapido history, noticed the usual departure window is close, and adjusted for the current traffic snapshot before you asked.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <StatPill label="Current time" value={format(currentTime, "EEE, h:mm:ss a")} />
          <StatPill label="Current date" value={format(currentTime, "MMM d, yyyy")} />
          <StatPill label="Traffic delay" value={`${suggestion.traffic.delayMinutes} min`} />
          <StatPill label="Top route pattern" value={`${learnedPatterns[0]?.rideCount ?? 0} rides`} />
        </div>
      </div>
    </section>
  );
}
