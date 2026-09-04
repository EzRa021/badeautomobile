import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { getPurchaseOrder, getCompanySettings } from "@/lib/db/queries";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { PurchaseOrderPdf } from "@/lib/pdf/templates/purchase-order";
import { pdfResponse } from "@/lib/pdf/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const [doc, company] = await Promise.all([getPurchaseOrder(id), getCompanySettings()]);
  if (!doc) return new Response("Not found", { status: 404 });

  registerPdfFonts();
  const buffer = await renderToBuffer(createElement(PurchaseOrderPdf, { doc, company }) as unknown as Parameters<typeof renderToBuffer>[0]);
  const download = request.nextUrl.searchParams.get("download") === "1";
  return pdfResponse(buffer, `PurchaseOrder-${doc.po_no}.pdf`, download);
}
