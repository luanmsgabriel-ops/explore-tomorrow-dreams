-- Tomorrow Travel / Radar Tomorrow — Etapa 9
-- Fonte interna sanitizável para travel-offers-public.
-- Mantém public.travel_offers como fonte canônica e não altera dados do fornecedor.

CREATE OR REPLACE VIEW public.travel_offers_curated_source
WITH (security_invoker = true)
AS
SELECT
  t.id,
  t.source,
  t.source_id,
  t.offer_type,
  t.origin_city,
  t.origin_iata,
  t.destination_name,
  t.destination_iata,
  t.departure_date,
  t.return_date,
  t.nights,
  t.airline,
  t.outbound_departure_time,
  t.outbound_arrival_time,
  t.return_departure_time,
  t.return_arrival_time,
  t.available_seats,
  t.currency,
  t.price_per_person,
  t.boarding_tax,
  t.issue_deadline,
  t.source_url,
  t.active,
  t.created_at,
  t.updated_at,
  t.last_seen_at,
  t.alternative_dates,
  t.source_type,
  (
    COALESCE(t.raw_data, '{}'::jsonb)
    || CASE
      WHEN c.editorial_title IS NOT NULL
        THEN jsonb_build_object('nome', c.editorial_title)
      ELSE '{}'::jsonb
    END
    || CASE
      WHEN c.editorial_image_url IS NOT NULL
        THEN jsonb_build_object(
          'capa', c.editorial_image_url,
          'src', c.editorial_image_url,
          'summary', COALESCE(t.raw_data->'summary', '{}'::jsonb)
            || jsonb_build_object('foto', c.editorial_image_url)
        )
      ELSE '{}'::jsonb
    END
  ) AS raw_data,
  COALESCE(c.is_featured, false) AS curation_featured,
  COALESCE(c.sort_order, 0) AS curation_sort_order,
  c.campaign_label AS curation_campaign_label,
  c.editorial_subtitle AS curation_subtitle
FROM public.travel_offers AS t
LEFT JOIN public.travel_offer_curation AS c
  ON c.offer_id = t.id
 AND (c.expires_at IS NULL OR c.expires_at > now())
WHERE COALESCE(c.is_hidden, false) = false;

COMMENT ON VIEW public.travel_offers_curated_source IS
  'Fonte interna da Edge Function travel-offers-public. Aplica somente curadoria vigente; nunca deve ser exposta diretamente ao navegador.';

REVOKE ALL ON public.travel_offers_curated_source FROM PUBLIC;
REVOKE ALL ON public.travel_offers_curated_source FROM anon;
REVOKE ALL ON public.travel_offers_curated_source FROM authenticated;
REVOKE ALL ON public.travel_offers_curated_source FROM service_role;
GRANT SELECT ON public.travel_offers_curated_source TO service_role;
