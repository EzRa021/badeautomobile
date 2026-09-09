"use client";

import { useOptimistic, useTransition } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { StatusBadge } from "@/components/app/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Change a document's status straight from the table. Optimistic so the row
 * updates immediately; the server action revalidates the list behind it.
 */
export function StatusToggle({
  action,
  id,
  current,
  options,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  current: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  // Shows the new badge immediately, then falls back to whatever the
  // revalidated list reports — including on failure.
  const [value, setOptimistic] = useOptimistic(current);

  function change(next: string) {
    if (next === value) return;
    const formData = new FormData();
    formData.set("id", id);
    formData.set("status", next);
    startTransition(async () => {
      setOptimistic(next);
      await action(formData);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={pending}
          aria-label={`Status: ${value}. Change status`}
          className={cn(
            "inline-flex items-center gap-1 rounded-full transition-opacity",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            pending ? "opacity-60" : "hover:opacity-80",
            className,
          )}
        >
          <StatusBadge status={value} />
          {pending ? (
            <Loader2 className="size-3 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3 text-muted-foreground" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[9rem]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => change(option.value)}
            className={cn("gap-2", option.value === value && "font-medium")}
          >
            <StatusBadge status={option.value} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
