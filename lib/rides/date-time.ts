import { format } from "date-fns";

export function buildSuggestionDateTime(currentTimeIso: string, timeValue: string) {
  const base = new Date(currentTimeIso);
  const [hours, minutes] = timeValue.split(":").map(Number);
  base.setHours(hours, minutes, 0, 0);
  return base.toISOString();
}

export function formatPatternTime(currentTimeIso: string, averageDepartureMinutes: number) {
  const currentTime = new Date(currentTimeIso);
  return format(
    new Date(
      currentTime.getFullYear(),
      currentTime.getMonth(),
      currentTime.getDate(),
      Math.floor(averageDepartureMinutes / 60),
      averageDepartureMinutes % 60
    ),
    "h:mm a"
  );
}
