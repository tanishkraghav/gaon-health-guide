import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Clock, ArrowUpRight, AlertTriangle, Plus, LogOut } from "lucide-react";
import { useSession } from "@/lib/session";
import { alertsForAsha, visitsForAsha, getPatient } from "@/lib/mockData";
import { UrgencyDot } from "@/components/UrgencyBadge";

export const Route = createFileRoute("/asha/home")({
  component: AshaHome,
  head: () => ({ meta: [{ title: "Swasthya Sathi — ASHA Dashboard" }] }),
});

function AshaHome() {
  const { asha, logout } = useSession();
  const navigate = useNavigate();
  if (!asha) return null;

  const visits = visitsForAsha(asha.id);
  const pending = visits.filter((v) => v.status === "Pending").length;
  const referrals = visits.filter((v) => v.status === "Referred").length;
  const alerts = alertsForAsha(asha.id);
  const critical = alerts.filter((a) => a.urgency === "red").length;
  const upcoming = visits.filter((v) => v.status === "Pending").slice(0, 3);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-6 pt-6">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Namaste</p>
          <h1 className="font-display text-2xl font-bold">{asha.name}</h1>
          <p className="text-xs text-muted-foreground">{asha.workerId} · {asha.villageCluster.join(", ")}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={() => { logout(); navigate({ to: "/" }); }}>
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Metrics */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Metric icon={Users} label="Patients" value={asha.patientsAssigned} sub="this month" tone="primary" />
        <Metric icon={Clock} label="Pending visits" value={pending} sub="to schedule" tone="amber" />
        <Metric icon={ArrowUpRight} label="Referrals" value={referrals} sub="made" tone="primary" />
        <Metric icon={AlertTriangle} label="Critical alerts" value={critical} sub="from patients" tone="danger" />
      </div>

      <div className="mt-5">
        <Button asChild size="lg" className="h-14 w-full gap-2 text-base shadow-md">
          <Link to="/asha/visits">
            <Plus className="h-5 w-5" /> Start new visit
          </Link>
        </Button>
      </div>

      <section className="mt-7">
        <h2 className="mb-3 font-display text-sm font-semibold text-muted-foreground">Upcoming visits</h2>
        <div className="space-y-2">
          {upcoming.length === 0 && (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No pending visits.</p>
          )}
          {upcoming.map((v) => {
            const p = getPatient(v.patientId);
            return (
              <Link key={v.id} to="/asha/visit/$id" params={{ id: v.id }}>
                <Card className="flex items-center justify-between gap-3 p-4 transition-shadow hover:shadow-md">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <UrgencyDot urgency={v.urgency} />
                      <p className="truncate font-medium">{p?.name}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{v.type} · {p?.village}</p>
                  </div>
                  <span className="text-xs font-medium text-primary">Open →</span>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub, tone }: { icon: typeof Users; label: string; value: number; sub: string; tone: "primary" | "amber" | "danger" }) {
  const toneCls = tone === "primary" ? "bg-primary-soft text-primary" : tone === "amber" ? "bg-warning-soft text-accent-foreground" : "bg-danger-soft text-danger";
  return (
    <Card className="p-4">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${toneCls}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="font-display text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-xs font-medium text-foreground">{label}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </Card>
  );
}
