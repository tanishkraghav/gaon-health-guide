
-- ASHA workers
CREATE TABLE public.asha_workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id text UNIQUE NOT NULL,
  pin text NOT NULL,
  name text NOT NULL,
  village_cluster text[] NOT NULL DEFAULT '{}',
  patients_assigned int NOT NULL DEFAULT 0,
  monthly_target int NOT NULL DEFAULT 60,
  visits_completed int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.asha_workers TO service_role;
ALTER TABLE public.asha_workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all" ON public.asha_workers FOR ALL USING (false) WITH CHECK (false);

-- Patients
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  name text NOT NULL,
  age int NOT NULL DEFAULT 30,
  gender text NOT NULL DEFAULT 'F',
  village text NOT NULL,
  pregnant boolean NOT NULL DEFAULT false,
  assigned_asha uuid REFERENCES public.asha_workers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all" ON public.patients FOR ALL USING (false) WITH CHECK (false);

-- Visits
CREATE TABLE public.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  asha_id uuid NOT NULL REFERENCES public.asha_workers(id) ON DELETE CASCADE,
  date timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  urgency text NOT NULL DEFAULT 'green',
  measurements jsonb,
  ai_summary text,
  red_flags text[] DEFAULT '{}',
  referral_reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.visits TO service_role;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all" ON public.visits FOR ALL USING (false) WITH CHECK (false);

-- Triage alerts (every patient triage finalisation writes one)
CREATE TABLE public.triage_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  asha_id uuid REFERENCES public.asha_workers(id) ON DELETE SET NULL,
  urgency text NOT NULL,
  condition_guess text,
  symptom_summary text NOT NULL,
  symptoms text[] DEFAULT '{}',
  notified boolean NOT NULL DEFAULT false,
  notified_at timestamptz,
  acknowledged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.triage_alerts TO service_role;
ALTER TABLE public.triage_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all" ON public.triage_alerts FOR ALL USING (false) WITH CHECK (false);

-- Seed ASHA workers
INSERT INTO public.asha_workers (id, worker_id, pin, name, village_cluster, patients_assigned, monthly_target, visits_completed) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ASH-UP-2241', '1234', 'Meena Kumari', ARRAY['Rampur','Belwa','Lakhimpur'], 47, 60, 0),
  ('22222222-2222-2222-2222-222222222222', 'ASH-UP-2242', '1234', 'Savita Yadav', ARRAY['Sitapur','Mahmudabad'], 53, 65, 0);

-- Seed patients
INSERT INTO public.patients (id, phone, name, age, gender, village, pregnant, assigned_asha) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '9876500001', 'Sunita Devi', 32, 'F', 'Rampur', false, '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '9876500002', 'Ramesh Kumar', 45, 'M', 'Belwa', false, '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '9876500003', 'Priya Singh', 24, 'F', 'Lakhimpur', true, '11111111-1111-1111-1111-111111111111');

-- Seed visits
INSERT INTO public.visits (patient_id, asha_id, date, type, status, urgency, notes) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '11111111-1111-1111-1111-111111111111', now() - interval '1 day',  'Antenatal',       'Completed', 'yellow', 'BP slightly elevated 138/88. Follow up in 3 days.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', now() - interval '3 days', 'General illness', 'Completed', 'green',  'Mild fever resolved.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111111', now() - interval '2 days', 'Sick child',      'Referred',  'red',    'Persistent cough with fever, referred to PHC Belwa.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '11111111-1111-1111-1111-111111111111', now(),                     'Antenatal',       'Pending',   'yellow', null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', now() - interval '7 days', 'General illness', 'Completed', 'green',  null);

-- Seed initial triage alerts so ASHA dashboard is non-empty on first load
INSERT INTO public.triage_alerts (patient_id, asha_id, urgency, condition_guess, symptom_summary, symptoms, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111111', 'red',    'Possible cardiac event',  'Chest pain, breathlessness 2 hours', ARRAY['Chest pain','Breathlessness','2 hours'], now() - interval '12 minutes'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '11111111-1111-1111-1111-111111111111', 'yellow', 'Pregnancy oedema',        'Swelling in feet, headache',          ARRAY['Swelling','Headache'],                  now() - interval '45 minutes'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'yellow', 'Viral fever',             'Mild fever, body ache',               ARRAY['Mild fever','Body ache'],               now() - interval '3 hours');
