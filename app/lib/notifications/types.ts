export interface NotificationMessage {
  recipientPhoneNumber: string;
  body: string;
  reminderId: string;
}

export interface NotificationDeliveryResult {
  status: "sent" | "failed";
  providerMessageId: string | null;
  deliveredAt: string | null;
  error: string | null;
}

export interface NotificationProvider {
  send(
    message: NotificationMessage,
  ): Promise<NotificationDeliveryResult>;
}
