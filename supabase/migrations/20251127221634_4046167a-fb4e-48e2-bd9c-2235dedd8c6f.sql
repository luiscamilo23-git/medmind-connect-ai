-- Enable realtime for dian_webhook_events table
ALTER TABLE public.dian_webhook_events REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.dian_webhook_events;

-- Create a function to send email notifications when webhooks are received
CREATE OR REPLACE FUNCTION public.notify_webhook_received()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- This trigger will be used to log webhook events for realtime notifications
  -- The actual email sending will be handled by the edge function
  RETURN NEW;
END;
$$;

-- Create trigger for webhook notifications
CREATE TRIGGER on_webhook_received
  AFTER INSERT ON public.dian_webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_webhook_received();