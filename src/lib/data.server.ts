import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { AlertRow } from "./data.types";

export function admin() {
  return supabaseAdmin;
}

export async function attachPatientNames(rows: AlertRow[]): Promise<AlertRow[]> {
  if (rows.length === 0) return rows;
  const sb = admin();
  const ids = Array.from(new Set(rows.map((r) => r.patient_id)));
  const { data: pats } = await sb.from("patients").select("id, name, village").in("id", ids);
  const map = new Map((pats || []).map((p) => [p.id, p]));
  return rows.map((r) => {
    const p = map.get(r.patient_id);
    return { ...r, patient_name: p?.name, village: p?.village };
  });
}
