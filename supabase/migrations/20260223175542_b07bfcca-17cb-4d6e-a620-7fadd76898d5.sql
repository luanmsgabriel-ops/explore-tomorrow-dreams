
-- Create instagram_conversations table
CREATE TABLE public.instagram_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_user_id text NOT NULL,
  user_name text,
  messages_history jsonb DEFAULT '[]'::jsonb,
  collected_data jsonb DEFAULT '{}'::jsonb,
  conversation_state text NOT NULL DEFAULT 'greeting'::text,
  is_ai_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create unique index on instagram_user_id
CREATE UNIQUE INDEX idx_instagram_conversations_user_id ON public.instagram_conversations (instagram_user_id);

-- Enable RLS
ALTER TABLE public.instagram_conversations ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins manage instagram conversations"
  ON public.instagram_conversations
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_instagram_conversations_updated_at
  BEFORE UPDATE ON public.instagram_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
