
-- Add missing columns
ALTER TABLE public.travel_quote_requests
ADD COLUMN IF NOT EXISTS processing_details jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_travel_quote_status ON public.travel_quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_travel_quote_created_at ON public.travel_quote_requests(created_at);
