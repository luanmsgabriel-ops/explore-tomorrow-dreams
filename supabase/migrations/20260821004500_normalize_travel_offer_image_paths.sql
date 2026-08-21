CREATE OR REPLACE FUNCTION public.normalize_travel_offer_image_paths()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_url CONSTANT text := 'https://viajandocomdesconto.com/';
  image_path text;
BEGIN
  IF NEW.source IS DISTINCT FROM 'viajandocomdesconto'
     OR NEW.offer_type IS DISTINCT FROM 'pacote'
     OR NEW.raw_data IS NULL THEN
    RETURN NEW;
  END IF;

  image_path := NEW.raw_data->>'capa';
  IF image_path ~ '^/?img/[A-Za-z0-9._-]+[.](avif|gif|jpe?g|png|webp)$' THEN
    NEW.raw_data := jsonb_set(
      NEW.raw_data,
      '{capa}',
      to_jsonb(base_url || ltrim(image_path, '/')),
      true
    );
  END IF;

  image_path := NEW.raw_data->>'src';
  IF image_path ~ '^/?img/[A-Za-z0-9._-]+[.](avif|gif|jpe?g|png|webp)$' THEN
    NEW.raw_data := jsonb_set(
      NEW.raw_data,
      '{src}',
      to_jsonb(base_url || ltrim(image_path, '/')),
      true
    );
  END IF;

  IF jsonb_typeof(NEW.raw_data->'summary') = 'object' THEN
    image_path := NEW.raw_data->'summary'->>'foto';
    IF image_path ~ '^/?img/[A-Za-z0-9._-]+[.](avif|gif|jpe?g|png|webp)$' THEN
      NEW.raw_data := jsonb_set(
        NEW.raw_data,
        '{summary,foto}',
        to_jsonb(base_url || ltrim(image_path, '/')),
        true
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_travel_offer_image_paths_trigger ON public.travel_offers;

CREATE TRIGGER normalize_travel_offer_image_paths_trigger
BEFORE INSERT OR UPDATE OF raw_data, source, offer_type
ON public.travel_offers
FOR EACH ROW
EXECUTE FUNCTION public.normalize_travel_offer_image_paths();

UPDATE public.travel_offers
SET raw_data = raw_data
WHERE source = 'viajandocomdesconto'
  AND offer_type = 'pacote'
  AND raw_data IS NOT NULL
  AND (
    COALESCE(raw_data->>'capa', '') ~ '^/?img/[A-Za-z0-9._-]+[.](avif|gif|jpe?g|png|webp)$'
    OR COALESCE(raw_data->>'src', '') ~ '^/?img/[A-Za-z0-9._-]+[.](avif|gif|jpe?g|png|webp)$'
    OR COALESCE(raw_data->'summary'->>'foto', '') ~ '^/?img/[A-Za-z0-9._-]+[.](avif|gif|jpe?g|png|webp)$'
  );
