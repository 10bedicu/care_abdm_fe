import { FC, useState } from "react";
import { SettingsIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { AbdmScope } from "@/components/AbdmScope";
import { HostMenuItem } from "@/components/common/HostMenuItem";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { I18NNAMESPACE } from "@/lib/constants";
import { Facility } from "@/types/facility";
import { WithMeta } from "@/types/meta";

import { ConfigureHealthFacilityForm } from "../ConfigureHealthFacilityForm";

type FacilityHomeActionsProps = {
  facility: Facility;
  className?: string;
};

const FacilityHomeActions: FC<WithMeta<FacilityHomeActionsProps>> = ({
  facility,
  __meta,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);

  if (!facility) {
    return null;
  }

  return (
    <AbdmScope>
      {/* A row in the host's "Configurations" menu. */}
      <HostMenuItem onClick={() => setOpen(true)}>
        <SettingsIcon className="text-muted-foreground" aria-hidden="true" />
        {t("configure_health_facility")}
      </HostMenuItem>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent size="lg" className="overflow-hidden">
          <SheetHeader>
            <SheetTitle>{t("configure_health_facility")}</SheetTitle>
            <SheetDescription>
              {t("configure_health_facility_description")}
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            <ConfigureHealthFacilityForm
              facilityId={facility.id}
              onSuccess={() => {
                queryClient.invalidateQueries({
                  queryKey: ["healthFacility", facility.id],
                });
                setOpen(false);
              }}
              meta={__meta}
            />
          </SheetBody>
        </SheetContent>
      </Sheet>
    </AbdmScope>
  );
};

export default FacilityHomeActions;
