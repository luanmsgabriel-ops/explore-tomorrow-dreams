-- Add new columns for flight return time, hotel link, and trip tips
ALTER TABLE public.client_trips 
ADD COLUMN IF NOT EXISTS flight_return_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS flight_locator text,
ADD COLUMN IF NOT EXISTS hotel_link text,
ADD COLUMN IF NOT EXISTS hotel_checkin_time text DEFAULT '14:00',
ADD COLUMN IF NOT EXISTS hotel_checkout_time text DEFAULT '12:00',
ADD COLUMN IF NOT EXISTS trip_tips text;