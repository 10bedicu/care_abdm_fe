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
import { AbdmScope } from "@/components/AbdmScope";
import { HostMenuItem } from "@/components/common/HostMenuItem";
import { I18NNAMESPACE } from "@/lib/constants";
import { useScanPayManualActions } from "@/lib/pluginConfig";
import { WithMeta } from "@/types/meta";
import { PaymentOrder } from "@/types/paymentOrder";

type InvoiceRecordPaymentOptionsProps = {
  facilityId: string;
  invoice: { id: string };
  className?: string;
};

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
    <AbdmScope>
      <HostMenuItem
        className={className}
        loading={checkStatus.isPending}
        onClick={() => checkStatus.mutate(order)}
      >
        {t("scan_pay__check_status_menu")}
      </HostMenuItem>
      {manualActions.markPaid && (
        <HostMenuItem
          className={className}
          onClick={() => setMarkingPaid(order)}
        >
          {t("scan_pay__mark_paid_menu")}
        </HostMenuItem>
      )}
      {manualActions.cancelOrder && (
        <HostMenuItem
          variant="destructive"
          className={className}
          onClick={() => setCancelling(order)}
        >
          {t("scan_pay__cancel_order_menu")}
        </HostMenuItem>
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
    </AbdmScope>
  );
};

export default InvoiceRecordPaymentOptions;
