import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useSession } from "@/lib/session";
import { t } from "@/lib/i18n";

export function OfflineBanner() {
  const { lang } = useSession();
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const u = () => setOnline(navigator.onLine);
    u();
    window.addEventListener("online", u);
    window.addEventListener("offline", u);
    return () => {
      window.removeEventListener("online", u);
      window.removeEventListener("offline", u);
    };
  }, []);
  if (online) return null;
  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-warning-soft px-3 py-1.5 text-xs font-medium text-accent-foreground border-b border-warning/40">
      <WifiOff className="h-3.5 w-3.5" />
      {t("offlineBanner", lang)}
    </div>
  );
}
