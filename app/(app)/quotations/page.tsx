import type { Metadata } from "next";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { listQuotations } from "@/lib/db/queries";
import { formatDisplayDate } from "@/lib/utils/dates";
import { formatNaira } from "@/lib/utils/money";
import { PageHeader } from "@/components/app/page-header";
import { SearchInput } from "@/components/app/search-input";
import { StatusFilter } from "@/components/app/status-filter";
import { EmptyState } from "@/components/app/empty-state";
import { StatusBadge } from "@/components/app/status-badge";
import { ReferenceChip } from "@/components/app/reference-chip";
import { RecordList, RecordRow } from "@/components/app/record-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Quotations" };

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "invoiced", label: "Invoiced" },
];

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const quotations = await listQuotations({ q, status });

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

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput placeholder="Search by ref, customer or job…" />
        <StatusFilter options={STATUS_OPTIONS} />
      </div>

      {quotations.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={q || status ? "No quotations match" : "No quotations yet"}
          description={q || status ? "Adjust your search or filter." : "Create your first quotation to get started."}
          actionLabel={q || status ? undefined : "New quotation"}
          actionHref={q || status ? undefined : "/quotations/new"}
        />
      ) : (
        <RecordList>
          {quotations.map((qt) => (
            <RecordRow
              key={qt.id}
              href={`/quotations/${qt.id}`}
              chip={<ReferenceChip>{qt.ref_no}</ReferenceChip>}
              title={qt.customer_name}
              subtitle={`${formatDisplayDate(qt.quote_date)}${qt.job_title ? " · " + qt.job_title : ""}`}
              right={
                <>
                  <span className="font-mono text-sm tabular-nums">{formatNaira(qt.total)}</span>
                  <StatusBadge status={qt.status} />
                </>
              }
            />
          ))}
        </RecordList>
      )}
    </>
  );
}
