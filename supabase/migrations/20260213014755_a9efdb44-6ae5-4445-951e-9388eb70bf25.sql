
-- Remove overly permissive policy (service role bypasses RLS anyway)
DROP POLICY IF EXISTS "Service role full access whatsapp" ON public.whatsapp_conversations;
