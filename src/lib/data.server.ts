import type { SupabaseClient } from "@supabase/supabase-js";
import type { AlertRow } from "./data.types";

export async function attachPatientNames(
  sb: SupabaseClient,
  rows: AlertRow[],
): Promise<AlertRow[]> {
  if (rows.length === 0) return rows;
  const ids = Array.from(new Set(rows.map((r) => r.patient_id)));
  const { data: pats } = await sb.from("patients").select("id, name, village").in("id", ids);
  const map = new Map((pats || []).map((p: { id: string; name: string; village: string }) => [p.id, p]));
  return rows.map((r) => {
    const p = map.get(r.patient_id);
    return { ...r, patient_name: p?.name, village: p?.village };
  });
}
