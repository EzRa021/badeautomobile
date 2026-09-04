"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { AlertCircle, UserPlus } from "lucide-react";
import { createStaffUser } from "@/lib/actions/users";
import type { ActionState } from "@/lib/validation/shared";
import { FormField } from "@/components/app/form-field";
import { SubmitButton } from "@/components/app/submit-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function StaffForm({ disabled }: { disabled?: boolean }) {
  const [state, formAction] = useActionState<ActionState, FormData>(createStaffUser, {});
  const fe = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success("Staff account created");
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add staff</CardTitle>
        <CardDescription>
          Create an account for a team member. They sign in with this email and password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="grid gap-5 sm:grid-cols-3">
          <FormField label="Full name" htmlFor="full_name" error={fe.full_name?.[0]}>
            <Input id="full_name" name="full_name" placeholder="Jane Doe" disabled={disabled} />
          </FormField>
          <FormField label="Email" htmlFor="email" required error={fe.email?.[0]}>
            <Input id="email" name="email" type="email" placeholder="jane@badeautomobile.com" required disabled={disabled} />
          </FormField>
          <FormField label="Temporary password" htmlFor="password" required error={fe.password?.[0]} hint="At least 8 characters">
            <Input id="password" name="password" type="text" placeholder="••••••••" required disabled={disabled} />
          </FormField>

          {state.error && (
            <div role="alert" className="sm:col-span-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {state.error}
            </div>
          )}

          <div className="sm:col-span-3 flex justify-end">
            <SubmitButton disabled={disabled} pendingText="Creating…">
              <UserPlus /> Create account
            </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
