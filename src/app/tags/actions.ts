'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export interface Tag {
    id: string;
    name: string;
    created_at: string;
}

export interface TagWithCount extends Tag {
    article_count: number;
}

/**
 * Search for tags by name
 */
export async function searchTags(query: string): Promise<Tag[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(10);

    if (error) {
        console.error('Error searching tags:', error);
        return [];
    }

    return data || [];
}

/**
 * Create a new tag (or return existing if already exists)
 */
export async function createTag(name: string): Promise<Tag | null> {
    const supabase = await createClient();
    const normalizedName = name.toLowerCase().trim();

    // Check if tag already exists
    const { data: existing } = await supabase
        .from('tags')
        .select('*')
        .eq('name', normalizedName)
        .single();

    if (existing) {
        return existing;
    }

    // Create new tag
    const { data, error } = await supabase
        .from('tags')
        .insert({ name: normalizedName })
        .select()
        .single();

    if (error) {
        console.error('Error creating tag:', error);
        return null;
    }

    return data;
}

/**
 * Get all tags for an article
 */
export async function getArticleTags(articleId: string): Promise<Tag[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('article_tags')
        .select('tag_id, tags(*)')
        .eq('article_id', articleId);

    if (error) {
        console.error('Error fetching article tags:', error);
        return [];
    }

    return data?.map((item: any) => item.tags).filter(Boolean) || [];
}

/**
 * Add tags to an article
 */
export async function addTagsToArticle(articleId: string, tagNames: string[]): Promise<boolean> {
    const supabase = await createClient();

    try {
        // Create or get all tags
        const tags = await Promise.all(
            tagNames.map(name => createTag(name))
        );

        const validTags = tags.filter((tag): tag is Tag => tag !== null);

        if (validTags.length === 0) {
            return false;
        }

        // Create article_tags associations
        const articleTags = validTags.map(tag => ({
            article_id: articleId,
            tag_id: tag.id,
        }));

        const { error } = await supabase
            .from('article_tags')
            .insert(articleTags);

        if (error) {
            console.error('Error adding tags to article:', error);
            return false;
        }

        revalidatePath(`/article/${articleId}`);
        return true;
    } catch (error) {
        console.error('Error in addTagsToArticle:', error);
        return false;
    }
}

/**
 * Remove a tag from an article
 */
export async function removeTagFromArticle(articleId: string, tagId: string): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('article_tags')
        .delete()
        .eq('article_id', articleId)
        .eq('tag_id', tagId);

    if (error) {
        console.error('Error removing tag from article:', error);
        return false;
    }

    revalidatePath(`/article/${articleId}`);
    return true;
}

/**
 * Get trending tags (most used)
 */
export async function getTrendingTags(limit: number = 10): Promise<TagWithCount[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tags')
        .select(`
            *,
            article_tags(count)
        `)
        .order('article_tags(count)', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching trending tags:', error);
        return [];
    }

    // Transform the data to include article_count
    return (data || []).map((tag: any) => ({
        ...tag,
        article_count: tag.article_tags?.[0]?.count || 0,
    }));
}

/**
 * Get articles by tag
 */
export async function getArticlesByTag(tagName: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('article_tags')
        .select(`
            article_id,
            articles(*)
        `)
        .eq('tags.name', tagName);

    if (error) {
        console.error('Error fetching articles by tag:', error);
        return [];
    }

    return data?.map((item: any) => item.articles).filter(Boolean) || [];
}
