import { FC } from "react";
import { I18NNAMESPACE } from "@/lib/constants";
import { Patient } from "@/types/patient";
import { apis } from "@/apis";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ImageDownIcon, FileDownIcon } from "lucide-react";

type PatientDetailsTabDemographyGeneralInfoProps = {
  patientData: Patient;
  facilityId: string;
  patientId: string;
};

const PatientDetailsTabDemographyGeneralInfo: FC<
  PatientDetailsTabDemographyGeneralInfoProps
> = ({ patientId }) => {
  const { t } = useTranslation(I18NNAMESPACE);

  const { data: abhaNumber } = useQuery({
    queryKey: ["abhaNumber", patientId],
    queryFn: () => apis.abhaNumber.get(patientId),
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
  });

  if (!abhaNumber) {
    return null;
  }

  return (
    <div className="abdm-container sm:col-span-2">
      <div className="mr-6 flex flex-col items-start justify-between rounded-md border border-blue-400 bg-blue-50 p-4 sm:flex-row">
        <div className="flex-1">
          <div className="text-sm font-normal leading-5 text-gray-600">
            {t("abha_number")}
          </div>

          <div className="mt-1 text-sm font-semibold leading-5 text-gray-900">
            {abhaNumber.abha_number || "-"}
          </div>
        </div>

        <div className="ml-0 mt-4 flex-1 sm:ml-4 sm:mt-0">
          <div className="text-sm font-normal leading-5 text-gray-600">
            {t("abha_address")}
          </div>
          <div className="mt-1 text-sm font-semibold leading-5 text-gray-900">
            {abhaNumber.health_id || "-"}
          </div>
        </div>

        <div className="ml-0 mt-4 sm:ml-4 sm:mt-0 flex">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => downloadAbhaCard("png")}
          >
            <ImageDownIcon className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => downloadAbhaCard("pdf")}
          >
            <FileDownIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsTabDemographyGeneralInfo;
