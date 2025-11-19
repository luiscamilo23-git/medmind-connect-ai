-- Create notes_analysis table to store analyzed notes
CREATE TABLE public.notes_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  original_text TEXT NOT NULL,
  tasks TEXT[] DEFAULT '{}',
  main_ideas TEXT[] DEFAULT '{}',
  reminders TEXT[] DEFAULT '{}',
  is_voice_recording BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notes_analysis ENABLE ROW LEVEL SECURITY;

-- Policies for doctors to manage their own analyses
CREATE POLICY "Doctors can view their own analyses"
ON public.notes_analysis
FOR SELECT
USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own analyses"
ON public.notes_analysis
FOR INSERT
WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own analyses"
ON public.notes_analysis
FOR UPDATE
USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own analyses"
ON public.notes_analysis
FOR DELETE
USING (auth.uid() = doctor_id);

-- Add trigger for updated_at
CREATE TRIGGER update_notes_analysis_updated_at
BEFORE UPDATE ON public.notes_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();