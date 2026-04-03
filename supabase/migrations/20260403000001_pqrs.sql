-- MEDMIND: Sistema PQRS — Decreto 1011/2006, Resolución 1446/2006
-- Obligatorio para prestadores de servicios de salud en Colombia
-- Tiempo de respuesta: 15 días hábiles

DO $$ BEGIN
  CREATE TYPE pqrs_tipo AS ENUM ('peticion', 'queja', 'reclamo', 'sugerencia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE pqrs_estado AS ENUM ('pendiente', 'en_proceso', 'respondido', 'cerrado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.pqrs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo             pqrs_tipo NOT NULL,
  asunto           TEXT NOT NULL,
  descripcion      TEXT NOT NULL,
  doctor_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  patient_id       UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  nombre_remitente TEXT,
  email_remitente  TEXT,
  estado           pqrs_estado NOT NULL DEFAULT 'pendiente',
  respuesta        TEXT,
  respondido_en    TIMESTAMPTZ,
  fecha_limite     TIMESTAMPTZ NOT NULL,
  prioridad        TEXT NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('normal', 'urgente')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pqrs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "doctor_manage_pqrs" ON public.pqrs
  FOR ALL USING (auth.uid() = doctor_id);

CREATE POLICY IF NOT EXISTS "anyone_insert_pqrs" ON public.pqrs
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "patient_view_own_pqrs" ON public.pqrs
  FOR SELECT USING (auth.uid() = patient_id);

CREATE OR REPLACE FUNCTION update_pqrs_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pqrs_updated_at
  BEFORE UPDATE ON public.pqrs
  FOR EACH ROW EXECUTE FUNCTION update_pqrs_updated_at();
