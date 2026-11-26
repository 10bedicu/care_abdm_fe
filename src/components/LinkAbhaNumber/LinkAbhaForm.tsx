import { AbhaProfile, AbhaProfileProps } from "./ShowAbhaProfile";
import { Button, ButtonWithTimer } from "@/components/ui/button";
import {
  CircleCheckIcon,
  CircleIcon,
  CircleXIcon,
  FingerprintIcon,
} from "lucide-react";
import {
  ComponentProps,
  FC,
  JSX,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  I18NNAMESPACE,
  MAX_OTP_RESEND_COUNT,
  SUPPORTED_AUTH_METHODS,
} from "@/lib/constants";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trans, useTranslation } from "react-i18next";
import useMultiStepForm, { InjectedStepProps } from "./useMultiStepForm";
import { useMutation, useQuery } from "@tanstack/react-query";

import { AbhaLoginAccount, AbhaNumber } from "@/types/abhaNumber";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { Textarea } from "@/components/ui/textarea";
import { apis } from "@/apis";
import { cn } from "@/lib/utils";
import { errorMessage } from "@/apis/request";
import { toast } from "@/lib/utils";
import { useErrorToast } from "@/hooks/useErrorToast";
import { useForm } from "react-hook-form";
import { useLinkAbhaNumberContext } from ".";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type LinkAbhaFormProps = {
  onSuccess: (abhaNumber: AbhaNumber) => void;
};

type IdType = "aadhaar" | "mobile" | "abha-number" | "abha-address";

type FormMemory = {
  // Shared
  transactionId: string;
  abhaNumber?: AbhaNumber;

  // Create flow fields
  aadhaarNumber: string;
  mobileNumber: string;
  patientName: string;
  retryCount: number;
  error?: string;

  // Link flow fields
  id: string;
  idType: IdType;
  otpSystem: "aadhaar" | "abdm";
  loginAccounts?: AbhaLoginAccount[];
};

const OTP_LENGTH = 6;

/** OTP entry as on the host's sign-in: slots share the width of the column. */
const OtpInput = (
  props: Omit<
    ComponentProps<typeof InputOTP>,
    "maxLength" | "render" | "children"
  >,
) => (
  <InputOTP
    maxLength={OTP_LENGTH}
    inputMode="numeric"
    autoComplete="one-time-code"
    containerClassName="w-full"
    className="w-full"
    {...props}
  >
    <InputOTPGroup className="w-full justify-between">
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <InputOTPSlot
          key={index}
          index={index}
          className="h-12 min-w-0 flex-1 font-mono text-lg"
        />
      ))}
    </InputOTPGroup>
  </InputOTP>
);

const normalizeId = (id: string) =>
  (id ?? "").trim().replace(/-/g, "").replace(/ /g, "");

const getIdType = (id: string): IdType => {
  const isNumeric = id.length > 0 && !isNaN(Number(id));

  if (isNumeric && (id.length === 12 || id.length === 16)) {
    return "aadhaar";
  } else if (isNumeric && id.length === 10) {
    return "mobile";
  } else if (isNumeric && id.length === 14) {
    return "abha-number";
  } else {
    return "abha-address";
  }
};

export const LinkAbhaForm: FC<LinkAbhaFormProps> = ({ onSuccess }) => {
  const { currentStep } = useMultiStepForm<FormMemory>(
    [
      {
        id: "enter-identifier",
        element: <EnterIdentifier {...({} as EnterIdentifierProps)} />,
      },
      {
        id: "verify-id",
        element: <VerifyId {...({ onSuccess } as VerifyIdProps)} />,
      },
      {
        id: "choose-abha-account",
        element: (
          <ChooseAbhaAccount {...({ onSuccess } as ChooseAbhaAccountProps)} />
        ),
      },
      {
        id: "verify-aadhaar-with-otp",
        element: (
          <VerifyAadhaarWithOtp {...({} as VerifyAadhaarWithOtpProps)} />
        ),
      },
      {
        id: "verify-aadhaar-with-demographics",
        element: (
          <VerifyAadhaarWithDemographics
            {...({} as VerifyAadhaarWithDemographicsProps)}
          />
        ),
      },
      {
        id: "verify-aadhaar-with-face",
        element: (
          <VerifyAadhaarWithFace {...({} as VerifyAadhaarWithFaceProps)} />
        ),
      },
      {
        id: "verify-aadhaar-with-bio",
        element: (
          <VerifyAadhaarWithBio {...({} as VerifyAadhaarWithBioProps)} />
        ),
      },
      {
        id: "handle-existing-abha",
        element: <HandleExistingAbha {...({} as HandleExistingAbhaProps)} />,
      },
      {
        id: "link-mobile",
        element: <LinkMobile {...({} as LinkMobileProps)} />,
      },
      {
        id: "verify-mobile",
        element: <VerifyMobile {...({} as VerifyMobileProps)} />,
      },
      {
        id: "choose-abha-address",
        element: <ChooseAbhaAddress {...({} as ChooseAbhaAddressProps)} />,
      },
      {
        id: "show-abha-profile",
        element: <AbhaProfile {...({ onSuccess } as AbhaProfileProps)} />,
      },
    ],
    {
      transactionId: "",
      aadhaarNumber: "",
      mobileNumber: "",
      patientName: "",
      retryCount: 0,
      id: "",
      idType: "aadhaar",
      otpSystem: "aadhaar",
    },
  );

  return <div>{currentStep}</div>;
};

type EnterIdentifierProps = InjectedStepProps<FormMemory>;

const enterIdentifierFormSchema = z
  .object({
    id: z.string().min(4, { message: "validation__enter_valid_id" }),
    name: z.string().optional(),
    disclaimer_1: z.boolean(),
    disclaimer_2: z.boolean(),
    disclaimer_3: z.boolean(),
    disclaimer_4: z.boolean(),
    disclaimer_5: z.boolean(),
    disclaimer_6: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const id = normalizeId(data.id);
    const idType = getIdType(id);
    const isCreateFlow = idType === "aadhaar";

    if (isCreateFlow) {
      if (!(id.length === 12 || id.length === 16)) {
        ctx.addIssue({
          path: ["id"],
          code: z.ZodIssueCode.custom,
          message: "validation__aadhaar_number_length",
        });
      }

      if (!data.name || data.name.trim().length === 0) {
        ctx.addIssue({
          path: ["name"],
          code: z.ZodIssueCode.custom,
          message: "validation__name_required",
        });
      }

      for (let i = 1; i <= 6; i++) {
        const key = `disclaimer_${i}` as keyof typeof data;
        if (data[key] !== true) {
          ctx.addIssue({
            path: [key],
            code: z.ZodIssueCode.custom,
            message: "validation__accept_policy",
          });
        }
      }
    } else {
      for (let i = 2; i <= 6; i++) {
        const key = `disclaimer_${i}` as keyof typeof data;
        if (data[key] !== true) {
          ctx.addIssue({
            path: [key],
            code: z.ZodIssueCode.custom,
            message: "validation__accept_policy",
          });
        }
      }
    }
  });

type EnterIdentifierFormValues = z.infer<typeof enterIdentifierFormSchema>;

const EnterIdentifier: FC<EnterIdentifierProps> = ({ setMemory, goTo }) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const { healthFacility, currentUser } = useLinkAbhaNumberContext();

  const faceAuthUrl =
    window.__CARE_PLUGIN_RUNTIME__?.meta?.care_abdm_fe?.config?.faceAuthUrl;

  const [showAuthMethods, setShowAuthMethods] = useState(false);
  const [authMethods, setAuthMethods] = useState<
    (typeof SUPPORTED_AUTH_METHODS)[number][]
  >([]);

  const form = useForm<EnterIdentifierFormValues>({
    resolver: zodResolver(enterIdentifierFormSchema),
    mode: "onChange",
    defaultValues: {
      id: "",
      name: "",
      disclaimer_1: false,
      disclaimer_2: false,
      disclaimer_3: false,
      disclaimer_4: false,
      disclaimer_5: false,
      disclaimer_6: false,
    },
  });

  const idWatch = form.watch("id");
  const normalizedId = normalizeId(idWatch || "");
  const idType = getIdType(normalizedId);
  const isCreateFlow = idType === "aadhaar";

  const handleCheckAllDisclaimers = () => {
    const count = isCreateFlow ? 6 : 5;
    const start = isCreateFlow ? 1 : 2;
    Array.from({ length: count }).forEach((_, index) => {
      const fieldName = `disclaimer_${
        index + start
      }` as keyof EnterIdentifierFormValues;
      form.setValue(fieldName, true, { shouldValidate: true });
    });
  };

  const sendAadhaarOtpMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateSendAadhaarOtp,
    onSuccess: (data) => {
      if (data) {
        toast.success(data.detail || t("otp_sent_successfully"));
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
          aadhaarNumber: normalizedId,
        }));
        goTo("verify-aadhaar-with-otp");
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("error_sending_otp")));
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

        setAuthMethods(methods as (typeof SUPPORTED_AUTH_METHODS)[number][]);
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("error_fetching_auth_methods")));
    },
  });

  const sendOtpMutation = useMutation({
    mutationFn: apis.healthId.abhaLoginSendOtp,
    onSuccess: (data) => {
      if (data) {
        toast.success(data.detail || t("otp_sent_successfully"));
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
        }));
        goTo("verify-id");
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("error_sending_otp")));
    },
  });

  function onSubmitCreate(values: EnterIdentifierFormValues) {
    sendAadhaarOtpMutation.mutate({
      aadhaar: normalizeId(values.id),
    });
  }

  async function onSubmitLink() {
    if (idType === "aadhaar") {
      setAuthMethods(["AADHAAR_OTP"]);
    } else if (idType === "mobile") {
      setAuthMethods(["MOBILE_OTP"]);
    } else if (idType === "abha-number") {
      setAuthMethods(["AADHAAR_OTP", "MOBILE_OTP"]);
    } else {
      try {
        await checkAuthMethodsMutation.mutateAsync({
          abha_address: normalizedId,
        });
      } catch {
        // toasted by the mutation
        return;
      }
    }

    setShowAuthMethods(true);
  }

  const currentUserName = useMemo(
    () =>
      [
        currentUser?.prefix,
        currentUser?.first_name,
        currentUser?.last_name,
        currentUser?.suffix,
      ]
        .filter(Boolean)
        .join(" ") ||
      currentUser?.username ||
      t("user"),
    [currentUser]
  );

  const disclaimerIndices = isCreateFlow ? [1, 2, 3, 4, 5, 6] : [2, 3, 4, 5, 6];

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.stopPropagation();
          form.handleSubmit(onSubmitCreate)(e);
        }}
        className="space-y-5"
      >
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("any_id")}</FormLabel>
              <FormControl>
                <Input placeholder={t("enter_any_id")} {...field} />
              </FormControl>
              <FormDescription>
                {isCreateFlow
                  ? t("aadhaar_number_not_stored")
                  : t("any_id_description")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {disclaimerIndices.map((disclaimerIndex) => (
          <FormField
            key={`disclaimer_${disclaimerIndex}`}
            control={form.control}
            name={
              `disclaimer_${disclaimerIndex}` as keyof EnterIdentifierFormValues
            }
            render={({ field }) => (
              <FormItem className="flex items-start gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value as boolean}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="min-w-0 space-y-1">
                  <FormLabel className="block leading-5 font-normal">
                    <Trans
                      t={t}
                      i18nKey={`abha__disclaimer_${disclaimerIndex}`}
                      values={{ user: currentUserName }}
                      components={{
                        input: (
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field: nameField }) => (
                              <FormItem className="mx-1 inline-block w-auto align-middle">
                                <FormControl>
                                  <Input
                                    {...nameField}
                                    placeholder={t("enter_beneficiary_name")}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ),
                      }}
                    />
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        ))}

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleCheckAllDisclaimers();
            }}
          >
            {t("check_all_terms")}
          </Button>
        </div>

        {isCreateFlow ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Button
              type="submit"
              variant="default"
              loading={sendAadhaarOtpMutation.isPending}
              disabled={!form.formState.isValid}
              className={cn(
                "w-full",
                !healthFacility?.benefit_name && "md:col-span-2",
              )}
            >
              {t("verify_with_otp")}
            </Button>
            {healthFacility?.benefit_name && (
              <Button
                type="button"
                variant="default"
                disabled={!form.formState.isValid}
                onClick={() => {
                  setMemory((prev) => ({
                    ...prev,
                    transactionId: "",
                    aadhaarNumber: normalizedId,
                    patientName: form.getValues("name") ?? "",
                  }));
                  goTo("verify-aadhaar-with-demographics");
                }}
                className="w-full"
              >
                {t("verify_with_demographics")}
              </Button>
            )}
            <Button
              type="button"
              variant="default"
              disabled={!form.formState.isValid}
              onClick={() => {
                setMemory((prev) => ({
                  ...prev,
                  transactionId: "",
                  aadhaarNumber: normalizedId,
                  patientName: form.getValues("name") ?? "",
                }));
                goTo("verify-aadhaar-with-bio");
              }}
              className="w-full"
            >
              {t("verify_with_bio")}
            </Button>
            {faceAuthUrl && (
              <Button
                type="button"
                variant="default"
                disabled={!form.formState.isValid}
                onClick={() => {
                  setMemory((prev) => ({
                    ...prev,
                    transactionId: "",
                    aadhaarNumber: normalizedId,
                    patientName: form.getValues("name") ?? "",
                  }));
                  goTo("verify-aadhaar-with-face");
                }}
                className="w-full"
              >
                {t("verify_with_face")}
              </Button>
            )}
          </div>
        ) : (
          <Popover
            open={showAuthMethods}
            onOpenChange={(open) => !open && setShowAuthMethods(false)}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                className="w-full"
                disabled={!form.formState.isValid}
                loading={checkAuthMethodsMutation.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  form.handleSubmit(onSubmitLink)(e);
                }}
              >
                {t("get_auth_methods")}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-(--anchor-width) gap-1 p-1"
            >
              {authMethods.map((method) => {
                const otpSystem =
                  method === "AADHAAR_OTP" ? "aadhaar" : "abdm";
                const isSendingThisMethod =
                  sendOtpMutation.isPending &&
                  sendOtpMutation.variables?.otp_system === otpSystem;

                return (
                  <Button
                    key={method}
                    type="button"
                    variant="ghost"
                    className="w-full justify-start"
                    disabled={sendOtpMutation.isPending}
                    onClick={() => {
                      setMemory((prev) => ({
                        ...prev,
                        id: normalizedId,
                        idType,
                        otpSystem,
                      }));

                      sendOtpMutation.mutate({
                        value: normalizedId,
                        type: idType,
                        otp_system: otpSystem,
                      });
                    }}
                    loading={isSendingThisMethod}
                  >
                    {t(`abha__auth_method__${method}`)}
                  </Button>
                );
              })}
            </PopoverContent>
          </Popover>
        )}
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
    message: "validation__otp_length",
  }),
  _resendOtpCount: z.number().max(MAX_OTP_RESEND_COUNT, {
    message: "validation__otp_resend_limit",
  }),
});

type VerifyIdFormValues = z.infer<typeof verifyIdFormSchema>;

const VerifyId: FC<VerifyIdProps> = ({
  memory,
  setMemory,
  goTo,
  onSuccess,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const { facilityId } = useLinkAbhaNumberContext();

  const form = useForm<VerifyIdFormValues>({
    resolver: zodResolver(verifyIdFormSchema),
    defaultValues: {
      _id: memory?.id ?? "",
      otp: "",
      _resendOtpCount: 0,
    },
  });

  const verifyUserMutation = useMutation({
    mutationFn: apis.healthId.abhaLoginVerifyUser,
    onSuccess: (data) => {
      if (data) {
        toast.success(t("otp_verified_successfully"));
        onSuccess(data.abha_number);
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("error_verifying_abha_account")));
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: apis.healthId.abhaLoginVerifyOtp,
    onSuccess: (data) => {
      if (!data || !facilityId) return;

      const accounts = data.accounts ?? [];

      setMemory((prev) => ({
        ...prev,
        transactionId: data.transaction_id,
        loginAccounts: accounts,
      }));

      if (accounts.length > 1) {
        goTo("choose-abha-account");
        return;
      }

      verifyUserMutation.mutate({
        transaction_id: data.transaction_id,
        account_id: accounts[0]?.id ?? 0,
        facility: facilityId,
      });
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("error_verifying_otp")));
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: apis.healthId.abhaLoginSendOtp,
    onSuccess: (data) => {
      if (data) {
        toast.success(data.detail || t("otp_resend_successfully"));
        form.setValue("otp", "");
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
        }));
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("error_resending_otp")));
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
        className="space-y-5"
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

        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("one_time_password")}</FormLabel>
              <FormControl>
                <OtpInput autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            variant="default"
            className="w-full"
            loading={verifyOtpMutation.isPending || verifyUserMutation.isPending}
          >
            {t("verify_and_link")}
          </Button>
          <ButtonWithTimer
            type="button"
            variant="ghost"
            className="w-full underline underline-offset-4"
            countdownLabel={(seconds) => t("resend_otp_timer", { time: seconds })}
            disabled={form.getValues("_resendOtpCount") >= MAX_OTP_RESEND_COUNT}
            onClick={() => {
              if (!memory?.id || !memory.idType || !memory.otpSystem) return;

              form.setValue(
                "_resendOtpCount",
                form.getValues("_resendOtpCount") + 1,
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
      </form>
    </Form>
  );
};

type ChooseAbhaAccountProps = InjectedStepProps<FormMemory> & {
  onSuccess: (abhaNumber: AbhaNumber) => void;
};

const ChooseAbhaAccount: FC<ChooseAbhaAccountProps> = ({
  memory,
  onSuccess,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const { facilityId } = useLinkAbhaNumberContext();

  const accounts = memory?.loginAccounts ?? [];

  const verifyUserMutation = useMutation({
    mutationFn: apis.healthId.abhaLoginVerifyUser,
    onSuccess: (data) => {
      if (data) {
        toast.success(t("otp_verified_successfully"));
        onSuccess(data.abha_number);
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("error_verifying_abha_account")));
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">{t("choose_abha_account")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("choose_abha_account_description")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {accounts.map((account) => (
          <button
            key={account.id}
            type="button"
            disabled={verifyUserMutation.isPending}
            onClick={() => {
              if (!memory?.transactionId || !facilityId) return;

              verifyUserMutation.mutate({
                transaction_id: memory.transactionId,
                account_id: account.id,
                facility: facilityId,
              });
            }}
            className="flex items-center gap-3 rounded-md border border-border bg-card p-3 text-left shadow-xs transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          >
            {account.profile_photo ? (
              <img
                src={`data:image/jpeg;base64,${account.profile_photo}`}
                alt={account.name ?? t("abha_account")}
                className="size-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-900">
                {(account.name ?? "?").charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-medium">
                {account.name ?? t("abha_account")}
              </span>
              {account.abha_number && (
                <span className="text-xs text-muted-foreground">
                  {account.abha_number}
                </span>
              )}
              {account.preferred_abha_address && (
                <span className="text-xs text-muted-foreground">
                  {account.preferred_abha_address}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

type VerifyAadhaarWithOtpProps = InjectedStepProps<FormMemory>;

const verifyAadhaarWithOtpFormSchema = z.object({
  _aadhaar: z.string(),
  otp: z.string().length(6, {
    message: "validation__otp_length",
  }),
  mobile: z.string().length(10, {
    message: "validation__mobile_number_length",
  }),
  _resendOtpCount: z.number().max(MAX_OTP_RESEND_COUNT, {
    message: "validation__otp_resend_limit",
  }),
});

type VerifyAadhaarWithOtpFormValues = z.infer<
  typeof verifyAadhaarWithOtpFormSchema
>;

const VerifyAadhaarWithOtp: FC<VerifyAadhaarWithOtpProps> = ({
  memory,
  setMemory,
  goTo,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const { facilityId } = useLinkAbhaNumberContext();

  const form = useForm<VerifyAadhaarWithOtpFormValues>({
    resolver: zodResolver(verifyAadhaarWithOtpFormSchema),
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
        toast.success(data.detail || t("otp_verified_successfully"));
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
          mobileNumber: form.getValues("mobile"),
          abhaNumber: data.abha_number,
        }));
        goTo("handle-existing-abha");
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("error_verifying_otp")));
    },
  });

  const resendAadhaarOtpMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateSendAadhaarOtp,
    onSuccess: (data) => {
      if (data) {
        toast.success(data.detail || t("otp_resend_successfully"));
        form.setValue("otp", "");
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
        }));
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("error_resending_otp")));
    },
  });

  function onSubmit(values: VerifyAadhaarWithOtpFormValues) {
    if (!memory?.transactionId || !facilityId) return;

    verifyAadhaarOtpMutation.mutate({
      otp: values.otp,
      mobile: values.mobile,
      transaction_id: memory.transactionId,
      facility: facilityId,
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
          name="_aadhaar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("aadhaar_number_or_virtual_id")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("enter_aadhaar_number_or_virtual_id")}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t("aadhaar_number_not_stored")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("one_time_password")}</FormLabel>
              <FormControl>
                <OtpInput autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("mobile_number")}</FormLabel>
              <FormControl>
                <Input placeholder={t("enter_mobile_number")} {...field} />
              </FormControl>
              <FormDescription>
                {t("mobile_number_not_linked_with_aadhaar")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            variant="default"
            className="w-full"
            loading={verifyAadhaarOtpMutation.isPending}
          >
            {t("verify_otp")}
          </Button>
          <ButtonWithTimer
            type="button"
            variant="ghost"
            className="w-full underline underline-offset-4"
            countdownLabel={(seconds) => t("resend_otp_timer", { time: seconds })}
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
      </form>
    </Form>
  );
};

type VerifyAadhaarWithDemographicsProps = InjectedStepProps<FormMemory>;

const verifyAadhaarWithDemographicsFormSchema = z.object({
  _aadhaar: z.string(),
  name: z.string().min(1),
  gender: z.enum(["M", "F", "O"]),
  date_of_birth: z.string().date(),
  state_code: z.number().int(),
  district_code: z.number().int(),
  address: z.string().optional(),
  pin_code: z
    .string()
    .length(6, {
      message: "validation__pincode_length",
    })
    .optional(),
  mobile: z
    .string()
    .length(10, {
      message: "validation__mobile_number_length",
    })
    .optional(),
  profile_photo: z.string().optional(),
});

type VerifyAadhaarWithDemographicsFormValues = z.infer<
  typeof verifyAadhaarWithDemographicsFormSchema
>;

const VerifyAadhaarWithDemographics: FC<VerifyAadhaarWithDemographicsProps> = ({
  memory,
  setMemory,
  goTo,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const { facilityId } = useLinkAbhaNumberContext();

  const form = useForm<VerifyAadhaarWithDemographicsFormValues>({
    resolver: zodResolver(verifyAadhaarWithDemographicsFormSchema),
    defaultValues: {
      _aadhaar: memory?.aadhaarNumber ?? "",
      name: memory?.patientName ?? "",
    },
  });

  const { data: states, error: statesError } = useQuery({
    queryKey: ["states"],
    queryFn: () => apis.utility.states(),
  });
  useErrorToast(statesError, t("error_fetching_states"));

  const { data: districts, error: districtsError } = useQuery({
    queryKey: ["districts", form.watch("state_code")],
    queryFn: () => apis.utility.districts(form.watch("state_code")),
    enabled: !!form.watch("state_code"),
  });
  useErrorToast(districtsError, t("error_fetching_districts"));

  const verifyAadhaarDemographicsMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateVerifyAadhaarDemographics,
    onSuccess: (data, variables) => {
      if (data) {
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
          abhaNumber: {
            ...data.abha_number,
            address:
              data.abha_number.address?.trim() || variables.address || null,
            pincode:
              data.abha_number.pincode?.trim() || variables.pin_code || null,
          },
        }));

        if (!data.transaction_id) {
          goTo("show-abha-profile");
          return;
        }

        goTo("handle-existing-abha");
      }
    },
    onError: (error) => {
      const message = errorMessage(
        error,
        t("error_verifying_aadhaar_demographics"),
      );
      form.setError("_aadhaar", { message });
      toast.error(message);
    },
  });

  function onSubmit(values: VerifyAadhaarWithDemographicsFormValues) {
    if (!memory || !facilityId) return;

    verifyAadhaarDemographicsMutation.mutate({
      facility: facilityId,
      transaction_id: memory.transactionId || undefined,
      aadhaar: memory.aadhaarNumber,
      name: values.name,
      gender: values.gender,
      date_of_birth: new Date(values.date_of_birth).toISOString().slice(0, 10),
      state_code: values.state_code.toString(),
      district_code: values.district_code.toString(),
      pin_code: values.pin_code,
      address: values.address,
      mobile: values.mobile,
      profile_photo: values.profile_photo,
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
          name="_aadhaar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("aadhaar_number_or_virtual_id")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("enter_aadhaar_number_or_virtual_id")}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t("aadhaar_number_not_stored")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel aria-required>{t("name")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("enter_name_as_per_aadhaar")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("name_must_match_aadhaar")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel aria-required>{t("gender")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("gender")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[
                      { id: "M", label: t("male") },
                      { id: "F", label: t("female") },
                      { id: "O", label: t("other") },
                    ].map((gender) => (
                      <SelectItem key={gender.id} value={gender.id}>
                        {gender.label}
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
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel aria-required>{t("date_of_birth")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel aria-required>{t("state")}</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_a_state")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(states ?? []).map((state) => (
                      <SelectItem
                        key={state.state_code}
                        value={state.state_code.toString()}
                      >
                        {state.state_name}
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
            name="district_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel aria-required>{t("district")}</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_a_district")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(districts ?? []).map((district) => (
                      <SelectItem
                        key={district.district_code}
                        value={district.district_code.toString()}
                      >
                        {district.district_name}
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
            name="pin_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("pincode")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("enter_pincode")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("address")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("enter_address_as_per_aadhaar")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("mobile_number")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("enter_mobile_number")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          variant="default"
          className="w-full"
          loading={verifyAadhaarDemographicsMutation.isPending}
        >
          {t("verify_demographics")}
        </Button>
      </form>
    </Form>
  );
};

type VerifyAadhaarWithFaceProps = InjectedStepProps<FormMemory>;

const verifyAadhaarWithFaceFormSchema = z.object({
  _aadhaar: z.string(),
  mobile: z.string().length(10, {
    message: "validation__mobile_number_length",
  }),
});

type VerifyAadhaarWithFaceFormValues = z.infer<
  typeof verifyAadhaarWithBioFormSchema
>;

const VerifyAadhaarWithFace: FC<VerifyAadhaarWithFaceProps> = ({
  memory,
  setMemory,
  goTo,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const { facilityId } = useLinkAbhaNumberContext();
  const [isPolling, setIsPolling] = useState(false);
  const faceAuthUrl =
    window?.__CARE_PLUGIN_RUNTIME__?.meta?.care_abdm_fe?.config?.faceAuthUrl;

  const form = useForm<VerifyAadhaarWithFaceFormValues>({
    resolver: zodResolver(verifyAadhaarWithFaceFormSchema),
    defaultValues: {
      _aadhaar: memory?.aadhaarNumber ?? "",
      mobile: "",
    },
  });

  const verifyAadhaarFaceMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateVerifyAadhaarFace,
    onSuccess: (data) => {
      if (data) {
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
          mobileNumber: form.getValues("mobile"),
          abhaNumber: data.abha_number,
        }));

        if (!data.transaction_id) {
          goTo("show-abha-profile");
          return;
        }

        goTo("handle-existing-abha");
      }
    },
    onError: (error) => {
      const message = errorMessage(error, t("error_verifying_aadhaar_face"));
      toast.error(message);
      setMemory((prev) => ({
        ...prev,
        transactionId: "",
        error: message,
      }));
    },
  });

  const capturePidViaFaceMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateCapturePidViaFace,
    onSuccess: (data) => {
      if (data) {
        if (data.status === "COMPLETE") {
          setIsPolling(false);
          setMemory((prev) => ({
            ...prev,
            transactionId: data.transaction_id,
          }));

          if (!facilityId) return;

          verifyAadhaarFaceMutation.mutate({
            aadhaar: form.getValues("_aadhaar"),
            mobile: form.getValues("mobile"),
            transaction_id: memory?.transactionId,
            facility: facilityId,
          });
        } else if (data.status === "FAILED") {
          setIsPolling(false);
          setMemory((prev) => ({
            ...prev,
            error: data.detail,
          }));
        }
      }
    },
    onError: (error) => {
      const message = errorMessage(error, t("error_capturing_pid_via_face"));
      setIsPolling(false);
      setMemory((prev) => ({
        ...prev,
        error: message,
      }));
      toast.error(message);
    },
  });

  const authInitViaFaceMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateAuthInitViaFace,
    onSuccess: (data) => {
      if (data) {
        setMemory((prev) => ({ ...prev, transactionId: data.transaction_id }));
        setIsPolling(true);
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("error_initiating_face_auth")));
    },
  });

  useEffect(() => {
    if (isPolling) {
      const interval = setInterval(() => {
        capturePidViaFaceMutation.mutate({
          transaction_id: authInitViaFaceMutation.data?.transaction_id ?? "",
        });
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [isPolling]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function onSubmit(_values: VerifyAadhaarWithFaceFormValues) {
    authInitViaFaceMutation.mutate();
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
          name="_aadhaar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("aadhaar_number_or_virtual_id")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("enter_aadhaar_number_or_virtual_id")}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t("aadhaar_number_not_stored")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobile"
          disabled={!authInitViaFaceMutation.isIdle}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("mobile_number")}</FormLabel>
              <FormControl>
                <Input placeholder={t("enter_mobile_number")} {...field} />
              </FormControl>
              <FormDescription>
                {t("mobile_number_not_linked_with_aadhaar")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {authInitViaFaceMutation.isSuccess && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-strong-border bg-white p-4">
            <QRCodeSVG
              value={`${faceAuthUrl}?txnId=${authInitViaFaceMutation.data?.transaction_id}`}
              className="h-auto w-full max-w-80"
            />
          </div>
        )}

        {memory?.error && (
          <p className="text-sm text-destructive">{memory.error}</p>
        )}
        {(!authInitViaFaceMutation.isSuccess ||
          ((memory?.retryCount ?? 0) < 3 && memory?.error)) && (
          <Button
            type="button"
            variant="default"
            className="w-full"
            loading={authInitViaFaceMutation.isPending}
            disabled={!form.formState.isValid}
            onClick={() => {
              setMemory((prev) => ({
                ...prev,
                retryCount: (prev?.retryCount ?? 0) + 1,
                error: "",
              }));
              authInitViaFaceMutation.mutate();
            }}
          >
            {!memory?.retryCount
              ? t("initiate_face_auth")
              : t("retry_face_auth")}
          </Button>
        )}
      </form>
    </Form>
  );
};

type VerifyAadhaarWithBioProps = InjectedStepProps<FormMemory>;

const verifyAadhaarWithBioFormSchema = z.object({
  _aadhaar: z.string(),
  fingerprint_pid: z.string().min(1, {
    message: "validation__fingerprint_required",
  }),
  mobile: z.string().length(10, {
    message: "validation__mobile_number_length",
  }),
});

type VerifyAadhaarWithBioFormValues = z.infer<
  typeof verifyAadhaarWithBioFormSchema
>;

const VerifyAadhaarWithBio: FC<VerifyAadhaarWithBioProps> = ({
  memory,
  setMemory,
  goTo,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const { facilityId } = useLinkAbhaNumberContext();

  const form = useForm<VerifyAadhaarWithBioFormValues>({
    resolver: zodResolver(verifyAadhaarWithBioFormSchema),
    defaultValues: {
      _aadhaar: memory?.aadhaarNumber ?? "",
      fingerprint_pid: "",
      mobile: "",
    },
  });

  const verifyAadhaarBioMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateVerifyAadhaarBio,
    onSuccess: (data) => {
      if (data) {
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
          mobileNumber: form.getValues("mobile"),
          abhaNumber: data.abha_number,
        }));

        if (!data.transaction_id) {
          goTo("show-abha-profile");
          return;
        }

        goTo("handle-existing-abha");
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("error_verifying_aadhaar_bio")));
    },
  });

  const captureFingerprintMutation = useMutation({
    mutationFn: apis.rdService.capture,
    onSuccess: (data) => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, "text/xml");

      const respElement = xmlDoc.getElementsByTagName("Resp")[0];
      const errorCode = respElement.getAttribute("errCode");

      if (errorCode !== "0") {
        const errorMessage =
          respElement.getAttribute("errInfo") ?? t("fingerprint_capture_failed");
        toast.error(errorMessage);
        form.setError("fingerprint_pid", { message: errorMessage });
        return;
      }

      form.clearErrors("fingerprint_pid");
      form.setValue("fingerprint_pid", data);
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("error_capturing_fingerprint")));
    },
  });

  const captureFingerprintStatus = useMemo(() => {
    if (captureFingerprintMutation.isIdle) {
      return "idle";
    }

    if (captureFingerprintMutation.isPending) {
      return "pending";
    }

    if (captureFingerprintMutation.isError) {
      return "error";
    }

    if (captureFingerprintMutation.isSuccess) {
      if (form.formState.errors.fingerprint_pid) {
        return "error";
      }
    }

    return "success";
  }, [
    captureFingerprintMutation.data,
    captureFingerprintMutation.status,
    form.formState.errors.fingerprint_pid,
  ]);

  function onSubmit(values: VerifyAadhaarWithBioFormValues) {
    if (!facilityId) return;

    verifyAadhaarBioMutation.mutate({
      aadhaar: form.getValues("_aadhaar"),
      fingerprint_pid: values.fingerprint_pid,
      mobile: values.mobile,
      transaction_id: memory?.transactionId || undefined,
      facility: facilityId,
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
          name="_aadhaar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("aadhaar_number_or_virtual_id")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("enter_aadhaar_number_or_virtual_id")}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t("aadhaar_number_not_stored")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fingerprint_pid"
          render={() => (
            <FormItem>
              <FormLabel>{t("fingerprint")}</FormLabel>
              <FormControl>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-strong-border bg-muted-background p-8">
                    <div
                      className={cn(
                        "flex size-32 items-center justify-center rounded-full bg-primary-50 transition-all duration-500",
                        captureFingerprintStatus === "success" && "bg-green-50",
                        captureFingerprintStatus === "error" && "bg-red-50",
                      )}
                    >
                      <div className="relative size-16">
                        <FingerprintIcon
                          className={cn(
                            "size-full",
                            captureFingerprintStatus === "success"
                              ? "text-primary-500"
                              : captureFingerprintStatus === "error"
                                ? "text-destructive"
                                : "text-disabled-foreground",
                          )}
                        />
                        <FingerprintIcon
                          className="absolute inset-0 size-full animate-fill-up text-disabled-foreground"
                          style={{
                            maskImage:
                              "linear-gradient(to top, black 50%, transparent 50%)",
                            WebkitMaskImage:
                              "linear-gradient(to top, black 50%, transparent 50%)",
                            maskSize: "100% 200%",
                            WebkitMaskSize: "100% 200%",
                            maskRepeat: "no-repeat",
                            WebkitMaskRepeat: "no-repeat",
                            maskPosition: "0% 100%",
                            WebkitMaskPosition: "0% 100%",
                          }}
                        />
                      </div>
                    </div>
                    {["idle", "error"].includes(captureFingerprintStatus) && (
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => {
                          captureFingerprintMutation.mutate();
                        }}
                      >
                        {t("capture_fingerprint")}
                      </Button>
                    )}
                  </div>
                </div>
              </FormControl>
              {captureFingerprintStatus !== "idle" && (
                <FormDescription>
                  <div className="text-center">
                    <h3
                      className={cn(
                        "text-base font-medium transition-colors duration-500",
                        captureFingerprintStatus === "success" &&
                          "text-green-600",
                        captureFingerprintStatus === "error" &&
                          "text-destructive",
                        captureFingerprintStatus === "pending" &&
                          "text-foreground",
                      )}
                    >
                      {captureFingerprintStatus === "success"
                        ? t("fingerprint_verified")
                        : captureFingerprintStatus === "error"
                        ? t("fingerprint_verification_failed")
                        : t("follow_the_rd_instructions")}
                    </h3>
                    {captureFingerprintStatus === "pending" && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("fingerprint_scan_instructions")}
                      </p>
                    )}
                  </div>
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("mobile_number")}</FormLabel>
              <FormControl>
                <Input placeholder={t("enter_mobile_number")} {...field} />
              </FormControl>
              <FormDescription>
                {t("mobile_number_not_linked_with_aadhaar")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          variant="default"
          className="w-full"
          loading={verifyAadhaarBioMutation.isPending}
          disabled={!form.formState.isValid}
        >
          {t("verify_bio")}
        </Button>
      </form>
    </Form>
  );
};

type HandleExistingAbhaProps = InjectedStepProps<FormMemory>;

const HandleExistingAbha: FC<HandleExistingAbhaProps> = ({ memory, goTo }) => {
  const { t } = useTranslation(I18NNAMESPACE);

  useEffect(() => {
    if (memory?.abhaNumber?.new) {
      goTo("link-mobile");
    }
  }, [memory?.abhaNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h3 className="text-base font-semibold">{t("abha_number_exists")}</h3>
      <p className="text-sm text-muted-foreground">
        {t("abha_number_exists_description")}
      </p>
      <div className="mt-5 flex flex-col items-center justify-center gap-3">
        <Button
          type="button"
          variant="default"
          className="w-full"
          onClick={() => {
            goTo("link-mobile");
          }}
        >
          {t("create_new_abha_address")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => {
            if (!memory?.abhaNumber) {
              toast.error(t("no_abha_number_found"));
              return;
            }
            goTo("show-abha-profile");
          }}
        >
          {t("use_existing_abha_address")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {memory?.abhaNumber?.abha_address}
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

const LinkMobile: FC<LinkMobileProps> = ({ memory, setMemory, goTo }) => {
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
      goTo("choose-abha-address");
    }
  }, [memory?.abhaNumber, memory?.mobileNumber]); // eslint-disable-line

  const linkMobileMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateLinkMobileNumber,
    onSuccess: (data) => {
      if (data) {
        toast.success(data.detail || t("otp_sent_successfully"));
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
        }));
        goTo("verify-mobile");
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("error_sending_otp")));
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
        className="space-y-5"
      >
        <FormField
          control={form.control}
          name="_mobile"
          disabled
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("mobile_number")}</FormLabel>
              <FormControl>
                <Input placeholder={t("enter_mobile_number")} {...field} />
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
          className="w-full"
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
    message: "validation__otp_length",
  }),
  _resendOtpCount: z.number().max(MAX_OTP_RESEND_COUNT, {
    message: "validation__otp_resend_limit",
  }),
});

type VerifyMobileFormValues = z.infer<typeof verifyMobileFormSchema>;

const VerifyMobile: FC<VerifyMobileProps> = ({ memory, setMemory, goTo }) => {
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
        toast.success(data.detail || t("otp_verified_successfully"));
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
        }));
        goTo("choose-abha-address");
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("error_verifying_otp")));
    },
  });

  const resendMobileOtpMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateLinkMobileNumber,
    onSuccess: (data) => {
      if (data) {
        toast.success(data.detail || t("otp_resend_successfully"));
        form.setValue("otp", "");
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
        }));
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("error_resending_otp")));
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
        className="space-y-5"
      >
        <FormField
          control={form.control}
          name="_mobile"
          disabled
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("mobile_number")}</FormLabel>
              <FormControl>
                <Input placeholder={t("enter_mobile_number")} {...field} />
              </FormControl>
              <FormDescription>
                {t("mobile_number_different_from_aadhaar_mobile_number")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("one_time_password")}</FormLabel>
              <FormControl>
                <OtpInput autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            variant="default"
            className="w-full"
            loading={verifyMobileOtpMutation.isPending}
          >
            {t("verify_otp")}
          </Button>
          <ButtonWithTimer
            type="button"
            variant="ghost"
            className="w-full underline underline-offset-4"
            countdownLabel={(seconds) => t("resend_otp_timer", { time: seconds })}
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
    <div className="flex items-center gap-1.5">
      <span>
        {isInitialState ? (
          <CircleIcon className="size-4 text-muted-foreground" />
        ) : condition ? (
          <CircleCheckIcon className="size-4 text-primary" />
        ) : (
          <CircleXIcon className="size-4 text-destructive" />
        )}
      </span>
      <span
        className={cn(
          isInitialState
            ? "text-foreground"
            : condition
              ? "text-primary"
              : "text-destructive",
        )}
      >
        {content}
      </span>
    </div>
  );
};

type ChooseAbhaAddressProps = InjectedStepProps<FormMemory>;

const chooseAbhaAddressFormSchema = z.object({
  abhaAddress: z.string().regex(/^(?![\d.])[a-zA-Z0-9._]{4,}(?<!\.)$/, {
    message: "validation__invalid_abha_address",
  }),
});

type ChooseAbhaAddressFormValues = z.infer<typeof chooseAbhaAddressFormSchema>;

const ChooseAbhaAddress: FC<ChooseAbhaAddressProps> = ({
  memory,
  setMemory,
  goTo,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const { facilityId } = useLinkAbhaNumberContext();

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
    onError: (error) => {
      toast.error(
        errorMessage(error, t("error_fetching_abha_address_suggestions")),
      );
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
        toast.success(t("abha_address_created_successfully"));
        goTo("show-abha-profile");
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("abha_address_created_error")));
    },
  });

  function onSubmit(values: ChooseAbhaAddressFormValues) {
    if (!memory?.transactionId || !facilityId) return;

    enrollAbhaAddressMutation.mutate({
      abha_address: values.abhaAddress,
      transaction_id: memory.transactionId,
      facility: facilityId,
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
          name="abhaAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("abha_address")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("enter_abha_address_of_choice")}
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
            <h4 className="text-sm font-medium">
              {t("abha_address_suggestions")}
            </h4>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              {suggestions
                .filter(
                  (suggestion) => suggestion !== form.watch("abhaAddress")
                )
                .map((suggestion) => (
                  <Badge key={suggestion} variant="primary" asChild>
                    <button
                      type="button"
                      onClick={() => form.setValue("abhaAddress", suggestion)}
                    >
                      {suggestion}
                    </button>
                  </Badge>
                ))}
            </div>
          </div>
        )}

        <Button
          type="submit"
          variant="default"
          className="w-full"
          loading={enrollAbhaAddressMutation.isPending}
        >
          {t("create_abha_address")}
        </Button>
      </form>
    </Form>
  );
};
