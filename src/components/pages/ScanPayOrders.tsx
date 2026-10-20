import { FC, useEffect, useMemo, useState } from "react";
import { ExternalLinkIcon, RefreshCwIcon } from "lucide-react";
import { Link } from "raviger";
import { DateRange } from "react-day-picker";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { apis } from "@/apis";
import {
  CancelOrderDialog,
  MarkPaidDialog,
  SCAN_PAY_ORDERS_QUERY_KEY,
  useScanPayOrderActions,
} from "@/components/scan-pay/ScanPayOrderActions";
import {
  ScanPayStatusBadge,
  formatAmount,
} from "@/components/scan-pay/ScanPayStatusBadge";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { I18NNAMESPACE } from "@/lib/constants";
import { useScanPayManualActions } from "@/lib/pluginConfig";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { PaymentOrder, PaymentOrderStatus } from "@/types/paymentOrder";

const PAGE_SIZE = 15;

type Tab = "all" | "pending" | "paid" | "failed" | "expired" | "cancelled";

const FILTERS: { value: Tab; label: string }[] = [
  { value: "all", label: "scan_pay__filter_all" },
  { value: "pending", label: "scan_pay__filter_pending" },
  { value: "paid", label: "scan_pay__filter_paid" },
  { value: "failed", label: "scan_pay__filter_failed" },
  { value: "expired", label: "scan_pay__filter_expired" },
  { value: "cancelled", label: "scan_pay__filter_cancelled" },
];

const TAB_FILTERS: Record<Tab, { pending?: boolean; status?: string }> = {
  all: {},
  pending: { pending: true },
  paid: {
    status: [
      PaymentOrderStatus.SUCCESS,
      PaymentOrderStatus.REFUND_INITIATED,
      PaymentOrderStatus.REFUND_SUCCESS,
    ].join(","),
  },
  failed: { status: PaymentOrderStatus.FAIL },
  expired: { status: PaymentOrderStatus.EXPIRED },
  cancelled: { status: PaymentOrderStatus.CANCELED },
};

const useDebounced = <T,>(value: T, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

type ScanPayOrdersProps = {
  facilityId: string;
};

const OrderReferences = ({
  order,
  facilityId,
}: {
  order: PaymentOrder;
  facilityId: string;
}) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const invoice = order.invoice;
  const href = invoice
    ? `/facility/${facilityId}/billing/invoices/${invoice.id}`
    : undefined;
  const rows = [
    {
      label: t("scan_pay__col_invoice"),
      value:
        invoice && href ? (
          <Link href={href} className="font-medium text-primary-700 hover:underline">
            {invoice.number ?? invoice.id.slice(0, 8)}
          </Link>
        ) : (
          "—"
        ),
    },
    { label: t("scan_pay__order_number"), value: order.order_number || "—" },
    { label: t("scan_pay__atrn"), value: order.transaction_id || "—" },
  ];

  return (
    <dl className="grid gap-1 text-xs">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
          <dt className="text-gray-500">{row.label}</dt>
          <dd className="truncate text-gray-800">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
};

const OrderActions = ({
  order,
  checking,
  onCheck,
  onMarkPaid,
  onCancel,
  markPaid,
  cancelOrder,
}: {
  order: PaymentOrder;
  checking: boolean;
  onCheck: () => void;
  onMarkPaid: () => void;
  onCancel: () => void;
  markPaid: boolean;
  cancelOrder: boolean;
}) => {
  const { t } = useTranslation(I18NNAMESPACE);
  if (!order.is_pending && !order.receipt_url) return null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
      {order.is_pending && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
            loading={checking}
            onClick={onCheck}
          >
            {t("scan_pay__check_status")}
          </Button>
          {markPaid && (
            <Button
              size="sm"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={onMarkPaid}
            >
              {t("scan_pay__mark_paid")}
            </Button>
          )}
          {cancelOrder && (
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-red-600 hover:text-red-700 sm:w-auto"
              onClick={onCancel}
            >
              {t("scan_pay__cancel_order")}
            </Button>
          )}
        </>
      )}
      {order.receipt_url && (
        <Button size="sm" variant="outline" className="w-full sm:w-auto" asChild>
          <a href={order.receipt_url} target="_blank" rel="noreferrer">
            <ExternalLinkIcon />
            {t("scan_pay__receipt")}
          </a>
        </Button>
      )}
    </div>
  );
};

const ScanPayOrders: FC<ScanPayOrdersProps> = ({ facilityId }) => {
  const { t } = useTranslation(I18NNAMESPACE);
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>();
  const [page, setPage] = useState(0);
  const [cancelling, setCancelling] = useState<PaymentOrder | null>(null);
  const [markingPaid, setMarkingPaid] = useState<PaymentOrder | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const debouncedSearch = useDebounced(search.trim());

  useEffect(() => {
    setPage(0);
  }, [tab, debouncedSearch, dateRange]);

  const query = useMemo(
    () => ({
      facility: facilityId,
      ...TAB_FILTERS[tab],
      search: debouncedSearch || undefined,
      created_date_after: dateRange?.from
        ? dayjs(dateRange.from).startOf("day").toISOString()
        : undefined,
      created_date_before: dateRange?.to
        ? dayjs(dateRange.to).endOf("day").toISOString()
        : undefined,
      ordering: "-created_date",
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [facilityId, tab, debouncedSearch, dateRange, page]
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [SCAN_PAY_ORDERS_QUERY_KEY, query],
    queryFn: () => apis.scanPay.orders.list(query),
    enabled: !!facilityId,
  });

  const { checkStatus, cancel, markPaid } = useScanPayOrderActions();
  const manualActions = useScanPayManualActions();

  const orders = data?.results ?? [];
  const count = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const amountOf = (order: PaymentOrder) =>
    order.amount || order.invoice
      ? formatAmount(order.amount ?? order.invoice?.total_gross)
      : "—";

  const actionsFor = (order: PaymentOrder) => (
    <OrderActions
      order={order}
      checking={checkStatus.isPending && checkingId === order.id}
      markPaid={manualActions.markPaid}
      cancelOrder={manualActions.cancelOrder}
      onCheck={() => {
        setCheckingId(order.id);
        checkStatus.mutate(order);
      }}
      onMarkPaid={() => setMarkingPaid(order)}
      onCancel={() => setCancelling(order)}
    />
  );

  return (
    <div className="abdm-container flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-gray-900">
          {t("scan_pay__title")}
        </h1>
        <p className="text-sm text-gray-600">{t("scan_pay__description")}</p>
      </div>

      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
        <div className="md:hidden">
          <Select value={tab} onValueChange={(value) => setTab(value as Tab)}>
            <SelectTrigger aria-label={t("status")} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTERS.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {t(filter.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as Tab)}
          className="hidden shrink-0 md:block"
        >
          <TabsList className="h-9 w-max justify-start">
            {FILTERS.map((filter) => (
              <TabsTrigger key={filter.value} value={filter.value}>
                {t(filter.label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex min-w-0 flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center sm:justify-end">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("scan_pay__search")}
            className="w-full min-w-0 sm:w-[28rem] sm:max-w-md"
          />
          <div className="flex gap-2 sm:shrink-0">
            <DatePickerWithRange
              value={dateRange}
              onChange={setDateRange}
              placeholder={t("scan_pay__date_range")}
              className="min-w-0 flex-1 sm:w-56"
            />
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => refetch()}
              aria-label={t("scan_pay__refresh")}
            >
              <RefreshCwIcon className={cn(isFetching && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full rounded-lg" />
          ))}
        {!isLoading && orders.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
            {t("scan_pay__no_orders")}
          </div>
        )}
        {orders.map((order) => (
          <article
            key={order.id}
            className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-gray-900">
                  {order.patient?.name ?? "—"}
                </div>
                <div className="truncate text-xs text-gray-500">
                  {order.abha_address}
                </div>
              </div>
              <div className="shrink-0 text-right font-medium text-gray-900">
                {amountOf(order)}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <ScanPayStatusBadge status={order.status} />
              <span>{dayjs(order.created_date).format("DD MMM YYYY, hh:mm A")}</span>
              {order.provider && <span>{order.provider}</span>}
            </div>
            <OrderReferences order={order} facilityId={facilityId} />
            {actionsFor(order)}
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">{t("scan_pay__col_created")}</th>
              <th className="px-4 py-3">{t("scan_pay__col_patient")}</th>
              <th className="px-4 py-3">{t("scan_pay__col_invoice")}</th>
              <th className="px-4 py-3 text-right">{t("scan_pay__col_amount")}</th>
              <th className="px-4 py-3">{t("status")}</th>
              <th className="px-4 py-3 text-right">{t("scan_pay__col_actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading &&
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  {Array.from({ length: 6 }).map((_, cell) => (
                    <td key={cell} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            {!isLoading && orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  {t("scan_pay__no_orders")}
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                  <div>{dayjs(order.created_date).format("DD MMM YYYY")}</div>
                  <div className="text-xs text-gray-500">
                    {dayjs(order.created_date).format("hh:mm A")}
                  </div>
                  {order.provider && (
                    <div className="text-xs text-gray-500">{order.provider}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">
                    {order.patient?.name ?? "—"}
                  </div>
                  <div className="text-xs text-gray-500">{order.abha_address}</div>
                </td>
                <td className="px-4 py-3">
                  <OrderReferences order={order} facilityId={facilityId} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">
                  {amountOf(order)}
                </td>
                <td className="px-4 py-3">
                  <ScanPayStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3">{actionsFor(order)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
        <span>{t("scan_pay__total_orders", { count })}</span>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            {t("scan_pay__previous")}
          </Button>
          <span className="text-center">
            {page + 1} / {pageCount}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page + 1 >= pageCount}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("scan_pay__next")}
          </Button>
        </div>
      </div>

      <CancelOrderDialog
        order={cancelling}
        open={!!cancelling}
        onOpenChange={(open) => !open && setCancelling(null)}
        onConfirm={(order) => cancel.mutateAsync(order)}
        loading={cancel.isPending}
      />
      <MarkPaidDialog
        order={markingPaid}
        open={!!markingPaid}
        onOpenChange={(open) => !open && setMarkingPaid(null)}
        onConfirm={(order, values) => markPaid.mutateAsync({ order, ...values })}
        loading={markPaid.isPending}
      />
    </div>
  );
};

export default ScanPayOrders;
