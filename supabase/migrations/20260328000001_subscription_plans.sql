-- ============================================================
-- MEDMIND: Sistema de Planes y Suscripciones
-- ============================================================

-- Tabla de planes disponibles
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,           -- 'starter', 'profesional', 'clinica', 'universidad'
  display_name text NOT NULL,
  price_cop integer NOT NULL DEFAULT 0,
  max_doctors integer NOT NULL DEFAULT 1,
  features jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insertar planes base
INSERT INTO public.subscription_plans (name, display_name, price_cop, max_doctors, features) VALUES
(
  'starter',
  'Starter',
  89000,
  1,
  '["Historia clínica electrónica", "VoiceNotes MD (transcripción IA)", "Gestión de pacientes ilimitados", "Agenda inteligente", "3 especialidades", "Asistente IA", "Documentos médicos básicos"]'
),
(
  'profesional',
  'Profesional',
  189000,
  1,
  '["Todo Starter", "Facturación electrónica DIAN", "RIPS automatizados", "Agente IA WhatsApp 24/7", "10 especialidades", "Documentos ilimitados", "Inventario clínico SupplyLens", "Analytics avanzado", "Red social médica"]'
),
(
  'clinica',
  'Clínica',
  390000,
  5,
  '["Todo Profesional", "Hasta 5 médicos", "Dashboard centralizado", "Análisis predictivo", "Módulo moderador", "Soporte prioritario", "Reportes ejecutivos"]'
),
(
  'universidad',
  'Universidad',
  0,
  1,
  '["Acceso completo para práctica", "Historia clínica electrónica", "VoiceNotes MD", "Agenda", "Sin facturación DIAN", "Para estudiantes de medicina"]'
);

-- Tabla de suscripciones activas
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'trial'
    CHECK (status IN ('trial', 'active', 'cancelled', 'past_due', 'expired')),
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  mercadopago_sub_id text,
  mercadopago_payer_id text,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(doctor_id)
);

-- Índices
CREATE INDEX idx_subscriptions_doctor_id ON public.subscriptions(doctor_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_trial_ends ON public.subscriptions(trial_ends_at);

-- RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Planes: todos pueden leerlos (página pública de pricing)
CREATE POLICY "Planes son públicos"
  ON public.subscription_plans FOR SELECT
  USING (true);

-- Suscripciones: solo el propio doctor
CREATE POLICY "Doctor ve su suscripción"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctor actualiza su suscripción"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Sistema inserta suscripciones"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

-- Función para crear trial automático al registrarse
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS trigger AS $$
DECLARE
  plan_profesional_id uuid;
BEGIN
  -- Solo para doctores
  IF NEW.role != 'doctor' THEN
    RETURN NEW;
  END IF;

  -- Obtener plan profesional
  SELECT id INTO plan_profesional_id
  FROM public.subscription_plans
  WHERE name = 'profesional';

  -- Crear suscripción trial de 30 días
  INSERT INTO public.subscriptions (
    doctor_id,
    plan_id,
    status,
    trial_ends_at
  ) VALUES (
    NEW.id,
    plan_profesional_id,
    'trial',
    now() + interval '30 days'
  )
  ON CONFLICT (doctor_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: crear trial cuando se crea perfil de doctor
CREATE TRIGGER on_doctor_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_trial_subscription();

-- Función helper: verificar si doctor tiene plan activo
CREATE OR REPLACE FUNCTION public.get_doctor_subscription_status(p_doctor_id uuid)
RETURNS jsonb AS $$
DECLARE
  sub record;
  plan record;
  result jsonb;
BEGIN
  SELECT s.*, sp.name as plan_name, sp.display_name, sp.price_cop, sp.features, sp.max_doctors
  INTO sub
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON s.plan_id = sp.id
  WHERE s.doctor_id = p_doctor_id;

  IF NOT FOUND THEN
    RETURN '{"status": "no_subscription", "is_active": false}'::jsonb;
  END IF;

  -- Verificar si trial expiró
  IF sub.status = 'trial' AND sub.trial_ends_at < now() THEN
    UPDATE public.subscriptions SET status = 'expired' WHERE doctor_id = p_doctor_id;
    RETURN jsonb_build_object(
      'status', 'expired',
      'is_active', false,
      'plan_name', sub.plan_name
    );
  END IF;

  RETURN jsonb_build_object(
    'status', sub.status,
    'is_active', sub.status IN ('trial', 'active'),
    'plan_name', sub.plan_name,
    'display_name', sub.display_name,
    'trial_ends_at', sub.trial_ends_at,
    'current_period_end', sub.current_period_end,
    'features', sub.features,
    'max_doctors', sub.max_doctors,
    'days_remaining', CASE
      WHEN sub.status = 'trial' THEN EXTRACT(DAY FROM (sub.trial_ends_at - now()))::int
      ELSE NULL
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
