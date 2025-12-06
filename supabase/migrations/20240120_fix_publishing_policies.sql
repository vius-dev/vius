-- Enable RLS on articles table
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create articles
CREATE POLICY "Authenticated users can create articles"
ON articles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own articles
CREATE POLICY "Users can update own articles"
ON articles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own articles
CREATE POLICY "Users can delete own articles"
ON articles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Make articles viewable by everyone
CREATE POLICY "Articles are viewable by everyone"
ON articles FOR SELECT
TO public
USING (true);

-- Ensure storage buckets exist (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('article_images', 'article_images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Ensure storage policies exist for article_images
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'article_images' );

DROP POLICY IF EXISTS "Authenticated users can upload article images" ON storage.objects;
CREATE POLICY "Authenticated users can upload article images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'article_images' );

DROP POLICY IF EXISTS "Users can update their own article images" ON storage.objects;
CREATE POLICY "Users can update their own article images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'article_images' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Users can delete their own article images" ON storage.objects;
CREATE POLICY "Users can delete their own article images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'article_images' AND auth.uid() = owner );
