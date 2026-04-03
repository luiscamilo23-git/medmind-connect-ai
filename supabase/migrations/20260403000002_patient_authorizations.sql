-- MEDMIND: Autorizaciones de pacientes — Ley 1581/2012 (Habeas Data) + Ley 23/1981 (Consentimiento)
-- Registro inmutable — NO se puede eliminar ni modificar (es prueba legal)

CREATE TABLE IF NOT EXISTS public.patient_authorizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('habeas_data', 'consentimiento_informado', 'telemedicina')),
  texto_mostrado  TEXT NOT NULL,
  aceptado        BOOLEAN NOT NULL DEFAULT false,
  firma_url       TEXT,
  firmado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address      TEXT,
  user_agent      TEXT,
  procedimiento   TEXT,
  medico_id       UUID REFERENCES public.profiles(id),
  notas           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.patient_authorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "doctor_read_authorizations" ON public.patient_authorizations
  FOR SELECT USING (medico_id = auth.uid());

CREATE POLICY IF NOT EXISTS "insert_authorization" ON public.patient_authorizations
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_patient_authorizations_patient ON public.patient_authorizations(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_authorizations_tipo ON public.patient_authorizations(tipo);
CREATE INDEX IF NOT EXISTS idx_patient_authorizations_medico ON public.patient_authorizations(medico_id);
