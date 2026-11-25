export type Patient = {
  id: string;
  name: string;
  gender: "male" | "female" | "transgender";
  phone_number: string;
  date_of_birth?: string | null;
  year_of_birth?: number | null;

  [key: string]: unknown;
};

export type PartialPatient = {
  id: string;
  name: string;
  gender: "male" | "female" | "transgender";
  phone_number: string;
  partial_id: string;
};
