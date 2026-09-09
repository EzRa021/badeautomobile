import { getCompanySettings, getQuotation } from "@/lib/db/queries";
import { getCurrentUser } from "@/lib/supabase/server";
import {
  buildFairmarkitWorkbook,
  fairmarkitFileName,
  planFairmarkitExport,
  synthesizeSource,
} from "@/lib/fairmarkit/build";
import { fairmarkitSourceSchema } from "@/lib/fairmarkit/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Download the quotation as a Fairmarkit bid sheet, ready to upload on the
 * RFQ's "Import" tab. Quotations imported from Fairmarkit replay their original
 * sheet; any other quotation gets an equivalent one built from its line items.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const quotation = await getQuotation(id);
  if (!quotation) return new Response("Not found", { status: 404 });
  if (quotation.items.length === 0) {
    return new Response("This quotation has no line items to bid with.", { status: 422 });
  }

  // A stored snapshot is re-validated: it may predate a change to the shape.
  const stored = quotation.fairmarkit
    ? fairmarkitSourceSchema.safeParse(quotation.fairmarkit)
    : null;

  const source = stored?.success
    ? stored.data
    : synthesizeSource(
        quotation,
        quotation.items,
        (await getCompanySettings())?.name ?? null,
      );

  const plan = planFairmarkitExport(source, quotation.items);
  const workbook = buildFairmarkitWorkbook(plan, quotation);

  // `BodyInit` in lib.dom does not admit Uint8Array<ArrayBufferLike>; the runtime does.
  return new Response(workbook as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename="${fairmarkitFileName(quotation, source)}"`,
      "Content-Length": String(workbook.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
