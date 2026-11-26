import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { FC } from "react";
import { I18NNAMESPACE } from "@/lib/constants";
import { LinkAbhaNumber } from "@/components/LinkAbhaNumber";
import { Patient } from "@/types/patient";
import { WithMeta } from "@/types/meta";
import { apis } from "@/apis";
import { errorMessage } from "@/apis/request";
import { toast } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type PatientHomeActionsProps = {
  patient: Patient;
  facilityId?: string;
  className?: string;
};

const PatientHomeActions: FC<WithMeta<PatientHomeActionsProps>> = ({
  patient,
  facilityId,
  className,
}) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation(I18NNAMESPACE);
  const { data: abhaNumber } = useQuery({
    queryKey: ["abhaNumber", patient.id, facilityId],
    queryFn: () => apis.abhaNumber.get(patient.id, { facility: facilityId }),
    enabled: !!patient.id,
    retry: false,
  });

  const linkAbhaNumberAndPatientMutation = useMutation({
    mutationFn: apis.healthId.linkAbhaNumberAndPatient,
    onSuccess: (data) => {
      if (data) {
        toast.success(data.detail || t("abha_number_linked_successfully"));
        queryClient.invalidateQueries({ queryKey: ["abhaNumber", patient.id] });
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("error_linking_abha_number")));
    },
  });

  // A linked patient can only be verified again at a facility.
  if (abhaNumber && !facilityId) {
    return null;
  }

  return (
    <LinkAbhaNumber
      facilityId={facilityId}
      label={
        abhaNumber &&
        (abhaNumber.auth ? t("reverify_abha") : t("verify_abha_at_facility"))
      }
      onSuccess={(verifiedAbhaNumber) => {
        if (!facilityId) return;

        linkAbhaNumberAndPatientMutation.mutate({
          patient: patient.id,
          abha_number: verifiedAbhaNumber.external_id,
          facility: facilityId,
        });
      }}
      variant="outline"
      className={className}
    />
  );
};

export default PatientHomeActions;
