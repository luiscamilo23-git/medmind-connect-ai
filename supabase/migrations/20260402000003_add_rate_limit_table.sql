-- v2.0: Rate limiting for AI edge functions

CREATE TABLE IF NOT EXISTS rate_limit_usage (
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  count INT DEFAULT 1,
  reset_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour'),
  PRIMARY KEY (doctor_id, endpoint)
);

ALTER TABLE rate_limit_usage ENABLE ROW LEVEL SECURITY;

-- Doctors can read their own usage
CREATE POLICY "own_usage_read" ON rate_limit_usage
  FOR SELECT USING (auth.uid() = doctor_id);

-- Service role handles inserts/updates via edge functions
CREATE INDEX IF NOT EXISTS idx_rate_limit_reset
  ON rate_limit_usage(doctor_id, endpoint, reset_at);
