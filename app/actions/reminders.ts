"use server";

import { createClient } from "@/app/lib/supabase/server";
import {
  dispatchDueReminders,
  type DispatchCounts,
} from "@/app/lib/reminders/dispatch";

export type TickRemindersResult =
  | ({ ok: true } & DispatchCounts)
  | { ok: false; error: string };

/**
 * Called by the in-app ticker while a caregiver is signed in.
 * Sends WhatsApp for this user's due pending reminders.
 */
export async function tickMyDueReminders(): Promise<TickRemindersResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  try {
    const counts = await dispatchDueReminders(supabase, { userId: user.id });
    return { ok: true, ...counts };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not dispatch reminders.",
    };
  }
}
