-- Trip Composer Experience Discovery V2 — Viator provider identity.
-- Schema-only expansion; no existing data is rewritten.

ALTER TABLE public.trip_day_items
  DROP CONSTRAINT IF EXISTS trip_day_items_source_kind_check;

ALTER TABLE public.trip_day_items
  ADD CONSTRAINT trip_day_items_source_kind_check
  CHECK (
    source_kind IS NULL OR source_kind IN (
      'GOOGLE_PLACE',
      'VIATOR_PRODUCT',
      'TOMORROW_EDITORIAL',
      'TRAVEL_OFFER',
      'USER_INPUT'
    )
  );

COMMENT ON COLUMN public.trip_day_items.source_kind IS
  'Origem normalizada do item do roteiro. Credenciais e URLs internas de fornecedores nunca devem ser persistidas aqui.';
