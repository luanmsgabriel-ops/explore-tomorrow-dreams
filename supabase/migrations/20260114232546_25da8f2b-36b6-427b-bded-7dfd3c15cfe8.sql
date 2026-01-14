-- Add tagline field to promotional_offers table
ALTER TABLE public.promotional_offers 
ADD COLUMN IF NOT EXISTS tagline text;