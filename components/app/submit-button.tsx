"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function SubmitButton({
  children,
  pendingText,
  disabled,
  ...props
}: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" /> {pendingText ?? "Saving…"}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
