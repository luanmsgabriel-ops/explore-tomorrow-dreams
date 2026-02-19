
-- Drop ALL existing policies on travel_quote_requests
DROP POLICY IF EXISTS "Anyone can insert travel quote requests" ON public.travel_quote_requests;
DROP POLICY IF EXISTS "Admins can select travel quote requests" ON public.travel_quote_requests;
DROP POLICY IF EXISTS "Admins can update travel quote requests" ON public.travel_quote_requests;
DROP POLICY IF EXISTS "Admins can delete travel quote requests" ON public.travel_quote_requests;
DROP POLICY IF EXISTS "Service can insert travel quote requests" ON public.travel_quote_requests;
DROP POLICY IF EXISTS "Admins can manage travel quote requests" ON public.travel_quote_requests;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.travel_quote_requests;
DROP POLICY IF EXISTS "Allow anonymous select" ON public.travel_quote_requests;
DROP POLICY IF EXISTS "Allow anonymous update" ON public.travel_quote_requests;
DROP POLICY IF EXISTS "Allow anonymous delete" ON public.travel_quote_requests;

-- Recreate as PERMISSIVE (default) policies
CREATE POLICY "Allow anonymous insert"
ON public.travel_quote_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated select"
ON public.travel_quote_requests
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Allow authenticated update"
ON public.travel_quote_requests
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Allow authenticated delete"
ON public.travel_quote_requests
FOR DELETE
TO authenticated
USING (is_admin());
