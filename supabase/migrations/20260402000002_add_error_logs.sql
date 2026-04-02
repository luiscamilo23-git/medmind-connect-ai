-- v2.0: Error logs table for self-healing monitoring

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT,
  message TEXT NOT NULL,
  stack TEXT,
  severity TEXT DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  request_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only service_role can insert/read (never public)
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Block all public access; service_role bypasses RLS automatically
CREATE POLICY "no_public_access" ON error_logs
  USING (false);

-- Index for real-time subscription filter
CREATE INDEX IF NOT EXISTS idx_error_logs_severity_created
  ON error_logs(severity, created_at DESC);
