import { apis } from "@/apis";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FC, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CreateConsentRequestForm from "../CreateConsentRequestForm";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Encounter } from "@/types/encounter";
import { I18NNAMESPACE } from "@/lib/constants";

type PatientInfoCardActionsProps = {
  encounter: Encounter;
  className?: string;
};

const PatientInfoCardActions: FC<PatientInfoCardActionsProps> = ({
  encounter,
  className,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: abhaNumber } = useQuery({
    queryKey: ["abhaNumber", encounter.patient.id],
    queryFn: () => apis.abhaNumber.get(encounter.patient.id),
    enabled: !!encounter.patient.id,
  });

  if (!abhaNumber) {
    return null;
  }

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors focus:bg-gray-100 focus:text-gray-900 data-disabled:pointer-events-none data-disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0 dark:focus:bg-gray-800 dark:focus:text-gray-50",
              className
            )}
          >
            {t("hi__fetch_records")}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("hi__fetch_records")}</DialogTitle>
            <DialogDescription>
              {t("hi__fetch_records_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <CreateConsentRequestForm
              abhaNumber={abhaNumber}
              onSuccess={() => {
                queryClient.invalidateQueries({
                  queryKey: ["consents", encounter.patient.id],
                });
                setIsDialogOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PatientInfoCardActions;
