import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CircleCheckIcon, CircleIcon, CircleXIcon } from "lucide-react";
import { FC, JSX, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/utils";
import { z } from "zod";

import { cn } from "@/lib/utils";

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

import { apis } from "@/apis";
import { AbhaNumber } from "@/types/abhaNumber";
import useMultiStepForm, { InjectedStepProps } from "./useMultiStepForm";
import { I18NNAMESPACE, MAX_OTP_RESEND_COUNT } from "@/lib/constants";

type CreateWithAadhaarProps = {
  onSuccess: (abhaNumber: AbhaNumber) => void;
};

type FormMemory = {
  aadhaarNumber: string;
  mobileNumber: string;

  transactionId: string;
  abhaNumber?: AbhaNumber;
};

export const CreateWithAadhaar: FC<CreateWithAadhaarProps> = ({
  onSuccess,
}) => {
  const { currentStep } = useMultiStepForm<FormMemory>(
    [
      <EnterAadhaar {...({} as EnterAadhaarProps)} />,
      <VerifyAadhaar {...({} as VerifyAadhaarProps)} />,
      <HandleExistingAbha {...({ onSuccess } as HandleExistingAbhaProps)} />,
      <LinkMobile {...({} as LinkMobileProps)} />,
      <VerifyMobile {...({} as VerifyMobileProps)} />,
      <ChooseAbhaAddress {...({ onSuccess } as ChooseAbhaAddressProps)} />,
    ],
    {
      aadhaarNumber: "",
      mobileNumber: "",

      transactionId: "",
    }
  );

  return <div>{currentStep}</div>;
};

type EnterAadhaarProps = InjectedStepProps<FormMemory>;

const enterAadhaarFormSchema = z.object({
  aadhaar: z
    .string()
    .refine((value) => value.length === 12 || value.length === 16, {
      message: "Aadhaar number must be 12 or 16 digits",
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
  disclaimer_4: z.boolean().refine((value) => value === true, {
    message: "Please read and accept this policy",
  }),
});

type EnterAadhaarFormValues = z.infer<typeof enterAadhaarFormSchema>;

const EnterAadhaar: FC<EnterAadhaarProps> = ({ setMemory, next }) => {
  const { t } = useTranslation(I18NNAMESPACE);

  const form = useForm<EnterAadhaarFormValues>({
    resolver: zodResolver(enterAadhaarFormSchema),
    defaultValues: {
      aadhaar: "",
      disclaimer_1: false,
      disclaimer_2: false,
      disclaimer_3: false,
      disclaimer_4: false,
    },
  });

  const sendAadhaarOtpMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateSendAadhaarOtp,
    onSuccess: (data) => {
      if (data) {
        toast.success(data.detail);
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
          aadhaarNumber: form.getValues("aadhaar"),
        }));
        next();
      }
    },
  });

  function onSubmit(values: EnterAadhaarFormValues) {
    sendAadhaarOtpMutation.mutate({
      aadhaar: values.aadhaar,
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
          name="aadhaar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aadhaar Number / Virtual ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter Aadhaar number OR Virtual ID"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Aadhaar number will not be stored by CARE.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {Array.from({ length: 4 }).map((_, index) => (
          <FormField
            key={`disclaimer_${index + 1}`}
            control={form.control}
            name={`disclaimer_${index + 1}` as keyof EnterAadhaarFormValues}
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
                    {t(`abha__disclaimer_${index + 1}`)}
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        ))}
        <Button
          type="submit"
          variant="default"
          loading={sendAadhaarOtpMutation.isPending}
        >
          {t("send_otp")}
        </Button>
      </form>
    </Form>
  );
};

type VerifyAadhaarProps = InjectedStepProps<FormMemory>;

const verifyAadhaarFormSchema = z.object({
  _aadhaar: z.string(),
  otp: z.string().length(6, {
    message: "OTP must be 6 digits",
  }),
  mobile: z.string().length(10, {
    message: "Mobile number must be 10 digits",
  }),
  _resendOtpCount: z.number().max(MAX_OTP_RESEND_COUNT, {
    message: "You can only resend OTP 3 times",
  }),
});

type VerifyAadhaarFormValues = z.infer<typeof verifyAadhaarFormSchema>;

const VerifyAadhaar: FC<VerifyAadhaarProps> = ({ memory, setMemory, next }) => {
  const { t } = useTranslation(I18NNAMESPACE);

  const form = useForm<VerifyAadhaarFormValues>({
    resolver: zodResolver(verifyAadhaarFormSchema),
    defaultValues: {
      _aadhaar: memory?.aadhaarNumber ?? "",
      otp: "",
      mobile: "",
      _resendOtpCount: 0,
    },
  });

  const verifyAadhaarOtpMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateVerifyAadhaarOtp,
    onSuccess: (data) => {
      if (data) {
        toast.success(data.detail);
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
          mobileNumber: form.getValues("mobile"),
          abhaNumber: data.abha_number,
        }));
        next();
      }
    },
  });

  const resendAadhaarOtpMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateSendAadhaarOtp,
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

  function onSubmit(values: VerifyAadhaarFormValues) {
    if (!memory?.transactionId) return;

    verifyAadhaarOtpMutation.mutate({
      otp: values.otp,
      mobile: values.mobile,
      transaction_id: memory.transactionId,
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
          disabled
          name="_aadhaar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aadhaar Number / Virtual ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter 12 digital Aadhaar  number OR 16 digit virtual ID"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Aadhaar number will not be stored by CARE.
              </FormDescription>
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
              form.setValue(
                "_resendOtpCount",
                form.getValues("_resendOtpCount") + 1
              );
              resendAadhaarOtpMutation.mutate({
                aadhaar: form.getValues("_aadhaar"),
              });
            }}
            loading={resendAadhaarOtpMutation.isPending}
          >
            {t("resend_otp")}
          </ButtonWithTimer>
        </div>

        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter 10 digit mobile number" {...field} />
              </FormControl>
              <FormDescription>
                If the given mobile number is not linked with Aadhaar, we'll
                send you an OTP to verify.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          variant="default"
          loading={verifyAadhaarOtpMutation.isPending}
        >
          {t("verify_otp")}
        </Button>
      </form>
    </Form>
  );
};

type HandleExistingAbhaProps = InjectedStepProps<FormMemory> & {
  onSuccess: (abhaNumber: AbhaNumber) => void;
};

const HandleExistingAbha: FC<HandleExistingAbhaProps> = ({
  memory,
  next,
  onSuccess,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);

  useEffect(() => {
    if (memory?.abhaNumber?.new) {
      next();
    }
  }, [memory?.abhaNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h2 className="text-xl font-semibold text-secondary-800">
        {t("abha_number_exists")}
      </h2>
      <p className="text-sm text-secondary-800">
        {t("abha_number_exists_description")}
      </p>
      <div className="mt-4 flex flex-col items-center justify-center gap-2">
        <Button
          type="button"
          variant="default"
          className="w-full"
          onClick={next}
        >
          {t("create_new_abha_address")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => {
            if (!memory?.abhaNumber) {
              toast.error("No ABHA number found");
              return;
            }
            onSuccess(memory.abhaNumber);
          }}
        >
          {t("use_existing_abha_address")}
        </Button>
        <p className="text-xs text-secondary-800">
          {memory?.abhaNumber?.health_id}
        </p>
      </div>
    </div>
  );
};

type LinkMobileProps = InjectedStepProps<FormMemory>;

const linkMobileFormSchema = z.object({
  _mobile: z.string(),
});

type LinkMobileFormValues = z.infer<typeof linkMobileFormSchema>;

const LinkMobile: FC<LinkMobileProps> = ({ memory, setMemory, goTo, next }) => {
  const { t } = useTranslation(I18NNAMESPACE);

  const form = useForm<LinkMobileFormValues>({
    resolver: zodResolver(linkMobileFormSchema),
    defaultValues: {
      _mobile: memory?.mobileNumber ?? "",
    },
  });

  useEffect(() => {
    if (
      memory?.abhaNumber?.mobile?.replace("+91", "").replace(/ /g, "") ===
      memory?.mobileNumber.replace("+91", "").replace(/ /g, "")
    ) {
      goTo(5); // skip linking mobile number
    }
  }, [memory?.abhaNumber, memory?.mobileNumber]); // eslint-disable-line

  const linkMobileMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateLinkMobileNumber,
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

  function onSubmit(values: LinkMobileFormValues) {
    if (!memory?.transactionId) return;

    linkMobileMutation.mutate({
      mobile: values._mobile,
      transaction_id: memory.transactionId,
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
          name="_mobile"
          disabled
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter 10 digit mobile number" {...field} />
              </FormControl>
              <FormDescription>
                {t("mobile_number_different_from_aadhaar_mobile_number")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          variant="default"
          loading={linkMobileMutation.isPending}
        >
          {t("send_otp")}
        </Button>
      </form>
    </Form>
  );
};

type VerifyMobileProps = InjectedStepProps<FormMemory>;

const verifyMobileFormSchema = z.object({
  _mobile: z.string(),
  otp: z.string().length(6, {
    message: "OTP must be 6 digits",
  }),
  _resendOtpCount: z.number().max(MAX_OTP_RESEND_COUNT, {
    message: "You can only resend OTP 3 times",
  }),
});

type VerifyMobileFormValues = z.infer<typeof verifyMobileFormSchema>;

const VerifyMobile: FC<VerifyMobileProps> = ({ memory, setMemory, next }) => {
  const { t } = useTranslation(I18NNAMESPACE);

  const form = useForm<VerifyMobileFormValues>({
    resolver: zodResolver(verifyMobileFormSchema),
    defaultValues: {
      _mobile: memory?.mobileNumber ?? "",
      otp: "",
      _resendOtpCount: 0,
    },
  });

  const verifyMobileOtpMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateVerifyMobileNumber,
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

  const resendMobileOtpMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateLinkMobileNumber,
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

  function onSubmit(values: VerifyMobileFormValues) {
    if (!memory?.transactionId) return;

    verifyMobileOtpMutation.mutate({
      otp: values.otp,
      transaction_id: memory.transactionId,
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
          name="_mobile"
          disabled
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter 10 digit mobile number" {...field} />
              </FormControl>
              <FormDescription>
                {t("mobile_number_different_from_aadhaar_mobile_number")}
              </FormDescription>
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
              if (!memory?.transactionId) return;

              form.setValue(
                "_resendOtpCount",
                form.getValues("_resendOtpCount") + 1
              );
              resendMobileOtpMutation.mutate({
                mobile: form.getValues("_mobile"),
                transaction_id: memory.transactionId,
              });
            }}
            loading={resendMobileOtpMutation.isPending}
          >
            {t("resend_otp")}
          </ButtonWithTimer>
        </div>

        <Button
          type="submit"
          variant="default"
          loading={verifyMobileOtpMutation.isPending}
        >
          {t("verify_otp")}
        </Button>
      </form>
    </Form>
  );
};

const validateRule = (
  condition: boolean,
  content: JSX.Element | string,
  isInitialState: boolean = false
) => {
  return (
    <div className="flex items-center gap-1">
      <span>
        {isInitialState ? (
          <CircleIcon className="size-4 text-gray-500" />
        ) : condition ? (
          <CircleCheckIcon className="size-4 text-green-500" />
        ) : (
          <CircleXIcon className="size-4 text-red-500" />
        )}
      </span>
      <span
        className={cn(
          isInitialState
            ? "text-black"
            : condition
            ? "text-primary-500"
            : "text-red-500"
        )}
      >
        {content}
      </span>
    </div>
  );
};

type ChooseAbhaAddressProps = InjectedStepProps<FormMemory> & {
  onSuccess: (abhaNumber: AbhaNumber) => void;
};

const chooseAbhaAddressFormSchema = z.object({
  abhaAddress: z.string().regex(/^(?![\d.])[a-zA-Z0-9._]{4,}(?<!\.)$/, {
    message: "Invalid ABHA Address",
  }),
});

type ChooseAbhaAddressFormValues = z.infer<typeof chooseAbhaAddressFormSchema>;

export const ChooseAbhaAddress: FC<ChooseAbhaAddressProps> = ({
  memory,
  setMemory,
  onSuccess,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);

  const [suggestions, setSuggestions] = useState<string[]>([]);

  const form = useForm<ChooseAbhaAddressFormValues>({
    resolver: zodResolver(chooseAbhaAddressFormSchema),
    defaultValues: {
      abhaAddress: "",
    },
  });

  const fetchSuggestionsMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateAbhaAddressSuggestion,
    onSuccess: (data) => {
      if (data) {
        setMemory((prev) => ({ ...prev, transactionId: data.transaction_id }));
        setSuggestions(data.abha_addresses);
      }
    },
  });

  useEffect(() => {
    if (!memory?.transactionId) {
      return;
    }

    fetchSuggestionsMutation.mutate({
      transaction_id: memory.transactionId,
    });
  }, [memory?.transactionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const enrollAbhaAddressMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateEnrolAbhaAddress,
    onSuccess: (data) => {
      if (data) {
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
          abhaNumber: data.abha_number,
        }));
        toast.success("ABHA Address created successfully");
        onSuccess(data.abha_number);
      }
    },
  });

  function onSubmit(values: ChooseAbhaAddressFormValues) {
    if (!memory?.transactionId) return;

    enrollAbhaAddressMutation.mutate({
      abha_address: values.abhaAddress,
      transaction_id: memory.transactionId,
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
          name="abhaAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ABHA Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter ABHA Address of your choice"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {validateRule(
                  form.getValues("abhaAddress").length >= 4,
                  t("abha_address_validation_length_error")
                )}
                {validateRule(
                  isNaN(Number(form.getValues("abhaAddress")[0])) &&
                    form.getValues("abhaAddress")[0] !== ".",
                  t("abha_address_validation_start_error")
                )}
                {validateRule(
                  form.getValues("abhaAddress")[
                    form.getValues("abhaAddress").length - 1
                  ] !== ".",
                  t("abha_address_validation_end_error")
                )}
                {validateRule(
                  /^[0-9a-zA-Z._]+$/.test(form.getValues("abhaAddress")),
                  t("abha_address_validation_character_error")
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {suggestions.length > 0 && (
          <div>
            <h4 className="text-sm text-secondary-800">
              {t("abha_address_suggestions")}
            </h4>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              {suggestions
                .filter(
                  (suggestion) => suggestion !== form.watch("abhaAddress")
                )
                .map((suggestion) => (
                  <p
                    onClick={() => form.setValue("abhaAddress", suggestion)}
                    className="cursor-pointer rounded-md bg-primary-400 px-2.5 py-1 text-xs text-white"
                  >
                    {suggestion}
                  </p>
                ))}
            </div>
          </div>
        )}

        <Button
          type="submit"
          variant="default"
          loading={enrollAbhaAddressMutation.isPending}
        >
          {t("create_abha_address")}
        </Button>
      </form>
    </Form>
  );
};
