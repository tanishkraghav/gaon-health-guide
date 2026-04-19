import { cn } from "@/lib/utils";
import type { Urgency } from "@/lib/mockData";

const map: Record<Urgency, { label: string; cls: string }> = {
  green: { label: "Home care", cls: "bg-success-soft text-success border-success/30" },
  yellow: { label: "See ASHA", cls: "bg-warning-soft text-accent-foreground border-warning/40" },
  red: { label: "Urgent", cls: "bg-danger-soft text-danger border-danger/30" },
};

export function UrgencyBadge({ urgency, className }: { urgency: Urgency; className?: string }) {
  const m = map[urgency];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", m.cls, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", urgency === "green" && "bg-success", urgency === "yellow" && "bg-warning", urgency === "red" && "bg-danger")} />
      {m.label}
    </span>
  );
}

export function UrgencyDot({ urgency, className }: { urgency: Urgency; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full",
        urgency === "green" && "bg-success",
        urgency === "yellow" && "bg-warning",
        urgency === "red" && "bg-danger",
        className,
      )}
    />
  );
}
