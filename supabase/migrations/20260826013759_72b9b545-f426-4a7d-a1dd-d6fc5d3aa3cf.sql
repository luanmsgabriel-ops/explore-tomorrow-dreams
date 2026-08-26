-- Tomorrow Live Trip Composer — Etapa 2
-- Camada própria de identidade/curadoria. Não replica respostas completas do Google Places.

CREATE TABLE public.travel_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT UNIQUE,
  canonical_name TEXT NOT NULL CHECK (char_length(canonical_name) BETWEEN 1 AND 200),
  destination_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  primary_category TEXT,
  editorial_tags TEXT[] NOT NULL DEFAULT '{}',
  indoor_outdoor TEXT CHECK (indoor_outdoor IS NULL OR indoor_outdoor IN ('indoor','outdoor','mixed')),
  rain_sensitivity SMALLINT CHECK (rain_sensitivity IS NULL OR rain_sensitivity BETWEEN 0 AND 100),
  typical_duration_minutes INTEGER CHECK (typical_duration_minutes IS NULL OR typical_duration_minutes BETWEEN 15 AND 1440),
  is_active BOOLEAN NOT NULL DEFAULT true,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX travel_places_destination_idx ON public.travel_places (destination_name, is_active);
CREATE INDEX travel_places_location_idx ON public.travel_places (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE TABLE public.travel_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES public.travel_places(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  summary TEXT CHECK (summary IS NULL OR char_length(summary) <= 1200),
  category TEXT NOT NULL,
  editorial_tags TEXT[] NOT NULL DEFAULT '{}',
  typical_duration_minutes INTEGER CHECK (typical_duration_minutes IS NULL OR typical_duration_minutes BETWEEN 15 AND 1440),
  indoor_outdoor TEXT CHECK (indoor_outdoor IS NULL OR indoor_outdoor IN ('indoor','outdoor','mixed')),
  rain_sensitivity SMALLINT CHECK (rain_sensitivity IS NULL OR rain_sensitivity BETWEEN 0 AND 100),
  family_fit SMALLINT CHECK (family_fit IS NULL OR family_fit BETWEEN 0 AND 100),
  intensity SMALLINT CHECK (intensity IS NULL OR intensity BETWEEN 0 AND 100),
  commercializable BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX travel_experiences_place_idx ON public.travel_experiences (place_id, is_active);
CREATE INDEX travel_experiences_category_idx ON public.travel_experiences (category, is_active);

CREATE OR REPLACE FUNCTION public.trip_composer_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trip_composer_touch_travel_places
BEFORE UPDATE ON public.travel_places FOR EACH ROW EXECUTE FUNCTION public.trip_composer_touch_updated_at();
CREATE TRIGGER trip_composer_touch_travel_experiences
BEFORE UPDATE ON public.travel_experiences FOR EACH ROW EXECUTE FUNCTION public.trip_composer_touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.travel_places TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.travel_experiences TO authenticated;
GRANT ALL ON public.travel_places TO service_role;
GRANT ALL ON public.travel_experiences TO service_role;

ALTER TABLE public.travel_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage travel places" ON public.travel_places FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage travel experiences" ON public.travel_experiences FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

COMMENT ON TABLE public.travel_places IS 'Identidade e curadoria própria de lugares usados pelo Trip Composer; não é espelho do provedor externo.';
COMMENT ON TABLE public.travel_experiences IS 'Camada editorial de experiências do Trip Composer, separada de public.travel_offers.';