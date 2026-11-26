"use client";

import * as z from "zod";

import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import { FC, useEffect } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trans, useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { GenerateScanAndShareQR } from "./GenerateScanAndShareQR";
import { HealthFacility } from "@/types/healthFacility";
import { I18NNAMESPACE } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Meta } from "@/types/meta";
import { apis } from "@/apis";
import { errorMessage } from "@/apis/request";
import { toast } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type ConfigureHealthFacilityFormProps = {
  facilityId: string;
  onSuccess?: (data: HealthFacility) => void;
  meta?: Meta;
};

const configureHealthFacilityFormSchema = z.object({
  hf_id: z.string().min(1),
});

type ConfigureHealthFacilityFormValues = z.infer<
  typeof configureHealthFacilityFormSchema
>;

export const ConfigureHealthFacilityForm: FC<ConfigureHealthFacilityFormProps> = ({
  facilityId,
  onSuccess,
  meta,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);

  const { data: healthFacility, refetch } = useQuery({
    queryKey: ["healthFacility", facilityId],
    queryFn: () => apis.healthFacility.get(facilityId),
    enabled: !!facilityId,
  });

  useEffect(() => {
    if (healthFacility) {
      form.setValue("hf_id", healthFacility.hf_id);
    }
  }, [healthFacility]);

  const form = useForm<ConfigureHealthFacilityFormValues>({
    resolver: zodResolver(configureHealthFacilityFormSchema),
    defaultValues: {
      hf_id: "",
    },
  });

  const handleError = (error: Error) => {
    toast.error(errorMessage(error, t("health_facility__config_update_error")));
  };

  const handleUpdate = (data: HealthFacility) => {
    if (data?.registered) {
      toast.success(t("health_facility__config_update_success"));
      refetch();
      onSuccess?.(data);
    } else {
      toast.warning(
        data?.detail || t("health_facility__config_registration_error")
      );
      refetch();
      onSuccess?.(data);
    }
  };

  const registerHealthFacilityAsServiceMutation = useMutation({
    mutationFn: () => apis.healthFacility.registerAsService(facilityId),
    onSuccess: handleUpdate,
    onError: handleError,
  });

  const updateHealthFacilityMutation = useMutation({
    mutationFn: (body: Partial<HealthFacility>) =>
      apis.healthFacility.partialUpdate(facilityId, body),
    onSuccess: handleUpdate,
    onError: handleError,
  });

  const createHealthFacilityMutation = useMutation({
    mutationFn: apis.healthFacility.create,
    onSuccess: handleUpdate,
    onError: handleError,
  });

  function onSubmit(values: ConfigureHealthFacilityFormValues) {
    if (values.hf_id === healthFacility?.hf_id) {
      registerHealthFacilityAsServiceMutation.mutate();
    } else if (healthFacility) {
      updateHealthFacilityMutation.mutate({
        hf_id: values.hf_id,
      });
    } else {
      createHealthFacilityMutation.mutate({
        facility: facilityId,
        hf_id: values.hf_id,
      });
    }
  }

  const registered = !!healthFacility?.registered;

  return (
    <div className="flex flex-col gap-8">
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.stopPropagation();
            form.handleSubmit(onSubmit)(e);
          }}
          className="space-y-5"
        >
          <FormField
            control={form.control}
            name="hf_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("health_facility__hf_id")}</FormLabel>
                <div className="flex items-center gap-3">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <Tooltip>
                    <TooltipTrigger
                      type="button"
                      aria-label={t(registered ? "registered" : "not_registered")}
                      className={
                        registered ? "text-primary" : "text-amber-500"
                      }
                    >
                      {registered ? (
                        <CircleCheckIcon className="size-6" />
                      ) : (
                        <CircleAlertIcon className="size-6" />
                      )}
                    </TooltipTrigger>
                    <TooltipContent className="flex-col items-start gap-1 py-2">
                      <span className="text-sm font-semibold">
                        {t(registered ? "registered" : "not_registered")}
                      </span>
                      {registered ? (
                        <>
                          <span>{t("health_facility__registered")}</span>
                          <span className="font-semibold">
                            {t("no_action_required")}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>
                            <Trans
                              i18nKey="health_facility__not_registered_1"
                              ns={I18NNAMESPACE}
                              components={{ strong: <strong /> }}
                            />
                          </span>
                          <span>
                            <Trans
                              i18nKey="health_facility__not_registered_1.1"
                              ns={I18NNAMESPACE}
                              components={{ strong: <strong /> }}
                            />
                          </span>
                        </>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            // disabled={
            //   form.watch("hf_id") === healthFacility?.hf_id &&
            //   healthFacility?.registered
            // }
            loading={
              registerHealthFacilityAsServiceMutation.isPending ||
              updateHealthFacilityMutation.isPending ||
              createHealthFacilityMutation.isPending
            }
          >
            {t("health_facility__link")}
          </Button>
        </form>
      </Form>

      {healthFacility && (
        <GenerateScanAndShareQR
          healthFacilityId={healthFacility.hf_id}
          scanAndShareUrl={meta?.config?.scanAndShareUrl}
        />
      )}
    </div>
  );
};
