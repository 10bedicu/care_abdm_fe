export enum PaymentOrderStatus {
  OPEN_ORDER_SHARED = "OPEN_ORDER_SHARED",
  PAYMENT_INITIATED = "PAYMENT_INITIATED",
  SUCCESS = "SUCCESS",
  CANCELED = "CANCELED",
  PENDING = "PENDING",
  FAIL = "FAIL",
  EXPIRED = "EXPIRED",
  REFUND_INITIATED = "REFUND_INITIATED",
  REFUND_SUCCESS = "REFUND_SUCCESS",
}

export const PAYMENT_ORDER_PAID_STATUSES = [
  PaymentOrderStatus.SUCCESS,
  PaymentOrderStatus.REFUND_INITIATED,
  PaymentOrderStatus.REFUND_SUCCESS,
];

export type PaymentOrderInvoice = {
  id: string;
  number: string | null;
  title: string | null;
  status: string;
  total_gross: string;
  cancelled_reason: string | null;
};

export type PaymentOrder = {
  id: string;
  status: PaymentOrderStatus;
  is_pending: boolean;
  provider: string;
  order_number: string | null;
  amount: string | null;
  abha_address: string;
  transaction_id: string | null;
  payment_date: string | null;
  invoice: PaymentOrderInvoice | null;
  patient: { id: string; name: string } | null;
  receipt_url: string | null;
  created_date: string;
  modified_date: string;
};

export type PaymentOrderActionResponse = {
  order: PaymentOrder;
  gateway_checked?: boolean;
  detail?: string;
};

export type PaymentOrderListQuery = {
  facility: string;
  pending?: boolean;
  status?: string;
  invoice?: string;
  invoice_number?: string;
  search?: string;
  patient?: string;
  created_date_after?: string;
  created_date_before?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
};
