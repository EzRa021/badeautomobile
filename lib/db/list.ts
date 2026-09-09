/**
 * Shared list-query plumbing: search + status + date range + sorting + paging,
 * all driven from `searchParams` so every list page is server-rendered,
 * shareable and bookmarkable.
 */

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export type SortDirection = "asc" | "desc";

export interface ListOptions {
  q?: string;
  status?: string;
  /** Inclusive ISO date bounds on the list's own date column. */
  from?: string;
  to?: string;
  sort?: string;
  dir?: string;
  page?: number;
  perPage?: number;
}

export interface Paged<T> {
  rows: T[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

/**
 * The columns a list may be sorted by, mapped to the direction that reads as
 * "natural" for that column (newest date first, but names A→Z). Sorting is
 * restricted to this allowlist — the value reaches PostgREST's `order`, so it
 * must never be caller-controlled.
 */
export type SortMap = Record<string, SortDirection>;

export interface ResolvedSort {
  column: string;
  ascending: boolean;
  /** Echoed back to the UI so headers can show the active arrow. */
  key: string;
  dir: SortDirection;
}

export function resolveSort(
  sorts: SortMap,
  fallback: string,
  sort?: string,
  dir?: string,
): ResolvedSort {
  const column = sort && Object.prototype.hasOwnProperty.call(sorts, sort) ? sort : fallback;
  const direction: SortDirection =
    dir === "asc" || dir === "desc" ? dir : (sorts[column] ?? "desc");
  return { column, ascending: direction === "asc", key: column, dir: direction };
}

export interface ResolvedPaging {
  page: number;
  perPage: number;
  offset: number;
  limit: number;
}

export function resolvePaging(opts: ListOptions): ResolvedPaging {
  const requested = Number(opts.perPage ?? DEFAULT_PAGE_SIZE);
  const perPage = PAGE_SIZE_OPTIONS.includes(requested as (typeof PAGE_SIZE_OPTIONS)[number])
    ? requested
    : DEFAULT_PAGE_SIZE;
  const page = Math.max(1, Math.floor(Number(opts.page) || 1));
  const offset = (page - 1) * perPage;
  return { page, perPage, offset, limit: offset + perPage - 1 };
}

/** Build the `Paged` envelope, clamping the page when the range overshoots. */
export function toPaged<T>(
  rows: T[],
  count: number | null,
  paging: ResolvedPaging,
): Paged<T> {
  const total = count ?? rows.length;
  const pageCount = Math.max(1, Math.ceil(total / paging.perPage));
  return {
    rows,
    total,
    page: Math.min(paging.page, pageCount),
    perPage: paging.perPage,
    pageCount,
  };
}

/** `%` and `_` are wildcards in PostgREST's `ilike`; `,` would split the filter. */
export function escapeLike(value: string): string {
  return value.replace(/[%_,()]/g, " ").trim();
}

/** Only accept a well-formed `yyyy-MM-dd`; anything else is ignored. */
export function parseDate(value: string | undefined): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

/** Read the shared list params off a page's `searchParams`. */
export function readListParams(params: Record<string, string | undefined>): ListOptions {
  return {
    q: params.q?.trim() || undefined,
    status: params.status || undefined,
    from: parseDate(params.from),
    to: parseDate(params.to),
    sort: params.sort || undefined,
    dir: params.dir || undefined,
    page: params.page ? Number(params.page) : undefined,
    perPage: params.perPage ? Number(params.perPage) : undefined,
  };
}
