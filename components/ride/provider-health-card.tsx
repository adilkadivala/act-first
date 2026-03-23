import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlatformIntegrationStatus } from "@/lib/rides/types";

export function ProviderHealthCard({ integrations }: { integrations: PlatformIntegrationStatus[] }) {
  return (
    <Card className="border-white/30 bg-slate-900/95 text-white">
      <CardHeader>
        <CardTitle>Provider health</CardTitle>
        <CardDescription className="text-slate-300">
          Uber is wired through browser automation. Other providers remain optional and are labeled clearly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {integrations.map((integration) => (
          <div key={integration.platform} className="rounded-xl bg-white/10 p-3 text-sm">
            <p className="font-semibold">
              {integration.platform} • {integration.status}
            </p>
            <p className="mt-1 text-slate-300">{integration.message}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
