-- Create function to calculate trending score
create or replace function calculate_trending_score(
    p_views integer,
    p_comments bigint,
    p_reactions integer,
    p_bookmarks bigint,
    p_created_at timestamp with time zone
) returns numeric as $$
declare
    engagement_score numeric;
    hours_since_publish numeric;
    time_decay numeric;
begin
    -- Calculate engagement score with weighted factors
    engagement_score := (p_views * 1) + (p_comments * 5) + (p_reactions * 3) + (p_bookmarks * 4);
    
    -- Calculate hours since publish
    hours_since_publish := extract(epoch from (now() - p_created_at)) / 3600;
    
    -- Calculate time decay
    time_decay := power(hours_since_publish + 2, 1.5);
    
    -- Return trending score
    return engagement_score / time_decay;
end;
$$ language plpgsql stable;

-- Create materialized view for trending articles
create materialized view if not exists trending_articles_view as
select 
    a.id,
    a.title,
    a.body,
    a.section,
    a.created_at,
    a.user_id,
    a.image_url,
    a.text_alignment,
    a.views_count,
    a.likes_count,
    a.dislikes_count,
    a.published,
    coalesce(c.comment_count, 0) as comment_count,
    coalesce(b.bookmark_count, 0) as bookmark_count,
    calculate_trending_score(
        coalesce(a.views_count, 0),
        coalesce(c.comment_count, 0),
        coalesce(a.likes_count, 0) + coalesce(a.dislikes_count, 0),
        coalesce(b.bookmark_count, 0),
        a.created_at
    ) as trending_score
from public.articles a
left join (
    select article_id, count(*) as comment_count
    from public.comments
    group by article_id
) c on a.id = c.article_id
left join (
    select article_id, count(*) as bookmark_count
    from public.bookmarks
    group by article_id
) b on a.id = b.article_id
where a.published = true
  and a.created_at > now() - interval '7 days';

-- Create index on trending_score for fast queries
create index if not exists idx_trending_articles_score 
on trending_articles_view(trending_score desc);

-- Create index on created_at
create index if not exists idx_trending_articles_created_at 
on trending_articles_view(created_at desc);

-- Function to refresh the materialized view
create or replace function refresh_trending_articles()
returns void as $$
begin
    refresh materialized view concurrently trending_articles_view;
end;
$$ language plpgsql;

-- Comment explaining the view
comment on materialized view trending_articles_view is 'Pre-calculated trending scores for articles (last 7 days). Refresh periodically for best performance.';
