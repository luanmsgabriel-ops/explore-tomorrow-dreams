
-- Allow anon/service to SELECT pending quotes (for Manus polling)
CREATE POLICY "Anon can read travel quote requests"
ON public.travel_quote_requests
FOR SELECT
USING (true);

-- Allow anon/service to UPDATE quote status (for Manus updates)
CREATE POLICY "Anon can update travel quote requests"
ON public.travel_quote_requests
FOR UPDATE
USING (true)
WITH CHECK (true);
