-- Add knowledge base columns to profiles table for agent context
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS business_location TEXT,
ADD COLUMN IF NOT EXISTS business_services JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS business_hours TEXT,
ADD COLUMN IF NOT EXISTS business_additional_info TEXT;

COMMENT ON COLUMN public.profiles.business_description IS 'Description of the doctor business/clinic for AI agent context';
COMMENT ON COLUMN public.profiles.business_location IS 'Physical address or location of the business';
COMMENT ON COLUMN public.profiles.business_services IS 'Array of services with names and prices for AI agent';
COMMENT ON COLUMN public.profiles.business_hours IS 'Business hours information';
COMMENT ON COLUMN public.profiles.business_additional_info IS 'Additional info for the AI agent context';