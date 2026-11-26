import { AbdmScope } from "@/components/AbdmScope";
import { Button } from "@/components/ui/button";
import { FC } from "react";
import { HashIcon } from "lucide-react";
import { I18NNAMESPACE } from "@/lib/constants";
import TokenSearchDialog from "@/components/TokenSearchDialog";
import { WithMeta } from "@/types/meta";
import { apis } from "@/apis";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

type PatientSearchActionsProps = {
  facilityId: string;
  className?: string;
};

const PatientSearchActions: FC<WithMeta<PatientSearchActionsProps>> = ({
  facilityId,
  className,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const { data: healthFacility } = useQuery({
    queryKey: ["healthFacility", facilityId],
    queryFn: () => apis.healthFacility.get(facilityId),
    enabled: !!facilityId,
  });

  if (!healthFacility) {
    return null;
  }

  return (
    <AbdmScope>
      {/* The host asks for a full-width button; this wrapper is what it fills. */}
      <div className="flex">
        <TokenSearchDialog
          facilityId={facilityId}
          trigger={
            <Button
              variant="primary_gradient"
              className={cn("gap-3", className)}
            >
              <HashIcon />
              {t("find_patient_by_abha_token")}
            </Button>
          }
        />
      </div>
    </AbdmScope>
  );
};

export default PatientSearchActions;
