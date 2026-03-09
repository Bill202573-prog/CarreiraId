-- Create storage bucket for gamification level icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('carreira-assets', 'carreira-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read carreira-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'carreira-assets');

-- Allow authenticated users to upload (admin will upload)
CREATE POLICY "Authenticated upload carreira-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'carreira-assets');

-- Allow authenticated users to update/overwrite
CREATE POLICY "Authenticated update carreira-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'carreira-assets');
