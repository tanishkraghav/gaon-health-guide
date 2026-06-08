
-- Extend asha_workers
ALTER TABLE public.asha_workers
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS pin_hash text,
  ADD COLUMN IF NOT EXISTS block text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS village text,
  ADD COLUMN IF NOT EXISTS household_count integer,
  ADD COLUMN IF NOT EXISTS registration_status text NOT NULL DEFAULT 'unregistered';

-- Ensure worker_id uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS asha_workers_worker_id_key ON public.asha_workers (worker_id);

-- OTP requests
CREATE TABLE IF NOT EXISTS public.otp_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_requests_worker_id_idx ON public.otp_requests (worker_id, created_at DESC);

GRANT ALL ON public.otp_requests TO service_role;
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all" ON public.otp_requests FOR ALL USING (false) WITH CHECK (false);

-- Seed demo workers (insert if missing, update phone otherwise)
INSERT INTO public.asha_workers (worker_id, name, pin, phone, registration_status)
VALUES
  ('ASH-UP-2241', 'ASHA Worker', '', '9876543210', 'unregistered'),
  ('ASH-UP-2242', 'ASHA Worker', '', '9876543211', 'unregistered'),
  ('ASH-UP-2243', 'ASHA Worker', '', '8765432109', 'unregistered'),
  ('ASH-UP-2244', 'ASHA Worker', '', '7654321098', 'unregistered'),
  ('ASH-MP-1101', 'ASHA Worker', '', '9988776655', 'unregistered'),
  ('ASH-MH-3301', 'ASHA Worker', '', '8877665544', 'unregistered'),
  ('ASH-WB-4401', 'ASHA Worker', '', '7766554433', 'unregistered')
ON CONFLICT (worker_id) DO UPDATE SET phone = EXCLUDED.phone;
