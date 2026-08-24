create or replace function public.get_travel_catalog_facets(
  p_origin text default null,
  p_destination text default null,
  p_offer_type text default null,
  p_subtype text default null,
  p_category text default null
)
returns jsonb
language sql
stable
set search_path to 'pg_catalog', 'public'
as $function$
with source as (
  select
    btrim(t.origin_city) as origin,
    btrim(t.destination_name) as destination,
    t.offer_type,
    t.source_type,
    case
      when nullif(btrim(t.raw_data->>'categoria'), '') is not null then btrim(t.raw_data->>'categoria')
      when nullif(btrim(t.raw_data->>'tag'), '') is not null then btrim(t.raw_data->>'tag')
      when t.source_type = 'bloqueio' then 'Bloqueio aéreo'
      when t.source_type = 'nacional' then 'Nacional'
      when t.source_type = 'internacional' then 'Internacional'
      when t.source_type = 'evento' then 'Evento'
      when t.source_type = 'grupo_guiado' then 'Grupo guiado'
      else null
    end as category,
    t.departure_date,
    t.currency,
    t.price_per_person,
    t.updated_at
  from public.travel_offers_curated_source t
  where t.active is true
    and t.offer_type in ('bloqueio_aereo', 'pacote')
    and t.source_type in ('bloqueio', 'nacional', 'internacional', 'evento', 'grupo_guiado')
    and t.price_per_person > 0
    and t.departure_date is not null
    and t.departure_date >= current_date
    and (t.issue_deadline is null or t.issue_deadline >= now())
    and nullif(btrim(t.origin_city), '') is not null
    and nullif(btrim(t.destination_name), '') is not null
    and not (
      btrim(t.origin_city) ~ '^[A-Z]{3}$'
      and upper(btrim(t.origin_city)) = coalesce(t.origin_iata, '')
    )
    and char_length(btrim(t.destination_name)) <= 80
    and upper(btrim(t.destination_name)) not in ('CIDADE DE ORIGEM', 'EXCURSÃO')
), base as (
  select *
  from source s
  where (p_offer_type is null or s.offer_type = p_offer_type)
    and (p_subtype is null or s.source_type = p_subtype)
    and (
      p_category is null
      or public.unaccent(lower(coalesce(s.category, ''))) = public.unaccent(lower(btrim(p_category)))
    )
    and (
      p_origin is null
      or public.unaccent(lower(s.origin)) = public.unaccent(lower(btrim(p_origin)))
    )
    and (
      p_destination is null
      or public.unaccent(lower(s.destination)) = public.unaccent(lower(btrim(p_destination)))
    )
), origins as (
  select origin as value, count(*)::bigint as count
  from base
  group by origin
), destinations as (
  select destination as value, count(*)::bigint as count
  from base
  group by destination
), categories as (
  select category as value, count(*)::bigint as count
  from base
  where nullif(category, '') is not null
  group by category
), price_ranges as (
  select
    currency,
    min(price_per_person)::numeric as min_price,
    max(price_per_person)::numeric as max_price
  from base
  group by currency
)
select jsonb_build_object(
  'origins', coalesce((select jsonb_agg(jsonb_build_object('value', value, 'count', count) order by value) from origins), '[]'::jsonb),
  'destinations', coalesce((select jsonb_agg(jsonb_build_object('value', value, 'count', count) order by value) from destinations), '[]'::jsonb),
  'categories', coalesce((select jsonb_agg(jsonb_build_object('value', value, 'count', count) order by value) from categories), '[]'::jsonb),
  'date_range', jsonb_build_object('min', (select min(departure_date)::text from base), 'max', (select max(departure_date)::text from base)),
  'price_ranges', coalesce((select jsonb_agg(jsonb_build_object('currency', currency, 'min', min_price, 'max', max_price) order by currency nulls last) from price_ranges), '[]'::jsonb),
  'updated_at', coalesce((select max(updated_at)::text from base), now()::text),
  'notice', 'Preços e disponibilidade estão sujeitos à confirmação no momento da reserva.'
);
$function$;

revoke all on function public.get_travel_catalog_facets(text, text, text, text, text) from public;
grant execute on function public.get_travel_catalog_facets(text, text, text, text, text) to service_role;