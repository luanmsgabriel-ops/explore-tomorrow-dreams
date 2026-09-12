-- Radar v1.1 reconciliation: old algorithm matches must not remain active.
-- Applied only as part of the controlled 3-migration batch.

update public.travel_radar_matches
set
  expired_at = coalesce(expired_at, now()),
  updated_at = now()
where algorithm_version <> 'radar-v1.1.0'
  and expired_at is null;

comment on table public.travel_radar_matches is
  'Versioned Radar matches. Only matches from the current algorithm version may be presented as active.';
