"use client";

import { formatDistanceToNow } from "date-fns";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/**
 * Shown at the top of a form when unsaved changes from an earlier visit were put
 * back, so it's clear the fields aren't the saved version — and easy to drop them.
 */
export function DraftNotice({
  restoredAt,
  onDiscard,
  className,
}: {
  restoredAt: number | null;
  onDiscard: () => void;
  className?: string;
}) {
  if (restoredAt == null) return null;
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-2 rounded-md border border-amber/40 bg-amber-050 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="flex items-center gap-2">
        <History className="size-4 shrink-0 text-[var(--status-amber)]" />
        <span>
          Restored your unsaved changes from{" "}
          {formatDistanceToNow(restoredAt, { addSuffix: true })}.
        </span>
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onDiscard} className="self-start sm:self-auto">
        Discard changes
      </Button>
    </div>
  );
}
