import { FC, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { I18NNAMESPACE } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkAbhaNumber } from "../LinkAbhaNumber";
import { ShowAbhaProfile } from "../LinkAbhaNumber/ShowAbhaProfile";
import { UseFormReturn } from "react-hook-form";
import { WithMeta } from "@/types/meta";
import { apis } from "@/apis";
import { toast } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type PatientRegistrationFormProps = {
  form: UseFormReturn;
  facilityId?: string;
  patientId?: string;
};

const setFormValueOpts = { shouldDirty: true } as const;

const PatientRegistrationForm: FC<WithMeta<PatientRegistrationFormProps>> = ({
  form,
  facilityId,
  patientId,
  __meta,
}) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation(I18NNAMESPACE);

  const { data: abhaNumber } = useQuery({
    queryKey: ["abhaNumber", patientId],
    queryFn: () => apis.abhaNumber.get(patientId!),
    enabled: !!patientId,
    retry: false,
  });

  const patientName = form.watch("name");

  useEffect(() => {
    if (abhaNumber) {
      form.setValue("abha_id", abhaNumber.external_id, setFormValueOpts);
      form.setValue("abha_number", abhaNumber.abha_number, setFormValueOpts);
      form.setValue("abha_address", abhaNumber.health_id, setFormValueOpts);
    }
  }, [abhaNumber, patientName, form]);

  const linkAbhaNumberAndPatientMutation = useMutation({
    mutationFn: apis.healthId.linkAbhaNumberAndPatient,
    onSuccess: (data) => {
      if (data) {
        toast.success(data.detail || t("abha_number_linked_successfully"));
        queryClient.invalidateQueries({ queryKey: ["abhaNumber", patientId] });
      }
    },
    onError: (error) => {
      toast.error(error.message || t("error_linking_abha_number"));
    },
  });

  useEffect(() => {
    let isFirstSuccess = true;

    queryClient.getMutationCache().subscribe(({ mutation }) => {
      if (
        isFirstSuccess &&
        mutation?.state.status === "success" &&
        (mutation?.options.mutationKey?.includes("create_patient") ||
          mutation?.options.mutationKey?.includes("update_patient")) &&
        mutation?.state.data?.id &&
        form.watch("abha_id") &&
        !abhaNumber?.patient
      ) {
        isFirstSuccess = false;

        linkAbhaNumberAndPatientMutation.mutate({
          patient: mutation.state.data.id,
          abha_number: form.watch("abha_id"),
        });
      }
    });
  }, [queryClient]);

  const autofillGeoOrganizationMutation = useMutation({
    mutationFn: apis.govtOrganization.list,
    onSuccess: (data) => {
      if (data.results.length === 0) {
        return;
      }

      form.setValue("_selected_levels", data.results, setFormValueOpts);
      form.setValue("geo_organization", data.results[0].id, setFormValueOpts);
    },
  });

  const abhaId = form.watch("abha_id");

  if (!abhaId && !abhaNumber) {
    return (
      <div className="abdm-container flex justify-end w-full">
        <LinkAbhaNumber
          enforceLinking={__meta?.config?.enforceAbhaNumberLinking}
          backUrl={
            __meta?.config?.enforceAbhaNumberLinking
              ? `/facility/${facilityId}/patients`
              : undefined
          }
          facilityId={facilityId}
          type="button"
          variant="outline"
          className="text-primary border-primary-400"
          onSuccess={(abhaNumber) => {
            form.setValue("abha", abhaNumber, setFormValueOpts);

            form.setValue("abha_id", abhaNumber.external_id, setFormValueOpts);
            form.setValue("abha_number", abhaNumber.abha_number, setFormValueOpts);
            form.setValue("abha_address", abhaNumber.health_id, setFormValueOpts);

            if (patientId) {
              linkAbhaNumberAndPatientMutation.mutate({
                patient: patientId,
                abha_number: form.getValues("abha_id"),
              });
              return;
            }

            form.setValue("name", abhaNumber.name, setFormValueOpts);
            form.setValue(
              "phone_number",
              "+91" + abhaNumber.mobile?.replace("+91", ""),
              setFormValueOpts
            );
            form.setValue("age_or_dob", "dob", setFormValueOpts);
            form.setValue(
              "date_of_birth",
              abhaNumber.date_of_birth,
              setFormValueOpts
            );
            form.setValue("blood_group", "unknown", setFormValueOpts);
            form.setValue(
              "gender",
              { M: "male", F: "female", O: "transgender" }[abhaNumber.gender] ??
                "transgender",
              setFormValueOpts
            );
            form.setValue("address", abhaNumber.address, setFormValueOpts);
            form.setValue(
              "permanent_address",
              abhaNumber.address,
              setFormValueOpts
            );
            form.setValue(
              "pincode",
              abhaNumber.pincode && Number(abhaNumber.pincode),
              setFormValueOpts
            );

            if (abhaNumber.district) {
              autofillGeoOrganizationMutation.mutate({
                org_type: "govt",
                name: abhaNumber.district,
                limit: 1,
              });
            }
          }}
        />
      </div>
    );
  }

  const abhaProfile = abhaNumber || form.getValues("abha");

  return (
    <div id="abha-info" className="abdm-container space-y-6">
      <div>
        <h2 className="text-lg font-semibold">ABHA Info</h2>
        <div className="text-sm">
          ABHA ID is part of an ABDM's initiative to enhance patient care and
          improve patient outcomes.
        </div>
      </div>

      <div className="space-y-1">
        <Label>ABHA Number</Label>
        <Input
          value={abhaNumber?.abha_number || form.watch("abha_number") || ""}
          disabled
        />
      </div>

      <div className="space-y-1">
        <Label>ABHA Address</Label>
        <Input
          value={abhaNumber?.health_id || form.watch("abha_address") || ""}
          disabled
        />
      </div>

      {abhaProfile && <ShowAbhaProfile abhaNumber={abhaProfile} />}
    </div>
  );
};

export default PatientRegistrationForm;
