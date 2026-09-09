import { createClient } from "@/lib/supabase/server";

/**
 * Vehicle capture for documents.
 *
 * Documents let you either pick a vehicle from the registry or just type one.
 * Typing must still build history, so a typed vehicle is matched against the
 * registry (by plate first, then by description) and registered when it is new.
 * That is what makes the per-vehicle history on `/vehicles/[id]` complete.
 */

export interface VehicleInputRef {
  /** Registry id when picked from the dropdown. */
  id?: string | null;
  /** What the document prints, e.g. "Toyota Prado". */
  label?: string | null;
  /** Plate, e.g. "LSD 656 HD". */
  reg_no?: string | null;
  /** Owner to attach when the vehicle is created. */
  customer_id?: string | null;
}

export interface ResolvedVehicle {
  id: string | null;
  /** Snapshot to store on the document. */
  label: string | null;
}

/** "LSD 656 HD" / "lsd-656hd" → "LSD656HD". Mirrors `vehicles.reg_no_key`. */
export function plateKey(value: string | null | undefined): string | null {
  const key = String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return key || null;
}

function clean(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

const NONE: ResolvedVehicle = { id: null, label: null };

/**
 * Resolve a document's vehicle fields to a registry row, creating one when the
 * vehicle is new. Never throws: if the registry write fails the document still
 * saves, just without the link.
 */
export async function resolveVehicle(
  input: VehicleInputRef,
  createdBy?: string | null,
): Promise<ResolvedVehicle> {
  const label = clean(input.label);
  const regNo = clean(input.reg_no);
  const id = clean(input.id);
  const customerId = clean(input.customer_id);

  if (!id && !label && !regNo) return NONE;

  const supabase = await createClient();

  // --- picked from the registry -------------------------------------------
  if (id) {
    const { data } = await supabase
      .from("vehicles")
      .select("id, description, reg_no, customer_id")
      .eq("id", id)
      .maybeSingle();

    if (data) {
      // Opportunistically enrich a sparse registry row from what was typed.
      const patch: Record<string, string> = {};
      if (regNo && !data.reg_no) patch.reg_no = regNo;
      if (customerId && !data.customer_id) patch.customer_id = customerId;
      if (Object.keys(patch).length > 0) {
        await supabase.from("vehicles").update(patch).eq("id", data.id);
      }
      return { id: data.id, label: label ?? data.description };
    }
    // A stale id (vehicle deleted) falls through to matching on the text.
  }

  // --- match an existing vehicle ------------------------------------------
  const key = plateKey(regNo);
  if (key) {
    const { data } = await supabase
      .from("vehicles")
      .select("id, description, reg_no")
      .eq("reg_no_key", key)
      .order("created_at", { ascending: true })
      .limit(1);
    const hit = data?.[0];
    if (hit) return { id: hit.id, label: label ?? hit.description };
  }

  if (label) {
    // `ilike` with no wildcards is a case-insensitive equality test.
    const { data } = await supabase
      .from("vehicles")
      .select("id, description, reg_no")
      .ilike("description", label)
      .order("created_at", { ascending: true })
      .limit(1);
    const hit = data?.[0];
    if (hit) {
      if (regNo && !hit.reg_no) {
        await supabase.from("vehicles").update({ reg_no: regNo }).eq("id", hit.id);
      }
      return { id: hit.id, label: label ?? hit.description };
    }
  }

  // --- register a new vehicle ---------------------------------------------
  const description = label ?? regNo;
  if (!description) return NONE;

  const { data: created } = await supabase
    .from("vehicles")
    .insert({
      description,
      reg_no: regNo,
      customer_id: customerId,
      created_by: createdBy ?? null,
    })
    .select("id")
    .single();

  // If the insert was refused, keep the typed text on the document anyway.
  return { id: created?.id ?? null, label: description };
}
