-- Add travel mood and selected activities columns to ai_itineraries
ALTER TABLE public.ai_itineraries 
ADD COLUMN IF NOT EXISTS travel_mood text,
ADD COLUMN IF NOT EXISTS selected_activities jsonb DEFAULT '[]'::jsonb;