CREATE POLICY "Users manage own evidence files" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'evidence' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'evidence' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins read all evidence files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'evidence' AND public.has_role(auth.uid(),'admin'));