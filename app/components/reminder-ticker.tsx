"use client";

import { useEffect, useRef } from "react";
import { tickMyDueReminders } from "@/app/actions/reminders";

const TICK_MS = 10_000; // every 10s so due reminders send close to scheduled_at

/**
 * Polls for due reminders while the caregiver stays signed in.
 * Local/dev substitute for Vercel Cron (which only runs after deploy).
 */
export function ReminderTicker({ enabled }: { enabled: boolean }) {
  const inFlight = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const tick = async () => {
      if (inFlight.current) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      inFlight.current = true;
      try {
        await tickMyDueReminders();
      } catch {
        // Keep polling; next tick may succeed once Twilio credentials / network are OK.
      } finally {
        inFlight.current = false;
      }
    };

    void tick();
    const id = window.setInterval(tick, TICK_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled]);

  return null;
}
