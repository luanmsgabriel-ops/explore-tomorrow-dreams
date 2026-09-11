-- My Tomorrow Phase 6A: in-app Radar alerts
-- Third migration in the pending batch. Do not apply before the combined gate.

create table if not exists public.travel_radar_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  radar_id uuid not null references public.travel_radars(id) on delete cascade,
  match_id uuid references public.travel_radar_matches(id) on delete set null,
  offer_id uuid not null,
  alert_type text not null,
  dedupe_key text not null,
  match_class text,
  score numeric,
  offer_snapshot jsonb not null default '{}'::jsonb,
  reason jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint travel_radar_alerts_type_check check (alert_type in ('new_match','offer_changed')),
  constraint travel_radar_alerts_match_class_check check (match_class is null or match_class in ('exact','flexible','discovery')),
  constraint travel_radar_alerts_score_check check (score is null or (score >= 0 and score <= 100)),
  constraint travel_radar_alerts_dedupe_unique unique (user_id, dedupe_key)
);

create index if not exists idx_travel_radar_alerts_user_unread
  on public.travel_radar_alerts (user_id, created_at desc)
  where read_at is null;
create index if not exists idx_travel_radar_alerts_radar_created
  on public.travel_radar_alerts (radar_id, created_at desc);

alter table public.travel_radar_alerts enable row level security;

drop policy if exists "Users read own radar alerts" on public.travel_radar_alerts;
create policy "Users read own radar alerts"
  on public.travel_radar_alerts for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users mark own radar alerts read" on public.travel_radar_alerts;
create policy "Users mark own radar alerts read"
  on public.travel_radar_alerts for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Admins manage radar alerts" on public.travel_radar_alerts;
create policy "Admins manage radar alerts"
  on public.travel_radar_alerts for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, update on table public.travel_radar_alerts to authenticated;
grant all privileges on table public.travel_radar_alerts to service_role;
