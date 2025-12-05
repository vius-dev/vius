'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function toggleFollow(targetUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Check if already following
    const { data: existingFollow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

    if (existingFollow) {
        // Unfollow
        await supabase
            .from('follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', targetUserId);
    } else {
        // Follow
        await supabase
            .from('follows')
            .insert({
                follower_id: user.id,
                following_id: targetUserId,
            });
    }

    revalidatePath(`/profile/${targetUserId}`);
    revalidatePath(`/profile/${user.id}`);
}

export async function getFollowStatus(targetUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

    return !!data;
}

export async function getFollowCounts(userId: string) {
    const supabase = await createClient();

    const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

    const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

    return {
        followers: followersCount || 0,
        following: followingCount || 0,
    };
}

export async function getFollowers(userId: string) {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const { data } = await supabase
        .from('follows')
        .select('follower:follower_id(id, display_name, avatar_url, bio)')
        .eq('following_id', userId);

    if (!data) return [];

    const followers = data.map((f: any) => f.follower);

    // Check if current user follows them
    if (currentUser) {
        const { data: myFollows } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUser.id)
            .in('following_id', followers.map((f: any) => f.id));

        const myFollowsSet = new Set(myFollows?.map(f => f.following_id));
        return followers.map((f: any) => ({
            ...f,
            is_following: myFollowsSet.has(f.id)
        }));
    }

    return followers;
}

export async function getFollowing(userId: string) {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const { data } = await supabase
        .from('follows')
        .select('following:following_id(id, display_name, avatar_url, bio)')
        .eq('follower_id', userId);

    if (!data) return [];

    const following = data.map((f: any) => f.following);

    // Check if current user follows them
    if (currentUser) {
        const { data: myFollows } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUser.id)
            .in('following_id', following.map((f: any) => f.id));

        const myFollowsSet = new Set(myFollows?.map(f => f.following_id));
        return following.map((f: any) => ({
            ...f,
            is_following: myFollowsSet.has(f.id)
        }));
    }

    return following;
}

export async function getSuggestedUsers() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Simple suggestion: fetch random users who are not the current user
    // In a real app, this would be more complex (e.g., friends of friends)
    let query = supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio')
        .limit(5);

    if (user) {
        query = query.neq('id', user.id);

        // Exclude users already followed
        const { data: following } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id);

        if (following && following.length > 0) {
            const followingIds = following.map(f => f.following_id);
            query = query.not('id', 'in', `(${followingIds.join(',')})`);
        }
    }

    const { data } = await query;
    return data || [];
}

export interface ActivityItem {
    id: string;
    type: 'article' | 'comment' | 'bookmark';
    timestamp: string;
    data: any;
}

export async function getUserActivity(userId: string, limit: number = 20, offset: number = 0): Promise<ActivityItem[]> {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const isOwnProfile = currentUser?.id === userId;
    const activities: ActivityItem[] = [];

    // Fetch articles
    const { data: articles } = await supabase
        .from('articles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (articles) {
        articles.forEach(article => {
            activities.push({
                id: `article-${article.id}`,
                type: 'article',
                timestamp: article.created_at,
                data: article
            });
        });
    }

    // Fetch comments
    const { data: comments } = await supabase
        .from('comments')
        .select('*, articles(id, title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (comments) {
        comments.forEach(comment => {
            activities.push({
                id: `comment-${comment.id}`,
                type: 'comment',
                timestamp: comment.created_at,
                data: comment
            });
        });
    }

    // Fetch bookmarks (only for own profile)
    if (isOwnProfile) {
        const { data: bookmarks } = await supabase
            .from('bookmarks')
            .select('*, articles(id, title, section, created_at)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (bookmarks) {
            bookmarks.forEach(bookmark => {
                activities.push({
                    id: `bookmark-${bookmark.id}`,
                    type: 'bookmark',
                    timestamp: bookmark.created_at,
                    data: bookmark
                });
            });
        }
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    return activities.slice(offset, offset + limit);
}
