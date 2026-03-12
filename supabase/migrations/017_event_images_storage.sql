-- Storage bucket for event images
-- Create bucket (idempotent via INSERT … ON CONFLICT DO NOTHING)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,                      -- public read (URLs embedded in events)
  10485760,                  -- 10 MB max per file (before client compression)
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their own folder
CREATE POLICY "users can upload own event images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: authenticated users can update/delete their own files
CREATE POLICY "users can update own event images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'event-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "users can delete own event images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: public read (bucket is public so this is belt-and-suspenders)
CREATE POLICY "public read event images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'event-images');
