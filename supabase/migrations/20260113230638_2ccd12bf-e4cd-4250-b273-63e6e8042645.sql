-- Add is_featured column to destinations table
ALTER TABLE public.destinations ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

-- Create a function to ensure only one featured destination
CREATE OR REPLACE FUNCTION public.ensure_single_featured_destination()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a destination as featured, unset all others
  IF NEW.is_featured = true THEN
    UPDATE public.destinations 
    SET is_featured = false 
    WHERE id != NEW.id AND is_featured = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce single featured destination
CREATE TRIGGER ensure_single_featured
BEFORE INSERT OR UPDATE ON public.destinations
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_featured_destination();

-- Set Fernando de Noronha as the initial featured destination
UPDATE public.destinations SET is_featured = true WHERE slug = 'fernando-noronha';