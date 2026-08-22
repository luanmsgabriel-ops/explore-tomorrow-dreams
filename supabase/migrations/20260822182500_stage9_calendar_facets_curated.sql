-- Tomorrow Travel / Radar Tomorrow — Etapa 9
-- Faz as facetas do calendário respeitarem a mesma visibilidade da camada pública.

CREATE OR REPLACE FUNCTION public.get_travel_calendar_facets(
  p_origin text DEFAULT NULL::text,
  p_destination text DEFAULT NULL::text,
  p_offer_type text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path TO 'pg_catalog', 'public'
AS $function$
with base as (
  select
    btrim(t.origin_city) as origin,
    btrim(t.destination_name) as destination,
    t.departure_date,
    t.currency,
    t.price_per_person,
    t.updated_at
  from public.travel_offers_curated_source t
  where t.active is true
    and t.offer_type in ('bloqueio_aereo', 'pacote')
    and coalesce(t.source_type, '') <> 'grupo_guiado'
    and t.departure_date is not null
    and t.departure_date >= current_date
    and nullif(btrim(t.origin_city), '') is not null
    and nullif(btrim(t.destination_name), '') is not null
    and not (
      btrim(t.origin_city) ~ '^[A-Z]{3}$'
      and upper(btrim(t.origin_city)) = coalesce(t.origin_iata, '')
    )
    and char_length(btrim(t.destination_name)) <= 35
    and btrim(t.destination_name) !~ '[:,&]'
    and btrim(t.destination_name) not like '% — %'
    and btrim(t.destination_name) !~* '^(de|da) '
    and btrim(t.destination_name) !~* '^\d{1,2}\s+de\s+'
    and upper(btrim(t.destination_name)) not in ('CIDADE DE ORIGEM', 'EXCURSÃO')
    and (p_offer_type is null or t.offer_type = p_offer_type)
    and (
      p_origin is null
      or public.unaccent(lower(btrim(t.origin_city))) = public.unaccent(lower(btrim(p_origin)))
    )
    and (
      p_destination is null
      or public.unaccent(lower(btrim(t.destination_name))) = public.unaccent(lower(btrim(p_destination)))
    )
), origins as (
  select origin as value, count(*)::bigint as count
  from base
  group by origin
), destinations as (
  select destination as value, count(*)::bigint as count
  from base
  group by destination
), price_ranges as (
  select
    currency,
    min(price_per_person)::numeric as min_price,
    max(price_per_person)::numeric as max_price
  from base
  where price_per_person is not null and price_per_person > 0
  group by currency
)
select jsonb_build_object(
  'origins', coalesce((
    select jsonb_agg(jsonb_build_object('value', value, 'count', count) order by value)
    from origins
  ), '[]'::jsonb),
  'destinations', coalesce((
    select jsonb_agg(jsonb_build_object('value', value, 'count', count) order by value)
    from destinations
  ), '[]'::jsonb),
  'date_range', jsonb_build_object(
    'min', (select min(departure_date)::text from base),
    'max', (select max(departure_date)::text from base)
  ),
  'price_ranges', coalesce((
    select jsonb_agg(jsonb_build_object(
      'currency', currency,
      'min', min_price,
      'max', max_price
    ) order by currency nulls last)
    from price_ranges
  ), '[]'::jsonb),
  'updated_at', coalesce((select max(updated_at)::text from base), now()::text),
  'notice', 'Preços e disponibilidade estão sujeitos à confirmação no momento da reserva.'
);
$function$;
