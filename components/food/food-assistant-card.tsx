"use client";

import { CheckCircle2, Clock3, PencilLine, RefreshCw, Soup, TriangleAlert } from "lucide-react";
import { useFoodAssistant } from "@/hooks/use-food-assistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function FoodAssistantCard() {
  const { data, error, editable, setEditable, confirmed, dismissed, isPending, confirm, dismiss, refresh } = useFoodAssistant();

  if (error) {
    return (
      <Card className="border-white/30 bg-white/90 text-slate-900">
        <CardHeader>
          <CardTitle>Food assistant unavailable</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void refresh()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-white/20 bg-white/10 text-slate-50">
        <CardContent className="flex min-h-[360px] items-center justify-center text-sm text-slate-200">
          Loading food assistant...
        </CardContent>
      </Card>
    );
  }

  const suggestion = data.suggestion;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="border-white/30 bg-white/90 text-slate-900">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.26em] text-orange-600">Food Assistant</p>
              <CardTitle className="mt-3 text-2xl">Suggest dinner before the user asks</CardTitle>
              <CardDescription className="mt-2 text-base">
                {suggestion?.why[0] ?? "The trigger logic decided not to interrupt right now."}
              </CardDescription>
            </div>
            <div className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
              {Math.round(data.decision.confidence * 100)}% confidence
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {dismissed ? (
            <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Suggestion dismissed. The food assistant will cool down before nudging again.
            </div>
          ) : null}

          {data.liveDataHealth.warnings.length > 0 ? (
            <div className="rounded-[1.25rem] border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-2">
                  {data.liveDataHealth.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {suggestion && !dismissed ? (
            <>
              <div className="grid gap-4 rounded-[1.5rem] bg-orange-50 p-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium uppercase tracking-[0.18em] text-orange-700">Restaurant</span>
                  <input
                    className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-lg font-semibold"
                    value={editable.restaurant}
                    onChange={(event) => setEditable((current) => ({ ...current, restaurant: event.target.value }))}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium uppercase tracking-[0.18em] text-orange-700">Suggested time</span>
                  <input
                    type="time"
                    className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-lg font-semibold"
                    value={editable.scheduledFor}
                    onChange={(event) => setEditable((current) => ({ ...current, scheduledFor: event.target.value }))}
                  />
                </label>
              </div>

              <label className="block space-y-2 rounded-[1.5rem] border bg-white p-5">
                <span className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                  <PencilLine className="h-4 w-4 text-orange-500" />
                  Items
                </span>
                <input
                  className="w-full rounded-xl border px-3 py-2 text-lg font-semibold"
                  value={editable.items}
                  onChange={(event) => setEditable((current) => ({ ...current, items: event.target.value }))}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border bg-white p-5">
                  <Soup className="mb-3 h-5 w-5 text-orange-500" />
                  <p className="text-sm text-muted-foreground">Platform</p>
                  <p className="mt-1 text-2xl font-semibold">{suggestion.platform}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{suggestion.restaurant}</p>
                </div>
                <div className="rounded-[1.5rem] border bg-white p-5">
                  <Clock3 className="mb-3 h-5 w-5 text-orange-500" />
                  <p className="text-sm text-muted-foreground">Live ETA</p>
                  <p className="mt-1 text-2xl font-semibold">{suggestion.etaMinutes} min</p>
                  <p className="mt-2 text-sm text-muted-foreground">Order earlier because the platform is slower than usual.</p>
                </div>
                <div className="rounded-[1.5rem] border bg-white p-5">
                  <CheckCircle2 className="mb-3 h-5 w-5 text-orange-500" />
                  <p className="text-sm text-muted-foreground">Current total</p>
                  <p className="mt-1 text-2xl font-semibold">Rs {suggestion.total}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Includes delivery fee of Rs {suggestion.deliveryFee}.</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border bg-slate-50 p-5">
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">Why this surfaced now</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {suggestion.why.map((reason) => (
                    <div key={reason} className="rounded-xl bg-white p-3 text-sm text-slate-700">
                      {reason}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={confirm} disabled={isPending}>
                  {confirmed ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirmed
                    </>
                  ) : (
                    "Confirm order"
                  )}
                </Button>
                <Button variant="secondary" onClick={dismiss} disabled={isPending}>
                  Dismiss
                </Button>
                <Button variant="outline" onClick={() => void refresh()} disabled={isPending}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600">
              The trigger logic is holding back the suggestion right now because cooldown or confidence rules are active.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-white/30 bg-white/90 text-slate-900">
          <CardHeader>
            <CardTitle>Provider health</CardTitle>
            <CardDescription>Each domain uses the same adapter contract and surfaces degradation clearly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.integrations.liveSources.map((source) => (
              <div key={source.platform} className="rounded-[1.25rem] border bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{source.platform}</p>
                    <p className="mt-1 text-sm text-slate-600">{source.purpose}</p>
                    <p className="mt-1 text-xs text-slate-500">{source.notes}</p>
                  </div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-white">
                    {source.status}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/30 bg-white/90 text-slate-900">
          <CardHeader>
            <CardTitle>Alternatives</CardTitle>
            <CardDescription>Fallback choices stay available if the preferred restaurant slows down.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.alternatives.map((option) => (
              <div key={`${option.platform}-${option.restaurant}`} className="rounded-[1.25rem] border bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{option.restaurant}</p>
                    <p className="mt-1 text-sm text-slate-600">{option.reason}</p>
                  </div>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-orange-800">
                    {option.platform}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                  <span>{option.etaMinutes} min ETA</span>
                  <span>Rs {option.total}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/30 bg-white/90 text-slate-900">
          <CardHeader>
            <CardTitle>Remembered behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>Frequent items: {data.profile.frequentItems.map((item) => item.name).slice(0, 3).join(", ")}</p>
            <p>Favorite cuisines: {data.profile.favoriteCuisines.map((item) => item.cuisine).slice(0, 3).join(", ")}</p>
            <p>Top restaurants: {data.profile.restaurants.map((item) => item.restaurant).slice(0, 3).join(", ")}</p>
            <p>
              Typical dinner window: {data.profile.schedule.usualWindowStart} to {data.profile.schedule.usualWindowEnd}
            </p>
            <p>
              Price band: Rs {data.profile.preferredPriceRange.min} to Rs {data.profile.preferredPriceRange.max}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
