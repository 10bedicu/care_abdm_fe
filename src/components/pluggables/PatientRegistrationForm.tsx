import { FC, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apis } from "@/apis";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LinkAbhaNumber } from "../LinkAbhaNumber";
import { toast } from "@/lib/utils";

type PatientRegistrationFormProps = {
  form: UseFormReturn;
  facilityId?: string;
  patientId?: string;
};

const PatientRegistrationForm: FC<PatientRegistrationFormProps> = ({
  form,
  facilityId,
  patientId,
}) => {
  const queryClient = useQueryClient();

  const { data: abhaNumber, refetch } = useQuery({
    queryKey: ["abhaNumber", patientId],
    queryFn: () => apis.abhaNumber.get(patientId!),
    enabled: !!patientId,
  });

  const { data: healthFacility } = useQuery({
    queryKey: ["healthFacility", facilityId!],
    queryFn: () => apis.healthFacility.get(facilityId!),
    enabled: !!facilityId!,
  });

  useEffect(() => {
    if (abhaNumber) {
      form.setValue("abha_id", abhaNumber.external_id);
      form.setValue("abha_number", abhaNumber.abha_number);
      form.setValue("abha_address", abhaNumber.health_id);
    }
  }, [abhaNumber]);

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

  useEffect(() => {
    let isFirstSuccess = true;

    queryClient.getMutationCache().subscribe(({ mutation }) => {
      if (
        isFirstSuccess &&
        mutation?.state.status === "success" &&
        mutation?.options.mutationKey?.includes("create_patient") &&
        mutation?.state.data?.id
      ) {
        isFirstSuccess = false;

        linkAbhaNumberAndPatientMutation.mutate({
          patient: mutation.state.data.id,
          abha_number: form.watch("abha_id"),
        });
      }
    });
  }, [queryClient]);

  if (!form.watch("abha_id")) {
    return (
      <div className="flex justify-end w-full">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <LinkAbhaNumber
                type="button"
                variant="outline"
                className="text-primary border-primary-400"
                disabled={!healthFacility}
                onSuccess={(abhaNumber) => {
                  form.setValue("abha_id", abhaNumber.external_id);
                  form.setValue("abha_number", abhaNumber.abha_number);
                  form.setValue("abha_address", abhaNumber.health_id);

                  if (patientId) {
                    linkAbhaNumberAndPatientMutation.mutate({
                      patient: patientId,
                      abha_number: form.getValues("abha_id"),
                    });
                    return;
                  }

                  form.setValue("name", abhaNumber.name);
                  form.setValue(
                    "phone_number",
                    "+91" + abhaNumber.mobile?.replace("+91", "")
                  );
                  form.setValue("yob_or_dob", "dob");
                  form.setValue("date_of_birth", abhaNumber.date_of_birth);
                  form.setValue("blood_group", "unknown");
                  form.setValue(
                    "gender",
                    { M: "male", F: "female", O: "transgender" }[
                      abhaNumber.gender
                    ] ?? "transgender"
                  );
                  form.setValue("address", abhaNumber.address);
                  form.setValue("permanent_address", abhaNumber.address);
                  form.setValue(
                    "pincode",
                    abhaNumber.pincode && Number(abhaNumber.pincode)
                  );
                }}
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
      </div>
    );
  }

  return (
    <div id="abha-info" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">ABHA Info</h2>
        <div className="text-sm">
          ABHA ID is part of an ABDM's initiative to enhance patient care and
          improve patient outcomes.
        </div>
      </div>

      <div className="space-y-1">
        <Label>ABHA Number</Label>
        <Input value={form.getValues("abha_number")} disabled />
      </div>

      <div className="space-y-1">
        <Label>ABHA Address</Label>
        <Input value={form.getValues("abha_address")} disabled />
      </div>
    </div>
  );
};

export default PatientRegistrationForm;
