import { FC, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { apis } from "@/apis";
import {
  CancelOrderDialog,
  MarkPaidDialog,
  SCAN_PAY_ORDERS_QUERY_KEY,
  useScanPayOrderActions,
} from "@/components/scan-pay/ScanPayOrderActions";
import { Button } from "@/components/ui/button";
import { I18NNAMESPACE } from "@/lib/constants";
import { useScanPayManualActions } from "@/lib/pluginConfig";
import { cn } from "@/lib/utils";
import { WithMeta } from "@/types/meta";
import { PaymentOrder } from "@/types/paymentOrder";

type InvoiceRecordPaymentOptionsProps = {
  facilityId: string;
  invoice: { id: string };
  className?: string;
};

// rendered inside the host's dropdown, so items are plain buttons styled as menu rows
const itemClassName =
  "relative flex w-full cursor-default select-none items-center justify-start gap-2 rounded-sm px-2 py-1.5 text-sm font-normal outline-hidden transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900 disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0";

const InvoiceRecordPaymentOptions: FC<
  WithMeta<InvoiceRecordPaymentOptionsProps>
> = ({ facilityId, invoice, className, __meta }) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const manualActions = useScanPayManualActions(facilityId, __meta?.config);
  const [cancelling, setCancelling] = useState<PaymentOrder | null>(null);
  const [markingPaid, setMarkingPaid] = useState<PaymentOrder | null>(null);

  const { data } = useQuery({
    queryKey: [SCAN_PAY_ORDERS_QUERY_KEY, "invoice", facilityId, invoice.id],
    queryFn: () =>
      apis.scanPay.orders.list({
        facility: facilityId,
        invoice: invoice.id,
        pending: true,
        limit: 1,
      }),
    enabled: !!facilityId && !!invoice?.id,
  });

  const { checkStatus, cancel, markPaid } = useScanPayOrderActions();

  const order = data?.results?.[0];
  if (!order) {
    return null;
  }

  return (
    <div className={cn("abdm-container w-full", className)}>
      <Button
        variant="ghost"
        size="sm"
        className={itemClassName}
        loading={checkStatus.isPending}
        onClick={() => checkStatus.mutate(order)}
      >
        {t("scan_pay__check_status_menu")}
      </Button>
      {manualActions.markPaid && (
        <Button
          variant="ghost"
          size="sm"
          className={itemClassName}
          onClick={() => setMarkingPaid(order)}
        >
          {t("scan_pay__mark_paid_menu")}
        </Button>
      )}
      {manualActions.cancelOrder && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(itemClassName, "text-red-600 hover:text-red-700")}
          onClick={() => setCancelling(order)}
        >
          {t("scan_pay__cancel_order_menu")}
        </Button>
      )}

      <CancelOrderDialog
        order={cancelling}
        open={!!cancelling}
        onOpenChange={(open) => !open && setCancelling(null)}
        onConfirm={(target) => cancel.mutateAsync(target)}
        loading={cancel.isPending}
      />
      <MarkPaidDialog
        order={markingPaid}
        open={!!markingPaid}
        onOpenChange={(open) => !open && setMarkingPaid(null)}
        onConfirm={(target, values) =>
          markPaid.mutateAsync({ order: target, ...values })
        }
        loading={markPaid.isPending}
      />
    </div>
  );
};

export default InvoiceRecordPaymentOptions;
