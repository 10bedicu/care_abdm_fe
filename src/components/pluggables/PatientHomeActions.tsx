import { useMutation, useQuery } from "@tanstack/react-query";

import { FC } from "react";
import { LinkAbhaNumber } from "@/components/LinkAbhaNumber";
import { Patient } from "@/types/patient";
import { apis } from "@/apis";
import { toast } from "@/lib/utils";

type PatientHomeActionsProps = {
  patient: Patient;
  facilityId?: string;
  className?: string;
};

const PatientHomeActions: FC<PatientHomeActionsProps> = ({
  patient,
  facilityId,
  className,
}) => {
  const { data: abhaNumber, refetch } = useQuery({
    queryKey: ["abhaNumber", patient.id],
    queryFn: () => apis.abhaNumber.get(patient.id),
    enabled: !!patient.id,
  });

  const linkAbhaNumberAndPatientMutation = useMutation({
    mutationFn: apis.healthId.linkAbhaNumberAndPatient,
    onSuccess: (data) => {
      if (data) {
        toast.success(data.detail);
        refetch();
      }
    },
    onError: (error) => {
      toast.error(error.message);
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
