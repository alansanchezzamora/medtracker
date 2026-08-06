export type DoseState = "Taken" | "Missed" | "Next dose" | "Upcoming";

export type Dose = {
  id: string;
  time: string; // "HH:mm" in the caregiver's local/profile timezone display
  medicine: string;
  amount: string;
  child: string;
  patientId: string;
  state: DoseState;
  detail?: string;
  /** Reminder row status from Supabase, when known */
  reminderStatus?: string;
};

export type SchedulePatient = {
  id: string;
  name: string;
  initial: string;
  tone: "peach" | "blue";
  adherence: string;
};
