export type NotificationProviderName = "development" | "twilio";

export interface TwilioNotificationConfig {
  accountSid: string;
  authToken: string;
  whatsappFrom: string;
}

export function getNotificationProviderName(
  env: NodeJS.ProcessEnv = process.env,
): NotificationProviderName {
  const provider = (env.NOTIFICATION_PROVIDER || "development")
    .trim()
    .toLowerCase();

  if (provider !== "development" && provider !== "twilio") {
    throw new Error("NOTIFICATION_PROVIDER must be development or twilio.");
  }

  return provider;
}

export function getTwilioNotificationConfig(
  env: NodeJS.ProcessEnv = process.env,
): TwilioNotificationConfig {
  const accountSid = env.TWILIO_ACCOUNT_SID?.trim() || "";
  const authToken = env.TWILIO_AUTH_TOKEN?.trim() || "";
  const whatsappFrom = env.TWILIO_WHATSAPP_FROM?.trim() || "";

  const missing: string[] = [];

  if (!accountSid) missing.push("TWILIO_ACCOUNT_SID");
  if (!authToken) missing.push("TWILIO_AUTH_TOKEN");
  if (!whatsappFrom) missing.push("TWILIO_WHATSAPP_FROM");

  if (missing.length > 0) {
    throw new Error(
      `Twilio notification configuration is incomplete. Missing: ${missing.join(", ")}.`,
    );
  }

  return { accountSid, authToken, whatsappFrom };
}
