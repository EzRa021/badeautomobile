"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import type { Customer, Supplier } from "@/lib/types";
import type { ActionState } from "@/lib/validation/shared";
import { useFormDraft } from "@/lib/hooks/use-form-draft";
import { FormField } from "@/components/app/form-field";
import { FormActionBar } from "@/components/app/form-action-bar";
import { SubmitButton } from "@/components/app/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Contact = Customer | Supplier;

export function ContactForm({
  action,
  record,
  entityLabel,
  cancelHref,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  record?: Contact;
  entityLabel: string; // "Customer" | "Supplier"
  cancelHref: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const fe = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  const draft = useFormDraft({
    storageKey: `bade:draft:v1:contact:${entityLabel}:${record?.id ?? "new"}`,
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
          <FormField label="Name" htmlFor="name" required error={fe.name?.[0]} className="sm:col-span-2">
            <Input id="name" name="name" defaultValue={record?.name ?? ""} placeholder={`${entityLabel} name`} required />
          </FormField>

          <FormField label="Address" htmlFor="address" error={fe.address?.[0]} className="sm:col-span-2">
            <Textarea id="address" name="address" defaultValue={record?.address ?? ""} placeholder="Street, city, state" rows={2} />
          </FormField>

          <FormField label="Phone" htmlFor="phone" error={fe.phone?.[0]}>
            <Input id="phone" name="phone" defaultValue={record?.phone ?? ""} placeholder="080…" />
          </FormField>

          <FormField label="Email" htmlFor="email" error={fe.email?.[0]}>
            <Input id="email" name="email" type="email" defaultValue={record?.email ?? ""} placeholder="name@company.com" />
          </FormField>

          <FormField label="TIN" htmlFor="tin" error={fe.tin?.[0]}>
            <Input id="tin" name="tin" defaultValue={record?.tin ?? ""} placeholder="Tax identification no." />
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
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <SubmitButton className="flex-1 sm:flex-none">
          {record ? "Save changes" : `Create ${entityLabel.toLowerCase()}`}
        </SubmitButton>
      </FormActionBar>
    </form>
  );
}
