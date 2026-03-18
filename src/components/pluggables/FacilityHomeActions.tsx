import { FC, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { ConfigureHealthFacilityForm } from "../ConfigureHealthFacilityForm";
import { Facility } from "@/types/facility";
import { I18NNAMESPACE } from "@/lib/constants";
import { SettingsIcon } from "lucide-react";
import { WithMeta } from "@/types/meta";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

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
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="abdm-container">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer font-semibold"
          >
            <SettingsIcon />
            {t("configure_health_facility")}
          </Button>
        </SheetTrigger>
        <SheetContent className="abdm-container w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("configure_health_facility")}</SheetTitle>
            <SheetDescription>
              {t("configure_health_facility_description")}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
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
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default FacilityHomeActions;
