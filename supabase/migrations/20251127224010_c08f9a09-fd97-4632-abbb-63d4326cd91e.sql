-- Add required medical record fields for Colombian healthcare compliance
ALTER TABLE medical_records
ADD COLUMN IF NOT EXISTS patient_identification TEXT,
ADD COLUMN IF NOT EXISTS current_illness TEXT,
ADD COLUMN IF NOT EXISTS ros TEXT,
ADD COLUMN IF NOT EXISTS medical_history TEXT,
ADD COLUMN IF NOT EXISTS vital_signs JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS physical_exam TEXT,
ADD COLUMN IF NOT EXISTS diagnostic_aids TEXT,
ADD COLUMN IF NOT EXISTS cie10_code TEXT,
ADD COLUMN IF NOT EXISTS treatment TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS followup TEXT,
ADD COLUMN IF NOT EXISTS consent TEXT,
ADD COLUMN IF NOT EXISTS doctor_signature TEXT,
ADD COLUMN IF NOT EXISTS evolution_notes TEXT;

-- Add comment explaining the structure
COMMENT ON COLUMN medical_records.patient_identification IS 'Patient identification data';
COMMENT ON COLUMN medical_records.current_illness IS 'Current illness description';
COMMENT ON COLUMN medical_records.ros IS 'Review of Systems';
COMMENT ON COLUMN medical_records.medical_history IS 'Medical history and background';
COMMENT ON COLUMN medical_records.vital_signs IS 'Vital signs (BP, temp, heart rate, etc.) in JSON format';
COMMENT ON COLUMN medical_records.physical_exam IS 'Physical examination findings';
COMMENT ON COLUMN medical_records.diagnostic_aids IS 'Diagnostic tests and results';
COMMENT ON COLUMN medical_records.cie10_code IS 'ICD-10 diagnosis code';
COMMENT ON COLUMN medical_records.treatment IS 'Treatment plan';
COMMENT ON COLUMN medical_records.education IS 'Patient education provided';
COMMENT ON COLUMN medical_records.followup IS 'Follow-up instructions';
COMMENT ON COLUMN medical_records.consent IS 'Informed consent';
COMMENT ON COLUMN medical_records.doctor_signature IS 'Doctor signature image URL';
COMMENT ON COLUMN medical_records.evolution_notes IS 'Evolution notes (SOAP format)';