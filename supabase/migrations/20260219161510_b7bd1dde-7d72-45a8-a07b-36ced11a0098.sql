
-- Drop existing trigger that fires on both INSERT and UPDATE
DROP TRIGGER IF EXISTS trg_manus_webhook ON public.travel_quote_requests;
DROP TRIGGER IF EXISTS on_quote_created ON public.travel_quote_requests;
DROP TRIGGER IF EXISTS on_quote_updated_to_pending ON public.travel_quote_requests;

-- Recreate with INSERT only
CREATE TRIGGER trg_manus_webhook
  AFTER INSERT ON public.travel_quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_manus_webhook();
