-- Add modalidad column to services table for Colombian healthcare compliance
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS modalidad TEXT NOT NULL DEFAULT 'particular' 
CHECK (modalidad IN ('particular', 'eps_aseguradora'));

-- Add comment for clarity
COMMENT ON COLUMN public.services.modalidad IS 'Payment modality: particular (private pay) or eps_aseguradora (insurance/EPS)';

-- Add service_id to medical_records to link clinical records to services
ALTER TABLE public.medical_records 
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_medical_records_service_id ON public.medical_records(service_id);

-- Add rips_status column to track RIPS generation status for each medical record
ALTER TABLE public.medical_records 
ADD COLUMN IF NOT EXISTS rips_status TEXT DEFAULT 'no_aplica' 
CHECK (rips_status IN ('no_aplica', 'pendiente', 'generado', 'enviado'));

-- Add comments
COMMENT ON COLUMN public.medical_records.service_id IS 'Reference to the medical service associated with this clinical record';
COMMENT ON COLUMN public.medical_records.rips_status IS 'RIPS generation status: no_aplica (particular), pendiente, generado, enviado';