import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { User, Stethoscope, Languages, Phone, MapPin, Heart, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES, t } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { toast } from "sonner";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import type { LocationResult } from "@/lib/locationProvider";
import { AshaOnboarding } from "@/components/AshaOnboarding";

export const Route = createFileRoute("/")({
  component: LoginScreen,
  head: () => ({
    meta: [
      { title: "Swasthya Sathi — Sign in" },
      { name: "description", content: "Sign in as a patient or ASHA worker to access Swasthya Sathi." },
    ],
  }),
});

function LoginScreen() {
  const { lang, setLang, loginPatient } = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<null | "patient" | "asha">(null);

  // Patient form
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"F" | "M">("F");

  const onPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const ageNum = parseInt(age, 10);
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 120) {
      toast.error("Please enter a valid age");
      return;
    }
    if (!location) {
      toast.error("Please select your village or town from the suggestions");
      return;
    }
    if (phone.trim().length < 10) {
      toast.error("Please enter a 10-digit phone number");
      return;
    }
    try {
      await loginPatient({
        village: location.locationName,
        phone: phone.trim(),
        name: name.trim(),
        age: ageNum,
        gender,
      });
      navigate({ to: "/patient/home" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-soft/40 via-background to-background">
      {/* Top bar with language */}
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2 text-primary">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Heart className="h-5 w-5" fill="currentColor" />
          </div>
          <span className="font-display text-lg font-bold">Swasthya Sathi</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-card px-2.5 py-1.5 shadow-sm">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <Select value={lang} onValueChange={(v) => setLang(v as typeof lang)}>
            <SelectTrigger className="h-7 w-[150px] border-0 bg-transparent px-1 text-sm shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  <span className="font-medium">{l.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{l.english}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 pb-16 pt-10">
        {/* Hero */}
        <div className="text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {t("appName", lang)}
          </h1>
          {lang !== "en" && (
            <p className="mt-1 text-base text-muted-foreground">Swasthya Sathi</p>
          )}
          <p className="mt-3 text-lg text-muted-foreground">
            {t("tagline", lang)}
            {lang !== "en" && <span className="ml-2 text-sm">· {t("tagline", "en")}</span>}
          </p>
        </div>

        {/* Role cards or selected form */}
        {!mode && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <RoleCard
              icon={<User className="h-7 w-7" />}
              title={t("iAmPatient", lang)}
              english={t("iAmPatient", "en")}
              tone="primary"
              onClick={() => setMode("patient")}
            />
            <RoleCard
              icon={<Stethoscope className="h-7 w-7" />}
              title={t("iAmAsha", lang)}
              english={t("iAmAsha", "en")}
              tone="accent"
              onClick={() => setMode("asha")}
            />
          </div>
        )}

        {mode === "patient" && (
          <Card className="mt-8 p-6">
            <button
              type="button"
              onClick={() => setMode(null)}
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to home
            </button>
            <h2 className="font-display text-xl font-semibold">{t("iAmPatient", lang)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">No password needed — just your village & phone.</p>
            <form onSubmit={onPatient} className="mt-5 space-y-4">
              <div>
                <Label className="flex items-center gap-1.5 text-sm">
                  <User className="h-3.5 w-3.5" /> Full name
                </Label>
                <Input className="mt-1.5 h-12 text-base" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunita Devi" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Age</Label>
                  <Input className="mt-1.5 h-12 text-base" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} maxLength={3} placeholder="30" />
                </div>
                <div>
                  <Label className="text-sm">Gender</Label>
                  <Select value={gender} onValueChange={(v) => setGender(v as "F" | "M")}>
                    <SelectTrigger className="mt-1.5 h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="M">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-sm">
                  <MapPin className="h-3.5 w-3.5" /> {t("villageName", lang)}
                </Label>
                <LocationAutocomplete
                  className="mt-1.5"
                  value={location}
                  onChange={setLocation}
                  placeholder="Rampur"
                />
                {location && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[location.district, location.state, location.country].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-sm">
                  <Phone className="h-3.5 w-3.5" /> {t("phoneNumber", lang)}
                </Label>
                <Input className="mt-1.5 h-12 text-base" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} maxLength={10} placeholder="9876500001" />
                <p className="mt-1 text-xs text-muted-foreground">Existing patients: phone is the unique key.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setMode(null)}>Back</Button>
                <Button type="submit" className="flex-1 h-12 text-base">{t("continue", lang)}</Button>
              </div>
            </form>
          </Card>
        )}

        {mode === "asha" && (
          <AshaOnboarding lang={lang} onBack={() => setMode(null)} />
        )}


        <p className="mt-10 text-center text-xs text-muted-foreground">
          Built for the National Health Mission (NHM) ecosystem · Demo build
        </p>
      </div>
    </div>
  );
}

function RoleCard({ icon, title, english, tone, onClick }: { icon: React.ReactNode; title: string; english: string; tone: "primary" | "accent"; onClick: () => void }) {
  const isPrimary = tone === "primary";
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-start gap-4 rounded-2xl border p-6 text-left shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isPrimary ? "bg-primary text-primary-foreground border-primary/20" : "bg-card text-card-foreground border-accent/30 hover:border-accent/60"
      }`}
    >
      <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${isPrimary ? "bg-white/15 text-primary-foreground" : "bg-warning-soft text-accent-foreground"}`}>
        {icon}
      </div>
      <div>
        <div className="font-display text-xl font-bold">{title}</div>
        {english !== title && <div className={`text-sm ${isPrimary ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{english}</div>}
      </div>
      <div className={`text-xs ${isPrimary ? "text-primary-foreground/70" : "text-muted-foreground"}`}>Tap to continue →</div>
    </button>
  );
}
