import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { Download, MapPin, Award, Target, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/asha/profile")({
  component: AshaProfile,
  head: () => ({ meta: [{ title: "Swasthya Sathi — Profile" }] }),
});

function AshaProfile() {
  const { asha, logout } = useSession();
  const navigate = useNavigate();
  if (!asha) return null;
  const pct = Math.round((asha.visitsCompleted / asha.monthlyTarget) * 100);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-6 pt-6">
      <h1 className="font-display text-2xl font-bold">Profile</h1>

      <Card className="mt-4 overflow-hidden p-0">
        <div className="bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 font-display text-xl font-bold">
              {asha.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
            </div>
            <div>
              <p className="font-display text-xl font-bold">{asha.name}</p>
              <p className="text-sm opacity-90">{asha.workerId}</p>
              <p className="mt-0.5 text-xs opacity-80">ASHA Worker · NHM</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> Assigned villages
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {asha.villageCluster.map((v) => (
              <span key={v} className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">{v}</span>
            ))}
          </div>

          {/* "Map" placeholder */}
          <div className="mt-4 grid h-36 place-items-center rounded-lg border border-dashed bg-secondary/40 text-xs text-muted-foreground">
            Cluster map · {asha.villageCluster.length} villages · {asha.patientsAssigned} patients
          </div>
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Target className="h-3.5 w-3.5" /> Monthly performance
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold text-primary">{asha.visitsCompleted}</span>
          <span className="text-sm text-muted-foreground">/ {asha.monthlyTarget} visits</span>
          <span className="ml-auto rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">{pct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg bg-secondary/50 p-3">
            <Award className="mx-auto h-5 w-5 text-accent-foreground" />
            <p className="mt-1 font-display text-lg font-bold">4.8</p>
            <p className="text-[11px] text-muted-foreground">Quality rating</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <Target className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-1 font-display text-lg font-bold">{asha.patientsAssigned}</p>
            <p className="text-[11px] text-muted-foreground">Patients</p>
          </div>
        </div>
      </Card>

      <Button variant="outline" className="mt-4 h-12 w-full gap-2" onClick={() => toast.success("Report download started.")}>
        <Download className="h-4 w-4" /> Download monthly report
      </Button>

      <Button variant="ghost" className="mt-2 h-11 w-full gap-2 text-muted-foreground" onClick={() => { logout(); navigate({ to: "/" }); }}>
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}
