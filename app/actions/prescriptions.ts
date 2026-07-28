"use server";

import { createClient } from "@/app/lib/supabase/server";
import { extractPrescription } from "@/app/lib/prescriptions";
import type { ExtractedPrescription, ReadPrescriptionState } from "@/app/lib/prescriptions/types";

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
  const { error: dbError } = await supabase.from("prescriptions").insert({
    user_id: user.id,
    patient_name: data.patientName,
    medications: data.medications,
  });
  if (dbError) {
    return { status: "error", message: "Read the prescription, but could not save it." };
  }

  return { status: "success", data };
}
