import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Car, FileText, Package, Pencil, Receipt, TrendingUp, Wrench } from "lucide-react";
import { getVehicleWithOwner } from "@/lib/db/queries";
import {
  getVehicleHistory,
  parseDateParam,
  parseKindParam,
  VEHICLE_DOC_KINDS,
  type VehicleDocKind,
  type VehicleDocument,
} from "@/lib/db/vehicle-history";
import { deleteVehicle } from "@/lib/actions/vehicles";
import { formatDisplayDate } from "@/lib/utils/dates";
import { formatAmount, formatNaira } from "@/lib/utils/money";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { StatusFilter } from "@/components/app/status-filter";
import { DateRangeFilter } from "@/components/app/date-range-filter";
import { ReferenceChip } from "@/components/app/reference-chip";
import { DataTable, type DataColumn } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { MiniBarChart } from "@/components/app/mini-bar-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Vehicle history" };

const KIND_STYLE: Record<VehicleDocKind, { label: string; className: string }> = {
  quotation: { label: "Quote", className: "bg-sky-50 text-sky-700 border-sky-200" },
  job_delivery: { label: "Job", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  invoice: { label: "Invoice", className: "bg-violet-50 text-violet-700 border-violet-200" },
  purchase_order: { label: "PO", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

function KindBadge({ kind }: { kind: VehicleDocKind }) {
  const style = KIND_STYLE[kind];
  return (
    <span
      className={`inline-flex w-[4.25rem] justify-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${style.className}`}
    >
      {style.label}
    </span>
  );
}

const COLUMNS: DataColumn<VehicleDocument>[] = [
  {
    key: "kind",
    header: "Type",
    sortable: true,
    className: "w-[6rem]",
    mobile: "secondary",
    cell: (doc) => <KindBadge kind={doc.kind} />,
  },
  {
    key: "ref",
    header: "Reference",
    sortable: true,
    className: "w-[10rem]",
    mobile: "primary",
    cell: (doc) => <ReferenceChip>{doc.ref}</ReferenceChip>,
  },
  {
    key: "date",
    header: "Date",
    sortable: true,
    defaultDir: "desc",
    className: "w-[7rem] whitespace-nowrap",
    mobile: "secondary",
    cell: (doc) => formatDisplayDate(doc.date),
  },
  {
    key: "summary",
    header: "Job",
    mobile: "meta",
    cell: (doc) => (
      <span className="line-clamp-1 text-muted-foreground">{doc.summary ?? "—"}</span>
    ),
  },
  {
    key: "party",
    header: "Party",
    sortable: true,
    hideBelow: "xl",
    mobile: "meta",
    cell: (doc) => <span className="line-clamp-1">{doc.party ?? "—"}</span>,
  },
  {
    key: "amount",
    header: "Amount",
    sortable: true,
    defaultDir: "desc",
    align: "right",
    className: "w-[8rem]",
    mobile: "trailing",
    cell: (doc) =>
      doc.amount == null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <span className="font-mono tabular-nums">{formatAmount(doc.amount)}</span>
      ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    align: "right",
    className: "w-[8rem]",
    mobile: "trailing",
    cell: (doc) => <StatusBadge status={doc.status} />,
  },
];

export default async function VehicleHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const vehicle = await getVehicleWithOwner(id);
  if (!vehicle) notFound();

  const from = parseDateParam(query.from);
  const to = parseDateParam(query.to);
  const kind = parseKindParam(query.type);
  const filtered = Boolean(from || to || kind);

  const history = await getVehicleHistory(id, {
    from,
    to,
    kind,
    sort: query.sort,
    dir: query.dir,
    page: query.page ? Number(query.page) : undefined,
    perPage: query.perPage ? Number(query.perPage) : undefined,
  });
  const { totals, counts, documents } = history;

  const makeModel = [vehicle.make, vehicle.model].filter(Boolean).join(" ");
  const subtitle = [makeModel, vehicle.customer?.name].filter(Boolean).join(" · ");

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Vehicles", href: "/vehicles" }, { label: vehicle.description }]}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {vehicle.description}
            {vehicle.reg_no && <ReferenceChip className="text-base">{vehicle.reg_no}</ReferenceChip>}
          </span>
        }
        description={subtitle || "Service history"}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/vehicles/${vehicle.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <ConfirmDelete
              action={deleteVehicle}
              id={vehicle.id}
              triggerLabel="Delete"
              title={`Delete ${vehicle.description}?`}
              description="Documents already raised for this vehicle are kept, but they lose the link."
            />
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Invoiced"
          value={formatNaira(totals.invoiced)}
          sub={`${counts.invoice} invoice${counts.invoice === 1 ? "" : "s"}`}
          icon={Receipt}
        />
        <StatCard
          label="Quoted"
          value={formatNaira(totals.quoted)}
          sub={`${counts.quotation} quotation${counts.quotation === 1 ? "" : "s"}`}
          icon={FileText}
          accent="slate"
        />
        <StatCard
          label="Parts & supplies"
          value={formatNaira(totals.parts)}
          sub={`${counts.purchase_order} purchase order${counts.purchase_order === 1 ? "" : "s"}`}
          icon={Package}
          accent="amber"
        />
        <StatCard
          label="Jobs delivered"
          value={String(totals.jobs)}
          sub={history.lastActivity ? `Last activity ${formatDisplayDate(history.lastActivity)}` : "No activity yet"}
          icon={Wrench}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <DateRangeFilter />
        <StatusFilter
          paramName="type"
          allLabel="All documents"
          options={VEHICLE_DOC_KINDS.map((k) => ({ value: k.value, label: k.plural }))}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="order-2 lg:order-1">
          <DataTable
            rows={documents}
            columns={COLUMNS}
            page={history.page}
            sort={history.sort}
            getKey={(doc) => `${doc.kind}:${doc.id}`}
            getHref={(doc) => doc.href}
            caption={`Documents for ${vehicle.description}`}
            empty={
              <EmptyState
                icon={Car}
                title={filtered ? "Nothing in this range" : "No documents for this vehicle yet"}
                description={
                  filtered
                    ? "Widen the dates or clear the document-type filter."
                    : "Quotations, job deliveries, invoices and purchase orders raised against this vehicle will appear here."
                }
              />
            }
          />
        </div>

        <div className="order-1 space-y-4 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Documents</dt>
                  <dd>{documents.length}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">First seen</dt>
                  <dd>{formatDisplayDate(history.firstSeen)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Last activity</dt>
                  <dd>{formatDisplayDate(history.lastActivity)}</dd>
                </div>
                {totals.invoiced > 0 && totals.parts > 0 && (
                  <div className="flex justify-between gap-3 border-t border-border pt-2">
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <TrendingUp className="size-3.5" /> Invoiced − parts
                    </dt>
                    <dd className="font-mono tabular-nums">{formatNaira(totals.margin)}</dd>
                  </div>
                )}
              </dl>
              {filtered && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5 shrink-0" />
                  Figures cover the current filter only.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Invoiced by month</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniBarChart data={history.monthly} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Raise for this vehicle</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link href={`/quotations/new?vehicle=${vehicle.id}`}>
                  <FileText /> New quotation
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link href={`/job-deliveries/new?vehicle=${vehicle.id}`}>
                  <Wrench /> New job delivery
                </Link>
              </Button>
            </CardContent>
          </Card>

          {vehicle.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{vehicle.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
