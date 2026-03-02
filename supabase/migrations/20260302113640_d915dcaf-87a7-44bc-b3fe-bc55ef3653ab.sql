CREATE TABLE public.client_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp text NOT NULL,
  client_name text,
  preferences jsonb DEFAULT '{}'::jsonb,
  travel_history jsonb DEFAULT '[]'::jsonb,
  personal_notes jsonb DEFAULT '{}'::jsonb,
  last_interaction_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(whatsapp)
);

ALTER TABLE public.client_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access" ON public.client_memory FOR ALL USING (false) WITH CHECK (false);

CREATE TRIGGER update_client_memory_updated_at
  BEFORE UPDATE ON public.client_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();