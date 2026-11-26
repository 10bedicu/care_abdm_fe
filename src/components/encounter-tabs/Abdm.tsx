import { ConsentArtefact, ConsentRequest } from "@/types/consent";
import { ChevronDownIcon, RefreshCcwIcon } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { APIError, errorMessage } from "@/apis/request";
import { AbdmScope } from "@/components/AbdmScope";
import { CardListSkeleton } from "@/components/common/SkeletonLoading";
import { Badge, BadgeVariant } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { EmptyState } from "../ui/empty-state";
import { Spinner } from "../ui/spinner";
import { EncounterTabProps } from ".";
import { Encounter } from "@/types/encounter";
import { FC, useState } from "react";
import { I18NNAMESPACE } from "@/lib/constants";
import { Link } from "@tanstack/react-router";
import { Patient } from "@/types/patient";
import { apis } from "@/apis";
import { cn } from "@/lib/utils";
import dayjs from "@/lib/dayjs";
import { healthInformationPath } from "@/lib/paths";
import { toast } from "@/lib/utils";
import { useErrorToast } from "@/hooks/useErrorToast";
import { useTranslation } from "react-i18next";

const CONSENT_STATUS_VARIANTS: Partial<
  Record<ConsentRequest["status"], BadgeVariant>
> = {
  GRANTED: "green",
  REQUESTED: "amber",
  EXPIRED: "secondary",
  DENIED: "destructive",
  REVOKED: "destructive",
};

export const AbdmEncounterTab: FC<EncounterTabProps> = ({
  patient,
  encounter,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);

  const { data, isLoading, error } = useQuery({
    queryKey: ["consents", patient.id],
    queryFn: () =>
      apis.consent.list({
        patient: patient.id,
        encounter: encounter.id,
        ordering: "-created_date",
      }),
    enabled: !!patient.id,
  });
  useErrorToast(error, t("error_fetching_consent_requests"));

  if (isLoading) {
    return (
      <AbdmScope>
        <div className="py-4" aria-busy="true">
          <span className="sr-only">{t("loading_consent_requests")}</span>
          <CardListSkeleton count={3} />
        </div>
      </AbdmScope>
    );
  }

  if (!data?.results.length) {
    return (
      <AbdmScope>
        <div className="py-4">
          <EmptyState
            className="py-12"
            title={t("no_records_found")}
            description={t("raise_consent_request")}
          />
        </div>
      </AbdmScope>
    );
  }

  return (
    <AbdmScope>
      <div className="flex flex-col gap-4 py-4">
        {data?.results.map((record) => {
          return (
            <ConsentRequestCard
              key={record.id}
              consent={record}
              encounter={encounter}
              patient={patient}
            />
          );
        })}
      </div>
    </AbdmScope>
  );
};

interface IConsentArtefactCardProps {
  artefact: ConsentArtefact;
  facilityId: string;
  patientId: string;
  encounterId: string;
}

function ConsentArtefactCard({
  artefact,
  facilityId,
  patientId,
  encounterId,
}: IConsentArtefactCardProps) {
  const { t } = useTranslation(I18NNAMESPACE);

  const { isLoading, error } = useQuery({
    queryKey: ["healthInformation", "status", artefact.id],
    queryFn: () => apis.healthInformation.get(artefact.id),
    retry: false,
    staleTime: 60_000,
  });

  const isWaiting =
    !isLoading && (error as APIError | null)?.status === 404;
  const recordStatus = isWaiting
    ? t("artefact_status__waiting")
    : t("artefact_status__fetched");

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-xs">
      <div className="min-w-0 flex-1">
        <h5 className="truncate text-sm leading-5 font-semibold">
          {artefact.hip ?? t("unknown_facility")}
        </h5>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
          {t("status")}:{" "}
          {isLoading ? (
            <Spinner className="size-3" />
          ) : (
            <span className="text-foreground">{recordStatus}</span>
          )}
        </p>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link
          to={healthInformationPath(
            facilityId,
            patientId,
            encounterId,
            artefact.id,
          )}
        >
          {t("view")}
        </Link>
      </Button>
    </div>
  );
}

interface IConsentRequestCardProps {
  consent: ConsentRequest;
  encounter: Encounter;
  patient: Patient;
}

function ConsentRequestCard({
  consent,
  encounter,
  patient,
}: IConsentRequestCardProps) {
  const { t } = useTranslation(I18NNAMESPACE);
  const [expanded, setExpanded] = useState(false);

  const checkStatusMutation = useMutation({
    mutationFn: apis.consent.checkStatus,
    onSuccess: (data) => {
      toast.success(data?.detail ?? t("checking_consent_status"));
      toast.warning(t("async_operation_warning"));
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("error_checking_consent_status")));
    },
  });

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-4 p-4 sm:px-6">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="min-w-0 flex-1 space-y-3 rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-expanded={expanded}
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">
                {t(`consent__purpose__${consent.purpose}`)}
              </span>
              <Badge
                variant={CONSENT_STATUS_VARIANTS[consent.status] ?? "secondary"}
              >
                {t(`consent__status__${consent.status}`, {
                  defaultValue: consent.status,
                })}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("valid_till", {
                date: dayjs(consent.expiry).format("MMM D, YYYY"),
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("consent_records_date_range", {
                from: dayjs(consent.from_time).format("MMM D, YYYY"),
                to: dayjs(consent.to_time).format("MMM D, YYYY"),
              })}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium">{t("hi_types")}:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {consent.hi_types.map((hiType) => (
                <Badge key={hiType} variant="secondary">
                  {t(`consent__hi_type__${hiType}`)}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              {t("created_on")}:{" "}
              {dayjs(consent.created_date).format("MMM DD, YYYY HH:mm")}
            </span>
            <span>
              {t("modified_on")}:{" "}
              {dayjs(consent.modified_date).format("MMM DD, YYYY HH:mm")}
            </span>
          </div>
        </button>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <Button
            onClick={() => checkStatusMutation.mutate(consent.id)}
            loading={checkStatusMutation.isPending}
            variant="ghost"
            size="sm"
          >
            {!checkStatusMutation.isPending && <RefreshCcwIcon />}
            <span className="hidden sm:inline">{t("check_status")}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-label={expanded ? t("collapse") : t("expand")}
          >
            <ChevronDownIcon
              className={cn(
                "size-5 transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-soft-background p-4 sm:px-6">
          {consent.consent_artefacts?.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {consent.consent_artefacts.map((artefact) => (
                <ConsentArtefactCard
                  key={artefact.id}
                  artefact={artefact}
                  facilityId={encounter.facility.id}
                  patientId={patient.id}
                  encounterId={encounter.id}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              {consent.status === "REQUESTED"
                ? t("consent_request_waiting_approval")
                : t("consent_request_rejected")}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

export default AbdmEncounterTab;
