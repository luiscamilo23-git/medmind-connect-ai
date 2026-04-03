-- MEDMIND: CUV (Código Único de Validación) de ADRES/SISPRO para RIPS
-- El CUV es emitido por ADRES al validar el RIPS vinculado a una factura electrónica

ALTER TABLE rips_batches
  ADD COLUMN IF NOT EXISTS cuv TEXT,                    -- Código Único de Validación de ADRES
  ADD COLUMN IF NOT EXISTS fecha_cuv TIMESTAMPTZ,       -- Fecha en que ADRES validó el RIPS
  ADD COLUMN IF NOT EXISTS adres_response JSONB;        -- Respuesta completa de ADRES/SISPRO
