ALTER TABLE articles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_laws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author_name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_social_laws_category ON social_laws(category);
CREATE INDEX IF NOT EXISTS idx_social_laws_user_id ON social_laws(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

INSERT INTO social_laws (title, description, author_name, category) VALUES
  ('Cipolla''s First Law', 'Always and inevitably everyone underestimates the number of stupid individuals in circulation.', 'Carlo M. Cipolla', 'stupidity'),
  ('Cipolla''s Second Law', 'The probability that a certain person is stupid is independent of any other characteristic of that person.', 'Carlo M. Cipolla', 'stupidity'),
  ('Cipolla''s Third Law', 'A stupid person is a person who causes losses to another person or group while deriving no gain and possibly incurring losses.', 'Carlo M. Cipolla', 'stupidity'),
  ('Cipolla''s Fourth Law', 'Non-stupid people always underestimate the damaging power of stupid individuals.', 'Carlo M. Cipolla', 'stupidity'),
  ('Cipolla''s Fifth Law', 'A stupid person is the most dangerous type of person.', 'Carlo M. Cipolla', 'stupidity'),
  ('Parkinson''s Law', 'Work expands so as to fill the time available for its completion.', 'C. Northcote Parkinson', 'productivity'),
  ('Murphy''s Law', 'Anything that can go wrong will go wrong.', 'Edward A. Murphy Jr.', 'general'),
  ('Peter Principle', 'In a hierarchy, every employee tends to rise to their level of incompetence.', 'Laurence J. Peter', 'management'),
  ('Goodhart''s Law', 'When a measure becomes a target, it ceases to be a good measure.', 'Charles Goodhart', 'economics'),
  ('Hanlon''s Razor', 'Never attribute to malice that which is adequately explained by stupidity.', 'Robert J. Hanlon', 'general');
