'use server';

import { createClient } from '@/lib/supabase-server';
import { Article } from '@/types/article';

interface TrendingArticle extends Article {
    trending_score: number;
}

/**
 * Calculate trending score for an article (internal utility function)
 * Formula: (views + comments*5 + reactions*3 + bookmarks*4) / (hours_since_publish + 2)^1.5
 */
function calculateTrendingScore(
    views: number,
    comments: number,
    reactions: number,
    bookmarks: number,
    publishedAt: Date
): number {
    // Engagement score with weighted factors
    const engagementScore =
        (views * 1) +
        (comments * 5) +
        (reactions * 3) +
        (bookmarks * 4);

    // Time decay factor
    const now = new Date();
    const hoursSincePublish = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
    const timeDecay = Math.pow(hoursSincePublish + 2, 1.5);

    // Final trending score
    return engagementScore / timeDecay;
}

/**
 * Get trending articles with calculated scores
 */
export async function getTrendingArticles(limit: number = 10, hoursWindow: number = 168): Promise<TrendingArticle[]> {
    const supabase = await createClient();

    try {
        // Calculate cutoff time (default: last 7 days)
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - hoursWindow);

        // Fetch recent published articles
        const { data: articles, error } = await supabase
            .from('articles')
            .select('*')
            .eq('published', true)
            .gte('created_at', cutoffDate.toISOString())
            .order('created_at', { ascending: false })
            .limit(100); // Fetch more to calculate scores

        if (error || !articles) {
            console.error('Error fetching articles:', error);
            return [];
        }

        // Get engagement data for each article
        const articlesWithScores = await Promise.all(
            articles.map(async (article) => {
                // Get comment count
                const { count: commentsCount } = await supabase
                    .from('comments')
                    .select('*', { count: 'exact', head: true })
                    .eq('article_id', article.id);

                // Get bookmark count
                const { count: bookmarksCount } = await supabase
                    .from('bookmarks')
                    .select('*', { count: 'exact', head: true })
                    .eq('article_id', article.id);

                const views = article.views_count || 0;
                const comments = commentsCount || 0;
                const reactions = (article.likes_count || 0) + (article.dislikes_count || 0);
                const bookmarks = bookmarksCount || 0;

                const trending_score = calculateTrendingScore(
                    views,
                    comments,
                    reactions,
                    bookmarks,
                    new Date(article.created_at)
                );

                return {
                    ...article,
                    trending_score
                };
            })
        );

        // Sort by trending score and return top N
        return articlesWithScores
            .sort((a, b) => b.trending_score - a.trending_score)
            .slice(0, limit);

    } catch (error) {
        console.error('Error in getTrendingArticles:', error);
        return [];
    }
}
