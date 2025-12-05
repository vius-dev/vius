'use server';

import { createClient } from '@/lib/supabase-server';

export async function getFollowingArticles() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Get list of users being followed
    const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

    if (!following || following.length === 0) return [];

    const followingIds = following.map(f => f.following_id);

    // Fetch articles from these users
    const { data: articles } = await supabase
        .from('articles')
        .select(`
            *,
            profiles:user_id(display_name, avatar_url),
            likes_count,
            dislikes_count
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(50);

    return articles || [];
}
