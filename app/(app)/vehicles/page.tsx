import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, Car } from "lucide-react";
import { pagedVehicles, VEHICLE_SORTS, type VehicleRow } from "@/lib/db/queries";
import { readListParams, resolveSort } from "@/lib/db/list";
import { deleteVehicle } from "@/lib/actions/vehicles";
import { formatDisplayDate } from "@/lib/utils/dates";
import { PageHeader } from "@/components/app/page-header";
import { SearchInput } from "@/components/app/search-input";
import { DateRangeFilter } from "@/components/app/date-range-filter";
import { EmptyState } from "@/components/app/empty-state";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { ReferenceChip } from "@/components/app/reference-chip";
import { DataTable, type DataColumn } from "@/components/app/data-table";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Vehicles" };

const COLUMNS: DataColumn<VehicleRow>[] = [
  {
    key: "description",
    header: "Vehicle",
    sortable: true,
    mobile: "primary",
    cell: (v) => <span className="font-medium">{v.description}</span>,
  },
  {
    key: "reg_no",
    header: "Plate",
    sortable: true,
    className: "w-[9rem]",
    mobile: "trailing",
    cell: (v) =>
      v.reg_no ? <ReferenceChip>{v.reg_no}</ReferenceChip> : <span className="text-muted-foreground">—</span>,
  },
  {
    key: "customer",
    header: "Owner",
    hideBelow: "lg",
    mobile: "secondary",
    cell: (v) => (
      <span className="text-muted-foreground">{v.customer?.name ?? "—"}</span>
    ),
  },
  {
    key: "make",
    header: "Make",
    sortable: true,
    className: "w-[8rem]",
    hideBelow: "xl",
    mobile: "meta",
    cell: (v) => v.make ?? <span className="text-muted-foreground">—</span>,
  },
  {
    key: "model",
    header: "Model",
    sortable: true,
    className: "w-[8rem]",
    hideBelow: "xl",
    mobile: "meta",
    cell: (v) => v.model ?? <span className="text-muted-foreground">—</span>,
  },
  {
    key: "created_at",
    header: "Added",
    sortable: true,
    defaultDir: "desc",
    className: "w-[7rem] whitespace-nowrap",
    hideBelow: "lg",
    mobile: "meta",
    cell: (v) => <span className="text-muted-foreground">{formatDisplayDate(v.created_at)}</span>,
  },
  {
    key: "actions",
    header: "",
    align: "right",
    className: "w-[6rem]",
    interactive: true,
    mobile: "trailing",
    cell: (v) => (
      <div className="flex items-center justify-end gap-0.5">
        <Button asChild variant="ghost" size="icon" aria-label={`Edit ${v.description}`}>
          <Link href={`/vehicles/${v.id}/edit`}>
            <Pencil />
          </Link>
        </Button>
        <ConfirmDelete
          action={deleteVehicle}
          id={v.id}
          triggerVariant="ghost"
          triggerIconOnly
          title={`Delete ${v.description}?`}
          description="Documents already raised for this vehicle are kept, but they lose the link."
        />
      </div>
    ),
  },
];

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const options = readListParams(params);
  const sort = resolveSort(VEHICLE_SORTS, "description", options.sort, options.dir);
  const { rows, ...page } = await pagedVehicles(options);

  const filtered = Boolean(options.q || options.from || options.to);

  return (
    <>
      <PageHeader
        title="Vehicles"
        description="Every serviced vehicle, with its full document history. Open one to see what has been done."
        actions={
          <Button asChild className="max-sm:hidden">
            <Link href="/vehicles/new">
              <Plus /> New vehicle
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-2">
          <SearchInput placeholder="Search by vehicle, plate or make…" />
          <Button asChild size="icon" className="sm:hidden">
            <Link href="/vehicles/new" aria-label="New vehicle">
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
        getKey={(v) => v.id}
        getHref={(v) => `/vehicles/${v.id}`}
        caption="Vehicles"
        empty={
          <EmptyState
            icon={Car}
            title={filtered ? "No vehicles match" : "No vehicles yet"}
            description={
              filtered
                ? "Try a different search or date range."
                : "Vehicles are registered automatically when you type one on a document."
            }
            actionLabel={filtered ? undefined : "New vehicle"}
            actionHref={filtered ? undefined : "/vehicles/new"}
          />
        }
      />
    </>
  );
}
