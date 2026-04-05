-- Add confirmation token and tracking fields to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS confirmation_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmation_reminder_sent BOOLEAN DEFAULT false;

-- Unique index for fast token lookup (public, no auth needed)
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_confirmation_token
  ON public.appointments(confirmation_token);
