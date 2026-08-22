-- Tomorrow Live / Radar Tomorrow — Etapa 9
-- Curadoria editorial separada dos dados sincronizados do fornecedor.
-- Esta migration NÃO altera public.travel_offers nem o contrato de sync.

CREATE TABLE public.travel_offer_curation (
  offer_id UUID PRIMARY KEY REFERENCES public.travel_offers(id) ON DELETE CASCADE,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN -1000000 AND 1000000),
  campaign_label TEXT CHECK (campaign_label IS NULL OR char_length(campaign_label) <= 80),
  editorial_title TEXT CHECK (editorial_title IS NULL OR char_length(editorial_title) <= 160),
  editorial_subtitle TEXT CHECK (editorial_subtitle IS NULL OR char_length(editorial_subtitle) <= 320),
  editorial_image_url TEXT CHECK (editorial_image_url IS NULL OR char_length(editorial_image_url) <= 2000),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX travel_offer_curation_featured_idx
  ON public.travel_offer_curation (is_featured, sort_order, updated_at DESC)
  WHERE is_hidden = false;

CREATE INDEX travel_offer_curation_expiry_idx
  ON public.travel_offer_curation (expires_at)
  WHERE expires_at IS NOT NULL;

CREATE TABLE public.travel_offer_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' AND char_length(slug) <= 80),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  banner_image_url TEXT CHECK (banner_image_url IS NULL OR char_length(banner_image_url) <= 2000),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN -1000000 AND 1000000),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at)
);

CREATE INDEX travel_offer_collections_active_idx
  ON public.travel_offer_collections (is_active, sort_order, starts_at, ends_at);

CREATE TABLE public.travel_offer_collection_items (
  collection_id UUID NOT NULL REFERENCES public.travel_offer_collections(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES public.travel_offers(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN -1000000 AND 1000000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY (collection_id, offer_id)
);

CREATE INDEX travel_offer_collection_items_offer_idx
  ON public.travel_offer_collection_items (offer_id, collection_id);

CREATE TABLE public.travel_offer_curation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  before_state JSONB,
  after_state JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX travel_offer_curation_audit_offer_idx
  ON public.travel_offer_curation_audit (offer_id, changed_at DESC);

CREATE OR REPLACE FUNCTION public.stage9_set_curation_actor()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.stage9_set_collection_actor()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  IF TG_OP = 'INSERT' AND NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.stage9_set_collection_item_actor()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.added_by IS NULL THEN
    NEW.added_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.stage9_audit_offer_curation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_offer_id UUID;
BEGIN
  audit_offer_id := COALESCE(NEW.offer_id, OLD.offer_id);

  INSERT INTO public.travel_offer_curation_audit (
    offer_id,
    action,
    before_state,
    after_state,
    changed_by
  ) VALUES (
    audit_offer_id,
    lower(TG_OP),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER stage9_travel_offer_curation_actor
  BEFORE INSERT OR UPDATE ON public.travel_offer_curation
  FOR EACH ROW EXECUTE FUNCTION public.stage9_set_curation_actor();

CREATE TRIGGER stage9_travel_offer_collection_actor
  BEFORE INSERT OR UPDATE ON public.travel_offer_collections
  FOR EACH ROW EXECUTE FUNCTION public.stage9_set_collection_actor();

CREATE TRIGGER stage9_travel_offer_collection_item_actor
  BEFORE INSERT ON public.travel_offer_collection_items
  FOR EACH ROW EXECUTE FUNCTION public.stage9_set_collection_item_actor();

CREATE TRIGGER stage9_travel_offer_curation_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.travel_offer_curation
  FOR EACH ROW EXECUTE FUNCTION public.stage9_audit_offer_curation();

ALTER TABLE public.travel_offer_curation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_offer_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_offer_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_offer_curation_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage travel offer curation"
ON public.travel_offer_curation
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can manage travel offer collections"
ON public.travel_offer_collections
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can manage travel offer collection items"
ON public.travel_offer_collection_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can view travel offer curation audit"
ON public.travel_offer_curation_audit
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

COMMENT ON TABLE public.travel_offer_curation IS
  'Overrides editoriais da Tomorrow Travel. Nunca substituir dados originais sincronizados em travel_offers.';
COMMENT ON COLUMN public.travel_offer_curation.expires_at IS
  'Fim da vigência do override editorial; a camada pública deve ignorar o override após este instante.';
COMMENT ON TABLE public.travel_offer_collections IS
  'Coleções e campanhas editoriais da Tomorrow Travel, independentes dos dados do fornecedor.';
COMMENT ON TABLE public.travel_offer_curation_audit IS
  'Histórico imutável das mudanças em travel_offer_curation para reversão e auditoria.';