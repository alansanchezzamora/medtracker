import twilio from "twilio";
import type {
  NotificationDeliveryResult,
  NotificationMessage,
  NotificationProvider,
} from "./types";

function toWhatsAppAddress(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("whatsapp:")) return trimmed;
  if (trimmed.startsWith("+")) return `whatsapp:${trimmed}`;
  return `whatsapp:+${trimmed.replace(/\D/g, "")}`;
}

type TwilioLikeError = {
  message?: string;
  code?: number | string;
  status?: number;
  moreInfo?: string;
};

function formatTwilioError(error: unknown): string {
  const err = error as TwilioLikeError;
  const code = err?.code != null ? Number(err.code) : null;
  const base = err?.message || "Twilio WhatsApp send failed.";

  if (code === 63038) {
    return "Twilio WhatsApp Sandbox daily limit reached (5 messages). Wait until the limit resets (usually next day UTC), or upgrade the Twilio account.";
  }
  if (code === 63003 || code === 21211) {
    return "Invalid WhatsApp number. Use E.164 (e.g. +233…) and confirm the phone has WhatsApp.";
  }
  if (code === 63016 || code === 63007) {
    return "That number is not joined to the Twilio WhatsApp Sandbox. Text join <code> to +1 415 523 8886, then try again.";
  }
  if (code === 21608 || code === 21610) {
    return "Recipient is not allowed on this Twilio trial/sandbox. Join the WhatsApp Sandbox first.";
  }

  return code ? `${base} (Twilio ${code})` : base;
}

export class TwilioWhatsAppProvider implements NotificationProvider {
  private readonly client: ReturnType<typeof twilio>;
  private readonly from: string;
  private readonly contentSid: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const from = process.env.TWILIO_WHATSAPP_FROM?.trim();
    const contentSid = process.env.TWILIO_WHATSAPP_CONTENT_SID?.trim();

    if (!accountSid || !authToken || !from || !contentSid) {
      throw new Error(
        "Twilio WhatsApp requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, and TWILIO_WHATSAPP_CONTENT_SID.",
      );
    }

    this.client = twilio(accountSid, authToken);
    this.from = from;
    this.contentSid = contentSid;
  }

  async send(
    message: NotificationMessage,
  ): Promise<NotificationDeliveryResult> {
    if (
      !message.reminderId.trim() ||
      !message.recipientPhoneNumber.trim()
    ) {
      return {
        status: "failed",
        providerMessageId: null,
        deliveredAt: null,
        error: "Reminder ID and recipient phone number are required.",
      };
    }

    const variables = message.templateVariables ?? {
      "1": message.body.slice(0, 60) || "medication",
      "2": "soon",
    };

    // Sandbox Appointment Reminders expects two body variables.
    const contentVariables = JSON.stringify({
      "1": String(variables["1"] ?? "medication").slice(0, 100),
      "2": String(variables["2"] ?? "soon").slice(0, 100),
    });

    try {
      const result = await this.client.messages.create({
        from: this.from,
        to: toWhatsAppAddress(message.recipientPhoneNumber),
        contentSid: this.contentSid,
        contentVariables,
      });

      return {
        status: "sent",
        providerMessageId: result.sid,
        deliveredAt: new Date().toISOString(),
        error: null,
      };
    } catch (error) {
      return {
        status: "failed",
        providerMessageId: null,
        deliveredAt: null,
        error: formatTwilioError(error),
      };
    }
  }
}
