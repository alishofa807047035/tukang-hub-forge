
-- product-images: public read, admin write
CREATE POLICY "product_images_read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "product_images_admin_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "product_images_admin_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "product_images_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'));

-- payment-proofs: user uploads to own folder (folder = auth.uid()), user+admin read
CREATE POLICY "proofs_insert_own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "proofs_select_own_or_admin" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "proofs_admin_manage" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(),'admin')) WITH CHECK (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(),'admin'));
