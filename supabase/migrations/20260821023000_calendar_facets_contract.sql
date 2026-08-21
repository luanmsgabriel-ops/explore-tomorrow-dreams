-- Canonical calendar route facets already validated in production.
-- This migration records the current safe database contract without granting RPC access
-- to anon/authenticated and without rewriting the whole inventory again.

create or replace function public.normalize_travel_offer_route_fields()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  mapped_name text;
  mapped_code text;
  code_count integer;
  suffix_code text;
begin
  new.origin_city := nullif(btrim(new.origin_city), '');
  new.destination_name := nullif(btrim(new.destination_name), '');
  new.origin_iata := nullif(upper(btrim(new.origin_iata)), '');
  new.destination_iata := nullif(upper(btrim(new.destination_iata)), '');

  if new.origin_iata is not null and new.origin_iata !~ '^[A-Z]{3}$' then
    new.origin_iata := null;
  end if;
  if new.destination_iata is not null and new.destination_iata !~ '^[A-Z]{3}$' then
    new.destination_iata := null;
  end if;

  if new.origin_iata is not null then
    select m.origin_name
      into mapped_name
      from public.travel_iata_map m
     where m.code = new.origin_iata
       and nullif(btrim(m.origin_name), '') is not null
     limit 1;
    if mapped_name is not null and upper(btrim(mapped_name)) <> new.origin_iata then
      new.origin_city := btrim(mapped_name);
    end if;
  end if;

  if new.origin_city is not null then
    select min(m.origin_name), min(m.code), count(distinct m.code)
      into mapped_name, mapped_code, code_count
      from public.travel_iata_map m
     where public.unaccent(lower(btrim(m.origin_name))) = public.unaccent(lower(btrim(new.origin_city)));
    if code_count > 0 and mapped_name is not null then
      new.origin_city := btrim(mapped_name);
      if new.origin_iata is null and code_count = 1 then
        new.origin_iata := mapped_code;
      end if;
    end if;
  end if;

  if new.destination_name is not null then
    suffix_code := upper(substring(new.destination_name from '\(([A-Za-z]{3})\)\s*$'));
    if suffix_code ~ '^[A-Z]{3}$' then
      new.destination_iata := coalesce(new.destination_iata, suffix_code);
    end if;
  end if;

  if new.destination_iata is not null then
    select m.destination_name
      into mapped_name
      from public.travel_iata_map m
     where m.code = new.destination_iata
       and nullif(btrim(m.destination_name), '') is not null
     limit 1;
    if mapped_name is not null and upper(btrim(mapped_name)) <> new.destination_iata then
      new.destination_name := btrim(mapped_name);
    end if;
  end if;

  if new.destination_name is not null then
    select min(m.destination_name), min(m.code), count(distinct m.code)
      into mapped_name, mapped_code, code_count
      from public.travel_iata_map m
     where public.unaccent(lower(btrim(m.destination_name))) = public.unaccent(lower(btrim(new.destination_name)));
    if code_count > 0 and mapped_name is not null then
      new.destination_name := btrim(mapped_name);
      if new.destination_iata is null and code_count = 1 then
        new.destination_iata := mapped_code;
      end if;
    end if;
  end if;

  return new;
end;
$$;

comment on function public.normalize_travel_offer_route_fields() is
  'Normaliza cidade/IATA de origem e destino usando somente travel_iata_map e códigos explícitos da fonte.';

drop trigger if exists trg_normalize_travel_offer_route_fields on public.travel_offers;
create trigger trg_normalize_travel_offer_route_fields
before insert or update of origin_city, origin_iata, destination_name, destination_iata
on public.travel_offers
for each row
execute function public.normalize_travel_offer_route_fields();

create or replace function public.get_travel_calendar_facets(
  p_origin text default null,
  p_destination text default null,
  p_offer_type text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
with base as (
  select
    btrim(t.origin_city) as origin,
    btrim(t.destination_name) as destination,
    t.departure_date,
    t.currency,
    t.price_per_person,
    t.updated_at
  from public.travel_offers t
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
$$;

revoke all on function public.get_travel_calendar_facets(text, text, text) from public;
revoke all on function public.get_travel_calendar_facets(text, text, text) from anon;
revoke all on function public.get_travel_calendar_facets(text, text, text) from authenticated;
grant execute on function public.get_travel_calendar_facets(text, text, text) to service_role;
