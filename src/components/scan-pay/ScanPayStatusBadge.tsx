import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Badge, BadgeVariant } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { I18NNAMESPACE } from "@/lib/constants";
import { PaymentOrderStatus } from "@/types/paymentOrder";

const STATUS_VARIANTS: Record<PaymentOrderStatus, BadgeVariant> = {
  [PaymentOrderStatus.OPEN_ORDER_SHARED]: "secondary",
  [PaymentOrderStatus.PAYMENT_INITIATED]: "blue",
  [PaymentOrderStatus.PENDING]: "yellow",
  [PaymentOrderStatus.SUCCESS]: "green",
  [PaymentOrderStatus.CANCELED]: "secondary",
  [PaymentOrderStatus.FAIL]: "destructive",
  [PaymentOrderStatus.EXPIRED]: "amber",
  [PaymentOrderStatus.REFUND_INITIATED]: "orange",
  [PaymentOrderStatus.REFUND_SUCCESS]: "orange",
};

type ScanPayStatusBadgeProps = {
  status: PaymentOrderStatus;
  reason?: string | null;
  className?: string;
};

export const ScanPayStatusBadge: FC<ScanPayStatusBadgeProps> = ({
  status,
  reason,
  className,
}) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const badge = (
    <Badge variant={STATUS_VARIANTS[status] ?? "secondary"} className={className}>
      {t(`scan_pay__status__${status}`)}
    </Badge>
  );
  if (!reason) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
};

export const formatAmount = (amount: string | number | null | undefined) => {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
};
