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
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.travel_offers
  WHERE active = true
    AND price_per_person > 0
    AND (issue_deadline >= CURRENT_DATE OR issue_deadline IS NULL)
    AND departure_date >= CURRENT_DATE
    AND (
      public.unaccent(destination_name) ILIKE '%' || public.unaccent(p_dest_term) || '%'
      OR destination_iata ILIKE '%' || p_dest_term || '%'
    )
    AND (
      p_origin_term IS NULL
      OR public.unaccent(origin_city) ILIKE '%' || public.unaccent(p_origin_term) || '%'
      OR origin_iata ILIKE '%' || p_origin_term || '%'
    )
  ORDER BY 
    CASE WHEN p_order_by_price THEN price_per_person ELSE 99999999 END ASC,
    CASE WHEN NOT p_order_by_price THEN departure_date ELSE '9999-12-31'::date END ASC
  LIMIT 50;
END;
$$;
