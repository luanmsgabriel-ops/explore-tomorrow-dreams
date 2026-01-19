-- Add departure and return date fields to promotional_offers table
ALTER TABLE public.promotional_offers 
ADD COLUMN departure_date date,
ADD COLUMN return_date date;