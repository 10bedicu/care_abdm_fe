import { ConsentArtefact, ConsentRequest } from "@/types/consent";
import { ChevronDownIcon, Loader2Icon, RefreshCcwIcon } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { APIError } from "@/apis/request";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { EncounterTabProps } from ".";
import { Encounter } from "@/types/encounter";
import { FC, useState } from "react";
import { I18NNAMESPACE } from "@/lib/constants";
import { Link } from "raviger";
import { Patient } from "@/types/patient";
import { apis } from "@/apis";
import { cn } from "@/lib/utils";
import dayjs from "@/lib/dayjs";
import { healthInformationPath } from "@/lib/paths";
import { toast } from "@/lib/utils";
import { useTranslation } from "react-i18next";

function getConsentStatusBadgeClass(status: ConsentRequest["status"]) {
  switch (status) {
    case "GRANTED":
      return "border-transparent bg-green-100 text-green-800";
    case "REQUESTED":
      return "border-transparent bg-amber-100 text-amber-800";
    case "EXPIRED":
      return "border-transparent bg-secondary-100 text-secondary-700";
    case "DENIED":
    case "REVOKED":
      return "border-transparent bg-red-100 text-red-800";
    default:
      return "border-transparent bg-secondary-100 text-secondary-700";
  }
}

export const AbdmEncounterTab: FC<EncounterTabProps> = ({
  patient,
  encounter,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);

  const { data, isLoading } = useQuery({
    queryKey: ["consents", patient.id],
    queryFn: () =>
      apis.consent.list({
        patient: patient.id,
        encounter: encounter.id,
        ordering: "-created_date",
      }),
    enabled: !!patient.id,
  });

  if (isLoading) {
    return (
      <div className="abdm-container mt-12 flex flex-col items-center justify-center gap-2.5">
        <Loader2Icon className="h-6 w-6 animate-spin text-primary-500" />
        <p className="font-semibold text-secondary-600">
          {t("loading_consent_requests")}
        </p>
      </div>
    );
  }

  if (!data?.results.length) {
    return (
      <div className="abdm-container mt-12 flex flex-col items-center justify-center gap-2.5">
        <p className="font-semibold text-secondary-600">
          {t("no_records_found")}
        </p>
        <p className="text-sm text-secondary-600">
          {t("raise_consent_request")}
        </p>
      </div>
    );
  }

  return (
    <div className="abdm-container mt-6 flex flex-col gap-6">
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
    <div className="flex items-center gap-3 rounded-lg border border-secondary-200 bg-white p-3 shadow-sm">
      <div className="min-w-0 flex-1">
        <h5 className="truncate font-semibold leading-5 text-secondary-900">
          {artefact.hip ?? t("unknown_facility")}
        </h5>
        <p className="mt-0.5 text-sm text-secondary-500">
          {t("status")}:{" "}
          {isLoading ? (
            <Loader2Icon className="inline size-3 animate-spin text-secondary-400" />
          ) : (
            <span className="text-secondary-700">{recordStatus}</span>
          )}
        </p>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link
          href={healthInformationPath(
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
  });

  return (
    <div className="overflow-hidden rounded-lg border border-secondary-200 bg-white shadow-sm">
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="min-w-0 flex-1 space-y-3 text-left"
            aria-expanded={expanded}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-secondary-900">
                  {t(`consent__purpose__${consent.purpose}`)}
                </span>
                <Badge
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    getConsentStatusBadgeClass(consent.status),
                  )}
                >
                  {t(`consent__status__${consent.status}`, {
                    defaultValue: consent.status,
                  })}
                </Badge>
              </div>
              <p className="text-sm text-secondary-600">
                {t("valid_till", {
                  date: dayjs(consent.expiry).format("MMM DD, YYYY"),
                })}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-secondary-900">
                {t("hi_types")}:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {consent.hi_types.map((hiType) => (
                  <Badge
                    key={hiType}
                    variant="secondary"
                    className="rounded-full"
                  >
                    {t(`consent__hi_type__${hiType}`)}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1 text-xs text-secondary-500 sm:flex-row sm:items-center sm:justify-between">
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
              onClick={(event) => {
                event.stopPropagation();
                checkStatusMutation.mutate(consent.id);
              }}
              loading={checkStatusMutation.isPending}
              variant="ghost"
              size="sm"
              className="text-secondary-700 hover:text-secondary-900"
            >
              <RefreshCcwIcon />
              <span className="hidden sm:inline">{t("check_status")}</span>
            </Button>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="rounded-md p-1 text-secondary-500 transition-colors hover:bg-secondary-100 hover:text-secondary-700"
              aria-expanded={expanded}
              aria-label={expanded ? t("collapse") : t("expand")}
            >
              <ChevronDownIcon
                className={cn(
                  "size-5 transition-transform duration-200",
                  expanded && "rotate-180",
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-secondary-200 bg-secondary-50 px-4 py-4 sm:px-6">
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
            <p className="text-center text-sm text-secondary-700">
              {consent.status === "REQUESTED"
                ? t("consent_request_waiting_approval")
                : t("consent_request_rejected")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default AbdmEncounterTab;
