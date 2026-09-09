import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, Users } from "lucide-react";
import { pagedCustomers, CONTACT_SORTS } from "@/lib/db/queries";
import { readListParams, resolveSort } from "@/lib/db/list";
import { deleteCustomer } from "@/lib/actions/customers";
import type { Customer } from "@/lib/types";
import { formatDisplayDate } from "@/lib/utils/dates";
import { PageHeader } from "@/components/app/page-header";
import { SearchInput } from "@/components/app/search-input";
import { DateRangeFilter } from "@/components/app/date-range-filter";
import { EmptyState } from "@/components/app/empty-state";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { DataTable, type DataColumn } from "@/components/app/data-table";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Customers" };

const COLUMNS: DataColumn<Customer>[] = [
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
          <Link href={`/customers/${row.id}/edit`}>
            <Pencil />
          </Link>
        </Button>
        <ConfirmDelete
          action={deleteCustomer}
          id={row.id}
          triggerVariant="ghost"
          triggerIconOnly
          title={`Delete ${row.name}?`}
          description="Existing documents keep their saved copy of this customer."
        />
      </div>
    ),
  },
];

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const options = readListParams(params);
  const sort = resolveSort(CONTACT_SORTS, "name", options.sort, options.dir);
  const { rows, ...page } = await pagedCustomers(options);

  const filtered = Boolean(options.q || options.from || options.to);

  return (
    <>
      <PageHeader
        title="Customers"
        description="Clients you quote and invoice. Details are snapshotted onto each document."
        actions={
          <Button asChild className="max-sm:hidden">
            <Link href="/customers/new">
              <Plus /> New customer
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-2">
          <SearchInput placeholder="Search customers…" />
          <Button asChild size="icon" className="sm:hidden">
            <Link href="/customers/new" aria-label="New customer">
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
        getHref={(row) => `/customers/${row.id}/edit`}
        caption="Customers"
        empty={
          <EmptyState
            icon={Users}
            title={filtered ? "No customers match" : "No customers yet"}
            description={
              filtered
                ? "Try a different search or date range."
                : "Add your first customer to start creating documents."
            }
            actionLabel={filtered ? undefined : "New customer"}
            actionHref={filtered ? undefined : "/customers/new"}
          />
        }
      />
    </>
  );
}
