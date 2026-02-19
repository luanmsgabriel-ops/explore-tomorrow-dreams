
-- Add follow_up_enabled column (default false - all disabled initially)
ALTER TABLE public.quote_requests 
ADD COLUMN IF NOT EXISTS follow_up_enabled boolean DEFAULT false;
