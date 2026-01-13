
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policy for user_roles: users can see their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Policy for user_roles: only admins can manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Drop old permissive policies on ai_itineraries
DROP POLICY IF EXISTS "Admins can view all itineraries" ON public.ai_itineraries;

-- Create new secure policy for ai_itineraries (admin only SELECT)
CREATE POLICY "Only admins can view itineraries"
ON public.ai_itineraries FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Drop old permissive policies on ai_generated_images
DROP POLICY IF EXISTS "Admins can view all generated images" ON public.ai_generated_images;

-- Create new secure policy for ai_generated_images (admin only SELECT)
CREATE POLICY "Only admins can view generated images"
ON public.ai_generated_images FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Drop old permissive policy on chat_messages
DROP POLICY IF EXISTS "Anyone can view chat messages by session" ON public.chat_messages;

-- Create session-based policy for chat_messages (users can only see their own session)
CREATE POLICY "Users can view their own chat session"
ON public.chat_messages FOR SELECT
USING (session_id = current_setting('app.current_session_id', true));

-- Admins can view all chat messages
CREATE POLICY "Admins can view all chat messages"
ON public.chat_messages FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Drop old policy on quote_requests
DROP POLICY IF EXISTS "Admins can view all quote requests" ON public.quote_requests;

-- Create new secure policy for quote_requests (admin only)
CREATE POLICY "Only admins can view quote requests"
ON public.quote_requests FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Update trigger to auto-assign admin role on first signup (for testing)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Assign admin role to new users (remove this in production or change logic)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
