import { Button, ButtonProps, buttonVariants } from "@/components/ui/button";
import { ChevronLeftIcon, IdCardIcon } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { FC, createContext, useContext, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { AbhaNumber } from "@/types/abhaNumber";
import { HealthFacility } from "@/types/healthFacility";
import { Link } from "raviger";
import { LinkAbhaForm } from "./LinkAbhaForm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "@/types/user";
import { apis } from "@/apis";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

type LinkAbhaNumberContextValue = {
  healthFacility?: HealthFacility;
  currentUser?: User;
};

const LinkAbhaNumberContext = createContext<LinkAbhaNumberContextValue>({});

type LinkAbhaNumberProps = ButtonProps & {
  enforceLinking?: boolean;
  backUrl?: string;
  facilityId?: string;
  onSuccess: (abhaNumber: AbhaNumber) => void;
};

export const LinkAbhaNumber: FC<LinkAbhaNumberProps> = ({
  facilityId,
  onSuccess,
  backUrl,
  enforceLinking = false,
  defaultMode = "existing",
  className,
  ...props
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(enforceLinking);

  const handleOnSuccess = (abhaNumber: AbhaNumber) => {
    setIsDrawerOpen(false);
    onSuccess(abhaNumber);
  };

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: apis.user.getCurrentUser,
  });

  const { data: healthFacility } = useQuery({
    queryKey: ["healthFacility", facilityId],
    queryFn: () => apis.healthFacility.get(facilityId!),
    enabled: !!facilityId,
  });

  return (
    <LinkAbhaNumberContext.Provider
      value={{
        healthFacility,
        currentUser,
      }}
    >
      <Drawer
        dismissible={!enforceLinking}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      >
        <DrawerTrigger
          disabled={!healthFacility}
          className="abdm-container w-full"
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="abdm-container w-full">
                <Button
                  type="button"
                  className={cn(className, "w-full")}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsDrawerOpen(true);
                  }}
                  disabled={!healthFacility}
                  {...props}
                >
                  <span>
                    <IdCardIcon />
                  </span>
                  Generate/Link ABHA Number
                </Button>
              </TooltipTrigger>
              {!healthFacility && (
                <TooltipContent className="abdm-container">
                  <p>
                    Abha linking is disabled for this facility as it doesn't
                    have health facility id configured.
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </DrawerTrigger>
        <DrawerContent className="abdm-container">
          <ScrollArea className="h-[90vh]">
            <div className="md:mx-auto max-w-screen md:max-w-md max-md:p-4">
              <DrawerHeader className="flex justify-between items-center max-sm:flex-col">
                <div className="flex-1">
                  <DrawerTitle>Generate/Link ABHA Number</DrawerTitle>
                  <DrawerDescription>
                    Generate/link patient's ABHA details for easy access to
                    healthcare services.
                  </DrawerDescription>
                </div>

                {backUrl && (
                  <Link
                    href={backUrl}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "max-sm:w-full",
                    )}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Go back
                  </Link>
                )}
              </DrawerHeader>
              <div className="pb-6 pr-3">
                <LinkAbhaForm onSuccess={handleOnSuccess} />
              </div>
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </LinkAbhaNumberContext.Provider>
  );
};

export const useLinkAbhaNumberContext = () => {
  const context = useContext(LinkAbhaNumberContext);

  if (!context) {
    throw new Error(
      "useLinkAbhaNumberContext must be used within a LinkAbhaNumberProvider",
    );
  }

  return context;
};
