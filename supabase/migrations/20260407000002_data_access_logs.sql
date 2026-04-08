-- Registro de auditoría de acceso a datos sensibles
-- Cumplimiento Ley 1581 de 2012 — Colombia

CREATE TABLE IF NOT EXISTS public.data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  action TEXT NOT NULL,           -- 'VIEW_PATIENT', 'VIEW_RECORD', 'EXPORT_PDF', 'DELETE_DATA'
  resource_type TEXT NOT NULL,    -- 'patient', 'medical_record', 'invoice', 'audio'
  resource_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: solo el propio médico ve sus logs, y los moderadores
ALTER TABLE public.data_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctor_own_logs" ON public.data_access_logs
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "insert_own_logs" ON public.data_access_logs
  FOR INSERT WITH CHECK (auth.uid() = doctor_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_data_access_logs_doctor ON public.data_access_logs (doctor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_patient ON public.data_access_logs (patient_id, created_at DESC);

-- Limpiar logs de más de 2 años (retención legal mínima: 10 años para datos médicos en Colombia)
-- NO borrar automáticamente — la retención mínima para HC es 20 años según Ley colombiana
-- Solo dejamos el índice para eficiencia
COMMENT ON TABLE public.data_access_logs IS
  'Registro de auditoría de acceso a datos sensibles. Retención: mínimo 20 años per Resolución 1995/1999 Ministerio de Salud Colombia.';
