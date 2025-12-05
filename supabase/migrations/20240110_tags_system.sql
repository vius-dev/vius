-- Create tags table
create table if not exists public.tags (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create article_tags junction table
create table if not exists public.article_tags (
    article_id uuid references public.articles(id) on delete cascade not null,
    tag_id uuid references public.tags(id) on delete cascade not null,
    primary key (article_id, tag_id)
);

-- Enable RLS
alter table public.tags enable row level security;
alter table public.article_tags enable row level security;

-- Policies for tags
create policy "Tags are viewable by everyone"
    on public.tags for select
    using (true);

create policy "Authenticated users can create tags"
    on public.tags for insert
    with check (auth.role() = 'authenticated');

-- Policies for article_tags
create policy "Article tags are viewable by everyone"
    on public.article_tags for select
    using (true);

create policy "Users can tag their own articles"
    on public.article_tags for insert
    with check (
        exists (
            select 1 from public.articles
            where id = article_tags.article_id
            and user_id = auth.uid()
        )
    );

create policy "Users can remove tags from their own articles"
    on public.article_tags for delete
    using (
        exists (
            select 1 from public.articles
            where id = article_tags.article_id
            and user_id = auth.uid()
        )
    );

-- Create index for faster lookups
create index if not exists idx_tags_name on public.tags(name);
create index if not exists idx_article_tags_article_id on public.article_tags(article_id);
create index if not exists idx_article_tags_tag_id on public.article_tags(tag_id);
