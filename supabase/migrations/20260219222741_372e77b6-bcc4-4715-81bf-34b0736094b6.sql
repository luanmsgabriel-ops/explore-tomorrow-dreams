
-- Create trigger that fires when a new pending quote is inserted
CREATE OR REPLACE TRIGGER trg_process_quote_on_insert
  AFTER INSERT ON public.travel_quote_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.trigger_process_quote();
