import { ChevronLeftIcon, IdCardIcon, XIcon } from "lucide-react";
import { FC, createContext, useContext, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { apis } from "@/apis";
import { AbdmScope } from "@/components/AbdmScope";
import { Button, ButtonProps } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { I18NNAMESPACE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AbhaNumber } from "@/types/abhaNumber";
import { HealthFacility } from "@/types/healthFacility";
import { User } from "@/types/user";

import { LinkAbhaForm } from "./LinkAbhaForm";

type LinkAbhaNumberContextValue = {
  facilityId?: string;
  healthFacility?: HealthFacility;
  currentUser?: User;
};

const LinkAbhaNumberContext = createContext<LinkAbhaNumberContextValue>({});

type LinkAbhaNumberProps = Omit<ButtonProps, "onClick" | "children"> & {
  enforceLinking?: boolean;
  backUrl?: string;
  facilityId?: string;
  label?: string;
  onSuccess: (abhaNumber: AbhaNumber) => void;
};

/** Tall enough for every step, so the drawer keeps its height between steps. */
const DRAWER_HEIGHT =
  "data-[swipe-axis=y]:h-[calc(90dvh+var(--drawer-keyboard-inset,0px))]";

/** The centred column the header and the form share. */
const COLUMN = "mx-auto w-full max-w-lg px-4";

export const LinkAbhaNumber: FC<LinkAbhaNumberProps> = ({
  facilityId,
  label,
  onSuccess,
  backUrl,
  enforceLinking = false,
  className,
  ...props
}) => {
  const { t } = useTranslation(I18NNAMESPACE);

  // Every verification is recorded against a facility, so the flow needs one.
  const [isDrawerOpen, setIsDrawerOpen] = useState(
    enforceLinking && !!facilityId,
  );

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

  const isDisabled = !facilityId || !healthFacility;
  const title = label ?? "Generate/Link ABHA Number";

  const trigger = (
    <Button
      type="button"
      {...props}
      className={cn("w-full", className)}
      disabled={isDisabled}
      onClick={() => setIsDrawerOpen(true)}
    >
      <IdCardIcon />
      {title}
    </Button>
  );

  return (
    <LinkAbhaNumberContext.Provider
      value={{
        facilityId,
        healthFacility,
        currentUser,
      }}
    >
      <AbdmScope>
        {isDisabled ? (
          <Tooltip>
            {/* A disabled button has no pointer events; the wrapper takes the hover. */}
            <TooltipTrigger asChild>
              <span className="block w-full">{trigger}</span>
            </TooltipTrigger>
            <TooltipContent>
              {facilityId
                ? "Abha linking is disabled for this facility as it doesn't have health facility id configured."
                : t("abha_disabled_due_to_no_facility")}
            </TooltipContent>
          </Tooltip>
        ) : (
          trigger
        )}
        <Drawer
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          showSwipeHandle={!enforceLinking}
        >
          <DrawerContent
            className={DRAWER_HEIGHT}
            // When linking is enforced, the drawer only closes on success or "Go back".
            data-base-ui-swipe-ignore={enforceLinking ? "" : undefined}
            onEscapeKeyDown={(event) => enforceLinking && event.preventDefault()}
            onInteractOutside={(event) =>
              enforceLinking && event.preventDefault()
            }
          >
            <div
              className={cn(
                COLUMN,
                "flex shrink-0 items-center justify-between gap-3 py-2 md:py-4",
                // "Go back" takes a row of its own on small screens.
                backUrl && "max-sm:flex-wrap",
              )}
            >
              <div className="min-w-0">
                <DrawerTitle>{title}</DrawerTitle>
                <DrawerDescription>
                  Generate/link patient's ABHA details for easy access to
                  healthcare services.
                </DrawerDescription>
              </div>
              {backUrl ? (
                <Button asChild variant="outline" className="max-sm:w-full">
                  <Link to={backUrl}>
                    <ChevronLeftIcon />
                    Go back
                  </Link>
                </Button>
              ) : (
                !enforceLinking && (
                  <DrawerClose asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <XIcon />
                      <span className="sr-only">{t("close")}</span>
                    </Button>
                  </DrawerClose>
                )
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className={cn(COLUMN, "pt-2 pb-8")}>
                <LinkAbhaForm onSuccess={handleOnSuccess} />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </AbdmScope>
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
