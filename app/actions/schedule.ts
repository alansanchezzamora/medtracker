"use server";

import { createClient } from "@/app/lib/supabase/server";
import {
  patientsFromReminders,
  remindersToDoses,
  todayBoundsUtc,
  type ReminderRow,
} from "@/app/lib/schedule/from-reminders";
import type { Dose, SchedulePatient } from "@/app/lib/schedule/types";

export type TodayScheduleResult =
  | {
      ok: true;
      doses: Dose[];
      patients: SchedulePatient[];
      timezone: string;
    }
  | { ok: false; error: string };

export async function getTodaySchedule(): Promise<TodayScheduleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in to view today's schedule." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();

  const timezone = profile?.timezone || "UTC";
  const { startIso, endIso } = todayBoundsUtc(timezone);

  const { data, error } = await supabase
    .from("reminders")
    .select(
      "id, patient_name, medication_name, dosage, scheduled_at, status, timezone",
    )
    .eq("user_id", user.id)
    .gte("scheduled_at", startIso)
    .lt("scheduled_at", endIso)
    .order("scheduled_at", { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  const reminders = (data ?? []) as ReminderRow[];

  // If today's reminders are empty, still list patients from recent prescriptions.
  let patients = patientsFromReminders(reminders);
  if (patients.length === 0) {
    const { data: rx } = await supabase
      .from("prescriptions")
      .select("patient_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const names = [...new Set((rx ?? []).map((r) => String(r.patient_name || "").trim()).filter(Boolean))];
    patients = patientsFromReminders(
      names.map((patient_name) => ({
        id: patient_name,
        patient_name,
        medication_name: "",
        dosage: "",
        scheduled_at: new Date().toISOString(),
        status: "pending",
        timezone,
      })),
    );
  }

  // Adherence for today: taken / total among today's doses
  const doses = remindersToDoses(reminders);
  const total = doses.length;
  const taken = doses.filter((d) => d.state === "Taken").length;
  if (total > 0) {
    const pct = Math.round((taken / total) * 100);
    patients = patients.map((p) => {
      const theirs = doses.filter((d) => d.patientId === p.id);
      if (!theirs.length) return { ...p, adherence: "—" };
      const t = theirs.filter((d) => d.state === "Taken").length;
      return { ...p, adherence: `${Math.round((t / theirs.length) * 100)}%` };
    });
    void pct;
  }

  return { ok: true, doses, patients, timezone };
}

export type ConfirmDoseResult = { ok: true } | { ok: false; error: string };

export async function confirmDoseTaken(reminderId: string): Promise<ConfirmDoseResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in to confirm a dose." };
  }

  if (!reminderId.trim()) {
    return { ok: false, error: "Missing reminder id." };
  }

  const { error } = await supabase
    .from("reminders")
    .update({
      status: "taken",
      failure_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reminderId)
    .eq("user_id", user.id);

  if (error) {
    // Common when DB check constraint hasn't been updated yet.
    if (error.message.toLowerCase().includes("check") || error.code === "23514") {
      return {
        ok: false,
        error:
          "Database needs the 'taken' reminder status. Run the updated supabase/schema.sql (or alter the reminders status check).",
      };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
