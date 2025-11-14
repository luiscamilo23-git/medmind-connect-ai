-- Crear tabla para historial de sugerencias por especialidad
CREATE TABLE IF NOT EXISTS public.suggestion_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  specialty TEXT,
  question TEXT NOT NULL,
  reason TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  suggested_count INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  transcript_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_suggested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para rastrear preguntas que hace el doctor
CREATE TABLE IF NOT EXISTS public.doctor_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  specialty TEXT,
  frequency INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suggestion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_questions ENABLE ROW LEVEL SECURITY;

-- Políticas para suggestion_history
CREATE POLICY "Doctors can view their own suggestion history"
  ON public.suggestion_history
  FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "System can insert suggestion history"
  ON public.suggestion_history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update suggestion history"
  ON public.suggestion_history
  FOR UPDATE
  USING (true);

-- Políticas para doctor_questions
CREATE POLICY "Doctors can view their own questions"
  ON public.doctor_questions
  FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own questions"
  ON public.doctor_questions
  FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "System can update doctor questions"
  ON public.doctor_questions
  FOR UPDATE
  USING (true);

-- Índices para optimizar búsquedas
CREATE INDEX idx_suggestion_history_doctor_specialty 
  ON public.suggestion_history(doctor_id, specialty);
  
CREATE INDEX idx_suggestion_history_question 
  ON public.suggestion_history(question);
  
CREATE INDEX idx_doctor_questions_doctor_specialty 
  ON public.doctor_questions(doctor_id, specialty);
  
CREATE INDEX idx_doctor_questions_frequency 
  ON public.doctor_questions(frequency DESC);