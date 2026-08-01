import twilio from "twilio";
import type { TwilioNotificationConfig } from "./config";
import type {
  NotificationDeliveryResult,
  NotificationMessage,
  NotificationProvider,
} from "./types";

interface TwilioMessageResponse {
  sid: string;
  dateCreated?: Date | null;
}

interface TwilioMessageClient {
  messages: {
    create(options: {
      body: string;
      from: string;
      to: string;
    }): Promise<TwilioMessageResponse>;
  };
}

export function formatWhatsAppAddress(phoneNumber: string): string {
  const normalized = phoneNumber.trim();
  return normalized.startsWith("whatsapp:")
    ? normalized
    : `whatsapp:${normalized}`;
}

export class TwilioNotificationProvider
  implements NotificationProvider {
  private readonly client: TwilioMessageClient;

  constructor(
    private readonly config: TwilioNotificationConfig,
    client?: TwilioMessageClient,
  ) {
    this.client =
      client ??
      (twilio(config.accountSid, config.authToken) as TwilioMessageClient);
  }

  async send(
    message: NotificationMessage,
  ): Promise<NotificationDeliveryResult> {
    if (
      !message.reminderId.trim() ||
      !message.recipientPhoneNumber.trim() ||
      !message.body.trim()
    ) {
      return {
        status: "failed",
        providerMessageId: null,
        deliveredAt: null,
        error: "Reminder ID, recipient phone number, and message are required.",
      };
    }

    try {
      const response = await this.client.messages.create({
        body: message.body,
        from: formatWhatsAppAddress(this.config.whatsappFrom),
        to: formatWhatsAppAddress(message.recipientPhoneNumber),
      });

      return {
        status: "sent",
        providerMessageId: response.sid,
        deliveredAt: (response.dateCreated ?? new Date()).toISOString(),
        error: null,
      };
    } catch {
      return {
        status: "failed",
        providerMessageId: null,
        deliveredAt: null,
        error: "Twilio could not send the WhatsApp notification.",
      };
    }
  }
}
