
-- Modificar el trigger para permitir NULL en accessed_by cuando no hay sesión autenticada
CREATE OR REPLACE FUNCTION public.log_patient_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Solo registrar si hay un usuario autenticado
  IF current_user_id IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.patient_audit_logs (patient_id, accessed_by, action, new_data)
      VALUES (NEW.id, current_user_id, 'INSERT', to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
      INSERT INTO public.patient_audit_logs (patient_id, accessed_by, action, old_data, new_data)
      VALUES (NEW.id, current_user_id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    ELSIF TG_OP = 'DELETE' THEN
      INSERT INTO public.patient_audit_logs (patient_id, accessed_by, action, old_data)
      VALUES (OLD.id, current_user_id, 'DELETE', to_jsonb(OLD));
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;
