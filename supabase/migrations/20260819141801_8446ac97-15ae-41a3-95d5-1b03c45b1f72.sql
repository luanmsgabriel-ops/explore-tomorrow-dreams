CREATE TABLE IF NOT EXISTS public.whatsapp_processed_messages (
    message_id text PRIMARY KEY,
    created_at timestamptz DEFAULT now()
);

GRANT ALL ON public.whatsapp_processed_messages TO authenticated;
GRANT ALL ON public.whatsapp_processed_messages TO service_role;

ALTER TABLE public.whatsapp_processed_messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_processed_messages' AND policyname = 'Allow authenticated insert') THEN
        CREATE POLICY "Allow authenticated insert" ON public.whatsapp_processed_messages FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_processed_messages' AND policyname = 'Allow service_role all') THEN
        CREATE POLICY "Allow service_role all" ON public.whatsapp_processed_messages FOR ALL TO service_role USING (true);
    END IF;
END $$;
