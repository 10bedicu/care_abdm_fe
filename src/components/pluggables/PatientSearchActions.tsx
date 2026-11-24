import { AbdmScope } from "@/components/AbdmScope";
import { Button } from "@/components/ui/button";
import { FC } from "react";
import { HashIcon } from "lucide-react";
import TokenSearchDialog from "@/components/TokenSearchDialog";
import { WithMeta } from "@/types/meta";
import { apis } from "@/apis";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

type PatientSearchActionsProps = {
  facilityId: string;
  className?: string;
};

const PatientSearchActions: FC<WithMeta<PatientSearchActionsProps>> = ({
  facilityId,
  className,
}) => {
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
              Find Patient by Abha Token
            </Button>
          }
        />
      </div>
    </AbdmScope>
  );
};

export default PatientSearchActions;
