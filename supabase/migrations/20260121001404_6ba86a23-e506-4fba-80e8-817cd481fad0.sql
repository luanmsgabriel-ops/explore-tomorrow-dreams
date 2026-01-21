-- Create table to track check-in notifications sent
CREATE TABLE public.checkin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.client_trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  email_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checkin_notifications ENABLE ROW LEVEL SECURITY;

-- Create unique constraint to prevent duplicate notifications
CREATE UNIQUE INDEX idx_checkin_notifications_trip ON public.checkin_notifications(trip_id);

-- RLS policies
CREATE POLICY "Admins can manage all notifications"
ON public.checkin_notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own notifications"
ON public.checkin_notifications
FOR SELECT
USING (auth.uid() = user_id);