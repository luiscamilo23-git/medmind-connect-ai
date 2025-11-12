-- Add RLS policy to allow patients to view their own medical records
CREATE POLICY "Patients can view their own medical records"
ON public.medical_records
FOR SELECT
USING (auth.uid() = patient_id);