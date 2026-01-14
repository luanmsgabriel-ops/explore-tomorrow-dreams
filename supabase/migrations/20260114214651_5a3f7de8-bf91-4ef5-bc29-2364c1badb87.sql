-- Tabela para rastrear uso de recursos de IA por IP
CREATE TABLE public.ai_usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  feature TEXT NOT NULL, -- 'itinerary', 'chat', 'image'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index para buscas rápidas por IP e feature
CREATE INDEX idx_ai_usage_ip_feature ON public.ai_usage_tracking(ip_address, feature);
CREATE INDEX idx_ai_usage_created_at ON public.ai_usage_tracking(created_at);

-- Enable RLS
ALTER TABLE public.ai_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Apenas edge functions (via service role) podem gerenciar esta tabela
CREATE POLICY "Service role can manage usage tracking"
ON public.ai_usage_tracking
FOR ALL
USING (true)
WITH CHECK (true);

-- Função para verificar e registrar uso
CREATE OR REPLACE FUNCTION public.check_ai_usage_limit(
  p_ip_address TEXT,
  p_feature TEXT,
  p_daily_limit INT DEFAULT 2,
  p_monthly_limit INT DEFAULT 4
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_daily_count INT;
  v_monthly_count INT;
  v_result JSONB;
BEGIN
  -- Conta uso diário
  SELECT COUNT(*) INTO v_daily_count
  FROM public.ai_usage_tracking
  WHERE ip_address = p_ip_address
    AND feature = p_feature
    AND created_at >= CURRENT_DATE;

  -- Conta uso mensal
  SELECT COUNT(*) INTO v_monthly_count
  FROM public.ai_usage_tracking
  WHERE ip_address = p_ip_address
    AND feature = p_feature
    AND created_at >= date_trunc('month', CURRENT_DATE);

  -- Verifica limites
  IF v_daily_count >= p_daily_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit',
      'daily_used', v_daily_count,
      'daily_limit', p_daily_limit,
      'monthly_used', v_monthly_count,
      'monthly_limit', p_monthly_limit
    );
  END IF;

  IF v_monthly_count >= p_monthly_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'monthly_limit',
      'daily_used', v_daily_count,
      'daily_limit', p_daily_limit,
      'monthly_used', v_monthly_count,
      'monthly_limit', p_monthly_limit
    );
  END IF;

  -- Registra o uso
  INSERT INTO public.ai_usage_tracking (ip_address, feature)
  VALUES (p_ip_address, p_feature);

  RETURN jsonb_build_object(
    'allowed', true,
    'daily_used', v_daily_count + 1,
    'daily_limit', p_daily_limit,
    'monthly_used', v_monthly_count + 1,
    'monthly_limit', p_monthly_limit
  );
END;
$$;

-- Função apenas para verificar sem registrar (para cache check)
CREATE OR REPLACE FUNCTION public.get_ai_usage_stats(
  p_ip_address TEXT,
  p_feature TEXT,
  p_daily_limit INT DEFAULT 2,
  p_monthly_limit INT DEFAULT 4
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_daily_count INT;
  v_monthly_count INT;
BEGIN
  SELECT COUNT(*) INTO v_daily_count
  FROM public.ai_usage_tracking
  WHERE ip_address = p_ip_address
    AND feature = p_feature
    AND created_at >= CURRENT_DATE;

  SELECT COUNT(*) INTO v_monthly_count
  FROM public.ai_usage_tracking
  WHERE ip_address = p_ip_address
    AND feature = p_feature
    AND created_at >= date_trunc('month', CURRENT_DATE);

  RETURN jsonb_build_object(
    'daily_used', v_daily_count,
    'daily_limit', p_daily_limit,
    'daily_remaining', GREATEST(0, p_daily_limit - v_daily_count),
    'monthly_used', v_monthly_count,
    'monthly_limit', p_monthly_limit,
    'monthly_remaining', GREATEST(0, p_monthly_limit - v_monthly_count)
  );
END;
$$;

-- Limpar registros antigos (mais de 2 meses)
CREATE OR REPLACE FUNCTION public.cleanup_old_usage_tracking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.ai_usage_tracking
  WHERE created_at < (CURRENT_DATE - INTERVAL '2 months');
END;
$$;