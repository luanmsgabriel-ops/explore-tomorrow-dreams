-- Add composite index for user_id IN queries optimization
CREATE INDEX IF NOT EXISTS idx_client_trips_user_id_departure ON public.client_trips(user_id, departure_date DESC);

-- Add index for sales queries
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);

-- Analyze the newly indexed tables
ANALYZE public.client_trips;
ANALYZE public.sales;