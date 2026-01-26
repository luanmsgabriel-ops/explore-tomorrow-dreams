-- Add columns for manual quote registration
ALTER TABLE public.quote_requests 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS source_channel TEXT DEFAULT 'website',
ADD COLUMN IF NOT EXISTS follow_up_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false;