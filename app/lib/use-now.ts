"use client";

import { useEffect, useState } from "react";

/**
 * Client clock for greetings / countdowns.
 * Starts as null so SSR HTML doesn't disagree with the user's timezone,
 * then ticks every 30s (and again when the tab becomes visible).
 */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();

    const intervalId = window.setInterval(tick, intervalMs);
    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);

  return now;
}
