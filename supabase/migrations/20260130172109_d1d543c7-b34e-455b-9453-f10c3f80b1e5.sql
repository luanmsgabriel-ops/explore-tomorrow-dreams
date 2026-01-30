-- Create indexes to speed up RLS policy checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_client_trips_user_id ON public.client_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_client_trips_departure_date ON public.client_trips(departure_date);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON public.quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON public.quote_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_created_at ON public.ai_itineraries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generated_images_created_at ON public.ai_generated_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_destinations_is_active ON public.destinations(is_active);
CREATE INDEX IF NOT EXISTS idx_destinations_type ON public.destinations(type);
CREATE INDEX IF NOT EXISTS idx_destinations_is_active_type ON public.destinations(is_active, type);
CREATE INDEX IF NOT EXISTS idx_promotional_offers_is_active ON public.promotional_offers(is_active);
CREATE INDEX IF NOT EXISTS idx_account_shared_access_primary_user ON public.account_shared_access(primary_user_id);
CREATE INDEX IF NOT EXISTS idx_account_shared_access_shared_user ON public.account_shared_access(shared_user_id);

-- Analyze tables to update statistics
ANALYZE public.user_roles;
ANALYZE public.profiles;
ANALYZE public.client_trips;
ANALYZE public.quote_requests;
ANALYZE public.ai_itineraries;
ANALYZE public.ai_generated_images;
ANALYZE public.destinations;
ANALYZE public.promotional_offers;
ANALYZE public.account_shared_access;