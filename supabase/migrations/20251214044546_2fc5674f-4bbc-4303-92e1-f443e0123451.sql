-- Add whatsapp_instance_name column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_instance_name text;