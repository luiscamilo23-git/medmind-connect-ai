-- ============================================================
-- MEDMIND: WhatsApp Human Takeover
-- Permite al médico tomar control manual de conversaciones
-- ============================================================

-- Agregar campos a chat_rooms para control del bot
ALTER TABLE public.chat_rooms
  ADD COLUMN IF NOT EXISTS is_bot_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_human_message_at timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_phone text,
  ADD COLUMN IF NOT EXISTS unread_count integer NOT NULL DEFAULT 0;

-- Tabla de mensajes WhatsApp (separada de chat_messages interno)
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_phone text NOT NULL,
  patient_name text,
  is_bot_active boolean NOT NULL DEFAULT true,
  last_message text,
  last_message_at timestamptz,
  unread_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, patient_phone)
);

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender text NOT NULL CHECK (sender IN ('patient', 'bot', 'doctor')),
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  evolution_message_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_whatsapp_conv_doctor ON public.whatsapp_conversations(doctor_id);
CREATE INDEX idx_whatsapp_conv_updated ON public.whatsapp_conversations(updated_at DESC);
CREATE INDEX idx_whatsapp_msg_conv ON public.whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_msg_created ON public.whatsapp_messages(created_at DESC);

-- RLS
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctor ve sus conversaciones WhatsApp"
  ON public.whatsapp_conversations FOR ALL
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctor ve mensajes de sus conversaciones"
  ON public.whatsapp_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_conversations wc
      WHERE wc.id = whatsapp_messages.conversation_id
      AND wc.doctor_id = auth.uid()
    )
  );

-- Habilitar Realtime para conversaciones
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
