export interface NotificationMessage {
  recipientPhoneNumber: string;
  body: string;
  reminderId: string;
  /** Twilio Sandbox Appointment Reminders: {{1}} med/date, {{2}} time */
  templateVariables?: Record<string, string>;
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
