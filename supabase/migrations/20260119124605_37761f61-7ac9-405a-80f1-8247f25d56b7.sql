-- Create storage bucket for destination images
INSERT INTO storage.buckets (id, name, public)
VALUES ('destination-images', 'destination-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to view images
CREATE POLICY "Public can view destination images"
ON storage.objects FOR SELECT
USING (bucket_id = 'destination-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload destination images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'destination-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update destination images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'destination-images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete destination images"
ON storage.objects FOR DELETE
USING (bucket_id = 'destination-images');