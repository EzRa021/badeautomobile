import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { getJobDelivery, getCompanySettings } from "@/lib/db/queries";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { JobDeliveryPdf } from "@/lib/pdf/templates/job-delivery";
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
  const [doc, company] = await Promise.all([getJobDelivery(id), getCompanySettings()]);
  if (!doc) return new Response("Not found", { status: 404 });

  registerPdfFonts();
  const buffer = await renderToBuffer(createElement(JobDeliveryPdf, { doc, company }) as unknown as Parameters<typeof renderToBuffer>[0]);
  const download = request.nextUrl.searchParams.get("download") === "1";
  return pdfResponse(buffer, `JobDelivery-${doc.jd_no}.pdf`, download);
}
