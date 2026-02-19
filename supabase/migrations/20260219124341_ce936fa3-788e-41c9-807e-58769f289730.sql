
-- Create table for storing travel reviews/evaluations
CREATE TABLE public.travel_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  client_name TEXT,
  destination_name TEXT,
  trip_id UUID REFERENCES public.client_trips(id) ON DELETE SET NULL,
  route_score INTEGER CHECK (route_score >= 0 AND route_score <= 10),
  service_score INTEGER CHECK (service_score >= 0 AND service_score <= 10),
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  feedback_text TEXT,
  allows_sharing TEXT CHECK (allows_sharing IN ('sim', 'não', 'talvez', 'com restrições')),
  photo_url TEXT,
  conversation_status TEXT NOT NULL DEFAULT 'pending' CHECK (conversation_status IN ('pending', 'in_progress', 'complete', 'incomplete', 'cancelled')),
  current_step TEXT NOT NULL DEFAULT 'greeting' CHECK (current_step IN ('greeting', 'route_score', 'service_score', 'nps_score', 'feedback', 'sharing', 'photo', 'done')),
  messages_history JSONB DEFAULT '[]'::jsonb,
  sent_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.travel_reviews ENABLE ROW LEVEL SECURITY;

-- Only admins can manage reviews
CREATE POLICY "Admins can manage all reviews"
ON public.travel_reviews
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Edge functions can insert/update reviews (service role)
CREATE POLICY "Public can insert reviews"
ON public.travel_reviews
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update reviews"
ON public.travel_reviews
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_travel_reviews_updated_at
BEFORE UPDATE ON public.travel_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
