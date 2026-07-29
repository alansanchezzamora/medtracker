// Tiny className joiner. Skips false/null so `cn("a", isOn && "b")` stays clean.

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// Avatar color tokens used on patient cards.
export const patientTone = {
  peach: "bg-peach-bg text-peach-ink",
  blue: "bg-blue-bg text-blue-ink",
} as const;

export type PatientTone = keyof typeof patientTone;
