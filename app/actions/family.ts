"use server";

import { createClient } from "@/app/lib/supabase/server";
import {
  medicationsFromPrescription,
  summarizePatients,
  type CabinetMedication,
  type PatientSummary,
} from "@/app/lib/family/from-prescriptions";
import {
  formatReminderTime,
  patientIdFromName,
  remindersToDoses,
  todayBoundsUtc,
  type ReminderRow,
} from "@/app/lib/schedule/from-reminders";
import type { Dose } from "@/app/lib/schedule/types";
import { resolveSchedule } from "@/app/lib/time";

async function getTimezone(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();
  return profile?.timezone || "UTC";
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export type PrescriptionCabinetResult =
  | { ok: true; medications: CabinetMedication[] }
  | { ok: false; error: string };

export async function getPrescriptionCabinet(): Promise<PrescriptionCabinetResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Sign in to view prescriptions." };

  const { data, error } = await supabase
    .from("prescriptions")
    .select("id, patient_name, medications, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message };

  const medications = (data ?? []).flatMap((row) =>
    medicationsFromPrescription(row),
  );

  return { ok: true, medications };
}

export type PatientsListResult =
  | { ok: true; patients: PatientSummary[] }
  | { ok: false; error: string };

export async function getPatientsList(): Promise<PatientsListResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Sign in to view patients." };

  const timezone = await getTimezone(user.id);
  const { startIso, endIso } = todayBoundsUtc(timezone);

  const [{ data: rx, error: rxError }, { data: todayReminders }] = await Promise.all([
    supabase
      .from("prescriptions")
      .select("id, patient_name, medications, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("reminders")
      .select(
        "id, patient_name, medication_name, dosage, scheduled_at, status, timezone",
      )
      .eq("user_id", user.id)
      .gte("scheduled_at", startIso)
      .lt("scheduled_at", endIso)
      .order("scheduled_at", { ascending: true }),
  ]);

  if (rxError) return { ok: false, error: rxError.message };

  const medications = (rx ?? []).flatMap((row) => medicationsFromPrescription(row));
  const doses = resolveSchedule(
    remindersToDoses((todayReminders ?? []) as ReminderRow[]),
    new Date(),
  );

  const nextDoseByPatient = new Map<string, string | null>();
  const adherenceByPatient = new Map<string, string>();
  const patientIds = new Set([
    ...medications.map((m) => m.patientId),
    ...doses.map((d) => d.patientId),
  ]);

  for (const patientId of patientIds) {
    const next = doses.find(
      (d) =>
        d.patientId === patientId &&
        (d.state === "Next dose" || d.state === "Upcoming"),
    );
    nextDoseByPatient.set(patientId, next?.time ?? null);

    const theirs = doses.filter((d) => d.patientId === patientId);
    const taken = theirs.filter((d) => d.state === "Taken").length;
    adherenceByPatient.set(
      patientId,
      theirs.length ? `${Math.round((taken / theirs.length) * 100)}%` : "—",
    );
  }

  return {
    ok: true,
    patients: summarizePatients(medications, nextDoseByPatient, adherenceByPatient),
  };
}

export type PatientDetailResult =
  | {
      ok: true;
      patient: PatientSummary;
      medications: CabinetMedication[];
      todayDoses: Dose[];
      weekTakenDays: boolean[];
    }
  | { ok: false; error: string };

export async function getPatientDetail(
  patientId: string,
): Promise<PatientDetailResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Sign in to view this patient." };

  const slug = decodeURIComponent(patientId).trim();
  if (!slug) return { ok: false, error: "Patient not found." };

  const timezone = await getTimezone(user.id);
  const { startIso, endIso } = todayBoundsUtc(timezone);

  const { data: rx, error: rxError } = await supabase
    .from("prescriptions")
    .select("id, patient_name, medications, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (rxError) return { ok: false, error: rxError.message };

  const medications = (rx ?? [])
    .flatMap((row) => medicationsFromPrescription(row))
    .filter((med) => med.patientId === slug);

  if (!medications.length) {
    return { ok: false, error: "Patient not found." };
  }

  const patientName = medications[0]!.patient;

  const { data: todayReminders } = await supabase
    .from("reminders")
    .select(
      "id, patient_name, medication_name, dosage, scheduled_at, status, timezone",
    )
    .eq("user_id", user.id)
    .eq("patient_name", patientName)
    .gte("scheduled_at", startIso)
    .lt("scheduled_at", endIso)
    .order("scheduled_at", { ascending: true });

  const todayDoses = resolveSchedule(
    remindersToDoses((todayReminders ?? []) as ReminderRow[]),
    new Date(),
  );

  // Last 7 local days: whether any dose was taken that day (one query).
  const weekStart = todayBoundsUtc(
    timezone,
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  ).startIso;
  const { data: weekRows } = await supabase
    .from("reminders")
    .select("scheduled_at, status, timezone")
    .eq("user_id", user.id)
    .eq("patient_name", patientName)
    .gte("scheduled_at", weekStart)
    .lt("scheduled_at", endIso);

  const weekTakenDays: boolean[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const bounds = todayBoundsUtc(timezone, day);
    const rows = (weekRows ?? []).filter(
      (r) =>
        r.scheduled_at >= bounds.startIso && r.scheduled_at < bounds.endIso,
    );
    weekTakenDays.push(rows.some((r) => r.status === "taken"));
  }

  const taken = todayDoses.filter((d) => d.state === "Taken").length;
  const adherence = todayDoses.length
    ? `${Math.round((taken / todayDoses.length) * 100)}%`
    : "—";
  const next = todayDoses.find(
    (d) => d.state === "Next dose" || d.state === "Upcoming",
  );

  return {
    ok: true,
    patient: {
      id: slug,
      name: patientName,
      initial: (patientName.trim()[0] || "?").toUpperCase(),
      tone: medications[0]!.tone,
      prescriptionCount: medications.length,
      adherence,
      nextDoseTime: next?.time ?? null,
    },
    medications,
    todayDoses,
    weekTakenDays,
  };
}

export type HistoryResult =
  | {
      ok: true;
      doses: Dose[];
      patients: { id: string; name: string }[];
      weekPercents: number[];
      timezone: string;
    }
  | { ok: false; error: string };

export async function getAdherenceHistory(): Promise<HistoryResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Sign in to view history." };

  const timezone = await getTimezone(user.id);
  const { startIso, endIso } = todayBoundsUtc(timezone);

  const { data: todayReminders, error } = await supabase
    .from("reminders")
    .select(
      "id, patient_name, medication_name, dosage, scheduled_at, status, timezone",
    )
    .eq("user_id", user.id)
    .gte("scheduled_at", startIso)
    .lt("scheduled_at", endIso)
    .order("scheduled_at", { ascending: true });

  if (error) return { ok: false, error: error.message };

  const doses = resolveSchedule(
    remindersToDoses((todayReminders ?? []) as ReminderRow[]),
    new Date(),
  );

  const patientsMap = new Map<string, string>();
  for (const dose of doses) {
    patientsMap.set(dose.patientId, dose.child);
  }
  // Prefer full names from reminders
  for (const row of todayReminders ?? []) {
    patientsMap.set(patientIdFromName(row.patient_name), row.patient_name);
  }

  const weekStart = todayBoundsUtc(
    timezone,
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  ).startIso;
  const { data: weekRows } = await supabase
    .from("reminders")
    .select("scheduled_at, status")
    .eq("user_id", user.id)
    .gte("scheduled_at", weekStart)
    .lt("scheduled_at", endIso);

  const weekPercents: number[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const bounds = todayBoundsUtc(timezone, day);
    const rows = (weekRows ?? []).filter(
      (r) =>
        r.scheduled_at >= bounds.startIso && r.scheduled_at < bounds.endIso,
    );
    if (!rows.length) {
      weekPercents.push(0);
      continue;
    }
    const taken = rows.filter((r) => r.status === "taken").length;
    weekPercents.push(Math.round((taken / rows.length) * 100));
  }

  return {
    ok: true,
    doses,
    patients: [...patientsMap.entries()].map(([id, name]) => ({ id, name })),
    weekPercents,
    timezone,
  };
}

export type SetDoseStatusResult = { ok: true } | { ok: false; error: string };

export async function setDoseStatus(
  reminderId: string,
  status: "taken" | "missed",
): Promise<SetDoseStatusResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Sign in to update a dose." };
  if (!reminderId.trim()) return { ok: false, error: "Missing reminder id." };

  const { error } = await supabase
    .from("reminders")
    .update({
      status,
      failure_reason: status === "missed" ? "Marked missed" : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reminderId)
    .eq("user_id", user.id);

  if (error) {
    if (error.message.toLowerCase().includes("check") || error.code === "23514") {
      return {
        ok: false,
        error:
          "Database needs 'taken' and 'missed' reminder statuses. Run the status check update in supabase/schema.sql.",
      };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/** Used by history UI labels — re-export time helper for server consumers if needed. */
export { formatReminderTime };
