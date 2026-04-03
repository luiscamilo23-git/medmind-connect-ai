-- MEDMIND: Campos adicionales sector salud en invoice_items
-- Requeridos por Resolución 000012 de 2021 (DIAN) y Resolución 2275 de 2023 (RIPS)

ALTER TABLE invoice_items
  -- Diagnóstico CIE-10 principal
  ADD COLUMN IF NOT EXISTS codigo_cie10              TEXT,     -- Ej: "J06.9"
  ADD COLUMN IF NOT EXISTS codigo_cie10_relacionado1 TEXT,
  ADD COLUMN IF NOT EXISTS codigo_cie10_relacionado2 TEXT,
  ADD COLUMN IF NOT EXISTS tipo_diagnostico          TEXT DEFAULT 'impresion_diagnostica'
    CHECK (tipo_diagnostico IN ('impresion_diagnostica', 'confirmado_nuevo', 'confirmado_repeticion')),

  -- Tipo de usuario del sistema de salud
  ADD COLUMN IF NOT EXISTS tipo_usuario_salud TEXT DEFAULT 'particular'
    CHECK (tipo_usuario_salud IN ('contributivo', 'subsidiado', 'vinculado', 'particular', 'otro')),

  -- Autorización EPS
  ADD COLUMN IF NOT EXISTS numero_autorizacion_eps TEXT,       -- Número autorización del asegurador
  ADD COLUMN IF NOT EXISTS nit_pagador              TEXT,      -- NIT de la EPS/aseguradora
  ADD COLUMN IF NOT EXISTS nombre_pagador           TEXT,      -- Nombre de la EPS

  -- MIPRES (prescripción electrónica de medicamentos y tecnologías no PBS)
  ADD COLUMN IF NOT EXISTS numero_mipres TEXT,

  -- Modalidad de prestación del servicio
  ADD COLUMN IF NOT EXISTS modalidad_prestacion TEXT DEFAULT 'consulta_externa'
    CHECK (modalidad_prestacion IN (
      'consulta_externa', 'urgencias', 'hospitalizacion',
      'cirugia_ambulatoria', 'domiciliaria', 'telemedicina'
    )),

  -- Causa de atención
  ADD COLUMN IF NOT EXISTS causa_atencion TEXT DEFAULT 'enfermedad_general'
    CHECK (causa_atencion IN (
      'enfermedad_general', 'accidente_trabajo', 'enfermedad_profesional',
      'accidente_transito', 'otro_accidente', 'lesion_agresion',
      'lesion_autoprovocada', 'sospecha_maltrato', 'maternidad'
    )),

  -- Profesional tratante
  ADD COLUMN IF NOT EXISTS registro_medico TEXT;               -- Registro médico del profesional

-- Índice para búsquedas de RIPS por diagnóstico
CREATE INDEX IF NOT EXISTS idx_invoice_items_cie10
  ON invoice_items(codigo_cie10) WHERE codigo_cie10 IS NOT NULL;
