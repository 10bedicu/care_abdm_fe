import { useMutation, useQuery } from "@tanstack/react-query";

import { FC } from "react";
import { I18NNAMESPACE } from "@/lib/constants";
import { LinkAbhaNumber } from "@/components/LinkAbhaNumber";
import { Patient } from "@/types/patient";
import { WithMeta } from "@/types/meta";
import { apis } from "@/apis";
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
  const { t } = useTranslation(I18NNAMESPACE);
  const { data: abhaNumber, refetch } = useQuery({
    queryKey: ["abhaNumber", patient.id],
    queryFn: () => apis.abhaNumber.get(patient.id),
    enabled: !!patient.id,
  });

  const linkAbhaNumberAndPatientMutation = useMutation({
    mutationFn: apis.healthId.linkAbhaNumberAndPatient,
    onSuccess: (data) => {
      if (data) {
        toast.success(data.detail || t("abha_number_linked_successfully"));
        refetch();
      }
    },
    onError: (error) => {
      toast.error(error.message || t("error_linking_abha_number"));
    },
  });

  return (
    <>
      {!abhaNumber && (
        <LinkAbhaNumber
          facilityId={facilityId}
          onSuccess={(abhaNumber) => {
            linkAbhaNumberAndPatientMutation.mutate({
              patient: patient.id,
              abha_number: abhaNumber.external_id,
            });
          }}
          className={className}
        />
      )}
    </>
  );
};

export default PatientHomeActions;
