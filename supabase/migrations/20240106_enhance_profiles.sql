-- Enhance profiles table with additional fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_handle TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_article_id ON bookmarks(article_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- Create a view for user activity statistics
CREATE OR REPLACE VIEW user_activity AS
SELECT 
  u.id as user_id,
  p.display_name,
  p.avatar_url,
  COUNT(DISTINCT a.id) as articles_count,
  COUNT(DISTINCT c.id) as comments_count,
  COUNT(DISTINCT b.id) as bookmarks_count,
  MAX(GREATEST(a.created_at, c.created_at)) as last_activity
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN articles a ON u.id = a.user_id
LEFT JOIN comments c ON u.id = c.user_id
LEFT JOIN bookmarks b ON u.id = b.user_id
GROUP BY u.id, p.display_name, p.avatar_url;

-- Function to check if user has bookmarked an article
CREATE OR REPLACE FUNCTION is_bookmarked(p_user_id UUID, p_article_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookmarks 
    WHERE user_id = p_user_id AND article_id = p_article_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to toggle bookmark
CREATE OR REPLACE FUNCTION toggle_bookmark(p_user_id UUID, p_article_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM bookmarks 
    WHERE user_id = p_user_id AND article_id = p_article_id
  ) INTO v_exists;
  
  IF v_exists THEN
    DELETE FROM bookmarks 
    WHERE user_id = p_user_id AND article_id = p_article_id;
    RETURN FALSE;
  ELSE
    INSERT INTO bookmarks (user_id, article_id) 
    VALUES (p_user_id, p_article_id);
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql;
