
-- Profiles table for admin users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Quote requests / leads table
CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  travel_date TEXT,
  num_people TEXT,
  travel_type TEXT,
  preferred_airport TEXT,
  flight_time_preference TEXT,
  traveling_with_children BOOLEAN DEFAULT false,
  special_requests TEXT,
  travel_word TEXT,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  preferred_contact_time TEXT,
  preferred_contact_channel TEXT,
  destination_id TEXT,
  destination_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on quote_requests
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert quote requests (public form)
CREATE POLICY "Anyone can submit quote requests" 
ON public.quote_requests FOR INSERT 
WITH CHECK (true);

-- Only admins can view quote requests
CREATE POLICY "Admins can view all quote requests" 
ON public.quote_requests FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- AI Generated itineraries table
CREATE TABLE public.ai_itineraries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_whatsapp TEXT NOT NULL,
  preferences TEXT,
  itinerary_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ai_itineraries
ALTER TABLE public.ai_itineraries ENABLE ROW LEVEL SECURITY;

-- Anyone can insert itineraries (public feature)
CREATE POLICY "Anyone can create itineraries" 
ON public.ai_itineraries FOR INSERT 
WITH CHECK (true);

-- Only admins can view all itineraries
CREATE POLICY "Admins can view all itineraries" 
ON public.ai_itineraries FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- AI Generated images table
CREATE TABLE public.ai_generated_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  user_email TEXT,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ai_generated_images
ALTER TABLE public.ai_generated_images ENABLE ROW LEVEL SECURITY;

-- Anyone can insert generated images
CREATE POLICY "Anyone can create generated images" 
ON public.ai_generated_images FOR INSERT 
WITH CHECK (true);

-- Only admins can view all generated images
CREATE POLICY "Admins can view all generated images" 
ON public.ai_generated_images FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Chat messages table (for destination chats)
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  destination_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert chat messages
CREATE POLICY "Anyone can create chat messages" 
ON public.chat_messages FOR INSERT 
WITH CHECK (true);

-- Anyone can view their session messages
CREATE POLICY "Anyone can view chat messages by session" 
ON public.chat_messages FOR SELECT 
USING (true);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
