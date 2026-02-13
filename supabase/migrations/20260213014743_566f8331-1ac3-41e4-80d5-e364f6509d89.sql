
-- Create whatsapp_conversations table
CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL UNIQUE,
  client_name text,
  conversation_state text NOT NULL DEFAULT 'greeting',
  collected_data jsonb DEFAULT '{}'::jsonb,
  messages_history jsonb DEFAULT '[]'::jsonb,
  is_ai_active boolean NOT NULL DEFAULT true,
  quote_request_id uuid REFERENCES public.quote_requests(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admins manage whatsapp conversations"
  ON public.whatsapp_conversations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert/update (for edge function)
CREATE POLICY "Service role full access whatsapp"
  ON public.whatsapp_conversations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
