import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { LANGUAGES, type LangCode } from "./i18n";
import { loginPatient as loginPatientFn, loginAsha as loginAshaFn, type PatientRow, type AshaRow } from "./data.functions";

type Role = "patient" | "asha" | null;

export interface SessionPatient {
  id: string;
  name: string;
  age: number;
  gender: "F" | "M";
  village: string;
  phone: string;
  pregnant: boolean;
  assignedAsha: string | null;
}

export interface SessionAsha {
  id: string;
  workerId: string;
  name: string;
  villageCluster: string[];
  patientsAssigned: number;
  monthlyTarget: number;
  visitsCompleted: number;
}

interface SessionState {
  role: Role;
  lang: LangCode;
  patient: SessionPatient | null;
  asha: SessionAsha | null;
  setLang: (l: LangCode) => void;
  loginPatient: (input: { village: string; phone: string; name: string; age: number; gender: "F" | "M" }) => Promise<SessionPatient>;
  loginAsha: (workerId: string, pin: string) => Promise<SessionAsha | null>;
  logout: () => void;
}

const SessionCtx = createContext<SessionState | null>(null);
const STORAGE_KEY = "swasthya-session-v2";

function toSessionPatient(r: PatientRow): SessionPatient {
  return {
    id: r.id,
    name: r.name,
    age: r.age,
    gender: (r.gender as "F" | "M") ?? "F",
    village: r.village,
    phone: r.phone,
    pregnant: r.pregnant,
    assignedAsha: r.assigned_asha,
  };
}

function toSessionAsha(r: AshaRow): SessionAsha {
  return {
    id: r.id,
    workerId: r.worker_id,
    name: r.name,
    villageCluster: r.village_cluster,
    patientsAssigned: r.patients_assigned,
    monthlyTarget: r.monthly_target,
    visitsCompleted: r.visits_completed,
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [lang, setLangState] = useState<LangCode>("hi");
  const [patient, setPatient] = useState<SessionPatient | null>(null);
  const [asha, setAsha] = useState<SessionAsha | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.lang && LANGUAGES.find((l) => l.code === s.lang)) setLangState(s.lang);
      if (s.role === "patient" && s.patient) { setPatient(s.patient); setRole("patient"); }
      else if (s.role === "asha" && s.asha) { setAsha(s.asha); setRole("asha"); }
    } catch { /* ignore */ }
  }, []);

  const persist = (next: { role: Role; patient?: SessionPatient | null; asha?: SessionAsha | null; lang: LangCode }) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const setLang = (l: LangCode) => {
    setLangState(l);
    persist({ role, patient, asha, lang: l });
  };

  const loginPatient = async (input: { village: string; phone: string; name: string; age: number; gender: "F" | "M" }) => {
    const res = await loginPatientFn({ data: input });
    if (!res.ok) throw new Error(res.error);
    const sp = toSessionPatient(res.data);
    setPatient(sp);
    setAsha(null);
    setRole("patient");
    persist({ role: "patient", patient: sp, asha: null, lang });
    return sp;
  };


  const loginAsha = async (workerId: string, pin: string) => {
    const res = await loginAshaFn({ data: { workerId, pin } });
    if (!res.ok) return null;
    const sa = toSessionAsha(res.data);
    setAsha(sa);
    setPatient(null);
    setRole("asha");
    persist({ role: "asha", asha: sa, patient: null, lang });
    return sa;
  };

  const logout = () => {
    setRole(null);
    setPatient(null);
    setAsha(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  return (
    <SessionCtx.Provider value={{ role, lang, patient, asha, setLang, loginPatient, loginAsha, logout }}>
      {children}
    </SessionCtx.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error("useSession must be inside SessionProvider");
  return ctx;
}
