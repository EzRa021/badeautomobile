import type { Metadata } from "next";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { listQuotations, QUOTATION_SORTS } from "@/lib/db/queries";
import { readListParams, resolveSort } from "@/lib/db/list";
import { setQuotationStatus } from "@/lib/actions/quotations";
import type { Quotation } from "@/lib/types";
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

export const metadata: Metadata = { title: "Quotations" };

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "invoiced", label: "Invoiced" },
];

const COLUMNS: DataColumn<Quotation>[] = [
  {
    key: "ref_no",
    header: "Ref",
    sortable: true,
    className: "w-[9rem]",
    mobile: "primary",
    cell: (q) => <ReferenceChip>{q.ref_no}</ReferenceChip>,
  },
  {
    key: "quote_date",
    header: "Date",
    sortable: true,
    defaultDir: "desc",
    className: "w-[7rem] whitespace-nowrap",
    mobile: "secondary",
    cell: (q) => formatDisplayDate(q.quote_date),
  },
  {
    key: "customer_name",
    header: "Customer",
    sortable: true,
    mobile: "secondary",
    cell: (q) => <span className="font-medium">{q.customer_name}</span>,
  },
  {
    key: "job_title",
    header: "Job",
    hideBelow: "xl",
    mobile: "meta",
    cell: (q) => (
      <span className="line-clamp-1 text-muted-foreground">{q.job_title ?? "—"}</span>
    ),
  },
  {
    key: "vehicle_label",
    header: "Vehicle",
    sortable: true,
    className: "w-[11rem]",
    hideBelow: "lg",
    interactive: true,
    mobile: "meta",
    cell: (q) =>
      q.vehicle_id || q.vehicle_label ? (
        <VehicleLink id={q.vehicle_id} label={q.vehicle_label} showIcon={false} className="line-clamp-2" />
      ) : (
        <span className="text-muted-foreground">—</span>
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
    cell: (q) => <span className="font-mono tabular-nums">{formatAmount(q.total)}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    align: "right",
    className: "w-[9.5rem]",
    interactive: true,
    mobile: "trailing",
    cell: (q) => (
      <StatusToggle
        action={setQuotationStatus}
        id={q.id}
        current={q.status}
        options={STATUS_OPTIONS}
      />
    ),
  },
];

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const options = readListParams(params);
  const sort = resolveSort(QUOTATION_SORTS, "quote_date", options.sort, options.dir);
  const { rows, ...page } = await listQuotations(options);

  const filtered = Boolean(options.q || options.status || options.from || options.to);

  return (
    <>
      <PageHeader
        title="Quotations"
        description="Price estimates you send to customers before work begins."
        actions={
          <Button asChild className="max-sm:hidden">
            <Link href="/quotations/new">
              <Plus /> New quotation
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput placeholder="Search by ref, customer or job…" />
          <StatusFilter options={STATUS_OPTIONS} />
          <Button asChild size="icon" className="sm:hidden">
            <Link href="/quotations/new" aria-label="New quotation">
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
        getKey={(q) => q.id}
        getHref={(q) => `/quotations/${q.id}`}
        caption="Quotations"
        empty={
          <EmptyState
            icon={FileText}
            title={filtered ? "No quotations match" : "No quotations yet"}
            description={
              filtered
                ? "Adjust your search, status or date range."
                : "Create your first quotation to get started."
            }
            actionLabel={filtered ? undefined : "New quotation"}
            actionHref={filtered ? undefined : "/quotations/new"}
          />
        }
      />
    </>
  );
}
