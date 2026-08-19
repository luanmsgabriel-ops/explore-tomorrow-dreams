CREATE OR REPLACE FUNCTION public.search_travel_offers(
  p_dest_term text,
  p_origin_term text,
  p_min_date date,
  p_max_date date,
  p_total_passengers integer,
  p_order_by_price boolean
)
RETURNS SETOF travel_offers
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dest_clean text;
  v_origin_clean text;
BEGIN
  v_dest_clean := public.unaccent(lower(p_dest_term));
  v_origin_clean := public.unaccent(lower(p_origin_term));

  RETURN QUERY
  SELECT *
  FROM public.travel_offers
  WHERE active = true
    AND price_per_person > 0
    AND (
      public.unaccent(lower(destination_name)) LIKE '%' || v_dest_clean || '%'
      OR lower(destination_iata) = lower(p_dest_term)
      OR (v_dest_clean = 'maceio' AND lower(destination_iata) = 'mcz')
      OR (v_dest_clean = 'porto de galinhas' AND lower(destination_iata) = 'rec')
    )
    AND (
      p_origin_term IS NULL
      OR public.unaccent(lower(origin_city)) LIKE '%' || v_origin_clean || '%'
      OR lower(origin_iata) = lower(p_origin_term)
      OR (v_origin_clean = 'sao paulo' AND lower(origin_iata) IN ('gru', 'cgh', 'vcp'))
      OR (v_origin_clean = 'goiania' AND lower(origin_iata) = 'gyn')
    )
  ORDER BY 
    CASE WHEN p_order_by_price THEN price_per_person ELSE 99999999 END ASC,
    CASE WHEN NOT p_order_by_price THEN departure_date ELSE '9999-12-31'::date END ASC
  LIMIT 50;
END;
$$;
