-- Add welcome image field to client_trips table
ALTER TABLE public.client_trips
ADD COLUMN welcome_image_url text;

-- Add comment for documentation
COMMENT ON COLUMN public.client_trips.welcome_image_url IS 'URL of the personalized welcome image uploaded by admin for client popup';