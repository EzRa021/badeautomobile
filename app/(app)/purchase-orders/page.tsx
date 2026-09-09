import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";
import { listPurchaseOrders, PURCHASE_ORDER_SORTS } from "@/lib/db/queries";
import { readListParams, resolveSort } from "@/lib/db/list";
import { setPurchaseOrderStatus } from "@/lib/actions/purchase-orders";
import type { PurchaseOrder } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils/dates";
import { formatAmount } from "@/lib/utils/money";
import { PageHeader } from "@/components/app/page-header";
import { SearchInput } from "@/components/app/search-input";
import { StatusFilter } from "@/components/app/status-filter";
import { DateRangeFilter } from "@/components/app/date-range-filter";
import { EmptyState } from "@/components/app/empty-state";
import { StatusToggle } from "@/components/app/status-toggle";
import { ReferenceChip } from "@/components/app/reference-chip";
import { VehicleLink } from "@/components/app/vehicle-link";
import { DataTable, type DataColumn } from "@/components/app/data-table";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Purchase Orders" };

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "received", label: "Received" },
  { value: "cancelled", label: "Cancelled" },
];

const COLUMNS: DataColumn<PurchaseOrder>[] = [
  {
    key: "po_no",
    header: "PO no",
    sortable: true,
    className: "w-[8rem]",
    mobile: "primary",
    cell: (po) => <ReferenceChip>{po.po_no}</ReferenceChip>,
  },
  {
    key: "po_date",
    header: "Date",
    sortable: true,
    defaultDir: "desc",
    className: "w-[7rem] whitespace-nowrap",
    mobile: "secondary",
    cell: (po) => formatDisplayDate(po.po_date),
  },
  {
    key: "supplier_name",
    header: "Supplier",
    sortable: true,
    mobile: "secondary",
    cell: (po) => <span className="font-medium">{po.supplier_name}</span>,
  },
  {
    key: "vehicle_ref",
    header: "Vehicle / job",
    sortable: true,
    className: "w-[11rem]",
    hideBelow: "lg",
    interactive: true,
    mobile: "meta",
    cell: (po) =>
      po.vehicle_id || po.vehicle_ref ? (
        <VehicleLink id={po.vehicle_id} label={po.vehicle_ref} showIcon={false} className="line-clamp-2" />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "expected_date",
    header: "Expected",
    sortable: true,
    defaultDir: "desc",
    hideBelow: "xl",
    className: "w-[7rem] whitespace-nowrap",
    mobile: "meta",
    cell: (po) => (
      <span className="text-muted-foreground">
        {po.expected_date ? formatDisplayDate(po.expected_date) : "—"}
      </span>
    ),
  },
  {
    key: "total",
    header: "Total",
    sortable: true,
    defaultDir: "desc",
    align: "right",
    className: "w-[8rem]",
    mobile: "trailing",
    cell: (po) => <span className="font-mono tabular-nums">{formatAmount(po.total)}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    align: "right",
    className: "w-[9.5rem]",
    interactive: true,
    mobile: "trailing",
    cell: (po) => (
      <StatusToggle
        action={setPurchaseOrderStatus}
        id={po.id}
        current={po.status}
        options={STATUS_OPTIONS}
      />
    ),
  },
];

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const options = readListParams(params);
  const sort = resolveSort(PURCHASE_ORDER_SORTS, "po_date", options.sort, options.dir);
  const { rows, ...page } = await listPurchaseOrders(options);

  const filtered = Boolean(options.q || options.status || options.from || options.to);

  return (
    <>
      <PageHeader
        title="Purchase Orders"
        description="Orders you raise to suppliers for parts and services."
        actions={
          <Button asChild className="max-sm:hidden">
            <Link href="/purchase-orders/new">
              <Plus /> New purchase order
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput placeholder="Search by number, supplier or vehicle…" />
          <StatusFilter options={STATUS_OPTIONS} />
          <Button asChild size="icon" className="sm:hidden">
            <Link href="/purchase-orders/new" aria-label="New purchase order">
              <Plus />
            </Link>
          </Button>
        </div>
        <DateRangeFilter />
      </div>

      <DataTable
        rows={rows}
        columns={COLUMNS}
        page={page}
        sort={sort}
        getKey={(po) => po.id}
        getHref={(po) => `/purchase-orders/${po.id}`}
        caption="Purchase orders"
        empty={
          <EmptyState
            icon={ShoppingCart}
            title={filtered ? "No purchase orders match" : "No purchase orders yet"}
            description={
              filtered
                ? "Adjust your search, status or date range."
                : "Raise a purchase order when you buy parts from a supplier."
            }
            actionLabel={filtered ? undefined : "New purchase order"}
            actionHref={filtered ? undefined : "/purchase-orders/new"}
          />
        }
      />
    </>
  );
}
