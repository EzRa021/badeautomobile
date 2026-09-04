import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { getJobDelivery } from "@/lib/db/queries";
import { deleteJobDelivery, setJobDeliveryStatus } from "@/lib/actions/job-deliveries";
import { formatDisplayDate, formatDateTime } from "@/lib/utils/dates";
import { PageHeader } from "@/components/app/page-header";
import { ReferenceChip } from "@/components/app/reference-chip";
import { StatusSelect } from "@/components/app/status-select";
import { PdfButtons } from "@/components/app/pdf-buttons";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Job Delivery" };

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
];

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-sm">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}

export default async function JobDeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jd = await getJobDelivery(id);
  if (!jd) notFound();

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Job Delivery", href: "/job-deliveries" }, { label: jd.jd_no }]}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <ReferenceChip className="text-base">{jd.jd_no}</ReferenceChip>
            <span className="text-muted-foreground">Job Delivery Report</span>
          </span>
        }
        description={`${jd.customer_name} · ${formatDisplayDate(jd.delivery_date)}`}
        actions={
          <>
            <PdfButtons basePath={`/api/job-deliveries/${jd.id}/pdf`} />
            <Button asChild variant="outline" size="sm">
              <Link href={`/job-deliveries/${jd.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <ConfirmDelete
              action={deleteJobDelivery}
              id={jd.id}
              triggerLabel="Delete"
              title={`Delete ${jd.jd_no}?`}
              description="This permanently removes the job delivery report."
            />
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="order-2 space-y-5 lg:order-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Customer & vehicle</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Customer" value={jd.customer_name} />
              <Field label="Address" value={jd.customer_address} />
              <Field label="Vehicle" value={jd.vehicle} />
              <Field label="P.O No" value={jd.po_no} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Work carried out</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field label="Work description" value={jd.work_done} />
              <Field label="Items changed" value={jd.items_changed} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Note" value={jd.note} />
                <Field label="Next service" value={jd.next_service} />
                <Field label="Accessories found" value={jd.accessories_found} />
                <Field label="Accessories returned" value={jd.accessories_returned} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Handover</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Date & time in" value={jd.date_in ? formatDateTime(jd.date_in) : null} />
              <Field label="Date & time out" value={jd.date_out ? formatDateTime(jd.date_out) : null} />
              <Field label="Driver's name & signature" value={jd.driver_name} />
              <div />
              <Field label="Vehicle coordinator" value={jd.coordinator_sign} />
              <Field label="Engineering inspector" value={jd.inspector_sign} />
            </CardContent>
          </Card>
        </div>

        <div className="order-1 space-y-4 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusSelect action={setJobDeliveryStatus} id={jd.id} current={jd.status} options={STATUS_OPTIONS} />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{formatDisplayDate(jd.created_at)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
