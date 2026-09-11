-- My Tomorrow Phase 3: Travel Profile + explicit preference signals
-- This migration is intentionally versioned but must remain unapplied until the 3-migration batch gate.

create table if not exists public.traveler_profile_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  home_origin_name text,
  home_origin_iata text,
  typical_party jsonb not null default '{}'::jsonb,
  budget_min numeric,
  budget_max numeric,
  budget_currency text not null default 'BRL',
  direct_flight_preference text not null default 'neutral',
  lodging_preferences text[] not null default '{}'::text[],
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint traveler_profile_settings_iata_check check (home_origin_iata is null or home_origin_iata ~ '^[A-Z]{3}$'),
  constraint traveler_profile_settings_budget_check check (
    (budget_min is null or budget_min >= 0)
    and (budget_max is null or budget_max >= 0)
    and (budget_min is null or budget_max is null or budget_min <= budget_max)
  ),
  constraint traveler_profile_settings_direct_flight_check check (
    direct_flight_preference in ('prefer_direct','neutral','accept_connections')
  )
);

create table if not exists public.traveler_preference_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preference_key text not null,
  response text not null,
  source text not null default 'onboarding',
  evidence jsonb,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint traveler_preference_events_key_check check (preference_key in (
    'praia','neve','parques','cidade','natureza','gastronomia','compras','aventura',
    'resort','all_inclusive','cruzeiro','eventos','cultura','vida_noturna','familia','casal'
  )),
  constraint traveler_preference_events_response_check check (response in ('want','like','neutral','not_for_me')),
  constraint traveler_preference_events_source_check check (source in ('onboarding','profile_edit','reset_replacement'))
);

create table if not exists public.traveler_affinities (
  user_id uuid not null references auth.users(id) on delete cascade,
  preference_key text not null,
  affinity_score numeric not null,
  evidence_count integer not null,
  want_count integer not null default 0,
  like_count integer not null default 0,
  neutral_count integer not null default 0,
  not_for_me_count integer not null default 0,
  recalculated_at timestamptz not null default now(),
  primary key (user_id, preference_key),
  constraint traveler_affinities_score_check check (affinity_score between -1 and 1),
  constraint traveler_affinities_evidence_check check (evidence_count >= 0)
);

create index if not exists idx_traveler_preference_events_user_active_created
  on public.traveler_preference_events (user_id, created_at desc)
  where revoked_at is null;

alter table public.traveler_profile_settings enable row level security;
alter table public.traveler_preference_events enable row level security;
alter table public.traveler_affinities enable row level security;

drop policy if exists "Users manage own travel profile settings" on public.traveler_profile_settings;
create policy "Users manage own travel profile settings"
  on public.traveler_profile_settings
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Admins manage travel profile settings" on public.traveler_profile_settings;
create policy "Admins manage travel profile settings"
  on public.traveler_profile_settings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users read own preference events" on public.traveler_preference_events;
create policy "Users read own preference events"
  on public.traveler_preference_events
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Admins manage preference events" on public.traveler_preference_events;
create policy "Admins manage preference events"
  on public.traveler_preference_events
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users read own affinities" on public.traveler_affinities;
create policy "Users read own affinities"
  on public.traveler_affinities
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Admins manage traveler affinities" on public.traveler_affinities;
create policy "Admins manage traveler affinities"
  on public.traveler_affinities
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.guard_traveler_preference_event_update()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if old.user_id is distinct from new.user_id
    or old.preference_key is distinct from new.preference_key
    or old.response is distinct from new.response
    or old.source is distinct from new.source
    or old.evidence is distinct from new.evidence
    or old.created_at is distinct from new.created_at
    or (old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at)
    or (old.revoked_at is null and new.revoked_at is null)
  then
    raise exception 'preference_event_immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_traveler_preference_event_update on public.traveler_preference_events;
create trigger trg_guard_traveler_preference_event_update
before update on public.traveler_preference_events
for each row execute function public.guard_traveler_preference_event_update();

create or replace function public.rebuild_my_traveler_affinities()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  delete from public.traveler_affinities where user_id = v_user_id;

  insert into public.traveler_affinities (
    user_id, preference_key, affinity_score, evidence_count,
    want_count, like_count, neutral_count, not_for_me_count, recalculated_at
  )
  select
    v_user_id,
    preference_key,
    round(avg(case response
      when 'want' then 1.0
      when 'like' then 0.5
      when 'neutral' then 0.0
      when 'not_for_me' then -1.0
    end)::numeric, 4),
    count(*)::integer,
    count(*) filter (where response = 'want')::integer,
    count(*) filter (where response = 'like')::integer,
    count(*) filter (where response = 'neutral')::integer,
    count(*) filter (where response = 'not_for_me')::integer,
    now()
  from public.traveler_preference_events
  where user_id = v_user_id and revoked_at is null
  group by preference_key;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.record_my_travel_preference(
  p_preference_key text,
  p_response text,
  p_source text default 'onboarding',
  p_evidence jsonb default null
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_preference_key not in (
    'praia','neve','parques','cidade','natureza','gastronomia','compras','aventura',
    'resort','all_inclusive','cruzeiro','eventos','cultura','vida_noturna','familia','casal'
  ) then raise exception 'invalid_preference_key'; end if;
  if p_response not in ('want','like','neutral','not_for_me') then raise exception 'invalid_preference_response'; end if;
  if p_source not in ('onboarding','profile_edit','reset_replacement') then raise exception 'invalid_preference_source'; end if;

  update public.traveler_preference_events
    set revoked_at = now()
    where user_id = v_user_id and preference_key = p_preference_key and revoked_at is null;

  insert into public.traveler_preference_events (user_id, preference_key, response, source, evidence)
  values (v_user_id, p_preference_key, p_response, p_source, p_evidence);

  return public.rebuild_my_traveler_affinities();
end;
$$;

create or replace function public.reset_my_travel_preferences()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;

  update public.traveler_preference_events
    set revoked_at = now()
    where user_id = v_user_id and revoked_at is null;

  return public.rebuild_my_traveler_affinities();
end;
$$;

revoke all on function public.rebuild_my_traveler_affinities() from public;
revoke all on function public.record_my_travel_preference(text, text, text, jsonb) from public;
revoke all on function public.reset_my_travel_preferences() from public;
grant execute on function public.rebuild_my_traveler_affinities() to authenticated;
grant execute on function public.record_my_travel_preference(text, text, text, jsonb) to authenticated;
grant execute on function public.reset_my_travel_preferences() to authenticated;
