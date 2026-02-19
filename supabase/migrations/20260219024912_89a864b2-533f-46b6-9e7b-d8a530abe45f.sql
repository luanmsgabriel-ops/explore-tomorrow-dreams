
-- Add follow-up tracking columns to quote_requests
ALTER TABLE public.quote_requests 
ADD COLUMN IF NOT EXISTS follow_up_sent_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS follow_up_days integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS follow_up_message_sent boolean DEFAULT false;
