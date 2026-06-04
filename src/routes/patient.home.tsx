import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mic, History, LogOut, Languages } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/lib/session";
import { LANGUAGES, t } from "@/lib/i18n";
import { getPatientRecentAlerts, type AlertRow } from "@/lib/data.functions";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/patient/home")({
  component: PatientHome,
  head: () => ({ meta: [{ title: "Swasthya Sathi — Patient" }] }),
});

function PatientHome() {
  const { lang, setLang, patient, role, logout } = useSession();
  const navigate = useNavigate();
  const [recent, setRecent] = useState<AlertRow[]>([]);

  useEffect(() => {
    if (role !== "patient") navigate({ to: "/" });
  }, [role, navigate]);

  useEffect(() => {
    if (!patient) return;
    void getPatientRecentAlerts({ data: { patientId: patient.id } }).then((r) => {
      if (r.ok) setRecent(r.data);
    });
  }, [patient]);

  if (!patient) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-soft/30 to-background pb-20">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-5 pt-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Namaste</p>
          <h1 className="font-display text-xl font-bold">{patient.name}</h1>
          <p className="text-xs text-muted-foreground">{patient.village} · {patient.age}{patient.gender}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-full border bg-card px-1.5 py-1 shadow-sm">
            <Languages className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
            <Select value={lang} onValueChange={(v) => setLang(v as typeof lang)}>
              <SelectTrigger className="h-7 w-[110px] border-0 bg-transparent px-1 text-xs shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button size="icon" variant="ghost" onClick={() => { logout(); navigate({ to: "/" }); }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center px-5 text-center">
        <Link
          to="/patient/triage"
          className="pulse-mic flex h-44 w-44 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 active:scale-95"
          aria-label="Start voice triage"
        >
          <Mic className="h-20 w-20" strokeWidth={1.6} />
        </Link>
        <p className="mt-8 max-w-sm font-display text-2xl font-semibold leading-snug text-foreground">
          {t("tapAndSpeak", lang)}
        </p>
        {lang !== "en" && (
          <p className="mt-1 text-sm text-muted-foreground">{t("tapAndSpeak", "en")}</p>
        )}
      </div>

      <div className="mx-auto mt-16 max-w-2xl px-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <History className="h-4 w-4" />
          {t("recentVisits", lang)}
          {lang !== "en" && <span className="text-xs font-normal">· {t("recentVisits", "en")}</span>}
        </div>
        <div className="space-y-2">
          {recent.length === 0 && (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No triage yet. Tap the mic to start.</p>
          )}
          {recent.map((r) => (
            <Card key={r.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.condition_guess || "Triage"}</p>
                <p className="truncate text-xs text-muted-foreground">{(r.symptoms || []).join(" · ") || r.symptom_summary}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <UrgencyBadge urgency={r.urgency} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
