"use server";

import { createClient } from "@/app/lib/supabase/server";
import type { CarePreferences } from "@/app/lib/profiles/types";

const INTERNATIONAL_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

export type GetPreferencesResult =
  | { ok: true; preferences: CarePreferences }
  | { ok: false; error: string };

export async function getCarePreferences(): Promise<GetPreferencesResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("phone_number, whatsapp_enabled, email_enabled, timezone")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  // Ensure a row exists for users created before the profiles table.
  if (!data) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
    });
    if (insertError) {
      return { ok: false, error: insertError.message };
    }
    return {
      ok: true,
      preferences: {
        phoneNumber: "",
        whatsapp: true,
        email: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      },
    };
  }

  return {
    ok: true,
    preferences: {
      phoneNumber: data.phone_number ?? "",
      whatsapp: data.whatsapp_enabled,
      email: data.email_enabled,
      timezone: data.timezone || "UTC",
    },
  };
}

export type UpdatePreferencesResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateCarePreferences(
  formData: FormData,
): Promise<UpdatePreferencesResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim() || "UTC";
  const whatsapp = formData.get("whatsapp") === "on" || formData.get("whatsapp") === "true";
  const email = formData.get("email") === "on" || formData.get("email") === "true";

  if (phoneNumber && !INTERNATIONAL_PHONE_PATTERN.test(phoneNumber)) {
    return {
      ok: false,
      error: "Phone number must use international format, for example +15551234567.",
    };
  }

  if (!isValidTimezone(timezone)) {
    return { ok: false, error: "A valid IANA timezone is required." };
  }

  if (whatsapp && !phoneNumber) {
    return {
      ok: false,
      error: "Add a phone number before enabling WhatsApp reminders.",
    };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      phone_number: phoneNumber || null,
      whatsapp_enabled: whatsapp,
      email_enabled: email,
      timezone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
