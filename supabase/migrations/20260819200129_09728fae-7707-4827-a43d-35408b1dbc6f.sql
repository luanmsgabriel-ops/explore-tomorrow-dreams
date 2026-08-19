CREATE TABLE IF NOT EXISTS public.whatsapp_scheduled_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number text NOT NULL,
    message_text text NOT NULL,
    send_after timestamp with time zone NOT NULL,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_scheduled_messages TO authenticated;
GRANT ALL ON public.whatsapp_scheduled_messages TO service_role;

ALTER TABLE public.whatsapp_scheduled_messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_scheduled_messages' AND policyname = 'Admins can manage scheduled messages'
    ) THEN
        CREATE POLICY "Admins can manage scheduled messages"
        ON public.whatsapp_scheduled_messages
        FOR ALL
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;

-- Scheduled job to process messages
SELECT cron.schedule(
    'process-whatsapp-scheduled-messages',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := (SELECT (value->>'url')::text FROM site_settings WHERE key = 'whatsapp_webhook_url' LIMIT 1),
        body := jsonb_build_object('action', 'process_scheduled_messages')::text,
        headers := '{"Content-Type": "application/json"}'::jsonb
    );
    $$
);