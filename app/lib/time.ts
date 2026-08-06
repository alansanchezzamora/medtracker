import type { Dose, DoseState } from "./schedule/types";

// Helpers for greetings, date labels, and "is this dose next?" against the client's clock.

export function minutesFromMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

// Expects "HH:mm" from demo data / forms.
export function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// `undefined` locale = whatever the browser is set to.
export function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date);
}

export function formatMonthDay(date: Date) {
  return new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric" }).format(date);
}

export function formatTodayLabel(date: Date) {
  return `Today, ${formatMonthDay(date)}`;
}

export function formatCountdown(minutesUntilDose: number) {
  if (minutesUntilDose <= 0) return "DUE NOW";
  if (minutesUntilDose < 60) return `IN ${minutesUntilDose} MIN`;

  const hours = Math.floor(minutesUntilDose / 60);
  const minutes = minutesUntilDose % 60;
  if (minutes === 0) return `IN ${hours} HR`;
  return `IN ${hours} HR ${minutes} MIN`;
}

/**
 * Turns today's doses into a live schedule.
 * Confirmed / already-taken rows stay Taken; past unconfirmed → Missed after grace;
 * first remaining is "Next dose".
 */
export function resolveSchedule(doses: Dose[], now: Date, takenIds: ReadonlySet<string> = new Set()): Dose[] {
  const nowMin = minutesFromMidnight(now);
  let nextAssigned = false;

  return doses.map((dose) => {
    if (
      takenIds.has(dose.id) ||
      dose.state === "Taken" ||
      dose.reminderStatus === "taken"
    ) {
      return { ...dose, state: "Taken" as DoseState };
    }

    if (dose.state === "Missed" || dose.reminderStatus === "missed") {
      return { ...dose, state: "Missed" as DoseState };
    }

    const doseMin = parseTimeToMinutes(dose.time);

    // Grace so a dose at 14:00 isn't instantly "past" at 14:01.
    if (doseMin + 20 < nowMin) {
      return { ...dose, state: "Missed" as DoseState };
    }

    if (!nextAssigned) {
      nextAssigned = true;
      return { ...dose, state: "Next dose" as DoseState };
    }

    return { ...dose, state: "Upcoming" as DoseState };
  });
}

export function minutesUntilTime(time: string, now: Date) {
  return parseTimeToMinutes(time) - minutesFromMidnight(now);
}
