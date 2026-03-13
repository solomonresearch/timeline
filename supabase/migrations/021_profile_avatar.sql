-- Add avatar_url column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5 MB max
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their own folder
CREATE POLICY "users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "public read avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
