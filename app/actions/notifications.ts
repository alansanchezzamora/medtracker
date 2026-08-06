"use server";

import { createClient } from "@/app/lib/supabase/server";
import { getNotificationProvider } from "@/app/lib/notifications";

export type TestWhatsAppResult =
  | {
      ok: true;
      providerMessageId: string | null;
      usingTwilio: boolean;
    }
  | { ok: false; error: string };

/**
 * Auth-gated one-shot send to verify Twilio WhatsApp Sandbox wiring.
 * Uses the signed-in user's profile phone number.
 */
export async function sendTestWhatsAppReminder(): Promise<TestWhatsAppResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in to send a test WhatsApp reminder." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("phone_number, whatsapp_enabled")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  if (!profile?.phone_number) {
    return {
      ok: false,
      error:
        "Save a phone number in Settings first (E.164, e.g. +233241234567), then click Send test WhatsApp.",
    };
  }

  if (!profile.whatsapp_enabled) {
    return {
      ok: false,
      error: "Turn on WhatsApp reminders, click Save preferences, then try again.",
    };
  }

  const usingTwilio = Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_WHATSAPP_FROM?.trim() &&
      process.env.TWILIO_WHATSAPP_CONTENT_SID?.trim(),
  );

  if (!usingTwilio) {
    return {
      ok: false,
      error:
        "Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, and TWILIO_WHATSAPP_CONTENT_SID in .env, then restart npm run dev.",
    };
  }

  let provider;
  try {
    provider = getNotificationProvider();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not start Twilio provider.",
    };
  }

  const timeLabel = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const result = await provider.send({
    reminderId: `test-${Date.now()}`,
    recipientPhoneNumber: profile.phone_number,
    body: "MedTracker test reminder",
    templateVariables: {
      "1": "MedTracker test",
      "2": timeLabel,
    },
  });

  if (result.status === "failed") {
    return { ok: false, error: result.error ?? "Send failed." };
  }

  return {
    ok: true,
    providerMessageId: result.providerMessageId,
    usingTwilio: true,
  };
}
