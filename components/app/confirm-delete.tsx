"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

function ConfirmButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
      {label}
    </Button>
  );
}

export function ConfirmDelete({
  action,
  id,
  title = "Delete this record?",
  description = "This action cannot be undone.",
  triggerLabel = "Delete",
  triggerVariant = "outline",
  triggerIconOnly = false,
  confirmLabel = "Delete",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  title?: string;
  description?: string;
  triggerLabel?: string;
  triggerVariant?: "outline" | "ghost" | "destructive";
  triggerIconOnly?: boolean;
  confirmLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerIconOnly ? "icon" : "default"}
        onClick={() => setOpen(true)}
        aria-label={triggerIconOnly ? triggerLabel : undefined}
      >
        <Trash2 />
        {!triggerIconOnly && triggerLabel}
      </Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <form action={action}>
            <input type="hidden" name="id" value={id} />
            <ConfirmButton label={confirmLabel} />
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
