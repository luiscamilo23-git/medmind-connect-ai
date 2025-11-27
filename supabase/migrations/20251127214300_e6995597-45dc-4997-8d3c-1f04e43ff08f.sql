-- =====================================================
-- FASE 1: MÓDULO DE FACTURACIÓN ELECTRÓNICA COLOMBIA
-- Cumplimiento: Res 2275/2023, 558/2024, Ley 527/1999
-- =====================================================

-- 1. ENUM para estados de factura
CREATE TYPE invoice_status AS ENUM (
  'DRAFT',
  'EMITIDA',
  'VALIDADA', 
  'RECHAZADA',
  'ANULADA'
);

-- 2. ENUM para estado de pago
CREATE TYPE payment_status AS ENUM (
  'PENDIENTE',
  'PAGADA',
  'PARCIAL',
  'VENCIDA'
);

-- 3. ENUM para tipo de servicio médico
CREATE TYPE service_type AS ENUM (
  'CONSULTA',
  'PROCEDIMIENTO',
  'CIRUGIA',
  'LABORATORIO',
  'IMAGENES',
  'TERAPIA',
  'MEDICAMENTO',
  'OTRO'
);

-- 4. TABLA: services (Servicios/Tarifas médicas)
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_servicio TEXT NOT NULL,
  codigo_cups TEXT,
  precio_unitario NUMERIC(10,2) NOT NULL,
  tipo_servicio service_type NOT NULL,
  impuestos_aplican BOOLEAN DEFAULT false,
  porcentaje_impuesto NUMERIC(5,2) DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. TABLA: invoices (Facturas electrónicas)
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_factura_dian TEXT,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  impuestos NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado invoice_status NOT NULL DEFAULT 'DRAFT',
  payment_status payment_status NOT NULL DEFAULT 'PENDIENTE',
  cufe TEXT,
  pdf_url TEXT,
  xml_url TEXT,
  notas TEXT,
  metodo_emision TEXT DEFAULT 'MANUAL',
  proveedor_dian TEXT,
  errores_validacion JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. TABLA: invoice_items (Líneas de factura)
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  descripcion TEXT NOT NULL,
  codigo_cups TEXT,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(10,2) NOT NULL,
  subtotal_linea NUMERIC(12,2) NOT NULL,
  impuestos_linea NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_linea NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. TABLA: api_configurations (Configuración segura de APIs)
CREATE TABLE public.api_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  api_url TEXT,
  is_sandbox BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  config_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(doctor_id, provider_type)
);

-- =====================================================
-- TRIGGERS para updated_at
-- =====================================================

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_configurations_updated_at
  BEFORE UPDATE ON public.api_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Cumplimiento Ley 1581/2012 (Protección datos)
-- =====================================================

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_configurations ENABLE ROW LEVEL SECURITY;

-- POLICIES: services
CREATE POLICY "Doctors can view their own services"
  ON public.services FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own services"
  ON public.services FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own services"
  ON public.services FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own services"
  ON public.services FOR DELETE
  USING (auth.uid() = doctor_id);

-- POLICIES: invoices
CREATE POLICY "Doctors can view their own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own draft invoices"
  ON public.invoices FOR DELETE
  USING (auth.uid() = doctor_id AND estado = 'DRAFT');

-- POLICIES: invoice_items
CREATE POLICY "Doctors can view items of their invoices"
  ON public.invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can insert items to their invoices"
  ON public.invoice_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update items of their invoices"
  ON public.invoice_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can delete items of their invoices"
  ON public.invoice_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.doctor_id = auth.uid()
    )
  );

-- POLICIES: api_configurations
CREATE POLICY "Doctors can view their own API configs"
  ON public.api_configurations FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own API configs"
  ON public.api_configurations FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own API configs"
  ON public.api_configurations FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own API configs"
  ON public.api_configurations FOR DELETE
  USING (auth.uid() = doctor_id);

-- =====================================================
-- ÍNDICES para optimización
-- =====================================================

CREATE INDEX idx_services_doctor_id ON public.services(doctor_id);
CREATE INDEX idx_services_activo ON public.services(activo);
CREATE INDEX idx_invoices_doctor_id ON public.invoices(doctor_id);
CREATE INDEX idx_invoices_patient_id ON public.invoices(patient_id);
CREATE INDEX idx_invoices_estado ON public.invoices(estado);
CREATE INDEX idx_invoices_fecha_emision ON public.invoices(fecha_emision);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX idx_api_configurations_doctor_id ON public.api_configurations(doctor_id);