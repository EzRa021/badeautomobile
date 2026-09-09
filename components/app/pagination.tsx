"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { PAGE_SIZE_OPTIONS } from "@/lib/db/list";
import { pageWindow } from "@/lib/utils/pagination";

export function Pagination({
  page,
  pageCount,
  total,
  perPage,
  className,
}: {
  page: number;
  pageCount: number;
  total: number;
  perPage: number;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function go(next: number) {
    const target = Math.min(Math.max(next, 1), pageCount);
    if (target === page) return;
    const params = new URLSearchParams(searchParams.toString());
    if (target === 1) params.delete("page");
    else params.set("page", String(target));
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  function setPerPage(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("perPage", value);
    params.delete("page"); // row 1 of the new page size
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  const first = total === 0 ? 0 : (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        pending && "opacity-60",
        className,
      )}
    >
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {total === 0 ? "No results" : `Showing ${first}–${last} of ${total}`}
        </span>
        <label className="flex items-center gap-1.5 max-sm:hidden">
          <span className="sr-only">Rows per page</span>
          <NativeSelect
            value={String(perPage)}
            onChange={(e) => setPerPage(e.target.value)}
            aria-label="Rows per page"
            className="h-7 w-[4.5rem] text-xs"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </NativeSelect>
        </label>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => go(page - 1)}
            disabled={page <= 1 || pending}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>

          <div className="flex items-center gap-1 max-sm:hidden">
            {pageWindow(page, pageCount).map((p, i) =>
              p === null ? (
                <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  type="button"
                  variant={p === page ? "default" : "ghost"}
                  size="icon"
                  className="size-8 font-mono text-xs tabular-nums"
                  onClick={() => go(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </Button>
              ),
            )}
          </div>

          <span className="px-2 text-xs tabular-nums text-muted-foreground sm:hidden">
            {page} / {pageCount}
          </span>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => go(page + 1)}
            disabled={page >= pageCount || pending}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
