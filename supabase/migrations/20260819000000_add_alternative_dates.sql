ALTER TABLE public.travel_offers ADD COLUMN IF NOT EXISTS alternative_dates text;
GRANT ALL ON TABLE public.travel_offers TO authenticated, service_role;
