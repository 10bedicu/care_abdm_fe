import { FC, useMemo, useRef } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Button } from "./ui/button";
import { I18NNAMESPACE } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type GenerateScanAndShareQRProps = {
  healthFacilityId: string;
  scanAndShareUrl?: string;
};

const scanAndShareQrFormSchema = z.object({
  counterName: z.string().min(1).max(20),
});

export const GenerateScanAndShareQR: FC<GenerateScanAndShareQRProps> = ({
  healthFacilityId,
  scanAndShareUrl,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);

  const qrRef = useRef<SVGSVGElement>(null);

  const scanAndShareQrForm = useForm<z.infer<typeof scanAndShareQrFormSchema>>({
    resolver: zodResolver(scanAndShareQrFormSchema),
    defaultValues: {
      counterName: "1",
    },
  });

  const scanAndShareQrValue = useMemo(() => {
    return scanAndShareUrl
      ?.replace("<HF_ID>", healthFacilityId)
      ?.replace("<COUNTER_ID>", scanAndShareQrForm.watch("counterName"));
  }, [scanAndShareQrForm.watch("counterName"), healthFacilityId]);

  const downloadQR = () => {
    const svg = qrRef.current;
    if (!svg) {
      return;
    }

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(
        /^<svg/,
        '<svg xmlns="http://www.w3.org/2000/svg"'
      );
    }
    if (!source.match(/^<svg[^>]+"http:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(
        /^<svg/,
        '<svg xmlns:xlink="http://www.w3.org/1999/xlink"'
      );
    }

    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

    const url =
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `${healthFacilityId}--${scanAndShareQrForm.watch(
      "counterName"
    )}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  function onSubmit() {
    downloadQR();
  }

  if (!scanAndShareUrl) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center gap-2.5">
        <p className="font-semibold text-secondary-600">
          {t("scan_and_share_qr_not_available")}
        </p>
      </div>
    );
  }

  return (
    <Form {...scanAndShareQrForm}>
      <div className="space-y-4 mt-10">
        <div>
          <h2 className="text-lg font-medium">
            {t("generate_scan_and_share_qr")}
          </h2>
          <p className="text-sm text-secondary-700">
            {t("generate_scan_and_share_qr_description")}
          </p>
        </div>

        <form className="space-y-8">
          <FormField
            control={scanAndShareQrForm.control}
            name="counterName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("counter_name")}
                  <span className="text-red-500 text-sm">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("counter_name_placeholder")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("counter_name_description")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>

        {!!scanAndShareQrForm.watch("counterName") && scanAndShareQrValue && (
          <div className="grid gap-3 items-center justify-center w-full">
            <QRCodeSVG
              value={scanAndShareQrValue}
              className="size-96"
              ref={qrRef}
            />
            <Button
              className="w-96"
              onClick={scanAndShareQrForm.handleSubmit(onSubmit)}
            >
              {t("download_qr_code")}
            </Button>
          </div>
        )}
      </div>
    </Form>
  );
};
