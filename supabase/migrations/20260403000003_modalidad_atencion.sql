-- MEDMIND: Modalidad de atención en historia clínica — Resolución 2654/2019 (Telemedicina)
-- Obligatorio registrar si la atención fue presencial o por telemedicina

ALTER TABLE public.medical_records
  ADD COLUMN IF NOT EXISTS modalidad_atencion TEXT
    NOT NULL DEFAULT 'presencial'
    CHECK (modalidad_atencion IN ('presencial', 'telemedicina_interactiva', 'telemedicina_no_interactiva'));

COMMENT ON COLUMN public.medical_records.modalidad_atencion IS
  'Modalidad de atención según Res. 2654/2019: presencial, telemedicina_interactiva, telemedicina_no_interactiva';
