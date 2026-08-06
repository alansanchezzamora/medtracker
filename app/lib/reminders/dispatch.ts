import type { SupabaseClient } from "@supabase/supabase-js";
import { getNotificationProvider } from "@/app/lib/notifications";

export type DispatchCounts = {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
};

type DueReminder = {
  id: string;
  user_id: string;
  medication_name: string;
  dosage: string;
  scheduled_at: string;
  phone_number: string;
  timezone: string;
};

const BATCH_SIZE = 25;

/**
 * Send WhatsApp for due pending reminders.
 * Pass a user-scoped or service-role Supabase client.
 * When `userId` is set, only that user's reminders are processed.
 */
export async function dispatchDueReminders(
  supabase: SupabaseClient,
  options: { userId?: string } = {},
): Promise<DispatchCounts> {
  const nowIso = new Date().toISOString();

  let query = supabase
    .from("reminders")
    .select(
      "id, user_id, medication_name, dosage, scheduled_at, phone_number, timezone",
    )
    .eq("status", "pending")
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (options.userId) {
    query = query.eq("user_id", options.userId);
  }

  const { data: due, error: queryError } = await query;
  if (queryError) {
    throw new Error(queryError.message);
  }

  const reminders = (due ?? []) as DueReminder[];
  if (reminders.length === 0) {
    return { processed: 0, sent: 0, failed: 0, skipped: 0 };
  }

  const userIds = [...new Set(reminders.map((r) => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, whatsapp_enabled, phone_number")
    .in("id", userIds);

  const prefsByUser = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      {
        whatsapp: Boolean(p.whatsapp_enabled),
        phone: (p.phone_number as string | null) ?? null,
      },
    ]),
  );

  const provider = getNotificationProvider();
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const reminder of reminders) {
    const prefs = prefsByUser.get(reminder.user_id);
    if (prefs && !prefs.whatsapp) {
      skipped += 1;
      await supabase
        .from("reminders")
        .update({
          status: "cancelled",
          failure_reason: "WhatsApp reminders disabled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", reminder.id);
      continue;
    }

    const phone = reminder.phone_number || prefs?.phone;
    if (!phone) {
      failed += 1;
      await supabase
        .from("reminders")
        .update({
          status: "failed",
          failure_reason: "No phone number on file",
          updated_at: new Date().toISOString(),
        })
        .eq("id", reminder.id);
      continue;
    }

    const timeLabel = new Date(reminder.scheduled_at).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: reminder.timezone || "UTC",
    });

    // Twilio Sandbox Appointment Reminders: "{{1}}" at "{{2}}"
    const result = await provider.send({
      reminderId: reminder.id,
      recipientPhoneNumber: phone,
      body: `Take ${reminder.medication_name} (${reminder.dosage}) at ${timeLabel}`,
      templateVariables: {
        "1": `${reminder.medication_name} (${reminder.dosage})`,
        "2": timeLabel,
      },
    });

    if (result.status === "sent") {
      sent += 1;
      await supabase
        .from("reminders")
        .update({
          status: "sent",
          provider_message_id: result.providerMessageId,
          sent_at: result.deliveredAt ?? new Date().toISOString(),
          failure_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reminder.id);
    } else {
      failed += 1;
      await supabase
        .from("reminders")
        .update({
          status: "failed",
          failure_reason: result.error,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reminder.id);
    }

  }

  return {
    processed: reminders.length,
    sent,
    failed,
    skipped,
  };
}
