-- Add 'patient' role to the enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'patient';

-- Create doctor_reviews table
CREATE TABLE IF NOT EXISTS public.doctor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  doctor_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  photos text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on doctor_reviews
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for doctor_reviews
CREATE POLICY "Anyone can view reviews"
  ON public.doctor_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Patients can insert their own reviews"
  ON public.doctor_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id AND public.has_role(auth.uid(), 'patient'));

CREATE POLICY "Patients can update their own reviews"
  ON public.doctor_reviews
  FOR UPDATE
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can delete their own reviews"
  ON public.doctor_reviews
  FOR DELETE
  USING (auth.uid() = patient_id);

-- Create ai_wellness_tips table
CREATE TABLE IF NOT EXISTS public.ai_wellness_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  tip_type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on ai_wellness_tips
ALTER TABLE public.ai_wellness_tips ENABLE ROW LEVEL SECURITY;

-- Policies for ai_wellness_tips
CREATE POLICY "Patients can view their own tips"
  ON public.ai_wellness_tips
  FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own tips"
  ON public.ai_wellness_tips
  FOR UPDATE
  USING (auth.uid() = patient_id);

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  doctor_id uuid NOT NULL,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(patient_id, doctor_id)
);

-- Enable RLS on chat_rooms
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Policies for chat_rooms
CREATE POLICY "Users can view their own chat rooms"
  ON public.chat_rooms
  FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

CREATE POLICY "Patients can create chat rooms"
  ON public.chat_rooms
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_messages
CREATE POLICY "Users can view messages in their chat rooms"
  ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE chat_rooms.id = chat_messages.chat_room_id
      AND (chat_rooms.patient_id = auth.uid() OR chat_rooms.doctor_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their chat rooms"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE chat_rooms.id = chat_messages.chat_room_id
      AND (chat_rooms.patient_id = auth.uid() OR chat_rooms.doctor_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.chat_messages
  FOR UPDATE
  USING (auth.uid() = sender_id);

-- Add fields to profiles for public doctor information
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS clinic_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certifications text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_experience integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consultation_fee numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_accepting_patients boolean DEFAULT true;

-- Create function to update chat room last message time
CREATE OR REPLACE FUNCTION update_chat_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_rooms
  SET last_message_at = NEW.created_at
  WHERE id = NEW.chat_room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for chat messages
DROP TRIGGER IF EXISTS update_chat_room_timestamp ON public.chat_messages;
CREATE TRIGGER update_chat_room_timestamp
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_room_last_message();

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;