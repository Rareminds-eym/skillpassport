-- Create storage bucket for course images
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-images', 'course-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for course images
CREATE POLICY "Anyone can view course images"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-images');

CREATE POLICY "Authenticated users can upload course images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own course images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own course images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-images' 
  AND auth.role() = 'authenticated'
);
