// Shape returned by the prescription reader (Gemini vision).
// The app combines this with the logged-in user's phone + timezone and expands
// frequency x durationDays into the scheduledAt reminders in
// app/lib/reminders/types.ts.

export interface ExtractedMedication {
  medicationName: string;
  dosage: string; // e.g. "5 mL"
  frequency: string; // plain words, e.g. "every 8 hours"
  durationDays: number; // 0 if not stated
  asNeeded: boolean; // true for PRN / "as needed"
}

export interface ExtractedPrescription {
  patientName: string;
  medications: ExtractedMedication[];
}

// Result of the upload server action, consumed by useActionState on the page.
export type ReadPrescriptionState =
  | { status: "idle" }
  | { status: "success"; data: ExtractedPrescription }
  | { status: "error"; message: string };
