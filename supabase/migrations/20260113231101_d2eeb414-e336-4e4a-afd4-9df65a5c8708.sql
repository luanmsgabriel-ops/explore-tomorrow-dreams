-- Add DELETE policies for admin users on quote_requests, ai_itineraries, and ai_generated_images

-- Delete policy for quote_requests
CREATE POLICY "Admins can delete quote requests" 
ON public.quote_requests 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Delete policy for ai_itineraries
CREATE POLICY "Admins can delete itineraries" 
ON public.ai_itineraries 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Delete policy for ai_generated_images
CREATE POLICY "Admins can delete generated images" 
ON public.ai_generated_images 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));