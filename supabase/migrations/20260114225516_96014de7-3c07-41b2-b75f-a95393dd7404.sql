-- Create promotional_offers table
CREATE TABLE public.promotional_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Offer details
  title TEXT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  cash_price DECIMAL(10,2),
  installments INTEGER,
  installment_value DECIMAL(10,2),
  
  -- Package inclusions
  inclusions TEXT[] NOT NULL DEFAULT '{}',
  
  -- Validity
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Generated image
  promo_image_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotional_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active offers within validity"
ON public.promotional_offers
FOR SELECT
USING (is_active = true AND now() BETWEEN valid_from AND valid_until);

CREATE POLICY "Admins can manage all offers"
ON public.promotional_offers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_promotional_offers_updated_at
BEFORE UPDATE ON public.promotional_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_promotional_offers_active ON public.promotional_offers(is_active, valid_from, valid_until);
CREATE INDEX idx_promotional_offers_destination ON public.promotional_offers(destination_id);