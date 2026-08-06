"use server";

import { createClient } from "@/app/lib/supabase/server";
import { extractPrescription } from "@/app/lib/prescriptions";
import type { ExtractedPrescription, ReadPrescriptionState } from "@/app/lib/prescriptions/types";
import { expandMedicationsToReminders } from "@/app/lib/reminders/expand";

const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "application/pdf"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function readPrescription(
  _prev: ReadPrescriptionState,
  formData: FormData,
): Promise<ReadPrescriptionState> {
  // Authenticate: the prescription is stored against this user, and the endpoint
  // must not be open (it calls a paid / rate-limited API).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Please sign in to upload a prescription." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose a prescription file first." };
  }
  if (!ACCEPTED_TYPES.has(file.type)) {
    return { status: "error", message: "Upload a PNG, JPG, or PDF." };
  }
  if (file.size > MAX_BYTES) {
    return { status: "error", message: "That file is too large (max 5 MB)." };
  }

  let data: ExtractedPrescription;
  try {
    data = await extractPrescription(await file.arrayBuffer(), file.type);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not read the prescription.",
    };
  }

  // Persist to Supabase. Row-level security scopes the row to this user via user_id.
  const { data: inserted, error: dbError } = await supabase
    .from("prescriptions")
    .insert({
      user_id: user.id,
      patient_name: data.patientName,
      medications: data.medications,
    })
    .select("id")
    .single();

  if (dbError || !inserted) {
    return { status: "error", message: "Read the prescription, but could not save it." };
  }

  // Expand into scheduled reminders when the caregiver has a WhatsApp phone on file.
  const { data: profile } = await supabase
    .from("profiles")
    .select("phone_number, whatsapp_enabled, timezone")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.phone_number && profile.whatsapp_enabled !== false) {
    const drafts = expandMedicationsToReminders({
      patientName: data.patientName,
      medications: data.medications,
      phoneNumber: profile.phone_number,
      timezone: profile.timezone || "UTC",
    });

    if (drafts.length > 0) {
      const rows = drafts.map((draft) => ({
        user_id: user.id,
        prescription_id: inserted.id,
        patient_name: draft.patientName,
        medication_name: draft.medicationName,
        dosage: draft.dosage,
        scheduled_at: draft.scheduledAt,
        phone_number: draft.phoneNumber,
        timezone: draft.timezone,
        status: "pending" as const,
      }));

      const { error: reminderError } = await supabase.from("reminders").insert(rows);
      if (reminderError) {
        // Prescription is saved; reminders can be retried later.
        console.error("Failed to create reminders:", reminderError.message);
      }
    }
  }

  return { status: "success", data };
}
