-- Create table for DIAN emission logs
CREATE TABLE IF NOT EXISTS public.dian_emission_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL,
  provider TEXT NOT NULL, -- ALEGRA, SIIGO, ALANUBE
  request_payload JSONB,
  response_payload JSONB,
  status TEXT NOT NULL, -- SUCCESS, ERROR, PENDING
  error_message TEXT,
  cufe TEXT,
  numero_dian TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT dian_emission_logs_provider_check CHECK (provider IN ('ALEGRA', 'SIIGO', 'ALANUBE')),
  CONSTRAINT dian_emission_logs_status_check CHECK (status IN ('SUCCESS', 'ERROR', 'PENDING'))
);

-- Create index for faster queries
CREATE INDEX idx_dian_emission_logs_invoice_id ON public.dian_emission_logs(invoice_id);
CREATE INDEX idx_dian_emission_logs_doctor_id ON public.dian_emission_logs(doctor_id);
CREATE INDEX idx_dian_emission_logs_created_at ON public.dian_emission_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.dian_emission_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Doctors can view their own emission logs"
  ON public.dian_emission_logs FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "System can insert emission logs"
  ON public.dian_emission_logs FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.dian_emission_logs TO authenticated;
GRANT INSERT ON public.dian_emission_logs TO authenticated;