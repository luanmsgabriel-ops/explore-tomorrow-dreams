
-- Tabela de viagens ativas para o concierge
CREATE TABLE public.active_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_phone TEXT NOT NULL,
  client_name TEXT,
  destination_city TEXT,
  destination_country TEXT,
  destination_lat DECIMAL(10,7),
  destination_lng DECIMAL(10,7),
  destination_timezone TEXT DEFAULT 'America/Sao_Paulo',
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  outbound_flight_iata TEXT,
  outbound_flight_date DATE,
  return_flight_iata TEXT,
  return_flight_date DATE,
  hotel_name TEXT,
  concierge_active BOOLEAN DEFAULT true,
  daily_messages_sent INTEGER DEFAULT 0,
  last_message_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.active_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage active_trips"
ON public.active_trips FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Tabela de alertas do concierge
CREATE TABLE public.concierge_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.active_trips(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  alert_content TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.concierge_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage concierge_alerts"
ON public.concierge_alerts FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Tabela de recomendações por localização
CREATE TABLE public.location_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.active_trips(id) ON DELETE CASCADE,
  client_lat DECIMAL(10,7),
  client_lng DECIMAL(10,7),
  recommendations JSONB,
  map_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.location_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage location_recommendations"
ON public.location_recommendations FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at na active_trips
CREATE TRIGGER update_active_trips_updated_at
BEFORE UPDATE ON public.active_trips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
