import { apis } from "@/apis";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FC } from "react";
import { LinkAbhaNumber } from "@/components/LinkAbhaNumber";
import { toast } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Patient } from "@/types/patient";

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

  const { data: healthFacility } = useQuery({
    queryKey: ["healthFacility", facilityId],
    queryFn: () => apis.healthFacility.get(facilityId!),
    enabled: !!facilityId,
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <LinkAbhaNumber
                disabled={!healthFacility}
                onSuccess={(abhaNumber) => {
                  linkAbhaNumberAndPatientMutation.mutate({
                    patient: patient.id,
                    abha_number: abhaNumber.external_id,
                  });
                }}
                className={className}
              />
            </TooltipTrigger>
            {!healthFacility && (
              <TooltipContent>
                <p>
                  Abha linking is disabled for this facility as it doesn't have
                  health facility id configured.
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );
};

export default PatientHomeActions;
