-- Drop ALL existing triggers on travel_quote_requests
DROP TRIGGER IF EXISTS trg_manus_webhook ON public.travel_quote_requests;
DROP TRIGGER IF EXISTS trg_manus_webhook_insert ON public.travel_quote_requests;
DROP TRIGGER IF EXISTS trg_manus_webhook_update ON public.travel_quote_requests;
DROP TRIGGER IF EXISTS on_quote_created ON public.travel_quote_requests;
DROP TRIGGER IF EXISTS on_quote_updated_to_pending ON public.travel_quote_requests;
DROP TRIGGER IF EXISTS notify_manus_webhook ON public.travel_quote_requests;

-- Recreate the function with logging
CREATE OR REPLACE FUNCTION public.notify_manus_webhook()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  payload jsonb;
  request_id bigint;
BEGIN
  IF NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  RAISE LOG '[MANUS] Trigger fired for quote %', NEW.id;

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', 'travel_quote_requests',
    'record', to_jsonb(NEW)
  );

  SELECT net.http_post(
    url := 'https://5000-ifzwr17x25c2fzmcemrhy-37136316.us1.manus.computer/webhook',
    body := payload,
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) INTO request_id;

  RAISE LOG '[MANUS] Webhook sent, request_id=%', request_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[MANUS] Webhook failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- Create exactly ONE trigger
CREATE TRIGGER trg_manus_webhook_single
  AFTER INSERT ON public.travel_quote_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_manus_webhook();
