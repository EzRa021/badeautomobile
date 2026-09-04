import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, Users } from "lucide-react";
import { listCustomers } from "@/lib/db/queries";
import { deleteCustomer } from "@/lib/actions/customers";
import { PageHeader } from "@/components/app/page-header";
import { SearchInput } from "@/components/app/search-input";
import { EmptyState } from "@/components/app/empty-state";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { RecordList, RecordRow } from "@/components/app/record-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const customers = await listCustomers(q);

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

      <div className="mb-4 flex items-center gap-2">
        <SearchInput placeholder="Search customers…" />
        <Button asChild size="icon" className="sm:hidden">
          <Link href="/customers/new" aria-label="New customer">
            <Plus />
          </Link>
        </Button>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "No customers match your search" : "No customers yet"}
          description={q ? "Try a different name, phone or email." : "Add your first customer to start creating documents."}
          actionLabel={q ? undefined : "New customer"}
          actionHref={q ? undefined : "/customers/new"}
        />
      ) : (
        <RecordList>
          {customers.map((c) => (
            <RecordRow
              key={c.id}
              title={c.name}
              subtitle={[c.phone, c.email].filter(Boolean).join(" · ") || c.address || undefined}
              right={c.tin ? <span className="font-mono text-xs text-muted-foreground">{c.tin}</span> : undefined}
              actions={
                <>
                  <Button asChild variant="ghost" size="icon" aria-label="Edit">
                    <Link href={`/customers/${c.id}/edit`}>
                      <Pencil />
                    </Link>
                  </Button>
                  <ConfirmDelete
                    action={deleteCustomer}
                    id={c.id}
                    triggerVariant="ghost"
                    triggerIconOnly
                    title={`Delete ${c.name}?`}
                    description="Existing documents keep their saved copy of this customer."
                  />
                </>
              }
            />
          ))}
        </RecordList>
      )}
    </>
  );
}
