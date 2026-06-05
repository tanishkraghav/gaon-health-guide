export type Urgency = "green" | "yellow" | "red";

export interface PatientRow {
  id: string;
  phone: string;
  name: string;
  age: number;
  gender: "F" | "M";
  village: string;
  pregnant: boolean;
  assigned_asha: string | null;
}

export interface AshaRow {
  id: string;
  worker_id: string;
  name: string;
  village_cluster: string[];
  patients_assigned: number;
  monthly_target: number;
  visits_completed: number;
}

export type Measurements = Record<string, string | number | boolean>;

export interface VisitRow {
  id: string;
  patient_id: string;
  asha_id: string;
  date: string;
  type: string;
  status: "Pending" | "Completed" | "Referred";
  urgency: Urgency;
  measurements: Measurements | null;
  ai_summary: string | null;
  red_flags: string[];
  referral_reason: string | null;
  notes: string | null;
  patient?: PatientRow | null;
}

export interface AlertRow {
  id: string;
  patient_id: string;
  asha_id: string | null;
  urgency: Urgency;
  condition_guess: string | null;
  symptom_summary: string;
  symptoms: string[];
  notified: boolean;
  acknowledged: boolean;
  created_at: string;
  patient_name?: string;
  village?: string;
}
