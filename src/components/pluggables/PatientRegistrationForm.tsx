import { FC, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AbdmScope } from "@/components/AbdmScope";
import { Field, FieldLabel } from "@/components/ui/field";
import { I18NNAMESPACE } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { LinkAbhaNumber } from "../LinkAbhaNumber";
import { ShowAbhaProfile } from "../LinkAbhaNumber/ShowAbhaProfile";
import { UseFormReturn } from "react-hook-form";
import { WithMeta } from "@/types/meta";
import { apis } from "@/apis";
import { errorMessage } from "@/apis/request";
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
    queryKey: ["abhaNumber", patientId, facilityId],
    queryFn: () => apis.abhaNumber.get(patientId!, { facility: facilityId }),
    enabled: !!patientId,
    retry: false,
  });

  const patientName = form.watch("name");

  useEffect(() => {
    if (abhaNumber) {
      form.setValue("abha_id", abhaNumber.external_id, setFormValueOpts);
      form.setValue("abha_number", abhaNumber.abha_number, setFormValueOpts);
      form.setValue("abha_address", abhaNumber.abha_address, setFormValueOpts);
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
      toast.error(errorMessage(error, t("error_linking_abha_number")));
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
        facilityId &&
        !abhaNumber?.patient
      ) {
        isFirstSuccess = false;

        linkAbhaNumberAndPatientMutation.mutate({
          patient: mutation.state.data.id,
          abha_number: form.watch("abha_id"),
          facility: facilityId,
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
    onError: (error) => {
      toast.warning(errorMessage(error, t("error_autofilling_district")));
    },
  });

  const abhaId = form.watch("abha_id");

  if (!abhaId && !abhaNumber) {
    return (
      <LinkAbhaNumber
        enforceLinking={__meta?.config?.enforceAbhaNumberLinking}
        backUrl={
          __meta?.config?.enforceAbhaNumberLinking
            ? `/facility/${facilityId}/patients`
            : undefined
        }
        facilityId={facilityId}
        variant="outline_primary"
        onSuccess={(abhaNumber) => {
          form.setValue("abha", abhaNumber, setFormValueOpts);

          form.setValue("abha_id", abhaNumber.external_id, setFormValueOpts);
          form.setValue(
            "abha_number",
            abhaNumber.abha_number,
            setFormValueOpts,
          );
          form.setValue(
            "abha_address",
            abhaNumber.abha_address,
            setFormValueOpts,
          );

          if (patientId) {
            if (facilityId) {
              linkAbhaNumberAndPatientMutation.mutate({
                patient: patientId,
                abha_number: form.getValues("abha_id"),
                facility: facilityId,
              });
            }
            return;
          }

          form.setValue("name", abhaNumber.name, setFormValueOpts);
          form.setValue(
            "phone_number",
            "+91" + abhaNumber.mobile?.replace("+91", ""),
            setFormValueOpts,
          );
          form.setValue("age_or_dob", "dob", setFormValueOpts);
          form.setValue(
            "date_of_birth",
            abhaNumber.date_of_birth,
            setFormValueOpts,
          );
          form.setValue("blood_group", "unknown", setFormValueOpts);
          form.setValue(
            "gender",
            { M: "male", F: "female", O: "transgender" }[abhaNumber.gender] ??
              "transgender",
            setFormValueOpts,
          );
          const address = abhaNumber.address?.trim();
          if (address) {
            form.setValue("address", address, setFormValueOpts);
            form.setValue("permanent_address", address, setFormValueOpts);
          }

          const pincode = abhaNumber.pincode?.trim();
          if (pincode) {
            form.setValue("pincode", Number(pincode), setFormValueOpts);
          }

          if (abhaNumber.district) {
            autofillGeoOrganizationMutation.mutate({
              org_type: "govt",
              name: abhaNumber.district,
              limit: 1,
            });
          }
        }}
      />
    );
  }

  const abhaProfile = abhaNumber || form.getValues("abha");

  return (
    <AbdmScope>
      {/* A card like the host's "Patient Basics" and "Additional Details". */}
      <section
        id="abha-info"
        className="flex flex-col gap-4 rounded-md bg-card p-6 text-card-foreground shadow"
      >
        <div>
          <h5 className="text-lg font-semibold">{t("abha_info")}</h5>
          <p className="text-sm text-muted-foreground">
            {t("abha_info_description")}
          </p>
        </div>

        <div className="flex flex-col gap-6 px-1">
          <Field>
            <FieldLabel htmlFor="abha-info-number">{t("abha_number")}</FieldLabel>
            <Input
              id="abha-info-number"
              value={abhaNumber?.abha_number || form.watch("abha_number") || ""}
              disabled
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="abha-info-address">{t("abha_address")}</FieldLabel>
            <Input
              id="abha-info-address"
              value={abhaNumber?.abha_address || form.watch("abha_address") || ""}
              disabled
            />
          </Field>

          {abhaProfile && (
            <div>
              <ShowAbhaProfile abhaNumber={abhaProfile} />
            </div>
          )}
        </div>
      </section>
    </AbdmScope>
  );
};

export default PatientRegistrationForm;
