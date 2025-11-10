-- Create enums (only if they don't exist)
DO $$ BEGIN
  CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.record_type AS ENUM ('consultation', 'procedure', 'diagnosis', 'prescription', 'lab_result', 'imaging');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.inventory_category AS ENUM ('medication', 'surgical', 'diagnostic', 'disposable', 'equipment', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  specialty TEXT,
  license_number TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- PATIENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  blood_type TEXT,
  allergies TEXT[],
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can view their own patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can insert their own patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can update their own patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can delete their own patients" ON public.patients;

-- Patients policies
CREATE POLICY "Doctors can view their own patients"
  ON public.patients FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own patients"
  ON public.patients FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own patients"
  ON public.patients FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own patients"
  ON public.patients FOR DELETE
  USING (auth.uid() = doctor_id);

-- =====================================================
-- APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  appointment_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  location TEXT,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can insert their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can delete their own appointments" ON public.appointments;

-- Appointments policies
CREATE POLICY "Doctors can view their own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own appointments"
  ON public.appointments FOR DELETE
  USING (auth.uid() = doctor_id);

-- =====================================================
-- MEDICAL RECORDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  record_type public.record_type NOT NULL,
  title TEXT NOT NULL,
  chief_complaint TEXT,
  symptoms TEXT[],
  diagnosis TEXT,
  treatment_plan TEXT,
  medications TEXT[],
  notes TEXT,
  voice_transcript TEXT,
  attachments TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can view their own medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Doctors can insert their own medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Doctors can update their own medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Doctors can delete their own medical records" ON public.medical_records;

-- Medical records policies
CREATE POLICY "Doctors can view their own medical records"
  ON public.medical_records FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own medical records"
  ON public.medical_records FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own medical records"
  ON public.medical_records FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own medical records"
  ON public.medical_records FOR DELETE
  USING (auth.uid() = doctor_id);

-- =====================================================
-- INVENTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category public.inventory_category NOT NULL,
  sku TEXT,
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10, 2),
  unit_price DECIMAL(10, 2),
  supplier TEXT,
  expiration_date DATE,
  location TEXT,
  notes TEXT,
  last_restock_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can view their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Doctors can insert their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Doctors can update their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Doctors can delete their own inventory" ON public.inventory;

-- Inventory policies
CREATE POLICY "Doctors can view their own inventory"
  ON public.inventory FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own inventory"
  ON public.inventory FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own inventory"
  ON public.inventory FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own inventory"
  ON public.inventory FOR DELETE
  USING (auth.uid() = doctor_id);

-- =====================================================
-- INVENTORY USAGE TABLE (tracking consumption)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.inventory_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  medical_record_id UUID REFERENCES public.medical_records(id) ON DELETE SET NULL,
  quantity_used INTEGER NOT NULL,
  notes TEXT,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.inventory_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors can view inventory usage for their items" ON public.inventory_usage;
DROP POLICY IF EXISTS "Doctors can insert inventory usage for their items" ON public.inventory_usage;

-- Inventory usage policies
CREATE POLICY "Doctors can view inventory usage for their items"
  ON public.inventory_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inventory
      WHERE inventory.id = inventory_usage.inventory_id
        AND inventory.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can insert inventory usage for their items"
  ON public.inventory_usage FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inventory
      WHERE inventory.id = inventory_usage.inventory_id
        AND inventory.doctor_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers (drop first to avoid errors)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_patients_updated_at ON public.patients;
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_medical_records_updated_at ON public.medical_records;
CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON public.inventory;
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NOW(),
    NOW()
  );
  
  -- Assign default 'doctor' role to new users
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (NEW.id, 'doctor', NOW());
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update inventory stock after usage
CREATE OR REPLACE FUNCTION public.update_inventory_stock_after_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.inventory
  SET current_stock = current_stock - NEW.quantity_used
  WHERE id = NEW.inventory_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update inventory after usage
DROP TRIGGER IF EXISTS update_stock_after_usage ON public.inventory_usage;
CREATE TRIGGER update_stock_after_usage
  AFTER INSERT ON public.inventory_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_stock_after_usage();

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_patients_doctor_id ON public.patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON public.medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_doctor_id ON public.inventory(doctor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory(category);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);