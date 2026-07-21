import type { ExtractedPrescription, ExtractedMedication } from "./types";

// Prompt used when the model reads the document image/PDF directly.
export const IMAGE_PROMPT =
  "You are reading a doctor's prescription. Extract the patient's name and every medication. " +
  "For each medication give: medicationName (just the drug name, no strength or form), the dosage " +
  "amount (e.g. '5 mL' or '10 mg'), how often it is taken in plain words (e.g. 'every 8 hours'), " +
  "durationDays (number of days, 0 if not stated), and asNeeded=true if it says as needed / PRN. " +
  "Use only what is written.";

// Prompt used when a provider only produced OCR text (e.g. Textract) and an LLM interprets it.
export const TEXT_PROMPT =
  "The following is OCR text from a doctor's prescription. Extract the patient's name and every " +
  "medication: medicationName (just the drug name), dosage (e.g. '5 mL' or '10 mg'), frequency in " +
  "plain words (e.g. 'every 8 hours'), durationDays (0 if not stated), and asNeeded=true for " +
  "as-needed / PRN. Use only what is written.";

// Coerce arbitrary model/tool output into a safe ExtractedPrescription so every
// provider returns the same, validated shape.
export function normalizePrescription(raw: unknown): ExtractedPrescription {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const meds: unknown[] = Array.isArray(obj.medications) ? (obj.medications as unknown[]) : [];

  const medications: ExtractedMedication[] = meds
    .map((m): ExtractedMedication => {
      const x = (m ?? {}) as Record<string, unknown>;
      const days = Number(x.durationDays);
      return {
        medicationName: String(x.medicationName ?? "").trim(),
        dosage: String(x.dosage ?? "").trim(),
        frequency: String(x.frequency ?? "").trim(),
        durationDays: Number.isFinite(days) ? days : 0,
        asNeeded: Boolean(x.asNeeded),
      };
    })
    .filter((m) => m.medicationName);

  return { patientName: String(obj.patientName ?? "").trim(), medications };
}
