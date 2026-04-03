-- MEDMIND: Configuración Software Propio DIAN por médico
-- Permite a MEDMIND emitir facturas electrónicas directamente a DIAN
-- sin depender de terceros (Alegra/Siigo/Alanube)

CREATE TABLE IF NOT EXISTS dian_software_config (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Identificación fiscal
  nit                 TEXT NOT NULL,        -- NIT sin dígito verificador (ej: "900123456")
  dv                  INTEGER NOT NULL,     -- Dígito verificador calculado (módulo 11)
  nombre_empresa      TEXT NOT NULL,
  direccion           TEXT,
  ciudad              TEXT,
  departamento        TEXT,
  email_facturacion   TEXT,
  telefono            TEXT,

  -- Rango de numeración autorizado por DIAN
  prefijo             TEXT DEFAULT '',      -- Ej: "SEMD" o vacío
  rango_desde         BIGINT NOT NULL,      -- Primer número de la resolución
  rango_hasta         BIGINT NOT NULL,      -- Último número de la resolución
  ultimo_numero       BIGINT DEFAULT 0,     -- Último número usado (autoincremental)
  technical_key       TEXT NOT NULL,        -- ClaveAcceso de DIAN (GetNumberingRange)
  resolucion_dian     TEXT NOT NULL,        -- Número de resolución (ej: "18764000001")
  fecha_resolucion    DATE NOT NULL,        -- Fecha de la resolución DIAN

  -- Certificado digital X.509 (guardado en Supabase Vault)
  cert_vault_key      TEXT,                 -- Referencia al secreto en Supabase Vault
  cert_expiry         DATE,                 -- Fecha de vencimiento del certificado

  -- Entorno de emisión
  environment         TEXT NOT NULL DEFAULT 'habilitacion'
                        CHECK (environment IN ('habilitacion', 'produccion')),
  activo              BOOLEAN DEFAULT true,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(doctor_id)
);

-- RLS: cada médico solo ve y edita su propia configuración
ALTER TABLE dian_software_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctor_own_config" ON dian_software_config
  USING (auth.uid() = doctor_id);

CREATE POLICY "doctor_insert_config" ON dian_software_config
  FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "doctor_update_config" ON dian_software_config
  FOR UPDATE USING (auth.uid() = doctor_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_dian_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dian_software_config_updated_at
  BEFORE UPDATE ON dian_software_config
  FOR EACH ROW EXECUTE FUNCTION update_dian_config_timestamp();
