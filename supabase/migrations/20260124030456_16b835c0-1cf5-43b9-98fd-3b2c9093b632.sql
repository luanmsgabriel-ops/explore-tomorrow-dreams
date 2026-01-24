-- Add hotel check-in/check-out dates and return flight number
ALTER TABLE public.client_trips 
ADD COLUMN hotel_checkin_date date,
ADD COLUMN hotel_checkout_date date,
ADD COLUMN flight_return_number text;

-- Set default values for existing trips (use departure/return dates)
UPDATE public.client_trips 
SET hotel_checkin_date = departure_date,
    hotel_checkout_date = return_date
WHERE hotel_checkin_date IS NULL;