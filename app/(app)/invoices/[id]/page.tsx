import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { getInvoice } from "@/lib/db/queries";
import { deleteInvoice, setInvoiceStatus } from "@/lib/actions/invoices";
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

export const metadata: Metadata = { title: "Invoice" };

const STATUS_OPTIONS = [
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Part-paid" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inv = await getInvoice(id);
  if (!inv) notFound();

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Invoices", href: "/invoices" }, { label: inv.invoice_no }]}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <ReferenceChip className="text-base">{inv.invoice_no}</ReferenceChip>
            <span className="text-muted-foreground">Invoice</span>
          </span>
        }
        description={`${inv.customer_name} · ${formatDisplayDate(inv.invoice_date)}`}
        actions={
          <>
            <PdfButtons basePath={`/api/invoices/${inv.id}/pdf`} />
            <Button asChild variant="outline" size="sm">
              <Link href={`/invoices/${inv.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <ConfirmDelete
              action={deleteInvoice}
              id={inv.id}
              triggerLabel="Delete"
              title={`Delete ${inv.invoice_no}?`}
              description="This permanently removes the invoice and its items."
            />
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <Card className="order-2 lg:order-1">
          <CardContent className="space-y-5 pt-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Billed to</p>
                <p className="mt-1 font-medium">{inv.customer_name}</p>
                {inv.customer_address && (
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{inv.customer_address}</p>
                )}
              </div>
              <div className="text-right text-sm">
                <p className="text-muted-foreground">Invoice No</p>
                <p className="font-mono font-medium">{inv.invoice_no}</p>
                {inv.po_no && (
                  <>
                    <p className="mt-2 text-muted-foreground">P.O No</p>
                    <p className="font-mono font-medium">{inv.po_no}</p>
                  </>
                )}
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-16">Qty</TableHead>
                  <TableHead className="w-28 text-right">Unit ₦</TableHead>
                  <TableHead className="w-28 text-right">Net ₦</TableHead>
                  <TableHead className="w-28 text-right">VAT ₦</TableHead>
                  <TableHead className="w-28 text-right">Total ₦</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inv.items.map((it, i) => (
                  <TableRow key={it.id}>
                    <TableCell className="text-muted-foreground">{(i + 1) * 10}</TableCell>
                    <TableCell>
                      {it.description}
                      {it.item_code && <span className="ml-1 font-mono text-xs text-muted-foreground">({it.item_code})</span>}
                    </TableCell>
                    <TableCell>{formatAmount(it.qty).replace(/\.00$/, "")}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{formatAmount(it.unit_price)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{formatAmount(it.net_amount)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{formatAmount(it.vat_amount)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{formatAmount(it.gross_amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end border-t border-border pt-4">
              <dl className="w-full max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-mono tabular-nums">{formatNaira(inv.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">VAT ({inv.vat_rate}%)</dt>
                  <dd className="font-mono tabular-nums">{formatNaira(inv.vat_total)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                  <dt>Total incl. tax</dt>
                  <dd className="font-mono tabular-nums">{formatNaira(inv.total)}</dd>
                </div>
                {inv.amount_in_words && (
                  <p className="pt-1 text-right text-xs text-muted-foreground">{inv.amount_in_words}</p>
                )}
              </dl>
            </div>
          </CardContent>
        </Card>

        <div className="order-1 space-y-4 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusSelect action={setInvoiceStatus} id={inv.id} current={inv.status} options={STATUS_OPTIONS} />
              <dl className="space-y-2 text-sm">
                {inv.customer_number && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Customer no.</dt>
                    <dd className="font-mono">{inv.customer_number}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{formatDisplayDate(inv.created_at)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {inv.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{inv.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
