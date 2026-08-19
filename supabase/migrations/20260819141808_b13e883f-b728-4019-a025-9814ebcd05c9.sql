ALTER TABLE public.whatsapp_processed_messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.whatsapp_processed_messages TO authenticated;
GRANT ALL ON public.whatsapp_processed_messages TO service_role;

DROP POLICY IF EXISTS "Allow authenticated insert" ON public.whatsapp_processed_messages;
CREATE POLICY "Allow authenticated insert" ON public.whatsapp_processed_messages FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service_role all" ON public.whatsapp_processed_messages;
CREATE POLICY "Allow service_role all" ON public.whatsapp_processed_messages FOR ALL TO service_role USING (true);
