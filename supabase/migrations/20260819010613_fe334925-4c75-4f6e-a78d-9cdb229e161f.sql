ALTER TABLE public.quote_requests ALTER COLUMN email DROP NOT NULL;

-- Also ensure follow_up_enabled has a default if we want to isolate them easily, 
-- though the prompt asks to set it to false during insert.
-- We can add a comment to the table/column for future reference.
COMMENT ON COLUMN public.quote_requests.follow_up_enabled IS 'Indicates if automated follow-up is active. Set to false for failed quotations awaiting human review.';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_requests TO service_role;
GRANT INSERT ON public.quote_requests TO anon;
GRANT SELECT ON public.quote_requests TO anon;
