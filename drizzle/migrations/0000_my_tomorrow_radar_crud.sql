-- My Tomorrow Phase 4: Radar CRUD

create table if not exists public.travel_radars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_session_id uuid references public.trip_sessions(id) on delete set null,
  name text not null,
  status text not null default 'active',
  origin text,
  destination text,
  start_date date,
  end_date date,
  flexibility_days integer not null default 0,
  min_nights integer,
  max_nights integer,
  passengers integer,
  budget_min numeric,
  budget_max numeric,
  budget_currency text not null default 'BRL',
  offer_type text,
  offer_subtype text,
  category text,
  source text not null default 'manual',
  source_filters jsonb,
  last_checked_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint travel_radars_name_check check (char_length(trim(name)) between 1 and 120),
  constraint travel_radars_status_check check (status in ('active','paused','archived')),
  constraint travel_radars_flexibility_check check (flexibility_days between 0 and 60),
  constraint travel_radars_nights_check check (
    (min_nights is null or min_nights between 1 and 60)
    and (max_nights is null or max_nights between 1 and 60)
    and (min_nights is null or max_nights is null or min_nights <= max_nights)
  ),
  constraint travel_radars_passengers_check check (passengers is null or passengers between 1 and 20),
  constraint travel_radars_budget_check check (
    (budget_min is null or budget_min >= 0)
    and (budget_max is null or budget_max >= 0)
    and (budget_min is null or budget_max is null or budget_min <= budget_max)
  ),
  constraint travel_radars_offer_type_check check (offer_type is null or offer_type in ('bloqueio_aereo','pacote')),
  constraint travel_radars_offer_subtype_check check (offer_subtype is null or offer_subtype in ('bloqueio','nacional','internacional','evento','grupo_guiado')),
  constraint travel_radars_source_check check (source in ('manual','catalog')),
  constraint travel_radars_date_check check (start_date is null or end_date is null or start_date <= end_date)
);

create index if not exists idx_travel_radars_user_status on public.travel_radars (user_id, status, updated_at desc) where deleted_at is null;
create index if not exists idx_travel_radars_trip_session on public.travel_radars (trip_session_id) where deleted_at is null;

alter table public.travel_radars enable row level security;

grant select, insert, update, delete on public.travel_radars to authenticated;
grant all on public.travel_radars to service_role;

drop policy if exists "Users read own radars" on public.travel_radars;
create policy "Users read own radars"
  on public.travel_radars for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users insert own radars" on public.travel_radars;
create policy "Users insert own radars"
  on public.travel_radars for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      trip_session_id is null
      or exists (
        select 1 from public.trip_sessions s
        where s.id = trip_session_id and s.owner_user_id = auth.uid()
      )
    )
  );

drop policy if exists "Users update own radars" on public.travel_radars;
create policy "Users update own radars"
  on public.travel_radars for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      trip_session_id is null
      or exists (
        select 1 from public.trip_sessions s
        where s.id = trip_session_id and s.owner_user_id = auth.uid()
      )
    )
  );

drop policy if exists "Admins manage radars" on public.travel_radars;
create policy "Admins manage radars"
  on public.travel_radars for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());