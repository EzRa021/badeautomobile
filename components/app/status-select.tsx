"use client";

import { useRef, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { NativeSelect } from "@/components/ui/native-select";
import { StatusBadge } from "@/components/app/status-badge";

/** Inline status changer: posts the action on change and reflects the current badge. */
export function StatusSelect({
  action,
  id,
  current,
  options,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  current: string;
  options: { value: string; label: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form ref={formRef} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <StatusBadge status={current} />
      <div className="relative">
        <NativeSelect
          name="status"
          defaultValue={current}
          aria-label="Change status"
          className="h-8 w-[8.5rem] text-xs"
          onChange={(e) => {
            const fd = new FormData(formRef.current!);
            fd.set("status", e.target.value);
            startTransition(() => action(fd));
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
    </form>
  );
}
