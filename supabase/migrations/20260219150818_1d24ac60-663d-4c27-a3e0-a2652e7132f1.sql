
-- Remove overly permissive anonymous policies
DROP POLICY IF EXISTS "Anon can read travel quote requests" ON public.travel_quote_requests;
DROP POLICY IF EXISTS "Anon can update travel quote requests" ON public.travel_quote_requests;
