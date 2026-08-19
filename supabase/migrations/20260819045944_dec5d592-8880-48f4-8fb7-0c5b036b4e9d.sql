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
  v_dest_normalized text;
  v_origin_normalized text;
  v_dest_terms text[];
  v_origin_terms text[];
BEGIN
  v_dest_normalized := lower(public.unaccent(p_dest_term));
  
  v_dest_terms := ARRAY[v_dest_normalized];
  IF v_dest_normalized LIKE '%maceio%' OR v_dest_normalized = 'mcz' THEN 
    v_dest_terms := v_dest_terms || ARRAY['mcz', 'maceio']; 
  END IF;
  IF v_dest_normalized LIKE '%porto de galinhas%' OR v_dest_normalized = 'rec' THEN 
    v_dest_terms := v_dest_terms || ARRAY['rec', 'recife', 'porto de galinhas']; 
  END IF;
  IF v_dest_normalized LIKE '%natal%' OR v_dest_normalized = 'nat' THEN 
    v_dest_terms := v_dest_terms || ARRAY['nat', 'natal']; 
  END IF;
  IF v_dest_normalized LIKE '%fortaleza%' OR v_dest_normalized = 'for' THEN 
    v_dest_terms := v_dest_terms || ARRAY['for', 'fortaleza']; 
  END IF;
  IF v_dest_normalized LIKE '%salvador%' OR v_dest_normalized = 'ssa' THEN 
    v_dest_terms := v_dest_terms || ARRAY['ssa', 'salvador']; 
  END IF;

  IF p_origin_term IS NOT NULL THEN
    v_origin_normalized := lower(public.unaccent(p_origin_term));
    v_origin_terms := ARRAY[v_origin_normalized];
    IF v_origin_normalized LIKE '%sao paulo%' OR v_origin_normalized = 'sp' OR v_origin_normalized LIKE '%guarulhos%' OR v_origin_normalized LIKE '%congonhas%' THEN
      v_origin_terms := v_origin_terms || ARRAY['gru', 'cgh', 'vcp', 'campinas', 'sao paulo'];
    END IF;
    IF v_origin_normalized LIKE '%goiania%' OR v_origin_normalized = 'gyn' THEN 
      v_origin_terms := v_origin_terms || ARRAY['gyn', 'goiania']; 
    END IF;
    IF v_origin_normalized LIKE '%porto alegre%' OR v_origin_normalized = 'poa' THEN 
      v_origin_terms := v_origin_terms || ARRAY['poa', 'porto alegre']; 
    END IF;
    IF v_origin_normalized LIKE '%curitiba%' OR v_origin_normalized = 'cwb' THEN 
      v_origin_terms := v_origin_terms || ARRAY['cwb', 'curitiba']; 
    END IF;
    IF v_origin_normalized LIKE '%belo horizonte%' OR v_origin_normalized = 'cnf' THEN 
      v_origin_terms := v_origin_terms || ARRAY['cnf', 'bhz', 'belo horizonte']; 
    END IF;
    IF v_origin_normalized LIKE '%rio%' OR v_origin_normalized = 'gig' OR v_origin_normalized = 'sdu' THEN 
      v_origin_terms := v_origin_terms || ARRAY['gig', 'sdu', 'rio']; 
    END IF;
    IF v_origin_normalized LIKE '%brasilia%' OR v_origin_normalized = 'bsb' THEN 
      v_origin_terms := v_origin_terms || ARRAY['bsb', 'brasilia']; 
    END IF;
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.travel_offers
  WHERE active = true
    AND price_per_person > 0
    AND (issue_deadline >= CURRENT_DATE OR issue_deadline IS NULL)
    AND (
      (p_min_date = p_max_date AND departure_date >= p_min_date) -- Se for busca livre
      OR (departure_date >= p_min_date AND departure_date <= p_max_date) -- Se for busca com janela
    )
    AND (
      offer_type <> 'bloqueio_aereo' 
      OR available_seats IS NULL 
      OR available_seats >= p_total_passengers
    )
    AND EXISTS (
      SELECT 1 FROM unnest(v_dest_terms) t 
      WHERE lower(public.unaccent(destination_name)) LIKE '%' || t || '%' 
         OR lower(public.unaccent(destination_iata)) LIKE '%' || t || '%'
    )
    AND (
      p_origin_term IS NULL 
      OR EXISTS (
        SELECT 1 FROM unnest(v_origin_terms) t 
        WHERE lower(public.unaccent(origin_city)) LIKE '%' || t || '%' 
           OR lower(public.unaccent(origin_iata)) LIKE '%' || t || '%'
      )
    )
  ORDER BY 
    CASE WHEN p_order_by_price THEN price_per_person ELSE 99999999 END ASC,
    CASE WHEN NOT p_order_by_price THEN departure_date ELSE '9999-12-31'::date END ASC
  LIMIT 100;
END;
$$;
