-- Fix event package prices incorrectly normalized from installment labels.
--
-- Source records in PACOTES can carry installment labels such as
-- "10x de R$ 240" together with explicit event option totals such as
-- "R$ 2.409,80". The previous sync fallback parsed the first number (10)
-- and produced an invalid package price of R$ 100,00.
--
-- This migration uses only explicit source-provided event option totals.
-- It also installs a narrow BEFORE trigger so future syncs cannot reintroduce
-- the invalid value while the source payload keeps this shape.

CREATE OR REPLACE FUNCTION public.normalize_viajando_event_package_price()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_price numeric;
BEGIN
  IF NEW.source = 'viajandocomdesconto'
     AND NEW.offer_type = 'pacote'
     AND coalesce(NEW.raw_data->>'source_entry', '') = 'PACOTES'
     AND lower(coalesce(NEW.raw_data->>'categoria', '')) = 'evento'
     AND jsonb_typeof(NEW.raw_data->'ingressos') = 'array'
  THEN
    SELECT min(
      replace(
        replace(
          regexp_replace(option_item->>'preco', '[^0-9,.]', '', 'g'),
          '.',
          ''
        ),
        ',',
        '.'
      )::numeric
    )
    INTO v_price
    FROM jsonb_array_elements(NEW.raw_data->'ingressos') AS option_item
    WHERE coalesce(option_item->>'preco', '') ~ '[0-9]';

    IF v_price IS NOT NULL AND v_price > 0 THEN
      NEW.price_per_person := v_price;
      NEW.raw_data := jsonb_set(
        NEW.raw_data,
        '{package_price_per_person}',
        to_jsonb(v_price),
        true
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_viajando_event_package_price
ON public.travel_offers;

CREATE TRIGGER trg_normalize_viajando_event_package_price
BEFORE INSERT OR UPDATE OF source, offer_type, price_per_person, raw_data
ON public.travel_offers
FOR EACH ROW
EXECUTE FUNCTION public.normalize_viajando_event_package_price();

-- Repair the currently affected event packages using the minimum explicit
-- option total supplied in raw_data.ingressos[].preco. No amount is estimated.
WITH corrected AS (
  SELECT
    t.id,
    min(
      replace(
        replace(
          regexp_replace(option_item->>'preco', '[^0-9,.]', '', 'g'),
          '.',
          ''
        ),
        ',',
        '.'
      )::numeric
    ) AS corrected_price
  FROM public.travel_offers AS t
  CROSS JOIN LATERAL jsonb_array_elements(t.raw_data->'ingressos') AS option_item
  WHERE t.source = 'viajandocomdesconto'
    AND t.offer_type = 'pacote'
    AND coalesce(t.raw_data->>'source_entry', '') = 'PACOTES'
    AND lower(coalesce(t.raw_data->>'categoria', '')) = 'evento'
    AND jsonb_typeof(t.raw_data->'ingressos') = 'array'
    AND coalesce(option_item->>'preco', '') ~ '[0-9]'
  GROUP BY t.id
)
UPDATE public.travel_offers AS t
SET
  price_per_person = corrected.corrected_price,
  raw_data = jsonb_set(
    t.raw_data,
    '{package_price_per_person}',
    to_jsonb(corrected.corrected_price),
    true
  )
FROM corrected
WHERE t.id = corrected.id
  AND corrected.corrected_price > 0
  AND t.price_per_person IS DISTINCT FROM corrected.corrected_price;
