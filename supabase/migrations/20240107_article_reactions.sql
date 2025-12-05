-- Create article_reactions table
CREATE TABLE IF NOT EXISTS article_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_article_reactions_article_id ON article_reactions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_reactions_user_id ON article_reactions(user_id);

-- Add counts to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS dislikes_count INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE article_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop if exists first)
DROP POLICY IF EXISTS "Users can view all reactions" ON article_reactions;
CREATE POLICY "Users can view all reactions" ON article_reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert reactions" ON article_reactions;
CREATE POLICY "Authenticated users can insert reactions" ON article_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reactions" ON article_reactions;
CREATE POLICY "Users can update their own reactions" ON article_reactions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reactions" ON article_reactions;
CREATE POLICY "Users can delete their own reactions" ON article_reactions
  FOR DELETE USING (auth.uid() = user_id);


-- RPC Functions for atomic increments
CREATE OR REPLACE FUNCTION increment_article_likes(article_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE articles
  SET likes_count = likes_count + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_article_likes(article_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE articles
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_article_dislikes(article_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE articles
  SET dislikes_count = dislikes_count + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_article_dislikes(article_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE articles
  SET dislikes_count = GREATEST(dislikes_count - 1, 0)
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
