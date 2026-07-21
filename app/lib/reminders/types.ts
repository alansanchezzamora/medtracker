export const REMINDER_STATUSES = [
  "pending",
  "sent",
  "failed",
  "cancelled",
] as const;

export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export interface MedicationReminderInput {
  patientName: string;
  medicationName: string;
  dosage: string;
  scheduledAt: string;
  phoneNumber: string;
  timezone: string;
}

export interface MedicationReminder extends MedicationReminderInput {
  id: string;
  userId: string;
  status: ReminderStatus;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  failureReason: string | null;
}
