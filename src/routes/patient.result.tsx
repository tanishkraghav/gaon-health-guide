import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Phone, MapPin, Printer, Bell, ArrowLeft, ThumbsUp, ThumbsDown, AlertTriangle, CheckCircle2, Hospital, Loader2 } from "lucide-react";
import { useSession } from "@/lib/session";
import { saveTriageResult, notifyAshaForAlert } from "@/lib/data.functions";
import { toast } from "sonner";

interface TriageResult {
  urgency: "green" | "yellow" | "red";
  conditionGuess: string;
  homeRemedy: string;
  referralReason: string;
  confidence: number;
  summary: string;
  symptoms: string[];
}

export const Route = createFileRoute("/patient/result")({
  component: ResultPage,
  head: () => ({ meta: [{ title: "Swasthya Sathi — Result" }] }),
});

function ResultPage() {
  const { patient, role } = useSession();
  const navigate = useNavigate();
  const [result, setResult] = useState<TriageResult | null>(null);
  const [alertId, setAlertId] = useState<string | null>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    if (role !== "patient") { navigate({ to: "/" }); return; }
    try {
      const raw = sessionStorage.getItem("triage-result");
      if (raw) setResult(JSON.parse(raw));
      else navigate({ to: "/patient/triage" });
    } catch { /* ignore */ }
  }, [role, navigate]);

  // Persist alert to backend so ASHA can see it.
  useEffect(() => {
    if (!result || !patient || savedRef.current) return;
    savedRef.current = true;
    void saveTriageResult({
      data: {
        patientId: patient.id,
        urgency: result.urgency,
        conditionGuess: result.conditionGuess || undefined,
        symptomSummary: result.summary || result.conditionGuess || "Patient triage",
        symptoms: result.symptoms.slice(0, 20),
      },
    }).then((r) => {
      if (r.ok) setAlertId(r.data.id);
      else toast.error("Couldn't sync to ASHA: " + r.error);
    });
  }, [result, patient]);

  if (!result || !patient) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
        <Button size="icon" variant="ghost" onClick={() => navigate({ to: "/patient/home" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-base font-semibold">Triage result</h1>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {result.urgency === "green" && <GreenCard result={result} />}
        {result.urgency === "yellow" && <YellowCard result={result} village={patient.village} alertId={alertId} />}
        {result.urgency === "red" && <RedCard result={result} patientName={patient.name} symptoms={result.symptoms} />}

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Symptoms shared</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {result.symptoms.map((s, i) => (
              <li key={i} className="flex gap-2"><span className="text-muted-foreground">•</span>{s}</li>
            ))}
          </ul>
          {result.confidence > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">AI confidence: {Math.round(result.confidence * 100)}%</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function GreenCard({ result }: { result: TriageResult }) {
  return (
    <Card className="border-success/40 bg-success-soft/40 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success text-success-foreground">
          <Home className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-success">Home care</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-foreground">{result.conditionGuess || "Mild illness"}</h2>
          <p className="mt-2 text-sm text-foreground/80">{result.summary}</p>
        </div>
      </div>
      {result.homeRemedy && (
        <div className="mt-5 rounded-lg border border-success/30 bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Care at home</p>
          <p className="mt-1.5 text-sm leading-relaxed">{result.homeRemedy}</p>
        </div>
      )}
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">In 24 hours, how do you feel?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-12 gap-2 border-success/40" onClick={() => toast.success("Glad you feel better!")}>
            <ThumbsUp className="h-4 w-4 text-success" /> I feel better
          </Button>
          <Button variant="outline" className="h-12 gap-2 border-warning/40" onClick={() => toast.info("Re-running triage…")}>
            <ThumbsDown className="h-4 w-4 text-danger" /> Worsened
          </Button>
        </div>
      </div>
    </Card>
  );
}

function YellowCard({ result, village, alertId }: { result: TriageResult; village: string; alertId: string | null }) {
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);

  const onNotify = async () => {
    if (!alertId) {
      toast.error("Still syncing — try again in a moment.");
      return;
    }
    setNotifying(true);
    const r = await notifyAshaForAlert({ data: { alertId } });
    setNotifying(false);
    if (r.ok) {
      setNotified(true);
      toast.success("ASHA worker notified — she'll see this in her alerts.");
    } else {
      toast.error(r.error);
    }
  };

  return (
    <Card className="border-warning/50 bg-warning-soft/50 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning text-accent-foreground">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-foreground/80">Visit ASHA worker</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-foreground">{result.conditionGuess || "Needs check-up"}</h2>
          <p className="mt-2 text-sm text-foreground/80">{result.referralReason || result.summary}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3 rounded-lg border border-warning/40 bg-card p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary">
          AW
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Your ASHA worker</p>
          <p className="text-xs text-muted-foreground"><MapPin className="mr-0.5 inline h-3 w-3" />{village}</p>
        </div>
      </div>
      <Button className="mt-4 h-12 w-full gap-2" onClick={onNotify} disabled={notifying || notified}>
        {notifying ? <Loader2 className="h-4 w-4 animate-spin" /> : notified ? <CheckCircle2 className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        {notified ? "ASHA notified" : "Notify her I'm coming"}
      </Button>
    </Card>
  );
}

function RedCard({ result, patientName, symptoms }: { result: TriageResult; patientName: string; symptoms: string[] }) {
  const onPrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Symptoms — ${patientName}</title></head><body style="font-family: sans-serif; padding: 32px; max-width: 600px;">
      <h1 style="margin:0">Patient: ${patientName}</h1>
      <p>Date: ${new Date().toLocaleString()}</p>
      <h2>Likely condition</h2><p>${result.conditionGuess}</p>
      <h2>Symptoms</h2><ul>${symptoms.map((s) => `<li>${s}</li>`).join("")}</ul>
      <h2>Reason for referral</h2><p>${result.referralReason}</p>
      <hr/><p style="font-size:12px;color:#666">Generated by Swasthya Sathi triage assistant. Not a definitive diagnosis.</p>
    </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Card className="border-danger/50 bg-danger-soft/40 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-danger text-danger-foreground">
          <Hospital className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-danger">Go to hospital — urgent</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-foreground">{result.conditionGuess || "Possible emergency"}</h2>
          <p className="mt-2 text-sm text-foreground/80">{result.referralReason || result.summary}</p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-danger/30 bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nearest facility</p>
        <p className="mt-1 font-semibold">PHC Belwa</p>
        <p className="text-xs text-muted-foreground"><MapPin className="mr-0.5 inline h-3 w-3" />4.2 km · ~12 min by road</p>
        <a
          href="https://www.google.com/maps/search/PHC+Belwa+Uttar+Pradesh"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Open directions →
        </a>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button asChild className="h-12 gap-2 bg-danger text-danger-foreground hover:bg-danger/90">
          <a href="tel:108"><Phone className="h-4 w-4" /> Call ambulance (108)</a>
        </Button>
        <Button variant="outline" className="h-12 gap-2" onClick={onPrint}>
          <Printer className="h-4 w-4" /> Print summary
        </Button>
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-success/30 bg-success-soft/40 p-3 text-xs">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
        <p>Show this summary to the doctor at the facility.</p>
      </div>
    </Card>
  );
}
