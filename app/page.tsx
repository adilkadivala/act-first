"use client";

import { ArchitectureCard } from "@/components/ride/architecture-card";
import { HeroSection } from "@/components/ride/hero-section";
import { LearnedBehaviorCard } from "@/components/ride/learned-behavior-card";
import { LoadingState } from "@/components/ride/loading-state";
import { MemoryCard } from "@/components/ride/memory-card";
import { ProviderHealthCard } from "@/components/ride/provider-health-card";
import { SuggestionCard } from "@/components/ride/suggestion-card";
import { useLiveCurrentTime } from "@/hooks/use-live-current-time";
import { useRideAssistant } from "@/hooks/use-ride-assistant";

export default function HomePage() {
  const {
    data,
    form,
    setForm,
    confirmed,
    dismissed,
    loading,
    error,
    saving,
    confirmRide,
    dismissSuggestion,
    refreshAssistant
  } = useRideAssistant();
  const liveCurrentTime = useLiveCurrentTime(data?.currentTime);

  if (loading || !data) {
    if (error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-mesh-sunrise px-4 py-6 text-slate-50 sm:px-6 lg:px-8">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-200/80">Assistant unavailable</p>
            <h1 className="mt-3 text-2xl font-semibold text-white">The ride assistant could not load.</h1>
            <p className="mt-3 text-sm text-slate-200">{error}</p>
            <button
              type="button"
              onClick={() => void refreshAssistant()}
              className="mt-6 rounded-full bg-white/90 px-5 py-2 text-sm font-medium text-slate-950 transition hover:bg-white"
            >
              Try again
            </button>
          </div>
        </main>
      );
    }

    return <LoadingState />;
  }

  const { suggestion, learnedPatterns, memory, architecture } = data;

  return (
    <main className="min-h-screen bg-mesh-sunrise px-4 py-6 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <HeroSection currentTime={liveCurrentTime} suggestion={suggestion} learnedPatterns={learnedPatterns} />

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <SuggestionCard
            suggestion={suggestion}
            form={form}
            setForm={setForm}
            confirmed={confirmed}
            dismissed={dismissed}
            saving={saving}
            currentTime={liveCurrentTime}
            onConfirm={confirmRide}
            onDismiss={() => void dismissSuggestion()}
            onRefresh={() => void refreshAssistant()}
          />

          <div className="space-y-6">
            <LearnedBehaviorCard learnedPatterns={learnedPatterns} currentTimeIso={liveCurrentTime.toISOString()} />
            <ArchitectureCard architecture={architecture} />
            <MemoryCard memory={memory} currentTime={liveCurrentTime} />
            <ProviderHealthCard integrations={suggestion.integrations} />
          </div>
        </section>
      </div>
    </main>
  );
}
