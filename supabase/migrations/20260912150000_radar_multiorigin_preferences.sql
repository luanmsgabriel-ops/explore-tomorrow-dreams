-- Radar Experience V2 — explicit multi-origin and multi-priority criteria.
-- IMPORTANT: additive only. Do not apply until the current migration batch reaches 3 files.

alter table public.travel_radars
  add column if not exists origin_airports text[] not null default '{}',
  add column if not exists boarding_priorities text[] not null default '{}',
  add column if not exists sensitivity text not null default 'attentive';

alter table public.travel_radars
  drop constraint if exists travel_radars_sensitivity_check;

alter table public.travel_radars
  add constraint travel_radars_sensitivity_check
  check (sensitivity in ('observer','attentive','hunter'));

-- Reconcile legacy radars created before multi-origin existed.
-- A three-letter origin previously stored in `origin` is an IATA selection.
update public.travel_radars
set origin_airports = array[upper(origin)], origin = null, updated_at = now()
where cardinality(origin_airports) = 0
  and origin ~* '^[a-z]{3}$';

-- The first immersive builder encoded "São Paulo airports" only in source_filters.
-- Promote that intent to an enforceable criterion so existing radars cannot match CNF/GYN/etc.
update public.travel_radars
set origin_airports = array['GRU','CGH','VCP'], updated_at = now()
where cardinality(origin_airports) = 0
  and source_filters ->> 'origin_scope' = 'sao_paulo_airports';

create index if not exists travel_radars_origin_airports_gin
  on public.travel_radars using gin (origin_airports);

comment on column public.travel_radars.origin_airports is
  'Explicit IATA origins selected by the customer. Empty means no origin constraint; UI should not create an empty origin radar unintentionally.';
comment on column public.travel_radars.boarding_priorities is
  'Explicit customer priorities used for explainability and future ranking. Multiple values allowed.';
comment on column public.travel_radars.sensitivity is
  'Alert sensitivity selected by customer: observer, attentive or hunter.';
