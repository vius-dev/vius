ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS text_alignment TEXT DEFAULT 'left';

UPDATE articles SET image_url = 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80' WHERE section = 'politics';
UPDATE articles SET image_url = 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&q=80' WHERE section = 'elections';
UPDATE articles SET image_url = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80' WHERE section = 'analysis';
