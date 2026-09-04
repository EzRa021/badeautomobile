import { createClient } from "@/lib/supabase/server";
import type { DocType } from "@/lib/types";

/** Suggested next number for a document type, without advancing the counter. */
export async function peekDocumentNumber(docType: DocType): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("peek_document_number", {
    p_doc_type: docType,
  });
  return (data as string | null) ?? "";
}

/** Advance the counter past a used number (call after a successful save). */
export async function bumpDocumentCounter(docType: DocType, usedNumber: string) {
  const match = usedNumber.match(/(\d+)(?!.*\d)/); // last run of digits
  if (!match) return;
  const used = parseInt(match[1], 10);
  if (!Number.isFinite(used)) return;
  const supabase = await createClient();
  await supabase.rpc("bump_document_counter", {
    p_doc_type: docType,
    p_used: used,
  });
}
