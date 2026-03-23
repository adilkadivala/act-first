import { format } from "date-fns";
import { Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MemorySummary } from "@/lib/rides/types";

export function MemoryCard({
  memory,
  currentTime
}: {
  memory: MemorySummary;
  currentTime: Date;
}) {
  return (
    <Card className="border-white/30 bg-slate-900/95 text-white">
      <CardHeader>
        <CardTitle>Memory snapshot</CardTitle>
        <CardDescription className="text-slate-300">What is persisted and reused between suggestions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm text-slate-200">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-orange-300" />
            <p>
              {memory.storedTrips} trips, {memory.storedDismissals} dismissals, {memory.storedConfirmations} confirmations, and {memory.storedEdits} edits stored.
            </p>
          </div>
          {memory.learningNotes.map((note) => (
            <p key={note}>{note}</p>
          ))}
          <p>Latest dismissal: {memory.lastDismissedAt ? format(new Date(memory.lastDismissedAt), "MMM d, h:mm a") : "None"}</p>
          <p>Viewing at: {format(currentTime, "MMM d, yyyy h:mm:ss a")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
