-- Fast, route-aware facet source for the public opportunities calendar.
--
-- The calendar must not build its origin/destination selectors by downloading
-- every valid offer. This helper aggregates the real inventory in PostgreSQL
-- and returns only route combinations that have both a usable origin and a
-- usable destination. The public Edge Function calls it with service_role and
-- performs the final presentation cleanup/deduplication.

CREATE OR REPLACE FUNCTION public.travel_offers_calendar_route_rows()
RETURNS TABLE (
  offer_type text,
  source_type text,
  origin_city text,
  origin_iata text,
  destination_name text,
  destination_iata text,
  min_departure_date date,
  max_departure_date date,
  offers bigint,
  currencies text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    t.offer_type::text,
    t.source_type::text,
    nullif(btrim(t.origin_city), '') AS origin_city,
    nullif(btrim(t.origin_iata), '') AS origin_iata,
    nullif(btrim(t.destination_name), '') AS destination_name,
    nullif(btrim(t.destination_iata), '') AS destination_iata,
    min(t.departure_date)::date AS min_departure_date,
    max(t.departure_date)::date AS max_departure_date,
    count(*)::bigint AS offers,
    coalesce(
      array_agg(DISTINCT upper(btrim(t.currency)))
        FILTER (WHERE nullif(btrim(t.currency), '') IS NOT NULL),
      ARRAY[]::text[]
    ) AS currencies
  FROM public.travel_offers AS t
  WHERE t.active = true
    AND t.offer_type IN ('bloqueio_aereo', 'pacote')
    AND t.source_type IN ('bloqueio', 'nacional', 'internacional', 'evento', 'grupo_guiado')
    AND t.price_per_person > 0
    AND t.departure_date >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
    AND (t.issue_deadline IS NULL OR t.issue_deadline >= now())
    AND nullif(btrim(t.origin_city), '') IS NOT NULL
    AND nullif(btrim(t.destination_name), '') IS NOT NULL
  GROUP BY
    t.offer_type,
    t.source_type,
    nullif(btrim(t.origin_city), ''),
    nullif(btrim(t.origin_iata), ''),
    nullif(btrim(t.destination_name), ''),
    nullif(btrim(t.destination_iata), '');
$$;

REVOKE ALL ON FUNCTION public.travel_offers_calendar_route_rows() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.travel_offers_calendar_route_rows() FROM anon;
REVOKE ALL ON FUNCTION public.travel_offers_calendar_route_rows() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.travel_offers_calendar_route_rows() TO service_role;
