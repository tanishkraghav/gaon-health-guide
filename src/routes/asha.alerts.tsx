import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/session";
import { alertsForAsha } from "@/lib/mockData";
import { UrgencyDot } from "@/components/UrgencyBadge";
import { MapPin, Clock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/asha/alerts")({
  component: AshaAlerts,
  head: () => ({ meta: [{ title: "Swasthya Sathi — Alerts" }] }),
});

function timeAgo(iso: string) {
  const ms = Date.now() - +new Date(iso);
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function AshaAlerts() {
  const { asha } = useSession();
  if (!asha) return null;
  const list = alertsForAsha(asha.id).sort((a, b) => +new Date(b.time) - +new Date(a.time));

  return (
    <div className="mx-auto max-w-2xl px-4 pb-6 pt-6">
      <h1 className="font-display text-2xl font-bold">Alerts</h1>
      <p className="text-xs text-muted-foreground">Patients in your cluster who triggered triage warnings.</p>

      <div className="mt-5 space-y-2.5">
        {list.length === 0 && (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No active alerts.</p>
        )}
        {list.map((a) => (
          <Card key={a.id} className={`overflow-hidden border-l-4 p-0 transition-shadow hover:shadow-md ${a.urgency === "red" ? "border-l-danger" : a.urgency === "yellow" ? "border-l-warning" : "border-l-success"}`}>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <UrgencyDot urgency={a.urgency} />
                    <p className="truncate font-semibold">{a.patientName}</p>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />{a.village}
                    <span className="mx-1">·</span>
                    <Clock className="h-3 w-3" />{timeAgo(a.time)}
                  </p>
                </div>
                {a.urgency === "red" && (
                  <span className="shrink-0 rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold uppercase text-danger-foreground">Urgent</span>
                )}
              </div>
              <p className="mt-3 text-sm">{a.symptomSummary}</p>
              <div className="mt-3 flex items-center justify-end">
                <Link to="/asha/visits" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  Open & start visit <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
