-- Add sound preference column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notifications_sound_enabled boolean DEFAULT true;