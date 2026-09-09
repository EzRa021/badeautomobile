import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { FairmarkitParseError, parseFairmarkitWorkbook } from "@/lib/fairmarkit/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;

/** Read a Fairmarkit bid sheet (.xlsx) and return the fields to pre-fill a quotation. */
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
    return Response.json({ error: "No Excel file was provided." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "That file is too large (max 10MB)." }, { status: 400 });
  }
  if (!/\.xlsx$/i.test(file.name)) {
    return Response.json(
      { error: "Fairmarkit sheets are .xlsx files — re-download the bid sheet and try again." },
      { status: 400 },
    );
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return Response.json(parseFairmarkitWorkbook(bytes, file.name));
  } catch (error) {
    if (error instanceof FairmarkitParseError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    return Response.json({ error: "Could not read that spreadsheet." }, { status: 422 });
  }
}
