import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { I18NNAMESPACE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PaymentOrderStatus } from "@/types/paymentOrder";

const STATUS_CLASSES: Record<PaymentOrderStatus, string> = {
  [PaymentOrderStatus.OPEN_ORDER_SHARED]: "bg-gray-100 text-gray-800",
  [PaymentOrderStatus.PAYMENT_INITIATED]: "bg-blue-100 text-blue-800",
  [PaymentOrderStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [PaymentOrderStatus.SUCCESS]: "bg-green-100 text-green-800",
  [PaymentOrderStatus.CANCELED]: "bg-gray-200 text-gray-800",
  [PaymentOrderStatus.FAIL]: "bg-red-100 text-red-800",
  [PaymentOrderStatus.EXPIRED]: "bg-amber-100 text-amber-800",
  [PaymentOrderStatus.REFUND_INITIATED]: "bg-orange-100 text-orange-800",
  [PaymentOrderStatus.REFUND_SUCCESS]: "bg-orange-100 text-orange-800",
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
    <Badge
      variant="outline"
      className={cn(
        "border-transparent whitespace-nowrap",
        STATUS_CLASSES[status] ?? "bg-gray-100 text-gray-800",
        className
      )}
    >
      {t(`scan_pay__status__${status}`)}
    </Badge>
  );
  if (!reason) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs">{reason}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
