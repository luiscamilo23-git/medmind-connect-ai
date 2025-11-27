-- Create table for DIAN webhook events
CREATE TABLE IF NOT EXISTS public.dian_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- ALEGRA, SIIGO, ALANUBE
  event_type TEXT NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT dian_webhook_events_provider_check CHECK (provider IN ('ALEGRA', 'SIIGO', 'ALANUBE'))
);

-- Create index for faster queries
CREATE INDEX idx_dian_webhook_events_invoice_id ON public.dian_webhook_events(invoice_id);
CREATE INDEX idx_dian_webhook_events_processed ON public.dian_webhook_events(processed);
CREATE INDEX idx_dian_webhook_events_created_at ON public.dian_webhook_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.dian_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Doctors can view webhooks for their invoices"
  ON public.dian_webhook_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = dian_webhook_events.invoice_id
        AND invoices.doctor_id = auth.uid()
    )
  );

CREATE POLICY "System can insert webhook events"
  ON public.dian_webhook_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update webhook events"
  ON public.dian_webhook_events FOR UPDATE
  USING (true);

-- Grant permissions
GRANT SELECT ON public.dian_webhook_events TO authenticated;
GRANT INSERT, UPDATE ON public.dian_webhook_events TO authenticated;