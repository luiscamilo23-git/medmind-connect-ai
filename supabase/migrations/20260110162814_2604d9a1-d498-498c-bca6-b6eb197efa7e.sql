-- Agregar campo signature_url a la tabla profiles para guardar la firma del doctor
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS signature_url TEXT;