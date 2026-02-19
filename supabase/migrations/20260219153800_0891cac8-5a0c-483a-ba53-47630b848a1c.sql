
-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to call webhook
CREATE OR REPLACE FUNCTION public.notify_manus_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  payload jsonb;
BEGIN
  -- Only fire when status is 'pending'
  IF NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- For UPDATE, only fire if status changed to pending
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' THEN
    RETURN NEW;
  END IF;

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', 'travel_quote_requests',
    'record', to_jsonb(NEW)
  );

  PERFORM extensions.http_post(
    url := 'https://5000-ifzwr17x25c2fzmcemrhy-37136316.us1.manus.computer/webhook',
    body := payload::text,
    headers := jsonb_build_object('Content-Type', 'application/json')
  );

  RETURN NEW;
END;
$$;

-- Trigger for INSERT
CREATE TRIGGER trg_manus_webhook_insert
AFTER INSERT ON public.travel_quote_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_manus_webhook();

-- Trigger for UPDATE
CREATE TRIGGER trg_manus_webhook_update
AFTER UPDATE ON public.travel_quote_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_manus_webhook();
