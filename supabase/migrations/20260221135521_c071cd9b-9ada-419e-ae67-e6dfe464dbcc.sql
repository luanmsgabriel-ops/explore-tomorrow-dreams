
-- Create admin access log table
CREATE TABLE public.admin_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  command_text TEXT NOT NULL,
  query_type TEXT NOT NULL,
  response_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can manage admin logs"
  ON public.admin_access_logs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role inserts (edge functions use service role key)
CREATE POLICY "Service can insert logs"
  ON public.admin_access_logs
  FOR INSERT
  WITH CHECK (true);
