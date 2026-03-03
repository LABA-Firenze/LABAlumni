-- Storage policies per bucket image_profilo (pubblico)
-- Bucket creato in Supabase Dashboard > Storage: image_profilo, Public: true

-- Policy: upload - solo nella propria cartella (user_id/filename)
DROP POLICY IF EXISTS "image_profilo_upload" ON storage.objects;
CREATE POLICY "image_profilo_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'image_profilo' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: update - solo propri file
DROP POLICY IF EXISTS "image_profilo_update" ON storage.objects;
CREATE POLICY "image_profilo_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'image_profilo' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: delete - solo propri file
DROP POLICY IF EXISTS "image_profilo_delete" ON storage.objects;
CREATE POLICY "image_profilo_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'image_profilo' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: select - lettura pubblica (bucket pubblico)
DROP POLICY IF EXISTS "image_profilo_select" ON storage.objects;
CREATE POLICY "image_profilo_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'image_profilo');
