import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Receipt, Truck } from "lucide-react";
import { getQuotation } from "@/lib/db/queries";
import { deleteQuotation, setQuotationStatus } from "@/lib/actions/quotations";
import { formatDisplayDate } from "@/lib/utils/dates";
import { formatNaira, formatAmount } from "@/lib/utils/money";
import { PageHeader } from "@/components/app/page-header";
import { ReferenceChip } from "@/components/app/reference-chip";
import { StatusSelect } from "@/components/app/status-select";
import { PdfButtons } from "@/components/app/pdf-buttons";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const metadata: Metadata = { title: "Quotation" };

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "invoiced", label: "Invoiced" },
];

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const q = await getQuotation(id);
  if (!q) notFound();

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Quotations", href: "/quotations" }, { label: q.ref_no }]}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <ReferenceChip className="text-base">{q.ref_no}</ReferenceChip>
            <span className="text-muted-foreground">Quotation</span>
          </span>
        }
        description={`${q.customer_name} · ${formatDisplayDate(q.quote_date)}`}
        actions={
          <>
            <PdfButtons basePath={`/api/quotations/${q.id}/pdf`} />
            <Button asChild variant="outline" size="sm">
              <Link href={`/quotations/${q.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <ConfirmDelete
              action={deleteQuotation}
              id={q.id}
              triggerLabel="Delete"
              title={`Delete ${q.ref_no}?`}
              description="This permanently removes the quotation and its items."
            />
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        {/* Document preview */}
        <Card className="order-2 lg:order-1">
          <CardContent className="space-y-5 pt-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Billed to</p>
                <p className="mt-1 font-medium">{q.customer_name}</p>
                {q.customer_address && (
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{q.customer_address}</p>
                )}
              </div>
              <div className="text-right text-sm">
                <p className="text-muted-foreground">Our Ref</p>
                <p className="font-mono font-medium">{q.ref_no}</p>
                <p className="mt-2 text-muted-foreground">Date</p>
                <p className="font-medium">{formatDisplayDate(q.quote_date)}</p>
              </div>
            </div>

            {q.job_title && (
              <div className="rounded-md bg-muted/60 px-3 py-2 text-sm font-semibold uppercase tracking-wide">
                {q.job_title}
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">S/N</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-24">Qty</TableHead>
                  <TableHead className="w-28 text-right">Rate ₦</TableHead>
                  <TableHead className="w-32 text-right">Amount ₦</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.items.map((it, i) => (
                  <TableRow key={it.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>{it.description}</TableCell>
                    <TableCell>
                      {formatAmount(it.qty).replace(/\.00$/, "")} {it.unit}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {it.rate != null ? formatAmount(it.rate) : ""}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{formatAmount(it.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end border-t border-border pt-4">
              <div className="w-full max-w-xs space-y-1">
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="font-mono tabular-nums">{formatNaira(q.total)}</span>
                </div>
                {q.amount_in_words && (
                  <p className="text-right text-xs text-muted-foreground">{q.amount_in_words}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meta panel */}
        <div className="order-1 space-y-4 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusSelect action={setQuotationStatus} id={q.id} current={q.status} options={STATUS_OPTIONS} />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{formatDisplayDate(q.created_at)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Items</dt>
                  <dd>{q.items.length}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Convert</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link href={`/invoices/new?from_quotation=${q.id}`}>
                  <Receipt /> Create invoice
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="justify-start">
                <Link href={`/job-deliveries/new?from_quotation=${q.id}`}>
                  <Truck /> Create job delivery
                </Link>
              </Button>
            </CardContent>
          </Card>

          {q.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{q.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
