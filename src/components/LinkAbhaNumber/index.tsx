import { IdCardIcon } from "lucide-react";
import { FC, useState } from "react";

import { Button, ButtonProps } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; 
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createContext, FC, useState, useContext } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AbhaNumber } from "@/types/abhaNumber";
import { CreateWithAadhaar } from "./CreateWithAadhaar";
import { LinkWithOtp } from "./LinkWithOtp";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apis } from "@/apis";
import { useQuery } from "@tanstack/react-query";
import { HealthFacility } from "@/types/healthFacility";
import { User } from "@/types/user";

type LinkAbhaNumberContextValue = {
  healthFacility?: HealthFacility;
  currentUser?: User;
};

const LinkAbhaNumberContext = createContext<LinkAbhaNumberContextValue>({});

type LinkAbhaNumberProps = ButtonProps & {
  facilityId?: string;
  onSuccess: (abhaNumber: AbhaNumber) => void;
  defaultMode?: "new" | "existing";
  isAbhaLinkingDisabled?: boolean;
};

export const LinkAbhaNumber: FC<LinkAbhaNumberProps> = ({
  facilityId,
  onSuccess,
  defaultMode = "new",
  isAbhaLinkingDisabled = false,
  ...props
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOnSuccess = (abhaNumber: AbhaNumber) => {
    setIsDrawerOpen(false);
    setIsDialogOpen(false);
    onSuccess(abhaNumber);
  };
  const isSmallScreen = window.innerWidth < 768;

  return (
    <>
      {isSmallScreen ? (
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger disabled={props.disabled}>
          <Button {...props}>
            <span>
              <IdCardIcon />
            </span>
            Generate/Link ABHA Number
          </Button>
        </DrawerTrigger>
          <DrawerContent className="w-full px-4">
            <div className="md:mx-auto max-md:p-4 max-h-screen">
              <DrawerHeader>
                <DrawerTitle>Generate/Link ABHA Number</DrawerTitle>
                <DrawerDescription>
                  Generate/link patient's ABHA details for easy access to healthcare
                  services.
                </DrawerDescription>
              </DrawerHeader>
              <Tabs defaultValue={defaultMode} orientation="vertical">
                <TabsList className="w-full">
                  <TabsTrigger className="flex-1 w-1/2 truncate justify-start" value="new">
                    <TooltipComponent content="Generate new ABHA number" side="top">
                      <span className="truncate">Generate new ABHA number</span>
                    </TooltipComponent>
                  </TabsTrigger>
                  <TabsTrigger className="flex-1 w-1/2 truncate justify-start" value="existing">
                    <TooltipComponent content="Link existing ABHA number" side="top">
                      <span className="truncate">Link existing ABHA number</span>
                    </TooltipComponent>
                  </TabsTrigger>
                </TabsList>
                <ScrollArea className="h-96 pb-6 pr-3">
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
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger disabled={!healthFacility} className="abdm-container">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="abdm-container">
                <Button
                  type="button"
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
              <DrawerHeader>
                <DrawerTitle>Generate/Link ABHA Number</DrawerTitle>
                <DrawerDescription>
                  Generate/link patient's ABHA details for easy access to
                  healthcare services.
                </DrawerDescription>
              </DrawerHeader>
              <Tabs defaultValue={defaultMode} orientation="vertical">
                <TabsList className="w-full sticky top-0 bg-gray-200 z-10 py-6">
                  <TabsTrigger
                    className="flex-1 w-1/2 truncate justify-center"
                    value="new"
                  >
                    Generate new ABHA
                  </TabsTrigger>
                  <TabsTrigger
                    className="flex-1 w-1/2 truncate justify-center"
                    value="existing"
                  >
                    Link existing ABHA
                  </TabsTrigger>
                </TabsList>
                <div className="pb-6 pr-3">
                  <TabsContent value="new">
                    <CreateWithAadhaar onSuccess={handleOnSuccess} />
                  </TabsContent>
                  <TabsContent value="existing">
                    <LinkWithOtp onSuccess={handleOnSuccess} />
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger disabled={props.disabled}>
            <Button {...props}>
              <span>
                <IdCardIcon />
              </span>
              Generate/Link ABHA Number
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-full">
            <div className="w-full flex flex-wrap items-center justify-center overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Generate/Link ABHA Number</DialogTitle>
                <DialogDescription>
                  Generate/link patient's ABHA details for easy access to healthcare
                  services.
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue={defaultMode} orientation="vertical" className="flex flex-wrap">
                <TabsList className="w-full">
                  <TabsTrigger className="flex-1 w-1/2 truncate justify-start" value="new">
                    Generate new ABHA number
                  </TabsTrigger>
                  <TabsTrigger className="flex-1 w-1/2 truncate justify-start" value="existing">
                    Link existing ABHA number
                  </TabsTrigger>
                </TabsList>
                <ScrollArea className="h-96 pb-6 pr-3">
                  <TabsContent value="new">
                    <CreateWithAadhaar onSuccess={handleOnSuccess} />
                  </TabsContent>
                  <TabsContent value="existing">
                    <LinkWithOtp onSuccess={handleOnSuccess} />
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
                </div>
              </Tabs>
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
      "useLinkAbhaNumberContext must be used within a LinkAbhaNumberProvider"
    );
  }

  return context;
};
