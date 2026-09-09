# Vehicle service history

A workshop services the same vehicles over and over, so the useful question is
rarely "show me this invoice" — it is **"what has been done to this vehicle, and
what has it cost?"** `/vehicles/[id]` answers that in one page.

```
        quotation ─┐
     job delivery ─┼─ vehicle_id ─▶  /vehicles/[id]   ── filter by date + type
          invoice ─┤                 · what was quoted / invoiced / bought
   purchase order ─┘                 · every document, newest first, linked
```

## Capturing the vehicle

Before this feature only quotations and job deliveries carried `vehicle_id`;
purchase orders had free-text `vehicle_ref` and invoices had nothing. Migration
`0004_vehicle_history.sql` gives **all four** document types a link plus a
printed snapshot.

Every document form now uses the shared **`components/app/vehicle-picker.tsx`**:
pick from the registry, *or* just type the vehicle and its plate. On save,
`lib/db/vehicles.ts → resolveVehicle()` turns that into a registry row:

1. a picked `vehicle_id` wins (and fills in a blank plate/owner from what was typed);
2. otherwise match on the **normalised plate** — `vehicles.reg_no_key`, a stored
   generated column holding `reg_no` upper-cased with punctuation stripped, so
   "LSD 656 HD", "lsd-656hd" and "LSD656HD" are the same vehicle;
3. otherwise match on description, case-insensitively;
4. otherwise **register a new vehicle**.

That is what keeps history complete without asking anyone to maintain a registry
by hand. It never throws: if the registry write is refused the document still
saves, just without the link.

### Fairmarkit RFQs

RFQ titles name the vehicle and its plate — *"RFQ For Repair Of Toyota Prado
LSD 656 HD @Flowergate Factory"*. Importing a bid sheet (`docs/FAIRMARKIT.md`)
runs `lib/utils/vehicle.ts → extractVehicleFromTitle()` over the title and
pre-fills the vehicle as `Toyota Prado` / `LSD 656 HD`. It anchors on the plate
and returns nothing when there isn't one, rather than guessing.

## Snapshots

Same rule as customers and totals: the document must read correctly even if the
vehicle is later renamed or deleted.

| Table | Link | Printed snapshot |
|---|---|---|
| `quotations` | `vehicle_id` | `vehicle_label` |
| `invoices` | `vehicle_id` | `vehicle_label` |
| `purchase_orders` | `vehicle_id` | `vehicle_ref` (unchanged — it prints as "Vehicle / Job") |
| `job_deliveries` | `vehicle_id` | `vehicle` (unchanged — it prints in the work sentence) |

No PDF template changed: the snapshot columns are the ones the templates
already printed.

## The history page

`app/(app)/vehicles/[id]/page.tsx`, fed by `lib/db/vehicle-history.ts`.

- **Stat cards** — invoiced, quoted, parts & supplies (purchase orders), jobs
  delivered.
- **Filters** — an inclusive `from`/`to` date range and a document-type filter,
  both held in `searchParams` so a filtered view is server-rendered and
  shareable. Every figure on the page reflects the active filter; the summary
  card says so when one is set.
- **Timeline** — all four document types merged, newest first, each row showing
  its type, reference, date, counterparty, amount and status, linking to the
  document.
- **Summary** — first seen, last activity, and `invoiced − parts` once both
  exist (a rough per-vehicle margin).
- **Invoiced by month** — six buckets ending at the most recent activity.
- **Raise for this vehicle** — starts a quotation or job delivery with
  `?vehicle=<id>`, which pre-selects it.

Cancelled invoices and purchase orders are excluded from the money totals.

Every document detail page carries a **Vehicle** row
(`components/app/vehicle-link.tsx`) linking back here, so the loop closes from
both directions.

## Backfill

Migration 0004 links existing rows where it safely can: quotation labels from
the registry, and job deliveries / purchase orders whose free text contains a
known plate or exactly matches a description. Anything ambiguous is left
unlinked rather than guessed — verified against realistic data, including a PO
reading "Generic workshop consumables", which stays unlinked.
