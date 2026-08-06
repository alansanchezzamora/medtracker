/**
 * Log the real error server-side (for debugging) and return a safe, friendly
 * message for the UI. Keeps internal details (raw DB errors, env var names,
 * upstream API failures) out of what end users actually see.
 */
export function toUserMessage(
  scope: string,
  error: unknown,
  friendly = "Something went wrong. Please try again.",
): string {
  const detail =
    error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
  console.error(`[${scope}] ${detail}`);
  return friendly;
}
