import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/lib/session";
import { getAshaVisits, type VisitRow } from "@/lib/data.functions";
import { UrgencyDot } from "@/components/UrgencyBadge";
import { Filter } from "lucide-react";

export const Route = createFileRoute("/asha/visits")({
  component: VisitList,
  head: () => ({ meta: [{ title: "Swasthya Sathi — Visits" }] }),
});

const TYPES = ["Antenatal", "Postnatal", "Child immunisation", "Sick child", "General illness"] as const;
const STATUS = ["Pending", "Completed", "Referred"] as const;

function VisitList() {
  const { asha } = useSession();
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [visits, setVisits] = useState<VisitRow[]>([]);

  useEffect(() => {
    if (!asha) return;
    void getAshaVisits({ data: { ashaId: asha.id, type, status } }).then((r) => {
      if (r.ok) setVisits(r.data);
    });
  }, [asha, type, status]);

  if (!asha) return null;
  const pendingId = visits.find((v) => v.status === "Pending")?.id || visits[0]?.id;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-6 pt-6">
      <h1 className="font-display text-2xl font-bold">Visits</h1>
      <p className="text-xs text-muted-foreground">All home visits across your village cluster.</p>

      <div className="mt-4 flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-9 w-[180px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-[140px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            {STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5 space-y-2">
        {visits.length === 0 && (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No visits match these filters.</p>
        )}
        {visits.map((v) => (
          <Link key={v.id} to="/asha/visit/$id" params={{ id: v.id }}>
            <Card className="flex items-center justify-between gap-3 p-4 transition-shadow hover:shadow-md">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <UrgencyDot urgency={v.urgency} />
                  <p className="truncate font-semibold">{v.patient?.name ?? "Patient"}</p>
                  {v.patient && <span className="text-xs text-muted-foreground">· {v.patient.age}{v.patient.gender}</span>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{v.type} · {v.patient?.village} · {new Date(v.date).toLocaleDateString()}</p>
              </div>
              <StatusPill status={v.status} />
            </Card>
          </Link>
        ))}
      </div>

      {pendingId && (
        <Button asChild className="mt-5 h-12 w-full" size="lg">
          <Link to="/asha/visit/$id" params={{ id: pendingId }}>Start guided visit</Link>
        </Button>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: VisitRow["status"] }) {
  const cls = status === "Completed" ? "bg-success-soft text-success" : status === "Pending" ? "bg-warning-soft text-accent-foreground" : "bg-danger-soft text-danger";
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{status}</span>;
}
