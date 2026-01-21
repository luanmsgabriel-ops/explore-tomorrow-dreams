-- Tabela para tokens de push notification (Expo)
CREATE TABLE public.user_push_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  push_token TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'unknown', -- 'ios', 'android', 'web'
  device_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, push_token)
);

-- Enable RLS
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own push tokens"
ON public.user_push_tokens FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all push tokens"
ON public.user_push_tokens FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_user_push_tokens_updated_at
BEFORE UPDATE ON public.user_push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para logs de notificações enviadas
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trip_id UUID,
  notification_type TEXT NOT NULL, -- 'checkin_reminder', 'trip_update', 'document_added', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered'
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
ON public.notification_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications"
ON public.notification_logs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Tabela para consultores de viagem associados às trips
CREATE TABLE public.trip_consultants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.client_trips(id) ON DELETE CASCADE,
  consultant_name TEXT NOT NULL,
  consultant_phone TEXT,
  consultant_email TEXT,
  consultant_photo_url TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_consultants ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Clients can view their trip consultants"
ON public.trip_consultants FOR SELECT
USING (EXISTS (
  SELECT 1 FROM client_trips
  WHERE client_trips.id = trip_consultants.trip_id
  AND client_trips.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all consultants"
ON public.trip_consultants FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_trip_consultants_updated_at
BEFORE UPDATE ON public.trip_consultants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_user_push_tokens_user_id ON public.user_push_tokens(user_id);
CREATE INDEX idx_user_push_tokens_active ON public.user_push_tokens(is_active) WHERE is_active = true;
CREATE INDEX idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX idx_notification_logs_trip_id ON public.notification_logs(trip_id);
CREATE INDEX idx_notification_logs_type ON public.notification_logs(notification_type);
CREATE INDEX idx_trip_consultants_trip_id ON public.trip_consultants(trip_id);