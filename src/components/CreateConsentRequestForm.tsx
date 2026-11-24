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
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DialogFooter } from "@/components/ui/dialog";
import { Encounter } from "@/types/encounter";
import { FC, useId } from "react";
import { I18NNAMESPACE } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
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
  onCancel: () => void;
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
  onCancel,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const dateRangeLabelId = useId();

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
        className="space-y-5"
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
              <Select value={field.value} onValueChange={field.onChange}>
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
            <FormItem>
              <FormLabel id={dateRangeLabelId}>
                {t("consent_request__date_range")}
              </FormLabel>
              <FormControl>
                <DateRangePicker
                  value={field.value}
                  onApply={field.onChange}
                  allowOpenEnded={false}
                  aria-labelledby={dateRangeLabelId}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hi_types"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("consent_request__hi_types")}</FormLabel>
              <FormControl>
                <MultiSelect
                  options={CONSENT_HI_TYPES.map((type) => ({
                    label: t(`consent__hi_type__${type}`),
                    value: type,
                  }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={t("consent_request__hi_types_placeholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("consent_request__expiry")}</FormLabel>
              <DatePicker
                date={field.value}
                onChange={field.onChange}
                className="sm:w-full"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createConsentRequestMutation.isPending}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" loading={createConsentRequestMutation.isPending}>
            {t("request_consent")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default CreateConsentRequestForm;
