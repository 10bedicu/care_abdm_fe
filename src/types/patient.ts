export type Patient = {
  id: string;

  [key: string]: unknown;
};

export type PartialPatient = {
  id: string;
  name: string;
  gender: "male" | "female" | "transgender";
  phone_number: string;
  partial_id: string;
};
