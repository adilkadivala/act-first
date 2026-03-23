import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArchitectureSummary } from "@/lib/rides/types";

export function ArchitectureCard({ architecture }: { architecture: ArchitectureSummary }) {
  return (
    <Card className="border-white/30 bg-white/90 text-slate-900">
      <CardHeader>
        <CardTitle>Architecture</CardTitle>
        <CardDescription>What the system watches, remembers, and how it handles failure.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="mb-2 font-semibold">Trigger logic</p>
          <div className="space-y-2">
            {architecture.triggerLogic.map((item) => (
              <p key={item} className="rounded-xl bg-slate-50 p-3">
                {item}
              </p>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 font-semibold">Memory</p>
          <div className="space-y-2">
            {architecture.memoryModel.map((item) => (
              <p key={item} className="rounded-xl bg-slate-50 p-3">
                {item}
              </p>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 font-semibold">Failure handling</p>
          <div className="space-y-2">
            {architecture.failureHandling.map((item) => (
              <p key={item} className="rounded-xl bg-slate-50 p-3">
                {item}
              </p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
