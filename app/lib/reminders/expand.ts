import type { ExtractedMedication } from "@/app/lib/prescriptions/types";

export type ReminderDraft = {
  patientName: string;
  medicationName: string;
  dosage: string;
  scheduledAt: string; // ISO
  phoneNumber: string;
  timezone: string;
};

const DEFAULT_TIMES = ["08:00", "14:00", "20:00"];

/** Map plain-language frequency to daily dose times (HH:mm). */
export function doseTimesForFrequency(frequency: string): string[] {
  const f = frequency.toLowerCase().trim();

  if (/\bas\s*needed\b|\bprn\b/.test(f)) return [];

  if (/\bonce\s*(a\s*)?day\b|\bonce\s*daily\b|\b1\s*x\b|\bqd\b|\bonce\b|\b1\s*time|\bone\s*time/.test(f)) {
    return ["08:00"];
  }
  if (/\btwice\b|\b2\s*times|\bbid\b/.test(f)) {
    return ["08:00", "20:00"];
  }
  if (/\b3\s*times|\bthree\s*times|\btid\b/.test(f)) {
    return ["08:00", "14:00", "20:00"];
  }
  if (/\b4\s*times|\bfour\s*times|\bqid\b/.test(f)) {
    return ["08:00", "12:00", "16:00", "20:00"];
  }

  const everyHours = f.match(/every\s+(\d+)\s*hours?/);
  if (everyHours) {
    const hours = Number(everyHours[1]);
    if (hours > 0 && hours <= 24) {
      const times: string[] = [];
      for (let h = 8; h < 8 + 24; h += hours) {
        const hour = h % 24;
        times.push(`${String(hour).padStart(2, "0")}:00`);
        if (times.length >= 6) break;
      }
      return times.length ? times : DEFAULT_TIMES;
    }
  }

  // "daily" alone without a count → once
  if (/^daily$|\bevery\s*day\b/.test(f)) {
    return ["08:00"];
  }

  return DEFAULT_TIMES;
}

function localDateTimeToUtcIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: string,
): string {
  // Find the UTC instant whose wall-clock time in `timezone` matches the inputs.
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
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
  const offsetMs = asInTz - guess.getTime();
  return new Date(guess.getTime() - offsetMs).toISOString();
}

/**
 * Expand OCR medications into scheduled reminder drafts.
 * Skips as-needed meds. Uses durationDays (default 7 when missing/0).
 */
export function expandMedicationsToReminders(input: {
  patientName: string;
  medications: ExtractedMedication[];
  phoneNumber: string;
  timezone: string;
  startDate?: Date;
}): ReminderDraft[] {
  const start = input.startDate ?? new Date();
  const drafts: ReminderDraft[] = [];

  for (const med of input.medications) {
    if (med.asNeeded) continue;

    const times = doseTimesForFrequency(med.frequency);
    if (!times.length) continue;

    const days = med.durationDays > 0 ? Math.min(med.durationDays, 30) : 7;

    // Calendar "today" in the caregiver's timezone, then walk dayOffset forward.
    const localParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: input.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(start);
    const y0 = Number(localParts.find((p) => p.type === "year")?.value);
    const m0 = Number(localParts.find((p) => p.type === "month")?.value);
    const d0 = Number(localParts.find((p) => p.type === "day")?.value);

    for (let dayOffset = 0; dayOffset < days; dayOffset++) {
      const base = new Date(Date.UTC(y0, m0 - 1, d0 + dayOffset));
      const y = base.getUTCFullYear();
      const m = base.getUTCMonth() + 1;
      const d = base.getUTCDate();

      for (const time of times) {
        const [hh, mm] = time.split(":").map(Number);
        const scheduledAt = localDateTimeToUtcIso(
          y,
          m,
          d,
          hh,
          mm ?? 0,
          input.timezone,
        );

        if (new Date(scheduledAt).getTime() < Date.now() - 60_000) {
          continue;
        }

        drafts.push({
          patientName: input.patientName,
          medicationName: med.medicationName,
          dosage: med.dosage,
          scheduledAt,
          phoneNumber: input.phoneNumber,
          timezone: input.timezone,
        });
      }
    }
  }

  return drafts;
}
