import { useState } from "react";
import { ArrowLeft, IdCard, Phone, Lock, User as UserIcon, MapPin, Home as HomeIcon, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { t, type LangCode } from "@/lib/i18n";
import {
  lookupAshaWorker,
  sendAshaOtp,
  verifyAshaOtp,
  setAshaPin,
  completeAshaProfile,
  loginAsha as loginAshaFn,
} from "@/lib/data.functions";
import { useSession } from "@/lib/session";
import { useNavigate } from "@tanstack/react-router";

type Stage =
  | "id"
  | "pin_login"
  | "otp"
  | "set_pin"
  | "profile";

interface WorkerInfo {
  workerId: string;
  status: string;
  phoneMasked: string;
}

const STEPS = ["stepVerifyPhone", "stepSetPin", "stepProfile"] as const;

export function AshaOnboarding({ lang, onBack }: { lang: LangCode; onBack: () => void }) {
  const { setAshaFromRow } = useSession();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>("id");
  const [worker, setWorker] = useState<WorkerInfo | null>(null);
  const [forgotMode, setForgotMode] = useState(false);

  // form state
  const [workerId, setWorkerId] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [pName, setPName] = useState("");
  const [pDistrict, setPDistrict] = useState("");
  const [pBlock, setPBlock] = useState("");
  const [pVillage, setPVillage] = useState("");
  const [pHouseholds, setPHouseholds] = useState("");
  const [busy, setBusy] = useState(false);

  const stepIndex = stage === "otp" ? 0 : stage === "set_pin" ? 1 : stage === "profile" ? 2 : -1;

  const onLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId.trim()) return;
    setBusy(true);
    try {
      const res = await lookupAshaWorker({ data: { workerId: workerId.trim() } });
      if (!res.ok) {
        toast.error(t("workerIdNotFound", lang));
        return;
      }
      setWorker(res.data);
      if (res.data.status === "active") {
        setStage("pin_login");
      } else if (res.data.status === "pending_profile") {
        // Already has PIN; go straight to profile
        setStage("profile");
      } else {
        setStage("otp");
      }
    } finally {
      setBusy(false);
    }
  };

  const onPinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker || loginPin.length !== 4) return;
    setBusy(true);
    try {
      const res = await loginAshaFn({ data: { workerId: worker.workerId, pin: loginPin } });
      if (!res.ok) {
        const next = loginAttempts + 1;
        setLoginAttempts(next);
        toast.error(t("incorrectPin", lang));
        setLoginPin("");
        return;
      }
      setAshaFromRow(res.data);
      navigate({ to: "/asha/home" });
    } finally {
      setBusy(false);
    }
  };

  const onSendOtp = async () => {
    if (!worker) return;
    setBusy(true);
    try {
      const res = await sendAshaOtp({ data: { workerId: worker.workerId } });
      if (!res.ok) { toast.error(res.error); return; }
      setOtpSent(true);
      toast.success(t("demoOtp", lang));
    } finally {
      setBusy(false);
    }
  };

  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker || otp.length !== 4) return;
    setBusy(true);
    try {
      const res = await verifyAshaOtp({ data: { workerId: worker.workerId, code: otp } });
      if (!res.ok) { toast.error(res.error || t("incorrectOtp", lang)); return; }
      setStage("set_pin");
    } finally {
      setBusy(false);
    }
  };

  const onSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;
    if (pin1.length !== 4 || pin2.length !== 4) return;
    if (pin1 !== pin2) { toast.error(t("pinsDoNotMatch", lang)); return; }
    setBusy(true);
    try {
      const res = await setAshaPin({ data: { workerId: worker.workerId, pin: pin1 } });
      if (!res.ok) { toast.error(res.error); return; }
      if (res.data.status === "active") {
        // Forgot-PIN flow: re-login automatically
        const lr = await loginAshaFn({ data: { workerId: worker.workerId, pin: pin1 } });
        if (lr.ok) {
          setAshaFromRow(lr.data);
          navigate({ to: "/asha/home" });
        }
        return;
      }
      setStage("profile");
    } finally {
      setBusy(false);
    }
  };

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;
    const hh = parseInt(pHouseholds, 10);
    if (!pName.trim() || !pDistrict.trim() || !pBlock.trim() || !pVillage.trim() || !Number.isFinite(hh)) {
      toast.error("Please fill all fields");
      return;
    }
    setBusy(true);
    try {
      const res = await completeAshaProfile({
        data: {
          workerId: worker.workerId,
          name: pName.trim(),
          district: pDistrict.trim(),
          block: pBlock.trim(),
          village: pVillage.trim(),
          householdCount: hh,
        },
      });
      if (!res.ok) { toast.error(res.error); return; }
      setAshaFromRow(res.data);
      toast.success("Welcome to Swasthya Sathi!");
      navigate({ to: "/asha/home" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mt-8 p-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to home
      </button>

      {stepIndex >= 0 && <Stepper lang={lang} current={stepIndex} />}

      {stage === "id" && (
        <>
          <h2 className="font-display text-xl font-semibold">{t("iAmAsha", lang)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("firstTimeHint", lang)}</p>
          <form onSubmit={onLookup} className="mt-5 space-y-4">
            <div>
              <Label className="flex items-center gap-1.5 text-sm">
                <IdCard className="h-3.5 w-3.5" /> {t("workerId", lang)}
              </Label>
              <Input
                className="mt-1.5 h-12 text-base"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value.toUpperCase())}
                placeholder="ASH-UP-2241"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={busy} className="h-12 w-full text-base">
              {t("continue", lang)}
            </Button>
          </form>
        </>
      )}

      {stage === "pin_login" && worker && (
        <>
          <h2 className="font-display text-xl font-semibold">{worker.workerId}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Enter your 4-digit PIN to sign in.</p>
          <form onSubmit={onPinLogin} className="mt-5 space-y-4">
            <div>
              <Label className="flex items-center gap-1.5 text-sm">
                <Lock className="h-3.5 w-3.5" /> {t("pin", lang)}
              </Label>
              <Input
                className="mt-1.5 h-12 text-center text-2xl tracking-[0.5em]"
                type="password"
                inputMode="numeric"
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                placeholder="••••"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={busy || loginPin.length !== 4} className="h-12 w-full text-base">
              {t("continue", lang)}
            </Button>
            {loginAttempts >= 3 && (
              <button
                type="button"
                onClick={() => {
                  setForgotMode(true);
                  setLoginPin("");
                  setLoginAttempts(0);
                  setStage("otp");
                }}
                className="block w-full text-center text-sm font-medium text-primary hover:underline"
              >
                {t("forgotPin", lang)}
              </button>
            )}
          </form>
        </>
      )}

      {stage === "otp" && worker && (
        <>
          <h2 className="font-display text-xl font-semibold">{t("stepVerifyPhone", lang)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("sendOtpTo", lang)} <span className="font-semibold text-foreground">{worker.phoneMasked}</span>
          </p>
          <div className="mt-5 space-y-4">
            {!otpSent ? (
              <Button onClick={onSendOtp} disabled={busy} className="h-12 w-full text-base">
                <Phone className="mr-2 h-4 w-4" /> {t("sendOtp", lang)}
              </Button>
            ) : (
              <form onSubmit={onVerifyOtp} className="space-y-4">
                <div>
                  <Label className="text-sm">OTP</Label>
                  <Input
                    className="mt-1.5 h-12 text-center text-2xl tracking-[0.5em]"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    maxLength={4}
                    placeholder="••••"
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{t("demoOtp", lang)}</p>
                </div>
                <Button type="submit" disabled={busy || otp.length !== 4} className="h-12 w-full text-base">
                  {t("verifyOtp", lang)}
                </Button>
                <button
                  type="button"
                  onClick={onSendOtp}
                  className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  Resend OTP
                </button>
              </form>
            )}
          </div>
        </>
      )}

      {stage === "set_pin" && (
        <>
          <h2 className="font-display text-xl font-semibold">{t("createPin", lang)}</h2>
          <form onSubmit={onSetPin} className="mt-5 space-y-4">
            <div>
              <Label className="flex items-center gap-1.5 text-sm">
                <Lock className="h-3.5 w-3.5" /> {t("newPin", lang)}
              </Label>
              <Input
                className="mt-1.5 h-12 text-center text-2xl tracking-[0.5em]"
                type="password"
                inputMode="numeric"
                value={pin1}
                onChange={(e) => setPin1(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                placeholder="••••"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-sm">{t("confirmPin", lang)}</Label>
              <Input
                className="mt-1.5 h-12 text-center text-2xl tracking-[0.5em]"
                type="password"
                inputMode="numeric"
                value={pin2}
                onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                placeholder="••••"
              />
              {pin2.length === 4 && pin1 !== pin2 && (
                <p className="mt-1 text-xs text-destructive">{t("pinsDoNotMatch", lang)}</p>
              )}
            </div>
            <Button type="submit" disabled={busy || pin1.length !== 4 || pin1 !== pin2} className="h-12 w-full text-base">
              {t("continue", lang)}
            </Button>
          </form>
        </>
      )}

      {stage === "profile" && worker && (
        <>
          <h2 className="font-display text-xl font-semibold">{t("completeProfile", lang)}</h2>
          <form onSubmit={onSaveProfile} className="mt-5 space-y-4">
            <div>
              <Label className="flex items-center gap-1.5 text-sm">
                <UserIcon className="h-3.5 w-3.5" /> {t("fullName", lang)}
              </Label>
              <Input className="mt-1.5 h-12 text-base" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Meena Kumari" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">{t("district", lang)}</Label>
                <Input className="mt-1.5 h-12 text-base" value={pDistrict} onChange={(e) => setPDistrict(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm">{t("block", lang)}</Label>
                <Input className="mt-1.5 h-12 text-base" value={pBlock} onChange={(e) => setPBlock(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-sm">
                <MapPin className="h-3.5 w-3.5" /> {t("village", lang)}
              </Label>
              <Input className="mt-1.5 h-12 text-base" value={pVillage} onChange={(e) => setPVillage(e.target.value)} />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-sm">
                <HomeIcon className="h-3.5 w-3.5" /> {t("households", lang)}
              </Label>
              <Input
                className="mt-1.5 h-12 text-base"
                inputMode="numeric"
                value={pHouseholds}
                onChange={(e) => setPHouseholds(e.target.value.replace(/\D/g, ""))}
                placeholder="150"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-sm">
                <Phone className="h-3.5 w-3.5" /> {t("phoneNumber", lang)}
              </Label>
              <Input className="mt-1.5 h-12 text-base bg-muted" value={worker.phoneMasked} disabled />
            </div>
            <Button type="submit" disabled={busy} className="h-12 w-full text-base">
              {t("saveAndContinue", lang)}
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}

function Stepper({ lang, current }: { lang: LangCode; current: number }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-2">
      {STEPS.map((key, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <div key={key} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done ? "bg-primary text-primary-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <div className={`truncate text-xs font-medium ${active || done ? "text-foreground" : "text-muted-foreground"}`}>
              {t(key, lang)}
            </div>
            {i < STEPS.length - 1 && <div className={`h-px flex-1 ${done ? "bg-primary" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}
