CREATE TABLE public.whatsapp_processed_messages (
    message_id text PRIMARY KEY,
    phone_number text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_whatsapp_processed_messages_created_at ON public.whatsapp_processed_messages (created_at);

GRANT INSERT, SELECT ON public.whatsapp_processed_messages TO service_role;
GRANT INSERT, SELECT ON public.whatsapp_processed_messages TO authenticated;
GRANT INSERT, SELECT ON public.whatsapp_processed_messages TO anon;
