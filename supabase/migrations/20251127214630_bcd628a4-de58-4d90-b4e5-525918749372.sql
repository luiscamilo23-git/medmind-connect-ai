-- =====================================================
-- FASE 2: MÓDULO RIPS - RESOLUCIÓN 2275/2023
-- Registro Individual de Prestación de Servicios
-- Formato JSON - Cumplimiento normativo Colombia
-- =====================================================

-- 1. ENUM para estados de RIPS
CREATE TYPE rips_status AS ENUM (
  'DRAFT',
  'GENERADO',
  'VALIDADO',
  'RECHAZADO',
  'ENVIADO'
);

-- 2. ENUM para tipos de archivo RIPS
CREATE TYPE rips_file_type AS ENUM (
  'AC', -- Consultas
  'AP', -- Procedimientos
  'AU', -- Urgencias
  'AH', -- Hospitalización
  'AN', -- Recién nacidos
  'AM', -- Medicamentos
  'AT'  -- Otros servicios
);

-- 3. TABLA: rips_batches (Lotes de RIPS)
CREATE TABLE public.rips_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  pagador TEXT NOT NULL,
  nit_pagador TEXT,
  total_registros INTEGER DEFAULT 0,
  total_valor NUMERIC(12,2) DEFAULT 0,
  estado rips_status NOT NULL DEFAULT 'DRAFT',
  archivo_rips_url TEXT,
  json_data JSONB,
  errores_validacion JSONB,
  validation_response TEXT,
  mecanismo_validacion_id TEXT,
  fecha_envio TIMESTAMP WITH TIME ZONE,
  fecha_validacion TIMESTAMP WITH TIME ZONE,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. TABLA: rips_records (Registros individuales de RIPS)
CREATE TABLE public.rips_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rips_batch_id UUID NOT NULL REFERENCES public.rips_batches(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  tipo_archivo rips_file_type NOT NULL,
  numero_autorizacion TEXT,
  codigo_servicio TEXT NOT NULL,
  descripcion_servicio TEXT NOT NULL,
  fecha_inicio_atencion DATE NOT NULL,
  fecha_fin_atencion DATE,
  codigo_diagnostico_principal TEXT,
  codigo_diagnostico_relacionado TEXT,
  tipo_diagnostico_principal TEXT,
  valor_total NUMERIC(12,2) NOT NULL,
  copago NUMERIC(12,2) DEFAULT 0,
  valor_neto NUMERIC(12,2) NOT NULL,
  datos_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. TABLA: rips_validation_logs (Logs de validación)
CREATE TABLE public.rips_validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rips_batch_id UUID NOT NULL REFERENCES public.rips_batches(id) ON DELETE CASCADE,
  tipo_validacion TEXT NOT NULL,
  resultado TEXT NOT NULL,
  errores JSONB,
  warnings JSONB,
  detalles TEXT,
  validado_por TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_rips_batches_updated_at
  BEFORE UPDATE ON public.rips_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para actualizar totales en rips_batches
CREATE OR REPLACE FUNCTION update_rips_batch_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.rips_batches
  SET 
    total_registros = (
      SELECT COUNT(*) 
      FROM public.rips_records 
      WHERE rips_batch_id = NEW.rips_batch_id
    ),
    total_valor = (
      SELECT COALESCE(SUM(valor_total), 0)
      FROM public.rips_records
      WHERE rips_batch_id = NEW.rips_batch_id
    )
  WHERE id = NEW.rips_batch_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_rips_batch_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.rips_records
  FOR EACH ROW
  EXECUTE FUNCTION update_rips_batch_totals();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.rips_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rips_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rips_validation_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES: rips_batches
CREATE POLICY "Doctors can view their own RIPS batches"
  ON public.rips_batches FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own RIPS batches"
  ON public.rips_batches FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own RIPS batches"
  ON public.rips_batches FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own draft RIPS batches"
  ON public.rips_batches FOR DELETE
  USING (auth.uid() = doctor_id AND estado = 'DRAFT');

-- POLICIES: rips_records
CREATE POLICY "Doctors can view records of their RIPS batches"
  ON public.rips_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rips_batches
      WHERE rips_batches.id = rips_records.rips_batch_id
        AND rips_batches.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can insert records to their RIPS batches"
  ON public.rips_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rips_batches
      WHERE rips_batches.id = rips_records.rips_batch_id
        AND rips_batches.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update records of their RIPS batches"
  ON public.rips_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.rips_batches
      WHERE rips_batches.id = rips_records.rips_batch_id
        AND rips_batches.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can delete records of their RIPS batches"
  ON public.rips_records FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.rips_batches
      WHERE rips_batches.id = rips_records.rips_batch_id
        AND rips_batches.doctor_id = auth.uid()
    )
  );

-- POLICIES: rips_validation_logs
CREATE POLICY "Doctors can view validation logs of their RIPS batches"
  ON public.rips_validation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rips_batches
      WHERE rips_batches.id = rips_validation_logs.rips_batch_id
        AND rips_batches.doctor_id = auth.uid()
    )
  );

CREATE POLICY "System can insert validation logs"
  ON public.rips_validation_logs FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_rips_batches_doctor_id ON public.rips_batches(doctor_id);
CREATE INDEX idx_rips_batches_estado ON public.rips_batches(estado);
CREATE INDEX idx_rips_batches_fecha_inicio ON public.rips_batches(fecha_inicio);
CREATE INDEX idx_rips_batches_fecha_fin ON public.rips_batches(fecha_fin);
CREATE INDEX idx_rips_records_batch_id ON public.rips_records(rips_batch_id);
CREATE INDEX idx_rips_records_invoice_id ON public.rips_records(invoice_id);
CREATE INDEX idx_rips_records_patient_id ON public.rips_records(patient_id);
CREATE INDEX idx_rips_records_tipo_archivo ON public.rips_records(tipo_archivo);
CREATE INDEX idx_rips_validation_logs_batch_id ON public.rips_validation_logs(rips_batch_id);

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para validar estructura RIPS JSON
CREATE OR REPLACE FUNCTION validate_rips_structure(rips_json JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  errors TEXT[] := '{}';
  warnings TEXT[] := '{}';
BEGIN
  -- Validar campos obligatorios
  IF NOT (rips_json ? 'nit_prestador') THEN
    errors := array_append(errors, 'Campo obligatorio: nit_prestador');
  END IF;
  
  IF NOT (rips_json ? 'nombre_prestador') THEN
    errors := array_append(errors, 'Campo obligatorio: nombre_prestador');
  END IF;
  
  IF NOT (rips_json ? 'registros') THEN
    errors := array_append(errors, 'Campo obligatorio: registros (debe contener array)');
  END IF;
  
  -- Construir resultado
  result := jsonb_build_object(
    'valid', array_length(errors, 1) IS NULL,
    'errors', errors,
    'warnings', warnings,
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;