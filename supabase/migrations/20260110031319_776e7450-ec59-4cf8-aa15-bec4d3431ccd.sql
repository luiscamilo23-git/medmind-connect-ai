-- Agregar campo sex a la tabla patients
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('masculino', 'femenino', 'otro'));