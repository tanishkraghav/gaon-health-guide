import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { LANGUAGES, type LangCode } from "./i18n";
import { ashaWorkers, patients, type AshaWorker, type Patient } from "./mockData";

type Role = "patient" | "asha" | null;

interface SessionState {
  role: Role;
  lang: LangCode;
  patient: Patient | null;
  asha: AshaWorker | null;
  setLang: (l: LangCode) => void;
  loginPatient: (village: string, phone: string) => Patient;
  loginAsha: (workerId: string, pin: string) => AshaWorker | null;
  logout: () => void;
}

const SessionCtx = createContext<SessionState | null>(null);

const STORAGE_KEY = "swasthya-session-v1";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [lang, setLangState] = useState<LangCode>("hi");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [asha, setAsha] = useState<AshaWorker | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.lang && LANGUAGES.find(l => l.code === s.lang)) setLangState(s.lang);
        if (s.role === "patient" && s.patientId) {
          const p = patients.find(x => x.id === s.patientId);
          if (p) { setPatient(p); setRole("patient"); }
        } else if (s.role === "asha" && s.ashaId) {
          const a = ashaWorkers.find(x => x.id === s.ashaId);
          if (a) { setAsha(a); setRole("asha"); }
        }
      }
    } catch { /* ignore */ }
  }, []);

  const persist = (next: { role: Role; patientId?: string; ashaId?: string; lang: LangCode }) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const setLang = (l: LangCode) => {
    setLangState(l);
    persist({ role, patientId: patient?.id, ashaId: asha?.id, lang: l });
  };

  const loginPatient = (village: string, phone: string) => {
    // Match by phone if exists, otherwise reuse first sample patient with overridden village.
    const found = patients.find(p => p.phone === phone) || { ...patients[0], village: village || patients[0].village };
    setPatient(found);
    setAsha(null);
    setRole("patient");
    persist({ role: "patient", patientId: found.id, lang });
    return found;
  };

  const loginAsha = (workerId: string, pin: string) => {
    const found = ashaWorkers.find(a => a.workerId.toLowerCase() === workerId.toLowerCase() && a.pin === pin);
    if (!found) return null;
    setAsha(found);
    setPatient(null);
    setRole("asha");
    persist({ role: "asha", ashaId: found.id, lang });
    return found;
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
