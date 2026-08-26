create table if not exists public.travel_offer_selections (
  id uuid primary key default gen_random_uuid(),
  public_token text not null unique,
  title text not null,
  description text,
  offer_ids uuid[] not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  is_active boolean not null default true,
  constraint travel_offer_selections_title_length check (char_length(title) between 1 and 120),
  constraint travel_offer_selections_description_length check (description is null or char_length(description) <= 500),
  constraint travel_offer_selections_offer_count check (cardinality(offer_ids) between 1 and 12)
);

create unique index if not exists travel_offer_selections_public_token_idx
  on public.travel_offer_selections (public_token);

create index if not exists travel_offer_selections_expires_at_idx
  on public.travel_offer_selections (expires_at)
  where is_active = true;

alter table public.travel_offer_selections enable row level security;

revoke all on table public.travel_offer_selections from anon, authenticated;

grant all on table public.travel_offer_selections to service_role;

comment on table public.travel_offer_selections is
  'Private backing store for public Tomorrow Travel offer-selection links. Access only through travel-offer-selection Edge Function.';