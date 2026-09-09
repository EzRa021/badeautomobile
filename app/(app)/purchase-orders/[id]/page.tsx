import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { getPurchaseOrder } from "@/lib/db/queries";
import { deletePurchaseOrder, setPurchaseOrderStatus } from "@/lib/actions/purchase-orders";
import { formatDisplayDate } from "@/lib/utils/dates";
import { formatNaira, formatAmount } from "@/lib/utils/money";
import { PageHeader } from "@/components/app/page-header";
import { ReferenceChip } from "@/components/app/reference-chip";
import { VehicleLink } from "@/components/app/vehicle-link";
import { StatusSelect } from "@/components/app/status-select";
import { PdfButtons } from "@/components/app/pdf-buttons";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const metadata: Metadata = { title: "Purchase Order" };

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "received", label: "Received" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const po = await getPurchaseOrder(id);
  if (!po) notFound();

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Purchase Orders", href: "/purchase-orders" }, { label: po.po_no }]}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <ReferenceChip className="text-base">{po.po_no}</ReferenceChip>
            <span className="text-muted-foreground">Purchase Order</span>
          </span>
        }
        description={`${po.supplier_name} · ${formatDisplayDate(po.po_date)}`}
        actions={
          <>
            <PdfButtons basePath={`/api/purchase-orders/${po.id}/pdf`} />
            <Button asChild variant="outline" size="sm">
              <Link href={`/purchase-orders/${po.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <ConfirmDelete
              action={deletePurchaseOrder}
              id={po.id}
              triggerLabel="Delete"
              title={`Delete ${po.po_no}?`}
              description="This permanently removes the purchase order and its items."
            />
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <Card className="order-2 lg:order-1">
          <CardContent className="space-y-5 pt-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Supplier</p>
                <p className="mt-1 font-medium">{po.supplier_name}</p>
                {po.supplier_address && (
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{po.supplier_address}</p>
                )}
              </div>
              <div className="text-right text-sm">
                <p className="text-muted-foreground">PO No</p>
                <p className="font-mono font-medium">{po.po_no}</p>
                {po.expected_date && (
                  <>
                    <p className="mt-2 text-muted-foreground">Expected</p>
                    <p className="font-medium">{formatDisplayDate(po.expected_date)}</p>
                  </>
                )}
              </div>
            </div>

            {po.deliver_to && (
              <p className="text-sm">
                <span className="text-muted-foreground">Deliver to: </span>
                <span className="whitespace-pre-line">{po.deliver_to}</span>
              </p>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">S/N</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-24">Qty</TableHead>
                  <TableHead className="w-28 text-right">Unit ₦</TableHead>
                  <TableHead className="w-32 text-right">Amount ₦</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {po.items.map((it, i) => (
                  <TableRow key={it.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>{it.description}</TableCell>
                    <TableCell>
                      {formatAmount(it.qty).replace(/\.00$/, "")} {it.unit}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{formatAmount(it.unit_price)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{formatAmount(it.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end border-t border-border pt-4">
              <dl className="w-full max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-mono tabular-nums">{formatNaira(po.subtotal)}</dd>
                </div>
                {po.vat_total > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">VAT ({po.vat_rate}%)</dt>
                    <dd className="font-mono tabular-nums">{formatNaira(po.vat_total)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="font-mono tabular-nums">{formatNaira(po.total)}</dd>
                </div>
                {po.amount_in_words && (
                  <p className="pt-1 text-right text-xs text-muted-foreground">{po.amount_in_words}</p>
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
              <StatusSelect action={setPurchaseOrderStatus} id={po.id} current={po.status} options={STATUS_OPTIONS} />
              <dl className="space-y-2 text-sm">
                {(po.vehicle_id || po.vehicle_ref) && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Vehicle / job</dt>
                    <dd className="text-right">
                      <VehicleLink id={po.vehicle_id} label={po.vehicle_ref} />
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{formatDisplayDate(po.created_at)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {po.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{po.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
