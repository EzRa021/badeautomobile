"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import type { CompanySettings } from "@/lib/types";
import type { ActionState } from "@/lib/validation/shared";
import { saveSettings } from "@/lib/actions/settings";
import { FormField } from "@/components/app/form-field";
import { SubmitButton } from "@/components/app/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function SettingsForm({ settings }: { settings: CompanySettings | null }) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveSettings, {});
  const fe = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) toast.success("Company settings saved");
  }, [state.ok]);

  return (
    <form action={formAction} className="space-y-5">
      {settings?.id && <input type="hidden" name="id" value={settings.id} />}

      <Card>
        <CardHeader>
          <CardTitle>Company profile</CardTitle>
          <CardDescription>
            These details drive document numbering and TIN shown on printed documents. The
            letterhead artwork is fixed.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <FormField label="Company name" htmlFor="name" required error={fe.name?.[0]} className="sm:col-span-2">
            <Input id="name" name="name" defaultValue={settings?.name ?? "BADE AUTOMOBILE LTD"} />
          </FormField>
          <FormField label="Address" htmlFor="address" required error={fe.address?.[0]} className="sm:col-span-2">
            <Textarea id="address" name="address" defaultValue={settings?.address ?? ""} rows={2} />
          </FormField>
          <FormField label="Phone" htmlFor="phone" error={fe.phone?.[0]}>
            <Input id="phone" name="phone" defaultValue={settings?.phone ?? ""} />
          </FormField>
          <FormField label="Email" htmlFor="email" error={fe.email?.[0]}>
            <Input id="email" name="email" type="email" defaultValue={settings?.email ?? ""} />
          </FormField>
          <FormField label="TIN" htmlFor="tin" error={fe.tin?.[0]}>
            <Input id="tin" name="tin" defaultValue={settings?.tin ?? ""} className="font-mono" />
          </FormField>
          <FormField label="Default VAT rate (%)" htmlFor="vat_rate" error={fe.vat_rate?.[0]}>
            <Input id="vat_rate" name="vat_rate" inputMode="decimal" defaultValue={String(settings?.vat_rate ?? 7.5)} />
          </FormField>
          <FormField label="Bank details" htmlFor="bank_details" error={fe.bank_details?.[0]} className="sm:col-span-2" hint="Optional — for your reference">
            <Textarea id="bank_details" name="bank_details" defaultValue={settings?.bank_details ?? ""} rows={2} />
          </FormField>
        </CardContent>
      </Card>

      {state.error && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </div>
      )}

      <div className="flex justify-end">
        <SubmitButton>Save settings</SubmitButton>
      </div>
    </form>
  );
}
