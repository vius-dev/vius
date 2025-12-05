-- Create article_views table for tracking article views
create table if not exists public.article_views (
    id uuid default gen_random_uuid() primary key,
    article_id uuid references public.articles(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete set null,
    ip_address text,
    viewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add views_count column to articles table (denormalized for performance)
alter table public.articles 
add column if not exists views_count integer default 0 not null;

-- Create immutable function for date extraction
CREATE OR REPLACE FUNCTION immutable_date(timestamp with time zone)
RETURNS date AS $$
  SELECT $1::date;
$$ LANGUAGE SQL IMMUTABLE;

-- Create unique constraint to prevent duplicate views per user per day
create unique index if not exists idx_article_views_unique_daily 
on public.article_views(article_id, user_id, immutable_date(viewed_at))
where user_id is not null;

-- Create indexes for analytics queries
create index if not exists idx_article_views_article_id on public.article_views(article_id);
create index if not exists idx_article_views_user_id on public.article_views(user_id);
create index if not exists idx_article_views_viewed_at on public.article_views(viewed_at);
create index if not exists idx_articles_views_count on public.articles(views_count desc);

-- Enable RLS
alter table public.article_views enable row level security;

-- Policies for article_views
create policy "Article views are viewable by everyone"
    on public.article_views for select
    using (true);

create policy "Anyone can track article views"
    on public.article_views for insert
    with check (true);

-- Function to update views_count on articles table
create or replace function update_article_views_count()
returns trigger as $$
begin
    update public.articles
    set views_count = (
        select count(distinct user_id)
        from public.article_views
        where article_id = new.article_id
    )
    where id = new.article_id;
    return new;
end;
$$ language plpgsql;

-- Trigger to update views_count when a new view is recorded
create trigger on_article_view_insert
    after insert on public.article_views
    for each row
    execute function update_article_views_count();

-- Comment explaining the tables
comment on table public.article_views is 'Tracks article views for analytics (unique per user per day)';
comment on column public.articles.views_count is 'Denormalized count of unique article views';
