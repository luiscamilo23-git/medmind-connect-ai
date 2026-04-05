-- Enable pg_cron extension (must be enabled in Supabase dashboard under Extensions)
-- This migration creates a daily cron job at 8:00 AM Colombia time (UTC-5 = 13:00 UTC)

SELECT cron.schedule(
  'daily-appointment-reminders',        -- job name
  '0 13 * * *',                         -- every day at 13:00 UTC = 8:00 AM Colombia
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-appointment-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
