"use server";

import { createClient } from "@/app/lib/supabase/server";
import { extractPrescription } from "@/app/lib/prescriptions";
import type { ReadPrescriptionState } from "@/app/lib/prescriptions/types";

const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "application/pdf"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function readPrescription(
  _prev: ReadPrescriptionState,
  formData: FormData,
): Promise<ReadPrescriptionState> {
  // Server Functions are reachable via direct POST, so authenticate here.
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

  try {
    const data = await extractPrescription(await file.arrayBuffer(), file.type);
    return { status: "success", data };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not read the prescription.",
    };
  }
}
