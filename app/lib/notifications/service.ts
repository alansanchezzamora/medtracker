import { createNotificationProvider } from "./provider";
import type {
  NotificationDeliveryResult,
  NotificationMessage,
  NotificationProvider,
} from "./types";

export async function sendNotification(
  message: NotificationMessage,
  provider: NotificationProvider = createNotificationProvider(),
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

  return provider.send(message);
}
