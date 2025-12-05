'use server';

import { createClient } from '@/lib/supabase-server';
import { Article } from '@/types/article';

interface ScoredArticle {
    article: Article;
    score: number;
}

/**
 * Find related articles based on section and tag similarity
 */
export async function getRelatedArticles(articleId: string, limit: number = 5): Promise<Article[]> {
    const supabase = await createClient();

    // Get the current article with its tags
    const { data: currentArticle, error: currentError } = await supabase
        .from('articles')
        .select('*, article_tags(tag_id, tags(name))')
        .eq('id', articleId)
        .eq('published', true)
        .single();

    if (currentError || !currentArticle) {
        console.error('Error fetching current article:', currentError);
        return [];
    }

    // Extract current article's tags
    const currentTags = currentArticle.article_tags?.map((at: any) => at.tags?.name).filter(Boolean) || [];

    // Fetch all published articles except the current one
    const { data: allArticles, error: articlesError } = await supabase
        .from('articles')
        .select('*, article_tags(tag_id, tags(name))')
        .neq('id', articleId)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(50); // Limit initial fetch for performance

    if (articlesError || !allArticles) {
        console.error('Error fetching articles:', articlesError);
        return [];
    }

    // Score each article based on similarity
    const scoredArticles: ScoredArticle[] = allArticles.map((article: any) => {
        let score = 0;

        // Same section: +10 points
        if (article.section === currentArticle.section) {
            score += 10;
        }

        // Shared tags: +5 points per tag
        const articleTags = article.article_tags?.map((at: any) => at.tags?.name).filter(Boolean) || [];
        const sharedTags = currentTags.filter((tag: string) => articleTags.includes(tag));
        score += sharedTags.length * 5;

        return {
            article: {
                ...article,
                tags: articleTags
            },
            score
        };
    });

    // Sort by score descending and filter out articles with score 0
    const relatedArticles = scoredArticles
        .filter(sa => sa.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(sa => sa.article);

    return relatedArticles;
}

/**
 * Toggle article reaction (like/dislike)
 */
export async function toggleArticleReaction(articleId: string, reactionType: 'like' | 'dislike'): Promise<void> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User must be logged in to react');
    }

    try {
        // Check if user already has a reaction
        const { data: existingReaction } = await supabase
            .from('article_reactions')
            .select('*')
            .eq('article_id', articleId)
            .eq('user_id', user.id)
            .single();

        if (existingReaction) {
            if (existingReaction.reaction_type === reactionType) {
                // Remove reaction if clicking the same button
                await supabase
                    .from('article_reactions')
                    .delete()
                    .eq('id', existingReaction.id);
            } else {
                // Update reaction if changing from like to dislike or vice versa
                await supabase
                    .from('article_reactions')
                    .update({ reaction_type: reactionType })
                    .eq('id', existingReaction.id);
            }
        } else {
            // Add new reaction
            await supabase
                .from('article_reactions')
                .insert({
                    article_id: articleId,
                    user_id: user.id,
                    reaction_type: reactionType
                });
        }
    } catch (error) {
        console.error('Error toggling reaction:', error);
        throw error;
    }
}
