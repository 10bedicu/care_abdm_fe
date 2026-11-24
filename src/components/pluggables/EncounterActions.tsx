import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FC, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AbdmScope } from "@/components/AbdmScope";
import { CloudDownloadIcon } from "lucide-react";
import CreateConsentRequestForm from "../CreateConsentRequestForm";
import { Encounter } from "@/types/encounter";
import { I18NNAMESPACE } from "@/lib/constants";
import { WithMeta } from "@/types/meta";
import { apis } from "@/apis";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type EncounterActionsProps = {
  encounter: Encounter;
  className?: string;
};

const EncounterActions: FC<WithMeta<EncounterActionsProps>> = ({
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

  const { data: healthFacility } = useQuery({
    queryKey: ["healthFacility", encounter.facility.id],
    queryFn: () => apis.healthFacility.get(encounter.facility.id),
    enabled: !!encounter.facility.id,
  });

  if (!abhaNumber || !healthFacility || !healthFacility.hf_id) {
    return null;
  }

  return (
    <AbdmScope>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* The host styles this row: an outline button on the encounter
            overview, a command row in the encounter command dialog. */}
        <DialogTrigger
          className={cn(
            "items-center gap-2 text-left text-sm [&_svg]:size-4 [&_svg]:shrink-0",
            className,
          )}
        >
          <CloudDownloadIcon aria-hidden="true" />
          {t("hi__fetch_records")}
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("hi__fetch_records")}</DialogTitle>
            <DialogDescription>
              {t("hi__fetch_records_description")}
            </DialogDescription>
          </DialogHeader>
          <CreateConsentRequestForm
            abhaNumber={abhaNumber}
            encounter={encounter}
            onCancel={() => setIsDialogOpen(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: ["consents", encounter.patient.id],
              });
              setIsDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </AbdmScope>
  );
};

export default EncounterActions;
