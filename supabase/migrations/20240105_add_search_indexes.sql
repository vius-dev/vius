-- Add full-text search support for articles
-- This enables fast searching by title and content

-- Create a text search configuration for English (skip if exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'english_config') THEN
        CREATE TEXT SEARCH CONFIGURATION english_config (COPY = pg_catalog.english);
    END IF;
END $$;


-- Add a generated column for full-text search on articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) STORED;

-- Create an index on the search vector for fast searching
CREATE INDEX IF NOT EXISTS idx_articles_search_vector ON articles USING GIN (search_vector);

-- Create a search history table to track user searches
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster search history queries
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);

-- Create a function to search articles
CREATE OR REPLACE FUNCTION search_articles(search_query TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  body TEXT,
  section TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.body,
    a.section,
    a.image_url,
    a.created_at,
    ts_rank(a.search_vector, websearch_to_tsquery('english', search_query)) AS rank
  FROM articles a
  WHERE a.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC, a.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;
