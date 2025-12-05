CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  section TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_section ON articles(section);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);

INSERT INTO articles (title, body, section, created_at) VALUES
  ('Senate Passes Historic Infrastructure Bill', 'In a landmark bipartisan effort, the Senate has approved a comprehensive infrastructure package worth $1.2 trillion. The bill includes funding for roads, bridges, public transit, and broadband internet expansion across the nation. Supporters hail it as a crucial investment in America''s future, while critics question the long-term fiscal impact. The legislation now moves to the House for consideration.', 'politics', NOW() - INTERVAL '1 hour'),
  ('Presidential Candidates Gear Up for Primary Season', 'With the primary season approaching, several candidates have officially announced their bids for the presidency. Campaign rallies are drawing large crowds across key states, and early polling shows a competitive race ahead. Candidates are focusing on issues ranging from healthcare reform to climate policy, each attempting to distinguish their platform from the crowded field.', 'elections', NOW() - INTERVAL '2 hours'),
  ('Analysis: The Shifting Political Landscape', 'Recent polling data suggests significant shifts in voter sentiment across multiple demographics. Independent voters, who often determine election outcomes, are showing increased concern about economic issues and government accountability. This analysis examines the factors driving these changes and what they might mean for upcoming elections. Political strategists from both parties are closely monitoring these trends as they plan their messaging strategies.', 'analysis', NOW() - INTERVAL '3 hours');
