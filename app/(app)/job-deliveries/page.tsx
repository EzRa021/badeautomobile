import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { listJobDeliveries } from "@/lib/db/queries";
import { formatDisplayDate } from "@/lib/utils/dates";
import { PageHeader } from "@/components/app/page-header";
import { SearchInput } from "@/components/app/search-input";
import { StatusFilter } from "@/components/app/status-filter";
import { EmptyState } from "@/components/app/empty-state";
import { StatusBadge } from "@/components/app/status-badge";
import { ReferenceChip } from "@/components/app/reference-chip";
import { RecordList, RecordRow } from "@/components/app/record-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Job Delivery" };

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
];

export default async function JobDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const reports = await listJobDeliveries({ q, status });

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

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput placeholder="Search by number, customer or vehicle…" />
        <StatusFilter options={STATUS_OPTIONS} />
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={q || status ? "No reports match" : "No job delivery reports yet"}
          description={q || status ? "Adjust your search or filter." : "Create a report when handing a vehicle back."}
          actionLabel={q || status ? undefined : "New job delivery"}
          actionHref={q || status ? undefined : "/job-deliveries/new"}
        />
      ) : (
        <RecordList>
          {reports.map((jd) => (
            <RecordRow
              key={jd.id}
              href={`/job-deliveries/${jd.id}`}
              chip={<ReferenceChip>{jd.jd_no}</ReferenceChip>}
              title={jd.customer_name}
              subtitle={`${formatDisplayDate(jd.delivery_date)}${jd.vehicle ? " · " + jd.vehicle : ""}`}
              right={<StatusBadge status={jd.status} />}
            />
          ))}
        </RecordList>
      )}
    </>
  );
}
