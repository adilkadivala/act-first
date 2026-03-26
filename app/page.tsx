"use client";

import { useState } from "react";
import { FoodAssistantCard } from "@/components/food/food-assistant-card";
import { ArchitectureCard } from "@/components/ride/architecture-card";
import { HeroSection } from "@/components/ride/hero-section";
import { LearnedBehaviorCard } from "@/components/ride/learned-behavior-card";
import { LoadingState } from "@/components/ride/loading-state";
import { MemoryCard } from "@/components/ride/memory-card";
import { ProviderHealthCard } from "@/components/ride/provider-health-card";
import { SuggestionCard } from "@/components/ride/suggestion-card";
import { useLiveCurrentTime } from "@/hooks/use-live-current-time";
import { useRideAssistant } from "@/hooks/use-ride-assistant";

type TabKey = "ride" | "food";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("ride");
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
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-amber-200/80">Assignment submission</p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight text-white">
              Proactive Assistant
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-200">
              Switch between Ride and Food assistants using tabs. Each assistant now runs on stable mock-backed data for
              demo consistency.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-1 text-sm leading-6 text-slate-200 backdrop-blur">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("ride")}
                className={`rounded-[1rem] px-4 py-2 font-medium transition ${
                  activeTab === "ride" ? "bg-white text-slate-950" : "text-slate-200 hover:bg-white/10"
                }`}
              >
                Ride
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("food")}
                className={`rounded-[1rem] px-4 py-2 font-medium transition ${
                  activeTab === "food" ? "bg-white text-slate-950" : "text-slate-200 hover:bg-white/10"
                }`}
              >
                Food
              </button>
            </div>
          </div>
        </div>

        {activeTab === "ride" ? (
          <>
            <section className="mb-10">
              <HeroSection currentTime={liveCurrentTime} suggestion={suggestion} learnedPatterns={learnedPatterns} />
            </section>

            <section className="mb-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
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
          </>
        ) : (
          <section className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-amber-200/80">Food assistant</p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
                Smart dinner suggestions
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
                Learns dinner habits and surfaces proactive suggestions using mock provider data.
              </p>
            </div>
            <FoodAssistantCard />
          </section>
        )}
      </div>
    </main>
  );
}
