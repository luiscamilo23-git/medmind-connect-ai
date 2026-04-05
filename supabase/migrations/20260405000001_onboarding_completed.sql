-- Add onboarding_completed flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Existing users with clinic_name OR license_number are considered already onboarded
UPDATE public.profiles
SET onboarding_completed = true
WHERE clinic_name IS NOT NULL OR license_number IS NOT NULL OR full_name IS NOT NULL;
