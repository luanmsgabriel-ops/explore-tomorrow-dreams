-- Remove the generated column constraint and make commission_value a regular column
-- First, drop the generated column and recreate as a regular nullable column
ALTER TABLE public.sales DROP COLUMN IF EXISTS commission_value;
ALTER TABLE public.sales ADD COLUMN commission_value NUMERIC(12,2) DEFAULT NULL;

-- Drop the commission_percentage column as it's no longer needed
ALTER TABLE public.sales DROP COLUMN IF EXISTS commission_percentage;