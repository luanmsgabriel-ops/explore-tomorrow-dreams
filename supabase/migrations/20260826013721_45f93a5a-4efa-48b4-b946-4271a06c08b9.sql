-- Tomorrow Live Trip Composer — Etapa 1
-- Fundação persistente para planejamento colaborativo de viagens.
-- Não altera Téo, WhatsApp, public.travel_offers, client_trips ou active_trips.

CREATE TABLE public.traveler_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) BETWEEN 2 AND 160),
  email TEXT NOT NULL CHECK (char_length(trim(email)) BETWEEN 3 AND 320),
  whatsapp TEXT NOT NULL CHECK (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  share_consent_at TIMESTAMPTZ NOT NULL,
  commercial_contact_consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX traveler_profiles_email_lower_idx
  ON public.traveler_profiles (lower(email));

CREATE UNIQUE INDEX traveler_profiles_whatsapp_idx
  ON public.traveler_profiles (whatsapp);

CREATE INDEX traveler_profiles_user_idx
  ON public.traveler_profiles (user_id)
  WHERE user_id IS NOT NULL;

CREATE TABLE public.trip_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  traveler_profile_id UUID REFERENCES public.traveler_profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PLANNING'
    CHECK (status IN ('PLANNING', 'CONFIRMED_ITINERARY', 'PRE_TRIP', 'IN_TRIP', 'COMPLETED')),
  destination_name TEXT CHECK (destination_name IS NULL OR char_length(destination_name) <= 200),
  destination_external_id TEXT CHECK (destination_external_id IS NULL OR char_length(destination_external_id) <= 255),
  destination_lat DOUBLE PRECISION CHECK (destination_lat IS NULL OR destination_lat BETWEEN -90 AND 90),
  destination_lng DOUBLE PRECISION CHECK (destination_lng IS NULL OR destination_lng BETWEEN -180 AND 180),
  start_date DATE,
  end_date DATE,
  arrival_at TIMESTAMPTZ,
  departure_at TIMESTAMPTZ,
  base_name TEXT CHECK (base_name IS NULL OR char_length(base_name) <= 240),
  base_external_id TEXT CHECK (base_external_id IS NULL OR char_length(base_external_id) <= 255),
  base_lat DOUBLE PRECISION CHECK (base_lat IS NULL OR base_lat BETWEEN -90 AND 90),
  base_lng DOUBLE PRECISION CHECK (base_lng IS NULL OR base_lng BETWEEN -180 AND 180),
  passenger_composition JSONB NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(passenger_composition) = 'object'),
  pace TEXT CHECK (pace IS NULL OR pace IN ('RELAXED', 'BALANCED', 'INTENSE')),
  experience_budget JSONB CHECK (experience_budget IS NULL OR jsonb_typeof(experience_budget) = 'object'),
  current_day SMALLINT CHECK (current_day IS NULL OR current_day > 0),
  current_slot JSONB CHECK (current_slot IS NULL OR jsonb_typeof(current_slot) = 'object'),
  access_token_hash TEXT UNIQUE CHECK (access_token_hash IS NULL OR char_length(access_token_hash) = 64),
  share_token_hash TEXT UNIQUE CHECK (share_token_hash IS NULL OR char_length(share_token_hash) = 64),
  share_enabled_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date),
  CHECK (arrival_at IS NULL OR departure_at IS NULL OR arrival_at <= departure_at),
  CHECK (share_enabled_at IS NULL OR traveler_profile_id IS NOT NULL)
);

CREATE INDEX trip_sessions_traveler_idx
  ON public.trip_sessions (traveler_profile_id, updated_at DESC)
  WHERE traveler_profile_id IS NOT NULL;

CREATE INDEX trip_sessions_status_activity_idx
  ON public.trip_sessions (status, last_activity_at DESC);

CREATE INDEX trip_sessions_dates_idx
  ON public.trip_sessions (start_date, end_date)
  WHERE start_date IS NOT NULL;

CREATE TABLE public.trip_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_session_id UUID NOT NULL REFERENCES public.trip_sessions(id) ON DELETE CASCADE,
  day_number SMALLINT NOT NULL CHECK (day_number > 0),
  trip_date DATE,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PLANNED', 'LOCKED')),
  title TEXT CHECK (title IS NULL OR char_length(title) <= 160),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_session_id, day_number)
);

CREATE INDEX trip_days_session_date_idx
  ON public.trip_days (trip_session_id, trip_date, day_number);

CREATE TABLE public.trip_day_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_day_id UUID NOT NULL REFERENCES public.trip_days(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL
    CHECK (item_type IN ('EXPERIENCE', 'RESTAURANT', 'TRANSPORT', 'HOTEL', 'FREE_TIME', 'CUSTOM')),
  status TEXT NOT NULL DEFAULT 'SELECTED'
    CHECK (status IN ('SUGGESTED', 'SELECTED', 'CONFIRMED', 'REMOVED')),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN 0 AND 10000),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 240),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 4000),
  external_place_id TEXT CHECK (external_place_id IS NULL OR char_length(external_place_id) <= 255),
  latitude DOUBLE PRECISION CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  source_kind TEXT CHECK (source_kind IS NULL OR source_kind IN ('GOOGLE_PLACE', 'TOMORROW_EDITORIAL', 'TRAVEL_OFFER', 'USER_INPUT')),
  source_reference TEXT CHECK (source_reference IS NULL OR char_length(source_reference) <= 255),
  factual_snapshot JSONB CHECK (factual_snapshot IS NULL OR jsonb_typeof(factual_snapshot) = 'object'),
  planning_metadata JSONB CHECK (planning_metadata IS NULL OR jsonb_typeof(planning_metadata) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at <= ends_at)
);

CREATE INDEX trip_day_items_day_order_idx
  ON public.trip_day_items (trip_day_id, sort_order, starts_at);

CREATE INDEX trip_day_items_external_place_idx
  ON public.trip_day_items (external_place_id)
  WHERE external_place_id IS NOT NULL;

CREATE TABLE public.trip_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_session_id UUID NOT NULL REFERENCES public.trip_sessions(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL CHECK (preference_key ~ '^[a-z0-9_]{1,80}$'),
  preference_value JSONB NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('EXPLICIT', 'SELECTION', 'REJECTION')),
  weight NUMERIC(5,4) NOT NULL DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1),
  is_active BOOLEAN NOT NULL DEFAULT true,
  evidence JSONB CHECK (evidence IS NULL OR jsonb_typeof(evidence) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX trip_preferences_session_key_idx
  ON public.trip_preferences (trip_session_id, preference_key, is_active, source);

CREATE OR REPLACE FUNCTION public.trip_composer_stage1_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trip_composer_touch_traveler_profiles
  BEFORE UPDATE ON public.traveler_profiles
  FOR EACH ROW EXECUTE FUNCTION public.trip_composer_stage1_touch_updated_at();

CREATE TRIGGER trip_composer_touch_trip_sessions
  BEFORE UPDATE ON public.trip_sessions
  FOR EACH ROW EXECUTE FUNCTION public.trip_composer_stage1_touch_updated_at();

CREATE TRIGGER trip_composer_touch_trip_days
  BEFORE UPDATE ON public.trip_days
  FOR EACH ROW EXECUTE FUNCTION public.trip_composer_stage1_touch_updated_at();

CREATE TRIGGER trip_composer_touch_trip_day_items
  BEFORE UPDATE ON public.trip_day_items
  FOR EACH ROW EXECUTE FUNCTION public.trip_composer_stage1_touch_updated_at();

CREATE TRIGGER trip_composer_touch_trip_preferences
  BEFORE UPDATE ON public.trip_preferences
  FOR EACH ROW EXECUTE FUNCTION public.trip_composer_stage1_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.traveler_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_days TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_day_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_preferences TO authenticated;
GRANT ALL ON public.traveler_profiles TO service_role;
GRANT ALL ON public.trip_sessions TO service_role;
GRANT ALL ON public.trip_days TO service_role;
GRANT ALL ON public.trip_day_items TO service_role;
GRANT ALL ON public.trip_preferences TO service_role;

ALTER TABLE public.traveler_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_day_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_preferences ENABLE ROW LEVEL SECURITY;

-- Foundation is server-side by default. Service Role bypasses RLS.
-- Admin access exists for operational support/audit; no anon/authenticated public policy is created here.
CREATE POLICY "Admins can manage traveler profiles"
ON public.traveler_profiles FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
));

CREATE POLICY "Admins can manage trip sessions"
ON public.trip_sessions FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
));

CREATE POLICY "Admins can manage trip days"
ON public.trip_days FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
));

CREATE POLICY "Admins can manage trip day items"
ON public.trip_day_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
));

CREATE POLICY "Admins can manage trip preferences"
ON public.trip_preferences FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
));

COMMENT ON TABLE public.traveler_profiles IS
  'Identidade do viajante criada somente após gate de identificação/compartilhamento do Trip Composer.';
COMMENT ON TABLE public.trip_sessions IS
  'Raiz persistente de uma viagem em planejamento; pode permanecer anônima e ser vinculada a traveler_profiles posteriormente.';
COMMENT ON COLUMN public.trip_sessions.access_token_hash IS
  'SHA-256 de segredo de retomada emitido exclusivamente por backend. Nunca armazenar o segredo bruto.';
COMMENT ON COLUMN public.trip_sessions.share_token_hash IS
  'SHA-256 de token de compartilhamento emitido exclusivamente por backend. Nunca armazenar o token bruto.';
COMMENT ON TABLE public.trip_days IS
  'Dias estruturados pertencentes a uma trip_session.';
COMMENT ON TABLE public.trip_day_items IS
  'Itens mutáveis da timeline; factual_snapshot não autoriza inventar ou eternizar dados sujeitos a política de fornecedor.';
COMMENT ON TABLE public.trip_preferences IS
  'Preferências declaradas ou sinais derivados de seleção/rejeição; sinais inferidos não substituem preferência explícita.';