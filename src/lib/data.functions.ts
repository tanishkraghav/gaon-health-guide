import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type { Urgency, PatientRow, AshaRow, Measurements, VisitRow, AlertRow } from "./data.types";
import type { PatientRow, AshaRow, VisitRow, AlertRow } from "./data.types";

// ---------- Auth ----------

export const loginPatient = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      phone: z.string().regex(/^\d{10}$/),
      village: z.string().min(1).max(100),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: existing } = await sb
      .from("patients")
      .select("*")
      .eq("phone", data.phone)
      .maybeSingle();

    if (existing) return { ok: true as const, data: existing as PatientRow };

    // Assign to first ASHA whose cluster contains this village; fallback to first ASHA.
    const { data: ashas } = await sb.from("asha_workers").select("id, village_cluster");
    const assigned =
      ashas?.find((a) => (a.village_cluster as string[] | null)?.includes(data.village))?.id ||
      ashas?.[0]?.id ||
      null;

    const { data: created, error } = await sb
      .from("patients")
      .insert({
        phone: data.phone,
        village: data.village,
        name: `Patient ${data.phone.slice(-4)}`,
        age: 30,
        gender: "F",
        assigned_asha: assigned,
      })
      .select("*")
      .single();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, data: created as PatientRow };
  });

export const loginAsha = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      workerId: z.string().min(1).max(60),
      pin: z.string().min(1).max(10),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: row, error } = await sb
      .from("asha_workers")
      .select("*")
      .ilike("worker_id", data.workerId)
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    if (!row || row.pin !== data.pin) return { ok: false as const, error: "Invalid Worker ID or PIN" };
    return { ok: true as const, data: row as AshaRow & { pin: string } };
  });

// ---------- Patient ----------

export const getPatientRecentAlerts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ patientId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("triage_alerts")
      .select("*")
      .eq("patient_id", data.patientId)
      .order("created_at", { ascending: false })
      .limit(3);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, data: (rows || []) as AlertRow[] };
  });

export const saveTriageResult = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      patientId: z.string().uuid(),
      urgency: z.enum(["green", "yellow", "red"]),
      conditionGuess: z.string().max(300).optional(),
      symptomSummary: z.string().min(1).max(800),
      symptoms: z.array(z.string().max(300)).max(20),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: patient } = await sb
      .from("patients")
      .select("assigned_asha")
      .eq("id", data.patientId)
      .maybeSingle();
    const { data: row, error } = await sb
      .from("triage_alerts")
      .insert({
        patient_id: data.patientId,
        asha_id: patient?.assigned_asha ?? null,
        urgency: data.urgency,
        condition_guess: data.conditionGuess ?? null,
        symptom_summary: data.symptomSummary,
        symptoms: data.symptoms,
      })
      .select("*")
      .single();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, data: row as AlertRow };
  });

export const notifyAshaForAlert = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ alertId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { error } = await sb
      .from("triage_alerts")
      .update({ notified: true, notified_at: new Date().toISOString() })
      .eq("id", data.alertId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ---------- ASHA ----------

async function attachPatientNames(rows: AlertRow[]): Promise<AlertRow[]> {
  if (rows.length === 0) return rows;
  const sb = await admin();
  const ids = Array.from(new Set(rows.map((r) => r.patient_id)));
  const { data: pats } = await sb.from("patients").select("id, name, village").in("id", ids);
  const map = new Map((pats || []).map((p) => [p.id, p]));
  return rows.map((r) => {
    const p = map.get(r.patient_id);
    return { ...r, patient_name: p?.name, village: p?.village };
  });
}

export const getAshaAlerts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ ashaId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("triage_alerts")
      .select("*")
      .eq("asha_id", data.ashaId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return { ok: false as const, error: error.message };
    const enriched = await attachPatientNames((rows || []) as AlertRow[]);
    return { ok: true as const, data: enriched };
  });

export const getAshaVisits = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      ashaId: z.string().uuid(),
      type: z.string().max(60).optional(),
      status: z.string().max(20).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    let q = sb.from("visits").select("*").eq("asha_id", data.ashaId).order("date", { ascending: false });
    if (data.type && data.type !== "all") q = q.eq("type", data.type);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) return { ok: false as const, error: error.message };

    const ids = Array.from(new Set((rows || []).map((r) => r.patient_id)));
    const { data: pats } = await sb.from("patients").select("*").in("id", ids);
    const map = new Map((pats || []).map((p) => [p.id, p as PatientRow]));
    const out: VisitRow[] = (rows || []).map((r) => ({ ...(r as VisitRow), patient: map.get(r.patient_id) ?? null }));
    return { ok: true as const, data: out };
  });

export const getAshaHomeData = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ ashaId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [{ data: asha }, { data: visits }, { data: alerts }] = await Promise.all([
      sb.from("asha_workers").select("*").eq("id", data.ashaId).maybeSingle(),
      sb.from("visits").select("*").eq("asha_id", data.ashaId),
      sb.from("triage_alerts").select("*").eq("asha_id", data.ashaId),
    ]);

    const visitRows = (visits || []) as VisitRow[];
    const alertRows = (alerts || []) as AlertRow[];

    const pending = visitRows.filter((v) => v.status === "Pending");
    const referrals = visitRows.filter((v) => v.status === "Referred").length;
    const completedThisMonth = visitRows.filter(
      (v) => v.status === "Completed" && new Date(v.date) >= monthStart,
    ).length;
    const critical = alertRows.filter((a) => a.urgency === "red" && !a.acknowledged).length;

    const pendingIds = Array.from(new Set(pending.map((v) => v.patient_id)));
    const { data: pats } = pendingIds.length
      ? await sb.from("patients").select("*").in("id", pendingIds)
      : { data: [] as PatientRow[] };
    const pmap = new Map((pats || []).map((p) => [p.id, p as PatientRow]));
    const upcoming = pending.slice(0, 3).map((v) => ({ ...v, patient: pmap.get(v.patient_id) ?? null }));

    return {
      ok: true as const,
      data: {
        asha: asha as AshaRow | null,
        metrics: {
          patientsThisMonth: completedThisMonth,
          pending: pending.length,
          referrals,
          criticalAlerts: critical,
        },
        upcoming,
      },
    };
  });

export const getVisitDetail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: visit, error } = await sb.from("visits").select("*").eq("id", data.id).maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    if (!visit) return { ok: false as const, error: "Visit not found" };
    const { data: patient } = await sb.from("patients").select("*").eq("id", visit.patient_id).maybeSingle();
    return { ok: true as const, data: { ...(visit as VisitRow), patient: (patient as PatientRow) ?? null } };
  });

export const submitVisit = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      visitId: z.string().uuid(),
      status: z.enum(["Completed", "Referred"]),
      measurements: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
      aiSummary: z.string().max(2000).optional(),
      redFlags: z.array(z.string().max(300)).max(20).optional(),
      referralReason: z.string().max(500).optional(),
      urgency: z.enum(["green", "yellow", "red"]).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: visit, error } = await sb
      .from("visits")
      .update({
        status: data.status,
        measurements: data.measurements ?? null,
        ai_summary: data.aiSummary ?? null,
        red_flags: data.redFlags ?? [],
        referral_reason: data.referralReason ?? null,
        urgency: data.urgency ?? "green",
      })
      .eq("id", data.visitId)
      .select("asha_id")
      .single();
    if (error) return { ok: false as const, error: error.message };
    // bump visits_completed
    if (data.status === "Completed" && visit?.asha_id) {
      const { data: asha } = await sb.from("asha_workers").select("visits_completed").eq("id", visit.asha_id).maybeSingle();
      if (asha) {
        await sb.from("asha_workers").update({ visits_completed: (asha.visits_completed ?? 0) + 1 }).eq("id", visit.asha_id);
      }
    }
    return { ok: true as const };
  });
