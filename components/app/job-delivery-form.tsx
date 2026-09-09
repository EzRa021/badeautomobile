"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import type { JobDelivery } from "@/lib/types";
import type { ActionState } from "@/lib/validation/shared";
import { saveJobDelivery } from "@/lib/actions/job-deliveries";
import { useFormDraft } from "@/lib/hooks/use-form-draft";
import { toDateTimeInputValue } from "@/lib/utils/dates";
import { PartyPicker, type PartyOption, type PartyValue } from "@/components/app/party-picker";
import { VehiclePicker, type VehicleOption, type VehicleValue } from "@/components/app/vehicle-picker";
import { FormField } from "@/components/app/form-field";
import { FormActionBar } from "@/components/app/form-action-bar";
import { SubmitButton } from "@/components/app/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function JobDeliveryForm({
  record,
  customers,
  vehicles,
  defaultNo,
  defaultDate,
  seed,
}: {
  record?: JobDelivery;
  customers: PartyOption[];
  vehicles: VehicleOption[];
  defaultNo: string;
  defaultDate: string;
  seed?: {
    customer_id?: string | null;
    customer_name?: string;
    customer_address?: string | null;
    vehicle_id?: string | null;
    vehicle?: string | null;
    work_done?: string | null;
  };
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveJobDelivery, {});
  const [vehicle, setVehicle] = useState<VehicleValue>({
    id: record?.vehicle_id ?? seed?.vehicle_id ?? "",
    label: record?.vehicle ?? seed?.vehicle ?? "",
    reg_no: "",
  });
  const [party, setParty] = useState<PartyValue>({
    id: record?.customer_id ?? seed?.customer_id ?? "",
    name: record?.customer_name ?? seed?.customer_name ?? "",
    address: record?.customer_address ?? seed?.customer_address ?? "",
  });
  const fe = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  const draft = useFormDraft({
    storageKey: `bade:draft:v1:job_delivery:${record?.id ?? "new"}`,
    formRef,
    restore: (d) => {
      setParty({ id: d.customer_id ?? "", name: d.customer_name ?? "", address: d.customer_address ?? "" });
      setVehicle({
        id: d.vehicle_id ?? "",
        label: d.vehicle ?? "",
        reg_no: d.vehicle_reg_no ?? "",
      });
    },
    deps: [party, vehicle],
  });

  useEffect(() => {
    if (state.error || state.fieldErrors) draft.save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} onSubmit={() => draft.clear()} className="space-y-5">
      {record && <input type="hidden" name="id" value={record.id} />}

      <Card>
        <CardHeader>
          <CardTitle>Report details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <FormField label="Document No" htmlFor="jd_no" required error={fe.jd_no?.[0]} hint="Shown as 'Invoice No'">
            <Input id="jd_no" name="jd_no" defaultValue={record?.jd_no ?? defaultNo} className="font-mono" />
          </FormField>
          <FormField label="Date" htmlFor="delivery_date" required error={fe.delivery_date?.[0]}>
            <Input id="delivery_date" name="delivery_date" type="date" defaultValue={record?.delivery_date ?? defaultDate} />
          </FormField>
          <FormField label="Status" htmlFor="status">
            <NativeSelect id="status" name="status" defaultValue={record?.status ?? "draft"}>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </NativeSelect>
          </FormField>
          <FormField label="GRN" htmlFor="grn_no" hint="Goods received note ref" className="sm:col-span-1">
            <Input id="grn_no" name="grn_no" defaultValue={record?.grn_no ?? ""} className="font-mono" />
          </FormField>
          <FormField label="P.O No" htmlFor="po_no" hint="Customer's PO ref" className="sm:col-span-1">
            <Input id="po_no" name="po_no" defaultValue={record?.po_no ?? ""} className="font-mono" />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer & vehicle</CardTitle>
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
          <VehiclePicker
            options={vehicles}
            value={vehicle}
            onChange={setVehicle}
            labelName="vehicle"
            labelHint="Printed on the report"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work carried out</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <FormField label="Work description" htmlFor="work_done" hint="Printed as: '<work> has been carried out on <vehicle>'">
            <Input id="work_done" name="work_done" defaultValue={record?.work_done ?? seed?.work_done ?? ""} placeholder="Body Work & Painting" />
          </FormField>
          <FormField label="Items changed" htmlFor="items_changed">
            <Textarea id="items_changed" name="items_changed" defaultValue={record?.items_changed ?? ""} rows={2} placeholder="Engine Oil, Oil Filter, Brake Pads…" />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Note" htmlFor="note">
              <Textarea id="note" name="note" defaultValue={record?.note ?? ""} rows={2} />
            </FormField>
            <FormField label="Next service" htmlFor="next_service" hint="e.g. mileage 178724">
              <Input id="next_service" name="next_service" defaultValue={record?.next_service ?? ""} />
            </FormField>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Accessories found on vehicle" htmlFor="accessories_found">
              <Textarea id="accessories_found" name="accessories_found" defaultValue={record?.accessories_found ?? ""} rows={2} placeholder="Jack, Fire Extinguisher, Wheel Spanner…" />
            </FormField>
            <FormField label="Accessories returned with vehicle" htmlFor="accessories_returned">
              <Textarea id="accessories_returned" name="accessories_returned" defaultValue={record?.accessories_returned ?? ""} rows={2} />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Handover</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <FormField label="Date & time in" htmlFor="date_in">
            <Input id="date_in" name="date_in" type="datetime-local" defaultValue={toDateTimeInputValue(record?.date_in)} />
          </FormField>
          <FormField label="Date & time out" htmlFor="date_out">
            <Input id="date_out" name="date_out" type="datetime-local" defaultValue={toDateTimeInputValue(record?.date_out)} />
          </FormField>
          <FormField label="Driver's name & signature" htmlFor="driver_name" className="sm:col-span-2">
            <Input id="driver_name" name="driver_name" defaultValue={record?.driver_name ?? ""} placeholder="Mr. Francis (In), Mr. Asisi (Out)" />
          </FormField>
          <FormField label="Vehicle coordinator" htmlFor="coordinator_sign">
            <Input id="coordinator_sign" name="coordinator_sign" defaultValue={record?.coordinator_sign ?? ""} />
          </FormField>
          <FormField label="Engineering inspector" htmlFor="inspector_sign">
            <Input id="inspector_sign" name="inspector_sign" defaultValue={record?.inspector_sign ?? ""} />
          </FormField>
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
          <Link href={record ? `/job-deliveries/${record.id}` : "/job-deliveries"}>Cancel</Link>
        </Button>
        <SubmitButton className="flex-1 sm:flex-none">
          {record ? "Save changes" : "Create job delivery"}
        </SubmitButton>
      </FormActionBar>
    </form>
  );
}
