"use client";

import { useEffect, useState } from "react";

function toTimeMs(value?: string) {
  if (!value) return Date.now();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

export function useLiveCurrentTime(initialIso?: string) {
  const [currentTimeMs, setCurrentTimeMs] = useState(() => toTimeMs(initialIso));

  useEffect(() => {
    const baseTimeMs = toTimeMs(initialIso);
    const startedAtMs = Date.now();

    setCurrentTimeMs(baseTimeMs);

    const interval = window.setInterval(() => {
      const elapsedMs = Date.now() - startedAtMs;
      setCurrentTimeMs(baseTimeMs + elapsedMs);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [initialIso]);

  return new Date(currentTimeMs);
}
