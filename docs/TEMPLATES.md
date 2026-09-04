# Template Analysis — Bade Automobile Documents

Source files live in `/templates` (filled sample PDFs). This document records exactly
what each template contains, the fields a user must supply, and the measured geometry
used to reproduce them. **The generated PDFs must match these templates.**

All templates are **A4** (595.32 × 841.92 pt), font **Calibri / Calibri‑Bold**
(reproduced with **Carlito**, the metric‑compatible OFL substitute). Every page shares
one letterhead + watermark background image, extracted to
`public/brand/letterhead-bg.jpg`. The signature is `public/brand/signature.jpg`.

Company identity (letterhead): **BADE AUTOMOBILE LTD** · 17, Akindeko Akinbamidele
Street, Off Emerald Road, Opp. Deeper Life Camp, Ogun State · Tel 08122264086,
09136292232, 08179739999 · badejotaofeek1@gmail.com · **TIN 20724729-001**.

---

## 1. Quotation (`QUOTATION-4_260722_115623.pdf`)

Top block (left) + date (right), a bordered items table, total, amount‑in‑words,
"Thank you.", signature, "FOR: BADE AUTOMOBILE LTD".

**Header fields**
- `Our Ref:` — reference string (e.g. `BAD/00012/752`)
- Date — right aligned (e.g. `22nd July, 2026`)
- Customer name (e.g. `NESTLE NIGERIA PLC`)
- Customer address line(s) (e.g. `AGBARA FACTORY`)

**Table** — columns `S/N | DESCRIPTION | QTY | RATE ₦ | AMOUNT ₦`, with a full‑width
**banner row** above the items holding the job title (e.g. *CARRY OUT REPAIRS ON FAULTY
ENGINE OF TOYOTA PRADO AGL 58EW*). Column x‑bounds (pt): S/N 66→104, DESCRIPTION
104→318, QTY 318→368, RATE 368→449 (right‑aligned ~446), AMOUNT 449→529 (right‑aligned
~527). Rows ≈17.6 pt tall; the sheet pads empty rows so the table fills the page with
the **TOTAL** row pinned near the bottom (y≈554).

**Per item:** description, qty + unit (`1 Pcs`, `1 Set`, `4 Pcs`, `1 Lot`), rate
(nullable — Labour had none), amount. **TOTAL** = Σ amounts. **AMOUNT IN WORDS** below.

## 2. Job Delivery Report (`JOB DELIVERY.pdf`)

A form, not a table. Header: `PO No`, a boxed `Invoice No` / `Date` (top right),
`TIN NO`, then the centered title **JOB DELIVERY REPORT** (22 pt bold), then labelled
fields with dotted leaders.

**Fields**
- `PO No` (customer PO ref, e.g. `4563673136`)
- `TO:` customer name + up to 3 address lines
- `Invoice No` (e.g. `000159`) and `Date` (e.g. `13/08/2026`) in the top‑right box
- `TIN NO` — company TIN
- **Work Description:** `<work_done>` *has been carried out on* `<vehicle>`
  (e.g. *Body Work & Painting* / *Toyota Fortuner KSF 318 FJ*)
- **Items Changed:** free text (may wrap several lines)
- **Note:** free text
- **Next Service:** free text (e.g. mileage `178724`)
- **Accessories Found on Vehicle:** free text (multi‑line)
- **Accessories Returned with Vehicle:** free text (multi‑line)
- **Date In and Time / Date Out and Time** (e.g. `15/07/2026, 2:30pm`)
- **Driver's Name and Signature** (e.g. `Mr. Francis (In), Mr. Asisi (Out)`)
- **Vehicle Coordinator Sign / Engineering Inspector Sign** (free text)
- Footer: *Yours Faithfully* / signature / *For: Bade Automobile Ltd*

## 3. Invoice (`INVOICE 2-2.pdf`)

Top‑left customer box (`Name` / `Address`), center `Invoice №` box with `Customer's
Number` + `Date`, right `TIN NO` + `P.O NO`. Then a bordered per‑line VAT table, total,
"Thank you for Patronage…", amount‑in‑words, signature.

**Header fields:** customer name, address (2–3 lines), `Invoice №` (e.g. `000158`),
`Customer's Number`, `Date` (e.g. `31/07/2026`), company `TIN NO`, `P.O NO`
(customer PO ref, e.g. `4563591359`).

**Table** — header `Item | Quantity | Description | Unit Price | ₦ | K (Amount)`.
Each item renders as a **4‑line block** (each block ≈66 pt tall, separated by rules):
1. `item_code` (e.g. `90072381`) · Description · Unit Price · **net amount**
2. `Item#` (10., 20., …) · Qty · `VAT` **Taxes** · **VAT amount**
3. **Net Price** · `7.50%`
4. net price value · **gross incl. VAT** (bold)

Per item: item_code, description, qty (default 1), unit_price, net_amount = qty×unit_price,
vat_rate (7.5%), vat_amount, gross_amount. **TOTAL INCLUDING TAX** = Σ gross.

## 4. Purchase Order (no original template)

Bade → supplier. Rendered on the **same letterhead**, styled like the quotation:
`PO No`, `Date`, supplier name/address, optional `Deliver To` and `Vehicle/Job Ref`,
an items table (`S/N | DESCRIPTION | QTY | UNIT PRICE ₦ | AMOUNT ₦`), optional VAT,
TOTAL, amount‑in‑words, signature. Kept visually consistent with the real templates so
it does not read as a foreign document.

---

## Field → column reference (for the PDF layer)

The measured span coordinates for every fixed label and the table grid lines were
captured with PyMuPDF and are encoded directly in the `@react-pdf/renderer` layouts
under `lib/pdf/templates/`. When adjusting a layout, compare the rendered output
side‑by‑side with the sample in `/templates` rather than eyeballing from scratch.
