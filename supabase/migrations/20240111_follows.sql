-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT cant_follow_self CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public Access"
ON follows FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Authenticated users can follow"
ON follows FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Authenticated users can unfollow"
ON follows FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- Function to handle new follower notification
CREATE OR REPLACE FUNCTION handle_new_follower_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, actor_id, type, resource_id, resource_type)
    VALUES (
        NEW.following_id, -- Recipient (user being followed)
        NEW.follower_id, -- Actor (follower)
        'follow',
        NEW.follower_id, -- Resource ID (link to follower's profile)
        'article' -- We use 'article' for now as resource_type constraint is strict, or we should update constraint. 
                  -- Ideally resource_type should be 'user' or generic.
                  -- Let's check the constraint in previous migration.
                  -- The previous migration had: CHECK (resource_type IN ('article', 'comment'))
                  -- We need to update that constraint or work around it.
                  -- Let's update the constraint to include 'user'.
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update notification resource_type check constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_resource_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_resource_type_check 
CHECK (resource_type IN ('article', 'comment', 'user'));

-- Trigger for new follower
CREATE TRIGGER on_follow
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION handle_new_follower_notification();
