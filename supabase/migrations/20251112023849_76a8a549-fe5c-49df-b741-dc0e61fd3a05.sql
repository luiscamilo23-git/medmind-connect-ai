-- Create audit log table for tracking patient data access
CREATE TABLE public.patient_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  accessed_by uuid NOT NULL,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.patient_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow viewing own audit logs
CREATE POLICY "Users can view audit logs for their patients"
ON public.patient_audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_audit_logs.patient_id
    AND patients.doctor_id = auth.uid()
  )
);

-- Function to prevent doctor_id changes
CREATE OR REPLACE FUNCTION public.prevent_doctor_id_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.doctor_id IS DISTINCT FROM NEW.doctor_id THEN
    RAISE EXCEPTION 'Cannot change doctor_id after patient creation';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to prevent doctor_id changes
CREATE TRIGGER prevent_patient_doctor_change
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.prevent_doctor_id_change();

-- Function to log patient data access
CREATE OR REPLACE FUNCTION public.log_patient_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.patient_audit_logs (patient_id, accessed_by, action, new_data)
    VALUES (NEW.id, auth.uid(), 'INSERT', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.patient_audit_logs (patient_id, accessed_by, action, old_data, new_data)
    VALUES (NEW.id, auth.uid(), 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.patient_audit_logs (patient_id, accessed_by, action, old_data)
    VALUES (OLD.id, auth.uid(), 'DELETE', to_jsonb(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to log all patient data changes
CREATE TRIGGER log_patient_changes
AFTER INSERT OR UPDATE OR DELETE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.log_patient_access();