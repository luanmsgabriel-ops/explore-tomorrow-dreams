-- Add status and quote_requested columns to ai_itineraries table
ALTER TABLE public.ai_itineraries 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS quote_requested boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS quote_requested_at timestamp with time zone;

-- Allow admins to update ai_itineraries
CREATE POLICY "Admins can update itineraries"
ON public.ai_itineraries
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));