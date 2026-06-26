import { FC } from "react";
import { HIProfile } from "hi-profiles";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { Link } from "raviger";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { apis } from "@/apis";
import { Button } from "@/components/ui/button";
import Page from "@/components/ui/page";
import { I18NNAMESPACE } from "@/lib/constants";
import { encounterPath } from "@/lib/paths";

interface HealthInformationProps {
  artefactId: string;
  facilityId: string;
  patientId: string;
  encounterId: string;
}

const HealthInformation: FC<HealthInformationProps> = ({
  artefactId,
  facilityId,
  patientId,
  encounterId,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const encounterUrl = encounterPath(facilityId, patientId, encounterId, "abdm");

  const {
    data,
    isLoading,
    error: errorT,
  } = useQuery({
    queryKey: ["healthInformation", artefactId],
    queryFn: () => apis.healthInformation.get(artefactId),
    enabled: !!artefactId,
  });

  const error: any = errorT; // eslint-disable-line @typescript-eslint/no-explicit-any Intentionally typecasting to any

  const parseData = (data: string) => {
    try {
      return JSON.parse(data);
    } catch (e) {
      return JSON.parse(
        data.replace(/"/g, '\\"').replace(/'/g, '"') // eslint-disable-line
      );
    }
  };

  const pageHeader = (
    <div className="abdm-container flex items-center gap-3">
      <Button
        variant="outline"
        className="font-semibold underline underline-offset-2"
        asChild
      >
        <Link href={encounterUrl}>
          <ArrowLeftIcon />
          {t("back")}
        </Link>
      </Button>
      <h1 className="text-xl font-semibold text-secondary-900">
        {t("hi__page_title")}
      </h1>
    </div>
  );

  if (isLoading) {
    return (
      <Page>
        {pageHeader}
        <div className="mt-12 flex flex-col items-center justify-center gap-2.5">
          <Loader2Icon className="w-6 h-6 animate-spin text-primary-500" />
          <p className="font-semibold text-secondary-600">
            {t("loading_health_information")}
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      {pageHeader}
      <div className="mt-10 flex flex-col items-center justify-center gap-6">
        {!!error?.is_archived && (
          <>
            <h3 className="text-2xl font-semibold text-secondary-700">
              {t("hi__record_archived__title")}
            </h3>
            <h5 className="mt-2 text-sm text-secondary-500">
              {t("hi__record_archived_description")}
            </h5>
            <h4 className="mt-2 text-center text-secondary-500">
              {t("hi__record_archived_on")}{" "}
              {new Date(error?.archived_time as string).toLocaleString()} -{" "}
              {error?.archived_reason as string}
            </h4>
          </>
        )}
        {error && !error?.is_archived && (
          <>
            <h3 className="text-2xl font-semibold text-secondary-700">
              {t("hi__record_not_fetched_title")}
            </h3>
            <h5 className="mt-2 text-sm text-secondary-500">
              {t("hi__record_not_fetched_description")}
            </h5>
            <h4 className="mt-2 text-secondary-500">
              {t("hi__waiting_for_record")}
            </h4>
          </>
        )}
        {data?.data.map((item) => (
          <HIProfile
            key={item.care_context_reference}
            bundle={parseData(item.content)}
          />
        ))}
      </div>
    </Page>
  );
};

export default HealthInformation;
