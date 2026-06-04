
CREATE TABLE IF NOT EXISTS public.flight_tracking_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  flight_iata TEXT NOT NULL,
  flight_date DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  last_status TEXT,
  last_delay_minutes INTEGER,
  last_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (phone_number, flight_iata, flight_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flight_tracking_subscriptions TO authenticated;
GRANT ALL ON public.flight_tracking_subscriptions TO service_role;

ALTER TABLE public.flight_tracking_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage flight subscriptions"
  ON public.flight_tracking_subscriptions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_flight_tracking_active
  ON public.flight_tracking_subscriptions(active, flight_date);

CREATE TRIGGER trg_flight_tracking_updated_at
  BEFORE UPDATE ON public.flight_tracking_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

SELECT cron.schedule(
  'flight-tracker-every-10-min',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wimdgvdpefkmjzzsklnt.supabase.co/functions/v1/flight-tracker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbWRndmRwZWZrbWp6enNrbG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjU2NDQsImV4cCI6MjA4MzkwMTY0NH0.dEUGvQvYbicZ6H_03HXLe0L74ZzjSr0FsaBHAMqOI80'
    ),
    body := '{}'::jsonb
  );
  $$
);
