
CREATE TABLE public.travel_iata_map (
    code text PRIMARY KEY,
    origin_name text NOT NULL,
    destination_name text NOT NULL,
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.travel_iata_map TO authenticated;
GRANT ALL ON public.travel_iata_map TO service_role;
GRANT SELECT ON public.travel_iata_map TO anon;

ALTER TABLE public.travel_iata_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on travel_iata_map"
ON public.travel_iata_map
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read on travel_iata_map"
ON public.travel_iata_map
FOR SELECT
TO anon, authenticated
USING (true);
