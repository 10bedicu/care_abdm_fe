import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/utils";
import { z } from "zod";

import { Button, ButtonWithTimer } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { apis } from "@/apis";
import { AbhaNumber } from "@/types/abhaNumber";
import useMultiStepForm, { InjectedStepProps } from "./useMultiStepForm";
import {
  I18NNAMESPACE,
  MAX_OTP_RESEND_COUNT,
  SUPPORTED_AUTH_METHODS,
} from "@/lib/constants";

type LinkWithOtpProps = {
  onSuccess: (abhaNumber: AbhaNumber) => void;
};

type FormMemory = {
  id: string;
  idType: "aadhaar" | "mobile" | "abha-number" | "abha-address";
  otpSystem: "aadhaar" | "abdm";

  transactionId: string;
  abhaNumber?: AbhaNumber;
};

export const LinkWithOtp: FC<LinkWithOtpProps> = ({ onSuccess }) => {
  const { currentStep } = useMultiStepForm<FormMemory>(
    [
      <EnterId {...({} as EnterIdProps)} />,
      <VerifyId {...({ onSuccess } as VerifyIdProps)} />,
    ],
    {
      id: "",
      idType: "aadhaar",
      otpSystem: "aadhaar",
      transactionId: "",
    }
  );

  return <div>{currentStep}</div>;
};

const getIdType = (id: string) => {
  const isNumeric = !isNaN(Number(id?.trim()));

  if (isNumeric && (id?.length === 12 || id?.length === 16)) {
    return "aadhaar";
  } else if (isNumeric && id?.length === 10) {
    return "mobile";
  } else if (isNumeric && id?.length === 14) {
    return "abha-number";
  } else {
    return "abha-address";
  }
};

type EnterIdProps = InjectedStepProps<FormMemory>;

const enterIdFormSchema = z.object({
  id: z.string().min(4, {
    message: "Enter a valid ID",
  }),
  disclaimer_1: z.boolean().refine((value) => value === true, {
    message: "Please read and accept this policy",
  }),
  disclaimer_2: z.boolean().refine((value) => value === true, {
    message: "Please read and accept this policy",
  }),
  disclaimer_3: z.boolean().refine((value) => value === true, {
    message: "Please read and accept this policy",
  }),
});

type EnterIdFormValues = z.infer<typeof enterIdFormSchema>;

const EnterId: FC<EnterIdProps> = ({ setMemory, next }) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const [showAuthMethods, setShowAuthMethods] = useState(false);
  const [authMethods, setAuthMethods] = useState<
    (typeof SUPPORTED_AUTH_METHODS)[number][]
  >([]);

  const form = useForm<EnterIdFormValues>({
    resolver: zodResolver(enterIdFormSchema),
    defaultValues: {
      id: "",
      disclaimer_1: false,
      disclaimer_2: false,
      disclaimer_3: false,
    },
  });

  const checkAuthMethodsMutation = useMutation({
    mutationFn: apis.healthId.abhaLoginCheckAuthMethods,
    onSuccess: (data) => {
      if (data) {
        const methods = data.auth_methods.filter((method: string) =>
          SUPPORTED_AUTH_METHODS.find((supported) => supported === method)
        );

        if (methods.length === 0) {
          toast.warning(t("get_auth_mode_error"));
        }
      }
    },
  });

  async function onSubmit(values: EnterIdFormValues) {
    const id = values.id.trim().replace(/-/g, "").replace(/ /g, "");
    const idType = getIdType(id);

    if (idType === "aadhaar") {
      setAuthMethods(["AADHAAR_OTP"]);
    } else if (idType === "mobile") {
      setAuthMethods(["MOBILE_OTP"]);
    } else {
      await checkAuthMethodsMutation.mutateAsync({
        abha_address: id,
      });
    }

    setShowAuthMethods(true);
  }

  const sendOtpMutation = useMutation({
    mutationFn: apis.healthId.abhaLoginSendOtp,
    onSuccess: (data) => {
      if (data) {
        toast.success(data.detail);
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
        }));
        next();
      }
    },
  });

  return (
    <Form {...form}>
      <form className="mt-6 space-y-4">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("any_id")}</FormLabel>
              <FormControl>
                <Input placeholder={t("enter_any_id")} {...field} className="truncate" />
              </FormControl>
              <FormDescription>{t("any_id_description")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {Array.from({ length: 3 }).map((_, index) => (
          <FormField
            key={`disclaimer_${index + 1}`}
            control={form.control}
            name={`disclaimer_${index + 1}` as keyof EnterIdFormValues}
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value as boolean}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    {t(`abha__disclaimer_${index + 2}`)}
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        ))}

        <Popover
          open={showAuthMethods}
          onOpenChange={(open) => !open && setShowAuthMethods(false)}
        >
          <PopoverTrigger>
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                form.handleSubmit(onSubmit)(e);
              }}
              variant="secondary"
            >
              {t("get_auth_methods")}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-2 gap-2">
            {authMethods.map((method) => (
              <Button
                key={method}
                type="button"
                variant="default"
                className="w-full justify-start"
                onClick={() => {
                  const id = form
                    .getValues("id")
                    .trim()
                    .replace(/-/g, "")
                    .replace(/ /g, "");
                  const idType = getIdType(id);
                  const otpSystem =
                    method === "AADHAAR_OTP" ? "aadhaar" : "abdm";

                  setMemory((prev) => ({
                    ...prev,
                    id,
                    idType,
                    otpSystem,
                  }));

                  sendOtpMutation.mutate({
                    value: id,
                    type: idType,
                    otp_system: otpSystem,
                  });
                }}
                loading={sendOtpMutation.isPending}
              >
                {t(`abha__auth_method__${method}`)}
              </Button>
            ))}
          </PopoverContent>
        </Popover>
      </form>
    </Form>
  );
};

type VerifyIdProps = InjectedStepProps<FormMemory> & {
  onSuccess: (abhaNumber: AbhaNumber) => void;
};

const verifyIdFormSchema = z.object({
  _id: z.string(),
  otp: z.string().length(6, {
    message: "OTP must be 6 digits",
  }),
  _resendOtpCount: z.number().max(MAX_OTP_RESEND_COUNT, {
    message: "You can only resend OTP 3 times",
  }),
});

type VerifyIdFormValues = z.infer<typeof verifyIdFormSchema>;

const VerifyId: FC<VerifyIdProps> = ({ memory, setMemory, onSuccess }) => {
  const { t } = useTranslation(I18NNAMESPACE);

  const form = useForm<VerifyIdFormValues>({
    resolver: zodResolver(verifyIdFormSchema),
    defaultValues: {
      _id: memory?.id ?? "",
      otp: "",
      _resendOtpCount: 0,
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: apis.healthId.abhaLoginVerifyOtp,
    onSuccess: (data) => {
      if (data) {
        toast.success(t("verify_otp_success"));
        onSuccess(data.abha_number);
      }
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: apis.healthId.abhaLoginSendOtp,
    onSuccess: (data) => {
      if (data) {
        toast.success(data.detail);
        form.setValue("otp", "");
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
        }));
      }
    },
  });

  function onSubmit(values: VerifyIdFormValues) {
    if (!memory?.transactionId) return;

    verifyOtpMutation.mutate({
      otp: values.otp,
      transaction_id: memory.transactionId,
      type: memory.idType,
      otp_system: memory.otpSystem,
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.stopPropagation();
          form.handleSubmit(onSubmit)(e);
        }}
        className="mt-6 space-y-4"
      >
        <FormField
          control={form.control}
          name="_id"
          disabled
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("any_id")}</FormLabel>
              <FormControl>
                <Input placeholder={t("enter_any_id")} {...field} />
              </FormControl>
              <FormDescription>{t("any_id_description")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2 w-fit">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>One-Time Password</FormLabel>
                <FormControl>
                  <InputOTP autoFocus maxLength={6} {...field}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <ButtonWithTimer
            type="button"
            variant="secondary"
            disabled={form.getValues("_resendOtpCount") >= MAX_OTP_RESEND_COUNT}
            onClick={() => {
              if (!memory?.id || !memory.idType || !memory.otpSystem) return;

              form.setValue(
                "_resendOtpCount",
                form.getValues("_resendOtpCount") + 1
              );
              resendOtpMutation.mutate({
                value: memory.id,
                type: memory.idType,
                otp_system: memory.otpSystem,
              });
            }}
            loading={resendOtpMutation.isPending}
          >
            {t("resend_otp")}
          </ButtonWithTimer>
        </div>

        <Button
          type="submit"
          variant="default"
          loading={verifyOtpMutation.isPending}
        >
          {t("verify_and_link")}
        </Button>
      </form>
    </Form>
  );
};
