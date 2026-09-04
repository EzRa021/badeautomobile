"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import type { PurchaseOrderWithItems } from "@/lib/types";
import type { ActionState } from "@/lib/validation/shared";
import { savePurchaseOrder } from "@/lib/actions/purchase-orders";
import { useFormDraft } from "@/lib/hooks/use-form-draft";
import { toNumber, round2 } from "@/lib/utils/money";
import { amountToWords } from "@/lib/utils/number-to-words";
import { LineItemsEditor, emptyRow, type Row, type ColumnDef } from "@/components/app/line-items-editor";
import { PartyPicker, type PartyOption, type PartyValue } from "@/components/app/party-picker";
import { DocumentTotals } from "@/components/app/document-totals";
import { FormField } from "@/components/app/form-field";
import { FormActionBar } from "@/components/app/form-action-bar";
import { SubmitButton } from "@/components/app/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLUMNS: ColumnDef[] = [
  { key: "description", label: "Description", grow: true, placeholder: "Part or service" },
  { key: "qty", label: "Qty", kind: "number", width: "5rem" },
  { key: "unit", label: "Unit", width: "5rem", placeholder: "Pcs" },
  { key: "unit_price", label: "Unit price ₦", kind: "money", align: "right", width: "8rem" },
  { key: "amount", label: "Amount ₦", kind: "money", align: "right", width: "9rem", computed: true },
];

const STATUSES = ["draft", "sent", "received", "cancelled"];

function deriveRow(row: Row): Row {
  return { ...row, amount: String(round2(toNumber(row.qty || "1") * toNumber(row.unit_price))) };
}

function seedRows(record?: PurchaseOrderWithItems): Row[] {
  if (record?.items?.length) {
    return record.items.map((it) => ({
      description: it.description,
      qty: String(it.qty ?? ""),
      unit: it.unit ?? "",
      unit_price: String(it.unit_price ?? ""),
      amount: String(it.amount ?? ""),
    }));
  }
  return [emptyRow(COLUMNS)];
}

export function PurchaseOrderForm({
  record,
  suppliers,
  defaultNo,
  defaultDate,
}: {
  record?: PurchaseOrderWithItems;
  suppliers: PartyOption[];
  defaultNo: string;
  defaultDate: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(savePurchaseOrder, {});
  const [rows, setRows] = useState<Row[]>(() => seedRows(record));
  const [vatRate, setVatRate] = useState<string>(String(record?.vat_rate ?? 0));
  const [party, setParty] = useState<PartyValue>({
    id: record?.supplier_id ?? "",
    name: record?.supplier_name ?? "",
    address: record?.supplier_address ?? "",
  });
  const fe = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  const draft = useFormDraft({
    storageKey: `bade:draft:v1:purchase_order:${record?.id ?? "new"}`,
    formRef,
    restore: (d) => {
      if (d.items) {
        try {
          setRows((JSON.parse(d.items) as Row[]).map(deriveRow));
        } catch {
          /* ignore */
        }
      }
      if (d.vat_rate) setVatRate(d.vat_rate);
      setParty({ id: d.supplier_id ?? "", name: d.supplier_name ?? "", address: d.supplier_address ?? "" });
    },
    deps: [rows, party, vatRate],
  });

  useEffect(() => {
    if (state.error || state.fieldErrors) draft.save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const cleanRows = useMemo(() => rows.filter((r) => r.description.trim()), [rows]);
  const subtotal = useMemo(
    () => round2(cleanRows.reduce((s, r) => s + toNumber(r.qty || "1") * toNumber(r.unit_price), 0)),
    [cleanRows],
  );
  const vat = useMemo(() => round2((subtotal * toNumber(vatRate)) / 100), [subtotal, vatRate]);
  const total = useMemo(() => round2(subtotal + vat), [subtotal, vat]);
  const words = useMemo(() => amountToWords(total), [total]);

  const totalsRows = [
    { label: "Subtotal", value: subtotal },
    ...(toNumber(vatRate) > 0 ? [{ label: `VAT (${toNumber(vatRate)}%)`, value: vat }] : []),
    { label: "Total", value: total, bold: true },
  ];

  return (
    <form ref={formRef} action={formAction} onSubmit={() => draft.clear()} className="space-y-5">
      {record && <input type="hidden" name="id" value={record.id} />}
      <input type="hidden" name="items" value={JSON.stringify(cleanRows)} />

      <Card>
        <CardHeader>
          <CardTitle>Purchase order details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <FormField label="PO No" htmlFor="po_no" required error={fe.po_no?.[0]}>
            <Input id="po_no" name="po_no" defaultValue={record?.po_no ?? defaultNo} className="font-mono" />
          </FormField>
          <FormField label="Date" htmlFor="po_date" required error={fe.po_date?.[0]}>
            <Input id="po_date" name="po_date" type="date" defaultValue={record?.po_date ?? defaultDate} />
          </FormField>
          <FormField label="Status" htmlFor="status">
            <NativeSelect id="status" name="status" defaultValue={record?.status ?? "draft"}>
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="Expected date" htmlFor="expected_date" hint="Optional">
            <Input id="expected_date" name="expected_date" type="date" defaultValue={record?.expected_date ?? ""} />
          </FormField>
          <FormField label="VAT rate (%)" htmlFor="vat_rate" hint="0 for none">
            <Input id="vat_rate" name="vat_rate" inputMode="decimal" value={vatRate} onChange={(e) => setVatRate(e.target.value)} />
          </FormField>
          <FormField label="Vehicle / job ref" htmlFor="vehicle_ref" hint="Optional">
            <Input id="vehicle_ref" name="vehicle_ref" defaultValue={record?.vehicle_ref ?? ""} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supplier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <PartyPicker
            label="Supplier"
            idName="supplier_id"
            nameName="supplier_name"
            addressName="supplier_address"
            options={suppliers}
            value={party}
            onChange={setParty}
            errors={{ name: fe.supplier_name?.[0] }}
          />
          <FormField label="Deliver to" htmlFor="deliver_to" hint="Optional delivery address / note">
            <Textarea id="deliver_to" name="deliver_to" defaultValue={record?.deliver_to ?? ""} rows={2} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LineItemsEditor columns={COLUMNS} rows={rows} onChange={setRows} deriveRow={deriveRow} />
          {fe.items && <p className="text-xs font-medium text-destructive">{fe.items[0]}</p>}
          <DocumentTotals rows={totalsRows} words={words} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea name="notes" defaultValue={record?.notes ?? ""} rows={2} placeholder="Internal notes (not printed)" />
        </CardContent>
      </Card>

      {state.error && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </div>
      )}

      <FormActionBar>
        <Button asChild variant="outline" className="flex-1 sm:flex-none">
          <Link href={record ? `/purchase-orders/${record.id}` : "/purchase-orders"}>Cancel</Link>
        </Button>
        <SubmitButton className="flex-1 sm:flex-none">
          {record ? "Save changes" : "Create purchase order"}
        </SubmitButton>
      </FormActionBar>
    </form>
  );
}
