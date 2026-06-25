import {
  CONSENT_HI_TYPES,
  CONSENT_PURPOSES,
  ConsentRequest,
} from "@/types/consent";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AbhaNumber } from "@/types/abhaNumber";
import { Button } from "@/components/ui/button";
import { DatePicker } from "./ui/date-picker";
import { DatePickerWithRange } from "./ui/date-range-picker";
import { Encounter } from "@/types/encounter";
import { FC } from "react";
import { I18NNAMESPACE } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "./ui/multi-select";
import { apis } from "@/apis";
import dayjs from "@/lib/dayjs";
import { toast } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type CreateConsentRequestFormProps = {
  abhaNumber?: AbhaNumber;
  encounter: Encounter;
  onSuccess?: (consentRequest: ConsentRequest) => void;
};

const createConsentRequestFormSchema = z.object({
  patient_abha: z.string(),
  purpose: z.enum(CONSENT_PURPOSES),
  time_range: z.object({
    from: z.date(),
    to: z.date(),
  }),
  hi_types: z.array(z.enum(CONSENT_HI_TYPES)),
  expiry: z.date(),
});

type CreateConsentRequestFormValues = z.infer<
  typeof createConsentRequestFormSchema
>;

const CreateConsentRequestForm: FC<CreateConsentRequestFormProps> = ({
  abhaNumber,
  encounter,
  onSuccess,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);

  const form = useForm<CreateConsentRequestFormValues>({
    resolver: zodResolver(createConsentRequestFormSchema),
    defaultValues: {
      patient_abha: abhaNumber?.health_id,
      purpose: "CAREMGT",
      time_range: {
        from: dayjs().subtract(30, "day").toDate(),
        to: dayjs().toDate(),
      },
      hi_types: CONSENT_HI_TYPES.map((type) => type),
      expiry: dayjs().add(30, "day").toDate(),
    },
  });

  const createConsentRequestMutation = useMutation({
    mutationFn: apis.consent.create,
    onSuccess: (data) => {
      toast.success(t("consent_requested_successfully"));
      onSuccess?.(data);
    },
  });

  function onSubmit(values: CreateConsentRequestFormValues) {
    createConsentRequestMutation.mutate({
      ...values,
      patient_abha: form.getValues("patient_abha"),
      encounter: encounter.id,
      from_time: values.time_range.from,
      to_time: values.time_range.to,
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.stopPropagation();
          form.handleSubmit(onSubmit)(e);
        }}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          disabled
          name="patient_abha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("consent_request__patient_identifier")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("consent_request__purpose")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("consent_request__purpose")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CONSENT_PURPOSES.map((purpose) => (
                    <SelectItem key={purpose} value={purpose}>
                      {t(`consent__purpose__${purpose}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="time_range"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("consent_request__date_range")}</FormLabel>
              <DatePickerWithRange
                value={field.value}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hi_types"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("consent_request__expiry")}</FormLabel>
              <MultiSelect
                options={CONSENT_HI_TYPES.map((type) => ({
                  label: t(`consent__hi_type__${type}`),
                  value: type,
                }))}
                onValueChange={field.onChange}
                defaultValue={field.value}
                modalPopover
                maxCount={7}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiry"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("consent_request__expiry")}</FormLabel>
              <DatePicker date={field.value} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          variant="default"
          loading={createConsentRequestMutation.isPending}
        >
          {t("request_consent")}
        </Button>
      </form>
    </Form>
  );
};

export default CreateConsentRequestForm;
