-- Create table to track device verifications
CREATE TABLE IF NOT EXISTS public.device_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  last_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_fingerprint)
);

-- Enable RLS
ALTER TABLE public.device_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verifications
CREATE POLICY "Users can view their own verifications"
  ON public.device_verifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own verifications
CREATE POLICY "Users can insert their own verifications"
  ON public.device_verifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own verifications
CREATE POLICY "Users can update their own verifications"
  ON public.device_verifications
  FOR UPDATE
  USING (auth.uid() = user_id);