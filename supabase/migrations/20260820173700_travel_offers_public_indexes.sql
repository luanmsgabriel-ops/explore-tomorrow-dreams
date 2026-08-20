-- Read-only query indexes for the public travel offers Edge Function.
-- No grants or RLS changes: the Edge Function remains the security boundary.

CREATE INDEX IF NOT EXISTS idx_travel_offers_public_active_departure
  ON public.travel_offers (departure_date, updated_at DESC)
  INCLUDE (offer_type, source_type, price_per_person)
  WHERE active IS TRUE AND price_per_person > 0;

CREATE INDEX IF NOT EXISTS idx_travel_offers_public_type_subtype_date
  ON public.travel_offers (offer_type, source_type, departure_date, price_per_person)
  INCLUDE (available_seats, boarding_tax, updated_at)
  WHERE active IS TRUE AND price_per_person > 0;

CREATE INDEX IF NOT EXISTS idx_travel_offers_public_route_calendar
  ON public.travel_offers (origin_iata, destination_iata, departure_date, price_per_person)
  INCLUDE (offer_type, source_type, available_seats, boarding_tax, updated_at)
  WHERE active IS TRUE AND price_per_person > 0;

CREATE INDEX IF NOT EXISTS idx_travel_offers_public_city_route_date
  ON public.travel_offers (origin_city, destination_name, departure_date, price_per_person)
  INCLUDE (offer_type, source_type, available_seats, boarding_tax, updated_at)
  WHERE active IS TRUE AND price_per_person > 0;

CREATE INDEX IF NOT EXISTS idx_travel_offers_public_price_date
  ON public.travel_offers (price_per_person, departure_date)
  INCLUDE (offer_type, source_type, origin_iata, destination_iata, updated_at)
  WHERE active IS TRUE AND price_per_person > 0;
