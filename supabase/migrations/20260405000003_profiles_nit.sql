-- Add NIT/cedula field to profiles for basic fiscal identification
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nit TEXT,
  ADD COLUMN IF NOT EXISTS ciudad TEXT;
