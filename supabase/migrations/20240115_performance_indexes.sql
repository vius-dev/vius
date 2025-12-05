-- Performance optimization indexes for frequently accessed queries

-- Articles table indexes
-- Index for fetching published articles ordered by creation date
CREATE INDEX IF NOT EXISTS idx_articles_created_published 
ON public.articles(created_at DESC) 
WHERE published = true;

-- Index for section-based queries
CREATE INDEX IF NOT EXISTS idx_articles_section_published 
ON public.articles(section, created_at DESC) 
WHERE published = true;

-- Index for user's articles
CREATE INDEX IF NOT EXISTS idx_articles_user_published 
ON public.articles(user_id, created_at DESC);

-- Index for article search by title
CREATE INDEX IF NOT EXISTS idx_articles_title_search 
ON public.articles USING gin(to_tsvector('english', title));

-- Comments table indexes
-- Index for fetching article comments
CREATE INDEX IF NOT EXISTS idx_comments_article_created 
ON public.comments(article_id, created_at DESC);

-- Index for user's comments
CREATE INDEX IF NOT EXISTS idx_comments_user_created 
ON public.comments(user_id, created_at DESC);

-- Article tags indexes
-- Index for tag-based article queries
CREATE INDEX IF NOT EXISTS idx_article_tags_tag 
ON public.article_tags(tag_id, article_id);

-- Index for article's tags
CREATE INDEX IF NOT EXISTS idx_article_tags_article 
ON public.article_tags(article_id, tag_id);

-- Follows table indexes
-- Index for follower queries
CREATE INDEX IF NOT EXISTS idx_follows_follower 
ON public.follows(follower_id, created_at DESC);

-- Index for following queries
CREATE INDEX IF NOT EXISTS idx_follows_following 
ON public.follows(following_id, created_at DESC);

-- Bookmarks table indexes
-- Index for user's bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created 
ON public.bookmarks(user_id, created_at DESC);

-- Index for article's bookmarks count
CREATE INDEX IF NOT EXISTS idx_bookmarks_article 
ON public.bookmarks(article_id);

-- Reactions indexes (if not already present)
-- Index for article reactions
CREATE INDEX IF NOT EXISTS idx_articles_likes 
ON public.articles(likes_count DESC) 
WHERE published = true;

CREATE INDEX IF NOT EXISTS idx_articles_dislikes 
ON public.articles(dislikes_count DESC) 
WHERE published = true;

-- Comment explaining the indexes
COMMENT ON INDEX idx_articles_created_published IS 'Optimizes queries for published articles ordered by date';
COMMENT ON INDEX idx_articles_section_published IS 'Optimizes section-filtered article queries';
COMMENT ON INDEX idx_comments_article_created IS 'Optimizes fetching comments for an article';
COMMENT ON INDEX idx_article_tags_tag IS 'Optimizes tag-based article searches';
