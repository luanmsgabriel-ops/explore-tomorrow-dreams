-- Create table for banner history
CREATE TABLE public.banner_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.promotional_offers(id) ON DELETE CASCADE,
  offer_title TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  format TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banner_history ENABLE ROW LEVEL SECURITY;

-- Only admins can manage banner history
CREATE POLICY "Admins can manage banner history"
ON public.banner_history
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));