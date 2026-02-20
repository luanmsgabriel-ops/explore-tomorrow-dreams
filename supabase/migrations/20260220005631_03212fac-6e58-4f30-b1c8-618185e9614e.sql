-- Remove o trigger duplicado, mantendo apenas um
DROP TRIGGER IF EXISTS trg_process_quote_on_insert ON public.travel_quote_requests;