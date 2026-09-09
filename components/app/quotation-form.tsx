"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import type { QuotationWithItems } from "@/lib/types";
import type { FairmarkitImport } from "@/lib/fairmarkit/parse";
import type { FairmarkitSource } from "@/lib/fairmarkit/schema";
import type { ActionState } from "@/lib/validation/shared";
import { saveQuotation } from "@/lib/actions/quotations";
import { useFormDraft } from "@/lib/hooks/use-form-draft";
import { toNumber, round2 } from "@/lib/utils/money";
import { amountToWords } from "@/lib/utils/number-to-words";
import { extractVehicleFromTitle } from "@/lib/utils/vehicle";
import { LineItemsEditor, emptyRow, type Row, type ColumnDef } from "@/components/app/line-items-editor";
import { PartyPicker, type PartyOption, type PartyValue } from "@/components/app/party-picker";
import { VehiclePicker, type VehicleOption, type VehicleValue } from "@/components/app/vehicle-picker";
import { DocumentTotals } from "@/components/app/document-totals";
import { FairmarkitPanel } from "@/components/app/fairmarkit-panel";
import { ImportFairmarkitButton } from "@/components/app/import-fairmarkit-button";
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
  { key: "rate", label: "Rate ₦", kind: "money", align: "right", width: "8rem" },
  { key: "amount", label: "Amount ₦", kind: "money", align: "right", width: "9rem" },
];

const STATUSES = ["draft", "sent", "accepted", "rejected", "invoiced"];

function deriveRow(row: Row): Row {
  const rate = row.rate.trim();
  if (rate !== "" && Number.isFinite(toNumber(rate))) {
    return { ...row, amount: String(round2(toNumber(row.qty || "1") * toNumber(rate))) };
  }
  return row;
}

function seedRows(record?: QuotationWithItems): Row[] {
  if (record?.items?.length) {
    return record.items.map((it) => ({
      description: it.description,
      qty: String(it.qty ?? ""),
      unit: it.unit ?? "",
      rate: it.rate != null ? String(it.rate) : "",
      amount: String(it.amount ?? ""),
    }));
  }
  return [emptyRow(COLUMNS)];
}

export function QuotationForm({
  record,
  customers,
  vehicles,
  defaultRef,
  defaultDate,
  defaultVehicle,
}: {
  record?: QuotationWithItems;
  customers: PartyOption[];
  vehicles: VehicleOption[];
  defaultRef: string;
  defaultDate: string;
  /** Pre-selected vehicle, e.g. when starting from a vehicle's history page. */
  defaultVehicle?: VehicleValue;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveQuotation, {});
  const [rows, setRows] = useState<Row[]>(() => seedRows(record));
  const [party, setParty] = useState<PartyValue>({
    id: record?.customer_id ?? "",
    name: record?.customer_name ?? "",
    address: record?.customer_address ?? "",
  });
  const [jobTitle, setJobTitle] = useState(record?.job_title ?? "");
  const [vehicle, setVehicle] = useState<VehicleValue>({
    id: record?.vehicle_id ?? defaultVehicle?.id ?? "",
    label: record?.vehicle_label ?? defaultVehicle?.label ?? "",
    reg_no: defaultVehicle?.reg_no ?? "",
  });
  const [fairmarkit, setFairmarkit] = useState<FairmarkitSource | null>(
    record?.fairmarkit ?? null,
  );
  const fe = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  /**
   * A Fairmarkit bid sheet carries the item names, quantities and units but no
   * prices — those are what this form is for. Imported details only fill fields
   * that are still empty, so re-importing never overwrites typed-in work.
   */
  function handleFairmarkitImport(result: FairmarkitImport) {
    setFairmarkit(result.source);
    setRows(
      result.items.length
        ? result.items.map((item) => ({
            description: item.description,
            qty: String(item.qty),
            unit: item.unit,
            rate: "",
            amount: "",
          }))
        : [emptyRow(COLUMNS)],
    );

    const buyer = result.customer_name;
    if (buyer) {
      setParty((current) => {
        if (current.name.trim()) return current;
        const onFile = customers.find(
          (c) => c.name.trim().toLowerCase() === buyer.trim().toLowerCase(),
        );
        return {
          id: onFile?.id ?? "",
          name: onFile?.name ?? buyer,
          address: onFile?.address ?? result.source.meta.shipping_address ?? "",
        };
      });
    }
    if (result.job_title) setJobTitle((current) => current.trim() || result.job_title!);

    // RFQ titles name the vehicle and its plate, e.g.
    // "RFQ For Repair Of Toyota Prado LSD 656 HD @Flowergate Factory".
    const guess = extractVehicleFromTitle(result.job_title);
    if (guess.label || guess.reg_no) {
      setVehicle((current) =>
        current.id || current.label.trim() || current.reg_no.trim()
          ? current
          : { id: "", label: guess.label ?? "", reg_no: guess.reg_no ?? "" },
      );
    }
  }

  const draft = useFormDraft({
    storageKey: `bade:draft:v1:quotation:${record?.id ?? "new"}`,
    formRef,
    restore: (d) => {
      if (d.items) {
        try {
          setRows(JSON.parse(d.items) as Row[]);
        } catch {
          /* ignore */
        }
      }
      setParty({ id: d.customer_id ?? "", name: d.customer_name ?? "", address: d.customer_address ?? "" });
      setJobTitle(d.job_title ?? "");
      setVehicle({
        id: d.vehicle_id ?? "",
        label: d.vehicle_label ?? "",
        reg_no: d.vehicle_reg_no ?? "",
      });
      if (d.fairmarkit) {
        try {
          setFairmarkit(JSON.parse(d.fairmarkit) as FairmarkitSource);
        } catch {
          /* ignore a corrupt draft */
        }
      }
    },
    deps: [rows, party, jobTitle, vehicle, fairmarkit],
  });

  // Keep the draft after a failed submit so a refresh doesn't lose the work.
  useEffect(() => {
    if (state.error || state.fieldErrors) draft.save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const cleanRows = useMemo(() => rows.filter((r) => r.description.trim()), [rows]);
  const subtotal = useMemo(() => round2(cleanRows.reduce((s, r) => s + toNumber(r.amount), 0)), [cleanRows]);
  const words = useMemo(() => amountToWords(subtotal, { uppercase: true }), [subtotal]);

  return (
    <form ref={formRef} action={formAction} onSubmit={() => draft.clear()} className="space-y-5">
      {record && <input type="hidden" name="id" value={record.id} />}
      <input type="hidden" name="items" value={JSON.stringify(cleanRows)} />
      <input type="hidden" name="fairmarkit" value={fairmarkit ? JSON.stringify(fairmarkit) : ""} />

      <Card>
        <CardHeader>
          <CardTitle>Quotation details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <FormField label="Our Ref" htmlFor="ref_no" required error={fe.ref_no?.[0]}>
            <Input id="ref_no" name="ref_no" defaultValue={record?.ref_no ?? defaultRef} className="font-mono" />
          </FormField>
          <FormField label="Date" htmlFor="quote_date" required error={fe.quote_date?.[0]}>
            <Input id="quote_date" name="quote_date" type="date" defaultValue={record?.quote_date ?? defaultDate} />
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
        </CardContent>
      </Card>

      {fairmarkit && (
        <FairmarkitPanel
          source={fairmarkit}
          onChange={setFairmarkit}
          onRemove={() => setFairmarkit(null)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Customer &amp; vehicle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
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
          <VehiclePicker options={vehicles} value={vehicle} onChange={setVehicle} />
          <div className="grid gap-5">
            <FormField label="Job title / heading" htmlFor="job_title" hint="Banner above the items">
              <Input
                id="job_title"
                name="job_title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="CARRY OUT REPAIRS ON …"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>Items</CardTitle>
          <ImportFairmarkitButton onImport={handleFairmarkitImport} className="shrink-0" />
        </CardHeader>
        <CardContent className="space-y-4">
          <LineItemsEditor columns={COLUMNS} rows={rows} onChange={setRows} deriveRow={deriveRow} />
          {fe.items && <p className="text-xs font-medium text-destructive">{fe.items[0]}</p>}
          <DocumentTotals rows={[{ label: "Total", value: subtotal, bold: true }]} words={words} />
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
          <Link href={record ? `/quotations/${record.id}` : "/quotations"}>Cancel</Link>
        </Button>
        <SubmitButton className="flex-1 sm:flex-none">
          {record ? "Save changes" : "Create quotation"}
        </SubmitButton>
      </FormActionBar>
    </form>
  );
}
