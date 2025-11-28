-- Create document templates table
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL,
  specialty TEXT,
  document_type TEXT NOT NULL,
  template_name TEXT NOT NULL,
  custom_fields JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Doctors can view their own templates"
  ON public.document_templates
  FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own templates"
  ON public.document_templates
  FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own templates"
  ON public.document_templates
  FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own templates"
  ON public.document_templates
  FOR DELETE
  USING (auth.uid() = doctor_id);

-- Trigger for updated_at
CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();