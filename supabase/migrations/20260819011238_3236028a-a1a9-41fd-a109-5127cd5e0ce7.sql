REVOKE SELECT, INSERT, UPDATE, DELETE ON public.quote_requests FROM authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.quote_requests FROM service_role;
REVOKE ALL ON public.quote_requests FROM anon;

GRANT INSERT ON public.quote_requests TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;
GRANT INSERT ON public.quote_requests TO anon;