import { AbhaProfile, AbhaProfileProps } from "./ShowAbhaProfile";
import { Button, ButtonWithTimer } from "@/components/ui/button";
import {
  CircleCheckIcon,
  CircleIcon,
  CircleXIcon,
  FingerprintIcon,
} from "lucide-react";
import { FC, JSX, useEffect, useMemo, useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { I18NNAMESPACE, MAX_OTP_RESEND_COUNT } from "@/lib/constants";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
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

import { AbhaNumber } from "@/types/abhaNumber";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apis } from "@/apis";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { useLinkAbhaNumberContext } from ".";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type CreateWithAadhaarProps = {
  onSuccess: (abhaNumber: AbhaNumber) => void;
};

type FormMemory = {
  aadhaarNumber: string;
  mobileNumber: string;
  patientName: string;

  transactionId: string;
  abhaNumber?: AbhaNumber;
};

export const CreateWithAadhaar: FC<CreateWithAadhaarProps> = ({
  onSuccess,
}) => {
  const { currentStep } = useMultiStepForm<FormMemory>(
    [
      {
        id: "enter-aadhaar",
        element: <EnterAadhaar {...({} as EnterAadhaarProps)} />,
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
      aadhaarNumber: "",
      mobileNumber: "",
      patientName: "",

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
  name: z.string().min(1, {
    message: "Name is required",
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
  disclaimer_5: z.boolean().refine((value) => value === true, {
    message: "Please read and accept this policy",
  }),
  disclaimer_6: z.boolean().refine((value) => value === true, {
    message: "Please read and accept this policy",
  }),
});

type EnterAadhaarFormValues = z.infer<typeof enterAadhaarFormSchema>;

const EnterAadhaar: FC<EnterAadhaarProps> = ({ setMemory, goTo }) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const { healthFacility, currentUser } = useLinkAbhaNumberContext();

  const form = useForm<EnterAadhaarFormValues>({
    resolver: zodResolver(enterAadhaarFormSchema),
    defaultValues: {
      aadhaar: "",
      name: "",
      disclaimer_1: false,
      disclaimer_2: false,
      disclaimer_3: false,
      disclaimer_4: false,
      disclaimer_5: false,
      disclaimer_6: false,
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
        goTo("verify-aadhaar-with-otp");
      }
    },
  });

  function onSubmit(values: EnterAadhaarFormValues) {
    sendAadhaarOtpMutation.mutate({
      aadhaar: values.aadhaar,
    });
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

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.stopPropagation();
          form.handleSubmit(onSubmit)(e);
        }}
        className="mt-4 space-y-4"
      >
        <FormField
          control={form.control}
          name="aadhaar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aadhaar Number / Virtual ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter 12 digital Aadhaar number OR 16 digit virtual ID"
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

        {Array.from({ length: 6 }).map((_, index) => (
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
                    <Trans
                      t={t}
                      i18nKey={`abha__disclaimer_${index + 1}`}
                      values={{ user: currentUserName }}
                      components={{
                        input: (
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem className="inline-block w-auto ml-1">
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter Beneficiary Name"
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
        <div className="flex items-center justify-center gap-2">
          <Button
            type="submit"
            variant="default"
            loading={sendAadhaarOtpMutation.isPending}
            disabled={!form.formState.isValid}
            className="w-full"
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
                  aadhaarNumber: form.getValues("aadhaar"),
                  patientName: form.getValues("name"),
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
                aadhaarNumber: form.getValues("aadhaar"),
                patientName: form.getValues("name"),
              }));
              goTo("verify-aadhaar-with-bio");
            }}
            className="w-full"
          >
            {t("verify_with_bio")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

type VerifyAadhaarWithOtpProps = InjectedStepProps<FormMemory>;

const verifyAadhaarWithOtpFormSchema = z.object({
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

type VerifyAadhaarWithOtpFormValues = z.infer<
  typeof verifyAadhaarWithOtpFormSchema
>;

const VerifyAadhaarWithOtp: FC<VerifyAadhaarWithOtpProps> = ({
  memory,
  setMemory,
  goTo,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);

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
        toast.success(data.detail);
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
          mobileNumber: form.getValues("mobile"),
          abhaNumber: data.abha_number,
        }));
        goTo("handle-existing-abha");
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

  function onSubmit(values: VerifyAadhaarWithOtpFormValues) {
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
      message: "Pin code must be 6 digits",
    })
    .optional(),
  mobile: z
    .string()
    .length(10, {
      message: "Mobile number must be 10 digits",
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

  const form = useForm<VerifyAadhaarWithDemographicsFormValues>({
    resolver: zodResolver(verifyAadhaarWithDemographicsFormSchema),
    defaultValues: {
      _aadhaar: memory?.aadhaarNumber ?? "",
      name: memory?.patientName ?? "",
    },
  });

  const { data: states } = useQuery({
    queryKey: ["states"],
    queryFn: () => apis.utility.states(),
  });

  const { data: districts } = useQuery({
    queryKey: ["districts", form.watch("state_code")],
    queryFn: () => apis.utility.districts(form.watch("state_code")),
    enabled: !!form.watch("state_code"),
  });

  const verifyAadhaarDemographicsMutation = useMutation({
    mutationFn: apis.healthId.abhaCreateVerifyAadhaarDemographics,
    onSuccess: (data) => {
      if (data) {
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
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
      form.setError("_aadhaar", {
        message: error.message,
      });
      toast.error(error.message);
    },
  });

  function onSubmit(values: VerifyAadhaarWithDemographicsFormValues) {
    if (!memory) return;

    verifyAadhaarDemographicsMutation.mutate({
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

        <div className="flex flex-col gap-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Name
                  <span className="text-xs text-danger-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your name as per Aadhaar"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Name must exactly match with the name in Aadhaar.
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
                <FormLabel>
                  Gender <span className="text-xs text-danger-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[
                      { id: "M", label: "Male" },
                      { id: "F", label: "Female" },
                      { id: "O", label: "Other" },
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
              <FormItem className="flex flex-col">
                <FormLabel>
                  Date of Birth{" "}
                  <span className="text-xs text-danger-500">*</span>
                </FormLabel>
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
                <FormLabel>
                  State <span className="text-xs text-danger-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a state" />
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
                <FormLabel>
                  District <span className="text-xs text-danger-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a district" />
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
                <FormLabel>Pin Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter 6 digit pin code" {...field} />
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
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter address as per aadhaar card"
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
                <FormLabel>Mobile Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter 10 digit mobile number"
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
          loading={verifyAadhaarDemographicsMutation.isPending}
        >
          {t("verify_demographics")}
        </Button>
      </form>
    </Form>
  );
};

type VerifyAadhaarWithBioProps = InjectedStepProps<FormMemory>;

const verifyAadhaarWithBioFormSchema = z.object({
  _aadhaar: z.string(),
  fingerprint_pid: z.string().min(1, {
    message: "Fingerprint PID is required",
  }),
  mobile: z.string().length(10, {
    message: "Mobile number must be 10 digits",
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
          respElement.getAttribute("errInfo") ?? "Fingerprint capture failed";
        toast.error(errorMessage);
        form.setError("fingerprint_pid", { message: errorMessage });
        return;
      }

      form.clearErrors("fingerprint_pid");
      form.setValue("fingerprint_pid", data);
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
    verifyAadhaarBioMutation.mutate({
      aadhaar: form.getValues("_aadhaar"),
      fingerprint_pid: values.fingerprint_pid,
      mobile: values.mobile,
      transaction_id: memory?.transactionId,
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

        <FormField
          control={form.control}
          name="fingerprint_pid"
          render={() => (
            <FormItem>
              <FormLabel>Fingerprint</FormLabel>
              <FormControl>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-secondary-200 p-8">
                    <div
                      className={cn(
                        "flex h-32 w-32 items-center justify-center rounded-full bg-primary-50 transition-all duration-500",
                        captureFingerprintStatus === "success" && "bg-green-50",
                        captureFingerprintStatus === "error" && "bg-red-50"
                      )}
                    >
                      <div className="relative w-16 h-16">
                        <FingerprintIcon
                          className={cn(
                            "w-full h-full",
                            captureFingerprintStatus === "success"
                              ? "text-primary-500"
                              : captureFingerprintStatus === "error"
                              ? "text-danger-500"
                              : "text-gray-300"
                          )}
                        />
                        <FingerprintIcon
                          className="absolute inset-0 text-gray-300 w-full h-full animate-fill-up"
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
                        captureFingerprintStatus === "error" && "text-red-600",
                        captureFingerprintStatus === "pending" &&
                          "text-secondary-900"
                      )}
                    >
                      {captureFingerprintStatus === "success"
                        ? t("fingerprint_verified")
                        : captureFingerprintStatus === "error"
                        ? t("fingerprint_verification_failed")
                        : t("follow_the_rd_instructions")}
                    </h3>
                    {captureFingerprintStatus === "pending" && (
                      <p className="mt-1 text-sm text-secondary-500">
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
              toast.error("No ABHA number found");
              return;
            }
            goTo("show-abha-profile");
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
        toast.success(data.detail);
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
        }));
        goTo("verify-mobile");
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
        toast.success(data.detail);
        setMemory((prev) => ({
          ...prev,
          transactionId: data.transaction_id,
        }));
        goTo("choose-abha-address");
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

type ChooseAbhaAddressProps = InjectedStepProps<FormMemory>;

const chooseAbhaAddressFormSchema = z.object({
  abhaAddress: z.string().regex(/^(?![\d.])[a-zA-Z0-9._]{4,}(?<!\.)$/, {
    message: "Invalid ABHA Address",
  }),
});

type ChooseAbhaAddressFormValues = z.infer<typeof chooseAbhaAddressFormSchema>;

export const ChooseAbhaAddress: FC<ChooseAbhaAddressProps> = ({
  memory,
  setMemory,
  goTo,
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
        goTo("show-abha-profile");
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
