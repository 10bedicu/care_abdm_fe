import { FileDownIcon, ImageDownIcon } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { AbdmScope } from "@/components/AbdmScope";
import { Button } from "@/components/ui/button";
import { FC } from "react";
import { I18NNAMESPACE } from "@/lib/constants";
import { Patient } from "@/types/patient";
import { WithMeta } from "@/types/meta";
import { apis } from "@/apis";
import { errorMessage } from "@/apis/request";
import { toast } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type PatientDetailsTabDemographyGeneralInfoProps = {
  patientData: Patient;
  facilityId: string;
  patientId: string;
};

const PatientDetailsTabDemographyGeneralInfo: FC<
  WithMeta<PatientDetailsTabDemographyGeneralInfoProps>
> = ({ patientId, facilityId }) => {
  const { t } = useTranslation(I18NNAMESPACE);

  const { data: abhaNumber } = useQuery({
    // The host passes an empty string outside a facility.
    queryKey: ["abhaNumber", patientId, facilityId || undefined],
    queryFn: () => apis.abhaNumber.get(patientId, { facility: facilityId }),
    enabled: !!patientId,
  });

  const { mutate: downloadAbhaCard } = useMutation({
    mutationFn: (type: "pdf" | "png") => {
      return apis.healthId.getAbhaCard({
        abha_id: abhaNumber?.abha_number,
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

  if (!abhaNumber) {
    return null;
  }

  return (
    <AbdmScope>
      {/* Sits in the host's details grid, styled like its emergency contact card. */}
      <div className="mr-6 flex flex-col items-start justify-between gap-4 rounded-md border border-blue-300 bg-blue-50 p-4 sm:col-span-2 sm:flex-row dark:border-blue-400/35 dark:bg-blue-400/15">
        <div className="flex-1">
          <div className="text-sm leading-5 text-soft-foreground">
            {t("abha_number")}
          </div>
          <div className="mt-1 text-sm leading-5 font-semibold text-foreground">
            {abhaNumber.abha_number || "-"}
          </div>
        </div>

        <div className="flex-1">
          <div className="text-sm leading-5 text-soft-foreground">
            {t("abha_address")}
          </div>
          <div className="mt-1 text-sm leading-5 font-semibold text-foreground">
            {abhaNumber.abha_address || "-"}
          </div>
        </div>

        <div className="flex">
          <Button
            size="icon"
            variant="ghost"
            aria-label={t("download_abha_card")}
            onClick={() => downloadAbhaCard("png")}
          >
            <ImageDownIcon />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={t("print_abha_card")}
            onClick={() => downloadAbhaCard("pdf")}
          >
            <FileDownIcon />
          </Button>
        </div>
      </div>
    </AbdmScope>
  );
};

export default PatientDetailsTabDemographyGeneralInfo;
