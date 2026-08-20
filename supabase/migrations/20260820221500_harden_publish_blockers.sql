-- Security hardening required before publishing Tomorrow Travel.
-- No business data is modified by this migration.

-- 1) travel_quote_requests contains customer PII and operational payloads.
-- Existing policies already allow anonymous INSERT and restrict authenticated
-- SELECT/UPDATE/DELETE to admins; enabling RLS makes those policies effective.
ALTER TABLE public.travel_quote_requests ENABLE ROW LEVEL SECURITY;

-- 2) Modo Galera is operated server-side by whatsapp-webhook using Service Role.
-- Service Role bypasses RLS, so broad PUBLIC policies are unnecessary and expose PII.
DROP POLICY IF EXISTS "Service can insert travel_groups" ON public.travel_groups;
DROP POLICY IF EXISTS "Service can select travel_groups" ON public.travel_groups;
DROP POLICY IF EXISTS "Service can update travel_groups" ON public.travel_groups;

DROP POLICY IF EXISTS "Service can insert travel_group_members" ON public.travel_group_members;
DROP POLICY IF EXISTS "Service can select travel_group_members" ON public.travel_group_members;
DROP POLICY IF EXISTS "Service can update travel_group_members" ON public.travel_group_members;

-- 3) Reviews are created/updated by review-webhook using Service Role.
-- Public UPDATE allowed modification of any review row whose id was known.
DROP POLICY IF EXISTS "Public can update reviews" ON public.travel_reviews;

-- 4) Legacy RPC returns SETOF travel_offers (including internal raw_data/source_url)
-- under SECURITY DEFINER. The new public product uses travel-offers-public instead.
REVOKE EXECUTE ON FUNCTION public.search_travel_offers(text, text, date, date, integer, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_travel_offers(text, text, date, date, integer, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_travel_offers(text, text, date, date, integer, boolean) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.search_travel_offers(text, text, date, date, integer, boolean) TO service_role;
