-- Reconcile grants applied during the Phase 4 production gate.
-- This is intentionally additive: the original Phase 4 migration has already
-- been applied and remains immutable in migration history.

grant select, insert, update on table public.travel_radars to authenticated;
grant all privileges on table public.travel_radars to service_role;
