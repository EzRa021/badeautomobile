"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import type { Vehicle, Customer } from "@/lib/types";
import type { ActionState } from "@/lib/validation/shared";
import { saveVehicle } from "@/lib/actions/vehicles";
import { useFormDraft } from "@/lib/hooks/use-form-draft";
import { FormField } from "@/components/app/form-field";
import { FormActionBar } from "@/components/app/form-action-bar";
import { SubmitButton } from "@/components/app/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function VehicleForm({
  record,
  customers,
}: {
  record?: Vehicle;
  customers: Pick<Customer, "id" | "name">[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveVehicle, {});
  const fe = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  const draft = useFormDraft({
    storageKey: `bade:draft:v1:vehicle:${record?.id ?? "new"}`,
    formRef,
  });

  useEffect(() => {
    if (state.error || state.fieldErrors) draft.save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} onSubmit={() => draft.clear()}>
      {record && <input type="hidden" name="id" value={record.id} />}
      <Card>
        <CardContent className="grid gap-5 pt-5 sm:grid-cols-2">
          <FormField label="Description" htmlFor="description" required error={fe.description?.[0]} className="sm:col-span-2" hint="e.g. Toyota Prado AGL 58EW">
            <Input id="description" name="description" defaultValue={record?.description ?? ""} required />
          </FormField>

          <FormField label="Registration / plate" htmlFor="reg_no" error={fe.reg_no?.[0]}>
            <Input id="reg_no" name="reg_no" defaultValue={record?.reg_no ?? ""} placeholder="AGL 58EW" />
          </FormField>

          <FormField label="Owner (customer)" htmlFor="customer_id" error={fe.customer_id?.[0]}>
            <NativeSelect id="customer_id" name="customer_id" defaultValue={record?.customer_id ?? ""}>
              <option value="">— None —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>

          <FormField label="Make" htmlFor="make" error={fe.make?.[0]}>
            <Input id="make" name="make" defaultValue={record?.make ?? ""} placeholder="Toyota" />
          </FormField>

          <FormField label="Model" htmlFor="model" error={fe.model?.[0]}>
            <Input id="model" name="model" defaultValue={record?.model ?? ""} placeholder="Prado" />
          </FormField>

          <FormField label="Notes" htmlFor="notes" error={fe.notes?.[0]} className="sm:col-span-2">
            <Textarea id="notes" name="notes" defaultValue={record?.notes ?? ""} rows={2} />
          </FormField>
        </CardContent>
      </Card>

      {state.error && (
        <div role="alert" className="mt-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </div>
      )}

      <FormActionBar>
        <Button asChild variant="outline" className="flex-1 sm:flex-none">
          <Link href="/vehicles">Cancel</Link>
        </Button>
        <SubmitButton className="flex-1 sm:flex-none">
          {record ? "Save changes" : "Create vehicle"}
        </SubmitButton>
      </FormActionBar>
    </form>
  );
}
