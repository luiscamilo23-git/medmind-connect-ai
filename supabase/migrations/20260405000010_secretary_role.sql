-- Add 'secretaria' role to the existing app_role ENUM
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'secretaria';

-- Table to link a secretary to the doctor they work for
CREATE TABLE IF NOT EXISTS public.secretary_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secretary_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, secretary_id)
);

ALTER TABLE public.secretary_assignments ENABLE ROW LEVEL SECURITY;

-- Doctor can manage their own secretary assignments
CREATE POLICY "doctor_manage_secretaries" ON public.secretary_assignments
  FOR ALL USING (auth.uid() = doctor_id);

-- Secretary can view their own assignment (to know which doctor they work for)
CREATE POLICY "secretary_view_own_assignment" ON public.secretary_assignments
  FOR SELECT USING (auth.uid() = secretary_id);

-- RLS: Secretary can read and write appointments for their doctor
CREATE POLICY "secretary_appointments_access" ON public.appointments
  FOR ALL USING (
    doctor_id IN (
      SELECT doctor_id FROM public.secretary_assignments WHERE secretary_id = auth.uid()
    )
  );

-- RLS: Secretary can read and write patients for their doctor
CREATE POLICY "secretary_patients_access" ON public.patients
  FOR ALL USING (
    doctor_id IN (
      SELECT doctor_id FROM public.secretary_assignments WHERE secretary_id = auth.uid()
    )
  );
