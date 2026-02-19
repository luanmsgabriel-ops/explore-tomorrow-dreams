
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Service can insert travel quote requests" ON public.travel_quote_requests;
DROP POLICY IF EXISTS "Admins can manage travel quote requests" ON public.travel_quote_requests;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Anyone can insert travel quote requests"
ON public.travel_quote_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can select travel quote requests"
ON public.travel_quote_requests
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update travel quote requests"
ON public.travel_quote_requests
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete travel quote requests"
ON public.travel_quote_requests
FOR DELETE
TO authenticated
USING (is_admin());
