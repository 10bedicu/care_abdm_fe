import { apis } from "@/apis";
import { useQuery } from "@tanstack/react-query";
import { FC } from "react";
import { Patient } from "@/types/patient";
import { useTranslation } from "react-i18next";
import { I18NNAMESPACE } from "@/lib/constants";

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

  if (!abhaNumber) {
    return null;
  }

  return (
    <div className="sm:col-span-2">
      <div className="mr-6 flex flex-col items-start justify-between rounded-md border border-blue-300 bg-blue-50 p-4 sm:flex-row">
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
      </div>
    </div>
  );
};

export default PatientDetailsTabDemographyGeneralInfo;
