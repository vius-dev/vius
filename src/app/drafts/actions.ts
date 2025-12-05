'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

/**
 * Get all draft articles for the current user
 */
export async function getUserDrafts() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('user_id', user.id)
        .eq('published', false)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching drafts:', error);
        return [];
    }

    return data || [];
}

/**
 * Publish a draft article
 */
export async function publishArticle(articleId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return false;
    }

    const { error } = await supabase
        .from('articles')
        .update({ published: true, updated_at: new Date().toISOString() })
        .eq('id', articleId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error publishing article:', error);
        return false;
    }

    revalidatePath(`/article/${articleId}`);
    revalidatePath('/');
    return true;
}

/**
 * Unpublish an article (convert to draft)
 */
export async function unpublishArticle(articleId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return false;
    }

    const { error } = await supabase
        .from('articles')
        .update({ published: false, updated_at: new Date().toISOString() })
        .eq('id', articleId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error unpublishing article:', error);
        return false;
    }

    revalidatePath(`/article/${articleId}`);
    revalidatePath('/');
    return true;
}

/**
 * Schedule an article for future publishing
 */
export async function scheduleArticle(articleId: string, publishAt: Date): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return false;
    }

    const { error } = await supabase
        .from('articles')
        .update({
            scheduled_publish_at: publishAt.toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', articleId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error scheduling article:', error);
        return false;
    }

    revalidatePath(`/article/${articleId}`);
    return true;
}
