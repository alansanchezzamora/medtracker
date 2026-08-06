import type { Dose, SchedulePatient } from "./types";

export type ReminderRow = {
  id: string;
  patient_name: string;
  medication_name: string;
  dosage: string;
  scheduled_at: string;
  status: string;
  timezone: string;
};

/** Stable slug for patient links / grouping (not a DB id yet). */
export function patientIdFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "patient";
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

function toneForId(id: string): "peach" | "blue" {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % 2;
  }
  return hash === 0 ? "peach" : "blue";
}

/** Format a reminder instant as HH:mm in the given IANA timezone. */
export function formatReminderTime(iso: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone || "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  }
}

export function remindersToDoses(reminders: ReminderRow[]): Dose[] {
  return reminders.map((row) => {
    const patientId = patientIdFromName(row.patient_name);
    const taken = row.status === "taken" || row.status === "cancelled";
    const missed = row.status === "missed";
    return {
      id: row.id,
      time: formatReminderTime(row.scheduled_at, row.timezone),
      medicine: row.medication_name,
      amount: row.dosage,
      child: firstName(row.patient_name),
      patientId,
      state: taken ? "Taken" : missed ? "Missed" : "Upcoming",
      detail:
        row.status === "sent"
          ? "WhatsApp reminder sent"
          : row.status === "failed"
            ? "Reminder failed"
            : row.status === "taken"
              ? "Confirmed taken"
              : row.status === "missed"
                ? "Marked missed"
                : undefined,
      reminderStatus: row.status,
    };
  });
}

export function patientsFromReminders(reminders: ReminderRow[]): SchedulePatient[] {
  const seen = new Map<string, SchedulePatient>();

  for (const row of reminders) {
    const id = patientIdFromName(row.patient_name);
    if (seen.has(id)) continue;
    const name = row.patient_name.trim();
    seen.set(id, {
      id,
      name,
      initial: (name[0] || "?").toUpperCase(),
      tone: toneForId(id),
      adherence: "—",
    });
  }

  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Start/end of "today" in an IANA timezone, as UTC ISO strings. */
export function todayBoundsUtc(timezone: string, now = new Date()): { startIso: string; endIso: string } {
  const tz = timezone || "UTC";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);

  // Approximate local midnight → UTC using the same offset trick as reminder expand.
  const start = localMidnightToUtc(y, m, d, tz);
  const endDate = new Date(Date.UTC(y, m - 1, d + 1));
  const end = localMidnightToUtc(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth() + 1,
    endDate.getUTCDate(),
    tz,
  );

  return { startIso: start, endIso: end };
}

function localMidnightToUtc(
  year: number,
  month: number,
  day: number,
  timezone: string,
): string {
  const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(guess);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  const asInTz = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") === 24 ? 0 : get("hour"),
    get("minute"),
    get("second"),
  );
  return new Date(guess.getTime() - (asInTz - guess.getTime())).toISOString();
}
