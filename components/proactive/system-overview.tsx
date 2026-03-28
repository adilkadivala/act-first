import { BrainCircuit, Clock3, DatabaseZap, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pillars = [
  {
    title: "Shared Trigger Engine",
    body: "Both assistants watch routine windows, current conditions, and recent feedback before surfacing a suggestion.",
    icon: Clock3
  },
  {
    title: "Behavior Memory",
    body: "Trips, orders, edits, confirmations, and dismissals all feed later ranking so the defaults improve over time.",
    icon: DatabaseZap
  },
  {
    title: "Mock Provider Layer",
    body: "Ride and food providers both use realistic mock snapshots in this submission and fall back cleanly when data is partial.",
    icon: BrainCircuit
  },
  {
    title: "Failure-Safe UX",
    body: "Users still get a usable suggestion with provider health, confidence, and warnings when data is partial.",
    icon: ShieldAlert
  }
];

export function SystemOverview() {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-amber-200/80">Unified architecture</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
            One proactive system, two domains
          </h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-slate-200">
          The ride and food assistants now share the same behavior-learning, trigger, memory, and provider-resilience model.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <Card key={pillar.title} className="border-white/20 bg-white/10 text-slate-50">
              <CardHeader>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <Icon className="h-5 w-5 text-amber-200" />
                </div>
                <CardTitle className="pt-4 text-xl text-white">{pillar.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-slate-200">{pillar.body}</CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
