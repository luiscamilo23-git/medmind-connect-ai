-- Drop overly permissive policies
DROP POLICY IF EXISTS "Doctors can view their patients profiles" ON public.profiles;
DROP POLICY IF EXISTS "Patients can view their doctors profiles" ON public.profiles;

-- Create more restrictive policies
-- Doctors can only view profiles of doctors (for social network features)
-- but only if that doctor has published posts or accepts patients
CREATE POLICY "Users can view public doctor profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- User can view their own profile
  auth.uid() = id
  OR
  -- Moderators can view all
  has_role(auth.uid(), 'moderator'::app_role)
  OR
  -- Can view doctor profiles that are accepting patients (public directory)
  (is_accepting_patients = true AND has_role(id, 'doctor'::app_role))
);

-- Drop old policies that are now redundant
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Moderators can view all profiles" ON public.profiles;