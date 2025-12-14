-- Add last sync timestamp column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;