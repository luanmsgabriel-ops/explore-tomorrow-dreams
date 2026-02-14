
CREATE TABLE public.travel_quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  phone_number TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  children_ages INTEGER[] DEFAULT '{}',
  customer_name TEXT,
  preferences TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  raw_request JSONB DEFAULT '{}'
);

ALTER TABLE public.travel_quote_requests ENABLE ROW LEVEL SECURITY;

-- Edge functions use service_role key which bypasses RLS
-- Admins can view/manage via dashboard
CREATE POLICY "Admins can manage travel quote requests"
  ON public.travel_quote_requests
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Allow public insert (from edge functions using service_role, but also as fallback)
CREATE POLICY "Service can insert travel quote requests"
  ON public.travel_quote_requests
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_travel_quote_requests_status ON public.travel_quote_requests(status);
CREATE INDEX idx_travel_quote_requests_created_at ON public.travel_quote_requests(created_at);
