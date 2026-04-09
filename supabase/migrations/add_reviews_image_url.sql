-- Add image_url column to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS image_url text;

-- Create review-images storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload review images
DROP POLICY IF EXISTS "Anyone can upload review images" ON storage.objects;
CREATE POLICY "Anyone can upload review images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'review-images');

-- Allow public read of review images
DROP POLICY IF EXISTS "Public read review images" ON storage.objects;
CREATE POLICY "Public read review images" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-images');
