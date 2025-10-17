import { apis } from "@/apis";
import { useQuery } from "@tanstack/react-query";
import { FC } from "react";
import TokenSearchDialog from "@/components/TokenSearchDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HashIcon } from "lucide-react";

type PatientSearchActionsProps = {
  facilityId: string;
  className?: string;
};

const PatientSearchActions: FC<PatientSearchActionsProps> = ({
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
