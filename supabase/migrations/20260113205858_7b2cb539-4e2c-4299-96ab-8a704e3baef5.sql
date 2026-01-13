-- Allow admins to update quote requests
CREATE POLICY "Admins can update quote requests"
ON public.quote_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));