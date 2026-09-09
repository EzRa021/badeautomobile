import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, Factory } from "lucide-react";
import { pagedSuppliers, CONTACT_SORTS } from "@/lib/db/queries";
import { readListParams, resolveSort } from "@/lib/db/list";
import { deleteSupplier } from "@/lib/actions/suppliers";
import type { Supplier } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils/dates";
import { PageHeader } from "@/components/app/page-header";
import { SearchInput } from "@/components/app/search-input";
import { DateRangeFilter } from "@/components/app/date-range-filter";
import { EmptyState } from "@/components/app/empty-state";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { DataTable, type DataColumn } from "@/components/app/data-table";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Suppliers" };

const COLUMNS: DataColumn<Supplier>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    mobile: "primary",
    cell: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    key: "phone",
    header: "Phone",
    sortable: true,
    className: "w-[10rem]",
    mobile: "secondary",
    cell: (row) => row.phone ?? <span className="text-muted-foreground">—</span>,
  },
  {
    key: "email",
    header: "Email",
    sortable: true,
    hideBelow: "lg",
    mobile: "meta",
    cell: (row) => (
      <span className="line-clamp-1 text-muted-foreground">{row.email ?? "—"}</span>
    ),
  },
  {
    key: "address",
    header: "Address",
    hideBelow: "xl",
    mobile: "meta",
    cell: (row) => (
      <span className="line-clamp-1 text-muted-foreground">{row.address ?? "—"}</span>
    ),
  },
  {
    key: "tin",
    header: "TIN",
    sortable: true,
    className: "w-[9rem]",
    hideBelow: "lg",
    mobile: "meta",
    cell: (row) => <span className="font-mono text-xs">{row.tin ?? "—"}</span>,
  },
  {
    key: "created_at",
    header: "Added",
    sortable: true,
    defaultDir: "desc",
    className: "w-[7rem] whitespace-nowrap",
    hideBelow: "xl",
    mobile: "meta",
    cell: (row) => (
      <span className="text-muted-foreground">{formatDisplayDate(row.created_at)}</span>
    ),
  },
  {
    key: "actions",
    header: "",
    align: "right",
    className: "w-[6rem]",
    interactive: true,
    mobile: "trailing",
    cell: (row) => (
      <div className="flex items-center justify-end gap-0.5">
        <Button asChild variant="ghost" size="icon" aria-label={`Edit ${row.name}`}>
          <Link href={`/suppliers/${row.id}/edit`}>
            <Pencil />
          </Link>
        </Button>
        <ConfirmDelete
          action={deleteSupplier}
          id={row.id}
          triggerVariant="ghost"
          triggerIconOnly
          title={`Delete ${row.name}?`}
          description="Existing documents keep their saved copy of this supplier."
        />
      </div>
    ),
  },
];

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const options = readListParams(params);
  const sort = resolveSort(CONTACT_SORTS, "name", options.sort, options.dir);
  const { rows, ...page } = await pagedSuppliers(options);

  const filtered = Boolean(options.q || options.from || options.to);

  return (
    <>
      <PageHeader
        title="Suppliers"
        description="Vendors you raise purchase orders to for parts and services."
        actions={
          <Button asChild className="max-sm:hidden">
            <Link href="/suppliers/new">
              <Plus /> New supplier
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-2">
          <SearchInput placeholder="Search suppliers…" />
          <Button asChild size="icon" className="sm:hidden">
            <Link href="/suppliers/new" aria-label="New supplier">
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
        getKey={(row) => row.id}
        getHref={(row) => `/suppliers/${row.id}/edit`}
        caption="Suppliers"
        empty={
          <EmptyState
            icon={Factory}
            title={filtered ? "No suppliers match" : "No suppliers yet"}
            description={
              filtered
                ? "Try a different search or date range."
                : "Add a supplier to start raising purchase orders."
            }
            actionLabel={filtered ? undefined : "New supplier"}
            actionHref={filtered ? undefined : "/suppliers/new"}
          />
        }
      />
    </>
  );
}
