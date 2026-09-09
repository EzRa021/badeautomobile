import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortHeader } from "@/components/app/sort-header";
import { Pagination } from "@/components/app/pagination";
import type { Paged, SortDirection } from "@/lib/db/list";

/**
 * How a column behaves on phones, where the table is re-laid-out as cards:
 * - `primary`   headline of the card
 * - `secondary` supporting line under the headline
 * - `trailing`  right-hand block (status, amount) — stays tappable
 * - `meta`      a labelled `label / value` line (default)
 * - `hidden`    dropped entirely
 */
export type MobileRole = "primary" | "secondary" | "trailing" | "meta" | "hidden";

export interface DataColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Enable the sort control. The key must be in the list's SortMap. */
  sortable?: boolean;
  /** Direction applied on the first click. Defaults to the column's nature. */
  defaultDir?: SortDirection;
  align?: "left" | "right";
  /** Extra classes for both the `th` and `td` (widths, wrapping…). */
  className?: string;
  /** Drop the column from the desktop table below this breakpoint. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  /** Contains a control — lift it above the row-wide link overlay. */
  interactive?: boolean;
  mobile?: MobileRole;
}

const HIDE_BELOW: Record<NonNullable<DataColumn<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

function roleOf<T>(column: DataColumn<T>): MobileRole {
  return column.mobile ?? "meta";
}

/**
 * The app's list table: sortable headers, an inclusive date range and paging
 * (all held in `searchParams`), inline controls, and a card layout on phones so
 * nothing depends on horizontal scrolling.
 *
 * A server component — `cell` renderers stay on the server; only the sort,
 * paging and status controls are client islands.
 */
export function DataTable<T>({
  rows,
  columns,
  getKey,
  getHref,
  sort,
  page,
  empty,
  caption,
}: {
  rows: T[];
  columns: DataColumn<T>[];
  getKey: (row: T) => string;
  /** Makes the whole row (and card) navigate. */
  getHref?: (row: T) => string;
  sort?: { key: string; dir: SortDirection };
  /** Omit to hide the pager (e.g. an unpaged list). */
  page?: Omit<Paged<T>, "rows">;
  empty: React.ReactNode;
  caption?: string;
}) {
  if (rows.length === 0) return <>{empty}</>;

  const primary = columns.filter((c) => roleOf(c) === "primary");
  const secondary = columns.filter((c) => roleOf(c) === "secondary");
  const trailing = columns.filter((c) => roleOf(c) === "trailing");
  const meta = columns.filter((c) => roleOf(c) === "meta");

  return (
    <Card className="overflow-hidden">
      {/* ---------------------------------------------------------- desktop */}
      <div className="max-md:hidden">
        <Table>
          {caption && <caption className="sr-only">{caption}</caption>}
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.align === "right" && "text-right",
                    column.hideBelow && HIDE_BELOW[column.hideBelow],
                    column.className,
                  )}
                  aria-sort={
                    sort?.key === column.key
                      ? sort.dir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  {column.sortable ? (
                    <SortHeader
                      columnKey={column.key}
                      label={column.header}
                      active={sort?.key === column.key}
                      dir={sort?.key === column.key ? sort.dir : (column.defaultDir ?? "asc")}
                      defaultDir={column.defaultDir}
                      align={column.align}
                    />
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
              {getHref && <TableHead className="w-8" aria-label="Open" />}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => {
              const href = getHref?.(row);
              let linkPlaced = false;
              return (
                <TableRow key={getKey(row)} className="relative">
                  {columns.map((column) => {
                    const content = column.cell(row);
                    // The first non-interactive cell carries the row-wide link.
                    const takesLink = Boolean(href) && !linkPlaced && !column.interactive;
                    if (takesLink) linkPlaced = true;
                    return (
                      <TableCell
                        key={column.key}
                        className={cn(
                          column.align === "right" && "text-right",
                          column.hideBelow && HIDE_BELOW[column.hideBelow],
                          // `relative` lifts the cell above the row-wide link overlay.
                          // Width stays with the column so content is never squeezed.
                          column.interactive && "relative z-10",
                          column.className,
                        )}
                      >
                        {takesLink && href ? (
                          <Link
                            href={href}
                            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {content}
                          </Link>
                        ) : (
                          content
                        )}
                      </TableCell>
                    );
                  })}
                  {getHref && (
                    <TableCell className="w-8 text-right">
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ----------------------------------------------------------- mobile */}
      <ul className="divide-y divide-border md:hidden">
        {rows.map((row) => {
          const href = getHref?.(row);
          return (
            <li key={getKey(row)} className="relative flex flex-col gap-2 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-0.5">
                  {href ? (
                    <Link
                      href={href}
                      className="block after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {primary.map((column) => (
                          <span key={column.key} className="min-w-0 font-medium">
                            {column.cell(row)}
                          </span>
                        ))}
                      </div>
                    </Link>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {primary.map((column) => (
                        <span key={column.key} className="min-w-0 font-medium">
                          {column.cell(row)}
                        </span>
                      ))}
                    </div>
                  )}
                  {secondary.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      {secondary.map((column) => (
                        <span key={column.key}>{column.cell(row)}</span>
                      ))}
                    </div>
                  )}
                </div>

                {trailing.length > 0 && (
                  <div className="relative z-10 flex shrink-0 flex-col items-end gap-1.5 text-right">
                    {trailing.map((column) => (
                      <div key={column.key}>{column.cell(row)}</div>
                    ))}
                  </div>
                )}
              </div>

              {meta.length > 0 && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  {meta.map((column) => (
                    <div key={column.key} className="contents">
                      <dt className="text-muted-foreground">{column.header}</dt>
                      <dd className="min-w-0 text-right">{column.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          );
        })}
      </ul>

      {page && page.total > 0 && (
        <Pagination
          page={page.page}
          pageCount={page.pageCount}
          total={page.total}
          perPage={page.perPage}
        />
      )}
    </Card>
  );
}
