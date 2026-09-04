"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import type { InvoiceWithItems } from "@/lib/types";
import type { ActionState } from "@/lib/validation/shared";
import { saveInvoice } from "@/lib/actions/invoices";
import { useFormDraft } from "@/lib/hooks/use-form-draft";
import { toNumber, round2 } from "@/lib/utils/money";
import { amountToWords } from "@/lib/utils/number-to-words";
import { LineItemsEditor, emptyRow, type Row, type ColumnDef } from "@/components/app/line-items-editor";
import { PartyPicker, type PartyOption, type PartyValue } from "@/components/app/party-picker";
import { ImportPoButton } from "@/components/app/import-po-button";
import type { ParsedPo } from "@/lib/pdf/parse-nestle-po";
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
  { key: "item_code", label: "Code", width: "7rem", placeholder: "90072381" },
  { key: "description", label: "Description", grow: true, placeholder: "Service or part" },
  { key: "qty", label: "Qty", kind: "number", width: "4.5rem" },
  { key: "unit_price", label: "Unit price ₦", kind: "money", align: "right", width: "8rem" },
  { key: "amount", label: "Amount ₦", kind: "money", align: "right", width: "9rem", computed: true },
];

const STATUSES = ["unpaid", "partial", "paid", "cancelled"];

function deriveRow(row: Row): Row {
  return { ...row, amount: String(round2(toNumber(row.qty || "1") * toNumber(row.unit_price))) };
}

function seedRows(record?: InvoiceWithItems): Row[] {
  if (record?.items?.length) {
    return record.items.map((it) => ({
      item_code: it.item_code ?? "",
      description: it.description,
      qty: String(it.qty ?? ""),
      unit_price: String(it.unit_price ?? ""),
      amount: String(it.net_amount ?? ""),
    }));
  }
  return [emptyRow(COLUMNS)];
}

export function InvoiceForm({
  record,
  customers,
  defaultNo,
  defaultDate,
  defaultVatRate,
  fromQuotationId,
  seed,
}: {
  record?: InvoiceWithItems;
  customers: PartyOption[];
  defaultNo: string;
  defaultDate: string;
  defaultVatRate: number;
  fromQuotationId?: string;
  seed?: {
    customer_id?: string | null;
    customer_name?: string;
    customer_address?: string | null;
    po_no?: string | null;
    rows?: Row[];
  };
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveInvoice, {});
  const [rows, setRows] = useState<Row[]>(() => seed?.rows ?? seedRows(record));
  const [vatRate, setVatRate] = useState<string>(
    String(record?.vat_rate ?? defaultVatRate ?? 7.5),
  );
  const [party, setParty] = useState<PartyValue>({
    id: record?.customer_id ?? seed?.customer_id ?? "",
    name: record?.customer_name ?? seed?.customer_name ?? "",
    address: record?.customer_address ?? seed?.customer_address ?? "",
  });
  const fe = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  const draft = useFormDraft({
    storageKey: `bade:draft:v1:invoice:${record?.id ?? "new"}`,
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
      setParty({ id: d.customer_id ?? "", name: d.customer_name ?? "", address: d.customer_address ?? "" });
    },
    deps: [rows, party, vatRate],
  });

  useEffect(() => {
    if (state.error || state.fieldErrors) draft.save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function applyImport(p: ParsedPo) {
    if (Array.isArray(p.items) && p.items.length) {
      setRows(
        p.items.map((it) =>
          deriveRow({
            item_code: it.item_code ?? "",
            description: it.description ?? "",
            qty: String(it.qty ?? 1),
            unit_price: String(it.unit_price ?? 0),
            amount: "",
          }),
        ),
      );
    }
    setParty((prev) => ({
      id: "",
      name: p.customer_name ?? prev.name,
      address: p.customer_address ?? prev.address,
    }));
    if (p.vat_rate) setVatRate(String(p.vat_rate));
    const el = formRef.current?.elements.namedItem("po_no") as HTMLInputElement | null;
    if (el && p.po_no) el.value = p.po_no;
  }

  const cleanRows = useMemo(() => rows.filter((r) => r.description.trim()), [rows]);
  const subtotal = useMemo(
    () => round2(cleanRows.reduce((s, r) => s + toNumber(r.qty || "1") * toNumber(r.unit_price), 0)),
    [cleanRows],
  );
  const vat = useMemo(() => round2((subtotal * toNumber(vatRate)) / 100), [subtotal, vatRate]);
  const total = useMemo(() => round2(subtotal + vat), [subtotal, vat]);
  const words = useMemo(() => amountToWords(total), [total]);

  return (
    <form ref={formRef} action={formAction} onSubmit={() => draft.clear()} className="space-y-5">
      {record && <input type="hidden" name="id" value={record.id} />}
      {(fromQuotationId || record?.quotation_id) && (
        <input type="hidden" name="quotation_id" value={record?.quotation_id ?? fromQuotationId ?? ""} />
      )}
      <input type="hidden" name="items" value={JSON.stringify(cleanRows.map(({ amount: _a, ...r }) => r))} />

      <Card className="border-primary/30 bg-brand-050/50">
        <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Import from a Nestlé purchase order</p>
            <p className="text-sm text-muted-foreground">
              Upload the PO PDF to auto-fill the customer, PO number and all line items.
            </p>
          </div>
          <ImportPoButton onImport={applyImport} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <FormField label="Invoice No" htmlFor="invoice_no" required error={fe.invoice_no?.[0]}>
            <Input id="invoice_no" name="invoice_no" defaultValue={record?.invoice_no ?? defaultNo} className="font-mono" />
          </FormField>
          <FormField label="Date" htmlFor="invoice_date" required error={fe.invoice_date?.[0]}>
            <Input id="invoice_date" name="invoice_date" type="date" defaultValue={record?.invoice_date ?? defaultDate} />
          </FormField>
          <FormField label="Status" htmlFor="status">
            <NativeSelect id="status" name="status" defaultValue={record?.status ?? "unpaid"}>
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="Customer's Number" htmlFor="customer_number" hint="Optional account/material no.">
            <Input id="customer_number" name="customer_number" defaultValue={record?.customer_number ?? ""} />
          </FormField>
          <FormField label="P.O No" htmlFor="po_no" hint="Customer's purchase-order ref">
            <Input id="po_no" name="po_no" defaultValue={record?.po_no ?? seed?.po_no ?? ""} className="font-mono" />
          </FormField>
          <FormField label="VAT rate (%)" htmlFor="vat_rate">
            <Input
              id="vat_rate"
              name="vat_rate"
              inputMode="decimal"
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <PartyPicker
            label="Customer"
            idName="customer_id"
            nameName="customer_name"
            addressName="customer_address"
            options={customers}
            value={party}
            onChange={setParty}
            errors={{ name: fe.customer_name?.[0] }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LineItemsEditor columns={COLUMNS} rows={rows} onChange={setRows} deriveRow={deriveRow} />
          {fe.items && <p className="text-xs font-medium text-destructive">{fe.items[0]}</p>}
          <DocumentTotals
            rows={[
              { label: "Subtotal", value: subtotal },
              { label: `VAT (${toNumber(vatRate)}%)`, value: vat },
              { label: "Total incl. tax", value: total, bold: true },
            ]}
            words={words}
          />
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
          <Link href={record ? `/invoices/${record.id}` : "/invoices"}>Cancel</Link>
        </Button>
        <SubmitButton className="flex-1 sm:flex-none">
          {record ? "Save changes" : "Create invoice"}
        </SubmitButton>
      </FormActionBar>
    </form>
  );
}
