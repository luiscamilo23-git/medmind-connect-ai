-- Fix search_path for the update_chat_room_last_message function
CREATE OR REPLACE FUNCTION public.update_chat_room_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  UPDATE public.chat_rooms
  SET last_message_at = NEW.created_at
  WHERE id = NEW.chat_room_id;
  RETURN NEW;
END;
$$;