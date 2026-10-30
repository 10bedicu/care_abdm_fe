import { FC, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { apis } from "@/apis";
import { APIError } from "@/apis/request";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatAmount } from "@/components/scan-pay/ScanPayStatusBadge";
import { I18NNAMESPACE } from "@/lib/constants";
import { toast } from "@/lib/utils";
import {
  PAYMENT_ORDER_PAID_STATUSES,
  PaymentOrder,
  PaymentOrderActionResponse,
} from "@/types/paymentOrder";

export const SCAN_PAY_ORDERS_QUERY_KEY = "scanPayOrders";

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof APIError && error.message ? error.message : fallback;

export const useScanPayOrderActions = (onChanged?: (order: PaymentOrder) => void) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const queryClient = useQueryClient();

  const settle = (response: PaymentOrderActionResponse) => {
    queryClient.invalidateQueries({ queryKey: [SCAN_PAY_ORDERS_QUERY_KEY] });
    if (response.order.invoice) {
      // the host invoice page caches under this key
      queryClient.invalidateQueries({
        queryKey: ["invoice", response.order.invoice.id],
      });
    }
    onChanged?.(response.order);
  };

  const checkStatus = useMutation({
    mutationFn: (order: PaymentOrder) => apis.scanPay.orders.checkStatus(order.id),
    onSuccess: (response) => {
      settle(response);
      const { order, gateway_checked, detail } = response;
      if (PAYMENT_ORDER_PAID_STATUSES.includes(order.status)) {
        toast.success(t("scan_pay__checked_paid"));
      } else if (!gateway_checked) {
        toast.warning(detail || t("scan_pay__check_failed"));
      } else if (order.is_pending) {
        toast.warning(t("scan_pay__checked_pending"));
      } else {
        toast.warning(t("scan_pay__checked_closed"));
      }
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("scan_pay__check_failed")));
    },
  });

  const cancel = useMutation({
    mutationFn: (order: PaymentOrder) => apis.scanPay.orders.cancel(order.id),
    onSuccess: (response) => {
      settle(response);
      toast.success(t("scan_pay__cancelled"));
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("scan_pay__cancel_failed")));
    },
  });

  const markPaid = useMutation({
    mutationFn: ({
      order,
      reference_number,
      note,
    }: {
      order: PaymentOrder;
      reference_number: string;
      note?: string;
    }) => apis.scanPay.orders.markPaid(order.id, { reference_number, note }),
    onSuccess: (response) => {
      settle(response);
      toast.success(t("scan_pay__marked_paid"));
    },
    onError: (error) => {
      toast.error(errorMessage(error, t("scan_pay__mark_paid_failed")));
    },
  });

  return { checkStatus, cancel, markPaid };
};

type OrderDialogProps = {
  order: PaymentOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (order: PaymentOrder) => Promise<unknown>;
  loading?: boolean;
};

export const CancelOrderDialog: FC<OrderDialogProps> = ({
  order,
  open,
  onOpenChange,
  onConfirm,
  loading,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="abdm-container max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("scan_pay__cancel_title")}</DialogTitle>
          <DialogDescription>
            {t("scan_pay__cancel_description", {
              number: order?.invoice?.number ?? order?.order_number ?? "",
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("scan_pay__keep_order")}
          </Button>
          <Button
            variant="destructive"
            loading={loading}
            onClick={async () => {
              if (!order) return;
              try {
                await onConfirm(order);
                onOpenChange(false);
              } catch {
                // already reported by the mutation's onError
              }
            }}
          >
            {t("scan_pay__cancel_order")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

type MarkPaidDialogProps = Omit<OrderDialogProps, "onConfirm"> & {
  onConfirm: (
    order: PaymentOrder,
    values: { reference_number: string; note: string }
  ) => Promise<unknown>;
};

export const MarkPaidDialog: FC<MarkPaidDialogProps> = ({
  order,
  open,
  onOpenChange,
  onConfirm,
  loading,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const close = (next: boolean) => {
    if (!next) {
      setReference("");
      setNote("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="abdm-container max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("scan_pay__mark_paid_title")}</DialogTitle>
          <DialogDescription>
            {t("scan_pay__mark_paid_description", {
              amount: formatAmount(order?.amount ?? order?.invoice?.total_gross),
              number: order?.invoice?.number ?? order?.order_number ?? "",
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="scan-pay-reference">
              {t("scan_pay__reference_number")}
            </Label>
            <Input
              id="scan-pay-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="scan-pay-note">{t("scan_pay__note")}</Label>
            <Textarea
              id="scan-pay-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            {t("back")}
          </Button>
          <Button
            loading={loading}
            disabled={!reference.trim()}
            onClick={async () => {
              if (!order) return;
              try {
                await onConfirm(order, {
                  reference_number: reference.trim(),
                  note: note.trim(),
                });
                close(false);
              } catch {
                // already reported by the mutation's onError
              }
            }}
          >
            {t("scan_pay__mark_paid")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
