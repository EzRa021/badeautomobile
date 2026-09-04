import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, Car } from "lucide-react";
import { listVehicles } from "@/lib/db/queries";
import { deleteVehicle } from "@/lib/actions/vehicles";
import { PageHeader } from "@/components/app/page-header";
import { SearchInput } from "@/components/app/search-input";
import { EmptyState } from "@/components/app/empty-state";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { ReferenceChip } from "@/components/app/reference-chip";
import { RecordList, RecordRow } from "@/components/app/record-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Vehicles" };

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const vehicles = await listVehicles(q);

  return (
    <>
      <PageHeader
        title="Vehicles"
        description="A registry of serviced vehicles you can attach to quotations and job reports."
        actions={
          <Button asChild className="max-sm:hidden">
            <Link href="/vehicles/new">
              <Plus /> New vehicle
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <SearchInput placeholder="Search vehicles…" />
        <Button asChild size="icon" className="sm:hidden">
          <Link href="/vehicles/new" aria-label="New vehicle">
            <Plus />
          </Link>
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title={q ? "No vehicles match your search" : "No vehicles yet"}
          description={q ? "Try a different description or plate." : "Register a vehicle to reuse it across documents."}
          actionLabel={q ? undefined : "New vehicle"}
          actionHref={q ? undefined : "/vehicles/new"}
        />
      ) : (
        <RecordList>
          {vehicles.map((v) => (
            <RecordRow
              key={v.id}
              title={v.description}
              subtitle={[v.customer?.name, [v.make, v.model].filter(Boolean).join(" ")].filter(Boolean).join(" · ") || undefined}
              right={v.reg_no ? <ReferenceChip>{v.reg_no}</ReferenceChip> : undefined}
              actions={
                <>
                  <Button asChild variant="ghost" size="icon" aria-label="Edit">
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
