-- Create sales table for tracking completed sales
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  destination_name TEXT NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  departure_date DATE,
  return_date DATE,
  total_value NUMERIC(12,2) NOT NULL,
  commission_percentage NUMERIC(5,2) DEFAULT 10.00,
  commission_value NUMERIC(12,2) GENERATED ALWAYS AS (total_value * commission_percentage / 100) STORED,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  source_channel TEXT DEFAULT 'website',
  quote_id UUID REFERENCES public.quote_requests(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.client_trips(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Only admins can manage sales
CREATE POLICY "Admins can manage all sales"
ON public.sales
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX idx_sales_payment_status ON public.sales(payment_status);