# List pages & the data table

Every list page in the app is the same machine: **search · status · date range ·
sort · page**, all held in `searchParams` so the page is server-rendered,
shareable and bookmarkable, and so nothing has to be re-fetched on the client.

```
searchParams ──▶ readListParams() ──▶ listQuotations(opts) ──▶ { rows, total, page, … }
     ▲                                      │                         │
     │                                      ▼                         ▼
 SearchInput · StatusFilter            PostgREST                  <DataTable>
 DateRangeFilter · SortHeader        (filter+order+range)      desktop table / phone cards
 Pagination                                                     + inline StatusToggle
```

## Server side

`lib/db/list.ts` holds the plumbing; `pagedList()` in `lib/db/queries.ts` applies
it to a table:

```ts
export const QUOTATION_SORTS: SortMap = {
  ref_no: "asc", quote_date: "desc", customer_name: "asc",
  vehicle_label: "asc", total: "desc", status: "asc",
};

export function listQuotations(opts: ListOptions = {}): Promise<Paged<Quotation>> {
  return pagedList<Quotation>("quotations", opts, {
    search: ["ref_no", "customer_name", "job_title", "vehicle_label"],
    dateColumn: "quote_date",
    sorts: QUOTATION_SORTS,
    defaultSort: "quote_date",
  });
}
```

Points that matter:

- **The sort column is allowlisted.** It reaches PostgREST's `order`, so it must
  never be caller-controlled. `resolveSort()` falls back to the default for
  anything not in the `SortMap` — including prototype keys like `__proto__`.
- **Each column has a natural direction** (dates newest-first, names A→Z), used
  on the first click. An explicit `dir` always wins.
- **Search terms are escaped.** `%` and `_` are `ilike` wildcards and `,` would
  split the `or()` filter, so `escapeLike()` strips them.
- **Paging is stable.** Every query adds `.order("id")` as a tiebreaker, so rows
  sharing a sorted value don't reshuffle between pages.
- **An out-of-range page self-corrects.** A hand-edited `?page=99`, or rows
  deleted since a link was made, re-queries the clamped last page instead of
  showing an empty table.
- **Dates are validated** — only `yyyy-MM-dd` reaches the query.
- Page size is one of `10 / 20 / 50 / 100`; anything else falls back to 20.

Contacts have both an unpaged and a paged reader: `listCustomers()` feeds form
dropdowns (which need every row), `pagedCustomers()` feeds the list page.

## The table

`components/app/data-table.tsx` is a **server** component — cell renderers stay
on the server, and only the sort, paging and status controls are client islands.
A page declares its columns once:

```tsx
const COLUMNS: DataColumn<Quotation>[] = [
  { key: "ref_no", header: "Ref", sortable: true, mobile: "primary",
    cell: (q) => <ReferenceChip>{q.ref_no}</ReferenceChip> },
  { key: "total", header: "Total", sortable: true, align: "right",
    mobile: "trailing", cell: (q) => formatAmount(q.total) },
  { key: "status", header: "Status", sortable: true, interactive: true,
    mobile: "trailing",
    cell: (q) => <StatusToggle action={setQuotationStatus} id={q.id}
                               current={q.status} options={STATUS_OPTIONS} /> },
];
```

| Field | Effect |
|---|---|
| `sortable` | Renders `SortHeader`. The key must exist in the list's `SortMap`. |
| `defaultDir` | Direction on the first click. |
| `hideBelow` | Drops the column from the **desktop** table under that breakpoint. |
| `interactive` | The cell holds a control — lifts it above the row link overlay. |
| `mobile` | `primary` / `secondary` / `trailing` / `meta` (default) / `hidden`. |

Give every column that can hold long text an explicit width in `className` and
clamp the cell (`line-clamp-1` / `line-clamp-2`). Table auto-layout otherwise
wraps a cramped cell at every opportunity — a vehicle like
"Toyota Cruiser Prado AGL 589 EW" will stack one word per line and blow up the
row height. `interactive` deliberately does **not** set a width for this reason.

### Mobile

Below `md` the table is replaced by cards built from the same column
definitions — no horizontal scrolling, no second set of markup in the page:

```
┌────────────────────────────────────┐
│ BAD/00012/755            ₦366,500  │ ← primary            trailing
│ 09 Sep 2026 · Nestle      ● Sent ▾ │ ← secondary          trailing
│ Job      Repair of brakes          │ ← meta (label/value)
│ Vehicle  Toyota Prado              │
└────────────────────────────────────┘
```

### Row navigation

The whole row is clickable without nesting interactive elements: the first
non-interactive cell carries a `<Link>` whose `::after` covers the row, and
`interactive` cells sit above it. One real anchor per row, so keyboard and
screen-reader navigation stay correct, and the status dropdown and row actions
still receive their own clicks.

## Adding a list page

1. Add a `SortMap` + a `pagedList()` wrapper in `lib/db/queries.ts`.
2. Declare `DataColumn<T>[]`.
3. Read params with `readListParams()`, resolve the sort with `resolveSort()`,
   and spread the result: `const { rows, ...page } = await listX(options)`.
4. Render `SearchInput` / `StatusFilter` / `DateRangeFilter`, then `<DataTable>`
   with `rows`, `columns`, `page`, `sort`, `getKey`, `getHref` and `empty`.

The **Staff** page is deliberately excluded: it reads Supabase Auth rather than a
table, and a workshop has a handful of accounts.
