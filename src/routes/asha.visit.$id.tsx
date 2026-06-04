import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle2, Loader2, Stethoscope, Send } from "lucide-react";
import { getVisitDetail, submitVisit, type VisitRow, type PatientRow } from "@/lib/data.functions";
import { ashaDecisionSupport } from "@/server/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/asha/visit/$id")({
  component: ActiveVisit,
  head: () => ({ meta: [{ title: "Swasthya Sathi — Active Visit" }] }),
});

interface Step {
  key: string;
  question: string;
  type: "number" | "boolean" | "select" | "text";
  options?: string[];
  unit?: string;
  redFlag?: (v: unknown) => string | null;
}

function getProtocol(visitType: string): Step[] {
  if (visitType === "Antenatal") {
    return [
      { key: "weeks", question: "Weeks of pregnancy", type: "number", unit: "weeks" },
      { key: "bp_sys", question: "Systolic BP", type: "number", unit: "mmHg", redFlag: (v) => Number(v) >= 140 ? "BP ≥ 140 — possible pre-eclampsia, consider referral." : null },
      { key: "bp_dia", question: "Diastolic BP", type: "number", unit: "mmHg", redFlag: (v) => Number(v) >= 90 ? "Diastolic ≥ 90 — possible pre-eclampsia." : null },
      { key: "weight", question: "Weight", type: "number", unit: "kg" },
      { key: "fetal_movement", question: "Foetal movement felt today?", type: "boolean", redFlag: (v) => v === false ? "No foetal movement — refer urgently to PHC." : null },
      { key: "swelling", question: "Swelling in hands/feet/face?", type: "boolean", redFlag: (v) => v === true ? "Oedema present — monitor BP and urine protein." : null },
      { key: "bleeding", question: "Any vaginal bleeding?", type: "boolean", redFlag: (v) => v === true ? "Bleeding in pregnancy — refer immediately." : null },
      { key: "notes", question: "Additional notes", type: "text" },
    ];
  }
  if (visitType === "Sick child") {
    return [
      { key: "age_months", question: "Age in months", type: "number", unit: "months" },
      { key: "fever_c", question: "Temperature", type: "number", unit: "°C", redFlag: (v) => Number(v) >= 39 ? "High fever ≥ 39°C in child — consider referral." : null },
      { key: "feeding", question: "Drinking/feeding well?", type: "boolean", redFlag: (v) => v === false ? "Poor feeding — danger sign in young child." : null },
      { key: "breathing", question: "Fast/difficult breathing?", type: "boolean", redFlag: (v) => v === true ? "Breathing difficulty — refer urgently." : null },
      { key: "diarrhoea", question: "Diarrhoea (>3 stools/day)?", type: "boolean" },
      { key: "notes", question: "Additional notes", type: "text" },
    ];
  }
  return [
    { key: "main_complaint", question: "Main complaint", type: "select", options: ["Fever", "Cough", "Pain", "Weakness", "Other"] },
    { key: "duration_days", question: "Duration", type: "number", unit: "days" },
    { key: "fever_c", question: "Temperature", type: "number", unit: "°C", redFlag: (v) => Number(v) >= 40 ? "Very high fever ≥ 40°C." : null },
    { key: "danger_signs", question: "Any danger signs (chest pain, breathing trouble, blood)?", type: "boolean", redFlag: (v) => v === true ? "Danger sign reported — refer to PHC." : null },
    { key: "notes", question: "Additional notes", type: "text" },
  ];
}

interface AIResult {
  red_flags: string[];
  protocol_next_step: string;
  referral_recommended: boolean;
  referral_reason: string;
  visit_notes_summary: string;
}

function ActiveVisit() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [visit, setVisit] = useState<VisitRow | null>(null);
  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [loading, setLoading] = useState(true);
  const protocol = useMemo(() => visit ? getProtocol(visit.type) : [], [visit]);

  const [stepIdx, setStepIdx] = useState(0);
  const [data, setData] = useState<Record<string, string | number | boolean>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [aiStarted, setAiStarted] = useState(false);

  useEffect(() => {
    void getVisitDetail({ data: { id } }).then((r) => {
      if (r.ok) {
        setVisit(r.data);
        setPatient(r.data.patient ?? null);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="mx-auto max-w-2xl px-4 pt-10 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>;
  }

  if (!visit || !patient) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-10 text-center">
        <p className="text-muted-foreground">Visit not found.</p>
        <Button className="mt-4" onClick={() => navigate({ to: "/asha/visits" })}>Back to visits</Button>
      </div>
    );
  }

  const isReview = stepIdx >= protocol.length;
  const step = protocol[stepIdx];
  const currentRedFlag = step?.redFlag && data[step.key] !== undefined ? step.redFlag(data[step.key]) : null;

  const setVal = (k: string, v: string | number | boolean) => setData((d) => ({ ...d, [k]: v }));
  const next = () => setStepIdx((i) => Math.min(protocol.length, i + 1));
  const prev = () => setStepIdx((i) => Math.max(0, i - 1));

  async function runAI() {
    if (!visit || !patient) return;
    setAiLoading(true);
    try {
      const res = await ashaDecisionSupport({
        data: {
          visitType: visit.type,
          patientSummary: `${patient.name}, ${patient.age}${patient.gender}, village ${patient.village}${patient.pregnant ? ", currently pregnant" : ""}.`,
          measurements: data,
        },
      });
      if (!res.ok) toast.error(res.error);
      else setAiResult(res.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setAiLoading(false);
    }
  }

  if (isReview && !aiResult && !aiLoading && !aiStarted) {
    setAiStarted(true);
    void runAI();
  }

  async function onSubmit(referral: boolean) {
    if (!visit || !aiResult) return;
    setSubmitted(true);
    const hasRed = aiResult.red_flags.length > 0 || referral;
    const urgency = referral ? "red" : hasRed ? "yellow" : "green";
    const res = await submitVisit({
      data: {
        visitId: visit.id,
        status: referral ? "Referred" : "Completed",
        measurements: data,
        aiSummary: aiResult.visit_notes_summary,
        redFlags: aiResult.red_flags,
        referralReason: referral ? aiResult.referral_reason || "Referred by ASHA" : undefined,
        urgency,
      },
    });
    if (!res.ok) {
      toast.error(res.error);
      setSubmitted(false);
      return;
    }
    toast.success(referral ? "Referral sent to PHC." : "Visit saved.");
    setTimeout(() => navigate({ to: "/asha/visits" }), 700);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-6 pt-6">
      <button onClick={() => navigate({ to: "/asha/visits" })} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to visits
      </button>

      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{visit.type}</p>
            <h1 className="mt-1 font-display text-xl font-bold">{patient.name}</h1>
            <p className="text-xs text-muted-foreground">{patient.age}{patient.gender} · {patient.village}{patient.pregnant ? " · Pregnant" : ""}</p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
            {isReview ? "Review" : `Step ${stepIdx + 1} of ${protocol.length}`}
          </span>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, ((stepIdx) / protocol.length) * 100)}%` }} />
        </div>
      </Card>

      {!isReview && step && (
        <Card className="mt-4 p-5">
          <Label className="text-base font-medium">{step.question}</Label>
          {step.type === "number" && (
            <div className="mt-3 flex items-center gap-2">
              <Input
                type="number"
                inputMode="decimal"
                value={data[step.key] !== undefined ? String(data[step.key]) : ""}
                onChange={(e) => setVal(step.key, e.target.value === "" ? 0 : Number(e.target.value))}
                className="h-12 text-base"
              />
              {step.unit && <span className="text-sm text-muted-foreground">{step.unit}</span>}
            </div>
          )}
          {step.type === "boolean" && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border bg-secondary/40 p-3">
              <Switch checked={!!data[step.key]} onCheckedChange={(v) => setVal(step.key, v)} />
              <span className="text-sm">{data[step.key] ? "Yes" : "No"}</span>
            </div>
          )}
          {step.type === "select" && (
            <Select value={(data[step.key] as string) ?? ""} onValueChange={(v) => setVal(step.key, v)}>
              <SelectTrigger className="mt-3 h-12 text-base"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {step.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {step.type === "text" && (
            <Textarea value={(data[step.key] as string) ?? ""} onChange={(e) => setVal(step.key, e.target.value)} className="mt-3 min-h-[100px]" />
          )}

          {currentRedFlag && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger/40 bg-danger-soft/60 p-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
              <p className="text-sm font-medium text-foreground">{currentRedFlag}</p>
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <Button variant="outline" onClick={prev} disabled={stepIdx === 0} className="flex-1 gap-1"><ArrowLeft className="h-4 w-4" /> Back</Button>
            <Button onClick={next} className="flex-1 gap-1">Next <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </Card>
      )}

      {isReview && (
        <Card className="mt-4 p-5">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Visit summary</h2>
          </div>

          {aiLoading && (
            <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Analysing measurements with NHM protocol…
            </div>
          )}

          {aiResult && (
            <div className="mt-5 space-y-4">
              {aiResult.red_flags.length > 0 && (
                <div className="rounded-lg border border-danger/40 bg-danger-soft/50 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-danger">
                    <AlertTriangle className="h-4 w-4" /> Red flags
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {aiResult.red_flags.map((f, i) => <li key={i} className="flex gap-2"><span>•</span>{f}</li>)}
                  </ul>
                </div>
              )}
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next step</p>
                <p className="mt-1 text-sm">{aiResult.protocol_next_step}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm leading-relaxed">{aiResult.visit_notes_summary}</p>
              </div>
              {aiResult.referral_recommended && (
                <div className="rounded-lg border border-warning/40 bg-warning-soft/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent-foreground">Referral recommended</p>
                  <p className="mt-1 text-sm">{aiResult.referral_reason}</p>
                </div>
              )}
              {!submitted ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button className="h-12 gap-2" onClick={() => onSubmit(false)}>
                    <Send className="h-4 w-4" /> Submit & save
                  </Button>
                  <Button variant="outline" className="h-12 gap-2 border-warning/50 text-accent-foreground" onClick={() => onSubmit(true)}>
                    Refer to PHC
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-success-soft p-3 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" /> Saved.
                </div>
              )}
            </div>
          )}

          {!aiResult && !aiLoading && (
            <Button className="mt-4 w-full" onClick={runAI}>Run decision support</Button>
          )}
        </Card>
      )}
    </div>
  );
}
