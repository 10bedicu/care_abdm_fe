import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FC, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { I18NNAMESPACE } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Patient } from "@/types/patient";
import { Skeleton } from "@/components/ui/skeleton";
import { apis } from "@/apis";
import { useNavigate } from "@tanstack/react-router";
import { useDebouncedState } from "@/hooks/useDebouncedState";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

type TokenSearchDialogProps = {
  facilityId: string;
  trigger?: React.ReactNode;
};

const TokenSearchDialog: FC<TokenSearchDialogProps> = ({
  trigger,
  facilityId,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);
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
        {trigger ?? <Button>{t("search_by_token")}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("find_patient_by_token")}</DialogTitle>
          <DialogDescription>
            {t("find_patient_by_token_description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Input
            value={token ?? ""}
            onChange={(e) =>
              setToken(Number(e.target.value.replace(/\D/g, "")) || undefined)
            }
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="#"
            aria-label={t("token_number")}
            className="h-24 border-none px-0 text-center leading-none tracking-widest shadow-none focus-visible:ring-0 md:h-24"
            style={{ fontSize: "4rem" }}
            autoFocus
          />

          <div className="min-h-24">
            {isFetching && (
              <div className="rounded-md border border-border p-4">
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
              <p className="text-center text-sm text-destructive">
                {(error as { message?: string })?.message ||
                  t("no_patient_found")}
              </p>
            )}

            {!isFetching && isEnabled && patient && (
              <PatientCard patient={patient} facilityId={facilityId} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PatientCard: FC<{ patient: Patient; facilityId: string }> = ({
  patient,
  facilityId,
}) => {
  const navigate = useNavigate();
  const yearOfBirth = useMemo(() => {
    return (
      patient.year_of_birth?.toString() ?? patient.date_of_birth?.split("-")[0]
    );
  }, [patient]);

  return (
    <button
      type="button"
      onClick={() => {
        navigate({
          to: "/facility/$facilityId/patients/home",
          params: { facilityId },
          search: {
            phone_number: patient.phone_number,
            year_of_birth: yearOfBirth,
            partial_id: patient.partial_id || patient.id.slice(0, 5),
          },
        });
      }}
      className="flex w-full items-center justify-between gap-4 rounded-md border border-border bg-card p-4 text-left shadow-xs transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span className="min-w-0 space-y-1">
        <span className="block truncate text-base font-medium">
          {patient.name}
        </span>
        <span className="block text-sm text-muted-foreground">
          {patient.gender?.toString()?.toUpperCase()} • {patient.phone_number}
        </span>
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">
        #{patient.id.slice(0, 8)}
      </span>
    </button>
  );
};

export default TokenSearchDialog;
