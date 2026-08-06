import { DevelopmentNotificationProvider } from "./development-provider";
import { TwilioWhatsAppProvider } from "./twilio-whatsapp-provider";
import type { NotificationProvider } from "./types";

export type { NotificationDeliveryResult, NotificationMessage, NotificationProvider } from "./types";
export { DevelopmentNotificationProvider } from "./development-provider";
export { TwilioWhatsAppProvider } from "./twilio-whatsapp-provider";

function twilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM &&
      process.env.TWILIO_WHATSAPP_CONTENT_SID,
  );
}

/** Prefer Twilio when credentials are present; otherwise the no-op development provider. */
export function getNotificationProvider(): NotificationProvider {
  if (twilioConfigured()) {
    return new TwilioWhatsAppProvider();
  }
  return new DevelopmentNotificationProvider();
}
