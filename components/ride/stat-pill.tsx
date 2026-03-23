export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/40 bg-white/70 px-4 py-2 text-sm shadow-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-2 font-semibold text-foreground">{value}</span>
    </div>
  );
}
