import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { listInvoices, INVOICE_SORTS } from "@/lib/db/queries";
import { readListParams, resolveSort } from "@/lib/db/list";
import { setInvoiceStatus } from "@/lib/actions/invoices";
import type { Invoice } from "@/lib/types";
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

export const metadata: Metadata = { title: "Invoices" };

const STATUS_OPTIONS = [
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Part-paid" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

const COLUMNS: DataColumn<Invoice>[] = [
  {
    key: "invoice_no",
    header: "Invoice no",
    sortable: true,
    className: "w-[8rem]",
    mobile: "primary",
    cell: (inv) => <ReferenceChip>{inv.invoice_no}</ReferenceChip>,
  },
  {
    key: "invoice_date",
    header: "Date",
    sortable: true,
    defaultDir: "desc",
    className: "w-[7rem] whitespace-nowrap",
    mobile: "secondary",
    cell: (inv) => formatDisplayDate(inv.invoice_date),
  },
  {
    key: "customer_name",
    header: "Customer",
    sortable: true,
    mobile: "secondary",
    cell: (inv) => <span className="font-medium">{inv.customer_name}</span>,
  },
  {
    key: "po_no",
    header: "Customer PO",
    sortable: true,
    hideBelow: "xl",
    mobile: "meta",
    cell: (inv) => <span className="font-mono text-xs">{inv.po_no ?? "—"}</span>,
  },
  {
    key: "vehicle_label",
    header: "Vehicle",
    className: "w-[11rem]",
    hideBelow: "lg",
    interactive: true,
    mobile: "meta",
    cell: (inv) =>
      inv.vehicle_id || inv.vehicle_label ? (
        <VehicleLink id={inv.vehicle_id} label={inv.vehicle_label} showIcon={false} className="line-clamp-2" />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "vat_total",
    header: "VAT",
    align: "right",
    hideBelow: "xl",
    className: "w-[7rem]",
    mobile: "meta",
    cell: (inv) => (
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {formatAmount(inv.vat_total)}
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
    cell: (inv) => <span className="font-mono tabular-nums">{formatAmount(inv.total)}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    align: "right",
    className: "w-[9.5rem]",
    interactive: true,
    mobile: "trailing",
    cell: (inv) => (
      <StatusToggle
        action={setInvoiceStatus}
        id={inv.id}
        current={inv.status}
        options={STATUS_OPTIONS}
      />
    ),
  },
];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const options = readListParams(params);
  const sort = resolveSort(INVOICE_SORTS, "invoice_date", options.sort, options.dir);
  const { rows, ...page } = await listInvoices(options);

  const filtered = Boolean(options.q || options.status || options.from || options.to);

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Bills issued to customers after work is completed. VAT applied at 7.5%."
        actions={
          <Button asChild className="max-sm:hidden">
            <Link href="/invoices/new">
              <Plus /> New invoice
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput placeholder="Search by number, customer or PO…" />
          <StatusFilter options={STATUS_OPTIONS} />
          <Button asChild size="icon" className="sm:hidden">
            <Link href="/invoices/new" aria-label="New invoice">
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
        getKey={(inv) => inv.id}
        getHref={(inv) => `/invoices/${inv.id}`}
        caption="Invoices"
        empty={
          <EmptyState
            icon={Receipt}
            title={filtered ? "No invoices match" : "No invoices yet"}
            description={
              filtered
                ? "Adjust your search, status or date range."
                : "Raise an invoice once a job is complete."
            }
            actionLabel={filtered ? undefined : "New invoice"}
            actionHref={filtered ? undefined : "/invoices/new"}
          />
        }
      />
    </>
  );
}
