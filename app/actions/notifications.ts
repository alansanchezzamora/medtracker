"use server";

import { createClient } from "@/app/lib/supabase/server";
import { getNotificationProvider } from "@/app/lib/notifications";
import { toUserMessage } from "@/app/lib/user-error";

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
    return { ok: false, error: toUserMessage("notifications.profile", profileError, "Couldn't load your profile. Please try again.") };
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
      error: "WhatsApp messaging isn't set up yet. Ask your team to finish the Twilio setup, then try again.",
    };
  }

  let provider;
  try {
    provider = getNotificationProvider();
  } catch (error) {
    return {
      ok: false,
      error: toUserMessage("notifications.provider", error, "WhatsApp messaging is unavailable right now. Please try again."),
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
