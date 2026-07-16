export const patients = [
  { id: "mia", name: "Mia Johnson", initial: "M", tone: "peach", age: "7 years", prescriptions: 1, adherence: "100%", nextDose: "14:00" },
  { id: "leo", name: "Leo Johnson", initial: "L", tone: "blue", age: "4 years", prescriptions: 1, adherence: "92%", nextDose: "18:30" },
];

export const prescriptions = [
  { id: "amoxicillin", patient: "Mia Johnson", patientId: "mia", medicine: "Amoxicillin", dosage: "5 mL", frequency: "3 times daily", schedule: "08:00 · 14:00 · 20:00", refills: "8 days remaining", tone: "peach" },
  { id: "cetirizine", patient: "Leo Johnson", patientId: "leo", medicine: "Cetirizine", dosage: "2.5 mL", frequency: "Once daily", schedule: "18:30", refills: "21 days remaining", tone: "blue" },
];

export type DoseState = "Taken" | "Missed" | "Next dose" | "Upcoming";

export type Dose = {
  id: string;
  time: string;
  medicine: string;
  amount: string;
  child: string;
  patientId: string;
  state: DoseState;
  detail?: string;
};

export const doses: Dose[] = [
  { id: "d1", time: "08:00", medicine: "Amoxicillin", amount: "5 mL", child: "Mia", patientId: "mia", state: "Taken", detail: "with breakfast" },
  { id: "d2", time: "14:00", medicine: "Amoxicillin", amount: "5 mL", child: "Mia", patientId: "mia", state: "Next dose", detail: "after lunch" },
  { id: "d3", time: "18:30", medicine: "Cetirizine", amount: "2.5 mL", child: "Leo", patientId: "leo", state: "Upcoming", detail: "with dinner" },
  { id: "d4", time: "20:00", medicine: "Amoxicillin", amount: "5 mL", child: "Mia", patientId: "mia", state: "Upcoming", detail: "after bedtime story" },
];

export const defaultPreferences = { whatsapp: true, email: true };
