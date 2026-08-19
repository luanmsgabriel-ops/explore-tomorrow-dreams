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
AS $$
DECLARE
  v_dest_normalized text;
  v_origin_normalized text;
  v_dest_terms text[];
  v_origin_terms text[];
BEGIN
  v_dest_normalized := lower(unaccent(p_dest_term));
  
  -- Mapeamento de destinos
  v_dest_terms := ARRAY[v_dest_normalized];
  IF v_dest_normalized LIKE '%maceio%' THEN v_dest_terms := v_dest_terms || 'mcz'; END IF;
  IF v_dest_normalized LIKE '%porto de galinhas%' THEN v_dest_terms := v_dest_terms || ARRAY['rec', 'recife']; END IF;
  IF v_dest_normalized LIKE '%natal%' THEN v_dest_terms := v_dest_terms || 'nat'; END IF;
  IF v_dest_normalized LIKE '%fortaleza%' THEN v_dest_terms := v_dest_terms || 'for'; END IF;
  IF v_dest_normalized LIKE '%salvador%' THEN v_dest_terms := v_dest_terms || 'ssa'; END IF;

  -- Mapeamento de origens
  IF p_origin_term IS NOT NULL THEN
    v_origin_normalized := lower(unaccent(p_origin_term));
    v_origin_terms := ARRAY[v_origin_normalized];
    IF v_origin_normalized LIKE '%sao paulo%' OR v_origin_normalized = 'sp' OR v_origin_normalized LIKE '%guarulhos%' OR v_origin_normalized LIKE '%congonhas%' THEN
      v_origin_terms := v_origin_terms || ARRAY['gru', 'cgh', 'vcp', 'campinas', 'sao paulo'];
    END IF;
    IF v_origin_normalized LIKE '%goiania%' THEN v_origin_terms := v_origin_terms || 'gyn'; END IF;
    IF v_origin_normalized LIKE '%porto alegre%' THEN v_origin_terms := v_origin_terms || 'poa'; END IF;
    IF v_origin_normalized LIKE '%curitiba%' THEN v_origin_terms := v_origin_terms || 'cwb'; END IF;
    IF v_origin_normalized LIKE '%belo horizonte%' THEN v_origin_terms := v_origin_terms || ARRAY['cnf', 'bhz']; END IF;
    IF v_origin_normalized LIKE '%rio%' THEN v_origin_terms := v_origin_terms || ARRAY['gig', 'sdu', 'rio']; END IF;
    IF v_origin_normalized LIKE '%brasilia%' THEN v_origin_terms := v_origin_terms || 'bsb'; END IF;
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.travel_offers
  WHERE active = true
    AND price_per_person > 0
    AND (issue_deadline >= CURRENT_DATE OR issue_deadline IS NULL)
    AND departure_date >= p_min_date AND departure_date <= p_max_date
    AND (
      offer_type <> 'bloqueio_aereo' 
      OR available_seats IS NULL 
      OR available_seats >= p_total_passengers
    )
    AND EXISTS (
      SELECT 1 FROM unnest(v_dest_terms) t 
      WHERE lower(unaccent(destination_name)) LIKE '%' || t || '%' 
         OR lower(unaccent(destination_iata)) LIKE '%' || t || '%'
    )
    AND (
      p_origin_term IS NULL 
      OR EXISTS (
        SELECT 1 FROM unnest(v_origin_terms) t 
        WHERE lower(unaccent(origin_city)) LIKE '%' || t || '%' 
           OR lower(unaccent(origin_iata)) LIKE '%' || t || '%'
      )
    )
  ORDER BY 
    CASE WHEN p_order_by_price THEN price_per_person ELSE NULL END ASC,
    CASE WHEN NOT p_order_by_price THEN departure_date ELSE NULL END ASC
  LIMIT 100;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_travel_offers(text, text, date, date, integer, boolean) TO authenticated, anon, service_role;
