# Fairmarkit RFQ round-trip

Nestlé (and other buyers) send RFQs through **Fairmarkit**. A supplier can answer a
bid on the website, or download an Excel sheet, fill it in and upload it again. This
app does the middle part: **import the sheet → price it as a normal quotation →
export the sheet back**.

```
Fairmarkit bid page          Bade app                       Fairmarkit import tab
  ┌───────────────┐  .xlsx   ┌──────────────────────┐  .xlsx  ┌──────────────────┐
  │ Download bid  │ ───────▶ │ New quotation        │ ──────▶ │ Upload response  │
  │ sheet         │          │  · items + qty + UOM │         │                  │
  │ (no prices)   │          │  · you enter prices  │         │                  │
  └───────────────┘          └──────────────────────┘         └──────────────────┘
```

The same quotation still prints as a normal Bade quotation PDF — Fairmarkit is an
extra output, not a different document type.

## The sheet

One worksheet. Rows 1–8 are a header block, row 9 is the column header, row 10+ are
the RFQ lines.

| Rows 1–8, col A | Rows 1–4, cols N/O |
|---|---|
| `<Buyer> RFQ details` | `<Supplier> RFQ Response` |
| `TITLE: …` | `Quote Number` \| *value* |
| `RFQ ID: …` | `Valid For days:` \| *value* |
| `Scheduled Close Date: …` | `Currency:` \| *value* |
| `Shipping Method: …` | |
| `Shipping address: …` | |
| `Preferred Delivery Date: …` | |

The 23 columns split in two. **A–M are the buyer's** and every one carries a cell
comment saying *"Do not modify these cells"* — they are replayed byte-for-byte on
export. **N–W are the supplier's answer** and are regenerated from the quotation.

| Col | Header | Filled by | Export writes |
|---|---|---|---|
| A | Line # | buyer | replayed |
| B | Line Type | buyer | replayed |
| C | Item / Service description | buyer | replayed → quotation item description |
| D–E | Manufacturer / MFG Part # (from buyer) | buyer | replayed |
| F | Unit of Measure | buyer | replayed → quotation item unit |
| G–L | Internal part #, Suppliers part #, Comments, Start/End date, Attachments | buyer | replayed |
| M | Quantity | buyer | replayed → quotation item qty |
| N | Manufacturer (from supplier) | **us** | `NIL` |
| O | MFG Part # (from supplier) | **us** | `NIL` |
| P | Suppliers Part # | **us** | `NIL` |
| Q | Bid on this Line | **us** | `Yes` when priced, else `No` |
| R | Unit Price/Response | **us** | unit price, 8 decimals |
| S | Delivery Days | **us** | lead time (default 3) |
| T–W | Supplier SKU, Country of origin, Min order qty, Comments | **us** | blank unless imported |

> `Comments` appears twice — column I is the buyer's, column W is ours. Columns are
> therefore keyed by **index**, never by label.

## Import

`POST /api/import/fairmarkit` (multipart, field `file`) → `lib/fairmarkit/parse.ts`.

A freshly issued sheet has **no prices and no NIL** — only description, quantity and
unit of measure. The import fills the quotation's line items from those three columns
and leaves `rate`/`amount` blank for you to price. It also pre-fills, *only when the
field is still empty*, the customer (from the buyer name), the address (from the
shipping address) and the job title (from `TITLE:`). If the buyer name matches a
customer on file, that customer is linked.

The whole source sheet — headers, header block, and every buyer cell of every line —
is snapshotted into `quotations.fairmarkit` (`jsonb`, see
`supabase/migrations/0003_quotation_fairmarkit.sql`), because Fairmarkit only accepts
the sheet it issued.

## Export

`GET /api/quotations/[id]/fairmarkit` → `lib/fairmarkit/build.ts`, downloads
`Fairmarkit-<rfq id>-<ref no>.xlsx`.

- The stored snapshot is re-validated first; if it is missing or no longer parses, an
  equivalent sheet is **synthesised** from the quotation itself, so any quotation can
  be exported — not only imported ones.
- `Quote Number` is written from the quotation's `ref_no`; `Valid For days` and
  `Currency` come from the panel on the quotation form.
- Lines are paired with quotation items **by description first, then positionally**,
  so renaming or reordering a line still finds its price.
- A line with no priced item goes out as `Bid on this Line = No` with a blank price.
- Items that exist on the quotation but not on the RFQ **cannot be sent** — Fairmarkit
  only accepts its own lines. The quotation page warns when there are any.
- Unit price is `rate` when `rate × qty` reconciles with the line amount, otherwise
  `amount ÷ qty`, so the sheet total always matches the quotation total.

## The xlsx layer

`lib/xlsx/` is a small reader/writer over `fflate` (no SheetJS): `read.ts` flattens a
workbook to a grid of values (shared/inline strings, booleans, date-formatted serials),
`write.ts` emits a single-sheet workbook. Text is written as `t="str"` and numbers as
bare `<v>` — the same shapes Fairmarkit's own export uses, so a round-tripped sheet is
structurally identical to a downloaded one.
