export type AbhaAuth = {
  id: string;
  abha_address: string;
  method: "scan_and_share" | "staff_verification" | "abha_creation" | "legacy";
  created_date: string;
};

export type AbhaNumber = {
  id: number;
  external_id: string;
  created_date: string;
  modified_date: string;
  abha_number: string;
  // Address on the latest valid auth at the facility in context, else anywhere.
  abha_address: string | null;
  // Latest valid auth at the facility in context, null when there is none.
  auth: AbhaAuth | null;
  name: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  gender: "F" | "M" | "O";
  date_of_birth: string | null;
  address: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  mobile: string | null;
  email: string | null;
  profile_photo: string | null;
  new: boolean;
  patient: string | null;
  patient_object: unknown | null; // FIXME: Patient type
};

export type AbhaLoginAccount = {
  id: number;
  abha_number: string | null;
  preferred_abha_address: string | null;
  name: string | null;
  gender: "F" | "M" | "O" | null;
  date_of_birth: string | null;
  profile_photo: string | null;
};
