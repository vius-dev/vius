'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function createCollection(title: string, description?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
        .from('collections')
        .insert({
            title,
            description,
            user_id: user.id
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating collection:', error);
        throw new Error('Failed to create collection');
    }

    revalidatePath('/collections');
    return data;
}

export async function addToCollection(collectionId: string, articleId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // Verify ownership
    const { data: collection } = await supabase
        .from('collections')
        .select('user_id')
        .eq('id', collectionId)
        .single();

    if (!collection || collection.user_id !== user.id) {
        throw new Error('Unauthorized');
    }

    const { error } = await supabase
        .from('collection_items')
        .insert({
            collection_id: collectionId,
            article_id: articleId
        });

    if (error) {
        if (error.code === '23505') { // Unique violation
            return { success: false, message: 'Article already in collection' };
        }
        console.error('Error adding to collection:', error);
        throw new Error('Failed to add to collection');
    }

    revalidatePath(`/collections/${collectionId}`);
    return { success: true };
}

export async function getCollections() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('collections')
        .select('*, collection_items(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching collections:', error);
        return [];
    }

    return data;
}

export async function getCollectionItems(collectionId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('collection_items')
        .select(`
      *,
      articles (
        id,
        title,
        image_url,
        created_at,
        reading_time,
        profiles (display_name, avatar_url)
      )
    `)
        .eq('collection_id', collectionId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching collection items:', error);
        return [];
    }

    return data;
}
