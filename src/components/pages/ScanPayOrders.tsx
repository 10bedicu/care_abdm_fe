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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { I18NNAMESPACE } from "@/lib/constants";
import { useScanPayManualActions } from "@/lib/pluginConfig";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { PaymentOrder, PaymentOrderStatus } from "@/types/paymentOrder";

const PAGE_SIZE = 15;

type Tab = "all" | "pending" | "paid" | "failed" | "expired" | "cancelled";

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
      invoice_number: debouncedSearch || undefined,
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

  const invoicePath = (order: PaymentOrder) =>
    order.invoice
      ? `/facility/${facilityId}/billing/invoices/${order.invoice.id}`
      : undefined;

  return (
    <div className="abdm-container flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-gray-900">
          {t("scan_pay__title")}
        </h1>
        <p className="text-sm text-gray-600">{t("scan_pay__description")}</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="all">{t("scan_pay__filter_all")}</TabsTrigger>
            <TabsTrigger value="pending">
              {t("scan_pay__filter_pending")}
            </TabsTrigger>
            <TabsTrigger value="paid">{t("scan_pay__filter_paid")}</TabsTrigger>
            <TabsTrigger value="failed">
              {t("scan_pay__filter_failed")}
            </TabsTrigger>
            <TabsTrigger value="expired">
              {t("scan_pay__filter_expired")}
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              {t("scan_pay__filter_cancelled")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("scan_pay__search_invoice")}
            className="sm:w-56"
          />
          <DatePickerWithRange
            value={dateRange}
            onChange={setDateRange}
            placeholder={t("scan_pay__date_range")}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            aria-label={t("scan_pay__refresh")}
          >
            <RefreshCwIcon className={cn(isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">{t("scan_pay__col_created")}</th>
              <th className="px-4 py-3">{t("scan_pay__col_patient")}</th>
              <th className="px-4 py-3">{t("scan_pay__col_invoice")}</th>
              <th className="px-4 py-3 text-right">{t("scan_pay__col_amount")}</th>
              <th className="px-4 py-3">{t("scan_pay__col_provider")}</th>
              <th className="px-4 py-3">{t("status")}</th>
              <th className="px-4 py-3 text-right">{t("scan_pay__col_actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading &&
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  {Array.from({ length: 7 }).map((_, cell) => (
                    <td key={cell} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            {!isLoading && orders.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  {t("scan_pay__no_orders")}
                </td>
              </tr>
            )}
            {orders.map((order) => {
              const href = invoicePath(order);
              const isChecking =
                checkStatus.isPending && checkingId === order.id;
              return (
                <tr key={order.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    <div>{dayjs(order.created_date).format("DD MMM YYYY")}</div>
                    <div className="text-xs text-gray-500">
                      {dayjs(order.created_date).format("hh:mm A")}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {order.patient?.name ?? "—"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.abha_address}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {order.invoice && href ? (
                      <Link
                        href={href}
                        className="font-medium text-primary-700 hover:underline"
                      >
                        {order.invoice.number ?? order.invoice.id.slice(0, 8)}
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                    {order.order_number && (
                      <div className="text-xs text-gray-500">
                        {t("scan_pay__order_number")}: {order.order_number}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">
                    {order.amount || order.invoice
                      ? formatAmount(order.amount ?? order.invoice?.total_gross)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {order.provider || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <ScanPayStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      {order.is_pending && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            loading={isChecking}
                            onClick={() => {
                              setCheckingId(order.id);
                              checkStatus.mutate(order);
                            }}
                          >
                            {t("scan_pay__check_status")}
                          </Button>
                          {manualActions.markPaid && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setMarkingPaid(order)}
                            >
                              {t("scan_pay__mark_paid")}
                            </Button>
                          )}
                          {manualActions.cancelOrder && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setCancelling(order)}
                            >
                              {t("scan_pay__cancel_order")}
                            </Button>
                          )}
                        </>
                      )}
                      {order.receipt_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={order.receipt_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLinkIcon />
                            {t("scan_pay__receipt")}
                          </a>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{t("scan_pay__total_orders", { count })}</span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            {t("scan_pay__previous")}
          </Button>
          <span>
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
