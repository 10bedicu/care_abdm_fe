import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { FC, useState } from "react";
import { FileDownIcon, IdCardIcon, ImageDownIcon } from "lucide-react";
import useMultiStepForm, { InjectedStepProps } from "./useMultiStepForm";

import { AbhaNumber } from "@/types/abhaNumber";
import { Button } from "../ui/button";
import { I18NNAMESPACE } from "@/lib/constants";
import { apis } from "@/apis";
import { toast } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

type ShowAbhaProfileProps = {
  abhaNumber: AbhaNumber;
};

type FormMemory = {
  abhaNumber: AbhaNumber;
};

export const ShowAbhaProfile: FC<ShowAbhaProfileProps> = ({ abhaNumber }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { currentStep } = useMultiStepForm<FormMemory>(
    [
      {
        id: "show-abha-profile",
        element: <AbhaProfile {...({} as AbhaProfileProps)} />,
      },
    ],
    {
      abhaNumber,
    }
  );

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <DrawerTrigger className="abdm-container">
        <Button
          type="button"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsDrawerOpen(true);
          }}
        >
          <span>
            <IdCardIcon />
          </span>
          Show ABHA Profile
        </Button>
      </DrawerTrigger>
      <DrawerContent className="abdm-container">
        <div className="md:mx-auto max-w-screen md:max-w-md max-md:p-4 max-h-svh">
          <DrawerHeader>
            <DrawerTitle>Abha Profile</DrawerTitle>
            <DrawerDescription>
              View and manage your ABHA profile details for better healthcare
              access.
            </DrawerDescription>
          </DrawerHeader>
          {currentStep}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export type AbhaProfileProps = InjectedStepProps<FormMemory> & {
  onSuccess?: (abhaNumber: AbhaNumber) => void;
};

export const AbhaProfile: FC<AbhaProfileProps> = ({ memory, onSuccess }) => {
  const { t } = useTranslation(I18NNAMESPACE);

  const { mutate: downloadAbhaCard } = useMutation({
    mutationFn: (type: "pdf" | "png") => {
      return apis.healthId.getAbhaCard({
        abha_id: memory?.abhaNumber.abha_number,
        type,
      });
    },
    onSuccess: (data, type) => {
      const imageUrl = URL.createObjectURL(data);

      if (type === "png") {
        const downloadLink = document.createElement("a");
        downloadLink.href = imageUrl;
        downloadLink.download = "abha.png";
        downloadLink.click();
        URL.revokeObjectURL(imageUrl);
      } else {
        const printWindow = window.open("", "_blank");
        const htmlPopup = `
            <html>
              <head>
                <title>Print Image</title>
                <style>
                @media print {
                  @page {
                    size: landscape;
                  }
                  body, html { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100%; }
                }
                </style>
              </head>
              <body>
                <embed width="100%" height="100%" src="${imageUrl}" type="image/png"></embed>
              </body>
            </html>
          `;
        printWindow?.document.write(htmlPopup);
        printWindow?.document.close();
        printWindow?.addEventListener("load", () => {
          printWindow?.print();
          URL.revokeObjectURL(imageUrl);
        });
      }
    },
  });

  return (
    <div className="py-6">
      <div className="flex flex-col gap-4">
        {memory?.abhaNumber.profile_photo && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <img
                src={`data:image/png;base64,${memory?.abhaNumber.profile_photo}`}
                alt={`${memory?.abhaNumber.name}'s photo`}
                className="w-48 h-60 rounded-lg"
              />
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <h4 className="text-xs text-secondary-700">
                  {t("abha_number")}
                </h4>
                <p>{memory?.abhaNumber.abha_number ?? "-"}</p>
              </div>
              <div>
                <h4 className="text-xs text-secondary-700">
                  {t("abha_address")}
                </h4>
                <p>{memory?.abhaNumber.health_id ?? "-"}</p>
              </div>
              <div>
                <h4 className="text-xs text-secondary-700">{t("full_name")}</h4>
                <p>{memory?.abhaNumber.name ?? "-"}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs text-secondary-700">
                    {t("date_of_birth")}
                  </h4>
                  <p>{memory?.abhaNumber.date_of_birth ?? "-"}</p>
                </div>
                <div>
                  <h4 className="text-xs text-secondary-700">{t("gender")}</h4>
                  <p>{memory?.abhaNumber.gender ?? "-"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {!memory?.abhaNumber.profile_photo && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs text-secondary-700">
                  {t("abha_number")}
                </h4>
                <p>{memory?.abhaNumber.abha_number ?? "-"}</p>
              </div>
              <div>
                <h4 className="text-xs text-secondary-700">
                  {t("abha_address")}
                </h4>
                <p>{memory?.abhaNumber.health_id ?? "-"}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <h4 className="text-xs text-secondary-700">{t("full_name")}</h4>
                <p>{memory?.abhaNumber.name ?? "-"}</p>
              </div>
              <div>
                <h4 className="text-xs text-secondary-700">{t("gender")}</h4>
                <p>{memory?.abhaNumber.gender ?? "-"}</p>
              </div>
              <div>
                <h4 className="text-xs text-secondary-700">
                  {t("date_of_birth")}
                </h4>
                <p>{memory?.abhaNumber.date_of_birth ?? "-"}</p>
              </div>
            </div>
          </>
        )}
        <div className="grid sm:grid-cols-1 gap-4">
          <div>
            <h4 className="text-xs text-secondary-700">{t("address")}</h4>
            <p>{memory?.abhaNumber.address ?? "-"}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <h4 className="text-xs text-secondary-700">{t("district")}</h4>
            <p>{memory?.abhaNumber.district ?? "-"}</p>
          </div>
          <div>
            <h4 className="text-xs text-secondary-700">{t("state")}</h4>
            <p>{memory?.abhaNumber.state ?? "-"}</p>
          </div>
          <div>
            <h4 className="text-xs text-secondary-700">{t("pincode")}</h4>
            <p>{memory?.abhaNumber.pincode ?? "-"}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs text-secondary-700">{t("mobile_number")}</h4>
            <p>{memory?.abhaNumber.mobile ?? "-"}</p>
          </div>
          <div>
            <h4 className="text-xs text-secondary-700">{t("email")}</h4>
            <p>{memory?.abhaNumber.email ?? "-"}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-2 w-full max-sm:flex-col">
          <Button
            type="button"
            variant="secondary"
            onClick={() => downloadAbhaCard("png")}
            className="flex items-center gap-2 flex-1 w-full"
          >
            <ImageDownIcon className="h-4 w-4" />
            {t("download_abha_card")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => downloadAbhaCard("pdf")}
            className="flex items-center gap-2 flex-1 w-full"
          >
            <FileDownIcon className="h-4 w-4" />
            {t("print_abha_card")}
          </Button>
        </div>

        {onSuccess && (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              if (!memory?.abhaNumber) {
                toast.error("No ABHA number found");
                return;
              }
              onSuccess(memory.abhaNumber);
            }}
          >
            {t("proceed")}
          </Button>
        )}
      </div>
    </div>
  );
};
