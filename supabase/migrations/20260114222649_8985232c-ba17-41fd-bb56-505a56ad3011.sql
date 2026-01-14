-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Service role can manage usage tracking" ON public.ai_usage_tracking;

-- Create restrictive policies - service role bypasses RLS automatically
-- Regular users should have no access to this table
CREATE POLICY "No public access to usage tracking"
ON public.ai_usage_tracking
FOR ALL
USING (false)
WITH CHECK (false);