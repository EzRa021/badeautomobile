# PDF Generation

Goal: generated PDFs must look like the sample templates in `/templates`. We achieve
pixel-faithful **letterhead + watermark** by reusing the exact background image extracted
from the originals, then rebuilding each document body with `@react-pdf/renderer` using
the measured geometry in `docs/TEMPLATES.md`.

## Why @react-pdf/renderer (not Puppeteer / html2canvas)
- Runs server-side with no headless browser (works on serverless/Vercel).
- Vector text (crisp, selectable), real fonts, images, precise flex/absolute layout.
- Handles variable-length line-item tables that pure coordinate overlays cannot.

## Building blocks
- `lib/pdf/fonts.ts` — registers **Carlito** (Regular + Bold + Italic) as family `"Calibri"`
  from `public/fonts/*.ttf`. Carlito is metric-compatible with Calibri, so spacing matches.
- `public/brand/letterhead-bg.jpg` — full-page A4 background (header logo + address bar +
  faint BADE watermark). Placed as an absolutely-positioned full-page `<Image>` behind content.
- `public/brand/signature.jpg` — the "T.O.B" signature used above "For: Bade Automobile Ltd".
- `lib/pdf/Letterhead.tsx` — a `<Page>` wrapper: A4, the background image, content padding
  (left/right ≈72 pt, top ≈118 pt to clear the header band), and the shared signature footer.
- `lib/pdf/templates/{quotation,invoice,po,job-delivery}.tsx` — one `<Document>` per type.

## Layout rules per template
- **Quotation / Purchase Order**: bordered table, columns per the measured x-bounds; money
  right-aligned; a full-width banner row for the job title (quotation); pad empty rows so the
  TOTAL sits low on the page like the sample; render the ₦ header glyph.
- **Invoice**: 4-line VAT block per item with horizontal rules; header customer/invoice boxes;
  `TOTAL INCLUDING TAX` in bold.
- **Job Delivery**: form layout with labelled rows and dotted bottom-borders; boxed Invoice
  No/Date; centered 22 pt title.

## Money & words
- Format with `lib/utils/money.ts` → `1,234,567.00` (₦ prefix where the template shows it).
- `amount_in_words` is generated at save time and printed verbatim (upper-cased for quotation,
  title-case "… Naira Only" for invoice, matching each sample).

## Route handlers
`app/api/<type>/[id]/pdf/route.ts`:
1. `await ctx.params` → id. 2. Auth check via server client. 3. Fetch document + items +
company settings. 4. `renderToStream(<Doc .../>)`. 5. Return with
`Content-Type: application/pdf`; add `Content-Disposition: attachment; filename="…"` when
`?download=1`, otherwise `inline` for in-browser preview/print.

## Verifying fidelity
After changing a layout, render a document with the sample values and compare against the
matching file in `/templates`. Adjust padding/column widths until they align. Do **not**
redesign — reproduce.
