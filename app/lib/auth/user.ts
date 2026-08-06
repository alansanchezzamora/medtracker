// Shape we actually show in the UI. Keeps components away from raw Supabase User.

export type UserProfile = {
  email: string;
  displayName: string;
  firstName: string;
  initials: string;
};

type AuthUserLike = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

// "jane.doe" → "Jane Doe" when someone signs up with email only.
function titleCaseFromLocalPart(local: string) {
  const words = local
    .replace(/[._+-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return local;

  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export function profileFromUser(user: AuthUserLike | null | undefined): UserProfile | null {
  if (!user?.email) return null;

  const meta = user.user_metadata ?? {};
  const metaName =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    "";

  // Prefer the name they set in Settings; fall back to the email local part.
  const displayName = metaName || titleCaseFromLocalPart(user.email.split("@")[0] ?? "Caregiver");
  const firstName = displayName.split(/\s+/)[0] || displayName;
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    email: user.email,
    displayName,
    firstName,
    initials: initials || "ME",
  };
}
