import type { MedicationReminderInput } from "./types";

export interface ReminderValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof MedicationReminderInput, string>>;
  value?: MedicationReminderInput;
}

const INTERNATIONAL_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

export function validateMedicationReminder(
  input: MedicationReminderInput,
): ReminderValidationResult {
  const value: MedicationReminderInput = {
    patientName: input.patientName.trim(),
    medicationName: input.medicationName.trim(),
    dosage: input.dosage.trim(),
    scheduledAt: input.scheduledAt.trim(),
    phoneNumber: input.phoneNumber.trim(),
    timezone: input.timezone.trim(),
  };

  const errors: ReminderValidationResult["errors"] = {};

  if (!value.patientName) {
    errors.patientName = "Patient name is required.";
  }

  if (!value.medicationName) {
    errors.medicationName = "Medication name is required.";
  }

  if (!value.dosage) {
    errors.dosage = "Dosage is required.";
  }

  const scheduledDate = new Date(value.scheduledAt);

  if (!value.scheduledAt || Number.isNaN(scheduledDate.getTime())) {
    errors.scheduledAt = "A valid reminder date and time is required.";
  }

  if (!INTERNATIONAL_PHONE_PATTERN.test(value.phoneNumber)) {
    errors.phoneNumber =
      "Phone number must use international format, for example +256700000000.";
  }

  if (!value.timezone || !isValidTimezone(value.timezone)) {
    errors.timezone = "A valid IANA timezone is required.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    value,
  };
}
