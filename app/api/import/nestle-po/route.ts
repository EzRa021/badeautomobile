import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { parseNestlePo } from "@/lib/pdf/parse-nestle-po";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let file: FormDataEntryValue | null = null;
  try {
    const form = await request.formData();
    file = form.get("file");
  } catch {
    return Response.json({ error: "Invalid upload." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return Response.json({ error: "No PDF file was provided." }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return Response.json({ error: "That PDF is too large (max 15MB)." }, { status: 400 });
  }

  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const parsed = await parseNestlePo(buffer);
    if (parsed.items.length === 0) {
      return Response.json(
        { error: "No line items were found. Make sure it's a text-based Nestlé purchase order (not a scan)." },
        { status: 422 },
      );
    }
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "Could not read that PDF." }, { status: 422 });
  }
}
