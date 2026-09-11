-- My Tomorrow Phase 5: deterministic Radar matching persistence.

create table if not exists public.travel_radar_matches (
  id uuid primary key default gen_random_uuid(),
  radar_id uuid not null references public.travel_radars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  offer_id uuid not null,
  match_class text not null,
  algorithm_version text not null,
  score numeric(6,3) not null,
  matched_factors jsonb not null default '[]'::jsonb,
  unmatched_factors jsonb not null default '[]'::jsonb,
  offer_snapshot jsonb not null,
  offer_updated_at timestamptz,
  first_matched_at timestamptz not null default now(),
  last_matched_at timestamptz not null default now(),
  expired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint travel_radar_matches_class_check check (match_class in ('exact','flexible','discovery')),
  constraint travel_radar_matches_score_check check (score >= 0 and score <= 100),
  constraint travel_radar_matches_factors_check check (jsonb_typeof(matched_factors) = 'array' and jsonb_typeof(unmatched_factors) = 'array'),
  constraint travel_radar_matches_snapshot_check check (jsonb_typeof(offer_snapshot) = 'object'),
  constraint travel_radar_matches_unique unique (radar_id, offer_id, algorithm_version)
);

create index if not exists idx_travel_radar_matches_user_active
  on public.travel_radar_matches (user_id, last_matched_at desc)
  where expired_at is null;
create index if not exists idx_travel_radar_matches_radar_active
  on public.travel_radar_matches (radar_id, match_class, score desc, last_matched_at desc)
  where expired_at is null;

alter table public.travel_radar_matches enable row level security;

drop policy if exists "Users read own radar matches" on public.travel_radar_matches;
create policy "Users read own radar matches"
  on public.travel_radar_matches for select to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.travel_radars r
      where r.id = radar_id and r.user_id = auth.uid() and r.deleted_at is null
    )
  );

drop policy if exists "Admins manage radar matches" on public.travel_radar_matches;
create policy "Admins manage radar matches"
  on public.travel_radar_matches for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Clients may read their matches but cannot forge them directly.
grant select on table public.travel_radar_matches to authenticated;
grant all privileges on table public.travel_radar_matches to service_role;
