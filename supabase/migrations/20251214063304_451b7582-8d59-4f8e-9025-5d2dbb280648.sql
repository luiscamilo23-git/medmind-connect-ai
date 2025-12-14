-- Drop the current permissive SELECT policy
DROP POLICY IF EXISTS "Users can view public doctor profiles" ON public.profiles;

-- Create a more restrictive SELECT policy
-- Users can view their own profile
-- Moderators can view all profiles
-- Authenticated users can only see limited public info of doctors accepting patients
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Moderators can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Authenticated users can view accepting doctors basic info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND is_accepting_patients = true 
  AND has_role(id, 'doctor'::app_role)
);