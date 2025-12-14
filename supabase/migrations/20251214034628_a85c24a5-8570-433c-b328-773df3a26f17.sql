-- Add whatsapp_instance_name column to profiles table for Evolution API integration
ALTER TABLE public.profiles 
ADD COLUMN whatsapp_instance_name text;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.whatsapp_instance_name IS 'Evolution API instance name for WhatsApp integration';