import type {
  NotificationDeliveryResult,
  NotificationMessage,
  NotificationProvider,
} from "./types";

export class DevelopmentNotificationProvider
  implements NotificationProvider
{
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

    return {
      status: "sent",
      providerMessageId: `development-${message.reminderId}`,
      deliveredAt: new Date().toISOString(),
      error: null,
    };
  }
}
