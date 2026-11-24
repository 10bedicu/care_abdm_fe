import { FC, useEffect, useMemo, useState } from "react";
import {
  ExternalLinkIcon,
  InfoIcon,
  QrCodeIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { apis } from "@/apis";
import { APIError } from "@/apis/request";
import { AbdmScope } from "@/components/AbdmScope";
import { Pagination } from "@/components/common/Pagination";
import { TableSkeleton } from "@/components/common/SkeletonLoading";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  DateRangePicker,
  DateRangeValue,
} from "@/components/ui/date-range-picker";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { I18NNAMESPACE } from "@/lib/constants";
import { useScanPayManualActions } from "@/lib/pluginConfig";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { PaymentOrder, PaymentOrderStatus } from "@/types/paymentOrder";

const PAGE_SIZE = 15;
const DEFAULT_REFRESH_INTERVAL_MS = 10_000;

const booleanFromString = (value: string | undefined, fallback = false) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
};

const refreshIntervalMs = () => {
  const interval = window.__CORE_ENV__?.appointmentAndQueueRefreshInterval;
  return typeof interval === "number" && interval > 0
    ? interval
    : DEFAULT_REFRESH_INTERVAL_MS;
};

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
  const invoiceLabel =
    invoice?.number?.trim() ||
    invoice?.title?.trim() ||
    (invoice?.id ? invoice.id.slice(0, 8) : "") ||
    t("scan_pay__col_invoice");
  const rows = [
    {
      label: t("scan_pay__col_invoice"),
      value: invoice?.id ? (
        <Link
          to={`/facility/${facilityId}/billing/invoices/${invoice.id}`}
          className="font-medium text-blue-700 underline underline-offset-4 transition-[color,text-underline-offset] hover:text-blue-800 hover:underline-offset-2 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {invoiceLabel}
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
        <div
          key={row.label}
          className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2"
        >
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd
            className="wrap-anywhere whitespace-normal text-foreground"
            title={typeof row.value === "string" ? row.value : undefined}
          >
            {row.value}
          </dd>
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
              className="w-full text-destructive hover:text-destructive/90 sm:w-auto"
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
  const { autoRefresh } = useSearch({ strict: false }) as {
    autoRefresh?: string;
  };
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>();
  const [page, setPage] = useState(0);
  const [cancelling, setCancelling] = useState<PaymentOrder | null>(null);
  const [markingPaid, setMarkingPaid] = useState<PaymentOrder | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const shouldAutoRefresh = booleanFromString(
    autoRefresh,
    window.__CORE_ENV__?.enableAutoRefresh === true,
  );
  const pollIntervalMs = refreshIntervalMs();

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

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [SCAN_PAY_ORDERS_QUERY_KEY, query],
    queryFn: () => apis.scanPay.orders.list(query),
    enabled: !!facilityId,
    refetchInterval: shouldAutoRefresh ? pollIntervalMs : false,
  });

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const { checkStatus, cancel, markPaid } = useScanPayOrderActions();
  const manualActions = useScanPayManualActions(facilityId);

  const orders = data?.results ?? [];
  const count = data?.count ?? 0;

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

  const header = (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-muted-foreground">
        {t("scan_pay__title")}
      </h1>
      <p className="text-sm text-soft-foreground">
        {t("scan_pay__description")}
      </p>
    </div>
  );

  if (isError && error instanceof APIError && error.status === 403) {
    return (
      <AbdmScope>
        <div className="flex flex-col gap-4 py-4">
          {header}
          <EmptyState
            title={t("scan_pay__title")}
            description={t("scan_pay__forbidden")}
          />
        </div>
      </AbdmScope>
    );
  }

  return (
    <AbdmScope>
      <div className="py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {header}
          <div className="flex shrink-0 items-center gap-2">
            <Label htmlFor="scan-pay-auto-refresh" className="whitespace-nowrap">
              {t("scan_pay__auto_refresh")}
            </Label>
            <Switch
              id="scan-pay-auto-refresh"
              checked={shouldAutoRefresh}
              onCheckedChange={(checked) =>
                navigate({
                  to: ".",
                  unsafeRelative: "path",
                  search: (prev: Record<string, unknown>) => ({
                    ...prev,
                    autoRefresh: checked ? "true" : "false",
                  }),
                  replace: true,
                })
              }
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="hidden cursor-help md:block">
                  <InfoIcon className="size-4 text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {t("scan_pay__auto_refresh_tooltip", {
                  interval: Math.round(pollIntervalMs / 1000),
                })}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="mt-4 w-full overflow-x-auto">
          <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
            <TabsList variant="line" aria-label={t("status")}>
              {FILTERS.map((filter) => (
                <TabsTrigger key={filter.value} value={filter.value}>
                  {t(filter.label)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="my-4 flex w-full flex-wrap items-start gap-2">
          <div className="relative w-full sm:w-auto">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("scan_pay__search")}
              aria-label={t("scan_pay__search")}
              className="w-full pl-10 sm:w-80"
            />
          </div>
          <div className="flex w-full min-w-0 gap-2 sm:w-auto">
            <DateRangePicker
              value={dateRange}
              onApply={(range) =>
                setDateRange(range.from || range.to ? range : undefined)
              }
              placeholder={t("scan_pay__date_range")}
              className="min-w-0 flex-1 sm:w-auto sm:flex-none"
            />
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => void refresh()}
              aria-label={t("scan_pay__refresh")}
            >
              <RefreshCwIcon className={cn(refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton count={5} columns={6} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<QrCodeIcon className="size-6 text-primary" />}
            title={t("scan_pay__no_orders")}
            description={t("scan_pay__no_orders_description")}
          />
        ) : (
          <>
            <div className="flex flex-col gap-3 md:hidden">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">
                          {order.patient?.name ?? "—"}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {order.abha_address}
                        </div>
                      </div>
                      <div className="shrink-0 text-right font-medium text-foreground">
                        {amountOf(order)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <ScanPayStatusBadge
                        status={order.status}
                        reason={order.invoice?.cancelled_reason}
                      />
                      <span>
                        {dayjs(order.created_date).format(
                          "DD MMM YYYY, hh:mm A",
                        )}
                      </span>
                      {order.provider && <span>{order.provider}</span>}
                    </div>
                    <OrderReferences order={order} facilityId={facilityId} />
                    {actionsFor(order)}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("scan_pay__col_created")}</TableHead>
                    <TableHead>{t("scan_pay__col_patient")}</TableHead>
                    <TableHead>{t("scan_pay__col_invoice")}</TableHead>
                    <TableHead className="text-right">
                      {t("scan_pay__col_amount")}
                    </TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="text-right">
                      {t("scan_pay__col_actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>{dayjs(order.created_date).format("DD MMM YYYY")}</div>
                        <div className="text-xs text-muted-foreground">
                          {dayjs(order.created_date).format("hh:mm A")}
                        </div>
                        {order.provider && (
                          <div className="text-xs text-muted-foreground">
                            {order.provider}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {order.patient?.name ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.abha_address}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-56 whitespace-normal">
                        <OrderReferences order={order} facilityId={facilityId} />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {amountOf(order)}
                      </TableCell>
                      <TableCell>
                        <ScanPayStatusBadge
                          status={order.status}
                          reason={order.invoice?.cancelled_reason}
                        />
                      </TableCell>
                      <TableCell>{actionsFor(order)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {!!count && (
          <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <span className="text-sm text-muted-foreground">
              {t("scan_pay__total_orders", { count })}
            </span>
            <Pagination
              className="mx-0 w-full sm:w-auto"
              totalCount={count}
              perPage={PAGE_SIZE}
              page={page + 1}
              onChange={(next) => setPage(next - 1)}
            />
          </div>
        )}
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
    </AbdmScope>
  );
};

export default ScanPayOrders;
