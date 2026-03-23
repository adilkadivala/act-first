import type { Dispatch, SetStateAction } from "react";
import { format } from "date-fns";
import {
  AlarmClockCheck,
  ArrowRight,
  Bike,
  CarTaxiFront,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Info,
  MapPin,
  TrafficCone
} from "lucide-react";
import type { RideFormState } from "@/hooks/use-ride-assistant";
import { StatPill } from "@/components/ride/stat-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RideSuggestion } from "@/lib/rides/types";

export function SuggestionCard({
  suggestion,
  form,
  setForm,
  confirmed,
  dismissed,
  saving,
  currentTime,
  onConfirm,
  onDismiss,
  onRefresh
}: {
  suggestion: RideSuggestion;
  form: RideFormState;
  setForm: Dispatch<SetStateAction<RideFormState>>;
  confirmed: string | null;
  dismissed: boolean;
  saving: boolean;
  currentTime: Date;
  onConfirm: (platform: string, rideType: string) => void;
  onDismiss: () => void;
  onRefresh: () => void;
}) {
  const bestQuote = [...suggestion.quotes].sort((a, b) => a.etaMinutes - b.etaMinutes)[0];

  return (
    <Card className="border-white/30 bg-white/90 text-slate-900 h-fit">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Suggested next action</CardTitle>
            <CardDescription className="mt-2 text-base">{suggestion.reason}</CardDescription>
          </div>
          {suggestion.shouldTrigger ? (
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
              Trigger now
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {dismissed ? (
          <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Suggestion dismissed. A 90 minute cooldown now prevents repeat nudges for this route.
            <button className="ml-2 font-semibold underline" onClick={onRefresh}>
              Refresh state
            </button>
          </div>
        ) : null}

        {suggestion.incompleteData ? (
          <div className="rounded-[1.25rem] border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{suggestion.fallbackMessage}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 rounded-[1.5rem] bg-amber-50 p-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-amber-700">Origin</p>
            <input
              className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-lg font-semibold"
              value={form.pickup}
              onChange={(event) => setForm((current) => ({ ...current, pickup: event.target.value }))}
            />
          </div>
          <ArrowRight className="mx-auto h-5 w-5 text-amber-500" />
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-amber-700">Destination</p>
            <input
              className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-lg font-semibold"
              value={form.destination}
              onChange={(event) => setForm((current) => ({ ...current, destination: event.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border bg-white p-5">
            <AlarmClockCheck className="mb-3 h-5 w-5 text-orange-500" />
            <p className="text-sm text-muted-foreground">Recommended departure</p>
            <input
              type="time"
              className="mt-1 rounded-xl border px-3 py-2 text-2xl font-semibold"
              value={form.suggestedLeaveAt}
              onChange={(event) => setForm((current) => ({ ...current, suggestedLeaveAt: event.target.value }))}
            />
            <p className="mt-2 text-sm text-emerald-700">Leave early to offset heavy traffic.</p>
          </div>
          <div className="rounded-[1.5rem] border bg-white p-5">
            <TrafficCone className="mb-3 h-5 w-5 text-orange-500" />
            <p className="text-sm text-muted-foreground">Live route duration</p>
            <p className="mt-1 text-2xl font-semibold">{suggestion.traffic.liveDurationMinutes} min</p>
            <p className="mt-2 text-sm text-muted-foreground">Avg {suggestion.traffic.averageDurationMinutes} min</p>
          </div>
          <div className="rounded-[1.5rem] border bg-white p-5">
            <Clock3 className="mb-3 h-5 w-5 text-orange-500" />
            <p className="text-sm text-muted-foreground">Routine confidence</p>
            <p className="mt-1 text-2xl font-semibold">{Math.round(suggestion.confidence * 100)}%</p>
            <p className="mt-2 text-sm text-muted-foreground">Based on weekday morning commute history.</p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border bg-slate-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-orange-500" />
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">Why now</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {suggestion.triggerDiagnostics.reasons.map((reason) => (
              <div key={reason} className="rounded-xl bg-white p-3 text-sm text-slate-700">
                {reason}
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <StatPill label="Confidence" value={`${Math.round(suggestion.triggerDiagnostics.confidenceScore * 100)}%`} />
            <StatPill label="Threshold" value={`${Math.round(suggestion.triggerDiagnostics.confidenceThreshold * 100)}%`} />
            <StatPill label="Cooldown" value={suggestion.triggerDiagnostics.cooldownActive ? "Active" : "Inactive"} />
            <StatPill label="Live date" value={format(currentTime, "MMM d, yyyy")} />
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-500" />
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">Uber automated quote</h2>
          </div>
          <div className="space-y-3">
            {suggestion.quotes.map((quote) => {
              const isBest = quote.platform === bestQuote.platform && quote.rideType === bestQuote.rideType;
              return (
                <div
                  key={`${quote.platform}-${quote.rideType}`}
                  className={`flex flex-col gap-4 rounded-[1.5rem] border p-4 md:flex-row md:items-center md:justify-between ${
                    isBest ? "border-emerald-300 bg-emerald-50" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {quote.rideType === "Bike" ? (
                      <Bike className="h-5 w-5 text-orange-500" />
                    ) : (
                      <CarTaxiFront className="h-5 w-5 text-orange-500" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {quote.platform} {quote.rideType}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pickup in {quote.pickupWaitMinutes} min • Surge x{quote.surgeMultiplier.toFixed(1)} • {quote.sourceLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">ETA</p>
                      <p className="font-semibold">{quote.etaMinutes} min</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-semibold">Rs {quote.price}</p>
                    </div>
                    <Button variant={isBest ? "default" : "outline"} disabled={saving} onClick={() => onConfirm(quote.platform, quote.rideType)}>
                      {confirmed === `${quote.platform} ${quote.rideType}` ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Confirmed
                        </>
                      ) : (
                        "Confirm"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={onDismiss} disabled={saving}>
            Dismiss
          </Button>
          <Button variant="outline" onClick={onRefresh} disabled={saving}>
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
