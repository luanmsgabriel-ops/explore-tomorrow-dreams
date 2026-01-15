-- Add best price periods field to destinations table
ALTER TABLE public.destinations 
ADD COLUMN IF NOT EXISTS best_price_periods JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the field
COMMENT ON COLUMN public.destinations.best_price_periods IS 'Array of objects with month ranges when flights are historically cheaper. Format: [{period: "Março a Maio", reason: "Baixa temporada"}, ...]';