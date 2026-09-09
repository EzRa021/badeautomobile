"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Inclusive `from`/`to` date-range filter held in the URL, so the server
 * component re-queries and the filtered view can be shared or bookmarked.
 */
export function DateRangeFilter({
  fromParam = "from",
  toParam = "to",
  className,
}: {
  fromParam?: string;
  toParam?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const from = searchParams.get(fromParam) ?? "";
  const to = searchParams.get(toParam) ?? "";

  function apply(next: { from?: string; to?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [param, value] of [
      [fromParam, next.from ?? from],
      [toParam, next.to ?? to],
    ] as const) {
      if (value) params.set(param, value);
      else params.delete(param);
    }
    params.delete("page"); // a narrower range invalidates the current page
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  function clear() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(fromParam);
    params.delete(toParam);
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  return (
    <div className={className} data-pending={pending ? "" : undefined}>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="range-from" className="text-xs text-muted-foreground">
            From
          </Label>
          <Input
            id="range-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => apply({ from: e.target.value })}
            className="w-[9.5rem]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="range-to" className="text-xs text-muted-foreground">
            To
          </Label>
          <Input
            id="range-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => apply({ to: e.target.value })}
            className="w-[9.5rem]"
          />
        </div>
        {(from || to) && (
          <Button type="button" variant="ghost" size="sm" onClick={clear} className="text-muted-foreground">
            <X /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}
