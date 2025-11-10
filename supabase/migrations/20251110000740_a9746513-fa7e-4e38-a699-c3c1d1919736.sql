-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'staff', 'patient');

-- Create enum for appointment status
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');

-- Create enum for medical record type
CREATE TYPE public.record_type AS ENUM ('consultation', 'procedure', 'diagnosis', 'prescription', 'lab_result', 'imaging');

-- Create enum for inventory category
CREATE TYPE public.inventory_category AS ENUM ('medication', 'surgical', 'diagnostic', 'disposable', 'equipment', 'other');

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE public.profiles (
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
-- USER ROLES TABLE
-- =====================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =====================================================
-- PATIENTS TABLE
-- =====================================================
CREATE TABLE public.patients (
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
CREATE TABLE public.appointments (
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
CREATE TABLE public.medical_records (
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
CREATE TABLE public.inventory (
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
CREATE TABLE public.inventory_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  medical_record_id UUID REFERENCES public.medical_records(id) ON DELETE SET NULL,
  quantity_used INTEGER NOT NULL,
  notes TEXT,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.inventory_usage ENABLE ROW LEVEL SECURITY;

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

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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
CREATE TRIGGER update_stock_after_usage
  AFTER INSERT ON public.inventory_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_stock_after_usage();

-- Create indexes for better performance
CREATE INDEX idx_patients_doctor_id ON public.patients(doctor_id);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_medical_records_doctor_id ON public.medical_records(doctor_id);
CREATE INDEX idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX idx_inventory_doctor_id ON public.inventory(doctor_id);
CREATE INDEX idx_inventory_category ON public.inventory(category);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);