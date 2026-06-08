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
      name: z.string().min(1).max(100),
      age: z.number().int().min(0).max(120),
      gender: z.enum(["F", "M"]),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { admin } = await import("./data.server"); const sb = admin();
    const { data: existing } = await sb
      .from("patients")
      .select("*")
      .eq("phone", data.phone)
      .maybeSingle();

    if (existing) {
      const { data: updated, error: updErr } = await sb
        .from("patients")
        .update({
          name: data.name,
          age: data.age,
          gender: data.gender,
          village: data.village,
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (updErr) return { ok: false as const, error: updErr.message };
      return { ok: true as const, data: updated as PatientRow };
    }


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
        name: data.name,
        age: data.age,
        gender: data.gender,
        assigned_asha: assigned,
      })
      .select("*")
      .single();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, data: created as PatientRow };
  });


async function sha256(s: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(s).digest("hex");
}


function maskPhone(p: string | null | undefined): string {
  if (!p) return "******";
  const last4 = p.slice(-4);
  return "******" + last4;
}

export const lookupAshaWorker = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ workerId: z.string().min(1).max(60) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { admin } = await import("./data.server"); const sb = admin();
    const { data: row, error } = await sb
      .from("asha_workers")
      .select("worker_id, phone, registration_status, name")
      .ilike("worker_id", data.workerId)
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    if (!row) return { ok: false as const, error: "not_found" };
    return {
      ok: true as const,
      data: {
        workerId: row.worker_id,
        status: (row.registration_status as string) || "unregistered",
        phoneMasked: maskPhone(row.phone as string | null),
      },
    };
  });

export const sendAshaOtp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ workerId: z.string().min(1).max(60) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { admin } = await import("./data.server"); const sb = admin();
    const { data: row } = await sb
      .from("asha_workers")
      .select("worker_id, phone")
      .ilike("worker_id", data.workerId)
      .maybeSingle();
    if (!row) return { ok: false as const, error: "Worker ID not found" };
    // Demo: always 1234
    const code = "1234";
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error } = await sb.from("otp_requests").insert({
      worker_id: row.worker_id,
      otp_code: code,
      expires_at: expires,
      used: false,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, data: { phoneMasked: maskPhone(row.phone as string | null) } };
  });

export const verifyAshaOtp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      workerId: z.string().min(1).max(60),
      code: z.string().regex(/^\d{4}$/),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { admin } = await import("./data.server"); const sb = admin();
    const { data: rows } = await sb
      .from("otp_requests")
      .select("*")
      .ilike("worker_id", data.workerId)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1);
    const otp = rows?.[0];
    if (!otp) return { ok: false as const, error: "No active OTP. Please request a new one." };
    if (new Date(otp.expires_at).getTime() < Date.now())
      return { ok: false as const, error: "OTP expired. Request a new one." };
    if (otp.otp_code !== data.code)
      return { ok: false as const, error: "Incorrect OTP. Please try again." };
    await sb.from("otp_requests").update({ used: true }).eq("id", otp.id);
    // Bump status to pending_pin if currently unregistered
    const { data: worker } = await sb
      .from("asha_workers")
      .select("worker_id, registration_status")
      .ilike("worker_id", data.workerId)
      .maybeSingle();
    if (worker && worker.registration_status === "unregistered") {
      await sb
        .from("asha_workers")
        .update({ registration_status: "pending_pin" })
        .eq("worker_id", worker.worker_id);
    }
    return { ok: true as const };
  });

export const setAshaPin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      workerId: z.string().min(1).max(60),
      pin: z.string().regex(/^\d{4}$/),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { admin } = await import("./data.server"); const sb = admin();
    const { data: worker } = await sb
      .from("asha_workers")
      .select("worker_id, registration_status")
      .ilike("worker_id", data.workerId)
      .maybeSingle();
    if (!worker) return { ok: false as const, error: "Worker not found" };
    const hash = await sha256(data.pin);
    // If profile not yet complete, move to pending_profile; otherwise keep active (forgot-pin reset)
    const nextStatus =
      worker.registration_status === "active" ? "active" : "pending_profile";
    const { error } = await sb
      .from("asha_workers")
      .update({ pin_hash: hash, pin: data.pin, registration_status: nextStatus })
      .eq("worker_id", worker.worker_id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, data: { status: nextStatus } };
  });

export const completeAshaProfile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      workerId: z.string().min(1).max(60),
      name: z.string().min(1).max(120),
      district: z.string().min(1).max(120),
      block: z.string().min(1).max(120),
      village: z.string().min(1).max(120),
      householdCount: z.number().int().min(0).max(100000),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { admin } = await import("./data.server"); const sb = admin();
    const { data: row, error } = await sb
      .from("asha_workers")
      .update({
        name: data.name,
        district: data.district,
        block: data.block,
        village: data.village,
        household_count: data.householdCount,
        registration_status: "active",
      })
      .ilike("worker_id", data.workerId)
      .select("*")
      .single();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, data: row as AshaRow };
  });

export const loginAsha = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      workerId: z.string().min(1).max(60),
      pin: z.string().regex(/^\d{4}$/),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { admin } = await import("./data.server"); const sb = admin();
    const { data: row, error } = await sb
      .from("asha_workers")
      .select("*")
      .ilike("worker_id", data.workerId)
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    if (!row) return { ok: false as const, error: "Worker ID not found" };
    if (row.registration_status !== "active")
      return { ok: false as const, error: "Account not yet activated" };
    const hash = await sha256(data.pin);
    if (row.pin_hash !== hash)
      return { ok: false as const, error: "Incorrect PIN. Please try again." };
    return { ok: true as const, data: row as AshaRow };
  });


// ---------- Patient ----------

export const getPatientRecentAlerts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ patientId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { admin, attachPatientNames } = await import("./data.server"); const sb = admin();
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
    const { admin, attachPatientNames } = await import("./data.server"); const sb = admin();
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
    const { admin, attachPatientNames } = await import("./data.server"); const sb = admin();
    const { error } = await sb
      .from("triage_alerts")
      .update({ notified: true, notified_at: new Date().toISOString() })
      .eq("id", data.alertId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ---------- ASHA ----------


export const getAshaAlerts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ ashaId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { admin, attachPatientNames } = await import("./data.server"); const sb = admin();
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
    const { admin, attachPatientNames } = await import("./data.server"); const sb = admin();
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
    const { admin, attachPatientNames } = await import("./data.server"); const sb = admin();
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
    const { admin, attachPatientNames } = await import("./data.server"); const sb = admin();
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
    const { admin, attachPatientNames } = await import("./data.server"); const sb = admin();
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
