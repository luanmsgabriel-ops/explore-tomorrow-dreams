
CREATE OR REPLACE FUNCTION public.notify_manus_webhook()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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

  -- Use net.http_post with correct signature (body as jsonb)
  PERFORM net.http_post(
    url := 'https://5000-ifzwr17x25c2fzmcemrhy-37136316.us1.manus.computer/webhook',
    body := payload,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block the insert
  RAISE WARNING 'Manus webhook notification failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trg_manus_webhook ON public.travel_quote_requests;
CREATE TRIGGER trg_manus_webhook
  AFTER INSERT OR UPDATE ON public.travel_quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_manus_webhook();
