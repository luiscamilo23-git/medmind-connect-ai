-- Add new columns for Doctor AI Settings
-- Note: specialty already exists in profiles table

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS services_list text,
ADD COLUMN IF NOT EXISTS ai_behavior text;