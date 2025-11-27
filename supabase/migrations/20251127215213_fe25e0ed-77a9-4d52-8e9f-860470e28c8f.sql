-- =====================================================
-- FASE 3: MÓDULO DE PAGOS - PASARELAS COLOMBIA
-- Sistema configurable: Doctor elige su pasarela
-- Soporta: Wompi, PayU, ePayco
-- =====================================================

-- 1. ENUM para métodos de pago
CREATE TYPE payment_method AS ENUM (
  'EFECTIVO',
  'TARJETA_CREDITO',
  'TARJETA_DEBITO',
  'TRANSFERENCIA',
  'PSE',
  'NEQUI',
  'DAVIPLATA',
  'OTRO'
);

-- 2. ENUM para estado de pago
CREATE TYPE payment_transaction_status AS ENUM (
  'PENDIENTE',
  'PROCESANDO',
  'APROBADO',
  'RECHAZADO',
  'CANCELADO',
  'REEMBOLSADO'
);

-- 3. ENUM para proveedores de pasarela
CREATE TYPE payment_gateway_provider AS ENUM (
  'WOMPI',
  'PAYU',
  'EPAYCO',
  'MANUAL'
);

-- 4. TABLA: payments (Registro de pagos)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monto NUMERIC(12,2) NOT NULL,
  metodo_pago payment_method NOT NULL,
  estado payment_transaction_status NOT NULL DEFAULT 'PENDIENTE',
  gateway_provider payment_gateway_provider DEFAULT 'MANUAL',
  transaction_id TEXT,
  transaction_ref TEXT,
  gateway_response JSONB,
  error_message TEXT,
  fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,
  comprobante_url TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. TABLA: payment_gateway_configs (Configuración de pasarelas por doctor)
CREATE TABLE public.payment_gateway_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gateway_provider payment_gateway_provider NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_sandbox BOOLEAN DEFAULT true,
  
  -- Credenciales (encriptadas)
  public_key TEXT,
  private_key TEXT,
  merchant_id TEXT,
  api_key TEXT,
  
  -- Configuración adicional
  config_data JSONB,
  
  -- Webhooks
  webhook_url TEXT,
  webhook_secret TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Solo una pasarela activa por doctor
  UNIQUE(doctor_id, gateway_provider)
);

-- 6. TABLA: payment_webhooks (Log de webhooks recibidos)
CREATE TABLE public.payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  gateway_provider payment_gateway_provider NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_gateway_configs_updated_at
  BEFORE UPDATE ON public.payment_gateway_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para actualizar estado de factura al aprobar pago
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_paid NUMERIC;
  invoice_total NUMERIC;
BEGIN
  IF NEW.estado = 'APROBADO' THEN
    -- Calcular total pagado
    SELECT COALESCE(SUM(monto), 0) INTO total_paid
    FROM public.payments
    WHERE invoice_id = NEW.invoice_id
      AND estado = 'APROBADO';
    
    -- Obtener total de factura
    SELECT total INTO invoice_total
    FROM public.invoices
    WHERE id = NEW.invoice_id;
    
    -- Actualizar estado de pago de factura
    IF total_paid >= invoice_total THEN
      UPDATE public.invoices
      SET payment_status = 'PAGADA'
      WHERE id = NEW.invoice_id;
    ELSIF total_paid > 0 THEN
      UPDATE public.invoices
      SET payment_status = 'PARCIAL'
      WHERE id = NEW.invoice_id;
    END IF;
    
    -- Actualizar fecha de aprobación
    NEW.fecha_aprobacion = now();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_invoice_on_payment_approval
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payment_status();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateway_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;

-- POLICIES: payments
CREATE POLICY "Doctors can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own payments"
  ON public.payments FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "System can update payments via webhooks"
  ON public.payments FOR UPDATE
  USING (true);

-- POLICIES: payment_gateway_configs
CREATE POLICY "Doctors can view their own gateway configs"
  ON public.payment_gateway_configs FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own gateway configs"
  ON public.payment_gateway_configs FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own gateway configs"
  ON public.payment_gateway_configs FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own gateway configs"
  ON public.payment_gateway_configs FOR DELETE
  USING (auth.uid() = doctor_id);

-- POLICIES: payment_webhooks
CREATE POLICY "Doctors can view webhooks for their payments"
  ON public.payment_webhooks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payments
      WHERE payments.id = payment_webhooks.payment_id
        AND payments.doctor_id = auth.uid()
    )
  );

CREATE POLICY "System can insert webhooks"
  ON public.payment_webhooks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update webhooks"
  ON public.payment_webhooks FOR UPDATE
  USING (true);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX idx_payments_doctor_id ON public.payments(doctor_id);
CREATE INDEX idx_payments_estado ON public.payments(estado);
CREATE INDEX idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX idx_payment_gateway_configs_doctor_id ON public.payment_gateway_configs(doctor_id);
CREATE INDEX idx_payment_gateway_configs_active ON public.payment_gateway_configs(is_active);
CREATE INDEX idx_payment_webhooks_payment_id ON public.payment_webhooks(payment_id);
CREATE INDEX idx_payment_webhooks_processed ON public.payment_webhooks(processed);

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Obtener pasarela activa del doctor
CREATE OR REPLACE FUNCTION get_active_payment_gateway(doctor_uuid UUID)
RETURNS TABLE (
  gateway_provider payment_gateway_provider,
  public_key TEXT,
  is_sandbox BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    gateway_provider,
    public_key,
    is_sandbox
  FROM public.payment_gateway_configs
  WHERE doctor_id = doctor_uuid
    AND is_active = true
  LIMIT 1;
$$;