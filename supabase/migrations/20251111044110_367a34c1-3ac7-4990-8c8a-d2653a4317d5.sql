-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow patients to view profiles of doctors they have appointments with
CREATE POLICY "Patients can view their doctors profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.appointments
    WHERE appointments.doctor_id = profiles.id
    AND appointments.patient_id = auth.uid()
  )
);

-- Allow doctors to view profiles of their patients (if patients have profiles)
CREATE POLICY "Doctors can view their patients profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.appointments
    WHERE appointments.patient_id = profiles.id
    AND appointments.doctor_id = auth.uid()
  )
);