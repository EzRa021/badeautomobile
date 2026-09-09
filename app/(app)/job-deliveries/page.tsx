import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { listJobDeliveries, JOB_DELIVERY_SORTS } from "@/lib/db/queries";
import { readListParams, resolveSort } from "@/lib/db/list";
import { setJobDeliveryStatus } from "@/lib/actions/job-deliveries";
import type { JobDelivery } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils/dates";
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

export const metadata: Metadata = { title: "Job Delivery" };

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
];

const COLUMNS: DataColumn<JobDelivery>[] = [
  {
    key: "jd_no",
    header: "No",
    sortable: true,
    className: "w-[7rem]",
    mobile: "primary",
    cell: (jd) => <ReferenceChip>{jd.jd_no}</ReferenceChip>,
  },
  {
    key: "delivery_date",
    header: "Delivered",
    sortable: true,
    defaultDir: "desc",
    className: "w-[7rem] whitespace-nowrap",
    mobile: "secondary",
    cell: (jd) => formatDisplayDate(jd.delivery_date),
  },
  {
    key: "customer_name",
    header: "Customer",
    sortable: true,
    mobile: "secondary",
    cell: (jd) => <span className="font-medium">{jd.customer_name}</span>,
  },
  {
    key: "vehicle",
    header: "Vehicle",
    sortable: true,
    className: "w-[11rem]",
    interactive: true,
    mobile: "meta",
    cell: (jd) =>
      jd.vehicle_id || jd.vehicle ? (
        <VehicleLink id={jd.vehicle_id} label={jd.vehicle} showIcon={false} className="line-clamp-2" />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "work_done",
    header: "Work done",
    hideBelow: "xl",
    mobile: "meta",
    cell: (jd) => (
      <span className="line-clamp-1 text-muted-foreground">{jd.work_done ?? "—"}</span>
    ),
  },
  {
    key: "grn_no",
    header: "GRN",
    sortable: true,
    hideBelow: "lg",
    className: "w-[7rem]",
    mobile: "meta",
    cell: (jd) => <span className="font-mono text-xs">{jd.grn_no ?? "—"}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    align: "right",
    className: "w-[9.5rem]",
    interactive: true,
    mobile: "trailing",
    cell: (jd) => (
      <StatusToggle
        action={setJobDeliveryStatus}
        id={jd.id}
        current={jd.status}
        options={STATUS_OPTIONS}
      />
    ),
  },
];

export default async function JobDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const options = readListParams(params);
  const sort = resolveSort(JOB_DELIVERY_SORTS, "delivery_date", options.sort, options.dir);
  const { rows, ...page } = await listJobDeliveries(options);

  const filtered = Boolean(options.q || options.status || options.from || options.to);

  return (
    <>
      <PageHeader
        title="Job Delivery"
        description="Delivery reports handed over with a completed vehicle."
        actions={
          <Button asChild className="max-sm:hidden">
            <Link href="/job-deliveries/new">
              <Plus /> New job delivery
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput placeholder="Search by number, customer or vehicle…" />
          <StatusFilter options={STATUS_OPTIONS} />
          <Button asChild size="icon" className="sm:hidden">
            <Link href="/job-deliveries/new" aria-label="New job delivery">
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
        getKey={(jd) => jd.id}
        getHref={(jd) => `/job-deliveries/${jd.id}`}
        caption="Job delivery reports"
        empty={
          <EmptyState
            icon={Truck}
            title={filtered ? "No reports match" : "No job delivery reports yet"}
            description={
              filtered
                ? "Adjust your search, status or date range."
                : "Create a report when you hand a vehicle back."
            }
            actionLabel={filtered ? undefined : "New job delivery"}
            actionHref={filtered ? undefined : "/job-deliveries/new"}
          />
        }
      />
    </>
  );
}
