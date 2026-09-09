"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SortDirection } from "@/lib/db/list";

/**
 * A sortable column header. The active column and direction are passed in
 * (resolved server-side) rather than read from the URL, so the header is
 * correct on the default sort, when no `sort` param is present.
 */
export function SortHeader({
  columnKey,
  label,
  active,
  dir,
  defaultDir = "asc",
  align = "left",
}: {
  columnKey: string;
  label: string;
  active: boolean;
  dir: SortDirection;
  defaultDir?: SortDirection;
  align?: "left" | "right";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const nextDir: SortDirection = active ? (dir === "asc" ? "desc" : "asc") : defaultDir;

  function toggle() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", columnKey);
    params.set("dir", nextDir);
    params.delete("page"); // a re-sort invalidates the current page
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Sort by ${label}, ${nextDir === "asc" ? "ascending" : "descending"}`}
      className={cn(
        "-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 uppercase tracking-wide transition-colors",
        "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "text-foreground",
        align === "right" && "flex-row-reverse",
        pending && "opacity-60",
      )}
    >
      {label}
      <Icon className={cn("size-3 shrink-0", active ? "opacity-100" : "opacity-40")} />
    </button>
  );
}
