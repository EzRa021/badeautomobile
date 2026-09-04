import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, Factory } from "lucide-react";
import { listSuppliers } from "@/lib/db/queries";
import { deleteSupplier } from "@/lib/actions/suppliers";
import { PageHeader } from "@/components/app/page-header";
import { SearchInput } from "@/components/app/search-input";
import { EmptyState } from "@/components/app/empty-state";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { RecordList, RecordRow } from "@/components/app/record-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Suppliers" };

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const suppliers = await listSuppliers(q);

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

      <div className="mb-4 flex items-center gap-2">
        <SearchInput placeholder="Search suppliers…" />
        <Button asChild size="icon" className="sm:hidden">
          <Link href="/suppliers/new" aria-label="New supplier">
            <Plus />
          </Link>
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <EmptyState
          icon={Factory}
          title={q ? "No suppliers match your search" : "No suppliers yet"}
          description={q ? "Try a different name, phone or email." : "Add a supplier to start raising purchase orders."}
          actionLabel={q ? undefined : "New supplier"}
          actionHref={q ? undefined : "/suppliers/new"}
        />
      ) : (
        <RecordList>
          {suppliers.map((s) => (
            <RecordRow
              key={s.id}
              title={s.name}
              subtitle={[s.phone, s.email].filter(Boolean).join(" · ") || s.address || undefined}
              right={s.tin ? <span className="font-mono text-xs text-muted-foreground">{s.tin}</span> : undefined}
              actions={
                <>
                  <Button asChild variant="ghost" size="icon" aria-label="Edit">
                    <Link href={`/suppliers/${s.id}/edit`}>
                      <Pencil />
                    </Link>
                  </Button>
                  <ConfirmDelete
                    action={deleteSupplier}
                    id={s.id}
                    triggerVariant="ghost"
                    triggerIconOnly
                    title={`Delete ${s.name}?`}
                    description="Existing purchase orders keep their saved copy of this supplier."
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
