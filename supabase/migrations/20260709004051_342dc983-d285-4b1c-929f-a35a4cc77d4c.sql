
CREATE POLICY "materials upload authenticated" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "materials read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "materials delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);
