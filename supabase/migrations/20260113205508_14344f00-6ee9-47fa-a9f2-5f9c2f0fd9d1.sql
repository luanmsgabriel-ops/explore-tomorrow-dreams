-- Add user_whatsapp and status columns to ai_generated_images
ALTER TABLE public.ai_generated_images 
ADD COLUMN IF NOT EXISTS user_whatsapp text,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Allow admins to update generated images
CREATE POLICY "Admins can update generated images"
ON public.ai_generated_images
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));