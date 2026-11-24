import { FC, useMemo } from "react";
import { HIProfile } from "hi-profiles";
import { ArrowLeftIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { apis } from "@/apis";
import { AbdmScope } from "@/components/AbdmScope";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { I18NNAMESPACE } from "@/lib/constants";
import { encounterPath } from "@/lib/paths";
// TEMPORARY PATCH: Remove when HIP matching is handled server-side.
import { shouldIncludeHiBundle } from "@/lib/patches/filterHiBundleByConsentHip";

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

  // TEMPORARY PATCH: Remove when MedicationRequest is changed from date based to prescription based.
  const { data: consentsData } = useQuery({
    queryKey: ["consents", patientId, encounterId],
    queryFn: () =>
      apis.consent.list({
        patient: patientId,
        encounter: encounterId,
      }),
    enabled: !!patientId && !!encounterId,
  });

  const consentHip = useMemo(() => {
    if (!consentsData) {
      return undefined;
    }

    for (const consent of consentsData.results) {
      const artefact = consent.consent_artefacts?.find(
        (item) => item.id === artefactId,
      );
      if (artefact) {
        return artefact.hip;
      }
    }

    return null;
  }, [consentsData, artefactId]);

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

  // TEMPORARY PATCH: Remove when MedicationRequest is changed from date based to prescription based.
  const filteredItems = useMemo(() => {
    if (!data?.data) {
      return [];
    }

    if (consentHip === undefined) {
      return data.data;
    }

    return data.data.filter((item) =>
      shouldIncludeHiBundle(parseData(item.content), consentHip),
    );
  }, [consentHip, data?.data]);

  const pageHeader = (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" asChild>
        <Link to={encounterUrl}>
          <ArrowLeftIcon />
          {t("back")}
        </Link>
      </Button>
      <h2 className="text-2xl leading-tight font-bold">
        {t("hi__page_title")}
      </h2>
    </div>
  );

  if (isLoading) {
    return (
      <AbdmScope>
        <div className="py-4">
          {pageHeader}
          <div className="mt-12 flex flex-col items-center justify-center gap-3">
            <Spinner className="size-6 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              {t("loading_health_information")}
            </p>
          </div>
        </div>
      </AbdmScope>
    );
  }

  return (
    <AbdmScope>
      <div className="py-4">
        {pageHeader}
        <div className="mt-6 flex flex-col items-center justify-center gap-6">
          {!!error?.is_archived && (
            <EmptyState
              className="py-12"
              title={t("hi__record_archived__title")}
              description={
                <>
                  <p>{t("hi__record_archived_description")}</p>
                  <p className="mt-2">
                    {t("hi__record_archived_on")}{" "}
                    {new Date(error?.archived_time as string).toLocaleString()}{" "}
                    - {error?.archived_reason as string}
                  </p>
                </>
              }
            />
          )}
          {error && !error?.is_archived && (
            <EmptyState
              className="py-12"
              title={t("hi__record_not_fetched_title")}
              description={
                <>
                  <p>{t("hi__record_not_fetched_description")}</p>
                  <p className="mt-2">{t("hi__waiting_for_record")}</p>
                </>
              }
            />
          )}
          {filteredItems.map((item) => (
            <HIProfile
              key={item.care_context_reference}
              bundle={parseData(item.content)}
            />
          ))}
        </div>
      </div>
    </AbdmScope>
  );
};

export default HealthInformation;
