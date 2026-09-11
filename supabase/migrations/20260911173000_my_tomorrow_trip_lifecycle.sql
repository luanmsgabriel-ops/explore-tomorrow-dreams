-- My Tomorrow Phase 2 — planning trip lifecycle.
-- This migration intentionally depends on Phase 1 ownership and is NOT meant to be applied alone.
-- Apply later together with the accumulated migration batch authorized by the project owner.

ALTER TABLE public.trip_sessions
  ADD COLUMN IF NOT EXISTS lifecycle_stage text NOT NULL DEFAULT 'planning',
  ADD COLUMN IF NOT EXISTS origin_name text,
  ADD COLUMN IF NOT EXISTS origin_iata text,
  ADD COLUMN IF NOT EXISTS budget_min numeric(12,2),
  ADD COLUMN IF NOT EXISTS budget_max numeric(12,2),
  ADD COLUMN IF NOT EXISTS budget_currency text NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS linked_client_trip_id uuid REFERENCES public.client_trips(id) ON DELETE SET NULL;

ALTER TABLE public.trip_sessions
  DROP CONSTRAINT IF EXISTS trip_sessions_lifecycle_stage_check;

ALTER TABLE public.trip_sessions
  ADD CONSTRAINT trip_sessions_lifecycle_stage_check
  CHECK (lifecycle_stage IN (
    'dreaming',
    'researching',
    'planning',
    'monitoring',
    'ready_to_buy',
    'booked',
    'traveling',
    'completed',
    'cancelled'
  ));

ALTER TABLE public.trip_sessions
  DROP CONSTRAINT IF EXISTS trip_sessions_budget_range_check;

ALTER TABLE public.trip_sessions
  ADD CONSTRAINT trip_sessions_budget_range_check
  CHECK (
    budget_min IS NULL
    OR budget_max IS NULL
    OR budget_min <= budget_max
  );

CREATE INDEX IF NOT EXISTS idx_trip_sessions_owner_lifecycle_activity
  ON public.trip_sessions (owner_user_id, lifecycle_stage, last_activity_at DESC)
  WHERE owner_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trip_sessions_linked_client_trip
  ON public.trip_sessions (linked_client_trip_id)
  WHERE linked_client_trip_id IS NOT NULL;

COMMENT ON COLUMN public.trip_sessions.lifecycle_stage IS
  'My Tomorrow lifecycle stage. Separate from Trip Composer runtime status.';

COMMENT ON COLUMN public.trip_sessions.linked_client_trip_id IS
  'Optional bridge to the operational client_trips record after purchase. No automatic conversion is performed.';
