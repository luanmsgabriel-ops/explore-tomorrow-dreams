
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'true'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT USING (true);

-- Only admins can update
CREATE POLICY "Admins can manage site settings" ON public.site_settings FOR ALL USING (public.is_admin());

-- Insert default value for popup
INSERT INTO public.site_settings (key, value) VALUES ('popup_offers_enabled', 'true'::jsonb);
