'use server';

import { createClient } from '@/lib/supabase-server';

export interface ArticleAnalytics {
    article_id: string;
    views: number;
    comments: number;
    likes: number;
    dislikes: number;
    bookmarks: number;
    engagement_rate: number;
}

export interface AuthorAnalytics {
    total_views: number;
    total_comments: number;
    total_reactions: number;
    total_articles: number;
    avg_engagement_rate: number;
    top_articles: ArticleAnalytics[];
}

/**
 * Track an article view (unique per user per day)
 */
export async function trackArticleView(articleId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    try {
        // Insert view record (will fail silently if duplicate due to unique constraint)
        const { error } = await supabase
            .from('article_views')
            .insert({
                article_id: articleId,
                user_id: user?.id || null,
                ip_address: null // Could be populated from request headers if needed
            });

        // Ignore unique constraint violations (duplicate views)
        if (error && !error.message.includes('duplicate')) {
            console.error('Error tracking view:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in trackArticleView:', error);
        return false;
    }
}

/**
 * Get analytics for a single article
 */
export async function getArticleAnalytics(articleId: string): Promise<ArticleAnalytics | null> {
    const supabase = await createClient();

    try {
        // Get article with counts
        const { data: article, error: articleError } = await supabase
            .from('articles')
            .select('id, views_count, likes_count, dislikes_count')
            .eq('id', articleId)
            .single();

        if (articleError || !article) {
            console.error('Error fetching article:', articleError);
            return null;
        }

        // Get comment count
        const { count: commentsCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('article_id', articleId);

        // Get bookmark count
        const { count: bookmarksCount } = await supabase
            .from('bookmarks')
            .select('*', { count: 'exact', head: true })
            .eq('article_id', articleId);

        const views = article.views_count || 0;
        const comments = commentsCount || 0;
        const likes = article.likes_count || 0;
        const dislikes = article.dislikes_count || 0;
        const bookmarks = bookmarksCount || 0;

        // Calculate engagement rate: (interactions / views) * 100
        const totalEngagement = comments + likes + dislikes + bookmarks;
        const engagement_rate = views > 0 ? (totalEngagement / views) * 100 : 0;

        return {
            article_id: articleId,
            views,
            comments,
            likes,
            dislikes,
            bookmarks,
            engagement_rate: Math.round(engagement_rate * 100) / 100
        };
    } catch (error) {
        console.error('Error in getArticleAnalytics:', error);
        return null;
    }
}

/**
 * Get analytics for all of an author's articles
 */
export async function getAuthorAnalytics(userId: string, dateFrom?: Date, dateTo?: Date): Promise<AuthorAnalytics | null> {
    const supabase = await createClient();

    try {
        // Get all author's articles
        let query = supabase
            .from('articles')
            .select('id, views_count, likes_count, dislikes_count, created_at')
            .eq('user_id', userId)
            .eq('published', true);

        if (dateFrom) {
            query = query.gte('created_at', dateFrom.toISOString());
        }
        if (dateTo) {
            query = query.lte('created_at', dateTo.toISOString());
        }

        const { data: articles, error: articlesError } = await query;

        if (articlesError || !articles) {
            console.error('Error fetching articles:', articlesError);
            return null;
        }

        // Get analytics for each article
        const articleAnalytics = await Promise.all(
            articles.map(article => getArticleAnalytics(article.id))
        );

        const validAnalytics = articleAnalytics.filter((a): a is ArticleAnalytics => a !== null);

        // Calculate totals
        const total_views = validAnalytics.reduce((sum, a) => sum + a.views, 0);
        const total_comments = validAnalytics.reduce((sum, a) => sum + a.comments, 0);
        const total_reactions = validAnalytics.reduce((sum, a) => sum + a.likes + a.dislikes, 0);
        const avg_engagement_rate = validAnalytics.length > 0
            ? validAnalytics.reduce((sum, a) => sum + a.engagement_rate, 0) / validAnalytics.length
            : 0;

        // Get top 5 articles by engagement rate
        const top_articles = validAnalytics
            .sort((a, b) => b.engagement_rate - a.engagement_rate)
            .slice(0, 5);

        return {
            total_views,
            total_comments,
            total_reactions,
            total_articles: articles.length,
            avg_engagement_rate: Math.round(avg_engagement_rate * 100) / 100,
            top_articles
        };
    } catch (error) {
        console.error('Error in getAuthorAnalytics:', error);
        return null;
    }
}

/**
 * Get top performing articles across the platform
 */
export async function getTopPerformingArticles(limit: number = 10): Promise<any[]> {
    const supabase = await createClient();

    try {
        const { data: articles, error } = await supabase
            .from('articles')
            .select('*')
            .eq('published', true)
            .order('views_count', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching top articles:', error);
            return [];
        }

        return articles || [];
    } catch (error) {
        console.error('Error in getTopPerformingArticles:', error);
        return [];
    }
}
