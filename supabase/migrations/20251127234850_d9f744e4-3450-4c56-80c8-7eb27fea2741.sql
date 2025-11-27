-- Tabla para documentos médicos generados
CREATE TABLE IF NOT EXISTS public.medical_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  medical_record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'prescription', 'lab_order', 'image_order', 'certificate', 'referral', 'disability'
  document_data JSONB NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Doctors can view their own documents"
  ON public.medical_documents
  FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own documents"
  ON public.medical_documents
  FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own documents"
  ON public.medical_documents
  FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own documents"
  ON public.medical_documents
  FOR DELETE
  USING (auth.uid() = doctor_id);

-- Trigger para updated_at
CREATE TRIGGER update_medical_documents_updated_at
  BEFORE UPDATE ON public.medical_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para rendimiento
CREATE INDEX idx_medical_documents_doctor_id ON public.medical_documents(doctor_id);
CREATE INDEX idx_medical_documents_patient_id ON public.medical_documents(patient_id);
CREATE INDEX idx_medical_documents_type ON public.medical_documents(document_type);