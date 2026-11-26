import { AbdmScope } from "@/components/AbdmScope";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { FC, ReactNode, useState } from "react";
import { FileDownIcon, IdCardIcon, ImageDownIcon } from "lucide-react";
import useMultiStepForm, { InjectedStepProps } from "./useMultiStepForm";

import { AbhaNumber } from "@/types/abhaNumber";
import { Button } from "../ui/button";
import { I18NNAMESPACE } from "@/lib/constants";
import { apis } from "@/apis";
import { errorMessage } from "@/apis/request";
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
    <AbdmScope>
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button type="button" variant="outline">
            <IdCardIcon />
            Show ABHA Profile
          </Button>
        </DrawerTrigger>
        <DrawerContent size="md">
          <DrawerHeader showCloseButton className="px-4">
            <DrawerTitle>Abha Profile</DrawerTitle>
            <DrawerDescription>
              View and manage your ABHA profile details for better healthcare
              access.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody>{currentStep}</DrawerBody>
        </DrawerContent>
      </Drawer>
    </AbdmScope>
  );
};

/** A label and its value, as on the host's patient demography tab. */
const Detail = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="min-w-0">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div className="mt-1 text-sm font-semibold wrap-anywhere text-foreground">
      {children ?? "-"}
    </div>
  </div>
);

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
    onError: (error) => {
      toast.error(errorMessage(error, t("error_downloading_abha_card")));
    },
  });

  const abha = memory?.abhaNumber;
  const identity = (
    <>
      <Detail label={t("abha_number")}>{abha?.abha_number}</Detail>
      <Detail label={t("abha_address")}>{abha?.abha_address}</Detail>
      <Detail label={t("full_name")}>{abha?.name}</Detail>
      <div className="grid grid-cols-2 gap-4">
        <Detail label={t("date_of_birth")}>{abha?.date_of_birth}</Detail>
        <Detail label={t("gender")}>{abha?.gender}</Detail>
      </div>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {abha?.profile_photo ? (
          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            <img
              src={`data:image/png;base64,${abha.profile_photo}`}
              alt={`${abha.name}'s photo`}
              className="h-60 w-48 rounded-lg border border-border object-cover"
            />
            <div className="flex flex-col gap-4">{identity}</div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">{identity}</div>
        )}
        <Detail label={t("address")}>{abha?.address}</Detail>
        <div className="grid gap-4 sm:grid-cols-3">
          <Detail label={t("district")}>{abha?.district}</Detail>
          <Detail label={t("state")}>{abha?.state}</Detail>
          <Detail label={t("pincode")}>{abha?.pincode}</Detail>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Detail label={t("mobile_number")}>{abha?.mobile}</Detail>
          <Detail label={t("email")}>{abha?.email}</Detail>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex gap-3 max-sm:flex-col">
          <Button
            type="button"
            variant="outline"
            onClick={() => downloadAbhaCard("png")}
            className="flex-1"
          >
            <ImageDownIcon />
            {t("download_abha_card")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => downloadAbhaCard("pdf")}
            className="flex-1"
          >
            <FileDownIcon />
            {t("print_abha_card")}
          </Button>
        </div>

        {onSuccess && (
          <Button
            type="button"
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
