-- Apply the migration logic directly for immediate validation
ALTER VIEW public.analytics_daily_stats SET (security_invoker = true);
REVOKE ALL ON public.analytics_daily_stats FROM anon;
REVOKE ALL ON public.analytics_daily_stats FROM public;
GRANT SELECT ON public.analytics_daily_stats TO authenticated;
GRANT ALL ON public.analytics_daily_stats TO service_role;