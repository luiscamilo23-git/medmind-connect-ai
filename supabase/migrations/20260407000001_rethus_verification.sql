-- Verificación RETHUS — Opción 3: registro abierto + verificación a los 5 días

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rethus_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rethus_reminder_sent_at TIMESTAMPTZ;

-- Índice para el cron que busca médicos sin verificar
CREATE INDEX IF NOT EXISTS idx_profiles_rethus_unverified
  ON public.profiles (created_at, rethus_verified, rethus_reminder_sent_at)
  WHERE rethus_verified = FALSE;

-- Cron: enviar recordatorio de verificación RETHUS al día 5
SELECT cron.schedule(
  'send-rethus-reminder-daily',
  '0 9 * * *',  -- Todos los días a las 9am
  $$
  SELECT net.http_post(
    url := (SELECT 'https://' || (SELECT value FROM vault.secrets WHERE name = 'project_ref') || '.supabase.co/functions/v1/send-rethus-reminder'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM vault.secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  )
  $$
);
