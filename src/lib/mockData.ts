export type Urgency = "green" | "yellow" | "red";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "F" | "M";
  village: string;
  phone: string;
  pregnant?: boolean;
  assignedAsha: string; // asha id
}

export interface AshaWorker {
  id: string;
  workerId: string;
  name: string;
  villageCluster: string[];
  patientsAssigned: number;
  pin: string;
  monthlyTarget: number;
  visitsCompleted: number;
}

export interface Visit {
  id: string;
  patientId: string;
  ashaId: string;
  date: string; // ISO
  type: "Antenatal" | "Postnatal" | "Child immunisation" | "Sick child" | "General illness";
  status: "Pending" | "Completed" | "Referred";
  urgency: Urgency;
  notes?: string;
}

export interface TriageRecord {
  id: string;
  patientId: string;
  date: string;
  urgency: Urgency;
  conditionGuess: string;
  symptoms: string[];
}

export interface Alert {
  id: string;
  patientId: string;
  patientName: string;
  village: string;
  symptomSummary: string;
  urgency: Urgency;
  time: string; // ISO
  ashaId: string;
}

export const ashaWorkers: AshaWorker[] = [
  {
    id: "asha-1",
    workerId: "ASH-UP-2241",
    name: "Meena Kumari",
    villageCluster: ["Rampur", "Belwa", "Lakhimpur"],
    patientsAssigned: 47,
    pin: "1234",
    monthlyTarget: 60,
    visitsCompleted: 38,
  },
  {
    id: "asha-2",
    workerId: "ASH-UP-2242",
    name: "Savita Yadav",
    villageCluster: ["Sitapur", "Mahmudabad"],
    patientsAssigned: 53,
    pin: "1234",
    monthlyTarget: 65,
    visitsCompleted: 41,
  },
];

export const patients: Patient[] = [
  { id: "p-1", name: "Sunita Devi", age: 32, gender: "F", village: "Rampur", phone: "9876500001", assignedAsha: "asha-1" },
  { id: "p-2", name: "Ramesh Kumar", age: 45, gender: "M", village: "Belwa", phone: "9876500002", assignedAsha: "asha-1" },
  { id: "p-3", name: "Priya Singh", age: 24, gender: "F", village: "Lakhimpur", phone: "9876500003", pregnant: true, assignedAsha: "asha-1" },
];

const today = new Date();
const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000).toISOString();

export const visits: Visit[] = [
  { id: "v-1", patientId: "p-3", ashaId: "asha-1", date: daysAgo(1), type: "Antenatal", status: "Completed", urgency: "yellow", notes: "BP slightly elevated 138/88. Follow up in 3 days." },
  { id: "v-2", patientId: "p-1", ashaId: "asha-1", date: daysAgo(3), type: "General illness", status: "Completed", urgency: "green", notes: "Mild fever resolved." },
  { id: "v-3", patientId: "p-2", ashaId: "asha-1", date: daysAgo(2), type: "Sick child", status: "Referred", urgency: "red", notes: "Persistent cough with fever, referred to PHC Belwa." },
  { id: "v-4", patientId: "p-3", ashaId: "asha-1", date: daysAgo(0), type: "Antenatal", status: "Pending", urgency: "yellow" },
  { id: "v-5", patientId: "p-1", ashaId: "asha-1", date: daysAgo(7), type: "General illness", status: "Completed", urgency: "green" },
];

export const triageHistory: TriageRecord[] = [
  { id: "t-1", patientId: "p-1", date: daysAgo(7), urgency: "green", conditionGuess: "Common cold", symptoms: ["Runny nose", "Mild cough"] },
  { id: "t-2", patientId: "p-1", date: daysAgo(3), urgency: "yellow", conditionGuess: "Viral fever with cough", symptoms: ["Fever 101°F", "Cough", "Body ache"] },
  { id: "t-3", patientId: "p-1", date: daysAgo(1), urgency: "green", conditionGuess: "Recovering", symptoms: ["Mild weakness"] },
];

export const alerts: Alert[] = [
  { id: "a-1", patientId: "p-2", patientName: "Ramesh Kumar", village: "Belwa", symptomSummary: "Chest pain, breathlessness 2 hours", urgency: "red", time: new Date(Date.now() - 12 * 60000).toISOString(), ashaId: "asha-1" },
  { id: "a-2", patientId: "p-3", patientName: "Priya Singh", village: "Lakhimpur", symptomSummary: "Swelling in feet, headache", urgency: "yellow", time: new Date(Date.now() - 45 * 60000).toISOString(), ashaId: "asha-1" },
  { id: "a-3", patientId: "p-1", patientName: "Sunita Devi", village: "Rampur", symptomSummary: "Mild fever, body ache", urgency: "yellow", time: new Date(Date.now() - 3 * 3600000).toISOString(), ashaId: "asha-1" },
];

export function getPatient(id: string) { return patients.find(p => p.id === id); }
export function getAsha(id: string) { return ashaWorkers.find(a => a.id === id); }
export function visitsForAsha(id: string) { return visits.filter(v => v.ashaId === id); }
export function alertsForAsha(id: string) { return alerts.filter(a => a.ashaId === id); }
