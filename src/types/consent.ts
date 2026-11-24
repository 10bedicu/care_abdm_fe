import { AbhaNumber } from "./abhaNumber";
import { User } from "./user";

export const CONSENT_PURPOSES = [
  "CAREMGT",
  "BTG",
  "PUBHLTH",
  "HPAYMT",
  "DSRCH",
  "PATRQT",
] as const;

export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export const CONSENT_STATUSES = [
  "REQUESTED",
  "GRANTED",
  "DENIED",
  "EXPIRED",
  "REVOKED",
] as const;

export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

export const CONSENT_HI_TYPES = [
  "Prescription",
  "DiagnosticReport",
  "OPConsultation",
  "DischargeSummary",
  "ImmunizationRecord",
  "HealthDocumentRecord",
  "WellnessRecord",
] as const;

export type ConsentHIType = (typeof CONSENT_HI_TYPES)[number];

export const CONSENT_ACCESS_MODES = [
  "VIEW",
  "STORE",
  "QUERY",
  "STREAM",
] as const;

export type ConsentAccessMode = (typeof CONSENT_ACCESS_MODES)[number];

export const CONSENT_FREQUENCY_UNITS = [
  "HOUR",
  "DAY",
  "WEEK",
  "MONTH",
  "YEAR",
] as const;

export type ConsentFrequencyUnit = (typeof CONSENT_FREQUENCY_UNITS)[number];

export type ConsentCareContext = {
  patientReference: string;
  careContextReference: string;
};

export type Consent = {
  id: string;
  consent_id: null | string;

  abha_address: string;
  care_contexts: ConsentCareContext[];

  status: ConsentStatus;
  purpose: ConsentPurpose;
  hi_types: ConsentHIType[];

  access_mode: ConsentAccessMode;
  from_time: string;
  to_time: string;
  expiry: string;

  frequency_unit: ConsentFrequencyUnit;
  frequency_value: number;
  frequency_repeats: number;

  hip: null | string;
  hiu: null | string;

  created_date: string;
  modified_date: string;
};

export type ConsentArtefact = {
  consent_request: string;

  cm: null | string;
} & Consent;

export type ConsentRequest = {
  requester: User;
  abha_number_object: AbhaNumber;
  consent_artefacts: ConsentArtefact[];
} & Consent;
