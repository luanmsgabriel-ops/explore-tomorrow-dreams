-- Add follow-up stage tracking column
ALTER TABLE public.quote_requests 
ADD COLUMN IF NOT EXISTS follow_up_stage integer NOT NULL DEFAULT 0;

-- Reset follow_up_message_sent for existing records to allow multi-stage follow-ups
-- Stage 0 = no follow-up sent, 1 = day 1 sent, 2 = day 3 sent, 3 = day 7 sent, 4 = day 14 sent (archived)
COMMENT ON COLUMN public.quote_requests.follow_up_stage IS 'Follow-up stage: 0=none, 1=day1, 2=day3, 3=day7, 4=day14(archived)';