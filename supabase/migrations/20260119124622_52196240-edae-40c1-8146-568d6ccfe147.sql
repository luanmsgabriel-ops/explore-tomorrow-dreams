-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload destination images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update destination images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete destination images" ON storage.objects;

-- Create more secure policies that require authentication
CREATE POLICY "Authenticated users can upload destination images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'destination-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update destination images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'destination-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete destination images"
ON storage.objects FOR DELETE
USING (bucket_id = 'destination-images' AND auth.role() = 'authenticated');