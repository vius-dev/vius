-- Add published column to articles table
alter table public.articles 
add column if not exists published boolean default true not null;

-- Add scheduled_publish_at column to articles table
alter table public.articles 
add column if not exists scheduled_publish_at timestamp with time zone;

-- Create index for published column for better query performance
create index if not exists idx_articles_published on public.articles(published);

-- Update RLS policies to hide unpublished articles from non-owners
-- Drop existing select policies if they exist
drop policy if exists "Articles are viewable by everyone" on public.articles;
drop policy if exists "Articles are viewable by everyone or owner" on public.articles;
drop policy if exists "Users can view their own drafts" on public.articles;

-- Create new select policy that shows:
-- 1. All published articles to everyone
-- 2. Unpublished articles only to their owners
create policy "Articles are viewable by everyone or owner"
    on public.articles for select
    using (
        published = true 
        or user_id = auth.uid()
    );

-- Comment explaining the columns
comment on column public.articles.published is 'Whether the article is published (true) or a draft (false)';
comment on column public.articles.scheduled_publish_at is 'Scheduled time to automatically publish the article (future feature)';
