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

create index if not exists travel_radars_origin_airports_gin
  on public.travel_radars using gin (origin_airports);

comment on column public.travel_radars.origin_airports is
  'Explicit IATA origins selected by the customer. Empty means no origin constraint; UI should not create an empty origin radar unintentionally.';
comment on column public.travel_radars.boarding_priorities is
  'Explicit customer priorities used for explainability and future ranking. Multiple values allowed.';
comment on column public.travel_radars.sensitivity is
  'Alert sensitivity selected by customer: observer, attentive or hunter.';
