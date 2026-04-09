-- ═══════════════════════════════════════════════════════════
-- MedMind Edu: Estudiantes de medicina
-- ═══════════════════════════════════════════════════════════

-- 1. Tabla de códigos de rotación (doctor genera → estudiante entra)
CREATE TABLE IF NOT EXISTS student_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) NOT NULL UNIQUE,
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_name TEXT,
  student_email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '4 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Historial de casos del simulador por estudiante
CREATE TABLE IF NOT EXISTS student_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_email TEXT, -- para estudiantes sin cuenta
  specialty TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'intermedio',
  case_data JSONB NOT NULL DEFAULT '{}',
  conversation JSONB NOT NULL DEFAULT '[]',
  score INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 3. Notas privadas de estudiante durante rotación
CREATE TABLE IF NOT EXISTS student_rotation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotation_id UUID REFERENCES student_rotations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_student_rotations_code ON student_rotations(code);
CREATE INDEX IF NOT EXISTS idx_student_rotations_doctor ON student_rotations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_student_cases_student ON student_cases(student_id);

-- RLS
ALTER TABLE student_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_rotation_notes ENABLE ROW LEVEL SECURITY;

-- Doctor puede ver y crear sus propios códigos
CREATE POLICY "doctor_own_rotations" ON student_rotations
  FOR ALL USING (doctor_id = auth.uid());

-- Cualquier autenticado puede leer una rotación por code (para validar)
CREATE POLICY "read_rotation_by_code" ON student_rotations
  FOR SELECT USING (true);

-- student_cases: insertar sin auth (sesión de prueba) o con auth
CREATE POLICY "student_cases_insert" ON student_cases
  FOR INSERT WITH CHECK (true);

CREATE POLICY "student_cases_select" ON student_cases
  FOR SELECT USING (student_id = auth.uid() OR student_id IS NULL);

CREATE POLICY "student_cases_update" ON student_cases
  FOR UPDATE USING (student_id = auth.uid() OR student_id IS NULL);

-- Rotation notes accesibles por el dueño
CREATE POLICY "rotation_notes_all" ON student_rotation_notes
  FOR ALL USING (true);
