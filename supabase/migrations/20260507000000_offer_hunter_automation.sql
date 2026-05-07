-- ============================================================
-- Migration: Offer Hunter Automation
-- Adds automation fields to promotional_offers table
-- and sets up pg_cron schedule for daily offer hunting
-- ============================================================

-- Add automation fields to promotional_offers
-- NOTE: tagline, departure_date, return_date already exist from previous migrations
ALTER TABLE public.promotional_offers
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_data JSONB,
  ADD COLUMN IF NOT EXISTS market_avg_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approved_by TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS origin_airport TEXT DEFAULT 'GRU';

-- Add check constraint for source values
ALTER TABLE public.promotional_offers
  ADD CONSTRAINT IF NOT EXISTS promotional_offers_source_check
  CHECK (source IN ('manual', 'patria_air', 'patria_hotel', 'patria_car', 'patria_bus', 'patria_insurance', 'cativa', 'offer_hunter'));

-- Add check constraint for approval_status values
ALTER TABLE public.promotional_offers
  ADD CONSTRAINT IF NOT EXISTS promotional_offers_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Index for faster approval queries
CREATE INDEX IF NOT EXISTS idx_promotional_offers_approval
  ON public.promotional_offers(approval_status, is_active);

-- Index for source queries
CREATE INDEX IF NOT EXISTS idx_promotional_offers_source
  ON public.promotional_offers(source);

-- ============================================================
-- Create offer_approval_tokens table
-- Maps short token (first 8 chars of offer UUID) to full UUID
-- Used for WhatsApp approval flow
-- ============================================================
CREATE TABLE IF NOT EXISTS public.offer_approval_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.promotional_offers(id) ON DELETE CASCADE,
  short_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

-- Enable RLS
ALTER TABLE public.offer_approval_tokens ENABLE ROW LEVEL SECURITY;

-- Only admins can manage approval tokens
CREATE POLICY "Admins can manage approval tokens"
  ON public.offer_approval_tokens
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service role can also manage (for Edge Functions)
CREATE POLICY "Service role can manage approval tokens"
  ON public.offer_approval_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_offer_approval_tokens_short
  ON public.offer_approval_tokens(short_token, status);

-- ============================================================
-- Schedule offer-hunter to run daily at 6:00 AM (Brasília time)
-- pg_cron uses UTC, so 6:00 AM BRT = 9:00 AM UTC
-- ============================================================
SELECT cron.schedule(
  'offer-hunter-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/offer-hunter',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- Update RLS policy to allow viewing pending offers for admins
-- (pending offers have is_active = false, so they're hidden from public)
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view active offers within validity" ON public.promotional_offers;

CREATE POLICY "Anyone can view active approved offers within validity"
  ON public.promotional_offers
  FOR SELECT
  USING (
    is_active = true
    AND approval_status = 'approved'
    AND now() BETWEEN valid_from AND valid_until
  );

-- Comment for documentation
COMMENT ON COLUMN public.promotional_offers.source IS
  'Origin of the offer: manual (admin created), patria_air, patria_hotel, cativa, offer_hunter (automated)';

COMMENT ON COLUMN public.promotional_offers.approval_status IS
  'Approval workflow: pending (waiting admin), approved (published), rejected (discarded)';

COMMENT ON COLUMN public.promotional_offers.discount_percent IS
  'Percentage discount compared to market average price (positive = below market)';
