CREATE TABLE public.travel_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    source_id TEXT NOT NULL,
    offer_type TEXT NOT NULL,
    origin_city TEXT,
    origin_iata TEXT,
    destination_name TEXT,
    destination_iata TEXT,
    departure_date DATE,
    return_date DATE,
    nights INTEGER,
    airline TEXT,
    outbound_departure_time TEXT,
    outbound_arrival_time TEXT,
    return_departure_time TEXT,
    return_arrival_time TEXT,
    available_seats INTEGER,
    currency TEXT DEFAULT 'BRL',
    price_per_person NUMERIC(12,2),
    boarding_tax NUMERIC(12,2),
    issue_deadline TIMESTAMP WITH TIME ZONE,
    source_url TEXT,
    active BOOLEAN DEFAULT true,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(source, source_id, offer_type)
);

CREATE TABLE public.travel_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    finished_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL,
    offers_found INTEGER DEFAULT 0,
    offers_created INTEGER DEFAULT 0,
    offers_updated INTEGER DEFAULT 0,
    offers_deactivated INTEGER DEFAULT 0,
    error_message TEXT
);

-- Grants
GRANT SELECT ON public.travel_offers TO authenticated;
GRANT ALL ON public.travel_offers TO service_role;

GRANT SELECT ON public.travel_sync_logs TO authenticated;
GRANT ALL ON public.travel_sync_logs TO service_role;

-- RLS
ALTER TABLE public.travel_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage travel_offers" ON public.travel_offers
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view travel_sync_logs" ON public.travel_sync_logs
    FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_travel_offers_updated_at
    BEFORE UPDATE ON public.travel_offers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();