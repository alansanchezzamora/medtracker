import type { ExtractedMedication } from "@/app/lib/prescriptions/types";
import { doseTimesForFrequency } from "@/app/lib/reminders/expand";
import { patientIdFromName } from "@/app/lib/schedule/from-reminders";

export type CabinetMedication = {
  id: string;
  prescriptionId: string;
  patient: string;
  patientId: string;
  medicine: string;
  dosage: string;
  frequency: string;
  schedule: string;
  refills: string;
  tone: "peach" | "blue";
  asNeeded: boolean;
};

export type PatientSummary = {
  id: string;
  name: string;
  initial: string;
  tone: "peach" | "blue";
  prescriptionCount: number;
  adherence: string;
  nextDoseTime: string | null;
};

function toneForId(id: string): "peach" | "blue" {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % 2;
  }
  return hash === 0 ? "peach" : "blue";
}

function daysRemainingLabel(durationDays: number, createdAt: string): string {
  if (!durationDays || durationDays <= 0) return "Duration not set";
  const start = new Date(createdAt);
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);
  const remaining = Math.ceil((end.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (remaining < 0) return "Course ended";
  if (remaining === 0) return "Ends today";
  return `${remaining} day${remaining === 1 ? "" : "s"} remaining`;
}

export function medicationsFromPrescription(row: {
  id: string;
  patient_name: string;
  medications: unknown;
  created_at: string;
}): CabinetMedication[] {
  const patientId = patientIdFromName(row.patient_name);
  const tone = toneForId(patientId);
  const meds = Array.isArray(row.medications)
    ? (row.medications as ExtractedMedication[])
    : [];

  return meds.map((med, index) => {
    const times = med.asNeeded ? [] : doseTimesForFrequency(med.frequency || "");
    return {
      id: `${row.id}-${index}`,
      prescriptionId: row.id,
      patient: row.patient_name,
      patientId,
      medicine: med.medicationName || "Medication",
      dosage: med.dosage || "—",
      frequency: med.asNeeded
        ? "As needed"
        : med.frequency || "As directed",
      schedule: med.asNeeded
        ? "PRN"
        : times.length
          ? times.join(" · ")
          : "See label",
      refills: daysRemainingLabel(Number(med.durationDays) || 0, row.created_at),
      tone,
      asNeeded: Boolean(med.asNeeded),
    };
  });
}

export function summarizePatients(
  medications: CabinetMedication[],
  nextDoseByPatient: Map<string, string | null>,
  adherenceByPatient: Map<string, string>,
): PatientSummary[] {
  const byId = new Map<string, PatientSummary>();

  for (const med of medications) {
    const existing = byId.get(med.patientId);
    if (existing) {
      existing.prescriptionCount += 1;
      continue;
    }
    byId.set(med.patientId, {
      id: med.patientId,
      name: med.patient,
      initial: (med.patient.trim()[0] || "?").toUpperCase(),
      tone: med.tone,
      prescriptionCount: 1,
      adherence: adherenceByPatient.get(med.patientId) ?? "—",
      nextDoseTime: nextDoseByPatient.get(med.patientId) ?? null,
    });
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export { toneForId };
