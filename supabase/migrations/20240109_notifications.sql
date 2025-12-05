-- Create notification type enum
CREATE TYPE notification_type AS ENUM ('comment_reply', 'mention', 'reaction', 'follow');

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    resource_id UUID NOT NULL,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('article', 'comment')),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Function to handle comment replies
CREATE OR REPLACE FUNCTION handle_comment_reply_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if it's a reply (parent_id is not null)
    IF NEW.parent_id IS NOT NULL THEN
        -- Get the author of the parent comment
        INSERT INTO notifications (user_id, actor_id, type, resource_id, resource_type)
        SELECT 
            c.user_id, -- Recipient (parent comment author)
            NEW.user_id, -- Actor (replier)
            'comment_reply',
            NEW.article_id, -- Link to the article
            'article'
        FROM comments c
        WHERE c.id = NEW.parent_id
        AND c.user_id != NEW.user_id; -- Don't notify if replying to self
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for comment replies
CREATE TRIGGER on_comment_reply
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION handle_comment_reply_notification();

-- Function to handle article reactions
CREATE OR REPLACE FUNCTION handle_article_reaction_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify on 'like' (optional: can also notify on dislike if desired, but usually just likes)
    IF NEW.reaction_type = 'like' THEN
        INSERT INTO notifications (user_id, actor_id, type, resource_id, resource_type)
        SELECT 
            a.user_id, -- Recipient (article author)
            NEW.user_id, -- Actor (reactor)
            'reaction',
            NEW.article_id,
            'article'
        FROM articles a
        WHERE a.id = NEW.article_id
        AND a.user_id != NEW.user_id; -- Don't notify if reacting to own article
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for article reactions
CREATE TRIGGER on_article_reaction
AFTER INSERT ON article_reactions
FOR EACH ROW
EXECUTE FUNCTION handle_article_reaction_notification();
