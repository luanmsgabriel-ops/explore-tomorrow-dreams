-- Add welcome_caption column to client_trips for customizable popup text
ALTER TABLE public.client_trips ADD COLUMN IF NOT EXISTS welcome_caption text;