import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FC, useMemo, useState } from "react";

import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Patient } from "@/types/patient";
import { Skeleton } from "@/components/ui/skeleton";
import { apis } from "@/apis";
import { navigate } from "raviger";
import { useDebouncedState } from "@/hooks/useDebouncedState";
import { useQuery } from "@tanstack/react-query";

type TokenSearchDialogProps = {
  facilityId: string;
  trigger?: React.ReactNode;
};

const TokenSearchDialog: FC<TokenSearchDialogProps> = ({
  trigger,
  facilityId,
}) => {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<number | undefined>();
  const debouncedToken = useDebouncedState(token, 300);

  const isEnabled = useMemo(
    () =>
      debouncedToken !== undefined &&
      debouncedToken.toString().trim().length > 0,
    [debouncedToken]
  );

  const {
    data: patient,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["patient-by-token", debouncedToken],
    queryFn: () =>
      apis.hip.getPatientByToken({
        token: debouncedToken as number,
        facility_id: facilityId,
      }),
    enabled: isEnabled && open && !!facilityId,
    retry: false,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>Search by Token</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Find Patient by Token</DialogTitle>
          <DialogDescription>
            Enter the scan and share token number to fetch and preview the
            patient.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center">
            <Input
              value={token}
              onChange={(e) =>
                setToken(Number(e.target.value.replace(/\D/g, "")) || undefined)
              }
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="#"
              className="w-full h-24 px-0 text-center text-gray-500 tracking-widest border-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 outline-none caret-gray-100 placeholder:text-gray-500 leading-none selection:bg-transparent"
              style={{
                fontSize: "4rem",
              }}
              autoFocus
            />
          </div>

          <div className="min-h-[120px]">
            {isFetching && (
              <div className="border rounded-md p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            )}

            {!isFetching && isEnabled && isError && (
              <div className="text-sm text-center text-red-600">
                {(error as { message?: string })?.message || "No patient found"}
              </div>
            )}

            {!isFetching && isEnabled && patient && (
              <PatientCard patient={patient} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PatientCard: FC<{ patient: Patient }> = ({ patient }) => {
  const yearOfBirth = useMemo(() => {
    return patient.year_of_birth ?? patient.date_of_birth?.split("-")[0];
  }, [patient]);

  return (
    <div
      onClick={() => {
        navigate("patients/verify", {
          query: {
            phone_number: patient.phone_number,
            year_of_birth: yearOfBirth,
            partial_id: patient.partial_id || patient.id.slice(0, 5),
          },
        });
      }} 
      className="border rounded-md p-4 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="font-medium text-base">{patient.name}</div>
          <div className="text-sm text-muted-foreground">
            {patient.gender?.toString()?.toUpperCase()} • {patient.phone_number}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          #{patient.id.slice(0, 8)}
        </div>
      </div>
    </div>
  );
};

export default TokenSearchDialog;
