-- Create destinations table for admin management
CREATE TABLE public.destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('explorar', 'nacional', 'internacional')),
  description TEXT NOT NULL,
  best_time TEXT NOT NULL,
  ideal_duration TEXT NOT NULL,
  for_who TEXT NOT NULL,
  videos JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active destinations"
ON public.destinations FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage destinations"
ON public.destinations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_destinations_updated_at
BEFORE UPDATE ON public.destinations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();