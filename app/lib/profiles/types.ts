export type CarePreferences = {
  phoneNumber: string;
  whatsapp: boolean;
  email: boolean;
  timezone: string;
};

export type ProfileRow = {
  id: string;
  phone_number: string | null;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
  timezone: string;
};
