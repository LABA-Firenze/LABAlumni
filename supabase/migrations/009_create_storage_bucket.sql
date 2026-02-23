-- Create storage bucket for posts images
-- Note: This needs to be run in Supabase Dashboard > Storage

-- Create bucket if not exists (requires Supabase Storage extension)
-- In production, create this bucket manually via Supabase Dashboard > Storage

-- Bucket name: 'posts'
-- Public: true (so images can be accessed via public URLs)
-- File size limit: 10MB
-- Allowed MIME types: image/*

-- After creating the bucket, set these policies:

-- Policy: Allow authenticated users to upload
-- CREATE POLICY "Allow authenticated uploads"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'posts');

-- Policy: Allow authenticated users to update own files
-- CREATE POLICY "Allow authenticated updates"
-- ON storage.objects FOR UPDATE
-- TO authenticated
-- USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow authenticated users to delete own files
-- CREATE POLICY "Allow authenticated deletes"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow public reads
-- CREATE POLICY "Allow public reads"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'posts');

-- Note: These policies should be created via Supabase Dashboard > Storage > posts > Policies


