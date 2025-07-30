import {
  ConsentAccessMode,
  ConsentFrequencyUnit,
  ConsentHIType,
  ConsentPurpose,
  ConsentRequest,
} from "../types/consent";
import { queryString, request } from "./request";

import { AbhaNumber } from "../types/abhaNumber";
import { HealthFacility } from "../types/healthFacility";
import { HealthInformation } from "../types/healthInformation";
import { PaginatedResponse } from "./types";
import { User } from "@/types/user";

// FIXME: Move all the api specific types to a ./types.ts file

export const apis = {
  consent: {
    list: async (query?: {
      facility?: string;
      patient?: string;
      ordering?: string;
    }) => {
      return await request<PaginatedResponse<ConsentRequest>>(
        "/api/abdm/consent/" + queryString(query)
      );
    },

    create: async (body: {
      patient_abha: string;
      hi_types: ConsentHIType[];
      purpose: ConsentPurpose;
      from_time: Date | string;
      to_time: Date | string;
      expiry: Date | string;

      access_mode?: ConsentAccessMode;
      frequency_unit?: ConsentFrequencyUnit;
      frequency_value?: number;
      frequency_repeats?: number;
      hip?: null | string;
    }) => {
      return await request<ConsentRequest>("/api/abdm/consent/", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    get: async (id: string) => {
      return await request<ConsentRequest>(`/api/abdm/consent/${id}/`);
    },

    checkStatus: async (consentRequest: string) => {
      return await request<{ detail: string }>(
        "/api/abdm/v3/hiu/consent_request_status/",
        {
          method: "POST",
          body: JSON.stringify({ consent_request: consentRequest }),
        }
      );
    },
  },

  healthInformation: {
    get: async (artefactId: string) => {
      return await request<HealthInformation>(
        `/api/abdm/health_information/${artefactId}`
      );
    },
  },

  healthFacility: {
    list: async () => {
      return await request<PaginatedResponse<HealthFacility>>(
        "/api/abdm/health_facility/"
      );
    },

    create: async (body: { facility: string; hf_id: string }) => {
      return await request<HealthFacility>("/api/abdm/health_facility/", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    get: async (facilityId: string) => {
      return await request<HealthFacility>(
        `/api/abdm/health_facility/${facilityId}/`
      );
    },

    update: async (
      facilityId: string,
      body: {
        facility: string;
        hf_id: string;
      }
    ) => {
      return await request<HealthFacility>(
        `/api/abdm/health_facility/${facilityId}/`,
        {
          method: "PUT",
          body: JSON.stringify(body),
        }
      );
    },

    partialUpdate: async (
      facilityId: string,
      body: {
        hf_id?: string;
      }
    ) => {
      return await request<HealthFacility>(
        `/api/abdm/health_facility/${facilityId}/`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        }
      );
    },

    registerAsService: async (facilityId: string) => {
      return await request<HealthFacility>(
        `/api/abdm/health_facility/${facilityId}/register_service/`,
        {
          method: "POST",
        }
      );
    },
  },

  abhaNumber: {
    get: async (abhaNumberId: string) => {
      return await request<AbhaNumber>(
        `/api/abdm/abha_number/${abhaNumberId}/`
      );
    },

    create: async (body: Partial<AbhaNumber>) => {
      return await request<AbhaNumber>("/api/abdm/abha_number/", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },

  healthId: {
    abhaCreateVerifyAadhaarDemographics: async (body: {
      transaction_id?: string;
      name: string;
      date_of_birth: string;
      gender: "M" | "F" | "O";
      state_code: string;
      district_code: string;
      pin_code?: string;
      address?: string;
      mobile?: string;
      profile_photo?: string;
      aadhaar: string;
    }) => {
      return await request<{
        transaction_id: string;
        is_new: boolean;
        abha_number: AbhaNumber;
      }>("/api/abdm/v3/health_id/create/verify_aadhaar_demographics/", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    abhaCreateSendAadhaarOtp: async (body: {
      aadhaar: string;
      transaction_id?: string;
    }) => {
      return await request<{
        transaction_id: string;
        detail: string;
      }>("/api/abdm/v3/health_id/create/send_aadhaar_otp/", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    abhaCreateVerifyAadhaarOtp: async (body: {
      transaction_id: string;
      otp: string;
      mobile: string;
    }) => {
      return await request<{
        transaction_id: string;
        detail: string;
        is_new: boolean;
        abha_number: AbhaNumber;
      }>("/api/abdm/v3/health_id/create/verify_aadhaar_otp/", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    abhaCreateLinkMobileNumber: async (body: {
      transaction_id: string;
      mobile: string;
    }) => {
      return await request<{
        transaction_id: string;
        detail: string;
      }>("/api/abdm/v3/health_id/create/link_mobile_number/", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    abhaCreateVerifyMobileNumber: async (body: {
      transaction_id: string;
      otp: string;
    }) => {
      return await request<{
        transaction_id: string;
        detail: string;
      }>("/api/abdm/v3/health_id/create/verify_mobile_otp/", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    abhaCreateAbhaAddressSuggestion: async (body: {
      transaction_id: string;
    }) => {
      return await request<{
        transaction_id: string;
        abha_addresses: string[];
      }>("/api/abdm/v3/health_id/create/abha_address_suggestion/", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    abhaCreateEnrolAbhaAddress: async (body: {
      transaction_id: string;
      abha_address: string;
    }) => {
      return await request<{
        detail?: string;
        transaction_id: string;
        health_id: string;
        preferred_abha_address: string;
        abha_number: AbhaNumber;
      }>("/api/abdm/v3/health_id/create/enrol_abha_address/", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    linkAbhaNumberAndPatient: async (body: {
      abha_number: string;
      patient: string;
    }) => {
      return await request<{
        detail: string;
      }>("/api/abdm/v3/health_id/link_patient/", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    abhaLoginCheckAuthMethods: async (body: { abha_address: string }) => {
      return await request<{
        abha_number: string;
        auth_methods: string[];
      }>("/api/abdm/v3/health_id/login/check_auth_methods/", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    abhaLoginSendOtp: async (body: {
      value: string;
      type: "abha-number" | "abha-address" | "mobile" | "aadhaar";
      otp_system: "abdm" | "aadhaar";
    }) => {
      return await request<{
        transaction_id: string;
        detail: string;
      }>("/api/abdm/v3/health_id/login/send_otp/", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    abhaLoginVerifyOtp: async (body: {
      type: "abha-number" | "abha-address" | "mobile" | "aadhaar";
      otp: string;
      transaction_id: string;
      otp_system: "abdm" | "aadhaar";
    }) => {
      return await request<{
        abha_number: AbhaNumber;
        created: boolean;
      }>("/api/abdm/v3/health_id/login/verify_otp/", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    getAbhaCard: async (query: { abha_id?: string; type: "pdf" | "png" }) => {
      return await request<Blob>(
        "/api/abdm/v3/health_id/abha_card/" + queryString(query)
      );
    },
  },

  utility: {
    states: async () => {
      return await request<
        {
          state_name: string;
          state_code: number;
        }[]
      >("/api/abdm/v3/utility/states/");
    },

    districts: async (stateId: number) => {
      return await request<
        {
          district_name: string;
          district_code: number;
        }[]
      >(`/api/abdm/v3/utility/states/${stateId}/districts/`);
    },
  },

  user: {
    getCurrentUser: async () => {
      return await request<User>("/api/v1/users/getcurrentuser/");
    },
  },
};
