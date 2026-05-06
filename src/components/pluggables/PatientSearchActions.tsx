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
    <div className="flex items-center gap-2">
      <TokenSearchDialog
        facilityId={facilityId}
        trigger={
          <Button variant="default" className={cn(className, "flex gap-2")}>
            <HashIcon />
            Find Patient by Abha Token
          </Button>
        }
      />
    </div>
  );
};

export default PatientSearchActions;
