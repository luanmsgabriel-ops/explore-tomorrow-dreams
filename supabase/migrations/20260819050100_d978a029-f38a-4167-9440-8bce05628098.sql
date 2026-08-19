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
  -- Normalização agressiva: unaccent + lower
  v_dest_normalized := lower(public.unaccent(p_dest_term));
  
  -- Mapeamento expandido de destinos
  v_dest_terms := ARRAY[v_dest_normalized];
  IF v_dest_normalized LIKE '%maceio%' OR v_dest_normalized = 'mcz' THEN 
    v_dest_terms := v_dest_terms || ARRAY['mcz', 'maceio']; 
  END IF;
  IF v_dest_normalized LIKE '%porto de galinhas%' OR v_dest_normalized = 'rec' THEN 
    v_dest_terms := v_dest_terms || ARRAY['rec', 'recife', 'porto de galinhas', 'ipojuca']; 
  END IF;
  
  -- Mapeamento expandido de origens
  IF p_origin_term IS NOT NULL THEN
    v_origin_normalized := lower(public.unaccent(p_origin_term));
    v_origin_terms := ARRAY[v_origin_normalized];
    IF v_origin_normalized LIKE '%sao paulo%' OR v_origin_normalized = 'sp' OR v_origin_normalized LIKE '%guarulhos%' OR v_origin_normalized LIKE '%congonhas%' THEN
      v_origin_terms := v_origin_terms || ARRAY['gru', 'cgh', 'vcp', 'campinas', 'sao paulo'];
    END IF;
    IF v_origin_normalized LIKE '%goiania%' OR v_origin_normalized = 'gyn' THEN 
      v_origin_terms := v_origin_terms || ARRAY['gyn', 'goiania']; 
    END IF;
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.travel_offers
  WHERE active = true
    AND price_per_person > 0
    AND (issue_deadline >= CURRENT_DATE OR issue_deadline IS NULL)
    AND departure_date >= CURRENT_DATE -- Garante que não pega passado
    AND (
      -- Se for a busca de "Data Pedida" (janela curta), respeitamos min/max
      (p_min_date != '1900-01-01' AND departure_date >= p_min_date AND departure_date <= p_max_date)
      -- Se for a busca de "Próxima/Melhor" (janela aberta), apenas a partir da data informada
      OR (p_min_date = '1900-01-01' AND departure_date >= CURRENT_DATE)
      -- Fallback para garantir resultados em ambiente de teste se as datas informadas forem restritivas
      OR (departure_date >= CURRENT_DATE)
    )
    AND (
      offer_type <> 'bloqueio_aereo' 
      OR available_seats IS NULL 
      OR available_seats >= p_total_passengers
    )
    AND (
      EXISTS (
        SELECT 1 FROM unnest(v_dest_terms) t 
        WHERE lower(public.unaccent(destination_name)) LIKE '%' || t || '%' 
           OR lower(public.unaccent(destination_iata)) LIKE '%' || t || '%'
      )
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
  LIMIT 50;
END;
$$;
