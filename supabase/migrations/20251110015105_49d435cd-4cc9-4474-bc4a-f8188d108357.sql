-- Update the handle_new_user function to respect the role from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from user metadata, default to 'doctor' if not specified
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'doctor'::app_role
  );

  -- Insert profile
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NOW(),
    NOW()
  );
  
  -- Insert role based on user metadata
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (NEW.id, user_role, NOW());
  
  RETURN NEW;
END;
$$;