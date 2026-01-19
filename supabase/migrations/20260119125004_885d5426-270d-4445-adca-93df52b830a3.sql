-- Drop the current policies that use auth.role() incorrectly
DROP POLICY IF EXISTS "Authenticated users can upload destination images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update destination images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete destination images" ON storage.objects;

-- Create policies using auth.uid() which correctly checks authentication
CREATE POLICY "Authenticated users can upload destination images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'destination-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update destination images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'destination-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete destination images"
ON storage.objects FOR DELETE
USING (bucket_id = 'destination-images' AND auth.uid() IS NOT NULL);