
-- Add change_request column to travel_quote_requests
ALTER TABLE public.travel_quote_requests 
ADD COLUMN change_request text NULL;
