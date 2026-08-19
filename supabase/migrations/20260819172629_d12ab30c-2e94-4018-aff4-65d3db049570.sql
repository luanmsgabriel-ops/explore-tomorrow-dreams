CREATE TABLE public.teo_debug_log (
    id uuid primary key default gen_random_uuid(),
    phone_number text not null,
    raw_ai_response text,
    collected_data_antes jsonb,
    collected_data_depois jsonb,
    tags_encontradas text,
    created_at timestamptz default now()
);

GRANT SELECT, INSERT ON public.teo_debug_log TO authenticated;
GRANT ALL ON public.teo_debug_log TO service_role;

ALTER TABLE public.teo_debug_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select all logs"
ON public.teo_debug_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
