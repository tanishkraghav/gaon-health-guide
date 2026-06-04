import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home, ClipboardList, Bell, User } from "lucide-react";
import { useSession } from "@/lib/session";
import { getAshaAlerts } from "@/lib/data.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/asha")({
  component: AshaLayout,
});

function AshaLayout() {
  const { role, asha } = useSession();
  const navigate = useNavigate();
  const loc = useLocation();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (role !== "asha") navigate({ to: "/" });
  }, [role, navigate]);

  useEffect(() => {
    if (!asha) return;
    const load = () =>
      getAshaAlerts({ data: { ashaId: asha.id } }).then((r) => {
        if (r.ok) setAlertCount(r.data.filter((a) => a.urgency !== "green" && !a.acknowledged).length);
      });
    void load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [asha, loc.pathname]);

  if (!asha) return null;

  const tabs = [
    { to: "/asha/home", label: "Home", icon: Home, match: "/asha/home" },
    { to: "/asha/visits", label: "Visits", icon: ClipboardList, match: "/asha/visit" },
    { to: "/asha/alerts", label: "Alerts", icon: Bell, match: "/asha/alerts", badge: alertCount },
    { to: "/asha/profile", label: "Profile", icon: User, match: "/asha/profile" },
  ] as const;

  return (
    <div className="min-h-screen bg-secondary/30 pb-24">
      <Outlet />
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-2xl grid-cols-4">
          {tabs.map((t) => {
            const active = loc.pathname.startsWith(t.match);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.4]")} />
                {t.label}
                {"badge" in t && t.badge && t.badge > 0 ? (
                  <span className="absolute right-[calc(50%-22px)] top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-danger-foreground">
                    {t.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
